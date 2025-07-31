use serde::Serialize;
use std::sync::Mutex;
use std::time::Duration;
use sysinfo::{System, SystemExt, CpuExt, ProcessExt};
use tauri::command;

// Global System instance to prevent frequent reinitializations
lazy_static::lazy_static! {
    static ref SYSTEM: Mutex<System> = Mutex::new(
        System::new_all()
    );
}

#[derive(Serialize, Debug, Clone)]
pub struct SystemMetrics {
    pub cpu_usage: f32,          // Overall CPU usage percentage
    pub memory_used_mb: f64,     // Used memory in MB
    pub memory_total_mb: f64,    // Total memory in MB
    pub memory_usage_percent: f32, // Memory usage percentage
    pub process_memory_mb: f64,  // Memory used by this process in MB
}

/// Retrieves system metrics including CPU and memory usage
#[command]
pub fn get_system_metrics() -> SystemMetrics {
    let mut system = SYSTEM.lock().unwrap();
    
    // Full refresh of everything to ensure we get fresh data
    // The Refresh kind is all-inclusive to get everything
    system.refresh_all();
    
    // Short sleep to ensure CPU usage measurement is accurate
    std::thread::sleep(Duration::from_millis(250));
    system.refresh_cpu();
    
    // Calculate overall CPU usage - average across all cores
    let mut cpu_usage = 0.0;
    let cpu_count = system.cpus().len();
    
    if cpu_count > 0 {
        for cpu in system.cpus() {
            cpu_usage += cpu.cpu_usage();
        }
        cpu_usage /= cpu_count as f32;
    }
    
    // Log CPU usage for debugging
    println!("CPU Usage: {}%", cpu_usage);
    
    // Get memory info using SystemExt trait methods
    let memory_used = system.used_memory();
    let memory_total = system.total_memory();
    let memory_used_mb = memory_used as f64 / 1024.0 / 1024.0;
    let memory_total_mb = memory_total as f64 / 1024.0 / 1024.0;
    let memory_usage_percent = (memory_used as f32 / memory_total as f32) * 100.0;
    
    // Log memory info for debugging
    println!("Memory: {:.1}MB / {:.1}MB ({:.1}%)", memory_used_mb, memory_total_mb, memory_usage_percent);
    
    // Get memory used by this process using current PID
    let process_memory_mb = match sysinfo::get_current_pid() {
        Ok(pid) => {
            match system.process(pid) {
                Some(process) => {
                    let mem = process.memory() as f64 / 1024.0 / 1024.0;
                    println!("Process Memory: {:.1}MB for PID {:?}", mem, pid);
                    mem
                },
                None => {
                    println!("Process not found for PID {:?}", pid);
                    0.0
                },
            }
        },
        Err(e) => {
            println!("Failed to get current PID: {:?}", e);
            0.0
        },
    };

    SystemMetrics {
        cpu_usage,
        memory_used_mb,
        memory_total_mb,
        memory_usage_percent,
        process_memory_mb,
    }
}
