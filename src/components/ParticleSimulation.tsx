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
  
  // Function to update particle count without disrupting the simulation
  const updateParticleCount = async (delta: number) => {
    const newCount = Math.max(1000, particleCount() + delta);
    setParticleCount(newCount);
    setStatus(`Updating particle count to ${newCount}...`);
    info(`Updating particle count to ${newCount}`);
    
    // Only update if WASM is already initialized and we have a simulation
    if (wasmInitialized && wasmModule && simulation && particleContainer) {
      try {
        const currentCount = simulation.get_count();
        
        if (newCount > currentCount) {
          // Need to add more particles
          const additionalCount = newCount - currentCount;
          info(`Adding ${additionalCount} new particles`);
          
          // Create a texture for the particles if needed
          if (!texture && app) {
            const graphics = new Graphics();
            graphics.beginFill(0xffffff);
            graphics.drawCircle(0, 0, 2);
            graphics.endFill();
            texture = app.renderer.extract.texture(graphics);
          }
          
          // Keep existing particles and add new ones
          if (texture) {
            // Add the new particles
            for (let i = 0; i < additionalCount; i++) {
              const particle = new Sprite(texture);
              particle.anchor.set(0.5);
              particleContainer.addChild(particle);
              particles.push(particle);
              
              // Initialize off-screen with transparency
              particle.position.set(-10, -10);
              particle.alpha = 0;
            }
            info(`Added ${additionalCount} new particle sprites, total now: ${particles.length}`);
          }
        } else if (newCount < currentCount) {
          // Need to remove particles
          const removeCount = currentCount - newCount;
          info(`Removing ${removeCount} particles`);
          
          // Remove excess particles (from the end)
          for (let i = 0; i < removeCount && particles.length > 0; i++) {
            const particle = particles.pop();
            if (particle) {
              particle.destroy();
            }
          }
          info(`Removed excess particles, ${particles.length} remaining`);
        }
        
        // Create new simulation with new count
        // Note: We'll keep the current particles' visual properties and just update the simulation
        // This creates a more smooth visual experience even when the underlying simulation changes
        const oldSimulation = simulation;
        simulation = new wasmModule.Simulation(newCount);
        
        // We'll let the simulation start fresh, but keep the current visual state of particles
        // This provides visual continuity even when the simulation state changes
        setStatus(`Particle count updated to ${newCount}`);
      } catch (err: any) {
        error(`Failed to update particle count: ${err}`);
        setStatus(`Error updating particle count: ${err.message || err}`);
      }
    } else {
      info('Simulation not initialized yet, will use new count when initialized');
    }
  };
  
  const [containerRef, setContainerRef] = createSignal<HTMLDivElement | null>(null);
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
      // Initialize PixiJS using the v8 async pattern
      app = new Application();
      await app.init({
        width: 800,
        height: 600,
        backgroundColor: 0x000000,
        antialias: true,
      });
      
      info('PixiJS Application created');

      // In PixiJS v8, the view is accessed as app.canvas
      if (app.canvas) {
        containerElement.appendChild(app.canvas);
      } else {
        error('Canvas is undefined');
        setStatus('Error: Canvas is undefined');
        return;
      }
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
        
        // Create simulation with initial particle count
        const initialCount = particleCount();
        info(`Creating simulation with ${initialCount} particles`);
        setStatus(`Creating simulation with ${initialCount} particles...`);
        simulation = new wasmModule.Simulation(initialCount);
        const actualCount = simulation ? simulation.get_count() : 0;
        info(`Simulation created with ${actualCount} particles`);
        setStatus(`Simulation created with ${actualCount} particles`);
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
      // Use relative path for Vite development compatibility
      wasmModule = await import('../../public/wasm/particle_sim') as any;
      info('WASM module loaded successfully');
      setStatus('WASM module loaded successfully');
      wasmInitialized = true;
      
      // Now that WASM is loaded, if we already have a container ref, initialize PixiJS
      const container = containerRef();
      if (container) {
        info('Container ref exists, initializing PixiJS after WASM load');
        initializePixi(container);
      }
    } catch (err: any) {
      error(`Failed to import WASM module: ${err}`);
      setStatus(`Failed to import WASM module: ${err.message || err}`);
    }
  });
  
  // Effect to trigger initialization when both container and WASM module are ready
  createEffect(() => {
    const container = containerRef();
    if (container && wasmInitialized && !app) {
      info('Container and WASM both ready, initializing PixiJS');
      initializePixi(container);
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
      <div class="fps-counter">FPS: {fps()} | Particles: {particleCount()}</div>
      <div class="controls" style={{
        "position": "absolute",
        "top": "10px",
        "right": "10px",
        "display": "flex",
        "gap": "10px"
      }}>
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
          -1000
        </button>
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
          +1000
        </button>
      </div>
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
          info('Container ref assigned');
          setContainerRef(el);
        }} 
        class="pixi-container" 
        style={{ width: '800px', height: '600px', margin: '0 auto', display: 'block' }}
      />
    </div>
  );
};

export default ParticleSimulation;