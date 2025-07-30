import { Application, Container, Texture, Assets } from 'pixi.js';
import { info, error } from '@tauri-apps/plugin-log';

/**
 * PixiJS renderer wrapper for WASM particle system
 * Handles PixiJS application setup and basic rendering infrastructure
 */
export class PixiRenderer {
  public app: Application | null = null;
  public container: Container | null = null;
  public texture: Texture | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize PixiJS application and create particle texture
   */
  async initialize(containerElement: HTMLElement, width: number, height: number): Promise<boolean> {
    try {
      info('Initializing PixiJS renderer...');

      // Create PixiJS application with PixiJS v8 API
      this.app = new Application();
      await this.app.init({
        width,
        height,
        backgroundColor: 0x1a1a1a,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      // Append canvas to container
      containerElement.appendChild(this.app.canvas);

      // Create main container for particles
      this.container = new Container();
      this.app.stage.addChild(this.container);

      // Create a simple particle texture (white circle)
      this.texture = await this.createParticleTexture();

      this.isInitialized = true;
      info('PixiJS renderer initialized successfully');
      return true;
    } catch (err: any) {
      error(`Failed to initialize PixiJS renderer: ${err}`);
      return false;
    }
  }

  /**
   * Create a simple particle texture
   */
  private async createParticleTexture(): Promise<Texture> {
    try {
      // Create a simple white circle texture programmatically
      const canvas = document.createElement('canvas');
      const size = 32;
      canvas.width = size;
      canvas.height = size;
      
      const ctx = canvas.getContext('2d')!;
      const radius = size / 2;
      
      // Create radial gradient for soft particle effect
      const gradient = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(radius, radius, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Convert canvas to PixiJS texture
      const texture = Texture.from(canvas);
      info('Created particle texture');
      return texture;
    } catch (err: any) {
      error(`Failed to create particle texture: ${err}`);
      // Fallback to a simple white texture
      return Texture.WHITE;
    }
  }

  /**
   * Resize the renderer
   */
  resize(width: number, height: number): void {
    if (this.app) {
      this.app.renderer.resize(width, height);
      info(`Resized renderer to ${width}x${height}`);
    }
  }

  /**
   * Add a callback to the ticker
   */
  addTickerCallback(callback: (deltaTime: number) => void): void {
    if (this.app) {
      this.app.ticker.add((ticker) => {
        callback(ticker.deltaMS);
      });
    }
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.app) {
      this.app.destroy(true, { children: true, texture: true });
      this.app = null;
    }
    
    this.container = null;
    this.texture = null;
    this.isInitialized = false;
    info('PixiJS renderer cleaned up');
  }

  /**
   * Check if renderer is initialized
   */
  get initialized(): boolean {
    return this.isInitialized;
  }
}
