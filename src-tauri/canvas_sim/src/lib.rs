use wasm_bindgen::prelude::*;
use rand::Rng;
use serde::{Deserialize, Serialize};

// Canvas object types
#[wasm_bindgen]
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum ObjectType {
    Rectangle = 0,
    Circle = 1,
    ComplexPath = 2,
    Text = 3,
}

// Canvas object data structure
#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub struct CanvasObject {
    pub id: u32,
    pub object_type: u8, // ObjectType as u8
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
    pub rotation: f32,
    pub scale_x: f32,
    pub scale_y: f32,
    pub color: u32,
    pub selected: bool,
    pub visible: bool,
}

// Performance metrics structure
#[wasm_bindgen]
#[derive(Clone, Copy, Debug)]
pub struct PerformanceMetrics {
    pub object_count: u32,
    pub visible_objects: u32,
    pub selected_objects: u32,
    pub update_time_ms: f32,
    pub memory_usage_bytes: u32,
}

// Main canvas simulation struct
#[wasm_bindgen]
pub struct CanvasSimulation {
    objects: Vec<CanvasObject>,
    next_id: u32,
    canvas_width: f32,
    canvas_height: f32,
    last_update_time: f32,
}

#[wasm_bindgen]
impl CanvasSimulation {
    /// Constructor
    #[wasm_bindgen(constructor)]
    pub fn new() -> CanvasSimulation {
        CanvasSimulation {
            objects: Vec::new(),
            next_id: 0,
            canvas_width: 1920.0,
            canvas_height: 1080.0,
            last_update_time: 0.0,
        }
    }

    /// Set canvas dimensions
    pub fn set_canvas_size(&mut self, width: f32, height: f32) {
        self.canvas_width = width;
        self.canvas_height = height;
    }

    /// Create multiple objects for performance testing
    pub fn create_objects(&mut self, count: u32, object_type: ObjectType) -> Vec<u32> {
        let mut created_ids = Vec::new();
        let mut rng = rand::thread_rng();
        
        let colors = [
            0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4, 
            0xFECA57, 0xFF9FF3, 0x54A0FF, 0x5F27CD
        ];

        for _ in 0..count {
            let object = CanvasObject {
                id: self.next_id,
                object_type: object_type as u8,
                x: rng.gen_range(50.0..(self.canvas_width - 100.0)),
                y: rng.gen_range(50.0..(self.canvas_height - 100.0)),
                width: rng.gen_range(30.0..80.0),
                height: rng.gen_range(30.0..80.0),
                rotation: 0.0,
                scale_x: rng.gen_range(0.5..1.5),
                scale_y: rng.gen_range(0.5..1.5),
                color: colors[rng.gen_range(0..colors.len())],
                selected: false,
                visible: true,
            };

            self.objects.push(object);
            created_ids.push(self.next_id);
            self.next_id += 1;
        }

        created_ids
    }

    /// Update object transformations for animation testing
    pub fn update_transformations(&mut self, delta_time: f32, mode: &str) {
        let start_time = js_sys::Date::now() as f32;
        
        match mode {
            "rotating" => {
                for obj in &mut self.objects {
                    if obj.visible {
                        obj.rotation += delta_time * 0.5; // 0.5 rad/sec
                        if obj.rotation > std::f32::consts::PI * 2.0 {
                            obj.rotation -= std::f32::consts::PI * 2.0;
                        }
                    }
                }
            },
            "scaling" => {
                let time = start_time * 0.001;
                for (i, obj) in self.objects.iter_mut().enumerate() {
                    if obj.visible {
                        let scale = 0.5 + 0.3 * (time + i as f32 * 0.1).sin();
                        obj.scale_x = scale;
                        obj.scale_y = scale;
                    }
                }
            },
            "stress" => {
                let time = start_time * 0.001;
                for (i, obj) in self.objects.iter_mut().enumerate() {
                    if obj.visible {
                        // Rotation
                        obj.rotation += delta_time * 0.3;
                        if obj.rotation > std::f32::consts::PI * 2.0 {
                            obj.rotation -= std::f32::consts::PI * 2.0;
                        }
                        
                        // Scaling
                        let scale = 0.4 + 0.2 * (time + i as f32 * 0.1).sin();
                        obj.scale_x = scale;
                        obj.scale_y = scale;
                        
                        // Position oscillation
                        let move_radius = 20.0;
                        let base_x = obj.x;
                        let base_y = obj.y;
                        obj.x = base_x + move_radius * (time * 0.5 + i as f32 * 0.2).cos();
                        obj.y = base_y + move_radius * (time * 0.5 + i as f32 * 0.2).sin();
                    }
                }
            },
            _ => {} // Static mode - no updates
        }

        self.last_update_time = js_sys::Date::now() as f32 - start_time;
    }

