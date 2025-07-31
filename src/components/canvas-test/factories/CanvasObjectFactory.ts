import { Container, Graphics } from 'pixi.js';
import { info, error } from '@tauri-apps/plugin-log';
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
      const graphic = this.createObject(i, x, y, 50 + Math.random() * 50, 50 + Math.random() * 50, objectType);
      
      // Create canvas object data
      const canvasObject: CanvasObject = {
        id: i,
        type: objectType,
        x,
        y,
        width: graphic.width,
        height: graphic.height,
        rotation: 0,
        scaleX: 0.5 + Math.random() * 1.0,
        scaleY: 0.5 + Math.random() * 1.0,
        color,
        selected: false,
        graphic
      };
      
      // Set initial transform
      graphic.scale.set(canvasObject.scaleX, canvasObject.scaleY);
      
      // Make interactive for selection testing
      graphic.eventMode = 'static';
      graphic.cursor = 'pointer';
      graphic.on('pointerdown', (event) => onObjectPointerDown(event, canvasObject.id));
      
      // Add to tracking
      objects.set(i, canvasObject);
    }
    
    return objects;
  }

  /**
   * Create a new canvas object
   */
  createObject(id: number, x: number, y: number, width: number, height: number, type: ObjectType): Graphics {
    try {
      const graphic = new Graphics();
      
      // Draw the object based on type
      this.drawObject(graphic, type, width, height);
      
      // Position the object
      graphic.position.set(x, y);
      
      // Add to the container
      this.container.addChild(graphic);
      
      return graphic;
    } catch (err) {
      error(`Failed to create canvas object: ${err}`);
      console.error('Error creating canvas object:', err);
      return new Graphics(); // Return empty graphics object on error
    }
  }

  /**
   * Draw different object types
   */
  drawObject(graphic: Graphics, type: ObjectType, width: number, height: number): void {
    graphic.clear();
    
    switch (type) {
      case ObjectType.Rectangle:
        graphic.beginFill(0xFF6B6B);
        graphic.drawRect(0, 0, width, height);
        graphic.endFill();
        break;
      case ObjectType.Circle:
        graphic.beginFill(0x4ECDC4);
        graphic.drawCircle(width / 2, height / 2, Math.min(width, height) / 2);
        graphic.endFill();
        break;
      case ObjectType.ComplexPath:
        // Draw a more complex shape (star)
        graphic.beginFill(0x45B7D1);
        graphic.drawStar(width / 2, height / 2, 5, Math.min(width, height) / 2, Math.min(width, height) / 4);
        graphic.endFill();
        break;
      case ObjectType.Text:
        // For now, draw a rounded rectangle to represent text
        graphic.beginFill(0xFF9FF3);
        graphic.drawRoundedRect(0, 0, width, height, 10);
        graphic.endFill();
        break;
    }
  }
  
  /**
   * Clear all objects
   */
  clearObjects(objects: Map<number, CanvasObject>): void {
    objects.forEach(obj => {
      this.container.removeChild(obj.graphic);
      // In PixiJS v8, destroy() doesn't take parameters
      obj.graphic.destroy();
    });
    
    info('All canvas objects cleared');
  }
}
