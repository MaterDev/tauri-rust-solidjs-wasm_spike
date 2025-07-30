// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_log::{Target, TargetKind};

fn main() {
  app_lib::run();
  tauri::Builder::default()
    .plugin(
      tauri_plugin_log::Builder::new()
        .target(Target::new(TargetKind::Webview))
        .build(),
    )
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
