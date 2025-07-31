declare module 'wasm/canvas_sim' {
  /**
   * Initialize the WASM module
   */
  export default function init(): Promise<void>;
  
  /**
   * Canvas Simulation WASM class for physics and object management
   */
  export class CanvasSimulation {
    constructor();
    
    /**
     * Add an object to the simulation
     */
    add_object(id: number, x: number, y: number, width: number, height: number): void;
    
    /**
     * Update physics simulation
     */
    update(delta_time: number): void;
    
    /**
     * Handle object selection
     */
    select_object(id: number): void;
    
    /**
     * Clear selection
     */
    clear_selection(): void;
  }
}
