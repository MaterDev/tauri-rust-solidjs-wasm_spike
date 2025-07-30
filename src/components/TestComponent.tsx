import { Component, createSignal } from 'solid-js';
import { info } from '@tauri-apps/plugin-log';

const TestComponent: Component = () => {
  const [count, setCount] = createSignal(0);
  
  info('TestComponent rendered');
  
  return (
    <div style={{ 
      "padding": "20px", 
      "background-color": "#f0f0f0", 
      "border-radius": "8px",
      "margin": "20px",
      "text-align": "center"
    }}>
      <h1>Test Component</h1>
      <p>Count: {count()}</p>
      <button 
        onClick={() => setCount(c => c + 1)}
        style={{
          "padding": "10px 20px",
          "background-color": "#007bff",
          "color": "white",
          "border": "none",
          "border-radius": "4px",
          "cursor": "pointer"
        }}
      >
        Increment
      </button>
    </div>
  );
};

export default TestComponent;
