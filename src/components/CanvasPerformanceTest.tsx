import { Component, onMount, onCleanup, createSignal } from 'solid-js';
import { CanvasRenderer } from './canvas/CanvasRenderer';
import styles from './CanvasPerformanceTest.module.css';

/**
 * Canvas Performance Test Component
 * Simplified version focused only on rendering performance
 */
const CanvasPerformanceTest: Component = () => {
  // Reference to container div
  let containerRef: HTMLDivElement | undefined;
  
  // Renderer instance
  let renderer: CanvasRenderer | null = null;
  
  // State signals
  const [objectCount, setObjectCount] = createSignal(0);
  const [animating, setAnimating] = createSignal(false);
  const [initialized, setInitialized] = createSignal(false);
  const [fps, setFPS] = createSignal(0);
  
  // FPS update interval
  let fpsInterval: number | undefined;
  
  // Initialize canvas renderer
  onMount(async () => {
    console.log('CanvasPerformanceTest: Component mounted');
    
    if (!containerRef) {
      console.error('Container element not available');
      return;
    }
    
    // Create renderer
    console.log('Creating CanvasRenderer...');
    renderer = new CanvasRenderer(containerRef);
    
    // Initialize renderer
    try {
      const success = await renderer.initialize();
      if (success) {
        console.log('CanvasRenderer initialized successfully');
        setInitialized(true);
        
        // Start FPS update interval
        fpsInterval = window.setInterval(() => {
          if (renderer) {
            setFPS(renderer.getFPS());
          }
        }, 500); // Update twice per second
      } else {
        console.error('Failed to initialize CanvasRenderer');
      }
    } catch (err) {
      console.error('Error initializing renderer:', err);
    }
  });
  
  // Clean up on component unmount
  onCleanup(() => {
    console.log('CanvasPerformanceTest: Component unmounting, cleaning up...');
    
    // Clear FPS interval
    if (fpsInterval) {
      window.clearInterval(fpsInterval);
    }
    
    if (renderer) {
      renderer.destroy();
      renderer = null;
    }
  });
  
  // Add objects handler
  const handleAddObjects = (count: number) => {
    if (!renderer || !initialized()) return;
    
    console.log(`Adding ${count} objects`);
    renderer.addObjects(count);
    setObjectCount(renderer.getObjectCount());
  };
  
  // Clear objects handler
  const handleClearObjects = () => {
    if (!renderer || !initialized()) return;
    
    console.log('Clearing objects');
    renderer.clearObjects();
    setObjectCount(0);
  };
  
  // Toggle animation handler
  const handleToggleAnimation = () => {
    if (!renderer || !initialized()) return;
    
    const isAnimating = renderer.toggleAnimation();
    setAnimating(isAnimating);
  };
  
  return (
    <div class={styles.container}>
      {/* Canvas Container - Full Screen */}
      <div ref={containerRef} class={styles.canvasContainer}></div>
      
      {/* Control Panel */}
      <div class={styles.controls}>
        <div class={styles.objectInfo}>
          <span>Objects: <span class={styles.count}>{objectCount()}</span></span>
          <span class={styles.fpsCounter}>FPS: <span class={styles.count}>{fps()}</span></span>
        </div>
        
        <div class={styles.buttonRow}>
          <button onClick={() => handleAddObjects(500)} class={styles.button}>
            Add 500
          </button>
          <button onClick={() => handleAddObjects(1000)} class={styles.button}>
            Add 1,000
          </button>
          <button onClick={() => handleAddObjects(5000)} class={styles.button}>
            Add 5,000
          </button>
          <button onClick={handleClearObjects} class={styles.clearButton}>
            Clear All
          </button>
        </div>
        
        <div class={styles.buttonRow}>
          <button 
            onClick={handleToggleAnimation} 
            class={`${styles.button} ${animating() ? styles.activeButton : ''}`}>
            {animating() ? 'Stop Animation' : 'Start Animation'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CanvasPerformanceTest;
