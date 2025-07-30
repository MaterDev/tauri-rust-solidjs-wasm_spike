import { Component } from 'solid-js';

interface FpsChartProps {
  fpsHistory: number[];
  maxFpsHistory: number;
}

/**
 * FPS chart component for WASM particle system
 * Shows a simple line chart of FPS history
 */
const FpsChart: Component<FpsChartProps> = (props) => {
  const chartWidth = 200;
  const chartHeight = 60;
  const maxFps = 120; // Scale chart to 120 FPS max

  const createPath = () => {
    if (props.fpsHistory.length < 2) return '';
    
    const stepX = chartWidth / (props.maxFpsHistory - 1);
    const scaleY = chartHeight / maxFps;
    
    let path = '';
    props.fpsHistory.forEach((fps, index) => {
      const x = index * stepX;
      const y = chartHeight - (fps * scaleY);
      
      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });
    
    return path;
  };

  const averageFps = () => {
    if (props.fpsHistory.length === 0) return 0;
    const sum = props.fpsHistory.reduce((a, b) => a + b, 0);
    return Math.round(sum / props.fpsHistory.length);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      left: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '15px',
      'border-radius': '8px',
      'font-family': 'monospace',
      'font-size': '12px',
      'z-index': 1000,
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      <div style={{ 'margin-bottom': '10px', 'font-weight': 'bold', color: '#4ECDC4' }}>
        📊 FPS Chart
      </div>
      <div style={{ 'margin-bottom': '8px', color: '#96CEB4' }}>
        Avg: {averageFps()} FPS
      </div>
      <svg 
        width={chartWidth} 
        height={chartHeight}
        style={{ 
          background: 'rgba(255, 255, 255, 0.1)',
          'border-radius': '4px'
        }}
      >
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="20" height="15" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 15" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* FPS line */}
        <path
          d={createPath()}
          fill="none"
          stroke="#4ECDC4"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        
        {/* 60 FPS reference line */}
        <line
          x1="0"
          y1={chartHeight - (60 * chartHeight / maxFps)}
          x2={chartWidth}
          y2={chartHeight - (60 * chartHeight / maxFps)}
          stroke="rgba(254, 202, 87, 0.5)"
          stroke-width="1"
          stroke-dasharray="3,3"
        />
      </svg>
      <div style={{ 'margin-top': '5px', color: '#FECA57', 'font-size': '10px' }}>
        --- 60 FPS target
      </div>
    </div>
  );
};

export default FpsChart;
