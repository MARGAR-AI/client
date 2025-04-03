/**
 * Utilities for storing and retrieving data from localStorage
 * This reduces memory usage by offloading non-critical data to localStorage
 */

/**
 * Save data to localStorage with a TTL (time to live)
 * @param {string} key - Key to save data under
 * @param {any} data - Data to save (will be JSON stringified)
 * @param {number} ttlMinutes - Time to live in minutes (default: 60 - 1 hour)
 */
export const saveToStorage = (key, data, ttlMinutes = 60) => {
  try {
    const item = {
      data,
      expiry: Date.now() + (ttlMinutes * 60 * 1000)
    };
    localStorage.setItem(key, JSON.stringify(item));
    console.log(`Data saved to storage under key: ${key}`);
    return true;
  } catch (error) {
    console.error(`Error saving data to storage:`, error);
    // If localStorage is full, try clearing old data
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      clearOldStorageData();
      // Try again
      try {
        localStorage.setItem(key, JSON.stringify({
          data,
          expiry: Date.now() + (ttlMinutes * 60 * 1000)
        }));
        return true;
      } catch (retryError) {
        console.error(`Retry error saving data to storage:`, retryError);
      }
    }
    return false;
  }
};

/**
 * Load data from localStorage if it exists and hasn't expired
 * @param {string} key - Key to load data from
 * @param {any} defaultValue - Default value if key doesn't exist or has expired
 * @return {any} The data or defaultValue
 */
export const loadFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    
    const parsedItem = JSON.parse(item);
    
    // Check if item has expired
    if (parsedItem.expiry && parsedItem.expiry < Date.now()) {
      localStorage.removeItem(key);
      return defaultValue;
    }
    
    return parsedItem.data;
  } catch (error) {
    console.error(`Error loading data from storage:`, error);
    return defaultValue;
  }
};

/**
 * Clear all keys that start with a certain prefix
 * @param {string} prefix - Prefix of keys to clear
 */
export const clearStorageWithPrefix = (prefix) => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`Cleared ${keysToRemove.length} items with prefix '${prefix}' from storage`);
  } catch (error) {
    console.error(`Error clearing storage with prefix '${prefix}':`, error);
  }
};

/**
 * Clear expired data from localStorage
 */
export const clearExpiredStorage = () => {
  try {
    const now = Date.now();
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      try {
        const item = JSON.parse(localStorage.getItem(key));
        if (item.expiry && item.expiry < now) {
          keysToRemove.push(key);
        }
      } catch (e) {
        // Skip items that aren't JSON or don't have expiry
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`Cleared ${keysToRemove.length} expired items from storage`);
  } catch (error) {
    console.error(`Error clearing expired storage:`, error);
  }
};

/**
 * Clear old storage data to free up space
 * This is called when localStorage quota is exceeded
 */
export const clearOldStorageData = () => {
  try {
    // First try to clear expired data
    clearExpiredStorage();
    
    // If we still need space, remove the oldest items
    const items = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      try {
        const value = localStorage.getItem(key);
        const item = JSON.parse(value);
        if (item.expiry) {
          items.push({ key, expiry: item.expiry });
        }
      } catch (e) {
        // Skip items that aren't JSON or don't have expiry
      }
    }
    
    // Sort by expiry (oldest first)
    items.sort((a, b) => a.expiry - b.expiry);
    
    // Remove oldest 20% of items
    const removeCount = Math.ceil(items.length * 0.2);
    items.slice(0, removeCount).forEach(item => localStorage.removeItem(item.key));
    
    console.log(`Cleared ${removeCount} oldest items from storage to free up space`);
  } catch (error) {
    console.error(`Error clearing old storage data:`, error);
  }
};

/**
 * Check storage usage
 * @return {Object} Object with usage information
 */
export const getStorageUsage = () => {
  try {
    let totalSize = 0;
    let count = 0;
    const prefixSizes = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      const value = localStorage.getItem(key);
      const size = (key.length + value.length) * 2; // Approximate size in bytes
      totalSize += size;
      count++;
      
      // Track size by prefix
      const prefixMatch = key.match(/^([^.]+)\./);
      const prefix = prefixMatch ? prefixMatch[1] : 'other';
      
      if (!prefixSizes[prefix]) {
        prefixSizes[prefix] = 0;
      }
      prefixSizes[prefix] += size;
    }
    
    return {
      totalSize: (totalSize / 1024 / 1024).toFixed(2) + ' MB', // Convert to MB
      itemCount: count,
      prefixSizes: Object.fromEntries(
        Object.entries(prefixSizes).map(([k, v]) => [k, (v / 1024).toFixed(2) + ' KB'])
      )
    };
  } catch (error) {
    console.error(`Error calculating storage usage:`, error);
    return { error: error.message };
  }
}; 