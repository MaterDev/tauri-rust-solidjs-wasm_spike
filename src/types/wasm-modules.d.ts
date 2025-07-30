/**
 * Type declarations for WASM modules
 * These declarations help TypeScript recognize WASM imports
 */

declare module '*.wasm' {
  const content: WebAssembly.Module;
  export default content;
}

declare module '/wasm/particle_sim.js' {
  export interface WasmSimulation {
    tick(): Float32Array;
    get_positions(): Float32Array;
    get_count(): number;
    free(): void;
  }

  export class Simulation {
    constructor(count: number);
    tick(): Float32Array;
    get_positions(): Float32Array;
    get_count(): number;
    free(): void;
  }

  // Handle both direct and default exports
  export { Simulation };
  export default { Simulation };
}
