use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri::{Emitter, Manager};

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let handle = app.handle();

            let add_project = MenuItemBuilder::with_id("add_project", "Add Project...")
                .accelerator("CmdOrCtrl+O")
                .build(handle)?;
            let export_pdf = MenuItemBuilder::with_id("export_pdf", "Export as PDF")
                .accelerator("CmdOrCtrl+Shift+E")
                .build(handle)?;
            let close_window = MenuItemBuilder::with_id("close_window", "Close Window")
                .accelerator("CmdOrCtrl+W")
                .build(handle)?;

            let file_menu = SubmenuBuilder::new(handle, "File")
                .item(&add_project)
                .item(&export_pdf)
                .separator()
                .item(&close_window)
                .build()?;

            let quick_open = MenuItemBuilder::with_id("quick_open", "Quick Open")
                .accelerator("CmdOrCtrl+P")
                .build(handle)?;
            let toggle_sidebar = MenuItemBuilder::with_id("toggle_sidebar", "Toggle Sidebar")
                .accelerator("CmdOrCtrl+\\")
                .build(handle)?;
            let zoom_in = MenuItemBuilder::with_id("zoom_in", "Zoom In")
                .accelerator("CmdOrCtrl+=")
                .build(handle)?;
            let zoom_out = MenuItemBuilder::with_id("zoom_out", "Zoom Out")
                .accelerator("CmdOrCtrl+-")
                .build(handle)?;
            let zoom_reset = MenuItemBuilder::with_id("zoom_reset", "Actual Size")
                .accelerator("CmdOrCtrl+0")
                .build(handle)?;

            let view_menu = SubmenuBuilder::new(handle, "View")
                .item(&toggle_sidebar)
                .separator()
                .item(&zoom_in)
                .item(&zoom_out)
                .item(&zoom_reset)
                .build()?;

            let go_menu = SubmenuBuilder::new(handle, "Go")
                .item(&quick_open)
                .build()?;

            let menu = MenuBuilder::new(handle)
                .items(&[&file_menu, &view_menu, &go_menu])
                .build()?;

            app.set_menu(menu)?;

            app.on_menu_event(move |app_handle, event| {
                let id = event.id().0.as_str();
                let _ = app_handle.emit("menu-event", id);
                if id == "close_window" {
                    if let Some(window) = app_handle.get_webview_window("main") {
                        let _ = window.close();
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
