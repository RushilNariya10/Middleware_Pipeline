import { lazy } from 'react';

/**
 * lazyWithDelay - Dynamic import wrapper enforcing a minimum delay (default: 300ms)
 * Prevents jarring flash/flicker of loading fallback spinners on fast connections.
 * 
 * @param {() => Promise<{ default: React.ComponentType<any> }>} importFn
 * @param {number} delayMs - Minimum duration in ms before resolving
 */
export function lazyWithDelay(importFn, delayMs = 300) {
  return lazy(() =>
    Promise.all([
      importFn(),
      new Promise((resolve) => setTimeout(resolve, delayMs))
    ]).then(([moduleExports]) => moduleExports)
  );
}

export default lazyWithDelay;

