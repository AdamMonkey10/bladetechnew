// Analytics and event tracking hook for warehouse
import { useCallback } from 'react';

export interface WarehouseEvent {
  type: 'slot_selected' | 'product_moved' | 'layout_edited' | 'product_created' | 'search_performed';
  data: Record<string, any>;
  timestamp: number;
}

export function useWarehouseEvents() {
  const trackEvent = useCallback((type: WarehouseEvent['type'], data: Record<string, any>) => {
    const event: WarehouseEvent = {
      type,
      data,
      timestamp: Date.now()
    };

    // Send to analytics service
    console.log('Warehouse Event:', event);
    
    // You can integrate with your analytics provider here
    // Example: analytics.track('warehouse_event', event);
  }, []);

  const trackSlotSelection = useCallback((slotCode: string, zoneId: string) => {
    trackEvent('slot_selected', { slotCode, zoneId });
  }, [trackEvent]);

  const trackProductMove = useCallback((fromSlot?: string, toSlot?: string, productId?: string, quantity?: number) => {
    trackEvent('product_moved', { fromSlot, toSlot, productId, quantity });
  }, [trackEvent]);

  const trackLayoutEdit = useCallback((action: string, details: Record<string, any>) => {
    trackEvent('layout_edited', { action, ...details });
  }, [trackEvent]);

  const trackProductCreation = useCallback((productId: string, sku: string) => {
    trackEvent('product_created', { productId, sku });
  }, [trackEvent]);

  const trackSearch = useCallback((query: string, resultCount: number) => {
    trackEvent('search_performed', { query, resultCount });
  }, [trackEvent]);

  return {
    trackEvent,
    trackSlotSelection,
    trackProductMove,
    trackLayoutEdit,
    trackProductCreation,
    trackSearch
  };
}