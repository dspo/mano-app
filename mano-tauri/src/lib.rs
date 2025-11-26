use tauri::menu::{AboutMetadata, MenuBuilder, MenuEvent, MenuItemBuilder};
use tauri::{menu::SubmenuBuilder, App, AppHandle, Emitter};
use tauri_plugin_dialog::DialogExt;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .setup(|app: &mut App| {
            // my custom settings menu item
            let settings = MenuItemBuilder::new("Settings...")
                .id("settings")
                .accelerator("CmdOrCtrl+,")
                .build(app)?;

            // my custom app submenu
            let app_submenu = SubmenuBuilder::new(app, "App")
                .about(Some(AboutMetadata {
                    ..Default::default()
                }))
                .separator()
                .item(&settings)
                .separator()
                .separator()
                .hide()
                .hide_others()
                .quit()
                .build()?;

            // ... any other submenus

            let file_submenu = SubmenuBuilder::new(app, "File")
                .item(&MenuItemBuilder::new("Open").id("open").build(app)?)
                .build()?;

            let menu = MenuBuilder::new(app)
                .items(&[
                    &app_submenu,
                    &file_submenu,
                    // ... include references to any other submenus
                ])
                .build()?;

            // set the menu
            app.set_menu(menu)?;

            app.on_menu_event(|app: &AppHandle, event: MenuEvent| {
                match event.id().0.as_str() {
                    "open" => {
                        let app_clone = app.clone();
                        app.dialog().file().set_title("Open Workspace").pick_folder(
                            move |filepath| {
                                if let Some(filepath) = filepath {
                                    let payload = serde_json::json!({"workspace": filepath});
                                    println!("emit: {}", payload);
                                    if let Err(e) = app_clone.emit("workspace_updated", payload) {
                                        eprintln!("Failed to emit WorkspaceUpdated event: {}", e);
                                    }
                                }
                            },
                        );
                    }
                    _ => {}
                };
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
