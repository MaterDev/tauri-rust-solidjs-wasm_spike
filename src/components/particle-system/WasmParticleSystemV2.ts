import { info, error } from '@tauri-apps/plugin-log';
import { Container, ParticleContainer, Particle, Texture } from 'pixi.js';
import { EmitterConfig } from './EmitterConfig';

// Import WASM module directly from wasm-pack generated package
import init, { Simulation } from '../../../src-tauri/particle_sim/pkg';

// WASM simulation interface
interface WasmSimulation {
  tick(): Float32Array;
  get_positions(): Float32Array;
  get_count(): number;
  free(): void;
}

/**
 * WASM-only particle system that uses Rust simulation for all physics
 * No TypeScript physics - purely driven by WASM positions
 */
export class WasmParticleSystemV2 {
  private particleContainer: ParticleContainer;
  private particleList: Particle[] = [];
  private wasmSimulation: WasmSimulation | null = null;
  private isInitialized: boolean = false;
  private emitterConfig: EmitterConfig;
  private particleTexture: Texture;
  private targetParticleCount: number = 1000;
  private centerX: number = 0; // Screen center X for positioning
  private centerY: number = 0; // Screen center Y for positioning
  private screenScale: number = 100; // Scale factor to convert WASM coordinates to screen pixels
  
  constructor(texture: Texture, emitterConfig: EmitterConfig) {
    this.particleContainer = new ParticleContainer();
    this.emitterConfig = emitterConfig;
    this.particleTexture = texture;
    
    // Set center point to middle of screen
    this.centerX = emitterConfig.position.x;
    this.centerY = emitterConfig.position.y;
  }

  /**
   * Initialize the WebAssembly module and create particle simulation
   * @param particleCount Number of particles to simulate
   * @returns Promise that resolves to true when initialization is complete
   */
  async initialize(particleCount: number): Promise<boolean> {
    try {
      info('Initializing WASM-only particle system v2...');
      
      this.targetParticleCount = particleCount;
      
      // Initialize the WASM module
      try {
        info('Initializing WASM module...');
        await init();
        info('WASM module initialized successfully');
      } catch (err) {
        error(`Failed to initialize WASM module: ${err}`);
        throw new Error(`WASM initialization failed: ${err}`);
      }
      
      // Create the WASM simulation instance
      try {
        this.wasmSimulation = new Simulation(particleCount);
        info(`Created WASM simulation with ${particleCount} particles`);
      } catch (err) {
        error(`Failed to create WASM simulation: ${err}`);
        throw err;
      }
      
      // Create PixiJS particles to match WASM particle count
      for (let i = 0; i < particleCount; i++) {
        // Use PixiJS v8 Particle constructor with configuration object
        const particle = new Particle({
          texture: this.particleTexture,
          x: this.centerX,
          y: this.centerY,
          scaleX: 1 + Math.random() * 3,
          scaleY: 1 + Math.random() * 3,
          tint: this.emitterConfig.colors[Math.floor(Math.random() * this.emitterConfig.colors.length)],
          alpha: 1.0,
          rotation: 0
        });
        
        this.particleList.push(particle);
        // PixiJS v8 ParticleContainer uses addParticle method
        this.particleContainer.addParticle(particle);
      }
      
      this.isInitialized = true;
      info(`WASM-only particle system v2 initialized with ${particleCount} particles`);
      return true;
    } catch (err: any) {
      error(`Failed to initialize WASM particle system v2: ${err}`);
      return false;
    }
  }

  /**
   * Get the particle container to add to the scene
   */
  getContainer(): Container {
    return this.particleContainer;
  }

