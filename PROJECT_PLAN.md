# WASM-Powered Particle Fountain Project Plan

## Project Overview

**Goal**: Create a desktop application using Tauri that demonstrates a real-world use case for WebAssembly by running a particle physics simulation in a Rust/WASM module and rendering the output in a SolidJS frontend using PixiJS.

**Project Title**: WASM-Powered Particle Fountain

## Core Technologies

- **Application Framework**: Tauri
- **Frontend UI**: SolidJS with Vite
- **2D Rendering**: PixiJS
- **Computation/Logic**: Rust compiled to WebAssembly (WASM)

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

> **Package Manager**: Using Bun instead of npm for faster package management and script execution, with Vite as the build tool.

> **Tauri Init Complete**: Successfully created `src-tauri/` directory with Rust backend configured for Bun commands (`bun run dev`, `bun run build`).
- [ ] Inside the `src-tauri` directory, create a new Rust library crate named `particle_sim` (separate from main Tauri Rust application)
- [ ] Configure the root `Cargo.toml` to include `particle_sim` as a workspace member
- [ ] Configure `particle_sim` crate's `Cargo.toml` to produce a `cdylib` library type and include `wasm-bindgen` as a dependency

### 2. The Rust/WASM Physics Engine (`particle_sim` crate)

#### `lib.rs` File Structure

**Data Structures:**

- [ ] Define `Particle` struct containing:
  - `position: [f32; 3]`
  - `velocity: [f32; 3]`
  - `age: f32`
- [ ] Define `Simulation` struct that holds:
  - `particles: Vec<Particle>`

**Initialization:**

- [ ] Implement `new()` function for `Simulation` that populates the vector with ~5,000 particles at origin `[0.0, 0.0, 0.0]`

**Main Logic:**

- [ ] Create public function `tick(&mut self)` decorated with `#[wasm_bindgen]`
- [ ] `tick()` Logic:
  - [ ] Iterate through every particle in `self.particles`
  - [ ] Apply constant downward acceleration (gravity) to Y-component of velocity
  - [ ] Update particle position based on velocity
  - [ ] Increment particle age
  - [ ] **Respawn Logic**: If particle age > 3.0 seconds OR Y-position < -1.0:
    - Reset age to 0.0
    - Reset position to origin `[0.0, 0.0, 0.0]`
    - Assign new randomized initial upward velocity
- [ ] Return flat `Float32Array` of all particle positions `[x1, y1, z1, x2, y2, z2, ...]`

### 3. The SolidJS Frontend (`src` directory)

#### Dependencies

- [ ] Add PixiJS to frontend's `package.json`

#### WASM Integration

- [ ] Build `particle_sim` crate into WASM using `wasm-pack`
- [ ] Place output (`.wasm` and generated `.js` files) into `public` directory

#### Main Component (`App.tsx` or `Scene.tsx`)

- [ ] Use `onMount` lifecycle hook to set up the experience
- [ ] Initialize PixiJS `Application` and `Container`
- [ ] Append PixiJS canvas to component
- [ ] Asynchronously load and instantiate `particle-sim.wasm` module
- [ ] Once WASM loaded:
  - [ ] Create PixiJS particle container
  - [ ] Create particle sprites (small white dots)
  - [ ] Call WASM `tick()` function to get initial particle positions
  - [ ] Initialize particle positions from WASM data
  - [ ] Add particle container to stage

#### Animation Loop

- [ ] Create `animate` function using `requestAnimationFrame`
- [ ] Inside loop:
  - [ ] Call WASM `tick()` function for updated positions
  - [ ] Update particle sprite positions from WASM data
  - [ ] Render PixiJS application
- [ ] Start animate loop

### 4. Build & Development Setup

- [ ] Create build scripts for WASM compilation
- [ ] Set up development workflow
- [ ] Configure Tauri for development and production builds

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

- [ ] Initialize Tauri project with SolidJS
- [ ] Set up workspace structure
- [ ] Configure dependencies

### Phase 2: Rust/WASM Development

- [ ] Create particle_sim crate
- [ ] Implement physics simulation
- [ ] Build and test WASM module

### Phase 3: Frontend Integration

- [ ] Set up PixiJS scene
- [ ] Load WASM module
- [ ] Implement animation loop

### Phase 4: Testing & Polish

- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Documentation

## Success Criteria

The project is complete when:

1. Particles simulate realistic physics (gravity, respawning)
2. Smooth 60fps rendering of 5,000+ particles
3. Seamless data flow from Rust/WASM to JavaScript/PixiJS
4. Clean, maintainable code architecture
5. Proper build and development workflows

## Notes

- This project demonstrates CPU-intensive logic handled by high-performance Rust/WASM
- Rendering and UI managed by modern TypeScript/SolidJS framework
- Showcases hybrid application architecture with seamless WASM-JS data flow
- Perfect example of leveraging each technology's strengths
