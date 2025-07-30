import { Container, Sprite, Texture } from 'pixi.js';
import { info } from '@tauri-apps/plugin-log';
import { Particle, EmitterConfig } from './Particle';

export class ParticleSystem {
  private particles: Map<Sprite, Particle>;
  private particlePool: Sprite[];
  private activeParticles: Sprite[];
  private emissionTimer: number;
  private particleContainer: Container;
  private texture: Texture;
  private emitterConfig: EmitterConfig;
  
  constructor(particleContainer: Container, texture: Texture, emitterConfig: EmitterConfig) {
    this.particleContainer = particleContainer;
    this.texture = texture;
    this.emitterConfig = emitterConfig;
    this.particles = new Map();
    this.particlePool = [];
    this.activeParticles = [];
    this.emissionTimer = 0;
    
    // Initialize the particle pool
    this.initPool(1000); // Start with pool of 1000 particles
  }

  // Create initial pool of particles
  initPool(size: number): void {
    if (!this.texture || !this.particleContainer) return;
    
    for (let i = 0; i < size; i++) {
      // Create a new particle
      const particle = new Particle(this.emitterConfig);
      
      // Create sprite using the texture
      const sprite = new Sprite(this.texture);
      sprite.anchor.set(0.5);
      sprite.visible = false; // Initially hidden
      sprite.tint = particle.color; // Apply the random color tint
      
      // Add to container
      this.particleContainer.addChild(sprite);
      
      // Add to pool
      this.particlePool.push(sprite);
    }
    info(`Created particle pool with ${size} sprites`);
  }
  
  // Emit a new particle
  emit(): Particle | null {
    if (this.particlePool.length === 0) {
      // Create more sprites if needed
      if (!this.texture || !this.particleContainer) return null;
      
      const sprite = new Sprite(this.texture);
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.particleContainer.addChild(sprite);
      this.particlePool.push(sprite);
    }
    
    // Get a particle from the pool
    const sprite = this.particlePool.pop()!;
    const particle = new Particle(this.emitterConfig);
    particle.sprite = sprite;
    particle.init();
    sprite.visible = true;
    sprite.tint = particle.color; // Apply the random color tint
    
    // Add to active particles AND to the particles map
    this.activeParticles.push(sprite);
    this.particles.set(sprite, particle);
    
    return particle;
  }
  
  // Update all active particles
  update(deltaMS: number, emissionRate: number): void {
    // Calculate how many particles to emit this frame
    const emissionsPerSecond = emissionRate / 5; // Convert from per 5 seconds to per second
    const emissionsThisFrame = (emissionsPerSecond * deltaMS) / 1000;
    this.emissionTimer += emissionsThisFrame;
    
    // Emit particles
    while (this.emissionTimer >= 1) {
      this.emit();
      this.emissionTimer -= 1;
    }
    
    // Update existing particles
    const deadParticles: Sprite[] = [];
    
    // Iterate through all particles in the Map
    this.particles.forEach((particle, sprite) => {
      const alive = particle.update(deltaMS);
      if (!alive) {
        deadParticles.push(sprite);
      }
    });
    
    // Remove dead particles
    deadParticles.forEach(sprite => {
      this.particles.delete(sprite); // Remove from Map
      
      // Remove from active particles array
      const index = this.activeParticles.indexOf(sprite);
      if (index !== -1) {
        this.activeParticles.splice(index, 1);
      }
      
      // Hide sprite and return to pool
      sprite.visible = false;
      this.particlePool.push(sprite);
    });
  }

  // Get the count of active particles
  getActiveParticleCount(): number {
    return this.activeParticles.length;
  }
  
  // Clean up resources
  cleanup(): void {
    // Clean up particles
    this.activeParticles.forEach(particle => {
      if (particle) particle.destroy();
    });
    
    this.particlePool.forEach(particle => {
      if (particle) particle.destroy();
    });
    
    this.activeParticles = [];
    this.particlePool = [];
    this.particles.clear();
  }
  
  // Update emitter configuration
  updateEmitterConfig(config: EmitterConfig): void {
    this.emitterConfig = config;
  }
}
