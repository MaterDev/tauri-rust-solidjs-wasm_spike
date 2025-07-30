# WebAssembly Integration in Tauri/SolidJS/Vite

This document outlines our approach to integrating WebAssembly (WASM) with our Tauri/SolidJS/Vite stack, specifically for the particle simulation.

## Architecture Overview

Our application uses WebAssembly to offload performance-critical particle simulation calculations to Rust, while keeping the rendering in JavaScript with PixiJS v8.

```ascii
+---------------------+      +--------------------+
|                     |      |                    |
|  JS/TS Frontend     |      |  Rust WASM         |
|  (SolidJS + PixiJS) | <--> |  Particle          |
|  Rendering Layer    |      |  Simulation        |
|                     |      |                    |
+---------------------+      +--------------------+
```

## Implementation Details

### WASM Module Building

1. The Rust code is located in `src-tauri/particle_sim/`
2. It is compiled to WebAssembly using wasm-bindgen
3. The compiled artifacts are placed in `public/wasm/`:
   - `particle_sim.js` - JavaScript glue code
   - `particle_sim_bg.wasm` - The actual WebAssembly binary

### Vite Configuration

To properly handle WebAssembly in Vite, we use two plugins:

- `vite-plugin-wasm` - Enables WebAssembly ESM integration in Vite
- `vite-plugin-top-level-await` - Handles top-level await commonly used in WASM initialization

Configuration in `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  plugins: [
    solidPlugin(),
    wasm(),
    topLevelAwait()
  ],
  // Other config options...
  build: {
    target: 'esnext',
  },
});
```

### TypeScript Integration

TypeScript doesn't inherently understand WASM imports, so we've added type declarations in `src/types/wasm-modules.d.ts` to help the TypeScript compiler understand our WASM imports.

### WASM Loading Strategy

Our `WasmParticleSystem` class handles the dynamic loading of the WASM module:

1. We import the WASM module using ESM imports (handled by Vite plugins)
2. We initialize the WASM module and create a simulation instance
3. We handle different export formats that wasm-bindgen might produce
4. We add proper error handling for WASM loading failures

### Key Components

- `WasmParticleSystem.ts` - Main integration point between PixiJS and WASM
- `src-tauri/particle_sim/src/lib.rs` - Rust implementation of the particle simulation

## Best Practices

1. **Asynchronous Initialization**: Always await WASM module initialization before using it
2. **Error Handling**: Robust error handling for WASM loading failures
3. **Resource Cleanup**: Free WASM resources in the destroy method
4. **Type Safety**: TypeScript declarations to ensure type safety with WASM imports

## Usage Example

```typescript
// Create and initialize the particle system
const particleSystem = new WasmParticleSystem(emitterConfig, particleTexture);
await particleSystem.initialize(10000); // 10,000 particles

// Add to PixiJS stage
app.stage.addChild(particleSystem.getContainer());

// Update in animation loop
app.ticker.add(() => {
  particleSystem.update();
});

// Cleanup when done
particleSystem.destroy();
```
