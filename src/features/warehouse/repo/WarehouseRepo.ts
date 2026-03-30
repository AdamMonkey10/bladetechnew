// Repository interface for warehouse operations
import type { WarehouseLayout, Product, SlotCode, StockMovement, SlotInventory, WarehouseKPIs } from '../types';

export interface WarehouseRepo {
  // Layout operations
  getLayout(): Promise<WarehouseLayout>;
  saveLayout(layout: WarehouseLayout): Promise<void>;
  
  // Product operations
  listProducts(q?: string): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  upsertProduct(p: Product): Promise<void>;
  deleteProduct(id: string): Promise<void>;
  
  // Stock operations
  moveStock(opts: StockMovement): Promise<void>;
  getSlotInventory(code: SlotCode): Promise<SlotInventory>;
  updateSlotInventory(code: SlotCode, productId: string, quantity: number): Promise<void>;
  
  // Analytics
  getKPIs(): Promise<WarehouseKPIs>;
  getStockHistory(days?: number): Promise<Array<{ date: string; totalStock: number }>>;
  
  // Real-time subscriptions
  subscribeLayout(cb: (layout: WarehouseLayout) => void): () => void;
  subscribeKPIs(cb: (kpis: WarehouseKPIs) => void): () => void;
}