import { Sprite } from 'pixi.js';

// Interface for particle emitter configuration
export interface EmitterConfig {
  position: { x: number, y: number };
  spread: number;
  lifetime: number;
  gravity: number;
  initialSpeed: { min: number, max: number };
  size: { min: number, max: number };
  colors: number[];
}

// Particle class to manage individual particle state
export class Particle {
  x: number = 0;
  y: number = 0;
  velocity = { x: 0, y: 0 };
  age: number = 0;
  lifetime: number;
  active: boolean = false;
  alpha: number = 1;
  size: number;
  color: number;
  sprite: Sprite | null = null;
  
  constructor(private emitterConfig: EmitterConfig) {
    this.lifetime = emitterConfig.lifetime;
    this.size = emitterConfig.size.min + Math.random() * (emitterConfig.size.max - emitterConfig.size.min);
    // Assign random color from the color pool
    const colorIndex = Math.floor(Math.random() * emitterConfig.colors.length);
    this.color = emitterConfig.colors[colorIndex];
  }
  
  init() {
    // Random position within emitter spread
    const x = this.emitterConfig.position.x + (Math.random() - 0.5) * this.emitterConfig.spread;
    const y = this.emitterConfig.position.y;
    
    // Random velocity
    const speed = this.emitterConfig.initialSpeed.min + 
                 Math.random() * (this.emitterConfig.initialSpeed.max - this.emitterConfig.initialSpeed.min);
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 4; // Upward with some spread
    this.velocity.x = Math.cos(angle) * speed;
    this.velocity.y = Math.sin(angle) * speed;
    
    this.x = x;
    this.y = y;
    this.age = 0;
    this.active = true;
    this.alpha = 1;
    
    // Random size within the configured range
    this.size = this.emitterConfig.size.min + 
                Math.random() * (this.emitterConfig.size.max - this.emitterConfig.size.min);
    
    // Assign random color from the color pool
    const colorIndex = Math.floor(Math.random() * this.emitterConfig.colors.length);
    this.color = this.emitterConfig.colors[colorIndex];
                
    if (this.sprite) {
      this.sprite.x = this.x;
      this.sprite.y = this.y;
      this.sprite.alpha = this.alpha;
      this.sprite.scale.set(this.size);
      this.sprite.tint = this.color; // Apply the color tint
    }
  }
  
  update(deltaMS: number) {
    if (!this.active) return false;
    
    this.age += deltaMS;
    if (this.age >= this.lifetime) {
      // Particle died
      this.active = false;
      this.sprite!.visible = false;
      return false;
    }
    
    // Update position based on velocity
    this.velocity.y += this.emitterConfig.gravity; // Apply gravity
    
    const x = this.sprite!.position.x + this.velocity.x;
    const y = this.sprite!.position.y + this.velocity.y;
    this.sprite!.position.set(x, y);
    
    // Fade out near end of life
    if (this.age > this.lifetime * 0.7) {
      const fadeRatio = 1 - ((this.age - this.lifetime * 0.7) / (this.lifetime * 0.3));
      this.sprite!.alpha = Math.max(0, fadeRatio) * 0.8;
    }
    
    return true;
  }
}
