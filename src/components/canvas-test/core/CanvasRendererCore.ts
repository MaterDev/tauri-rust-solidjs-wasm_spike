// Import specific components from pixi.js using named imports (PixiJS v8 style)
import { Application, Container, FederatedPointerEvent, Graphics } from 'pixi.js';
// Import WASM simulation with init function
import initWasm, { CanvasSimulation } from 'wasm/canvas_sim';
import { info, error } from '@tauri-apps/plugin-log';
import { ObjectType, TestMode, CanvasObject } from '../types/CanvasTypes';
import { CanvasObjectFactory } from '../factories/CanvasObjectFactory';
import { InteractionHandler } from '../handlers/InteractionHandler';
import { AnimationControllers } from '../controllers/AnimationControllers';
import { PerformanceMonitor } from '../monitoring/PerformanceMonitor';

/**
 * Core rendering and management class for Canvas Test Harness
 */
export class CanvasRendererCore {
  private app: Application;
  private stage: Container;
  private objects: Map<number, CanvasObject> = new Map();
  private testMode: TestMode = TestMode.Static;
  private wasmSimulation: CanvasSimulation | null = null;
  
  // Modules
  private objectFactory: CanvasObjectFactory;
  private interactionHandler: InteractionHandler;
  private animationControllers: AnimationControllers;
  private performanceMonitor: PerformanceMonitor;
  
  constructor(private containerElement: HTMLDivElement, wasmSimulation: CanvasSimulation | null = null) {
    // Use PixiJS v8 Application setup with correct options
    this.app = new Application({
      background: '#f0f0f0',
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      width: window.innerWidth,
      height: window.innerHeight,
      autoDensity: true, // For proper scaling with high DPI displays
      powerPreference: 'high-performance' // Request high performance GPU
    });
    
    this.stage = new Container();
    this.app.stage.addChild(this.stage);
    
    // Add canvas to container - using app.canvas for PixiJS v8
    this.containerElement.appendChild(this.app.canvas);
    
    // Store WASM simulation reference
    this.wasmSimulation = wasmSimulation;
    
    // Initialize modules
    this.objectFactory = new CanvasObjectFactory(this.stage);
    this.interactionHandler = new InteractionHandler(this.objects);
    this.animationControllers = new AnimationControllers(this.objects);
    this.performanceMonitor = new PerformanceMonitor();
    
    // Set up interaction event listeners
    this.setupEventListeners();
    
    // Set up resize handling
    window.addEventListener('resize', this.onResize.bind(this));
  }
  
  /**
   * Set up event listeners for interaction testing
   */
  private setupEventListeners(): void {
    // Make stage interactive
    this.app.stage.eventMode = 'static';
    
    // Set hitArea - in PixiJS v8, need to use correct bounds
    this.app.stage.hitArea = this.app.screen;
    
    // Mouse/pointer events for interaction testing
    this.app.stage.on('pointerdown', this.onPointerDown.bind(this));
    this.app.stage.on('pointermove', this.onPointerMove.bind(this));
    this.app.stage.on('pointerup', this.onPointerUp.bind(this));
  }
  
  /**
   * Handle pointer down events
   */
  private onPointerDown(event: FederatedPointerEvent): void {
    this.interactionHandler.onPointerDown(event);
  }
  
  /**
   * Handle pointer move events
   */
  private onPointerMove(event: FederatedPointerEvent): void {
    this.interactionHandler.onPointerMove(event);
  }
  
  /**
   * Handle pointer up events
   */
  private onPointerUp(event: FederatedPointerEvent): void {
    // InteractionHandler.onPointerUp doesn't need the event parameter
    this.interactionHandler.onPointerUp();
  }
  
