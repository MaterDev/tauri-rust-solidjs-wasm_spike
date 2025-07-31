import { CanvasObject } from '../types/CanvasTypes';

/**
 * Animation controllers for different test modes
 */
export class AnimationControllers {
  constructor(private objects: Map<number, CanvasObject>) {}

  /**
   * Update objects based on delta time
   */
  updateRotatingObjects(deltaTime: number): void {
    const rotationSpeed = 0.5; // radians per second
    
    this.objects.forEach(obj => {
      obj.rotation += rotationSpeed * deltaTime;
      obj.graphic.rotation = obj.rotation;
    });
  }

  /**
   * Update scaling objects using sine wave animation
   */
  updateScalingObjects(): void {
    const time = performance.now() * 0.001;
    
    this.objects.forEach((obj, id) => {
      const scale = 0.5 + 0.3 * Math.sin(time + id * 0.1);
      obj.scaleX = scale;
      obj.scaleY = scale;
      obj.graphic.scale.set(scale, scale);
    });
  }

  /**
   * Update objects for stress test
   * Combines rotation, scaling, and movement animations
   */
  updateStressTest(deltaTime: number): void {
    const time = performance.now() * 0.001;
    
    this.objects.forEach((obj, id) => {
      // Rotation
      obj.rotation += 0.5 * deltaTime;
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
   * Update objects reference when they change
   */
  updateObjectsReference(objects: Map<number, CanvasObject>): void {
    this.objects = objects;
  }
}
