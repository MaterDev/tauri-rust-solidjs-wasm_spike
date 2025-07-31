import { FederatedPointerEvent } from 'pixi.js';
import { CanvasObject } from '../types/CanvasTypes';

/**
 * Handler for canvas interactions like selection and dragging
 */
export class InteractionHandler {
  private selectedObjects: Set<number> = new Set();
  private isDragging: boolean = false;
  private dragStartPos: { x: number, y: number } = { x: 0, y: 0 };
  
  constructor(private objects: Map<number, CanvasObject>) {}
  
  /**
   * Handle pointer down events
   */
  onPointerDown(event: FederatedPointerEvent): void {
    this.isDragging = true;
    this.dragStartPos = { x: event.globalX, y: event.globalY };
  }

  /**
   * Handle pointer move events
   */
  onPointerMove(event: FederatedPointerEvent): void {
    if (!this.isDragging) return;
    
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
  onPointerUp(): void {
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
  onObjectPointerDown(event: FederatedPointerEvent, objectId: number): void {
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
   * Check if currently dragging
   */
  getIsDragging(): boolean {
    return this.isDragging;
  }
  
  /**
   * Get selected objects
   */
  getSelectedObjects(): Set<number> {
    return this.selectedObjects;
  }
  
  /**
   * Update objects reference when they change
   */
  updateObjectsReference(objects: Map<number, CanvasObject>): void {
    this.objects = objects;
    // Clear selection when objects change
    this.clearSelection();
  }
  
  /**
   * Clear all selections
   */
  clearSelection(): void {
    this.selectedObjects.clear();
  }
}
