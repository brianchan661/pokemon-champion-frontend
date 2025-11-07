import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  interactionTime?: number;
  timestamp: number;
}

/**
 * Hook for monitoring component render performance
 */
export const useRenderPerformance = (componentName: string) => {
  const renderStartTime = useRef<number>(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    
    return () => {
      if (renderStartTime.current > 0) {
        const renderTime = performance.now() - renderStartTime.current;
        
        if (process.env.NODE_ENV === 'development' && renderTime > 16) {
          console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
        }
        
        if (process.env.NODE_ENV === 'production' && renderTime > 50) {
          reportPerformanceMetric({
            componentName,
            renderTime,
            timestamp: Date.now(),
          });
        }
      }
    };
  });
};

/**
 * Hook for tracking user interaction performance
 */
export const useInteractionTracking = (componentName: string) => {
  const trackInteraction = useCallback((interactionType: string) => {
    if (process.env.NODE_ENV === 'development') {
      const startTime = performance.now();
      
      requestAnimationFrame(() => {
        const interactionTime = performance.now() - startTime;
        
        if (interactionTime > 100) {
          console.warn(`Slow interaction in ${componentName} (${interactionType}): ${interactionTime.toFixed(2)}ms`);
        }
      });
    }
  }, [componentName]);

  return { trackInteraction };
};

/**
 * Combined hook for backward compatibility
 */
export const usePerformanceMonitor = (componentName: string) => {
  useRenderPerformance(componentName);
  return useInteractionTracking(componentName);
};

/**
 * Singleton class for batched metrics reporting to avoid excessive API calls
 */
class PerformanceReporter {
  private metricsQueue: PerformanceMetrics[] = [];
  private reportingTimer: NodeJS.Timeout | null = null;
  private readonly MAX_QUEUE_SIZE = 20; // Increased for better batching
  private readonly BATCH_DELAY = 3000; // Slightly longer delay
  private readonly IMMEDIATE_REPORT_THRESHOLD = 8; // More conservative threshold

  reportMetric(metrics: PerformanceMetrics): void {
    if (typeof window === 'undefined') return;

    // Prevent queue overflow with FIFO behavior
    if (this.metricsQueue.length >= this.MAX_QUEUE_SIZE) {
      this.metricsQueue.shift(); // Remove oldest metric instead of flushing all
    }

    this.metricsQueue.push(metrics);
    this.scheduleReport();
  }

  private scheduleReport(): void {
    if (this.reportingTimer) {
      clearTimeout(this.reportingTimer);
    }

    const shouldReportImmediately = this.metricsQueue.length >= this.IMMEDIATE_REPORT_THRESHOLD;
    const delay = shouldReportImmediately ? 100 : this.BATCH_DELAY;

    this.reportingTimer = setTimeout(() => {
      this.flushMetrics();
      this.reportingTimer = null; // Clear reference to prevent memory leaks
    }, delay);
  }

  private flushMetrics(): void {
    if (this.metricsQueue.length === 0) return;

    const reportMetrics = () => {
      if ('gtag' in window && this.metricsQueue.length > 0) {
        // Report aggregated metrics
        const avgRenderTime = this.metricsQueue.reduce((sum, m) => sum + m.renderTime, 0) / this.metricsQueue.length;
        const slowComponents = this.metricsQueue.filter(m => m.renderTime > 50);

        (window as any).gtag('event', 'performance_batch', {
          avg_render_time: Math.round(avgRenderTime),
          slow_components_count: slowComponents.length,
          total_measurements: this.metricsQueue.length,
          event_category: 'performance',
        });

        // Report individual slow components (limit to prevent spam)
        slowComponents.slice(0, 3).forEach(metric => {
          (window as any).gtag('event', 'slow_component', {
            component_name: metric.componentName,
            render_time: Math.round(metric.renderTime),
            event_category: 'performance',
          });
        });
      }

      // Clear queue
      this.metricsQueue = [];
      this.reportingTimer = null;
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(reportMetrics, { timeout: 5000 });
    } else {
      setTimeout(reportMetrics, 0);
    }
  }
}

// Singleton instance
const performanceReporter = new PerformanceReporter();

const reportPerformanceMetric = (metrics: PerformanceMetrics) => {
  performanceReporter.reportMetric(metrics);
};

/**
 * Hook for monitoring Core Web Vitals
 */
export const useWebVitals = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Monitor Largest Contentful Paint (LCP)
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      if (lastEntry && lastEntry.startTime > 2500) {
        console.warn(`Poor LCP detected: ${lastEntry.startTime.toFixed(2)}ms`);
      }
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // Browser doesn't support this metric
    }

    return () => observer.disconnect();
  }, []);
};