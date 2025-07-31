import { Component } from 'solid-js';
import CanvasPerformanceTest from './components/CanvasPerformanceTest';
import './App.css';
import { info } from '@tauri-apps/plugin-log';


const App: Component = () => {
  info('Canvas Performance Test App rendering');
  return (
    <div class="App">
      <CanvasPerformanceTest />
    </div>
  );
};

export default App;
