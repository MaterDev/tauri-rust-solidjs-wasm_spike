import { Component } from 'solid-js';

interface StatusDisplayProps {
  fps: number;
  particleCount: number;
  status: string;
}

/**
 * Status display component for WASM particle system
 * Shows FPS, particle count, and system status
 */
const StatusDisplay: Component<StatusDisplayProps> = (props) => {
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '15px',
      'border-radius': '8px',
      'font-family': 'monospace',
      'font-size': '14px',
      'z-index': 1000,
      'min-width': '300px',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      <div style={{ 'margin-bottom': '8px', 'font-weight': 'bold', color: '#4ECDC4' }}>
        🚀 WASM Particle System
      </div>
      <div style={{ 'margin-bottom': '5px' }}>
        <span style={{ color: '#96CEB4' }}>FPS:</span> {props.fps}
      </div>
      <div style={{ 'margin-bottom': '5px' }}>
        <span style={{ color: '#96CEB4' }}>Particles:</span> {props.particleCount.toLocaleString()}
      </div>
      <div style={{ 
        'margin-top': '10px', 
        'padding-top': '8px', 
        'border-top': '1px solid rgba(255, 255, 255, 0.2)',
        color: '#FECA57',
        'font-size': '12px'
      }}>
        {props.status}
      </div>
    </div>
  );
};

export default StatusDisplay;
