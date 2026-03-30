// Zustand store for warehouse state management
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { WarehouseLayout, Product, Level, UserRole, WarehousePermissions, WarehouseKPIs } from './types';

interface WarehouseState {
  // Data
  layout: WarehouseLayout | null;
  products: Product[];
  selectedSlot: Level | null;
  selectedProducts: string[];
  kpis: WarehouseKPIs | null;
  
  // UI State
  isLayoutEditorOpen: boolean;
  isProductModalOpen: boolean;
  isTransferDrawerOpen: boolean;
  searchQuery: string;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  
  // User & Permissions
  userRole: UserRole;
  permissions: WarehousePermissions;
  
  // Loading states
  isLoading: boolean;
  isLayoutLoading: boolean;
  isProductsLoading: boolean;
  
  // Actions
  setLayout: (layout: WarehouseLayout) => void;
  setProducts: (products: Product[]) => void;
  setSelectedSlot: (slot: Level | null) => void;
  setSelectedProducts: (productIds: string[]) => void;
  setKPIs: (kpis: WarehouseKPIs) => void;
  
  setLayoutEditorOpen: (open: boolean) => void;
  setProductModalOpen: (open: boolean) => void;
  setTransferDrawerOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setZoomLevel: (level: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  
  setUserRole: (role: UserRole) => void;
  setLoading: (loading: boolean) => void;
  setLayoutLoading: (loading: boolean) => void;
  setProductsLoading: (loading: boolean) => void;
  
  // Computed
  getSlotByCode: (code: string) => Level | null;
  getProductById: (id: string) => Product | null;
  getFilteredProducts: () => Product[];
  
  // Reset
  reset: () => void;
}

const initialState = {
  layout: null,
  products: [],
  selectedSlot: null,
  selectedProducts: [],
  kpis: null,
  isLayoutEditorOpen: false,
  isProductModalOpen: false,
  isTransferDrawerOpen: false,
  searchQuery: '',
  zoomLevel: 1,
  panOffset: { x: 0, y: 0 },
  userRole: 'operator' as UserRole,
  permissions: {
    canRead: true,
    canWrite: true,
    canEdit: false,
    canAdmin: false
  },
  isLoading: false,
  isLayoutLoading: false,
  isProductsLoading: false
};

export const useWarehouseStore = create<WarehouseState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setLayout: (layout) => set({ layout }),
      setProducts: (products) => set({ products }),
      setSelectedSlot: (selectedSlot) => set({ selectedSlot }),
      setSelectedProducts: (selectedProducts) => set({ selectedProducts }),
      setKPIs: (kpis) => set({ kpis }),

      setLayoutEditorOpen: (isLayoutEditorOpen) => set({ isLayoutEditorOpen }),
      setProductModalOpen: (isProductModalOpen) => set({ isProductModalOpen }),
      setTransferDrawerOpen: (isTransferDrawerOpen) => set({ isTransferDrawerOpen }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setZoomLevel: (zoomLevel) => set({ zoomLevel: Math.max(0.1, Math.min(3, zoomLevel)) }),
      setPanOffset: (panOffset) => set({ panOffset }),

      setUserRole: (userRole) => {
        const permissions = {
          canRead: true,
          canWrite: userRole !== 'viewer',
          canEdit: userRole === 'admin',
          canAdmin: userRole === 'admin'
        };
        set({ userRole, permissions });
      },

      setLoading: (isLoading) => set({ isLoading }),
      setLayoutLoading: (isLayoutLoading) => set({ isLayoutLoading }),
      setProductsLoading: (isProductsLoading) => set({ isProductsLoading }),

      getSlotByCode: (code) => {
        const { layout } = get();
        if (!layout) return null;
        
        for (const aisle of layout.aisles) {
          for (const bay of aisle.bays) {
            for (const location of bay.locations) {
              const level = location.levels?.find(l => l.code === code);
              if (level) return level;
            }
          }
        }
        return null;
      },

      getProductById: (id) => {
        const { products } = get();
        return products.find(p => p.id === id) || null;
      },

      getFilteredProducts: () => {
        const { products, searchQuery } = get();
        if (!searchQuery) return products;
        
        const query = searchQuery.toLowerCase();
        return products.filter(p => 
          p.sku.toLowerCase().includes(query) ||
          p.name.toLowerCase().includes(query) ||
          p.barcode?.toLowerCase().includes(query)
        );
      },

      reset: () => set(initialState)
    }),
    { name: 'warehouse-store' }
  )
);