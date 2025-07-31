import { info } from '@tauri-apps/plugin-log';
import { PerformanceMetrics } from '../types/CanvasTypes';

/**
 * Performance monitoring for canvas test harness
 */
export class PerformanceMonitor {
  private lastRenderTime: number = 0;
  private frameStartTime: number = 0;
  private objectCount: number = 0;

  /**
   * Start frame timing
   */
  startFrame(): void {
    this.frameStartTime = performance.now();
  }

  /**
   * End frame timing
   */
  endFrame(): void {
    this.lastRenderTime = performance.now() - this.frameStartTime;
  }

  /**
   * Set current object count
   */
  setObjectCount(count: number): void {
    this.objectCount = count;
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(fps: number): PerformanceMetrics {
    return {
      fps: fps,
      renderTime: this.lastRenderTime,
      objectCount: this.objectCount,
      memoryUsage: (performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0,
      interactionLatency: 0 // TODO: Implement interaction latency measurement
    };
  }
}
