import { Component, onCleanup, onMount, createSignal } from 'solid-js';
import { info, error } from '@tauri-apps/plugin-log';
import { invoke } from '@tauri-apps/api/core';
import { CanvasTestHarness_v2 } from './canvas-test/CanvasTestHarness_v2';
import { TestMode } from './canvas-test/types/CanvasTypes';
import PerformanceCharts from './canvas-test/PerformanceCharts';
import { SystemMetrics } from '../types/systemMetrics';

/**
 * Canvas Performance Test Component
 * Simulates real-world comic creation app scenarios to test PixiJS + WASM performance
 */
const CanvasPerformanceTest: Component = () => {
  const [fps, setFps] = createSignal<number>(0);
  const [objectCount, setObjectCount] = createSignal<number>(1000);
  const [testMode, setTestMode] = createSignal<string>('static');
  const [memoryUsage, setMemoryUsage] = createSignal<number>(0);
  const [cpuUsage, setCpuUsage] = createSignal<number>(0);
  const [processMemory, setProcessMemory] = createSignal<number>(0);
  const [renderTime, setRenderTime] = createSignal<number>(0);
  const [showCharts, setShowCharts] = createSignal<boolean>(true);
  
  // System metrics tracking
  let lastMetricsCheck = Date.now();
  const METRICS_CHECK_INTERVAL = 1000; // Check system metrics every second
  let metricsUpdateInterval: ReturnType<typeof setInterval> | undefined;

  let testHarness: CanvasTestHarness_v2 | null = null;
  let performanceMonitor: number | null = null;

  const initializeTest = async (containerElement: HTMLDivElement) => {
    try {
      info('Initializing Canvas Performance Test...');
      
      // Create test harness and initialize it
      testHarness = new CanvasTestHarness_v2(containerElement);
      const initialized = await testHarness.initialize();
      
      if (!initialized) {
        throw new Error('Failed to initialize test harness');
      }
      
      // Set test mode based on UI selection
      testHarness.setTestMode(getTestModeFromString(testMode()));
      
      // Create initial objects
      await testHarness.createObjects(objectCount());
      
      // Start performance monitoring
      startPerformanceMonitoring();
      
      info('Canvas Performance Test initialized');
    } catch (err: any) {
      error(`Failed to initialize canvas test: ${err}`);
      console.error('Canvas test initialization error:', err);
    }
  };

  const startPerformanceMonitoring = () => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    // Initialize system metrics tracking using Tauri backend
    const initializeSystemMetricsTracking = async () => {
      info('Initializing system metrics tracking via Tauri backend');
      try {
        await updateSystemMetrics();
        info('Initial system metrics retrieved successfully');
      } catch (err) {
        error(`Failed to initialize system metrics: ${err}`);
        console.error('System metrics initialization error:', err);
      }
    };
    
    // Update system metrics using the Tauri backend command
    const updateSystemMetrics = async () => {
      try {
        info('Calling get_system_metrics invoke...');
        const metrics: SystemMetrics = await invoke('get_system_metrics');
        info(`Raw metrics received: ${JSON.stringify(metrics)}`);
        
        // Set new values
        setCpuUsage(metrics.cpu_usage);
        setMemoryUsage(metrics.memory_usage_percent);
        setProcessMemory(metrics.process_memory_mb);
        
        // Log confirmation of updates
        info(`System metrics updated - CPU: ${metrics.cpu_usage.toFixed(1)}%, Memory: ${metrics.memory_usage_percent.toFixed(1)}%, Process: ${metrics.process_memory_mb.toFixed(1)}MB`);
      } catch (err) {
        error(`Error getting system metrics: ${err}`);
        console.error('System metrics update error:', err);
      }
    };
    
    // Start the system metrics tracking
    initializeSystemMetricsTracking();
    
    // Set up a regular interval for system metrics updates separate from the animation frame
    if (metricsUpdateInterval) {
      clearInterval(metricsUpdateInterval);
    }
    metricsUpdateInterval = setInterval(() => {
      updateSystemMetrics();
    }, METRICS_CHECK_INTERVAL);

    // Frame monitoring function
    const monitor = () => {
      if (!testHarness) {
        // If test harness is no longer available, stop monitoring
        return;
      }
      
      // Calculate FPS
      frameCount++;
      const now = performance.now();
      
      if (now - lastTime > 1000) { // Update every second
        // Get performance metrics from test harness
        const metrics = testHarness.getPerformanceMetrics();
        
        // Set state values for UI
        setFps(metrics.fps);
        setRenderTime(metrics.renderTime);
        
        // Reset for next calculation
        lastTime = now;
        frameCount = 0;
      }
      
      performanceMonitor = requestAnimationFrame(monitor);
    };
    
    monitor();
  };

  const updateObjectCount = async (delta: number) => {
    const newCount = Math.max(100, objectCount() + delta);
    setObjectCount(newCount);
    
    if (testHarness) {
      await testHarness.createObjects(newCount);
    }
  };

  const changeTestMode = async (mode: string) => {
    setTestMode(mode);
    
    if (testHarness) {
      // Convert string to TestMode enum
      const testMode = getTestModeFromString(mode);
      testHarness.setTestMode(testMode);
    }
  };
  
  /**
   * Convert test mode string to TestMode enum
   */
  const getTestModeFromString = (mode: string): TestMode => {
    switch (mode.toLowerCase()) {
      case 'static': return TestMode.Static;
      case 'interactive': return TestMode.Interactive;
      case 'rotating': return TestMode.Rotating;
      case 'scaling': return TestMode.Scaling;
      case 'stress': return TestMode.Stress;
      default: return TestMode.Static;
    }
  };

  onMount(() => {
    info('CanvasPerformanceTest component mounted');
    const container = document.querySelector('.canvas-container');
    if (container) {
      initializeTest(container as HTMLDivElement);
    }
  });

  onCleanup(() => {
    if (performanceMonitor) {
      cancelAnimationFrame(performanceMonitor);
    }
    
    if (testHarness) {
      testHarness.destroy();
    }
    
    info('Canvas performance test cleanup complete');
  });

  return (
    <div class="canvas-performance-test">
      {/* Performance Dashboard */}
      <div style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '15px',
        'border-radius': '8px',
        'font-family': 'monospace',
        'z-index': 1000,
        'min-width': '300px'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Canvas Performance Test</h3>
        
        <div style={{ 'margin-bottom': '10px' }}>
          <strong>FPS:</strong> <span style={{ color: fps() > 50 ? '#4CAF50' : fps() > 30 ? '#FF9800' : '#F44336' }}>{fps()}</span>
        </div>
        
        <div style={{ 'margin-bottom': '10px' }}>
          <strong>Objects:</strong> {objectCount().toLocaleString()}
        </div>
        
        <div style={{ 'margin-bottom': '10px' }}>
          <strong>Render Time:</strong> {renderTime().toFixed(2)}ms
        </div>
        
        <div style={{ 'margin-bottom': '10px' }}>
          <strong>CPU Usage:</strong> <span style={{ color: cpuUsage() < 50 ? '#4CAF50' : cpuUsage() < 80 ? '#FF9800' : '#F44336' }}>{cpuUsage().toFixed(1)}%</span>
        </div>

        <div style={{ 'margin-bottom': '10px' }}>
          <strong>Memory Usage:</strong> <span style={{ color: memoryUsage() < 50 ? '#4CAF50' : memoryUsage() < 80 ? '#FF9800' : '#F44336' }}>{memoryUsage().toFixed(1)}%</span>
        </div>
        
        <div style={{ 'margin-bottom': '15px' }}>
          <strong>Process Memory:</strong> {processMemory().toFixed(1)}MB
        </div>
        
        {/* Object Count Controls */}
        <div style={{ 'margin-bottom': '15px' }}>
          <div style={{ 'margin-bottom': '5px' }}><strong>Object Count:</strong></div>
          <button onClick={() => updateObjectCount(-1000)} style={{ 'margin-right': '5px' }}>-1K</button>
          <button onClick={() => updateObjectCount(-100)} style={{ 'margin-right': '5px' }}>-100</button>
          <button onClick={() => updateObjectCount(100)} style={{ 'margin-right': '5px' }}>+100</button>
          <button onClick={() => updateObjectCount(1000)}>+1K</button>
        </div>
        
        {/* Test Mode Controls */}
        <div style={{ 'margin-bottom': '15px' }}>
          <div style={{ 'margin-bottom': '5px' }}><strong>Test Mode:</strong></div>
          <select 
            value={testMode()} 
            onChange={(e) => changeTestMode(e.target.value)}
            style={{ width: '100%', padding: '5px' }}
          >
            <option value="static">Static Objects</option>
            <option value="rotating">Rotating Objects</option>
            <option value="scaling">Scaling Objects</option>
            <option value="interactive">Interactive (Mouse)</option>
            <option value="stress">Full Stress Test</option>
          </select>
        </div>
        
        {/* Charts Toggle */}
        <div>
          <button 
            onClick={() => setShowCharts(!showCharts())}
            style={{ width: '100%', padding: '5px', 'margin-top': '5px' }}
          >
            {showCharts() ? 'Hide Charts' : 'Show Charts'}
          </button>
        </div>
      </div>
      
      {/* Charts Container (bottom of screen) */}
      {showCharts() && (
        <div style={{
          position: 'fixed',
          bottom: '10px',
          left: '10px',
          right: '10px',
          'z-index': 1000,
          height: '220px'
        }}>
          <PerformanceCharts 
            fps={fps()} 
            renderTime={renderTime()} 
            cpuUsage={cpuUsage()} 
            memoryUsage={memoryUsage()} 
            processMemory={processMemory()} 
            objectCount={objectCount()} 
          />
        </div>
      )}
      
      {/* Canvas Container */}
      <div 
        class="canvas-container"
        style={{
          width: '100vw',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          background: '#f0f0f0',
          'z-index': 0
        }}
      />
    </div>
  );
};

export default CanvasPerformanceTest;
