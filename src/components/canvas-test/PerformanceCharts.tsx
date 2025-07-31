import { Component, onMount, onCleanup, createEffect } from 'solid-js';
import { Chart, registerables } from 'chart.js';

// Register all Chart.js components
Chart.register(...registerables);

// Maximum number of data points to keep in history
const MAX_DATA_POINTS = 100;

// Define the props interface
interface PerformanceChartsProps {
  fps: number;
  renderTime: number;
  cpuUsage: number;
  memoryUsage: number;
  processMemory: number;
  objectCount: number;
}

/**
 * Performance Charts Component
 * Displays real-time line graphs for FPS, render time, and memory usage
 */
const PerformanceCharts: Component<PerformanceChartsProps> = (props) => {
  let fpsChartRef: HTMLCanvasElement | undefined;
  let renderTimeChartRef: HTMLCanvasElement | undefined;
  let memoryChartRef: HTMLCanvasElement | undefined;
  
  let fpsChart: Chart | null = null;
  let renderTimeChart: Chart | null = null;
  let memoryChart: Chart | null = null;
  
  // Time labels (x-axis)
  const timeLabels: string[] = [];
  
  // Datasets
  const fpsData: number[] = [];
  const renderTimeData: number[] = [];
  const cpuData: number[] = [];
  const memoryData: number[] = [];
  const processMemoryData: number[] = [];
  const objectCountData: number[] = [];
  
  // Initialize timestamp for x-axis
  let startTime = Date.now();
  
  const addDataPoint = (label: string) => {
    // Add new data point
    timeLabels.push(label);
    fpsData.push(props.fps);
    renderTimeData.push(props.renderTime);
    cpuData.push(props.cpuUsage);
    memoryData.push(props.memoryUsage);
    processMemoryData.push(props.processMemory);
    objectCountData.push(props.objectCount);
    
    // Limit data points
    if (timeLabels.length > MAX_DATA_POINTS) {
      timeLabels.shift();
      fpsData.shift();
      renderTimeData.shift();
      cpuData.shift();
      memoryData.shift();
      processMemoryData.shift();
      objectCountData.shift();
    }
    
    // Update charts
    updateCharts();
  };
  
  const updateCharts = () => {
    if (fpsChart) {
      fpsChart.update();
    }
    
    if (renderTimeChart) {
      renderTimeChart.update();
    }
    
    if (memoryChart) {
      memoryChart.update();
    }
  };
  
  // Common chart options
  const getChartOptions = (title: string, yAxisLabel: string, suggestedMin = 0, suggestedMax: number | undefined = undefined) => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 0 // Disable animations for better performance
      },
      plugins: {
        title: {
          display: true,
          text: title,
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false
        },
        legend: {
          position: 'top' as const
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Time (seconds)'
          }
        },
        y: {
          title: {
            display: true,
            text: yAxisLabel
          },
          suggestedMin,
          suggestedMax,
          ticks: {
            callback: (value: number) => {
              if (yAxisLabel === 'Usage') {
                // Format based on dataset label (CPU %, Memory %, or Process Memory MB)
                if (value > 0 && value < 100) {
                  // Likely a percentage value
                  return `${value.toFixed(1)}%`;
                } else {
                  // Likely MB value
                  return `${value.toFixed(1)} MB`;
                }
              } else if (yAxisLabel === 'Render Time (ms)') {
                return `${value.toFixed(1)}`;
              }
              return value;
            }
          }
        },
        y1: {
          type: 'linear',
          position: 'right',
          title: {
            display: true,
            text: 'Object Count'
          },
          grid: {
            drawOnChartArea: false
          }
        }
      }
    };
  };
  
  // Initialize charts
  const initializeCharts = () => {
    if (fpsChartRef) {
      fpsChart = new Chart(fpsChartRef, {
        type: 'line',
        data: {
          labels: timeLabels,
          datasets: [
            {
              label: 'FPS',
              data: fpsData,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.2,
              yAxisID: 'y'
            },
            {
              label: 'Object Count',
              data: objectCountData,
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderDash: [5, 5],
              tension: 0,
              yAxisID: 'y1'
            }
          ]
        },
        options: getChartOptions('FPS', 'Frames Per Second', 0, 120)
      });
    }
    
    if (renderTimeChartRef) {
      renderTimeChart = new Chart(renderTimeChartRef, {
        type: 'line',
        data: {
          labels: timeLabels,
          datasets: [
            {
              label: 'Render Time',
              data: renderTimeData,
              borderColor: 'rgb(153, 102, 255)',
              backgroundColor: 'rgba(153, 102, 255, 0.2)',
              tension: 0.2,
              yAxisID: 'y'
            },
            {
              label: 'Object Count',
              data: objectCountData,
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderDash: [5, 5],
              tension: 0,
              yAxisID: 'y1'
            }
          ]
        },
        options: getChartOptions('Render Time', 'Render Time (ms)')
      });
    }
    
    if (memoryChartRef) {
      memoryChart = new Chart(memoryChartRef, {
        type: 'line',
        data: {
          labels: timeLabels,
          datasets: [
            {
              label: 'System Memory Usage (%)',
              data: memoryData,
              borderColor: 'rgb(255, 159, 64)',
              backgroundColor: 'rgba(255, 159, 64, 0.2)',
              tension: 0.2,
              yAxisID: 'y'
            },
            {
              label: 'Process Memory (MB)',
              data: processMemoryData,
              borderColor: 'rgb(75, 75, 192)',
              backgroundColor: 'rgba(75, 75, 192, 0.2)',
              tension: 0.2,
              yAxisID: 'y'
            },
            {
              label: 'CPU Usage (%)',
              data: cpuData,
              borderColor: 'rgb(192, 75, 75)',
              backgroundColor: 'rgba(192, 75, 75, 0.2)',
              tension: 0.2,
              yAxisID: 'y'
            },
            {
              label: 'Object Count',
              data: objectCountData,
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderDash: [5, 5],
              tension: 0,
              yAxisID: 'y1'
            }
          ]
        },
        options: getChartOptions('System Resources', 'Usage')
      });
    }
  };
  
  // Update charts when props change
  createEffect(() => {
    // Only add datapoints when we have non-zero values (avoid initial empty charts)
    if (props.fps > 0 || props.renderTime > 0 || props.objectCount > 0) {
      const seconds = ((Date.now() - startTime) / 1000).toFixed(0);
      addDataPoint(`${seconds}s`);
    }
  });
  
  onMount(() => {
    initializeCharts();
  });
  
  onCleanup(() => {
    // Destroy charts to prevent memory leaks
    if (fpsChart) {
      fpsChart.destroy();
    }
    if (renderTimeChart) {
      renderTimeChart.destroy();
    }
    if (memoryChart) {
      memoryChart.destroy();
    }
  });
  
  return (
    <div class="performance-charts">
      <div class="charts-container" style={{
        'display': 'flex',
        'flex-direction': 'row',
        'justify-content': 'space-between',
        'width': '100%',
        'height': '200px',
        'margin-top': '20px',
        'padding': '10px',
        'background': 'rgba(255, 255, 255, 0.9)',
        'border-radius': '8px',
        'box-shadow': '0 2px 10px rgba(0, 0, 0, 0.1)'
      }}>
        <div class="chart-wrapper" style={{ 'width': '32%', 'height': '100%' }}>
          <canvas ref={fpsChartRef}></canvas>
        </div>
        <div class="chart-wrapper" style={{ 'width': '32%', 'height': '100%' }}>
          <canvas ref={renderTimeChartRef}></canvas>
        </div>
        <div class="chart-wrapper" style={{ 'width': '32%', 'height': '100%' }}>
          <canvas ref={memoryChartRef}></canvas>
        </div>
      </div>
    </div>
  );
};

export default PerformanceCharts;
