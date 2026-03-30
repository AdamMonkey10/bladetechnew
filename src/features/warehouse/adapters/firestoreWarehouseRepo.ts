// Firestore implementation of WarehouseRepo
import type { WarehouseRepo } from '../repo/WarehouseRepo';
import type { WarehouseLayout, Product, SlotCode, StockMovement, SlotInventory, WarehouseKPIs } from '../types';

export class FirestoreWarehouseRepo implements WarehouseRepo {
  private db: any; // Firebase Firestore instance

  constructor(firestore: any) {
    this.db = firestore;
  }

  async getLayout(): Promise<WarehouseLayout> {
    // TODO: Replace with actual Firestore calls when implemented
    return {
      id: 'default-warehouse',
      name: 'Default Warehouse',
      updatedAt: new Date().toISOString(),
      aisles: []
    };
  }

  async saveLayout(layout: WarehouseLayout): Promise<void> {
    // Mock implementation
    console.log('Saving layout to Firestore:', layout.id);
  }

  async listProducts(q?: string): Promise<Product[]> {
    // TODO: Replace with actual Firestore calls when implemented
    return [];
  }

  async getProduct(id: string): Promise<Product | undefined> {
    // TODO: Replace with actual Firestore calls when implemented
    return undefined;
  }

  async upsertProduct(p: Product): Promise<void> {
    // TODO: Implement Firestore upsert
    throw new Error('Firestore implementation not yet available');
  }

  async deleteProduct(id: string): Promise<void> {
    // TODO: Implement Firestore delete
    throw new Error('Firestore implementation not yet available');
  }

  async moveStock(opts: StockMovement): Promise<void> {
    // TODO: Implement Firestore stock movement
    throw new Error('Firestore implementation not yet available');
  }

  async getSlotInventory(code: SlotCode): Promise<SlotInventory> {
    // TODO: Implement Firestore slot inventory lookup
    return { qty: 0 };
  }

  async updateSlotInventory(code: SlotCode, productId: string, quantity: number): Promise<void> {
    // TODO: Implement Firestore slot inventory update
    throw new Error('Firestore implementation not yet available');
  }

  async getKPIs(): Promise<WarehouseKPIs> {
    // TODO: Implement actual KPI calculations from Firestore
    return {
      totalSKUs: 0,
      unitsInToday: 0,
      unitsOutToday: 0,
      capacityUsedPercent: 0,
      replenishmentAlerts: 0
    };
  }

  async getStockHistory(days = 30): Promise<Array<{ date: string; totalStock: number }>> {
    // TODO: Implement actual stock history from Firestore
    return [];
  }

  subscribeLayout(cb: (layout: WarehouseLayout) => void): () => void {
    // TODO: Implement Firestore real-time subscription
    return () => {};
  }

  subscribeKPIs(cb: (kpis: WarehouseKPIs) => void): () => void {
    // TODO: Implement Firestore real-time subscription
    return () => {};
  }
}