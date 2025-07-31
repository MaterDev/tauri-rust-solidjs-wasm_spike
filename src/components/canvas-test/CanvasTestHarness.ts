import { info, error } from '@tauri-apps/plugin-log';
import { Application, Container, Graphics, FederatedPointerEvent } from 'pixi.js';

// Import WASM module for canvas object management
import init, { CanvasSimulation } from '../../../src-tauri/canvas_sim/pkg';

/**
 * Canvas object types for testing different rendering scenarios
 */
export enum ObjectType {
  Rectangle = 'rectangle',
  Circle = 'circle',
  ComplexPath = 'complex_path',
  Text = 'text'
}

/**
 * Test modes for different performance scenarios
 */
export enum TestMode {
  Static = 'static',
  Rotating = 'rotating', 
  Scaling = 'scaling',
  Interactive = 'interactive',
  Stress = 'stress'
}

/**
 * Canvas object data structure
 */
interface CanvasObject {
  id: number;
  type: ObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  color: number;
  selected: boolean;
  graphic: Graphics;
}

/**
 * Performance metrics tracking
 */
interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  objectCount: number;
  memoryUsage: number;
  interactionLatency: number;
}

/**
 * Canvas Test Harness for performance testing PixiJS + WASM
 * Simulates realistic canvas app scenarios like Figma/comic creation tools
 */
export class CanvasTestHarness {
  private app: Application;
  private container: Container;
  private objects: Map<number, CanvasObject> = new Map();
  private wasmSimulation: CanvasSimulation | null = null;
  private testMode: TestMode = TestMode.Static;
  private isInitialized: boolean = false;
  
  // Performance tracking
  private lastRenderTime: number = 0;
  private frameStartTime: number = 0;
  
  // Interaction tracking
  private selectedObjects: Set<number> = new Set();
  private isDragging: boolean = false;
  private dragStartPos: { x: number; y: number } = { x: 0, y: 0 };
  
  constructor(private containerElement: HTMLDivElement) {
    this.app = new Application();
    this.container = new Container();
  }

  /**
   * Initialize the canvas test harness
   */
  async initialize(): Promise<boolean> {
    try {
      info('Initializing Canvas Test Harness...');
      
      // Initialize PixiJS application
      await this.app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0xf0f0f0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
      });
      
      // Add canvas to DOM
      this.containerElement.appendChild(this.app.canvas);
      
      // Set up main container
      this.app.stage.addChild(this.container);
      
      // Initialize WASM module
      await this.initializeWasm();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Start render loop
      this.app.ticker.add(this.render.bind(this));
      
