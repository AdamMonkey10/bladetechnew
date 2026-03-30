// Warehouse domain types
export type SlotCode = `${string}-${string}-${string}-${string}`; // A-10-A-11

export interface WarehouseLayout {
  id: string;
  name: string;
  updatedAt: string;
  aisles: Aisle[];
}

export interface Aisle {
  id: string;
  name: string;
  bays: Bay[];
}

export interface Bay {
  id: string;
  name: string;
  maxWeightKg?: number;
  locations: Location[];
}

export interface Location {
  id: string;
  name: string;
  levels: Level[];
}

export interface Level {
  id: string;
  code: SlotCode;
  levelNumber: number;
  maxWeightKg?: number;
  constraints?: string[];
  productId?: string;
  quantity?: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  barcode?: string;
  dimsMm?: { l: number; w: number; h: number };
  weightKg?: number;
  minQty?: number;
  maxQty?: number;
  expiryDate?: string;
  attributes?: Record<string, string>;
}

export interface WarehouseKPIs {
  totalSKUs: number;
  unitsInToday: number;
  unitsOutToday: number;
  capacityUsedPercent: number;
  replenishmentAlerts: number;
}

export interface StockMovement {
  from?: SlotCode;
  to?: SlotCode;
  productId: string;
  qty: number;
  weightKg?: number;
}

export interface SlotInventory {
  product?: Product;
  qty: number;
  totalWeightKg?: number;
}

export type UserRole = 'viewer' | 'operator' | 'admin';

export interface WarehousePermissions {
  canRead: boolean;
  canWrite: boolean;
  canEdit: boolean;
  canAdmin: boolean;
}