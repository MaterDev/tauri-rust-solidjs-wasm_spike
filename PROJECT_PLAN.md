# Canvas Performance Testing Harness Project Plan

## Project Overview

**Goal**: Create a performance testing harness using Tauri to validate that PixiJS + WASM can handle the demanding rendering requirements of a professional canvas application (like Figma) for comic creation. This spike will test object density, transformations, interactions, and memory management at scale.

**Project Title**: Canvas Performance Testing Harness for Comic Creation App

## Core Technologies

- **Application Framework**: Tauri
- **Frontend UI**: SolidJS with Vite
- **2D Rendering**: PixiJS v8
- **Performance Logic**: Rust compiled to WebAssembly (WASM)
- **Package Manager**: Bun

## Target Use Case

**Comic Creation App**: A Figma-like canvas application for creating comics that needs to handle:
- Thousands of vector objects (panels, speech bubbles, text, artwork)
- Complex transformations (scaling, rotation, grouping)
- Real-time interactions (dragging, resizing, selection)
- Smooth 60fps performance even with heavy scenes

## Environment Setup (WASM Prerequisites)

### Required Tools

#### 1. Rust Toolchain

- [x] **New Install**: Install Rust via [rustup](https://rustup.rs/): `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- [x] **Update Existing**: Update Rust toolchain: `rustup update`
- [x] Verify installation: `rustc --version` (should be 1.70+ for best WASM support)
- [x] Add WebAssembly target: `rustup target add wasm32-unknown-unknown`
- [x] Verify WASM target: `rustup target list --installed | grep wasm32`

> **Environment Setup Notes**: Rust 1.88.0 installed and verified. WASM target `wasm32-unknown-unknown` successfully added.

#### 2. WebAssembly Tools

- [x] **New Install**: Install [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/): `curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh`
- [x] **Update Existing**: Update via cargo: `cargo install wasm-pack --force`
- [x] Verify installation: `wasm-pack --version` (should be 0.12+ for latest features)
- [x] Alternative install via cargo: `cargo install wasm-pack`

> **WebAssembly Tools Notes**: wasm-pack 0.13.1 successfully installed and verified (exceeds 0.12+ requirement).

#### 3. Node.js & Frontend Tools

- [x] **New Install**: Install [Node.js](https://nodejs.org/) (v16 or higher)
- [x] **Update Existing**: Update Node.js via your package manager or download latest from nodejs.org
- [x] Verify installation: `node --version` and `npm --version`
- [x] **New Install**: Install Tauri CLI: `npm install -g @tauri-apps/cli`
- [x] **Update Existing**: Update Tauri CLI: `npm update -g @tauri-apps/cli`
- [x] Verify Tauri CLI: `tauri --version` (should be 1.5+ for latest features)

> **Node.js & Frontend Tools Notes**: Node.js v24.4.1 and npm 11.4.2 verified (well above v16+ requirement). Tauri CLI 2.7.1 successfully installed (exceeds 1.5+ requirement).

#### 4. Additional Dependencies (macOS)

- [x] Install Xcode Command Line Tools: `xcode-select --install`
- [x] Install system dependencies for Tauri development

> **macOS Dependencies Notes**: Xcode Command Line Tools already installed at `/Library/Developer/CommandLineTools`. All Tauri system dependencies satisfied.
>
> **Implementation Approach**: Using hands-on learning method where user runs commands and writes code directly for better understanding. AI provides step-by-step guidance, explanations, and code to copy.

### WASM Development Workflow Overview

1. **Write Rust Code**: Create physics simulation in `particle_sim/src/lib.rs`
2. **Compile to WASM**: Use `wasm-pack build` to generate `.wasm` and JS bindings
3. **Import in Frontend**: Load WASM module in SolidJS application
4. **Call WASM Functions**: Invoke Rust functions from JavaScript
5. **Handle Data Transfer**: Pass Float32Arrays between WASM and JS

### Key WASM Concepts for This Project

- **wasm-bindgen**: Rust library that generates JS bindings for WASM
- **cdylib**: Cargo library type that produces dynamic libraries (required for WASM)
- **Float32Array**: Efficient way to transfer numeric data between WASM and JS
- **Memory Management**: WASM has linear memory that JS can access directly

## Basic Performance Analysis (Optional)

### Quick Profiling Tools

#### Essential Tools (Install if interested)

- [ ] **twiggy**: WASM bundle size analysis: `cargo install twiggy`
- [ ] **Browser DevTools**: Performance and Memory tabs for runtime analysis

#### Simple Workflow

- [ ] Check WASM bundle size: `twiggy top particle_sim_bg.wasm`
- [ ] Monitor frame rate in browser DevTools Performance tab
- [ ] Watch memory usage during particle simulation

#### Quick Success Metrics

- **Frame Rate**: Smooth animation (aim for 60fps)
- **Bundle Size**: Reasonable WASM file size
- **Memory**: No obvious leaks during long runs

## Detailed Implementation Plan

### 1. Project Scaffolding

- [x] Initialize a new Tauri project configured for a SolidJS frontend

> **Tauri Init Note**: Correct parameter is `--frontend-dist` not `--dist-dir` for specifying frontend build directory.
>
> **Package Manager**: Using Bun instead of npm for faster package management and script execution, with Vite as the build tool.
>
> **Tauri Init Complete**: Successfully created `src-tauri/` directory with Rust backend configured for Bun commands (`bun run dev`, `bun run build`).
>
> **SolidJS Frontend Setup**: Created SolidJS + TypeScript frontend with `ts-vitest` template. Package.json configured with Vite, SolidJS 1.9.7, TypeScript 5.8.3, and Vitest for testing.
>
> **Bun Configuration**: Successfully migrated from pnpm to Bun. Removed pnpm-lock.yaml, created bun.lock. PixiJS 8.11.0 and @types/pixi.js 5.0.0 installed with Bun.
>
> **Animation Requirement**: Particle fountain animation should be full-screen within the Tauri desktop window.
>
> **Tauri Dev Mode**: Successfully tested `bun run tauri:dev`. Fixed Vite port configuration (3000→5173). Desktop app launches with SolidJS frontend and hot reloads working correctly.

- [ ] Inside the `src-tauri` directory, create a new Rust library crate named `particle_sim` (separate from main Tauri Rust application)
- [ ] Configure the root `Cargo.toml` to include `particle_sim` as a workspace member
- [ ] Configure `particle_sim` crate's `Cargo.toml` to produce a `cdylib` library type and include `wasm-bindgen` as a dependency

### 2. The Rust/WASM Physics Engine (`particle_sim` crate)

#### `lib.rs` File Structure

**Data Structures:**

- [x] Define `Particle` struct containing:
  - `position: [f32; 3]`
  - `velocity: [f32; 3]`
  - `age: f32`
- [x] Define `Simulation` struct that holds:
  - `particles: Vec<Particle>`
  - `time_step: f32`

**Initialization:**

- [x] Implement `new()` function for `Simulation` that populates the vector with particles at origin `[0.0, 0.0, 0.0]`

**Main Logic:**

- [x] Create public function `tick(&mut self)` decorated with `#[wasm_bindgen]`
- [x] `tick()` Logic:
  - [x] Iterate through every particle in `self.particles`
  - [x] Apply constant downward acceleration (gravity = -0.8) to Y-component of velocity
  - [x] Update particle position based on velocity
  - [x] Increment particle age
  - [x] **Respawn Logic**: If particle age > 3.0 seconds OR Y-position < -1.0:
    - Reset age to 0.0
    - Reset position to origin `[0.0, 0.0, 0.0]`
    - Assign new randomized initial upward velocity
- [x] Return Vec<f32> of all particle positions, accessible from JavaScript as a Float32Array

> **Implementation Notes**: Used `wasm-bindgen`, `rand`, and `getrandom` dependencies with `wasm-pack build --target web` for WASM compilation.

### 3. The SolidJS Frontend (`src` directory)

#### Dependencies

- [x] Add PixiJS to frontend's `package.json`

> **Implementation Notes**: Using PixiJS v8.11.0 per user preference, with upgraded API usage. Bun is being used as the package manager instead of npm.

#### WASM Integration

- [x] Build `particle_sim` crate into WASM using `wasm-pack`
- [x] Place output (`.wasm` and generated `.js` files) into `public/wasm` directory

#### Main Component (`ParticleSimulation.tsx`)

- [x] Use `onMount` lifecycle hook to set up the experience
- [x] Initialize PixiJS `Application` and `Container`
- [x] Append PixiJS canvas to component (using `app.canvas` in PixiJS v8)
- [x] Asynchronously load and instantiate `particle_sim.wasm` module
- [x] Once WASM loaded:
  - [x] Create PixiJS Container for particles
  - [x] Create particle sprites (small white dots using Graphics)
  - [x] Call WASM `tick()` function to get initial particle positions
  - [x] Initialize particle positions from WASM data
  - [x] Add particle container to stage

#### Animation Loop

- [x] Create `animate` function using PixiJS ticker
- [x] Inside loop:
  - [x] Call WASM `tick()` function for updated positions
  - [x] Update particle sprite positions from WASM data
  - [x] Calculate and display FPS
  - [x] Render PixiJS application
- [x] Start animate loop

> **Implementation Notes**: Successfully migrated to PixiJS v8 API including named imports, `app.canvas` for view access, `renderer.extract.texture()` for texture generation, and updated container handling.

### 4. Build & Development Setup

- [x] Create build scripts for WASM compilation
- [x] Set up development workflow
- [x] Configure Tauri for development and production builds

> **Build Workflow**: To rebuild the WASM module:
>
> 1. `cd src-tauri/particle_sim`
> 2. `wasm-pack build --target web`
> 3. Copy output files: `cp -r pkg/* ../../public/wasm/`
> 4. Run dev server: `bun run dev` or Tauri app: `bun run tauri:dev`

## Project Structure

```txt
tauri-rust-solidjs-wasm_spike/
├── src-tauri/
│   ├── Cargo.toml
│   ├── src/
│   │   └── main.rs
│   └── particle_sim/
│       ├── Cargo.toml
│       └── src/
│           └── lib.rs
├── src/
│   ├── App.tsx
│   └── main.ts
├── public/
│   └── (WASM output files)
├── Cargo.toml (workspace)
├── package.json
├── PROJECT_PLAN.md (this file)
├── README.md
└── LICENSE
```

## Task Checklist

### Phase 1: Project Setup

- [x] Initialize Tauri project with SolidJS
- [x] Set up workspace structure
- [x] Configure dependencies

### Phase 2: Canvas Test Harness Development

- [ ] Clean up legacy particle system code
- [ ] Refactor WASM module for canvas object management
- [ ] Implement object creation, transformation, and selection logic
- [ ] Build and test new WASM module

### Phase 3: Frontend Integration

- [ ] Create CanvasPerformanceTest component
- [ ] Implement realistic canvas scenarios (static, rotating, scaling, interactive)
- [ ] Set up performance monitoring (FPS, memory, render time)
- [ ] Implement object count scaling controls

### Phase 4: Performance Analysis

- [ ] Run performance tests across different scenarios
- [ ] Compare WASM vs pure JS performance
- [ ] Document findings and optimization recommendations
- [ ] Validate readiness for comic creation app development

## Success Criteria

The project is complete when:

1. **Object Density**: Smooth 60fps rendering of 10,000+ canvas objects (rectangles, circles, complex shapes)
2. **Transformation Performance**: Real-time scaling, rotation, and translation of hundreds of objects
3. **Interaction Responsiveness**: Mouse events and selection handling without frame drops
4. **Memory Efficiency**: Stable memory usage during object creation/deletion cycles
5. **WASM Integration**: Seamless data flow between Rust/WASM and PixiJS for canvas operations
6. **Performance Metrics**: Clear correlation data between object count and frame rate
7. **Scalability Validation**: Proof that the stack can handle comic creation app requirements

## Test Scenarios

### 1. Static Object Density Test
- Render thousands of static objects (rectangles, circles, complex paths)
- Measure FPS degradation as object count increases
- Test memory usage patterns

### 2. Transformation Stress Test
- Continuously transform objects (scale, rotate, translate)
- Simulate user interactions like dragging and resizing
- Measure performance impact of real-time transformations

### 3. Interactive Selection Test
- Handle mouse events on thousands of objects
- Implement selection states and hover effects
- Test event handling performance at scale

### 4. Memory Management Test
- Dynamically add/remove objects
- Test garbage collection performance
- Monitor memory leaks during long-running sessions

## Notes

- This project validates PixiJS + WASM for professional canvas applications
- Tests realistic comic creation app scenarios, not just synthetic benchmarks
- Provides data-driven validation for technology stack decisions
- Demonstrates hybrid architecture for high-performance web applications
