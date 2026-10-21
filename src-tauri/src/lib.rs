use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;
use uuid::Uuid;
use chrono::Utc;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Note {
    pub id: String,
    pub title: String,
    pub content: String,
    pub color: String,
    pub pinned: bool,
    pub created_at: String,
    pub updated_at: String,
    pub pin_x: f64,
    pub pin_y: f64,
    pub workspace: String,
    pub font: String,
    pub archived: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PomodoroTask {
    pub id: String,
    pub name: String,
    pub cycles_per_session: u32,
    pub focus_minutes: u32,
    pub break_minutes: u32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Settings {
    pub dock_position: String,
    pub pill_order_mode: String,
    pub active_workspace: String,
    pub workspaces: Vec<String>,
    pub labels: Vec<String>,
    pub sync_folder: Option<String>,
    pub theme: String,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            dock_position: "right-top".into(),
            pill_order_mode: "recency".into(),
            active_workspace: "Default".into(),
            workspaces: vec!["Default".into(), "Work".into(), "Personal".into(), "Ideas".into()],
            labels: vec!["Urgent".into(), "Project".into(), "Reading".into(), "Follow-up".into()],
            sync_folder: None,
            theme: "light".into(),
        }
    }
}

pub struct AppState {
    pub notes_dir: Mutex<PathBuf>,
}

fn get_default_notes_dir() -> PathBuf {
    if let Some(mut dir) = dirs::data_local_dir() {
        dir.push("Stashy");
        dir.push("notes");
        let _ = fs::create_dir_all(&dir);
        let pomo = dir.join("pomodoro");
        let _ = fs::create_dir_all(&pomo);
        return dir;
    }
    PathBuf::from("./stashy_notes")
}

fn parse_markdown_note(file_content: &str, file_name_id: &str) -> Option<Note> {
    if !file_content.starts_with("---") {
        return None;
    }

    let parts: Vec<&str> = file_content.splitn(3, "---").collect();
    if parts.len() < 3 {
        return None;
    }

    let header_lines = parts[1].lines();
    let body = parts[2].trim_start_matches(|c| c == '\r' || c == '\n');

    let mut id = file_name_id.to_string();
    let mut color = "yellow".to_string();
    let mut pinned = false;
    let mut created_at = Utc::now().to_rfc3339();
    let mut updated_at = Utc::now().to_rfc3339();
    let mut pin_x = 100.0;
    let mut pin_y = 100.0;
    let mut workspace = "Default".to_string();
    let mut font = "Handwritten".to_string();
    let mut archived = false;

    for line in header_lines {
        let trimmed = line.trim();
        if let Some((k, v)) = trimmed.split_once(':') {
            let key = k.trim();
            let val = v.trim();
            match key {
                "id" => id = val.to_string(),
                "color" => color = val.to_string(),
                "pinned" => pinned = val.eq_ignore_ascii_case("true"),
                "created_at" => created_at = val.to_string(),
                "updated_at" => updated_at = val.to_string(),
                "pin_x" => pin_x = val.parse::<f64>().unwrap_or(100.0),
                "pin_y" => pin_y = val.parse::<f64>().unwrap_or(100.0),
                "workspace" => workspace = val.to_string(),
                "font" => font = val.to_string(),
                "archived" => archived = val.eq_ignore_ascii_case("true"),
                _ => {}
            }
        }
    }

    // Parse title from first line if starts with #
    let mut title = String::new();
    let mut content = body.to_string();

    if body.starts_with("# ") {
        if let Some((first_line, rest)) = body.split_once('\n') {
            title = first_line.trim_start_matches("# ").trim().to_string();
            content = rest.trim_start().to_string();
        } else {
            title = body.trim_start_matches("# ").trim().to_string();
            content = String::new();
        }
    }

    if title.is_empty() {
        title = content.lines().next().unwrap_or("Untitled Note").to_string();
        if title.is_empty() {
            title = "Untitled Note".to_string();
        }
    }

    Some(Note {
        id,
        title,
        content,
        color,
        pinned,
        created_at,
        updated_at,
        pin_x,
        pin_y,
        workspace,
        font,
        archived,
    })
}

