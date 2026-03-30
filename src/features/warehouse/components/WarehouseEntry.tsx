// Main entry component for warehouse module
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';

// Import components directly instead of lazy loading
import Dashboard from './Dashboard';
import ShelfMap from './ShelfMap/ShelfMap';
import InventoryTable from './Inventory/InventoryTable';
import LayoutEditor from './Editor/LayoutEditor';
import WarehouseBuilder from './Builder/WarehouseBuilder';
import GoodsMovement from './GoodsMovement/GoodsMovement';

// Create dedicated query client for warehouse
const warehouseQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
  },
});


function WarehouseErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      console.error('Warehouse module error:', error);
      setHasError(true);
    };

    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (hasError) {
    return (
      <Card className="p-6 m-6">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-destructive">
            Warehouse Module Error
          </h2>
          <p className="text-muted-foreground">
            Something went wrong loading the warehouse module. Please refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Refresh Page
          </button>
        </div>
      </Card>
    );
  }

  return <>{children}</>;
}

export function WarehouseEntry() {
  return (
    <QueryClientProvider client={warehouseQueryClient}>
      <WarehouseErrorBoundary>
        <div className="warehouse-module">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="shelf-map" element={<ShelfMap />} />
            <Route path="inventory" element={<InventoryTable />} />
            <Route path="goods-movement" element={<GoodsMovement />} />
            <Route path="editor" element={<LayoutEditor />} />
            <Route path="builder" element={<WarehouseBuilder />} />
            <Route path="*" element={<Navigate to="." replace />} />
          </Routes>
        </div>
      </WarehouseErrorBoundary>
    </QueryClientProvider>
  );
}