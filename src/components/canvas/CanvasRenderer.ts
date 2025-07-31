// Import specific components from pixi.js using named imports (PixiJS v8 style)
import { Application, Container, Graphics } from 'pixi.js';
// Import WASM adapter
import { initializeWasmSimulation, createObjects, updateTransformations, clearObjects, getObjectCount } from './WasmAdapter';
import { CanvasSimulation } from 'wasm/canvas_sim';

/**
 * Simplified Canvas Renderer using PixiJS v8
 * Focused only on rendering performance without metrics collection
 */
export class CanvasRenderer {
  // Core rendering components
  private app: Application;
  private stage: Container;
  private objects: Map<number, Graphics> = new Map();
  private wasmSimulation: CanvasSimulation | null = null;
  private isAnimating: boolean = false;
  
  // Stats
  private objectCount: number = 0;
  private fps: number = 0;
  // Much smaller shape sizes with more variety (1/4th the previous size)
  private shapeSizes = [2, 3, 4, 5, 6, 7, 8, 10, 12]; // Different sizes for variety
  // More muted, professional colors
  private colors = [
    0x3498db, // Blue
    0x2ecc71, // Green
    0x9b59b6, // Purple
    0x34495e, // Dark Blue
    0x16a085, // Teal
    0x7f8c8d  // Gray
  ];
  
  constructor(private containerElement: HTMLDivElement) {
    console.log('CanvasRenderer: Constructor starting...');
    
    // Create PixiJS v8 Application without initializing yet
    this.app = new Application();
    console.log('PixiJS Application created');
    
    // Initialize container for shapes
    this.stage = new Container();
  }
  
  /**
   * Initialize the PixiJS application (required for PixiJS v8)
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('Initializing PixiJS application...');
      
      // Initialize WASM first
      try {
        this.wasmSimulation = await initializeWasmSimulation();
        if (this.wasmSimulation) {
          console.log('WASM simulation initialized');
        } else {
          console.warn('WASM simulation creation failed, using JS-only mode');
        }
      } catch (wasmErr) {
        console.error('WASM initialization failed:', wasmErr);
        // Continue anyway - we'll fall back to JS-only mode
      }
      
      // Initialize PixiJS app (in v8 this returns a promise)
      await this.app.init({
        backgroundAlpha: 1,
        background: 0x121212, // Darker background for better visibility
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        width: window.innerWidth,
        height: window.innerHeight,
        autoDensity: true, // For proper scaling with high DPI displays
        powerPreference: 'high-performance', // Request high performance GPU
      });
      
      console.log('PixiJS application initialized, canvas available:', !!this.app.canvas);
      
      if (!this.app.canvas) {
        throw new Error('PixiJS canvas is not available after initialization');
      }
      
      // Configure stage
      this.stage.sortableChildren = true;
      this.app.stage.addChild(this.stage);
      
      // Append canvas to container
      this.containerElement.appendChild(this.app.canvas);
      console.log('Canvas appended to container');
      
      // Set up resize handler
      window.addEventListener('resize', this.onResize.bind(this));
      
      // Force an initial render
      this.app.render();
      
      return true;
    } catch (err) {
      console.error('Error initializing CanvasRenderer:', err);
      return false;
    }
  }
  
  /**
   * Add a specific number of objects to the canvas
   */
  addObjects(count: number): void {
    console.log(`Adding ${count} objects...`);
    
    // Generate random objects
    for (let i = 0; i < count; i++) {
      const id = Date.now() + i;
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      // Get a random size that's about 1/4 of what we had before
      const size = Math.random() * 10 + 2; // Random size between 2-12 pixels
      const colorIndex = Math.floor(Math.random() * this.colors.length);
      const color = this.colors[colorIndex];
      // Add more variety in shapes
      const shapeType = Math.random();
      const isCircle = shapeType < 0.4; // 40% circles
      const isRectangle = shapeType < 0.8; // 40% rectangles
      // remaining 20% will be polygons
      
      // Create shape
      const graphic = new Graphics();
      graphic.beginFill(color);
      
      if (isCircle) {
        // Circle
        graphic.drawCircle(0, 0, size);
      } else if (isRectangle) {
        // Rectangle - sometimes make them non-square
        const width = size * (Math.random() * 0.5 + 0.75); // width between 75% and 125% of size
        const height = size * (Math.random() * 0.5 + 0.75); // height between 75% and 125% of size
        graphic.drawRect(-width / 2, -height / 2, width, height);
      } else {
        // Polygon (triangle, pentagon, hexagon)
        const sides = Math.floor(Math.random() * 3) + 3; // 3-5 sides
        const points = [];
        for (let i = 0; i < sides; i++) {
          const angle = (i / sides) * Math.PI * 2;
          points.push(Math.cos(angle) * size);
          points.push(Math.sin(angle) * size);
        }
        graphic.drawPolygon(points);
      }
      
      graphic.endFill();
      
      // Set position
      graphic.x = x;
      graphic.y = y;
      
      // Add to stage
      this.stage.addChild(graphic);
      
      // Add to objects map
      this.objects.set(id, graphic);
      
      // Add to WASM simulation if available - aggregate for batch addition
      // The actual addition to WASM happens after the loop for better performance
      if (this.wasmSimulation) {
        // Individual additions handled in batch later
      }
    }
    
    // Add objects to WASM in batch if available (more efficient)
    if (this.wasmSimulation) {
      try {
        // Use stress mode which uses more physics and varied object types
        // Using batch_create_test_objects which has better physics integration
        // Balance of rectangles, circles, and complex paths
        const rectangleCount = Math.floor(count * 0.4);
        const circleCount = Math.floor(count * 0.4);
        const complexPathCount = count - rectangleCount - circleCount;
        
        const totalCreated = this.wasmSimulation.batch_create_test_objects(
          rectangleCount, 
          circleCount,
          complexPathCount
        );
        
        console.log(`Added ${totalCreated} objects to WASM simulation:`);
        console.log(`- ${rectangleCount} rectangles`);
        console.log(`- ${circleCount} circles`);
        console.log(`- ${complexPathCount} complex paths`);
        
        // Set canvas size in WASM simulation
        this.wasmSimulation.set_canvas_size(window.innerWidth, window.innerHeight);
      } catch (err) {
        console.error(`Failed to add objects to WASM simulation:`, err);
      }
    }
    
    // Update count
    this.objectCount += count;
    console.log(`Total objects: ${this.objectCount}`);
    
    // Start render loop if not already started
    this.startRenderLoop();
  }
  
