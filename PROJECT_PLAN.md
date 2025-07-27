# WASM-Powered Particle Fountain Project Plan

## Project Overview

**Goal**: Create a desktop application using Tauri that demonstrates a real-world use case for WebAssembly by running a particle physics simulation in a Rust/WASM module and rendering the output in a SolidJS frontend using three.js.

**Project Title**: WASM-Powered Particle Fountain

## Core Technologies

- **Application Framework**: Tauri
- **Frontend UI**: SolidJS with Vite
- **3D Rendering**: three.js
- **Computation/Logic**: Rust compiled to WebAssembly (WASM)

## Environment Setup (WASM Prerequisites)

### Required Tools

#### 1. Rust Toolchain

- [ ] **New Install**: Install Rust via [rustup](https://rustup.rs/): `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- [ ] **Update Existing**: Update Rust toolchain: `rustup update`
- [ ] Verify installation: `rustc --version` (should be 1.70+ for best WASM support)
- [ ] Add WebAssembly target: `rustup target add wasm32-unknown-unknown`
- [ ] Verify WASM target: `rustup target list --installed | grep wasm32`

#### 2. WebAssembly Tools

- [ ] **New Install**: Install [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/): `curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh`
- [ ] **Update Existing**: Update via cargo: `cargo install wasm-pack --force`
- [ ] Verify installation: `wasm-pack --version` (should be 0.12+ for latest features)
- [ ] Alternative install via cargo: `cargo install wasm-pack`

#### 3. Node.js & Frontend Tools

- [ ] **New Install**: Install [Node.js](https://nodejs.org/) (v16 or higher)
- [ ] **Update Existing**: Update Node.js via your package manager or download latest from nodejs.org
- [ ] Verify installation: `node --version` and `npm --version`
- [ ] **New Install**: Install Tauri CLI: `npm install -g @tauri-apps/cli`
- [ ] **Update Existing**: Update Tauri CLI: `npm update -g @tauri-apps/cli`
- [ ] Verify Tauri CLI: `tauri --version` (should be 1.5+ for latest features)

#### 4. Additional Dependencies (macOS)

- [ ] Install Xcode Command Line Tools: `xcode-select --install`
- [ ] Install system dependencies for Tauri development

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

## Detailed Implementation Plan

### 1. Project Scaffolding

- [ ] Initialize a new Tauri project configured for a SolidJS frontend
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

- [ ] Add three.js to frontend's `package.json`

#### WASM Integration

- [ ] Build `particle_sim` crate into WASM using `wasm-pack`
- [ ] Place output (`.wasm` and generated `.js` files) into `public` directory

#### Main Component (`App.jsx` or `Scene.jsx`)

- [ ] Use `onMount` lifecycle hook to set up the experience
- [ ] Initialize three.js `Scene`, `PerspectiveCamera`, and `WebGLRenderer`
- [ ] Append renderer's DOM element to component
- [ ] Asynchronously load and instantiate `particle-sim.wasm` module
- [ ] Once WASM loaded:
  - [ ] Create three.js geometry
  - [ ] Create `BufferGeometry` and `PointsMaterial` (small white dots)
  - [ ] Call WASM `tick()` function to get initial particle positions
  - [ ] Initialize position attribute of `BufferGeometry` with data
  - [ ] Create `Points` object and add to scene

#### Animation Loop

- [ ] Create `animate` function using `requestAnimationFrame`
- [ ] Inside loop:
  - [ ] Call WASM `tick()` function for updated positions
  - [ ] Update `BufferGeometry`'s position attribute with new array
  - [ ] Set `geometry.attributes.position.needsUpdate = true`
  - [ ] Render scene with camera
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
│   ├── App.jsx
│   └── main.js
├── public/
│   └── (WASM output files)
├── Cargo.toml (workspace)
├── package.json
└── PROJECT_PLAN.md (this file)
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

- [ ] Set up three.js scene
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
3. Seamless data flow from Rust/WASM to JavaScript/three.js
4. Clean, maintainable code architecture
5. Proper build and development workflows

## Notes

- This project demonstrates CPU-intensive logic handled by high-performance Rust/WASM
- Rendering and UI managed by modern JavaScript framework
- Showcases hybrid application architecture with seamless WASM-JS data flow
- Perfect example of leveraging each technology's strengths