fn serialize_markdown_note(note: &Note) -> String {
    format!(
        "---\nid: {}\ncolor: {}\npinned: {}\ncreated_at: {}\nupdated_at: {}\npin_x: {}\npin_y: {}\nworkspace: {}\nfont: {}\narchived: {}\n---\n\n# {}\n\n{}",
        note.id,
        note.color,
        note.pinned,
        note.created_at,
        note.updated_at,
        note.pin_x,
        note.pin_y,
        note.workspace,
        note.font,
        note.archived,
        note.title,
        note.content
    )
}

fn parse_markdown_pomodoro(file_content: &str, file_name_id: &str) -> Option<PomodoroTask> {
    if !file_content.starts_with("---") {
        return None;
    }

    let parts: Vec<&str> = file_content.splitn(3, "---").collect();
    if parts.len() < 3 {
        return None;
    }

    let header_lines = parts[1].lines();
    let mut id = file_name_id.to_string();
    let mut name = "Focus Session".to_string();
    let mut cycles_per_session = 4;
    let mut focus_minutes = 25;
    let mut break_minutes = 5;
    let mut created_at = Utc::now().to_rfc3339();
    let mut updated_at = Utc::now().to_rfc3339();

    for line in header_lines {
        let trimmed = line.trim();
        if let Some((k, v)) = trimmed.split_once(':') {
            let key = k.trim();
            let val = v.trim();
            match key {
                "id" => id = val.to_string(),
                "name" => name = val.to_string(),
                "cycles_per_session" => cycles_per_session = val.parse().unwrap_or(4),
                "focus_minutes" => focus_minutes = val.parse().unwrap_or(25),
                "break_minutes" => break_minutes = val.parse().unwrap_or(5),
                "created_at" => created_at = val.to_string(),
                "updated_at" => updated_at = val.to_string(),
                _ => {}
            }
        }
    }

    Some(PomodoroTask {
        id,
        name,
        cycles_per_session,
        focus_minutes,
        break_minutes,
        created_at,
        updated_at,
    })
}

fn serialize_markdown_pomodoro(task: &PomodoroTask) -> String {
    format!(
        "---\nid: {}\nname: {}\ncycles_per_session: {}\nfocus_minutes: {}\nbreak_minutes: {}\ncreated_at: {}\nupdated_at: {}\n---\n\n# {}\n",
        task.id,
        task.name,
        task.cycles_per_session,
        task.focus_minutes,
        task.break_minutes,
        task.created_at,
        task.updated_at,
        task.name
    )
}

// ----------------- Tauri Commands -----------------

#[tauri::command]
fn list_notes(state: State<AppState>) -> Result<Vec<Note>, String> {
    let dir = state.notes_dir.lock().map_err(|e| e.to_string())?.clone();
    let mut notes = Vec::new();

    if let Ok(entries) = fs::read_dir(&dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("md") {
                if let Ok(content) = fs::read_to_string(&path) {
                    let file_stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("note");
                    if let Some(note) = parse_markdown_note(&content, file_stem) {
                        notes.push(note);
                    }
                }
            }
        }
    }

    // Default note creation if folder is empty
    if notes.is_empty() {
        let welcome_note = Note {
            id: Uuid::new_v4().to_string(),
            title: "Welcome to Stashy! ✨".into(),
            content: "Notes that live on the edge of your screen.\n\n- Hover edge to reveal pills\n- Click '+' to stash a thought\n- Pin notes to float them on desktop\n- Built with ultra-lightweight memory usage!".into(),
            color: "yellow".into(),
            pinned: false,
            created_at: Utc::now().to_rfc3339(),
            updated_at: Utc::now().to_rfc3339(),
            pin_x: 100.0,
            pin_y: 100.0,
            workspace: "Default".into(),
            font: "Handwritten".into(),
            archived: false,
        };
        let _ = save_note(welcome_note.clone(), state);
        notes.push(welcome_note);
    }

    notes.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(notes)
}

