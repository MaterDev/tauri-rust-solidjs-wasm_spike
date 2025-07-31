# WASM-Powered Canvas Performance Test Harness (Spike)

> **⚡ This is a technical spike** - An experimental project to explore and validate the integration of Tauri, Rust/WebAssembly, SolidJS, and PixiJS for high-performance canvas applications similar to Figma or comic creation tools.

## 🎯 Goals

Validate Rust/WASM integration with modern frontend frameworks for building high-performance canvas editing applications, with a focus on object management, transformations, and rendering efficiency.

## 📋 What We're Building

A canvas performance test harness with:

- **Object Management**: Rust/WASM handles thousands of canvas objects with various shapes and transforms
- **Rendering**: PixiJS v8 provides hardware-accelerated 2D graphics with efficient drawing methods
- **Performance Metrics**: Real-time monitoring of FPS, memory usage, render time, and object counts
- **Test Scenarios**: Multiple test modes including static, rotating, scaling, interactive, and stress tests
- **UI**: SolidJS + TypeScript for reactive frontend
- **Desktop**: Tauri for native app experience

## 🛠️ Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Desktop Framework | Tauri | Native desktop wrapper |
| Frontend UI | SolidJS + Vite | Reactive UI and dev tooling |
| 2D Rendering | PixiJS v8 | Hardware-accelerated graphics |
| Canvas Object Management | Rust + WebAssembly | High-performance object creation, selection, and transformation |
| Build Tools | wasm-pack, Cargo | WASM compilation |
| Package Management | Bun | Fast package management |

## 📁 Project Structure

```txt
tauri-rust-solidjs-wasm_spike/
├── src-tauri/                    # Tauri backend
│   ├── Cargo.toml
│   ├── src/main.rs
│   ├── particle_sim/             # Legacy WASM physics module
│   │   ├── Cargo.toml
│   │   └── src/lib.rs
│   └── canvas_sim/               # New WASM canvas object module
│       ├── Cargo.toml
│       └── src/lib.rs
├── src/                          # SolidJS frontend (TypeScript)
│   ├── app.tsx                   # Main application
│   ├── main.ts                   # Entry point
│   ├── components/               # UI Components
│   │   ├── CanvasPerformanceTest.tsx  # Performance test component
│   │   └── canvas-test/          # Canvas harness implementation
│   │       └── CanvasTestHarness.ts
│   └── types/                    # TypeScript type definitions
│       └── tauri.d.ts            # Tauri API type declarations
├── public/                       # Static assets
├── Cargo.toml                    # Workspace configuration
├── package.json                  # Frontend dependencies
├── PROJECT_PLAN.md               # Detailed implementation plan
├── WASM-INTEGRATION.md           # WASM integration details
├── README.md                     # This file
└── LICENSE                       # MIT License
```

## 🚀 Getting Started

### Prerequisites & Environment Setup

#### 1. Rust Toolchain

- **New Install**: Install Rust via [rustup](https://rustup.rs/): `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- **Update Existing**: Update Rust toolchain: `rustup update`
- Verify installation: `rustc --version` (should be 1.70+ for best WASM support)
- Add WebAssembly target: `rustup target add wasm32-unknown-unknown`
- Verify WASM target: `rustup target list --installed | grep wasm32`

#### 2. WebAssembly Tools

- **New Install**: Install [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/): `curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh`
- **Update Existing**: Update via cargo: `cargo install wasm-pack --force`
- Verify installation: `wasm-pack --version` (should be 0.12+ for latest features)
- Alternative install via cargo: `cargo install wasm-pack`

#### 3. Node.js & Frontend Tools

- **New Install**: Install [Node.js](https://nodejs.org/) (v16 or higher)
- **Update Existing**: Update Node.js via your package manager or download latest from nodejs.org
- Verify installation: `node --version` and `npm --version`
- **New Install**: Install Tauri CLI: `npm install -g @tauri-apps/cli`
- **Update Existing**: Update Tauri CLI: `npm update -g @tauri-apps/cli`
- Verify Tauri CLI: `tauri --version` (should be 1.5+ for latest features)

#### 4. Additional Dependencies (macOS)

- Install Xcode Command Line Tools: `xcode-select --install`
- Install system dependencies for Tauri development

### Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd tauri-rust-solidjs-wasm_spike

# Install frontend dependencies
npm install

# Build WASM modules
cd src-tauri/canvas_sim
wasm-pack build --target web
cd ../..

# Start development server
npm run tauri dev
```

## 🎯 Success Criteria

This spike is successful if we achieve:

✅ **Performance**: Smooth 60fps with 5,000+ particles  
✅ **Integration**: Seamless WASM ↔ JS data flow  
✅ **Architecture**: Clean separation of concerns  
✅ **Developer Experience**: Reasonable build/dev workflow  

## 📊 Key Metrics to Validate

- **Frame Rate**: Target 60fps during simulation
- **Particle Count**: Handle 5,000+ particles simultaneously
- **Memory Usage**: Efficient memory management in WASM
- **Build Time**: Reasonable development iteration speed
- **Bundle Size**: Acceptable WASM module size

## 🔬 Technical Exploration Areas

### WASM Performance

- Memory allocation strategies
- Data serialization between WASM and JS
- Float32Array transfer efficiency

### Framework Integration

- SolidJS lifecycle with WASM modules
- PixiJS particle container updates
- Tauri's role in the architecture

### Development Workflow

- Hot reloading with WASM changes
- Debugging across Rust/JS boundary
- Build optimization strategies

## 🔍 Quick Performance Check (Optional)

### Simple Tools

- **Browser DevTools**: Performance tab for frame rate monitoring
- **twiggy** (optional): `cargo install twiggy` for WASM bundle size

### Quick Checks

1. **Frame Rate**: Open DevTools Performance tab, check for smooth 60fps
2. **Bundle Size**: Run `twiggy top particle_sim_bg.wasm` to see WASM size
3. **Memory**: Watch Memory tab for any obvious leaks

> *Keep it simple - the goal is to see WASM working, not deep performance analysis*

## 🔗 Resources

- [Tauri Documentation](https://tauri.app/)
- [SolidJS Guide](https://www.solidjs.com/)
- [PixiJS Documentation](https://pixijs.com/)
- [wasm-bindgen Book](https://rustwasm.github.io/wasm-bindgen/)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## This project was created with the [Solid CLI](https://github.com/solidjs-community/solid-cli)
