use wasm_bindgen::prelude::*;
use rand::Rng;

// Struct to represent a single particle
#[derive(Clone, Copy)]
pub struct Particle {
    pub position: [f32; 3],
    pub velocity: [f32; 3],
    pub age: f32,
}

// Main simulation struct that will be exposed to JavaScript
#[wasm_bindgen]
pub struct Simulation {
    particles: Vec<Particle>,
    time_step: f32,
}

// Implementation of simulation with public methods
#[wasm_bindgen]
impl Simulation {
     // Constructor
     #[wasm_bindgen(constructor)]
     pub fn new(count: usize) -> Simulation {
         let mut rng = rand::thread_rng();
         
         // Create vector with the specified number of particles
         let particles = (0..count)
             .map(|_| {
                 // Generate explosive supernova radial velocity
                 let angle = rng.gen_range(0.0..std::f32::consts::PI * 2.0); // Full circle
                 let speed = rng.gen_range(2.5..4.5); // High-speed explosion
                 let vx = angle.cos() * speed;
                 let vy = angle.sin() * speed;
                 let vz = rng.gen_range(-0.5..0.5); // More Z variation for 3D effect
                 
                 // Stagger initial ages for continuous emission
                 let initial_age = rng.gen_range(0.0..3.0);
                 
                 Particle {
                     position: [0.0, 0.0, 0.0], // Start at origin
                     velocity: [vx, vy, vz],
                     age: initial_age, // Staggered ages prevent batch respawning
                 }
             })
             .collect();
         
         Simulation { 
             particles,
             time_step: 0.016, // ~60fps
         }
     }

     // Update the simulation by one time step
    pub fn tick(&mut self) -> Vec<f32> {
        // Supernova explosion constants
        const RADIAL_ACCELERATION: f32 = 1.2; // Continuous outward acceleration
        const EXPLOSION_FORCE: f32 = 0.8; // Additional explosive force
        
        // Update each particle
        for particle in &mut self.particles {
            // Calculate distance and direction from center
            let distance_from_center = (particle.position[0].powi(2) + particle.position[1].powi(2)).sqrt();
            
            // Apply continuous radial acceleration (supernova expansion)
            if distance_from_center > 0.01 { // Avoid division by zero
                let normalized_x = particle.position[0] / distance_from_center;
                let normalized_y = particle.position[1] / distance_from_center;
                
                // Continuous outward acceleration (like expanding shockwave)
                particle.velocity[0] += normalized_x * RADIAL_ACCELERATION * self.time_step;
                particle.velocity[1] += normalized_y * RADIAL_ACCELERATION * self.time_step;
                
                // Additional explosive force that diminishes with distance
                let explosion_multiplier = (3.0 - distance_from_center).max(0.0) / 3.0;
                particle.velocity[0] += normalized_x * EXPLOSION_FORCE * explosion_multiplier * self.time_step;
                particle.velocity[1] += normalized_y * EXPLOSION_FORCE * explosion_multiplier * self.time_step;
            }
            
            // Update position based on velocity
            particle.position[0] += particle.velocity[0] * self.time_step;
            particle.position[1] += particle.velocity[1] * self.time_step;
            particle.position[2] += particle.velocity[2] * self.time_step;
            
            // Increment age
            particle.age += self.time_step;
            
            // Respawn logic: if particle is too old or moves too far from center
            let distance_from_center = (particle.position[0].powi(2) + particle.position[1].powi(2)).sqrt();
            if particle.age > 4.0 || distance_from_center > 12.0 {
                // Reset position to origin (supernova core)
                particle.position = [0.0, 0.0, 0.0];
                
                // Reset age
                particle.age = 0.0;
                
                // Assign new explosive supernova velocity
                let mut rng = rand::thread_rng();
                let angle = rng.gen_range(0.0..std::f32::consts::PI * 2.0); // Full circle explosion
                let speed = rng.gen_range(2.5..4.5); // High-speed explosion
                particle.velocity[0] = angle.cos() * speed;
                particle.velocity[1] = angle.sin() * speed;
                particle.velocity[2] = rng.gen_range(-0.5..0.5); // 3D explosion effect
            }
        }
        
        // Return flat array of particle positions [x1, y1, z1, x2, y2, z2, ...]
        self.get_positions()
    }
    
    // Get all particle positions as a flat array
    pub fn get_positions(&self) -> Vec<f32> {
        let mut positions = Vec::with_capacity(self.particles.len() * 3);
        
        for particle in &self.particles {
            positions.push(particle.position[0]);
            positions.push(particle.position[1]);
            positions.push(particle.position[2]);
        }
        
        positions
    }

     // Get the number of particles
     pub fn get_count(&self) -> usize {
        self.particles.len()
    }
}
