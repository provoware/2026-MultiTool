use rusqlite::{params, Connection, ErrorCode};
use serde::{Deserialize, Serialize};
use std::{path::Path, time::Duration};

#[derive(Debug, Clone, Deserialize)]
pub struct SongInput {
    pub id: Option<i64>,
    pub file_name: String,
    pub title: String,
    pub alternate_title_enabled: bool,
    pub alternate_title: String,
    pub lyrics: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct Song {
    pub id: i64,
    pub file_name: String,
    pub title: String,
    pub alternate_title_enabled: bool,
    pub alternate_title: String,
    pub lyrics: String,
    pub updated_at: String,
}

fn database_error(error: rusqlite::Error) -> String {
    format!("Songtext-Datenbankfehler: {error}")
}

fn write_error(error: rusqlite::Error) -> String {
    if let rusqlite::Error::SqliteFailure(details, _) = &error {
        if details.code == ErrorCode::ConstraintViolation {
            return "Dieser Dateiname ist bereits vergeben. Bitte einen anderen wählen.".to_string();
        }
    }
    database_error(error)
}

fn open(path: &Path) -> Result<Connection, String> {
    let connection = Connection::open(path).map_err(database_error)?;
    connection
        .busy_timeout(Duration::from_secs(5))
        .map_err(database_error)?;
    Ok(connection)
}

pub fn init(path: &Path) -> Result<(), String> {
    open(path)?
        .execute_batch(
            "CREATE TABLE IF NOT EXISTS songtexts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_name TEXT NOT NULL UNIQUE COLLATE NOCASE,
                title TEXT NOT NULL,
                alternate_title_enabled INTEGER NOT NULL DEFAULT 0 CHECK (alternate_title_enabled IN (0, 1)),
                alternate_title TEXT NOT NULL DEFAULT '',
                lyrics TEXT NOT NULL DEFAULT '',
                updated_at TEXT NOT NULL
            );",
        )
        .map_err(database_error)
}

fn validate(input: &SongInput) -> Result<(String, String, String), String> {
    let mut name = input.file_name.trim();
    if name.to_ascii_lowercase().ends_with(".txt") {
        name = &name[..name.len() - 4];
    }
    if name.is_empty()
        || name == "."
        || name == ".."
        || name.starts_with('.')
        || name.ends_with('.')
        || name.chars().count() > 120
        || name.chars().any(|c| c.is_control() || "/\\<>:\"|?*".contains(c))
    {
        return Err("Dateiname ungültig: 1–120 Zeichen ohne Pfad- oder Sonderzeichen.".to_string());
    }
    let title = input.title.trim();
    let alternative = input.alternate_title.trim();
    if title.is_empty() || title.chars().count() > 200 {
        return Err("Der Songtitel muss 1–200 Zeichen enthalten.".to_string());
    }
    if alternative.chars().count() > 200 {
        return Err("Der alternative Titel darf höchstens 200 Zeichen enthalten.".to_string());
    }
    if input.alternate_title_enabled && alternative.is_empty() {
        return Err("Bitte den Veröffentlichungstitel eingeben oder die Option ausschalten.".to_string());
    }
    if input.lyrics.len() > 2_000_000 {
        return Err("Der Songtext ist zu groß (maximal 2 MB).".to_string());
    }
    if input.id.is_some_and(|id| id <= 0) {
        return Err("Ungültige Songkennung.".to_string());
    }
    Ok((name.to_string(), title.to_string(), alternative.to_string()))
}

fn decode(row: &rusqlite::Row<'_>) -> rusqlite::Result<Song> {
    Ok(Song {
        id: row.get(0)?,
        file_name: row.get(1)?,
        title: row.get(2)?,
        alternate_title_enabled: row.get(3)?,
        alternate_title: row.get(4)?,
        lyrics: row.get(5)?,
        updated_at: row.get(6)?,
    })
}

