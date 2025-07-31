# Simplified Canvas Performance Testing Harness

## Project Overview

**Goal**: Create a minimalist performance testing harness to validate that PixiJS v8 + WASM can handle high-density rendering for a professional canvas application. This spike focuses purely on rendering performance without UI metrics.

**Project Title**: Simplified Canvas Performance Testing Harness

## Core Technologies

- **Application Framework**: Tauri
- **Frontend UI**: SolidJS with Vite
- **2D Rendering**: PixiJS v8 
- **Performance Logic**: Rust compiled to WebAssembly (WASM)
- **Package Manager**: Bun

## Simplified Approach

We're taking a streamlined approach focused solely on rendering performance:

1. **Full-screen canvas**: Maximize rendering area
2. **Shape rendering only**: Simple shapes (rectangles, circles) at scale
3. **No UI metrics**: External profiling tools will be used instead
4. **Simple controls**: Buttons to set object counts and toggle animation
5. **Focus on volume**: Test with large numbers (500/1000/5000+) of objects

## Core Components

### 1. WASM Module (Minimalist)

- Simple `CanvasSimulation` class
- Methods for:
  - Adding objects with basic properties (position, size)
  - Basic animation updates
  - Optional object selection for interactive testing

### 2. PixiJS Renderer

- Full-screen PixiJS v8 canvas
- Proper async initialization pattern
- Basic shape rendering (rectangles, circles)
- Simple animation loop

### 3. Minimal Test Harness

- Object count controls: Add 500/1000/5000 objects
- Animation toggle: Static vs. Animated
- Object counter display
- No performance metrics UI (use browser dev tools instead)

## Implementation Plan

### Phase 1: Clean Setup

- Create new PixiJS v8 component with proper initialization
- Set up WASM bindings with minimal simulation functionality
- Create full-screen canvas container

### Phase 2: Rendering Test

- Implement object creation at different densities
- Create simple shapes with PixiJS
- Enable basic controls for object count

### Phase 3: Animation Test

- Add toggle for animation
- Implement basic animation in WASM and PixiJS
- Test animation performance at different object counts

## Success Criteria

The project is complete when:

1. **Pure rendering test**: Full-screen canvas rendering thousands of simple shapes
2. **Incremental density**: Add objects in increments of 500/1000/5000
3. **Animation toggle**: Switch between static and animated states
4. **Object tracking**: Display current object count
5. **External profiling compatibility**: Works with browser dev tools and profilers

## Testing Process

1. Launch application in Tauri
2. Add objects incrementally to test different densities
3. Toggle animation on/off to compare performance
4. Use Chrome DevTools Performance panel or other external profilers to measure:
   - FPS (frames per second)
   - Frame rendering time
   - Memory usage
   - CPU utilization

## Notes

- This simplified approach focuses purely on rendering performance
- External profiling tools provide more detailed metrics than custom UI
- Testing raw object rendering provides baseline for more complex application needs
- Simple controls make it easy to test different scenarios quickly
