import { info, error } from '@tauri-apps/plugin-log';

// Import WASM module for canvas object management
import init, { CanvasSimulation } from '../../../src-tauri/canvas_sim/pkg';

// Import types from the types module
import { TestMode, PerformanceMetrics } from './types/CanvasTypes';

// Import core renderer
import { CanvasRendererCore } from './core/CanvasRendererCore';

/**
 * Canvas Test Harness V2 for performance testing PixiJS + WASM
 * Modularized version that delegates to specialized components
 */
export class CanvasTestHarness_v2 {
  private renderer: CanvasRendererCore | null = null;
  private wasmSimulation: CanvasSimulation | null = null;
  private container: HTMLDivElement;

  /**
   * Create a new CanvasTestHarness
   */
  constructor(containerElement: HTMLDivElement) {
    this.container = containerElement;
    info('Canvas Test Harness V2 created');
  }

  /**
   * Initialize the test harness
   */
  async initialize(): Promise<boolean> {
    try {
      info('Initializing WASM module...');
      await init();
      this.wasmSimulation = new CanvasSimulation();
      
      info('Creating CanvasRendererCore with WASM simulation...');
      // Pass WASM simulation to the renderer core for proper integration
      this.renderer = new CanvasRendererCore(this.container, this.wasmSimulation);
      
      this.renderer.startRenderLoop();
      
      info('Canvas Test Harness V2 initialized successfully');
      return true;
    } catch (err) {
      error(`Failed to initialize Canvas Test Harness V2: ${err}`);
      return false;
    }
  }

  /**
   * Set the test mode
   */
  setTestMode(mode: TestMode): void {
    if (!this.renderer) {
      error('Cannot set test mode: renderer not initialized');
      return;
    }
    
    this.renderer.setTestMode(mode);
  }

  /**
   * Get current test mode
   */
  getTestMode(): TestMode {
    if (!this.renderer) {
      error('Cannot get test mode: renderer not initialized');
      return TestMode.Static;
    }
    
    return this.renderer.getTestMode();
  }

  /**
   * Create canvas objects
   */
  async createObjects(count: number): Promise<boolean> {
    if (!this.renderer) {
      error('Cannot create objects: renderer not initialized');
      return false;
    }
    
    try {
      info(`Creating ${count} canvas objects...`);
      const success = await this.renderer.createObjects(count);
      
      if (success) {
        info(`Successfully created ${count} canvas objects`);
      } else {
        error('Failed to create canvas objects');
      }
      
      return success;
    } catch (err) {
      error(`Error creating objects: ${err}`);
      return false;
    }
  }

  /**
   * Clear all objects from the canvas
   */
  clearObjects(): void {
    if (!this.renderer) {
      error('Cannot clear objects: renderer not initialized');
      return;
    }
    
    this.renderer.clearObjects();
    info('All canvas objects cleared');
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    if (!this.renderer) {
      error('Cannot get performance metrics: renderer not initialized');
      return {
        fps: 0,
        renderTime: 0,
        objectCount: 0,
        memoryUsage: 0,
        interactionLatency: 0
      };
    }
    
    return this.renderer.getPerformanceMetrics();
  }

  /**
   * Destroy and clean up resources
   */
  destroy(): void {
    if (this.renderer) {
      this.renderer.destroy();
    }
    
    this.renderer = null;
    this.wasmSimulation = null;
    
    info('Canvas Test Harness V2 destroyed');
  }
}
