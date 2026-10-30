const NodeCache = require('node-cache');

/**
 * In-Memory Caching Module for Task Manager REST API (Practical 9)
 * Student: Rushil Nariya (24IT055)
 *
 * Provides a configured NodeCache singleton instance with:
 * - Configurable TTL from environment variable CACHE_TTL_SECONDS (default 60s)
 * - Automatic background expiration check every 120s
 * - Deep cloning enabled (useClones: true) to prevent object mutation
 * - Granular Hit / Miss tracking for all-tasks and single-task queries
 * - Deterministic cache key generation
 */

let currentTTL = parseInt(process.env.CACHE_TTL_SECONDS, 10) || 60;

const cache = new NodeCache({
  stdTTL: currentTTL,
  checkperiod: 120,
  useClones: true // Ensures callers cannot mutate objects stored in cache
});

function getActiveTTL() {
  return parseInt(process.env.CACHE_TTL_SECONDS, 10) || currentTTL;
}

function setActiveTTL(seconds) {
  currentTTL = parseInt(seconds, 10) || 60;
  process.env.CACHE_TTL_SECONDS = currentTTL.toString();
}

// Granular hit/miss counters categorized by query type
const customStats = {
  allTasks: { hits: 0, misses: 0 },
  singleTask: { hits: 0, misses: 0 }
};

/**
 * Returns true if caching is enabled in environment (defaults to true).
 */
function isCacheEnabled() {
  if (process.env.CACHE_ENABLED === 'false' || process.env.CACHE_ENABLED === false) {
    return false;
  }
  return true;
}

/**
 * Generates deterministic cache keys.
 * Global scoping (matches current schema where tasks are not partitioned by user).
 *
 * @param {'all'|'single'} type
 * @param {string} [id]
 * @returns {string}
 */
function getCacheKey(type, id = null) {
  if (type === 'all') {
    return 'all_tasks';
  }
  if (type === 'single') {
    if (!id) throw new Error('Task ID is required for single task cache key');
    return `task:${id}`;
  }
  throw new Error(`Unknown cache key type: ${type}`);
}

/**
 * Record a cache hit for a specific query type
 */
function recordHit(type) {
  if (type === 'all') customStats.allTasks.hits++;
  else if (type === 'single') customStats.singleTask.hits++;
}

/**
 * Record a cache miss for a specific query type
 */
function recordMiss(type) {
  if (type === 'all') customStats.allTasks.misses++;
  else if (type === 'single') customStats.singleTask.misses++;
}

/**
 * Invalidate cache entries.
 * - If taskId is provided: removes 'all_tasks' AND `task:${taskId}`
 * - If no taskId: removes 'all_tasks'
 */
function invalidateTasksCache(taskId = null) {
  const keysDeleted = [];
  
  if (cache.has('all_tasks')) {
    cache.del('all_tasks');
    keysDeleted.push('all_tasks');
  }

  if (taskId) {
    const singleKey = `task:${taskId}`;
    if (cache.has(singleKey)) {
      cache.del(singleKey);
      keysDeleted.push(singleKey);
    }
  }

  return keysDeleted;
}

/**
 * Invalidate all cached single tasks and all_tasks key
 */
function flushAllCache() {
  cache.flushAll();
}

/**
 * Get aggregated statistics including hit ratios
 */
function getDetailedStats() {
  const nodeCacheStats = cache.getStats();
  const allHits = customStats.allTasks.hits;
  const allMisses = customStats.allTasks.misses;
  const allTotal = allHits + allMisses;
  const allRatio = allTotal > 0 ? parseFloat(((allHits / allTotal) * 100).toFixed(2)) : 0;

  const singleHits = customStats.singleTask.hits;
  const singleMisses = customStats.singleTask.misses;
  const singleTotal = singleHits + singleMisses;
  const singleRatio = singleTotal > 0 ? parseFloat(((singleHits / singleTotal) * 100).toFixed(2)) : 0;

  const totalHits = allHits + singleHits;
  const totalMisses = allMisses + singleMisses;
  const grandTotal = totalHits + totalMisses;
  const overallRatio = grandTotal > 0 ? parseFloat(((totalHits / grandTotal) * 100).toFixed(2)) : 0;

  return {
    cacheEnabled: isCacheEnabled(),
    configuredTTL: parseInt(process.env.CACHE_TTL_SECONDS, 10) || defaultTTL,
    keysCount: cache.keys().length,
    activeKeys: cache.keys(),
    breakdown: {
      allTasks: {
        hits: allHits,
        misses: allMisses,
        total: allTotal,
        hitRatioPercent: allRatio
      },
      singleTask: {
        hits: singleHits,
        misses: singleMisses,
        total: singleTotal,
        hitRatioPercent: singleRatio
      },
      overall: {
        hits: totalHits,
        misses: totalMisses,
        total: grandTotal,
        hitRatioPercent: overallRatio
      }
    },
    nodeCacheInternal: nodeCacheStats
  };
}

/**
 * Reset statistics counters and optionally clear cached data
 */
function resetStats(clearData = false) {
  customStats.allTasks.hits = 0;
  customStats.allTasks.misses = 0;
  customStats.singleTask.hits = 0;
  customStats.singleTask.misses = 0;
  if (clearData) {
    cache.flushAll();
  }
}

module.exports = {
  cache,
  isCacheEnabled,
  getActiveTTL,
  setActiveTTL,
  getCacheKey,
  recordHit,
  recordMiss,
  invalidateTasksCache,
  flushAllCache,
  getDetailedStats,
  resetStats
};
