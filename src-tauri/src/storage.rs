use rusqlite::{params, Connection, OptionalExtension};
use serde::Serialize;
use std::{collections::BTreeMap, path::Path, time::Duration};

const SCHEMA_VERSION: i64 = 1;
const WORKSPACE_SECTION_IDS: [&str; 4] = ["today", "system-status", "storage", "tools"];

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

pub type WorkspaceVisibility = BTreeMap<String, bool>;

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

            CREATE TABLE IF NOT EXISTS workspace_visibility (
                section_id TEXT PRIMARY KEY CHECK (section_id IN ('today','system-status','storage','tools')),
                visible INTEGER NOT NULL CHECK (visible IN (0,1))
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

    query_state(&connection)?
        .ok_or_else(|| "Projektzustand konnte nicht angelegt werden.".to_string())
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

fn default_workspace_visibility() -> WorkspaceVisibility {
    WORKSPACE_SECTION_IDS
        .into_iter()
        .map(|section_id| (section_id.to_string(), true))
        .collect()
}

fn validate_workspace_section(section_id: &str) -> Result<(), String> {
    if WORKSPACE_SECTION_IDS.contains(&section_id) {
        Ok(())
    } else {
        Err("Unbekannter Arbeitsbereich. Die Ansicht wurde nicht gespeichert.".to_string())
    }
}

pub fn load_workspace_visibility(path: &Path) -> Result<WorkspaceVisibility, String> {
    let connection = open(path)?;
    let mut visibility = default_workspace_visibility();
    let mut statement = connection
        .prepare("SELECT section_id, visible FROM workspace_visibility")
        .map_err(db_error)?;
    let rows = statement
        .query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, bool>(1)?))
        })
        .map_err(db_error)?;

    for row in rows {
        let (section_id, visible) = row.map_err(db_error)?;
        validate_workspace_section(&section_id)?;
        visibility.insert(section_id, visible);
    }
    Ok(visibility)
}

pub fn set_workspace_visibility(
    path: &Path,
    section_id: &str,
    visible: bool,
) -> Result<WorkspaceVisibility, String> {
    validate_workspace_section(section_id)?;
    let mut connection = open(path)?;
    let transaction = connection.transaction().map_err(db_error)?;
    transaction
        .execute(
            "INSERT INTO workspace_visibility (section_id, visible) VALUES (?1, ?2)
             ON CONFLICT(section_id) DO UPDATE SET visible = excluded.visible",
            params![section_id, visible],
        )
        .map_err(db_error)?;
    transaction.commit().map_err(db_error)?;
    load_workspace_visibility(path)
}

pub fn reset_workspace_visibility(path: &Path) -> Result<WorkspaceVisibility, String> {
    let mut connection = open(path)?;
    let transaction = connection.transaction().map_err(db_error)?;
    for section_id in WORKSPACE_SECTION_IDS {
        transaction
            .execute(
                "INSERT INTO workspace_visibility (section_id, visible) VALUES (?1, 1)
                 ON CONFLICT(section_id) DO UPDATE SET visible = 1",
                params![section_id],
            )
            .map_err(db_error)?;
    }
    transaction.commit().map_err(db_error)?;
    Ok(default_workspace_visibility())
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
    use std::{
        fs,
        time::{SystemTime, UNIX_EPOCH},
    };

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

    #[test]
    fn workspace_visibility_defaults_persist_and_stay_idempotent() {
        let path = test_path("workspace-visibility");
        init(&path).expect("Schema anlegen");
        let project_before =
            load_or_create_project_state(&path, "projekt-workspace").expect("Projektzustand");

        let defaults = load_workspace_visibility(&path).expect("Standardansicht lesen");
        assert!(WORKSPACE_SECTION_IDS
            .iter()
            .all(|section_id| defaults.get(*section_id) == Some(&true)));

        let hidden = set_workspace_visibility(&path, "storage", false).expect("Speichern");
        assert_eq!(hidden.get("storage"), Some(&false));
        let again =
            set_workspace_visibility(&path, "storage", false).expect("Idempotent speichern");
        assert_eq!(again, hidden);
        let reopened = load_workspace_visibility(&path).expect("Erneut lesen");
        assert_eq!(reopened.get("storage"), Some(&false));

        let project_after =
            load_or_create_project_state(&path, "anderer-wert").expect("Projekt erneut lesen");
        assert_eq!(project_before, project_after);
        cleanup(&path);
    }

    #[test]
    fn workspace_visibility_rejects_unknown_and_reset_restores_defaults() {
        let path = test_path("workspace-reset");
        init(&path).expect("Schema anlegen");
        set_workspace_visibility(&path, "tools", false).expect("Werkzeug-Zentrale ausblenden");

        let error = set_workspace_visibility(&path, "nicht-bekannt", false)
            .expect_err("Unbekannter Bereich muss abgelehnt werden");
        assert!(error.contains("Unbekannter Arbeitsbereich"));

        let reset = reset_workspace_visibility(&path).expect("Ansicht zurücksetzen");
        assert!(WORKSPACE_SECTION_IDS
            .iter()
            .all(|section_id| reset.get(*section_id) == Some(&true)));
        assert_eq!(
            load_workspace_visibility(&path).expect("Reset erneut lesen"),
            reset
        );
        cleanup(&path);
    }
}
