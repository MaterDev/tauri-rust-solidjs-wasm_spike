import { Application, Container, Graphics, Texture } from 'pixi.js';
import { info, error } from '@tauri-apps/plugin-log';

export class PixiRenderer {
  app: Application | null = null;
  container: Container | null = null;
  texture: Texture | null = null;
  
  async initialize(containerElement: HTMLDivElement, width: number, height: number): Promise<boolean> {
    try {
      info('Initializing PixiJS...');
      
      // Initialize PixiJS Application with full window dimensions
      this.app = new Application();
      await this.app.init({
        width: width,
        height: height,
        backgroundColor: 0x000000,
        antialias: true,
        resizeTo: window, // Auto-resize to window dimensions
      });
      
      // Add canvas to DOM
      containerElement.appendChild(this.app.canvas);
      info('PixiJS application created and initialized');
      
      // Create a regular container for particles
      this.container = new Container();
      this.app.stage.addChild(this.container);
      info('Particle container created and added to stage');

      // Create a texture for the particles
      // Using white so we can tint it with different colors
      const graphics = new Graphics();
      graphics.beginFill(0xffffff); // White base color for tinting
      graphics.drawCircle(0, 0, 2);
      graphics.endFill();
      
      // In PixiJS v8, generateTexture is replaced with extract.texture
      this.texture = this.app.renderer.extract.texture(graphics);
      info('Particle texture created');
      
      return true;
    } catch (err: any) {
      error(`Error initializing PixiJS: ${err}`);
      return false;
    }
  }

  resize(width: number, height: number): void {
    if (!this.app) return;
    
    // Resize the app renderer
    this.app.renderer.resize(width, height);
    info(`Resized renderer to ${width}x${height}`);
  }
  
  cleanup(): void {
    // Stop animation loop
    if (this.app) {
      this.app.ticker.stop();
      this.app.destroy();
      this.app = null;
    }
    
    // Clean up texture
    if (this.texture) {
      this.texture.destroy();
      this.texture = null;
    }
  }
  
  addTickerCallback(callback: (deltaMS: number) => void): void {
    if (this.app) {
      this.app.ticker.add((ticker) => callback(ticker.deltaMS));
    }
  }
}
