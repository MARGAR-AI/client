/**
 * Virtualization utilities for optimizing DOM rendering
 * Only renders elements that are currently visible or close to viewport
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Box } from '@mui/material';

/**
 * Custom hook for managing virtualized items
 * @param {Array} items - The full array of items
 * @param {number} itemWidth - Width of each item (in px)
 * @param {number} overscan - Number of items to render beyond visible area
 * @param {function} getItemKey - Function to get a unique key for each item
 * @returns {Object} Virtualization utilities
 */
export const useVirtualizedItems = (
  items, 
  itemWidth, 
  overscan = 2, 
  getItemKey = (item, index) => index
) => {
  const [visibleIndices, setVisibleIndices] = useState({ start: 0, end: 10 });
  const containerRef = useRef(null);
  
  // Calculate visible items based on scroll position
  const calculateVisibleItems = useCallback(() => {
    if (!containerRef.current || !items.length) return;
    
    const container = containerRef.current;
    const { scrollLeft, clientWidth } = container;
    
    // Calculate which items are visible
    const startIndex = Math.max(0, Math.floor(scrollLeft / itemWidth) - overscan);
    const endIndex = Math.min(
      items.length - 1, 
      Math.ceil((scrollLeft + clientWidth) / itemWidth) + overscan
    );
    
    setVisibleIndices({ start: startIndex, end: endIndex });
  }, [items.length, itemWidth, overscan]);
  
  // Set up scroll event handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Initial calculation
    calculateVisibleItems();
    
    // Add scroll event listener
    container.addEventListener('scroll', calculateVisibleItems);
    
    // Clean up
    return () => {
      container.removeEventListener('scroll', calculateVisibleItems);
    };
  }, [calculateVisibleItems]);
  
  // Recalculate visible items when items array changes
  useEffect(() => {
    calculateVisibleItems();
  }, [items, calculateVisibleItems]);
  
  // Get only the items that should be rendered
  const visibleItems = items.slice(visibleIndices.start, visibleIndices.end + 1);
  
  // Generate spacer sizes
  const startSpacerWidth = visibleIndices.start * itemWidth;
  const endSpacerWidth = Math.max(0, (items.length - visibleIndices.end - 1) * itemWidth);
  
  return {
    containerRef,
    visibleItems,
    allItems: items,
    startSpacerWidth,
    endSpacerWidth,
    visibleIndices,
    getItemKey,
    itemWidth
  };
};

/**
 * Virtualized container component
 */
export const VirtualizedContainer = ({
  items,
  itemWidth,
  renderItem,
  height = 350,
  getItemKey = (item, index) => index,
  className,
  style = {},
  overscan = 2
}) => {
  const {
    containerRef,
    visibleItems,
    startSpacerWidth,
    endSpacerWidth,
    visibleIndices
  } = useVirtualizedItems(items, itemWidth, overscan, getItemKey);
  
  return (
    <Box
      ref={containerRef}
      className={className}
      sx={{
        position: 'relative',
        overflowX: 'auto',
        overflowY: 'hidden',
        height,
        ...style
      }}
    >
      <Box sx={{ position: 'relative', height: '100%', width: items.length * itemWidth }}>
        {/* Start spacer */}
        {startSpacerWidth > 0 && (
          <Box sx={{ position: 'absolute', left: 0, width: startSpacerWidth, height: '100%' }} />
        )}
        
        {/* Visible items */}
        {visibleItems.map((item, localIndex) => {
          const globalIndex = localIndex + visibleIndices.start;
          return (
            <Box
              key={getItemKey(item, globalIndex)}
              sx={{
                position: 'absolute',
                left: globalIndex * itemWidth,
                width: itemWidth,
                height: '100%'
              }}
            >
              {renderItem(item, globalIndex)}
            </Box>
          );
        })}
        
        {/* End spacer */}
        {endSpacerWidth > 0 && (
          <Box
            sx={{
              position: 'absolute',
              left: (visibleIndices.end + 1) * itemWidth,
              width: endSpacerWidth,
              height: '100%'
            }}
          />
        )}
      </Box>
    </Box>
  );
};

/**
 * Optimized rendering of capacity indicators at the top of the chart
 */
export const VirtualizedIndicators = ({
  items,
  renderIndicator,
  barWidth,
  height = 40,
  getItemKey = (item, index) => `indicator-${index}`
}) => {
  // Calculate itemWidth based on percentage
  const containerWidth = 100;
  const itemWidth = containerWidth / items.length;
  
  const {
    containerRef,
    visibleItems,
    visibleIndices
  } = useVirtualizedItems(
    items, 
    itemWidth,
    3, // Overscan
    getItemKey
  );
  
  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width: '100%',
        height,
        overflowX: 'auto'
      }}
    >
      {visibleItems.map((item, localIndex) => {
        const globalIndex = localIndex + visibleIndices.start;
        return renderIndicator(item, globalIndex, barWidth);
      })}
    </Box>
  );
}; 