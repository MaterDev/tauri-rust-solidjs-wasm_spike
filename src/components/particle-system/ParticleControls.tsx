import { Component } from 'solid-js';

interface ParticleControlsProps {
  onUpdateParticleCount: (delta: number) => void;
}

/**
 * Particle controls component for WASM particle system
 * Provides UI controls to adjust particle count
 */
const ParticleControls: Component<ParticleControlsProps> = (props) => {
  const buttonStyle = {
    background: 'rgba(76, 205, 196, 0.8)',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    margin: '0 5px',
    'border-radius': '4px',
    cursor: 'pointer',
    'font-family': 'monospace',
    'font-size': '12px',
    transition: 'background 0.2s'
  };

  const handleMouseOver = (e: MouseEvent) => {
    (e.target as HTMLElement).style.background = 'rgba(76, 205, 196, 1)';
  };

  const handleMouseOut = (e: MouseEvent) => {
    (e.target as HTMLElement).style.background = 'rgba(76, 205, 196, 0.8)';
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '15px',
      'border-radius': '8px',
      'font-family': 'monospace',
      'font-size': '14px',
      'z-index': 1000,
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      <div style={{ 'margin-bottom': '10px', 'font-weight': 'bold', color: '#4ECDC4' }}>
        ⚙️ Controls
      </div>
      <div style={{ 'margin-bottom': '8px', color: '#96CEB4', 'font-size': '12px' }}>
        Particle Count:
      </div>
      <div>
        <button
          style={buttonStyle}
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
          onClick={() => props.onUpdateParticleCount(-1000)}
        >
          -1K
        </button>
        <button
          style={buttonStyle}
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
          onClick={() => props.onUpdateParticleCount(-5000)}
        >
          -5K
        </button>
        <button
          style={buttonStyle}
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
          onClick={() => props.onUpdateParticleCount(1000)}
        >
          +1K
        </button>
        <button
          style={buttonStyle}
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
          onClick={() => props.onUpdateParticleCount(5000)}
        >
          +5K
        </button>
      </div>
    </div>
  );
};

export default ParticleControls;
