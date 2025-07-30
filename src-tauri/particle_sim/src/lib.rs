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
                 // Generate random initial upward velocity
                 let vx = rng.gen_range(-0.3..0.3);
                 let vy = rng.gen_range(0.5..1.5);
                 let vz = rng.gen_range(-0.3..0.3);
                 
                 Particle {
                     position: [0.0, 0.0, 0.0], // Start at origin
                     velocity: [vx, vy, vz],
                     age: 0.0,
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
        // Gravity constant
        const GRAVITY: f32 = -0.8;
        
        // Update each particle
        for particle in &mut self.particles {
            // Apply gravity to y-component of velocity
            particle.velocity[1] += GRAVITY * self.time_step;
            
            // Update position based on velocity
            particle.position[0] += particle.velocity[0] * self.time_step;
            particle.position[1] += particle.velocity[1] * self.time_step;
            particle.position[2] += particle.velocity[2] * self.time_step;
            
            // Increment age
            particle.age += self.time_step;
            
            // Respawn logic: if particle is too old or falls below threshold
            if particle.age > 3.0 || particle.position[1] < -1.0 {
                // Reset position to origin
                particle.position = [0.0, 0.0, 0.0];
                
                // Reset age
                particle.age = 0.0;
                
                // Assign new random upward velocity
                let mut rng = rand::thread_rng();
                particle.velocity[0] = rng.gen_range(-0.3..0.3);
                particle.velocity[1] = rng.gen_range(0.5..1.5);
                particle.velocity[2] = rng.gen_range(-0.3..0.3);
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
