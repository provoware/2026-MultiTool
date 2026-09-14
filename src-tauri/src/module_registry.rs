use serde::Serialize;
use std::collections::HashSet;

#[derive(Clone, Copy, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ToolState {
    Ready,
    Hidden,
    Disabled,
    PermissionMissing,
}

impl ToolState {
    fn text(self) -> &'static str {
        match self {
            Self::Ready => "Bereit",
            Self::Hidden => "Ausgeblendet",
            Self::Disabled => "Ausgeschaltet",
            Self::PermissionMissing => "Berechtigung fehlt",
        }
    }
}

#[derive(Serialize)]
pub struct ToolInfo {
    id: &'static str,
    name: &'static str,
    description: &'static str,
    state: ToolState,
    state_text: &'static str,
    read_only: bool,
}

fn tool(
    id: &'static str,
    name: &'static str,
    description: &'static str,
    state: ToolState,
    read_only: bool,
) -> ToolInfo {
    ToolInfo {
        id,
        name,
        description,
        state,
        state_text: state.text(),
        read_only,
    }
}

pub fn list_tools() -> Vec<ToolInfo> {
    vec![
        tool(
            "foundation",
            "Grundlage",
            "Sorgt für Start, Speichern, Zwischenstände und sicheres Beenden.",
            ToolState::Ready,
            true,
        ),
        tool(
            "tool_center",
            "Werkzeug-Zentrale",
            "Zeigt die vorhandenen Werkzeuge und ihren Zustand an.",
            ToolState::Ready,
            true,
        ),
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tool_ids_are_unique_and_non_empty() {
        let tools = list_tools();
        let mut ids = HashSet::new();
        for tool in &tools {
            assert!(!tool.id.trim().is_empty());
            assert!(ids.insert(tool.id), "Werkzeugkennung doppelt: {}", tool.id);
        }
    }

    #[test]
    fn first_p0_slice_is_read_only() {
        for tool in list_tools() {
            assert!(tool.read_only, "P0.1 darf noch keine Schreibfunktion freigeben");
        }
    }
}