  /**
   * Clear all objects from the canvas
   */
  clearObjects(): void {
    console.log('Clearing all objects...');
    
    // Remove all children from the stage
    this.stage.removeChildren();
    
    // Clear objects map
    this.objects.clear();
    
    // Clear WASM simulation objects if available
    if (this.wasmSimulation) {
      try {
        this.wasmSimulation.clear_objects();
      } catch (err) {
        console.error('Failed to clear WASM simulation objects:', err);
      }
    }
    
    // Reset count
    this.objectCount = 0;
    console.log('All objects cleared');
  }
  
  /**
   * Get current object count
   */
  getObjectCount(): number {
    return this.objectCount;
  }
  
  /**
   * Get current FPS
   */
  getFPS(): number {
    return Math.round(this.fps);
  }
  
  /**
   * Toggle animation state
   */
  toggleAnimation(): boolean {
    this.isAnimating = !this.isAnimating;
    console.log(`Animation ${this.isAnimating ? 'enabled' : 'disabled'}`);
    
    // Make sure the ticker is running when animation is enabled
    if (this.isAnimating) {
      if (!this.app.ticker.started) {
        this.app.ticker.start();
      }
      
      // Make sure our render callback is added
      this.app.ticker.remove(this.render, this);
      this.app.ticker.add(this.render, this);
      console.log('Animation render callback added');
    }
    
    // Force a render even if animation is stopped
    this.app.render();
    
    return this.isAnimating;
  }
  
  /**
   * Start render loop
   */
  private startRenderLoop(): void {
    console.log('Starting/updating render loop...');
    
    // Always make sure ticker is running
    if (!this.app.ticker.started) {
      console.log('Starting ticker');
      this.app.ticker.start();
    } else {
      console.log('Ticker already running');
    }
    
    // Clean up any previous render callbacks to avoid duplicates
    this.app.ticker.remove(this.render, this);
    
    // Add render callback
    this.app.ticker.add(this.render, this);
    
    // Force an initial render
    this.app.render();
    
    console.log('Render loop updated');
  }
  
  /**
   * Main render function
   */
  private render = (ticker: any): void => {
    try {
      // Calculate delta time
      const deltaTime = ticker.deltaTime / 60;
      
      // Update objects if animating
      if (this.isAnimating) {
        this.updateObjects(deltaTime);
      }
      
      // Render stage
      this.app.render();
      
      // Update FPS counter
      this.fps = ticker.FPS;
      
      // Log FPS occasionally
      if (Math.floor(performance.now()) % 5000 < 20) {
        console.log(`FPS: ${Math.round(this.fps)}, Objects: ${this.objectCount}`);
      }
    } catch (err) {
      console.error('Error in render loop:', err);
    }
  }
  
  /**
   * Update object positions and properties
   */
  private updateObjects(deltaTime: number): void {
    // Use WASM for updates if available
    if (this.wasmSimulation) {
      try {
        // Use the "stress" animation mode which includes all physics effects
        // This gives us rotation, scaling, and movement with physics
        this.wasmSimulation.update_transformations(deltaTime, "stress");
        
        // In a full implementation, we would get object data from WASM to update PixiJS objects
        // For a more complete implementation, we could do:
        // const objectData = this.wasmSimulation.get_object_data();
        // And then update PixiJS objects from this data
      } catch (err) {
        console.error('Error updating WASM simulation:', err);
      }
    }
    
    // Get the current time for animations
    const time = Date.now() / 1000;
    
    // Enhanced JS animation with size pulsing
    this.objects.forEach((graphic, id) => {
      // Rotation animation
      graphic.rotation += 0.01 * deltaTime;
      
      // Size pulsing animation (between 0.75x and 1.25x of original size)
      const pulseFactor = 0.25 * Math.sin(time * 2 + id * 0.1) + 1.0;
      graphic.scale.set(pulseFactor, pulseFactor);
      
      // Bounce movement
      graphic.x += Math.sin(time + id * 0.05) * deltaTime * 1.5;
      graphic.y += Math.cos(time * 0.8 + id * 0.05) * deltaTime * 1.5;
      
      // Keep objects in bounds
      if (graphic.x < 0) graphic.x = window.innerWidth;
      if (graphic.x > window.innerWidth) graphic.x = 0;
      if (graphic.y < 0) graphic.y = window.innerHeight;
      if (graphic.y > window.innerHeight) graphic.y = 0;
    });
  }
  
  /**
   * Handle window resize
   */
  private onResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Resize renderer
    this.app.renderer.resize(width, height);
    console.log(`Canvas resized to: ${width}x${height}`);
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    // Remove event listeners
    window.removeEventListener('resize', this.onResize.bind(this));
    
    // Stop ticker
    if (this.app.ticker) {
      this.app.ticker.remove(this.render, this);
      this.app.ticker.stop();
    }
    
    // Clear objects
    this.clearObjects();
    
    // Destroy app
    this.app.destroy();
    
    console.log('Canvas renderer destroyed and resources cleaned up');
  }
}
