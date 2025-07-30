import { Component, onCleanup, onMount, createSignal } from 'solid-js';
import { Application, Container, Graphics, Sprite, Ticker } from 'pixi.js';
import { info, error, debug } from '@tauri-apps/plugin-log';

// Import WASM using dynamic import - will be resolved by Vite
// Using dynamic import for browser compatibility
let wasmModule: any = null;
let wasmInitialized = false;

const ParticleSimulation: Component = () => {
  const [fps, setFps] = createSignal<number>(0);
  const [status, setStatus] = createSignal<string>('Initializing...');
  
  let container: HTMLDivElement | null = null;
  let app: Application | null = null;
  let particleContainer: Container | null = null;
  let particles: Sprite[] = [];
  let simulation: { tick: () => Float32Array; get_count: () => number } | null = null;
  let texture: any = null;
  let lastTime = 0;
  let frameCount = 0;

  const initializePixi = async (containerElement: HTMLDivElement) => {
    setStatus('Initializing PixiJS...');
    info('Initializing PixiJS...');
    
    // Wait for WASM to be initialized
    if (!wasmInitialized) {
      setStatus('Waiting for WASM module to initialize...');
      await new Promise<void>((resolve) => {
        const checkWasm = () => {
          if (wasmInitialized) {
            resolve();
          } else {
            setTimeout(checkWasm, 100);
          }
        };
        checkWasm();
      });
    }
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

      // Initialize WASM module if it's loaded
      if (!wasmModule) {
        error('WASM module not loaded');
        setStatus('Error: WASM module not loaded');
        return;
      }
      
      try {
        setStatus('Initializing WASM module...');
        info('Initializing WASM module...');
        
        // Initialize the WASM module
        await wasmModule.default();
        info('WASM module initialized');
        setStatus('WASM module initialized');
        
        // Create simulation with 5000 particles
        info('Creating simulation with 5000 particles');
        setStatus('Creating simulation with 5000 particles...');
        simulation = new wasmModule.Simulation(5000);
        const particleCount = simulation ? simulation.get_count() : 0;
        info(`Simulation created with ${particleCount} particles`);
        setStatus(`Simulation created with ${particleCount} particles`);
      } catch (err: any) {
        error(`Failed to initialize WASM or create simulation: ${err}`);
        setStatus(`Error: ${err.message || err}`);
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

  onMount(async () => {
    info('ParticleSimulation component mounted');
    setStatus('Loading WASM module...');
    try {
      // Dynamically import the WASM module
      wasmModule = await import('../../public/wasm/particle_sim');
      info('WASM module loaded successfully');
      setStatus('WASM module loaded successfully');
      wasmInitialized = true;
    } catch (err: any) {
      error(`Failed to import WASM module: ${err}`);
      setStatus(`Failed to import WASM module: ${err.message || err}`);
    }
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
      <div class="status-message" style={{
        "position": "absolute",
        "top": "50px",
        "left": "10px",
        "color": "white",
        "background-color": "rgba(0,0,0,0.5)",
        "padding": "5px",
        "border-radius": "3px",
        "font-size": "12px",
        "z-index": 100
      }}>
        Status: {status()}
      </div>
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