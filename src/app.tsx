import { Component } from 'solid-js';
// import TestComponent from './components/TestComponent';
import ParticleSimulation from './components/ParticleSimulation';
import './App.css';
import { info } from '@tauri-apps/plugin-log';


const App: Component = () => {
  info('App component rendering');
  return (
    <div class="App">
      <h1>WASM Particle Fountain</h1>
      {/* <TestComponent /> */}
      <ParticleSimulation />
    </div>
  );
};

export default App;
