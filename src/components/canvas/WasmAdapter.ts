/**
 * Adapter for WASM canvas simulation
 * Provides a simplified interface for the CanvasRenderer to use
 */
import initWasm, { CanvasSimulation, ObjectType } from 'wasm/canvas_sim';

/**
 * Initialize the WASM module and create a simulation instance
 */
export async function initializeWasmSimulation(): Promise<CanvasSimulation | null> {
  try {
    console.log('Initializing WASM module...');
    await initWasm();
    console.log('WASM module initialized successfully');
    
    // Create the simulation - constructor doesn't take dimensions
    const simulation = new CanvasSimulation();
    console.log('WASM simulation created successfully');
    
    // Log available methods for debugging
    console.log('WASM simulation methods:',
      Object.getOwnPropertyNames(Object.getPrototypeOf(simulation)).join(', '));
    
    return simulation;
  } catch (err) {
    console.error('Failed to initialize WASM module:', err);
    return null;
  }
}

/**
 * Create objects in the WASM simulation
 * @param simulation WASM simulation instance
 * @param count Number of objects to create
 * @param type Object type (0 for Rectangle, 1 for Circle)
 * @returns Array of object IDs created
 */
export function createObjects(simulation: CanvasSimulation, count: number, type: number): number[] {
  try {
    return simulation.create_objects(count, type);
  } catch (err) {
    console.error('Error creating objects in WASM:', err);
    return [];
  }
}

/**
 * Create mixed objects for testing
 * @param simulation WASM simulation instance
 * @param rectangles Number of rectangles to create
 * @param circles Number of circles to create
 * @param complexPaths Number of complex paths to create
 * @returns Number of objects created
 */
export function createTestObjects(
  simulation: CanvasSimulation,
  rectangles: number,
  circles: number,
  complexPaths: number
): number {
  try {
    return simulation.batch_create_test_objects(rectangles, circles, complexPaths);
  } catch (err) {
    console.error('Error creating test objects in WASM:', err);
    return 0;
  }
}

/**
 * Update object transformations for animation
 * @param simulation WASM simulation instance
 * @param deltaTime Time since last update in seconds
 * @param mode Animation mode: "rotating", "scaling", or "stress"
 */
export function updateTransformations(
  simulation: CanvasSimulation, 
  deltaTime: number, 
  mode = "rotating"
): void {
  try {
    simulation.update_transformations(deltaTime, mode);
  } catch (err) {
    console.error('Error updating transformations in WASM:', err);
  }
}

/**
 * Set the canvas dimensions in the WASM simulation
 */
export function setCanvasSize(simulation: CanvasSimulation, width: number, height: number): void {
  try {
    simulation.set_canvas_size(width, height);
  } catch (err) {
    console.error('Error setting canvas size in WASM:', err);
  }
}

/**
 * Clear all objects in the WASM simulation
 */
export function clearObjects(simulation: CanvasSimulation): void {
  try {
    simulation.clear_objects();
  } catch (err) {
    console.error('Error clearing objects in WASM:', err);
  }
}

/**
 * Get the object count from the WASM simulation
 */
export function getObjectCount(simulation: CanvasSimulation): number {
  try {
    return simulation.get_object_count();
  } catch (err) {
    console.error('Error getting object count from WASM:', err);
    return 0;
  }
}