    /// Get object data for rendering (returns flat array for efficiency)
    pub fn get_object_data(&self) -> Vec<f32> {
        let mut data = Vec::new();
        
        for obj in &self.objects {
            if obj.visible {
                data.push(obj.id as f32);
                data.push(obj.object_type as f32);
                data.push(obj.x);
                data.push(obj.y);
                data.push(obj.width);
                data.push(obj.height);
                data.push(obj.rotation);
                data.push(obj.scale_x);
                data.push(obj.scale_y);
                data.push(obj.color as f32);
                data.push(if obj.selected { 1.0 } else { 0.0 });
            }
        }
        
        data
    }

    /// Select objects within a rectangular area
    pub fn select_objects_in_area(&mut self, x1: f32, y1: f32, x2: f32, y2: f32) -> Vec<u32> {
        let mut selected_ids = Vec::new();
        let min_x = x1.min(x2);
        let max_x = x1.max(x2);
        let min_y = y1.min(y2);
        let max_y = y1.max(y2);

        for obj in &mut self.objects {
            if obj.visible && 
               obj.x >= min_x && obj.x <= max_x && 
               obj.y >= min_y && obj.y <= max_y {
                obj.selected = true;
                selected_ids.push(obj.id);
            }
        }

        selected_ids
    }

    /// Clear all selections
    pub fn clear_selections(&mut self) {
        for obj in &mut self.objects {
            obj.selected = false;
        }
    }

    /// Move selected objects by delta
    pub fn move_selected_objects(&mut self, delta_x: f32, delta_y: f32) {
        for obj in &mut self.objects {
            if obj.selected && obj.visible {
                obj.x += delta_x;
                obj.y += delta_y;
                
                // Keep objects within canvas bounds
                obj.x = obj.x.max(0.0).min(self.canvas_width - obj.width);
                obj.y = obj.y.max(0.0).min(self.canvas_height - obj.height);
            }
        }
    }

    /// Delete selected objects
    pub fn delete_selected_objects(&mut self) -> u32 {
        let initial_count = self.objects.len();
        self.objects.retain(|obj| !obj.selected);
        (initial_count - self.objects.len()) as u32
    }

    /// Get performance metrics
    pub fn get_performance_metrics(&self) -> PerformanceMetrics {
        let visible_count = self.objects.iter().filter(|obj| obj.visible).count() as u32;
        let selected_count = self.objects.iter().filter(|obj| obj.selected).count() as u32;
        
        PerformanceMetrics {
            object_count: self.objects.len() as u32,
            visible_objects: visible_count,
            selected_objects: selected_count,
            update_time_ms: self.last_update_time,
            memory_usage_bytes: (self.objects.len() * std::mem::size_of::<CanvasObject>()) as u32,
        }
    }

    /// Clear all objects
    pub fn clear_objects(&mut self) {
        self.objects.clear();
        self.next_id = 0;
    }

    /// Get object count
    pub fn get_object_count(&self) -> u32 {
        self.objects.len() as u32
    }

    /// Get visible object count
    pub fn get_visible_count(&self) -> u32 {
        self.objects.iter().filter(|obj| obj.visible).count() as u32
    }

    /// Batch create objects with specific parameters for testing
    pub fn batch_create_test_objects(&mut self, 
                                   rectangles: u32, 
                                   circles: u32, 
                                   complex_paths: u32) -> u32 {
        let mut total_created = 0;
        
        // Create rectangles
        self.create_objects(rectangles, ObjectType::Rectangle);
        total_created += rectangles;
        
        // Create circles  
        self.create_objects(circles, ObjectType::Circle);
        total_created += circles;
        
        // Create complex paths
        self.create_objects(complex_paths, ObjectType::ComplexPath);
        total_created += complex_paths;
        
        total_created
    }

    /// Simulate memory pressure by creating and destroying objects
    pub fn memory_stress_test(&mut self, create_count: u32, destroy_percentage: f32) {
        // Create new objects
        self.create_objects(create_count, ObjectType::Rectangle);
        
        // Randomly mark some objects for deletion
        let mut rng = rand::thread_rng();
        let destroy_count = (self.objects.len() as f32 * destroy_percentage) as usize;
        
        for _ in 0..destroy_count {
            if !self.objects.is_empty() {
                let index = rng.gen_range(0..self.objects.len());
                self.objects.remove(index);
            }
        }
    }
}

// Performance testing utilities
#[wasm_bindgen]
pub fn log_performance_info(message: &str) {
    web_sys::console::log_1(&format!("Canvas Performance: {}", message).into());
}

#[wasm_bindgen]
pub fn get_memory_usage() -> u32 {
    // This is a placeholder - actual memory usage would need to be tracked differently
    0
}
