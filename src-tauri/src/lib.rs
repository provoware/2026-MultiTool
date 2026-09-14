mod storage;

use serde::Serialize;
use std::{
    path::PathBuf,
    thread,
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Manager, State};

#[derive(Clone)]
struct RuntimeState {
    database_path: PathBuf,
    session: String,
    default_project_id: String,
}

#[derive(Serialize)]
struct RuntimeStatus {
    status: &'static str,
    session: String,
    local_only: bool,
    storage: &'static str,
}

fn now_millis() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
}

#[tauri::command]
fn get_status(state: State<'_, RuntimeState>) -> Result<RuntimeStatus, String> {
    storage::health(&state.database_path)?;
    Ok(RuntimeStatus {
        status: "ready",
        session: state.session.clone(),
        local_only: true,
        storage: "sqlite",
    })
}

#[tauri::command]
fn load_or_create_project_state(
    state: State<'_, RuntimeState>,
) -> Result<storage::ProjectState, String> {
    storage::load_or_create_project_state(&state.database_path, &state.default_project_id)
}

#[tauri::command]
fn create_checkpoint(
    state: State<'_, RuntimeState>,
    reason: Option<String>,
) -> Result<storage::Checkpoint, String> {
    storage::create_checkpoint(
        &state.database_path,
        reason.as_deref().unwrap_or("NUTZER_ZWISCHENSTAND"),
    )
}

#[tauri::command]
fn request_shutdown(
    app: AppHandle,
    state: State<'_, RuntimeState>,
) -> Result<storage::Checkpoint, String> {
    // Erst den Zwischenstand bestätigen, dann das Programm beenden. So geht die letzte Aktion
    // nicht verloren, selbst wenn die Oberfläche unmittelbar danach geschlossen wird.
    let checkpoint = storage::create_checkpoint(&state.database_path, "NUTZER_BEENDEN")?;
    let handle = app.clone();
    thread::spawn(move || {
        thread::sleep(Duration::from_millis(180));
        handle.exit(0);
    });
    Ok(checkpoint)
}

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&data_dir)?;
            let database_path = data_dir.join("multitool.sqlite3");
            storage::init(&database_path).map_err(std::io::Error::other)?;

            let stamp = now_millis();
            app.manage(RuntimeState {
                database_path,
                session: format!("sitzung-{stamp}-{}", std::process::id()),
                default_project_id: format!("projekt-{stamp}-{}", std::process::id()),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_status,
            load_or_create_project_state,
            create_checkpoint,
            request_shutdown
        ])
        .run(tauri::generate_context!())
        .expect("PROVOWARE MultiTool konnte nicht gestartet werden");
}
