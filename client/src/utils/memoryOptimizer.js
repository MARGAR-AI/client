/**
 * Memory optimization utilities for the application
 * These functions help reduce memory footprint while preserving functionality
 */

import { saveToStorage, loadFromStorage } from './dataStorage';

/**
 * Constants for storage keys
 */
const STORAGE_KEYS = {
  PROJECTION_DATA: 'capacity.projectionData',
  CALCULATION_CACHE: 'capacity.calculationCache',
  PROVIDERS: 'data.providers',
  PROJECTS: 'data.projects',
  ASSIGNMENTS: 'data.assignments',
  SETTINGS: 'capacity.settings'
};

/**
 * Saves projection data to localStorage to reduce memory usage
 * @param {Array} projectionData - The projection data to save
 * @param {string} timeUnit - Current time unit (week, month, quarter)
 */
export const saveProjectionData = (projectionData, timeUnit) => {
  // Keep a copy in localStorage to reduce memory pressure
  // Also for faster restoration if user comes back to this view
  return saveToStorage(
    `${STORAGE_KEYS.PROJECTION_DATA}.${timeUnit}`,
    projectionData,
    120 // 2 hours TTL
  );
};

/**
 * Loads projection data from localStorage if available
 * @param {string} timeUnit - Current time unit (week, month, quarter)
 * @return {Array|null} The projection data or null if not found
 */
export const loadProjectionData = (timeUnit) => {
  return loadFromStorage(`${STORAGE_KEYS.PROJECTION_DATA}.${timeUnit}`);
};

/**
 * Saves capacity calculation cache to localStorage
 * @param {Object} cache - The calculation cache object
 * @param {string} timeUnit - Current time unit
 */
export const saveCalculationCache = (cache, timeUnit) => {
  return saveToStorage(
    `${STORAGE_KEYS.CALCULATION_CACHE}.${timeUnit}`,
    cache,
    240 // 4 hours TTL
  );
};

/**
 * Loads capacity calculation cache from localStorage
 * @param {string} timeUnit - Current time unit
 * @return {Object|null} The calculation cache or null
 */
export const loadCalculationCache = (timeUnit) => {
  return loadFromStorage(`${STORAGE_KEYS.CALCULATION_CACHE}.${timeUnit}`);
};

/**
 * Save providers data to localStorage
 * @param {Array} providers - The providers data
 */
export const saveProvidersData = (providers) => {
  return saveToStorage(STORAGE_KEYS.PROVIDERS, providers, 360); // 6 hours TTL
};

/**
 * Load providers data from localStorage
 * @return {Array|null} The providers data or null
 */
export const loadProvidersData = () => {
  return loadFromStorage(STORAGE_KEYS.PROVIDERS);
};

/**
 * Save projects data to localStorage
 * @param {Array} projects - The projects data
 */
export const saveProjectsData = (projects) => {
  return saveToStorage(STORAGE_KEYS.PROJECTS, projects, 360); // 6 hours TTL
};

/**
 * Load projects data from localStorage
 * @return {Array|null} The projects data or null
 */
export const loadProjectsData = () => {
  return loadFromStorage(STORAGE_KEYS.PROJECTS);
};

/**
 * Save assignments data to localStorage
 * @param {Array} assignments - The assignments data
 */
export const saveAssignmentsData = (assignments) => {
  return saveToStorage(STORAGE_KEYS.ASSIGNMENTS, assignments, 360); // 6 hours TTL
};

/**
 * Load assignments data from localStorage
 * @return {Array|null} The assignments data or null
 */
export const loadAssignmentsData = () => {
  return loadFromStorage(STORAGE_KEYS.ASSIGNMENTS);
};

/**
 * Save capacity settings to localStorage
 * @param {Object} settings - The settings object
 */
export const saveCapacitySettings = (settings) => {
  return saveToStorage(STORAGE_KEYS.SETTINGS, settings, 1440); // 24 hours TTL
};

/**
 * Load capacity settings from localStorage
 * @return {Object|null} The settings or null
 */
export const loadCapacitySettings = () => {
  return loadFromStorage(STORAGE_KEYS.SETTINGS);
};

/**
 * Generate a cache key from parameters
 * @param {string} prefix - Key prefix
 * @param {Array} params - Parameters to include in the cache key
 * @return {string} The cache key
 */
export const generateCacheKey = (prefix, ...params) => {
  // Create a deterministic key from the parameters
  return `${prefix}:${params.map(p => {
    if (p instanceof Date) {
      return p.toISOString();
    } else if (typeof p === 'object') {
      return JSON.stringify(p);
    }
    return String(p);
  }).join(':')}`;
};

/**
 * Simple LRU cache for memory-intensive calculations
 */
export class CalculationCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    if (!this.cache.has(key)) return undefined;
    
    // Get the value
    const value = this.cache.get(key);
    
    // Refresh the item (move to the end of map for LRU)
    this.cache.delete(key);
    this.cache.set(key, value);
    
    return value;
  }

  set(key, value) {
    // If key exists, delete it first
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    // If cache is full, remove oldest item (first item in map)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    // Add new item
    this.cache.set(key, value);
    return value;
  }

  clear() {
    this.cache.clear();
  }

  keys() {
    return [...this.cache.keys()];
  }

  size() {
    return this.cache.size;
  }
} 