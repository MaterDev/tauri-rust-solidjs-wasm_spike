import { Graphics, Container } from 'pixi.js';
import { info } from '@tauri-apps/plugin-log';
import { ObjectType, CanvasObject } from '../types/CanvasTypes';

/**
 * Factory class for creating and managing canvas objects
 */
export class CanvasObjectFactory {
  private container: Container;

  constructor(container: Container) {
    this.container = container;
  }

  /**
   * Create canvas objects for testing
   */
  async createObjects(count: number, onObjectPointerDown: (event: any, objectId: number) => void): Promise<Map<number, CanvasObject>> {
    const objectTypes = Object.values(ObjectType);
    const colors = [0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4, 0xFECA57, 0xFF9FF3, 0x54A0FF];
    const objects = new Map<number, CanvasObject>();
    
    info(`Creating ${count} canvas objects`);
    
    for (let i = 0; i < count; i++) {
      const objectType = objectTypes[i % objectTypes.length];
      const color = colors[i % colors.length];
      
      // Generate random position within canvas bounds
      // Always use window dimensions since the container may not have proper dimensions yet
      const canvasWidth = window.innerWidth;
      const canvasHeight = window.innerHeight;
      const x = Math.random() * (canvasWidth - 100) + 50;
      const y = Math.random() * (canvasHeight - 100) + 50;
      
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
      graphic.on('pointerdown', (event) => onObjectPointerDown(event, canvasObject.id));
      
      // Add to container and tracking
      this.container.addChild(graphic);
      objects.set(i, canvasObject);
    }
    
    return objects;
  }

  /**
   * Draw different object types
   */
  drawObject(graphic: Graphics, type: ObjectType, color: number): void {
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
   * Clear all objects
   */
  clearObjects(objects: Map<number, CanvasObject>): void {
    objects.forEach(obj => {
      this.container.removeChild(obj.graphic);
      obj.graphic.destroy();
    });
    
    info('All canvas objects cleared');
  }
}
