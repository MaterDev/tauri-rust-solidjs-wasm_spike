import { Component, onCleanup, onMount, createSignal } from 'solid-js';
import { Application, Container, Graphics, Sprite, Ticker } from 'pixi.js';
import init, { Simulation } from '../../public/wasm/particle_sim';
import { info, error, debug } from '@tauri-apps/plugin-log';

const ParticleSimulation: Component = () => {
  const [fps, setFps] = createSignal<number>(0);
  
  let container: HTMLDivElement | null = null;
  let app: Application | null = null;
  let particleContainer: Container | null = null;
  let particles: Sprite[] = [];
  let simulation: Simulation | null = null;
  
  let lastTime = 0;
  let frameCount = 0;

  const initializePixi = async (containerElement: HTMLDivElement) => {
    info('Initializing PixiJS...');
    if (!containerElement) {
      error('Container reference is undefined');
      return;
    }

    try {
      // Initialize PixiJS
      app = new Application({
        width: 800,
        height: 600,
        backgroundColor: 0x000000,
        antialias: true,
      });
      
      info('PixiJS Application created');

      // In PixiJS v8, the view is accessed as app.canvas
      containerElement.appendChild(app.canvas);
      info('Canvas appended to container');

      // Initialize WASM module
      info('Initializing WASM module...');
      try {
        await init();
        info('WASM module initialized');
      } catch (wasmError) {
        error(`Failed to initialize WASM module: ${wasmError}`);
        return;
      }

      try {
        // Create simulation with 5000 particles
        info('Creating simulation with 5000 particles');
        simulation = new Simulation(5000);
        info(`Simulation created with ${simulation.get_count()} particles`);
      } catch (simError) {
        error(`Failed to create simulation: ${simError}`);
        return;
      }

      // Create a regular container instead of ParticleContainer for simplicity
      particleContainer = new Container();
      app.stage.addChild(particleContainer);
      info('Particle container created and added to stage');

      // Create a texture for the particles
      const graphics = new Graphics();
      graphics.beginFill(0xffffff);
      graphics.drawCircle(0, 0, 2);
      graphics.endFill();
      
      // In PixiJS v8, generateTexture is replaced with extract.texture
      const texture = app.renderer.extract.texture(graphics);
      info('Particle texture created');

      // Create particles
      if (simulation) {
        const count = simulation.get_count();
        info(`Creating ${count} particle sprites`);
        particles = [];
        for (let i = 0; i < count; i++) {
          const particle = new Sprite(texture);
          particle.anchor.set(0.5);
          if (particleContainer) particleContainer.addChild(particle);
          particles.push(particle);
        }
        info(`${particles.length} particle sprites created and added to container`);

        // Start animation loop
        info('Starting animation loop');
        lastTime = performance.now();
        frameCount = 0;
        if (app) {
          app.ticker.add((ticker) => animate(ticker.deltaMS));
        }
        info('Animation loop started');
      }
    } catch (err: any) {
      error(`Error initializing particle simulation: ${err}`);
    }
  };

  // Animation function takes delta time in milliseconds
  const animate = (deltaMS: number) => {
    if (!simulation || !particles.length) return;
    
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
      // Update particle positions using WASM
      const positions = simulation.tick();
      
      // Update particles in PixiJS
      for (let i = 0; i < particles.length; i++) {
        const particleIndex = i * 3; // x, y, z
        if (particleIndex + 2 < positions.length) {
          const x = positions[particleIndex] * 400 + 400; // Scale and center
          const y = 600 - positions[particleIndex + 1] * 400; // Invert Y and scale
          particles[i].position.set(x, y);
          
          // Adjust alpha based on z position (depth)
          const z = positions[particleIndex + 2];
          particles[i].alpha = Math.max(0.3, Math.min(1, (z + 1) / 2));
        }
      }
    } catch (err: any) {
      error(`Error in animation loop: ${err}`);
    }
  };

  onMount(() => {
    info('ParticleSimulation component mounted');
  });

  onCleanup(() => {
    // Clean up PixiJS resources
    info('Cleaning up PixiJS resources');
    if (app) {
      app.ticker.remove(animate as any);
      app.destroy();
    }
  });

  return (
    <div class="particle-simulation">
      <div class="fps-counter">FPS: {fps()}</div>
      <div 
        ref={(el) => {
          container = el;
          if (el) {
            info('Container ref assigned, initializing PixiJS');
            initializePixi(el);
          }
        }} 
        class="pixi-container" 
      />
    </div>
  );
};

export default ParticleSimulation;