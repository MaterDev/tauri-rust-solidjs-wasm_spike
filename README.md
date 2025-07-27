# WASM-Powered Particle Fountain (Spike)

> **⚡ This is a technical spike** - An experimental project to explore and validate the integration of Tauri, Rust/WebAssembly, SolidJS, and three.js for high-performance desktop applications.

## 🎯 Spike Objectives

This spike aims to answer key technical questions:

- Can Rust/WASM effectively handle real-time physics calculations?
- How seamless is the data flow between WASM and modern JS frameworks?
- What's the performance ceiling for particle simulations in this architecture?
- How well do these technologies integrate in a Tauri desktop app?

## 📋 What We're Building

A particle fountain simulation demonstrating:

- **Physics Engine**: Rust/WASM module calculating particle movement, gravity, and lifecycle
- **3D Rendering**: three.js visualizing thousands of particles in real-time
- **Modern UI**: SolidJS managing the reactive frontend
- **Desktop App**: Tauri providing native desktop experience

## 🛠️ Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Desktop Framework | Tauri | Native desktop wrapper |
| Frontend UI | SolidJS + Vite | Reactive UI and dev tooling |
| 3D Rendering | three.js | Hardware-accelerated graphics |
| Physics Engine | Rust + WebAssembly | High-performance computations |
| Build Tools | wasm-pack, Cargo | WASM compilation |

## 📁 Project Structure

```txt
tauri-rust-solidjs-wasm_spike/
├── src-tauri/                 # Tauri backend
│   ├── Cargo.toml
│   ├── src/main.rs
│   └── particle_sim/          # WASM physics module
│       ├── Cargo.toml
│       └── src/lib.rs
├── src/                       # SolidJS frontend
│   ├── App.jsx
│   └── main.js
├── public/                    # Static assets + WASM output
│   └── (WASM files)
├── Cargo.toml                 # Workspace configuration
├── package.json               # Frontend dependencies
├── PROJECT_PLAN.md            # Detailed implementation plan
└── README.md                  # This file
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

# Build WASM module
cd src-tauri/particle_sim
wasm-pack build --target web --out-dir ../../public/wasm
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
- three.js buffer geometry updates
- Tauri's role in the architecture

### Development Workflow

- Hot reloading with WASM changes
- Debugging across Rust/JS boundary
- Build optimization strategies

## 📝 Lessons Learned

> *This section will be updated as we progress through the spike*

## 🔗 Related Resources

- [Tauri Documentation](https://tauri.app/)
- [SolidJS Guide](https://www.solidjs.com/)
- [three.js Documentation](https://threejs.org/docs/)
- [wasm-bindgen Book](https://rustwasm.github.io/wasm-bindgen/)

## 📄 License

This spike is for educational and experimental purposes.