      this.isInitialized = true;
      info('Canvas Test Harness initialized successfully');
      return true;
      
    } catch (err: any) {
      error(`Failed to initialize Canvas Test Harness: ${err}`);
      return false;
    }
  }

  /**
   * Initialize WASM module for canvas object management
   */
  private async initializeWasm(): Promise<void> {
    try {
      info('Initializing WASM canvas simulation...');
      await init();
      this.wasmSimulation = new CanvasSimulation();
      info('WASM canvas simulation initialized');
    } catch (err: any) {
      error(`Failed to initialize WASM: ${err}`);
      throw err;
    }
  }

  /**
   * Set up event listeners for interaction testing
   */
  private setupEventListeners(): void {
    // Make stage interactive
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;
    
    // Mouse/pointer events for interaction testing
    this.app.stage.on('pointerdown', this.onPointerDown.bind(this));
    this.app.stage.on('pointermove', this.onPointerMove.bind(this));
    this.app.stage.on('pointerup', this.onPointerUp.bind(this));
    
    // Window resize handling
    window.addEventListener('resize', this.onResize.bind(this));
  }

  /**
   * Set the number of objects to render
   */
  async setObjectCount(count: number): Promise<void> {
    if (!this.isInitialized) return;
    
    info(`Setting object count to ${count}`);
    
    // Clear existing objects
    this.clearObjects();
    
    // Create new objects
    await this.createObjects(count);
    
    info(`Created ${count} canvas objects`);
  }

  /**
   * Set the test mode for different performance scenarios
   */
  async setTestMode(mode: string): Promise<void> {
    this.testMode = mode as TestMode;
    info(`Test mode set to: ${mode}`);
    
    // Reset object states based on new mode
    this.resetObjectStates();
  }

  /**
   * Create canvas objects for testing
   */
  private async createObjects(count: number): Promise<void> {
    const objectTypes = Object.values(ObjectType);
    const colors = [0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4, 0xFECA57, 0xFF9FF3, 0x54A0FF];
    
    for (let i = 0; i < count; i++) {
      const objectType = objectTypes[i % objectTypes.length];
      const color = colors[i % colors.length];
      
      // Generate random position within canvas bounds
      const x = Math.random() * (this.app.screen.width - 100) + 50;
      const y = Math.random() * (this.app.screen.height - 100) + 50;
      
      // Create graphics object
      const graphic = new Graphics();
      this.drawObject(graphic, objectType, color);
      
      // Create canvas object data
      const canvasObject: CanvasObject = {
        id: i,
        type: objectType,
        x,
        y,
        width: 50 + Math.random() * 50,
        height: 50 + Math.random() * 50,
        rotation: 0,
        scaleX: 0.5 + Math.random() * 1.0,
        scaleY: 0.5 + Math.random() * 1.0,
        color,
        selected: false,
        graphic
      };
      
      // Set initial transform
      graphic.x = x;
      graphic.y = y;
      graphic.scale.set(canvasObject.scaleX, canvasObject.scaleY);
      
      // Make interactive for selection testing
      graphic.eventMode = 'static';
      graphic.cursor = 'pointer';
      graphic.on('pointerdown', (event) => this.onObjectPointerDown(event, canvasObject.id));
      
      // Add to container and tracking
      this.container.addChild(graphic);
      this.objects.set(i, canvasObject);
    }
  }

  /**
   * Draw different object types
   */
  private drawObject(graphic: Graphics, type: ObjectType, color: number): void {
    graphic.clear();
    
    switch (type) {
      case ObjectType.Rectangle:
        graphic.rect(0, 0, 60, 40);
        break;
      case ObjectType.Circle:
        graphic.circle(30, 30, 25);
        break;
      case ObjectType.ComplexPath:
        // Draw a more complex shape (star)
        graphic.star(30, 30, 5, 25, 15);
        break;
      case ObjectType.Text:
        // For now, draw a rounded rectangle to represent text
        graphic.roundRect(0, 0, 80, 30, 5);
        break;
    }
    
    // In PixiJS v8, fill() must be called after drawing the shapes
    graphic.fill(color);
  }

  /**
   * Main render loop
   */
  private render(): void {
    this.frameStartTime = performance.now();
    
    // Update objects based on test mode
    this.updateObjects();
    
    // Calculate render time
    this.lastRenderTime = performance.now() - this.frameStartTime;
  }

  /**
   * Update objects based on current test mode
   */
  private updateObjects(): void {
    if (!this.wasmSimulation) return;
    
    switch (this.testMode) {
      case TestMode.Rotating:
        this.updateRotatingObjects();
        break;
      case TestMode.Scaling:
        this.updateScalingObjects();
        break;
      case TestMode.Stress:
        this.updateStressTest();
        break;
      // Static and Interactive modes don't need continuous updates
    }
  }

  /**
   * Update objects with rotation animation
   */
  private updateRotatingObjects(): void {
    const deltaTime = this.app.ticker.deltaMS / 1000;
    
    this.objects.forEach((obj) => {
      obj.rotation += deltaTime * 0.5; // Rotate at 0.5 rad/sec
      obj.graphic.rotation = obj.rotation;
    });
  }

  /**
   * Update objects with scaling animation
   */
  private updateScalingObjects(): void {
    const time = performance.now() * 0.001;
    
    this.objects.forEach((obj, id) => {
      const scale = 0.5 + 0.3 * Math.sin(time + id * 0.1);
      obj.scaleX = scale;
      obj.scaleY = scale;
      obj.graphic.scale.set(scale, scale);
    });
  }

  /**
   * Update objects for stress test (rotation + scaling + movement)
   */
  private updateStressTest(): void {
    const deltaTime = this.app.ticker.deltaMS / 1000;
    const time = performance.now() * 0.001;
    
    this.objects.forEach((obj, id) => {
      // Rotation
      obj.rotation += deltaTime * 0.3;
      obj.graphic.rotation = obj.rotation;
      
      // Scaling
      const scale = 0.4 + 0.2 * Math.sin(time + id * 0.1);
      obj.graphic.scale.set(scale, scale);
      
      // Movement
      const moveRadius = 20;
      obj.graphic.x = obj.x + moveRadius * Math.cos(time * 0.5 + id * 0.2);
      obj.graphic.y = obj.y + moveRadius * Math.sin(time * 0.5 + id * 0.2);
    });
  }

  /**
   * Handle pointer down events
   */
  private onPointerDown(event: FederatedPointerEvent): void {
    if (this.testMode !== TestMode.Interactive) return;
    
    this.isDragging = true;
    this.dragStartPos = { x: event.globalX, y: event.globalY };
  }

  /**
   * Handle pointer move events
   */
  private onPointerMove(event: FederatedPointerEvent): void {
    if (this.testMode !== TestMode.Interactive || !this.isDragging) return;
    
    // Update selected objects positions
    const deltaX = event.globalX - this.dragStartPos.x;
    const deltaY = event.globalY - this.dragStartPos.y;
    
    this.selectedObjects.forEach(id => {
      const obj = this.objects.get(id);
      if (obj) {
        obj.graphic.x = obj.x + deltaX;
        obj.graphic.y = obj.y + deltaY;
      }
    });
  }

  /**
   * Handle pointer up events
   */
  private onPointerUp(): void {
    if (this.isDragging) {
      // Update object positions permanently
      this.selectedObjects.forEach(id => {
        const obj = this.objects.get(id);
        if (obj) {
          obj.x = obj.graphic.x;
          obj.y = obj.graphic.y;
        }
      });
    }
    
    this.isDragging = false;
  }

  /**
   * Handle object-specific pointer down
   */
  private onObjectPointerDown(event: FederatedPointerEvent, objectId: number): void {
    event.stopPropagation();
    
    const obj = this.objects.get(objectId);
    if (!obj) return;
    
    // Toggle selection
    if (this.selectedObjects.has(objectId)) {
      this.selectedObjects.delete(objectId);
      obj.selected = false;
      obj.graphic.tint = 0xFFFFFF; // Reset tint
    } else {
      this.selectedObjects.add(objectId);
      obj.selected = true;
      obj.graphic.tint = 0x00FF00; // Green tint for selection
    }
  }

  /**
   * Handle window resize
   */
  private onResize(): void {
    this.app.renderer.resize(window.innerWidth, window.innerHeight);
  }

  /**
   * Reset object states when changing test modes
   */
  private resetObjectStates(): void {
    this.objects.forEach(obj => {
      obj.graphic.rotation = 0;
      obj.graphic.scale.set(obj.scaleX, obj.scaleY);
      obj.graphic.x = obj.x;
      obj.graphic.y = obj.y;
      obj.graphic.tint = 0xFFFFFF;
      obj.selected = false;
    });
    
    this.selectedObjects.clear();
  }

  /**
   * Clear all objects
   */
  private clearObjects(): void {
    this.objects.forEach(obj => {
      this.container.removeChild(obj.graphic);
      obj.graphic.destroy();
    });
    this.objects.clear();
    this.selectedObjects.clear();
  }

  /**
   * Get last render time for performance monitoring
   */
  getLastRenderTime(): number {
    return this.lastRenderTime;
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return {
      fps: this.app.ticker.FPS,
      renderTime: this.lastRenderTime,
      objectCount: this.objects.size,
      memoryUsage: (performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0,
      interactionLatency: 0 // TODO: Implement interaction latency measurement
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    info('Cleaning up Canvas Test Harness...');
    
    // Clear objects
    this.clearObjects();
    
    // Remove event listeners
    window.removeEventListener('resize', this.onResize.bind(this));
    
    // Cleanup WASM
    if (this.wasmSimulation) {
      this.wasmSimulation.free();
      this.wasmSimulation = null;
    }
    
    // Destroy PixiJS app
    this.app.destroy(true);
    
    info('Canvas Test Harness cleanup complete');
  }
}
