use rusqlite::{params, Connection, OptionalExtension};
use serde::Serialize;
use std::{path::Path, time::Duration};

const SCHEMA_VERSION: i64 = 1;

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct ProjectState {
    pub schema_version: i64,
    pub project_id: String,
    pub created_at: String,
    pub updated_at: String,
    pub revision: i64,
    pub mode: String,
    pub current_area: String,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct Checkpoint {
    pub id: i64,
    pub at: String,
    pub reason: String,
}

fn db_error(error: rusqlite::Error) -> String {
    format!("Datenbankfehler: {error}")
}

fn open(path: &Path) -> Result<Connection, String> {
    let connection = Connection::open(path).map_err(db_error)?;
    connection
        .busy_timeout(Duration::from_secs(5))
        .map_err(db_error)?;
    connection
        .pragma_update(None, "foreign_keys", "ON")
        .map_err(db_error)?;
    Ok(connection)
}

pub fn init(path: &Path) -> Result<(), String> {
    let connection = open(path)?;
    connection
        .pragma_update(None, "journal_mode", "WAL")
        .map_err(db_error)?;
    connection
        .execute_batch(
            "
            CREATE TABLE IF NOT EXISTS project_state (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                schema_version INTEGER NOT NULL,
                project_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                revision INTEGER NOT NULL CHECK (revision >= 1),
                mode TEXT NOT NULL CHECK (mode IN ('EINFACH','GEFUEHRT','PROFI')),
                current_area TEXT NOT NULL CHECK (current_area IN ('HEUTE','PROJEKT','BAUEN','PRUEFEN','ABSICHERN','LERNEN','RELEASE','ROENTGEN'))
            );

            CREATE TABLE IF NOT EXISTS checkpoints (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                at TEXT NOT NULL,
                reason TEXT NOT NULL
            );
            ",
        )
        .map_err(db_error)
}

fn query_state(connection: &Connection) -> Result<Option<ProjectState>, String> {
    connection
        .query_row(
            "SELECT schema_version, project_id, created_at, updated_at, revision, mode, current_area
             FROM project_state WHERE id = 1",
            [],
            |row| {
                Ok(ProjectState {
                    schema_version: row.get(0)?,
                    project_id: row.get(1)?,
                    created_at: row.get(2)?,
                    updated_at: row.get(3)?,
                    revision: row.get(4)?,
                    mode: row.get(5)?,
                    current_area: row.get(6)?,
                })
            },
        )
        .optional()
        .map_err(db_error)
}

pub fn load_or_create_project_state(path: &Path, project_id: &str) -> Result<ProjectState, String> {
    let connection = open(path)?;
    if let Some(state) = query_state(&connection)? {
        return Ok(state);
    }

    // INSERT OR IGNORE macht den Erststart auch bei nahezu gleichzeitigem Zugriff sicher.
    connection
        .execute(
            "INSERT OR IGNORE INTO project_state
             (id, schema_version, project_id, created_at, updated_at, revision, mode, current_area)
             VALUES (1, ?1, ?2, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'), 1, 'EINFACH', 'HEUTE')",
            params![SCHEMA_VERSION, project_id],
        )
        .map_err(db_error)?;

    query_state(&connection)?.ok_or_else(|| "Projektzustand konnte nicht angelegt werden.".to_string())
}

pub fn create_checkpoint(path: &Path, reason: &str) -> Result<Checkpoint, String> {
    let reason = reason.trim();
    if reason.is_empty() || reason.len() > 120 {
        return Err("Grund für den Zwischenstand ist ungültig.".to_string());
    }

    let connection = open(path)?;
    connection
        .execute(
            "INSERT INTO checkpoints (at, reason) VALUES (strftime('%Y-%m-%dT%H:%M:%fZ','now'), ?1)",
            params![reason],
        )
        .map_err(db_error)?;
    let id = connection.last_insert_rowid();

    connection
        .query_row(
            "SELECT id, at, reason FROM checkpoints WHERE id = ?1",
            params![id],
            |row| {
                Ok(Checkpoint {
                    id: row.get(0)?,
                    at: row.get(1)?,
                    reason: row.get(2)?,
                })
            },
        )
        .map_err(db_error)
}

pub fn health(path: &Path) -> Result<(), String> {
    let connection = open(path)?;
    let value: i64 = connection
        .query_row("SELECT 1", [], |row| row.get(0))
        .map_err(db_error)?;
    if value == 1 {
        Ok(())
    } else {
        Err("Datenbankprüfung lieferte ein unerwartetes Ergebnis.".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{fs, time::{SystemTime, UNIX_EPOCH}};

    fn test_path(name: &str) -> std::path::PathBuf {
        let stamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("Uhrzeit")
            .as_nanos();
        std::env::temp_dir().join(format!("provoware-{name}-{stamp}.sqlite3"))
    }

    fn cleanup(path: &Path) {
        let _ = fs::remove_file(path);
        let _ = fs::remove_file(format!("{}-wal", path.display()));
        let _ = fs::remove_file(format!("{}-shm", path.display()));
    }

    #[test]
    fn project_state_is_created_once_and_stays_stable() {
        let path = test_path("state");
        init(&path).expect("Schema anlegen");

        let first = load_or_create_project_state(&path, "projekt-test-1234").expect("Erstzustand");
        let second = load_or_create_project_state(&path, "anderer-wert").expect("Zweitlesen");

        assert_eq!(first, second);
        assert_eq!(first.schema_version, 1);
        assert_eq!(first.revision, 1);
        assert_eq!(first.mode, "EINFACH");
        assert_eq!(first.current_area, "HEUTE");
        cleanup(&path);
    }

    #[test]
    fn checkpoint_is_append_only() {
        let path = test_path("checkpoint");
        init(&path).expect("Schema anlegen");

        let first = create_checkpoint(&path, "TEST_EINS").expect("Zwischenstand 1");
        let second = create_checkpoint(&path, "TEST_ZWEI").expect("Zwischenstand 2");

        assert!(second.id > first.id);
        assert_eq!(first.reason, "TEST_EINS");
        assert_eq!(second.reason, "TEST_ZWEI");
        cleanup(&path);
    }
}
