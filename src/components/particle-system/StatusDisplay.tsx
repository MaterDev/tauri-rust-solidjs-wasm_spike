import { Component } from 'solid-js';

interface StatusDisplayProps {
  fps: number;
  particleCount: number;
  status: string;
}

const StatusDisplay: Component<StatusDisplayProps> = (props) => {
  return (
    <div
      style={{
        "position": "absolute",
        "top": "10px",
        "left": "10px",
        "background": "rgba(0, 0, 0, 0.5)",
        "padding": "5px",
        "border-radius": "3px",
        "color": "white",
        "font-family": "monospace",
        "z-index": 100
      }}
    >
      FPS: {props.fps} | Particles: {props.particleCount} | {props.status}
    </div>
  );
};

export default StatusDisplay;
