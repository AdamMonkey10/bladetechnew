// Hook for shelf/slot selection logic
import { useCallback } from 'react';
import { useWarehouseStore } from '../store';
import { useWarehouseEvents } from './useWarehouseEvents';
import type { Level } from '../types';

export function useShelfSelection() {
  const {
    selectedSlot,
    setSelectedSlot,
    layout,
    searchQuery,
    setSearchQuery,
    zoomLevel,
    setZoomLevel,
    panOffset,
    setPanOffset
  } = useWarehouseStore();

  const { trackSlotSelection } = useWarehouseEvents();

  const selectSlot = useCallback((slot: Level | null) => {
    setSelectedSlot(slot);
    if (slot) {
      // Find the aisle for analytics
      const aisle = layout?.aisles.find(a => 
        a.bays.some(b => 
          b.locations.some(l => 
            l.levels?.some(level => level.id === slot.id)
          )
        )
      );
      trackSlotSelection(slot.code, aisle?.id || 'unknown');
    }
  }, [setSelectedSlot, layout, trackSlotSelection]);

  const jumpToSlot = useCallback((slotCode: string) => {
    if (!layout) return false;

    // Find slot by code
    for (const aisle of layout.aisles) {
      for (const bay of aisle.bays) {
        for (const location of bay.locations) {
          const slot = location.levels?.find(l => l.code === slotCode);
          if (slot) {
            selectSlot(slot);
            // Set simple centered position
            setPanOffset({ x: 0, y: 0 });
            setZoomLevel(2); // Zoom in when jumping
            return true;
          }
        }
      }
    }
    return false;
  }, [layout, selectSlot, setPanOffset, setZoomLevel]);

  const searchAndJump = useCallback((query: string) => {
    setSearchQuery(query);
    
    // Try to jump to slot if query looks like a slot code
    const slotCodePattern = /^[A-Z]-[0-9]+-[A-Z]-[0-9]+$/i;
    if (slotCodePattern.test(query)) {
      return jumpToSlot(query.toUpperCase());
    }
    
    return false;
  }, [setSearchQuery, jumpToSlot]);

  const clearSelection = useCallback(() => {
    setSelectedSlot(null);
  }, [setSelectedSlot]);

  const resetView = useCallback(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    clearSelection();
  }, [setZoomLevel, setPanOffset, clearSelection]);

  return {
    selectedSlot,
    selectSlot,
    jumpToSlot,
    searchAndJump,
    clearSelection,
    resetView,
    searchQuery,
    zoomLevel,
    panOffset,
    setZoomLevel,
    setPanOffset
  };
}