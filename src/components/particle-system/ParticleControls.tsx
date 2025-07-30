import { Component } from 'solid-js';

interface ParticleControlsProps {
  onUpdateParticleCount: (delta: number) => void;
}

const ParticleControls: Component<ParticleControlsProps> = (props) => {
  return (
    <div
      style={{
        "position": "absolute",
        "top": "10px",
        "right": "10px",
        "display": "flex",
        "gap": "10px",
        "z-index": 100
      }}
    >
      <button
        onClick={() => props.onUpdateParticleCount(1000)}
        style={{
          "background": "#333",
          "color": "white",
          "border": "none",
          "padding": "5px 10px",
          "border-radius": "3px",
          "cursor": "pointer"
        }}
      >
        +1000 Particles
      </button>
      <button
        onClick={() => props.onUpdateParticleCount(-1000)}
        style={{
          "background": "#333",
          "color": "white",
          "border": "none",
          "padding": "5px 10px",
          "border-radius": "3px",
          "cursor": "pointer"
        }}
      >
        -1000 Particles
      </button>
    </div>
  );
};

export default ParticleControls;
