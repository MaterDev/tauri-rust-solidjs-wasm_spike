declare module 'wasm/canvas_sim' {
  /**
   * Initialize the WASM module
   */
  export default function init(): Promise<void>;
  
  /**
   * Canvas object types
   */
  export enum ObjectType {
    Rectangle = 0,
    Circle = 1,
    ComplexPath = 2,
    Text = 3
  }

  /**
   * Performance metrics structure
   */
  export interface PerformanceMetrics {
    object_count: number;
    visible_objects: number;
    selected_objects: number;
    update_time_ms: number;
    memory_usage_bytes: number;
  }
  
  /**
   * Canvas Simulation WASM class for physics and object management
   */
  export class CanvasSimulation {
    constructor();
    
    /**
     * Set canvas dimensions
     */
    set_canvas_size(width: number, height: number): void;
    
    /**
     * Add an object to the simulation
     */
    add_object(id: number, x: number, y: number, width: number, height: number): void;
    
    /**
     * Create multiple objects for performance testing
     */
    create_objects(count: number, object_type: ObjectType | number): number[];
    
    /**
     * Update object transformations for animation testing
     */
    update_transformations(delta_time: number, mode: string): void;
    
    /**
     * Update physics simulation
     */
    update(delta_time: number): void;
    
    /**
     * Get object data for rendering
     */
    get_object_data(): Float32Array;
    
    /**
     * Select objects within a rectangular area
     */
    select_objects_in_area(x1: number, y1: number, x2: number, y2: number): number[];
    
    /**
     * Handle object selection
     */
    select_object(id: number): void;
    
    /**
     * Clear selection
     */
    clear_selection(): void;
    
    /**
     * Clear all objects
     */
    clear_objects(): void;
    
    /**
     * Move selected objects
     */
    move_selected_objects(delta_x: number, delta_y: number): void;
    
    /**
     * Delete selected objects
     */
    delete_selected_objects(): number;
    
    /**
     * Get object count
     */
    get_object_count(): number;
    
    /**
     * Get visible object count
     */
    get_visible_count(): number;
    
    /**
     * Get performance metrics
     */
    get_performance_metrics(): PerformanceMetrics;
    
    /**
     * Batch create test objects with specific parameters
     */
    batch_create_test_objects(rectangles: number, circles: number, complex_paths: number): number;
    
    /**
     * Simulate memory pressure
     */
    memory_stress_test(create_count: number, destroy_percentage: number): void;
  }
}
