use wasm_bindgen::prelude::*;
use rand::Rng;

// Struct to represent a single particle
#[derive(Clone, Copy)]
pub struct Particle {
    pub position: [f32; 3],
    pub velocity: [f32; 3],
    pub age: f32,
    pub alive: bool, // New field to track if particle is alive
}

// Main simulation struct that will be exposed to JavaScript
#[wasm_bindgen]
pub struct Simulation {
    particles: Vec<Particle>,
    time_step: f32,
    max_particles: usize,
    emission_rate: f32, // Particles per second
    emission_timer: f32, // Timer for emission
    next_particle_index: usize, // Index for next particle to emit
}

// Implementation of simulation with public methods
#[wasm_bindgen]
impl Simulation {
     // Constructor
     #[wasm_bindgen(constructor)]
     pub fn new(max_count: usize) -> Simulation {
         // Create vector with max particles, all initially dead
         let particles = (0..max_count)
             .map(|_| {
                 Particle {
                     position: [0.0, 0.0, 0.0],
                     velocity: [0.0, 0.0, 0.0],
                     age: 0.0,
                     alive: false, // Start all particles as dead
                 }
             })
             .collect();
         
         Simulation { 
             particles,
             time_step: 0.016, // ~60fps
             max_particles: max_count,
             emission_rate: 50.0, // Emit 50 particles per second
             emission_timer: 0.0,
             next_particle_index: 0,
         }
     }

     // Update the simulation by one time step
    pub fn tick(&mut self) -> Vec<f32> {
        // Supernova explosion constants
        const RADIAL_ACCELERATION: f32 = 1.2;
        const EXPLOSION_FORCE: f32 = 0.8;
        
        // Count current alive particles
        let current_alive = self.particles.iter().filter(|p| p.alive).count();
        
        // Emit particles to reach and maintain target count
        if current_alive < self.max_particles {
            // Calculate emission rate based on target count and particle lifetime
            // For 8-second lifespan, need target_count/8 particles per second to maintain equilibrium
            let particles_needed = self.max_particles - current_alive;
            let base_emission_rate = (self.max_particles as f32) / 8.0; // particles per second for equilibrium
            
            // Boost emission rate when far from target
            let boost_factor = if particles_needed > (self.max_particles / 4) { 3.0 } else { 1.0 };
            let emission_rate = base_emission_rate * boost_factor;
            
            self.emission_timer += self.time_step;
            let emission_interval = 1.0 / emission_rate;
            
            while self.emission_timer >= emission_interval && current_alive < self.max_particles {
                if self.emit_particle() {
                    self.emission_timer -= emission_interval;
                } else {
                    break; // No more slots available
                }
            }
        }
        
        // Update each particle
        for particle in &mut self.particles {
            if !particle.alive {
                continue; // Skip dead particles
            }
            
            // Calculate distance and direction from center
            let distance_from_center = (particle.position[0].powi(2) + particle.position[1].powi(2)).sqrt();
            
            // Apply continuous radial acceleration (supernova expansion)
            if distance_from_center > 0.05 { // Increased threshold to catch more stuck particles
                let normalized_x = particle.position[0] / distance_from_center;
                let normalized_y = particle.position[1] / distance_from_center;
                
                // Continuous outward acceleration
                particle.velocity[0] += normalized_x * RADIAL_ACCELERATION * self.time_step;
                particle.velocity[1] += normalized_y * RADIAL_ACCELERATION * self.time_step;
                
                // Additional explosive force that diminishes with distance
                let explosion_multiplier = (3.0 - distance_from_center).max(0.0) / 3.0;
                particle.velocity[0] += normalized_x * EXPLOSION_FORCE * explosion_multiplier * self.time_step;
                particle.velocity[1] += normalized_y * EXPLOSION_FORCE * explosion_multiplier * self.time_step;
            } else {
                // Particle stuck near center - give very strong escape kick
                let mut rng = rand::thread_rng();
                let escape_angle = rng.gen_range(0.0..std::f32::consts::PI * 2.0);
                let escape_speed = 12.0; // Even stronger escape velocity
                particle.velocity[0] = escape_angle.cos() * escape_speed;
                particle.velocity[1] = escape_angle.sin() * escape_speed;
                
                // Force particle away from center immediately
                let offset = 0.3; // Larger offset
                particle.position[0] = escape_angle.cos() * offset;
                particle.position[1] = escape_angle.sin() * offset;
            }
            
            // Update position based on velocity
            particle.position[0] += particle.velocity[0] * self.time_step;
            particle.position[1] += particle.velocity[1] * self.time_step;
            particle.position[2] += particle.velocity[2] * self.time_step;
            
            // Increment age
            particle.age += self.time_step;
            
            // Kill particle if too old or too far from center
            let distance_from_center = (particle.position[0].powi(2) + particle.position[1].powi(2)).sqrt();
            if particle.age > 8.0 || distance_from_center > 15.0 {
                particle.alive = false; // Kill particle permanently
            }
        }
        
        // Return flat array of only alive particle positions
        self.get_positions()
    }
    
    // Emit a new particle - returns true if successful
    fn emit_particle(&mut self) -> bool {
        // Find a dead particle to reuse
        for i in 0..self.max_particles {
            if !self.particles[i].alive {
                let mut rng = rand::thread_rng();
                let angle = rng.gen_range(0.0..std::f32::consts::PI * 2.0);
                let speed = rng.gen_range(6.0..8.0); // Higher initial speed to escape center
                
                let particle = &mut self.particles[i];
                // Start slightly offset from center to avoid clustering
                let start_offset = 0.05;
                particle.position = [angle.cos() * start_offset, angle.sin() * start_offset, 0.0];
                particle.velocity = [angle.cos() * speed, angle.sin() * speed, rng.gen_range(-0.5..0.5)];
                particle.age = 0.0;
                particle.alive = true;
                return true;
            }
        }
        // No dead particles available - can't emit new one
        false
    }
    
    // Get all alive particle positions as a flat array
    pub fn get_positions(&self) -> Vec<f32> {
        let mut positions = Vec::new();
        
        for particle in &self.particles {
            if particle.alive {
                positions.push(particle.position[0]);
                positions.push(particle.position[1]);
                positions.push(particle.position[2]);
            }
        }
        
        positions
    }

     // Get the number of alive particles
     pub fn get_count(&self) -> usize {
        self.particles.iter().filter(|p| p.alive).count()
    }
}
