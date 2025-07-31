#[cfg(test)]
mod tests {
    use crate::commands::{get_system_metrics, SystemMetrics};

    #[test]
    fn test_get_system_metrics_returns_valid_data() {
        // Call the function
        let metrics = get_system_metrics();
        
        // Verify the returned metrics are valid
        assert!(metrics.cpu_usage >= 0.0, "CPU usage should be non-negative");
        assert!(metrics.cpu_usage <= 100.0, "CPU usage should be <= 100%");
        
        assert!(metrics.memory_used_mb > 0.0, "Memory used should be positive");
        assert!(metrics.memory_total_mb > 0.0, "Total memory should be positive");
        assert!(metrics.memory_used_mb <= metrics.memory_total_mb, "Used memory should be <= total memory");
        
        assert!(metrics.memory_usage_percent >= 0.0, "Memory usage percent should be non-negative");
        assert!(metrics.memory_usage_percent <= 100.0, "Memory usage percent should be <= 100%");
        
        assert!(metrics.process_memory_mb >= 0.0, "Process memory should be non-negative");
        
        println!("Test metrics: {:#?}", metrics);
    }
    
    #[test]
    fn test_get_system_metrics_multiple_calls() {
        // Get metrics twice to ensure the function can be called repeatedly
        let metrics1 = get_system_metrics();
        std::thread::sleep(std::time::Duration::from_millis(500));
        let metrics2 = get_system_metrics();
        
        // Verify both calls return valid data
        assert!(metrics1.cpu_usage >= 0.0 && metrics1.cpu_usage <= 100.0);
        assert!(metrics2.cpu_usage >= 0.0 && metrics2.cpu_usage <= 100.0);
        
        // Print for debugging
        println!("First call: {:#?}", metrics1);
        println!("Second call: {:#?}", metrics2);
    }
}
