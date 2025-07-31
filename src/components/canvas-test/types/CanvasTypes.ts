import { Graphics } from 'pixi.js';

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
export interface CanvasObject {
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
export interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  objectCount: number;
  memoryUsage: number;
  interactionLatency: number;
}
