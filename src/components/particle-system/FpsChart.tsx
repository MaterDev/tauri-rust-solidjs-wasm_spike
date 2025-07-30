import { Component, createEffect, onMount } from 'solid-js';

interface FpsChartProps {
  fpsHistory: number[];
  maxFpsHistory: number;
}

const FpsChart: Component<FpsChartProps> = (props) => {
  let canvasRef: HTMLCanvasElement | undefined;
  
  // Draw FPS chart on canvas
  const updateFpsChart = () => {
    if (!canvasRef) return;
    
    const ctx = canvasRef.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
    
    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvasRef.width, canvasRef.height);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    
    // Horizontal grid lines (FPS increments of 10)
    for (let i = 0; i <= 6; i++) { 
      const y = canvasRef.height - (i / 6) * canvasRef.height;
      ctx.moveTo(0, y);
      ctx.lineTo(canvasRef.width, y);
      
      // Add FPS label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${i * 10}`, 5, y - 5);
    }
    ctx.stroke();
    
    // Draw FPS line
    const history = props.fpsHistory;
    if (history.length > 1) {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const step = canvasRef.width / (props.maxFpsHistory - 1);
      
      history.forEach((fps, index) => {
        const x = index * step;
        const y = canvasRef.height - (fps / 60) * canvasRef.height;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
    }
    
    // Draw title
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FPS CHART', canvasRef.width / 2, 15);
  };
  
  // Update chart when FPS history changes
  createEffect(() => {
    if (props.fpsHistory) {
      updateFpsChart();
    }
  });
  
  return (
    <div
      style={{
        "position": "absolute",
        "bottom": "10px",
        "left": "10px",
        "z-index": 100
      }}
    >
      <canvas 
        ref={canvasRef}
        width="300" 
        height="150"
        style={{
          "border-radius": "5px",
          "box-shadow": "0 0 10px rgba(0, 0, 0, 0.5)"
        }}
      />
    </div>
  );
};

export default FpsChart;