  /**
   * Update particle simulation using ONLY WASM positions
   * @param deltaTime Time elapsed since last update in seconds (unused - WASM handles timing)
   */
  update(deltaTime: number): void {
    if (!this.isInitialized || !this.wasmSimulation) {
      return;
    }

    try {
      // Get updated positions from WASM simulation
      const positions = this.wasmSimulation.tick();
      const particleCount = positions.length / 3;
      
      // Update PixiJS particles with WASM positions
      for (let i = 0; i < Math.min(particleCount, this.particleList.length); i++) {
        const particle = this.particleList[i];
        if (particle) {
          // Get WASM position (x, y, z)
          const x = positions[i * 3];
          const y = positions[i * 3 + 1];
          const z = positions[i * 3 + 2];
          
          // Convert WASM coordinates to screen coordinates
          // WASM uses a coordinate system centered at origin, scale to screen
          particle.x = this.centerX + (x * this.screenScale);
          particle.y = this.centerY - (y * this.screenScale); // Flip Y for screen coordinates
          
          // Calculate particle age and distance for dynamic properties
          const distance = Math.sqrt(x*x + y*y + z*z);
          const normalizedDistance = Math.min(distance / 5.0, 1.0); // Normalize to 0-1
          
          // Dynamic alpha based on distance and emitter config
          particle.alpha = Math.max(0.1, 1.0 - normalizedDistance * 0.8);
          
          // Dynamic scale based on distance (particles shrink as they move away)
          const baseScale = this.emitterConfig.particleSize.min + 
            (this.emitterConfig.particleSize.max - this.emitterConfig.particleSize.min) * (1.0 - normalizedDistance);
          particle.scaleX = baseScale;
          particle.scaleY = baseScale;
          
          // Optional: Add slight rotation based on velocity (if WASM provides velocity data)
          particle.rotation += 0.01 * (1.0 - normalizedDistance);
          
          // Color interpolation based on distance (optional enhancement)
          if (normalizedDistance > 0.7) {
            // Fade to darker colors as particles age/move away
            particle.tint = 0x666666;
          }
        }
      }
    } catch (err: any) {
      error(`Error updating WASM particle system v2: ${err}`);
    }
  }

  /**
   * Get count of currently active (visible) particles
   */
  getActiveParticleCount(): number {
    let activeCount = 0;
    for (let i = 0; i < this.particleList.length; i++) {
      const particle = this.particleList[i];
      if (particle && particle.alpha > 0) {
        activeCount++;
      }
    }
    return activeCount;
  }

  /**
   * Update emitter configuration and center position
   * @param config New emitter configuration
   */
  updateEmitterConfig(config: EmitterConfig): void {
    this.emitterConfig = config;
    
    // Update center position for screen positioning
    this.centerX = config.position.x;
    this.centerY = config.position.y;
    
    info(`Updated emitter config - center: (${this.centerX}, ${this.centerY})`);
  }

  /**
   * Set particle count (recreates WASM simulation)
   * @param count New particle count
   */
  async setParticleCount(count: number): Promise<void> {
    if (count === this.targetParticleCount) {
      return;
    }
    
    info(`Updating particle count from ${this.targetParticleCount} to ${count}`);
    
    // Clean up existing simulation
    if (this.wasmSimulation) {
      this.wasmSimulation.free();
    }
    
    // Reinitialize with new count
    await this.initialize(count);
  }

  /**
   * Get current fountain statistics for UI display
   */
  getFountainStats(): { targetCount: number; emissionRate: number; duration: number } {
    return {
      targetCount: this.targetParticleCount,
      emissionRate: this.targetParticleCount / 3, // WASM respawns every 3 seconds
      duration: 3 // WASM particle lifetime is 3 seconds
    };
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.wasmSimulation) {
      try {
        this.wasmSimulation.free();
        this.wasmSimulation = null;
        info('WASM simulation cleaned up');
      } catch (err) {
        error(`Error cleaning up WASM simulation: ${err}`);
      }
    }
    
    // Clear particles
    this.particleList.length = 0;
    this.particleContainer.removeChildren();
    
    this.isInitialized = false;
    info('WASM particle system v2 cleaned up');
  }
}