  /**
   * Start the render loop
   */
  /**
   * Initialize the WASM module
   */
  async initializeWasm(): Promise<boolean> {
    try {
      info('Initializing WASM module in CanvasRendererCore...');
      await initWasm();
      info('WASM module successfully initialized in CanvasRendererCore');
      return true;
    } catch (err) {
      error(`Failed to initialize WASM module in CanvasRendererCore: ${err}`);
      console.error('WASM initialization error:', err);
      return false;
    }
  }
  
  /**
   * Start the render loop
   */
  startRenderLoop(): void {
    this.app.ticker.add(this.render.bind(this));
  }
  
  /**
   * Main render loop
   */
  private render(): void {
    this.performanceMonitor.startFrame();
    
    // Update objects based on test mode
    this.updateObjects();
    
    // In PixiJS v8, we don't need to call renderer.render manually,
    // as rendering is handled automatically by the ticker
    
    this.performanceMonitor.endFrame();
  }
  
  /**
   * Update objects based on current test mode
   */
  private updateObjects(): void {
    // Get delta time in seconds
    const deltaTime = this.app.ticker.deltaMS / 1000;
    
    switch (this.testMode) {
      case TestMode.Rotating:
        this.animationControllers.updateRotatingObjects(deltaTime);
        break;
      case TestMode.Scaling:
        this.animationControllers.updateScalingObjects();
        break;
      case TestMode.Stress:
        this.animationControllers.updateStressTest(deltaTime);
        break;
      // Static and Interactive modes don't need continuous updates
    }
  }
  
  /**
   * Set test mode
   */
  setTestMode(mode: TestMode): void {
    this.testMode = mode;
    info(`Test mode set to: ${mode}`);
    
    // Reset object states when changing mode
    this.resetObjectStates();
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
    
    this.interactionHandler.clearSelection();
  }
  
  /**
   * Get current test mode
   */
  getTestMode(): TestMode {
    return this.testMode;
  }
  
  /**
   * Clear all objects
   */
  clearObjects(): void {
    this.objectFactory.clearObjects(this.objects);
    this.objects.clear();
  }
  
  /**
   * Create objects
   */
  async createObjects(count: number): Promise<boolean> {
    try {
      // Clear previous objects
      this.clearObjects();
      
      info(`Creating ${count} canvas objects...`);
      
      // Create new objects
      this.objects = await this.objectFactory.createObjects(
        count,
        (event, id) => this.interactionHandler.onObjectPointerDown(event, id)
      );
      
      // Update references in other modules
      this.interactionHandler.updateObjectsReference(this.objects);
      this.animationControllers.updateObjectsReference(this.objects);
      
      // Update performance monitor
      this.performanceMonitor.setObjectCount(count);
      
      // If using WASM, add objects to WASM simulation
      if (this.wasmSimulation) {
        this.objects.forEach((obj, id) => {
          try {
            // @ts-ignore - add_object is implemented in WASM but might not have typescript definitions
            this.wasmSimulation.add_object(id, obj.x, obj.y, obj.width, obj.height);
          } catch (err) {
            error(`Failed to add object ${id} to WASM simulation: ${err}`);
          }
        });
      }
      
      return true;
    } catch (err) {
      error(`Failed to create objects: ${err}`);
      return false;
    }
  }
  
  /**
   * Get current performance metrics
   */
  getPerformanceMetrics() {
    return this.performanceMonitor.getPerformanceMetrics(this.app.ticker.FPS);
  }
  
  /**
   * Handle window resize
   */
  private onResize(): void {
    // Resize the application to match the window
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.app.renderer.resize(width, height);
    
    info(`Canvas resized to: ${width}x${height}`);
  }
  
  /**
   * Destroy and clean up resources
   */
  destroy(): void {
    // Remove event listeners
    window.removeEventListener('resize', this.onResize.bind(this));
    
    // Stop ticker
    this.app.ticker.remove(this.render.bind(this));
    
    // Clear objects
    this.clearObjects();
    
    // Destroy app - in PixiJS v8, destroy() doesn't take parameters
    this.app.destroy();
    
    info('Canvas renderer destroyed and resources cleaned up');
  }
}
