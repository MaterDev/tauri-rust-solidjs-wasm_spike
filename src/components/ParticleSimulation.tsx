import { Component, onCleanup, onMount, createSignal, createEffect } from 'solid-js';
import { info, error, debug } from '@tauri-apps/plugin-log';

// Import refactored components and services
import StatusDisplay from './particle-system/StatusDisplay';
import ParticleControls from './particle-system/ParticleControls';
import FpsChart from './particle-system/FpsChart';
import { PixiRenderer } from './particle-system/PixiRenderer';
// Import WasmParticleSystem instead of ParticleSystem
import { WasmParticleSystemV2 } from './particle-system/WasmParticleSystemV2';
import { createEmitterConfig, updateEmitterPosition } from './particle-system/EmitterConfig';

const ParticleSimulation: Component = () => {
  const [fps, setFps] = createSignal<number>(0);
  const [status, setStatus] = createSignal<string>('Initializing...');
  const [particleCount, setParticleCount] = createSignal<number>(5000);
  const [fpsHistory, setFpsHistory] = createSignal<number[]>([]);
  
  // Maximum number of FPS samples to keep in history
  const MAX_FPS_HISTORY = 100;
  
  // Initialize window dimensions
  let windowWidth = window.innerWidth;
  let windowHeight = window.innerHeight;
  
  // Create renderer and system instances
  let renderer = new PixiRenderer();
  let particleSystem: WasmParticleSystemV2 | null = null;
  let emitterConfig = createEmitterConfig(windowWidth, windowHeight);
  
  // Animation tracking
  let lastTime = performance.now();
  let frameCount = 0;
  
  // Function to update particle count and update the WASM simulation
  const updateParticleCount = async (delta: number) => {
    const newCount = Math.max(1000, particleCount() + delta);
    setParticleCount(newCount);
    setStatus(`Updating particle count to ${newCount}...`);
    info(`Updating particle count to ${newCount}`);
    
    // Update the fountain emission rate with the new count
    if (particleSystem) {
      try {
        await particleSystem.setParticleCount(newCount);
        const stats = particleSystem.getFountainStats();
        setStatus(`Fountain updated: ${newCount} particles over 5s = ${stats.emissionRate.toFixed(1)} particles/sec`);
      } catch (err: any) {
        error(`Failed to update fountain emission: ${err}`);
        setStatus(`Error updating fountain: ${err.message}`);
      }
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
      
      // Add to FPS history for the chart
      const history = [...fpsHistory()];
      history.push(currentFps);
      // Keep history limited to MAX_FPS_HISTORY entries
      if (history.length > MAX_FPS_HISTORY) {
        history.shift(); // Remove oldest entry
      }
      setFpsHistory(history);
      
      debug(`Current FPS: ${currentFps}`);
      frameCount = 0;
      lastTime = now;
    }
    
    try {
      // Update particle system if it exists
      if (particleSystem) {
        particleSystem.update(deltaMS / 1000); // WasmParticleSystem uses seconds, not milliseconds
      
        // Update status with fountain statistics and FPS
        if (frameCount % 60 === 0) { // Update once per second
          const activeCount = particleSystem.getActiveParticleCount();
          const stats = particleSystem.getFountainStats();
          setStatus(`Active: ${activeCount} | Fountain: ${stats.targetCount} particles/5s (${stats.emissionRate.toFixed(1)}/s) | FPS: ${fps()}`);
        }
      }
    } catch (err: any) {
      error(`Error in animation loop: ${err}`);
    }
  };

  // Handle window resize events
  const handleResize = () => {
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;
    
    // Resize the renderer
    renderer.resize(windowWidth, windowHeight);
    
    // Update emitter configuration with new window dimensions
    if (particleSystem) {
      const newConfig = createEmitterConfig(windowWidth, windowHeight);
      particleSystem.updateEmitterConfig(newConfig);
      info(`Updated emitter config for window resize: ${windowWidth}x${windowHeight}`);
    }
  };

  // Effect to handle particle count changes from UI controls
  createEffect(() => {
    const count = particleCount();
    // Only update if we have a meaningful change and the system is initialized
    if (particleSystem && particleSystem.getActiveParticleCount() !== count && count > 0) {
      updateParticleCount(count - particleCount()); // Update with the difference
    }
  });

  // Initialize the renderer and particle system
  const initializePixi = async (containerElement: HTMLDivElement) => {
    try {
      setStatus('Initializing PixiJS...');
      info('Initializing PixiJS...');
      
      // Initialize the PixiJS renderer
      const success = await renderer.initialize(containerElement, windowWidth, windowHeight);
      if (!success) {
        setStatus('Failed to initialize PixiJS');
        return;
      }
      
      // Make sure renderer and container are initialized
      if (renderer.container && renderer.texture) {
        // Create WASM-only particle system v2 with emitter config
        particleSystem = new WasmParticleSystemV2(renderer.texture, emitterConfig);
        
        try {
          // Initialize the WASM particle system with the particle count
          setStatus('Initializing WebAssembly particle system...');
          const success = await particleSystem.initialize(particleCount());
          if (!success) {
            setStatus('Failed to initialize WebAssembly particle system');
            return;
          }
          
          // Add particle container to the PixiJS stage
          renderer.container.addChild(particleSystem.getContainer());
          
          // Start animation loop
          info('Starting animation loop');
          lastTime = performance.now();
          frameCount = 0;
          renderer.addTickerCallback(animate);
          info('Animation loop started with WebAssembly particle system');
          
          const stats = particleSystem.getFountainStats();
          setStatus(`Ready! Fountain: ${stats.targetCount} particles/5s (${stats.emissionRate.toFixed(1)}/s) | WebAssembly powered`);
        } catch (err: any) {
          error(`Error initializing WebAssembly particle system: ${err}`);
          setStatus(`WebAssembly Error: ${err.message}`);
        }
      }
    } catch (err: any) {
      error(`Error initializing particle simulation: ${err}`);
      setStatus(`Error: ${err.message}`);
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
    
    // Clean up renderer
    renderer.cleanup();
    
    // Clean up particle system
    if (particleSystem) {
      particleSystem.cleanup();
      particleSystem = null;
    }
    
    info('Particle simulation cleanup complete');
  });

  return (
    <div class="particle-simulation">
      {/* Status Display Component */}
      <StatusDisplay 
        fps={fps()} 
        particleCount={particleCount()} 
        status={status()} 
      />
      
      {/* Particle Controls Component */}
      <ParticleControls onUpdateParticleCount={updateParticleCount} />
      
      {/* FPS Chart Component */}
      <FpsChart 
        fpsHistory={fpsHistory()} 
        maxFpsHistory={MAX_FPS_HISTORY} 
      />
      
      {/* Pixi Container */}
      <div 
        ref={(el) => {
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
      />
    </div>
  );
};

export default ParticleSimulation;