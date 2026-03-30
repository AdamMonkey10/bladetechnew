// Router registration helper for warehouse module
import React from 'react';

import { WarehouseEntry } from './components/WarehouseEntry';

export function registerWarehouseRoute() {
  return {
    path: 'warehouse/*',
    element: <WarehouseEntry />
  };
}

// Feature flag check helper
export function isWarehouseEnabled(): boolean {
  // Check environment variable
  if (import.meta.env.VITE_FEATURES_WAREHOUSE === 'false') {
    return false;
  }

  // Check runtime feature flag (could come from API, localStorage, etc.)
  try {
    const features = JSON.parse(localStorage.getItem('features') || '{}');
    return features.warehouse !== false;
  } catch {
    // Default to enabled if no feature flag configuration
    return true;
  }
}