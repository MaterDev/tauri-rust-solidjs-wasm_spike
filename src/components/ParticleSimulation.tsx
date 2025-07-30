import { Component, onCleanup, onMount, createSignal, createEffect } from 'solid-js';
import { info, error, debug } from '@tauri-apps/plugin-log';

// Import refactored components and services
import StatusDisplay from './particle-system/StatusDisplay';
import ParticleControls from './particle-system/ParticleControls';
import FpsChart from './particle-system/FpsChart';
import { PixiRenderer } from './particle-system/PixiRenderer';
import { ParticleSystem } from './particle-system/ParticleSystem';
import { createEmitterConfig, updateEmitterPosition } from './particle-system/EmitterConfig';

// Import WASM using dynamic import - will be resolved by Vite
// Using dynamic import for browser compatibility
let wasmModule: any = null;
let wasmInitialized = false;

const ParticleSimulation: Component = () => {
  const [fps, setFps] = createSignal<number>(0);
  const [status, setStatus] = createSignal<string>('Initializing...');
  const [particleCount, setParticleCount] = createSignal<number>(5000);
  const [fpsHistory, setFpsHistory] = createSignal<number[]>([]);
  const [containerRef, setContainerRef] = createSignal<HTMLDivElement | null>(null);
  
  // Maximum number of FPS samples to keep in history
  const MAX_FPS_HISTORY = 100;
  
  // Initialize window dimensions
  let windowWidth = window.innerWidth;
  let windowHeight = window.innerHeight;
  
  // Create renderer and system instances
  let renderer = new PixiRenderer();
  let particleSystem: ParticleSystem | null = null;
  let emitterConfig = createEmitterConfig(windowWidth, windowHeight);
  
  // Animation tracking
  let lastTime = performance.now();
  let frameCount = 0;
  
  // Function to update particle count without disrupting the particle flow
  const updateParticleCount = async (delta: number) => {
    const newCount = Math.max(1000, particleCount() + delta);
    setParticleCount(newCount);
    setStatus(`Updating particle count to ${newCount}...`);
    info(`Updating particle count to ${newCount}`);
    
    // We only need to update the emission rate - the emitter system will handle the rest
    setStatus(`Particle count updated to ${newCount}`);
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
        particleSystem.update(deltaMS, particleCount());
      
        // Update status with active particle count
        if (frameCount % 60 === 0) { // Update once per second
          setStatus(`Active particles: ${particleSystem.getActiveParticleCount()} | FPS: ${fps()}`);
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
    
    // Update emitter position
    updateEmitterPosition(emitterConfig, windowWidth, windowHeight);
    
    // Update emitter config in particle system
    if (particleSystem) {
      particleSystem.updateEmitterConfig(emitterConfig);
    }
    
    info(`Resized renderer to ${windowWidth}x${windowHeight}`);
  };

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
        // Create the particle system
        particleSystem = new ParticleSystem(renderer.container, renderer.texture, emitterConfig);
        
        // Start animation loop
        info('Starting animation loop');
        lastTime = performance.now();
        frameCount = 0;
        renderer.addTickerCallback(animate);
        info('Animation loop started');
        
        setStatus('Ready!');
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