pub fn list(path: &Path) -> Result<Vec<Song>, String> {
    let connection = open(path)?;
    let mut statement = connection
        .prepare(
            "SELECT id, file_name, title, alternate_title_enabled, alternate_title, lyrics, updated_at
             FROM songtexts ORDER BY updated_at DESC, id DESC",
        )
        .map_err(database_error)?;
    let rows = statement.query_map([], decode).map_err(database_error)?;
    rows.collect::<rusqlite::Result<Vec<_>>>()
        .map_err(database_error)
}

pub fn save(path: &Path, input: SongInput) -> Result<Song, String> {
    let (name, title, alternative) = validate(&input)?;
    let connection = open(path)?;
    let id = if let Some(id) = input.id {
        let changed = connection
            .execute(
                "UPDATE songtexts
                 SET file_name = ?1, title = ?2, alternate_title_enabled = ?3,
                     alternate_title = ?4, lyrics = ?5,
                     updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
                 WHERE id = ?6",
                params![name, title, input.alternate_title_enabled, alternative, input.lyrics, id],
            )
            .map_err(write_error)?;
        if changed == 0 {
            return Err("Der Song wurde nicht gefunden. Nichts wurde überschrieben.".to_string());
        }
        id
    } else {
        connection
            .execute(
                "INSERT INTO songtexts
                 (file_name, title, alternate_title_enabled, alternate_title, lyrics, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))",
                params![name, title, input.alternate_title_enabled, alternative, input.lyrics],
            )
            .map_err(write_error)?;
        connection.last_insert_rowid()
    };
    connection
        .query_row(
            "SELECT id, file_name, title, alternate_title_enabled, alternate_title, lyrics, updated_at
             FROM songtexts WHERE id = ?1",
            params![id],
            decode,
        )
        .map_err(database_error)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{
        fs,
        time::{SystemTime, UNIX_EPOCH},
    };

    fn temp_db() -> std::path::PathBuf {
        let stamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("Uhrzeit")
            .as_nanos();
        std::env::temp_dir().join(format!("provoware-song-{stamp}.sqlite3"))
    }

    fn draft() -> SongInput {
        SongInput {
            id: None,
            file_name: "demo_arbeitsdatei".into(),
            title: "Interner Titel".into(),
            alternate_title_enabled: true,
            alternate_title: "Öffentlicher Titel".into(),
            lyrics: "[VERSE]\nSongtext".into(),
        }
    }

    #[test]
    fn alternative_is_independent_and_can_be_switched_off() {
        let path = temp_db();
        init(&path).expect("Schema");
        let created = save(&path, draft()).expect("Anlegen");
        let mut changed = draft();
        changed.id = Some(created.id);
        changed.alternate_title_enabled = false;
        let updated = save(&path, changed).expect("Ändern");
        assert_eq!(updated.file_name, "demo_arbeitsdatei");
        assert_eq!(updated.alternate_title, "Öffentlicher Titel");
        assert!(!updated.alternate_title_enabled);
        assert_eq!(list(&path).expect("Lesen").len(), 1);
        let _ = fs::remove_file(path);
    }

    #[test]
    fn duplicate_and_unsafe_file_names_are_blocked() {
        let path = temp_db();
        init(&path).expect("Schema");
        save(&path, draft()).expect("Anlegen");
        assert!(save(&path, draft()).unwrap_err().contains("bereits vergeben"));
        let mut bad = draft();
        bad.file_name = "../heimlich".into();
        assert!(save(&path, bad).is_err());
        let _ = fs::remove_file(path);
    }

    #[test]
    fn alternative_can_be_empty_when_disabled() {
        let path = temp_db();
        init(&path).expect("Schema");
        let mut song = draft();
        song.alternate_title_enabled = false;
        song.alternate_title.clear();
        song.file_name = "arbeitsdatei.TXT".into();
        let stored = save(&path, song).expect("Anlegen ohne Alternativtitel");
        assert_eq!(stored.file_name, "arbeitsdatei");
        assert_eq!(stored.title, "Interner Titel");
        let _ = fs::remove_file(path);
    }
}
