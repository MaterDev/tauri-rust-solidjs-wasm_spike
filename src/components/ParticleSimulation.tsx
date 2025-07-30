import { Component, onCleanup, onMount, createSignal, createEffect } from 'solid-js';
import { Application, Container, Graphics, Sprite, Ticker } from 'pixi.js';
import { info, error, debug } from '@tauri-apps/plugin-log';

// Import WASM using dynamic import - will be resolved by Vite
// Using dynamic import for browser compatibility
let wasmModule: any = null;
let wasmInitialized = false;

const ParticleSimulation: Component = () => {
  const [fps, setFps] = createSignal<number>(0);
  const [status, setStatus] = createSignal<string>('Initializing...');
  const [particleCount, setParticleCount] = createSignal<number>(5000);
  
  // Function to update particle count without disrupting the particle flow
  const updateParticleCount = async (delta: number) => {
    const newCount = Math.max(1000, particleCount() + delta);
    setParticleCount(newCount);
    setStatus(`Updating particle count to ${newCount}...`);
    info(`Updating particle count to ${newCount}`);
    
    // We only need to update the emission rate - the emitter system will handle the rest
    // No need to recreate the simulation or particles
    setStatus(`Particle count updated to ${newCount}`);
  };
  
  let app: Application | null = null;
  let particleContainer: Container | null = null;
  let texture: any = null;
  let activeParticles: Sprite[] = [];
  let particlePool: Sprite[] = [];
  let lastTime = performance.now();
  let frameCount = 0;
  let emissionTimer = 0;
  let windowWidth = window.innerWidth;
  let windowHeight = window.innerHeight;
  
  // Particle emitter configuration
  const emitterConfig = {
    position: { x: windowWidth / 2, y: windowHeight }, // Bottom center of the viewport
    spread: windowWidth / 4,              // Horizontal spread based on window width
    lifetime: 5000,                       // Particle lifetime in ms
    gravity: -0.1,                        // Negative gravity effect (pulls upward)
    initialSpeed: { min: 2, max: 5 },     // Initial speed range
    size: { min: 1, max: 3 },             // Size range
    colors: [                             // Available colors for randomization
      0xFF4500, // Orange Red
      0x00BFFF, // Deep Sky Blue
      0x7FFF00, // Chartreuse
      0xFF00FF, // Magenta
      0xFFFF00, // Yellow
      0x00FFFF, // Cyan
      0xFFD700  // Gold
    ]
  };
  
  // Particle class to manage individual particle state
  class Particle {
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
    
    constructor() {
      this.lifetime = emitterConfig.lifetime;
      this.size = emitterConfig.size.min + Math.random() * (emitterConfig.size.max - emitterConfig.size.min);
      // Assign random color from the color pool
      const colorIndex = Math.floor(Math.random() * emitterConfig.colors.length);
      this.color = emitterConfig.colors[colorIndex];
    }
    
    init() {
      // Random position within emitter spread
      const x = emitterConfig.position.x + (Math.random() - 0.5) * emitterConfig.spread;
      const y = emitterConfig.position.y;
      
      // Random velocity
      const speed = emitterConfig.initialSpeed.min + 
                   Math.random() * (emitterConfig.initialSpeed.max - emitterConfig.initialSpeed.min);
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 4; // Upward with some spread
      this.velocity.x = Math.cos(angle) * speed;
      this.velocity.y = Math.sin(angle) * speed;
      
      this.x = x;
      this.y = y;
      this.age = 0;
      this.active = true;
      this.alpha = 1;
      
      // Random size within the configured range
      this.size = emitterConfig.size.min + 
                  Math.random() * (emitterConfig.size.max - emitterConfig.size.min);
      
      // Assign random color from the color pool
      const colorIndex = Math.floor(Math.random() * emitterConfig.colors.length);
      this.color = emitterConfig.colors[colorIndex];
                  
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
      this.velocity.y += emitterConfig.gravity; // Apply gravity
      
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
  
  // Particle system to manage emitter, particles, and pool
  let particleSystem = {
    particles: new Map<Sprite, Particle>(),
    
    // Create initial pool of particles
    initPool: function(size: number) {
      if (!texture || !particleContainer) return;
      
      for (let i = 0; i < size; i++) {
        // Create a new particle
        const particle = new Particle();
        
        // Create sprite using the texture
        const sprite = new Sprite(texture);
        sprite.anchor.set(0.5);
        sprite.visible = false; // Initially hidden
        sprite.tint = particle.color; // Apply the random color tint
        
        // Assign sprite to particle and add to container
        particle.sprite = sprite;
        particleContainer!.addChild(sprite);
        
        // Add to pool
        particlePool.push(sprite);
      }
      info(`Created particle pool with ${size} sprites`);
    },
    
    // Emit a new particle
    emit: function() {
      if (particlePool.length === 0) {
        // Create more sprites if needed
        if (!texture || !particleContainer) return null;
        
        const sprite = new Sprite(texture);
        sprite.anchor.set(0.5);
        sprite.visible = false;
        particleContainer!.addChild(sprite);
        particlePool.push(sprite);
      }
      
      // Get a particle from the pool
      const sprite = particlePool.pop()!;
      const particle = new Particle();
      particle.sprite = sprite;
      particle.init();
      sprite.visible = true;
      sprite.tint = particle.color; // Apply the random color tint
      
      // Add to active particles AND to the particles map
      activeParticles.push(sprite);
      this.particles.set(sprite, particle);
      
      return particle;
    },
    
    // Update all active particles
    update: function(deltaMS: number) {
      // Calculate how many particles to emit this frame
      const currentRate = particleCount();
      const emissionsPerSecond = currentRate / 5; // Convert from per 5 seconds to per second
      const emissionsThisFrame = (emissionsPerSecond * deltaMS) / 1000;
      emissionTimer += emissionsThisFrame;
      
      // Emit particles
      while (emissionTimer >= 1) {
        this.emit();
        emissionTimer -= 1;
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
        const index = activeParticles.indexOf(sprite);
        if (index !== -1) {
          activeParticles.splice(index, 1);
        }
        
        // Hide sprite and return to pool
        sprite.visible = false;
        particlePool.push(sprite);
      });
    }
  };
  
  // Animation function takes delta time in milliseconds
  const animate = (deltaMS: number) => {
    // Update FPS counter
    const now = performance.now();
    frameCount++;
    
    // Update FPS counter every second
    if (now - lastTime >= 1000) {
      const currentFps = Math.round(frameCount / ((now - lastTime) / 1000));
      setFps(currentFps);
      debug(`Current FPS: ${currentFps}`);
      frameCount = 0;
      lastTime = now;
    }
    
    try {
      // Update particle system
      particleSystem.update(deltaMS);
      
      // Update status with active particle count
      if (frameCount % 60 === 0) { // Update once per second
        setStatus(`Active particles: ${activeParticles.length} | FPS: ${fps()}`);
      }
    } catch (err: any) {
      error(`Error in animation loop: ${err}`);
    }
  };

  // Handle window resize events
  const handleResize = () => {
    if (!app) return;
    
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;
    
    // Resize the app renderer
    app.renderer.resize(windowWidth, windowHeight);
    
    // Update emitter position
    emitterConfig.position.x = windowWidth / 2;
    emitterConfig.position.y = windowHeight;
    emitterConfig.spread = windowWidth / 4;
    
    info(`Resized renderer to ${windowWidth}x${windowHeight}`);
  };

  const initializePixi = async (containerElement: HTMLDivElement) => {
    try {
      setStatus('Initializing PixiJS...');
      info('Initializing PixiJS...');
      
      // Initialize PixiJS Application with full window dimensions
      app = new Application();
      await app.init({
        width: windowWidth,
        height: windowHeight,
        backgroundColor: 0x000000,
        antialias: true,
        resizeTo: window, // Auto-resize to window dimensions
      });
      
      // Add canvas to DOM
      containerElement.appendChild(app.canvas);
      info('PixiJS application created and initialized');
      
      // Create a regular container instead of ParticleContainer for simplicity
      particleContainer = new Container();
      app.stage.addChild(particleContainer);
      info('Particle container created and added to stage');

      // Create a texture for the particles
      // Using white so we can tint it with different colors
      const graphics = new Graphics();
      graphics.beginFill(0xffffff); // White base color for tinting
      graphics.drawCircle(0, 0, 2);
      graphics.endFill();
      
      // In PixiJS v8, generateTexture is replaced with extract.texture
      texture = app.renderer.extract.texture(graphics);
      info('Particle texture created');
      
      // Initialize particle pool
      particleSystem.initPool(1000); // Start with pool of 1000 particles
      
      // Start animation loop
      info('Starting animation loop');
      lastTime = performance.now();
      frameCount = 0;
      if (app) {
        app.ticker.add((ticker) => animate(ticker.deltaMS));
      }
      info('Animation loop started');
    } catch (err: any) {
      error(`Error initializing particle simulation: ${err}`);
    }
  };


  onMount(async () => {
    info('ParticleSimulation component mounted');
    setStatus('Initializing...');
    
    // Add window resize event listener
    window.addEventListener('resize', handleResize);
  });

  onCleanup(() => {
    info('Cleaning up particle simulation');
    
    // Remove resize event listener
    window.removeEventListener('resize', handleResize);
    
    // Stop animation loop
    if (app) {
      app.ticker.stop();
      app.destroy();
      app = null;
    }
    
    // Clean up texture and particles
    if (texture) {
      texture.destroy();
      texture = null;
    }
    
    // Clean up particles
    activeParticles.forEach(particle => {
      if (particle) particle.destroy();
    });
    particlePool.forEach(particle => {
      if (particle) particle.destroy();
    });
    activeParticles = [];
    particlePool = [];
    
    info('Particle simulation cleanup complete');
  });

  const [containerRef, setContainerRef] = createSignal<HTMLDivElement | null>(null);

  return (
    <div class="particle-simulation">
      <div
        style={{
          "position": "absolute",
          "top": "10px",
          "left": "10px",
          "background": "rgba(0, 0, 0, 0.5)",
          "padding": "5px",
          "border-radius": "3px",
          "color": "white",
          "font-family": "monospace",
          "z-index": 100
        }}
      >
        FPS: {fps()} | Particles: {particleCount()} | {status()}
      </div>
      <div
        style={{
          "position": "absolute",
          "top": "10px",
          "right": "10px",
          "display": "flex",
          "gap": "10px",
          "z-index": 100
        }}
      >
        <button
          onClick={() => updateParticleCount(1000)}
          style={{
            "background": "#333",
            "color": "white",
            "border": "none",
            "padding": "5px 10px",
            "border-radius": "3px",
            "cursor": "pointer"
          }}
        >
          +1000 Particles
        </button>
        <button
          onClick={() => updateParticleCount(-1000)}
          style={{
            "background": "#333",
            "color": "white",
            "border": "none",
            "padding": "5px 10px",
            "border-radius": "3px",
            "cursor": "pointer"
          }}
        >
          -1000 Particles
        </button>
      </div>
      <div 
        ref={(el) => {
          setContainerRef(el);
          if (el) {
            initializePixi(el);
          }
        }}
        style={{
          "width": "100vw",
          "height": "100vh",
          "position": "fixed",
          "top": 0,
          "left": 0,
          "overflow": "hidden"
        }}
      >
      </div>
    </div>
  );
};

export default ParticleSimulation;