#[tauri::command]
fn save_note(mut note: Note, state: State<AppState>) -> Result<Note, String> {
    let dir = state.notes_dir.lock().map_err(|e| e.to_string())?.clone();
    if note.id.is_empty() {
        note.id = Uuid::new_v4().to_string();
        note.created_at = Utc::now().to_rfc3339();
    }
    note.updated_at = Utc::now().to_rfc3339();

    let path = dir.join(format!("{}.md", note.id));
    let text = serialize_markdown_note(&note);
    fs::write(path, text).map_err(|e| e.to_string())?;

    Ok(note)
}

#[tauri::command]
fn quick_add_note(title: String, content: String, color: Option<String>, workspace: Option<String>, state: State<AppState>) -> Result<Note, String> {
    let note = Note {
        id: Uuid::new_v4().to_string(),
        title,
        content,
        color: color.unwrap_or_else(|| "yellow".into()),
        pinned: false,
        created_at: Utc::now().to_rfc3339(),
        updated_at: Utc::now().to_rfc3339(),
        pin_x: 120.0,
        pin_y: 120.0,
        workspace: workspace.unwrap_or_else(|| "Default".into()),
        font: "Handwritten".into(),
        archived: false,
    };
    save_note(note, state)
}

#[tauri::command]
fn delete_note(id: String, state: State<AppState>) -> Result<(), String> {
    let dir = state.notes_dir.lock().map_err(|e| e.to_string())?.clone();
    let path = dir.join(format!("{}.md", id));
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn toggle_pin(id: String, state: State<AppState>) -> Result<bool, String> {
    let dir = state.notes_dir.lock().map_err(|e| e.to_string())?.clone();
    let path = dir.join(format!("{}.md", id));
    if path.exists() {
        let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        if let Some(mut note) = parse_markdown_note(&content, &id) {
            note.pinned = !note.pinned;
            note.updated_at = Utc::now().to_rfc3339();
            let new_text = serialize_markdown_note(&note);
            fs::write(path, new_text).map_err(|e| e.to_string())?;
            return Ok(note.pinned);
        }
    }
    Err("Note not found".into())
}

#[tauri::command]
fn set_note_archived(id: String, archived: bool, state: State<AppState>) -> Result<(), String> {
    let dir = state.notes_dir.lock().map_err(|e| e.to_string())?.clone();
    let path = dir.join(format!("{}.md", id));
    if path.exists() {
        let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        if let Some(mut note) = parse_markdown_note(&content, &id) {
            note.archived = archived;
            note.updated_at = Utc::now().to_rfc3339();
            let new_text = serialize_markdown_note(&note);
            fs::write(path, new_text).map_err(|e| e.to_string())?;
            return Ok(());
        }
    }
    Err("Note not found".into())
}

#[tauri::command]
fn get_settings(state: State<AppState>) -> Result<Settings, String> {
    let dir = state.notes_dir.lock().map_err(|e| e.to_string())?.clone();
    let path = dir.join("settings.json");
    if path.exists() {
        if let Ok(data) = fs::read_to_string(path) {
            if let Ok(settings) = serde_json::from_str::<Settings>(&data) {
                return Ok(settings);
            }
        }
    }
    Ok(Settings::default())
}

#[tauri::command]
fn save_settings(settings: Settings, state: State<AppState>) -> Result<(), String> {
    let dir = state.notes_dir.lock().map_err(|e| e.to_string())?.clone();
    let path = dir.join("settings.json");
    let json = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_dock_position(state: State<AppState>) -> Result<String, String> {
    let s = get_settings(state)?;
    Ok(s.dock_position)
}

#[tauri::command]
fn set_dock_position(pos: String, state: State<AppState>) -> Result<(), String> {
    let mut s = get_settings(state.clone())?;
    s.dock_position = pos;
    save_settings(s, state)
}

#[tauri::command]
fn get_pill_order_mode(state: State<AppState>) -> Result<String, String> {
    let s = get_settings(state)?;
    Ok(s.pill_order_mode)
}

#[tauri::command]
fn set_pill_order_mode(mode: String, state: State<AppState>) -> Result<(), String> {
    let mut s = get_settings(state.clone())?;
    s.pill_order_mode = mode;
    save_settings(s, state)
}

#[tauri::command]
fn get_workspaces(state: State<AppState>) -> Result<Vec<String>, String> {
    let s = get_settings(state)?;
    Ok(s.workspaces)
}

#[tauri::command]
fn set_active_workspace(name: String, state: State<AppState>) -> Result<(), String> {
    let mut s = get_settings(state.clone())?;
    s.active_workspace = name;
    save_settings(s, state)
}

#[tauri::command]
fn get_pomodoro_tasks(state: State<AppState>) -> Result<Vec<PomodoroTask>, String> {
    let dir = state.notes_dir.lock().map_err(|e| e.to_string())?.join("pomodoro");
    let _ = fs::create_dir_all(&dir);

    let mut tasks = Vec::new();
    if let Ok(entries) = fs::read_dir(&dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("md") {
                if let Ok(content) = fs::read_to_string(&path) {
                    let file_stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("task");
                    if let Some(task) = parse_markdown_pomodoro(&content, file_stem) {
                        tasks.push(task);
                    }
                }
            }
        }
    }

    if tasks.is_empty() {
        let sample = PomodoroTask {
            id: Uuid::new_v4().to_string(),
            name: "Deep Focus Session".into(),
            cycles_per_session: 4,
            focus_minutes: 25,
            break_minutes: 5,
            created_at: Utc::now().to_rfc3339(),
            updated_at: Utc::now().to_rfc3339(),
        };
        let _ = save_pomodoro_task(sample.clone(), state);
        tasks.push(sample);
    }

    tasks.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(tasks)
}

#[tauri::command]
fn save_pomodoro_task(mut task: PomodoroTask, state: State<AppState>) -> Result<PomodoroTask, String> {
    let dir = state.notes_dir.lock().map_err(|e| e.to_string())?.join("pomodoro");
    let _ = fs::create_dir_all(&dir);

    if task.id.is_empty() {
        task.id = Uuid::new_v4().to_string();
        task.created_at = Utc::now().to_rfc3339();
    }
    task.updated_at = Utc::now().to_rfc3339();

    let path = dir.join(format!("{}.md", task.id));
    let text = serialize_markdown_pomodoro(&task);
    fs::write(path, text).map_err(|e| e.to_string())?;

    Ok(task)
}

#[tauri::command]
fn delete_pomodoro_task(id: String, state: State<AppState>) -> Result<(), String> {
    let dir = state.notes_dir.lock().map_err(|e| e.to_string())?.join("pomodoro");
    let path = dir.join(format!("{}.md", id));
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn get_sync_dir(state: State<AppState>) -> Result<String, String> {
    let dir = state.notes_dir.lock().map_err(|e| e.to_string())?.clone();
    Ok(dir.to_string_lossy().to_string())
}

#[tauri::command]
fn choose_sync_folder(new_path: String, state: State<AppState>) -> Result<String, String> {
    let p = PathBuf::from(&new_path);
    if !p.exists() {
        fs::create_dir_all(&p).map_err(|e| e.to_string())?;
    }
    let pomo = p.join("pomodoro");
    let _ = fs::create_dir_all(&pomo);

    {
        let mut lock = state.notes_dir.lock().map_err(|e| e.to_string())?;
        *lock = p;
    }

    let mut s = get_settings(state.clone())?;
    s.sync_folder = Some(new_path.clone());
    let _ = save_settings(s, state);

    Ok(new_path)
}

#[tauri::command]
fn get_app_version() -> String {
    "0.1.0".to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let default_dir = get_default_notes_dir();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            notes_dir: Mutex::new(default_dir),
        })
        .invoke_handler(tauri::generate_handler![
            list_notes,
            save_note,
            quick_add_note,
            delete_note,
            toggle_pin,
            set_note_archived,
            get_settings,
            save_settings,
            get_dock_position,
            set_dock_position,
            get_pill_order_mode,
            set_pill_order_mode,
            get_workspaces,
            set_active_workspace,
            get_pomodoro_tasks,
            save_pomodoro_task,
            delete_pomodoro_task,
            get_sync_dir,
            choose_sync_folder,
            get_app_version
        ])
        .run(tauri::generate_context!())
        .expect("error while running Stashy application");
}
