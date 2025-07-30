import { Component } from 'solid-js';
import ParticleSimulation from './components/ParticleSimulation';
import './App.css';

const App: Component = () => {
  return (
    <div class="App">
      <header class="App-header">
        <h1>WASM Particle Fountain</h1>
        <p>Using Rust/WASM and PixiJS for high-performance particle simulation</p>
      </header>
      <main>
        <ParticleSimulation />
      </main>
    </div>
  );
};

export default App;
