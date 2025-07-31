/**
 * Interface representing system metrics retrieved from Tauri backend
 */
export interface SystemMetrics {
  cpu_usage: number;           // Overall CPU usage percentage
  memory_used_mb: number;      // Used memory in MB
  memory_total_mb: number;     // Total memory in MB
  memory_usage_percent: number; // Memory usage percentage
  process_memory_mb: number;   // Memory used by this process in MB
}
