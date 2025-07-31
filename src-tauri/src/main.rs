// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

extern crate lazy_static;

use commands::get_system_metrics;
use tauri_plugin_log::{Target, TargetKind};

fn main() {
  app_lib::run();
  tauri::Builder::default()
    .plugin(
      tauri_plugin_log::Builder::new()
        .target(Target::new(TargetKind::Webview))
        .build(),
    )
    .invoke_handler(tauri::generate_handler![get_system_metrics])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
