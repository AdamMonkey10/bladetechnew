// Weight validation utilities for warehouse operations
import type { WarehouseLayout, SlotCode, Bay } from '../types';

export interface WeightValidationResult {
  isValid: boolean;
  currentWeight: number;
  maxWeight: number;
  newWeight: number;
  errorMessage?: string;
}

export function findBayBySlotCode(layout: WarehouseLayout, slotCode: SlotCode): Bay | null {
  const [aisleName, bayName] = slotCode.split('-');
  
  for (const aisle of layout.aisles) {
    if (aisle.name === aisleName) {
      for (const bay of aisle.bays) {
        if (bay.name === bayName) {
          return bay;
        }
      }
    }
  }
  
  return null;
}

export function calculateBayCurrentWeight(
  layout: WarehouseLayout, 
  bayId: string, 
  slotInventories: Record<SlotCode, { totalWeightKg?: number }>
): number {
  let totalWeight = 0;
  
  for (const aisle of layout.aisles) {
    for (const bay of aisle.bays) {
      if (bay.id === bayId) {
        for (const location of bay.locations) {
          for (const level of location.levels) {
            const inventory = slotInventories[level.code];
            if (inventory?.totalWeightKg) {
              totalWeight += inventory.totalWeightKg;
            }
          }
        }
      }
    }
  }
  
  return totalWeight;
}

export function validateBayWeight(
  layout: WarehouseLayout,
  slotCode: SlotCode,
  additionalWeightKg: number,
  currentSlotInventories: Record<SlotCode, { totalWeightKg?: number }>
): WeightValidationResult {
  const bay = findBayBySlotCode(layout, slotCode);
  
  if (!bay) {
    return {
      isValid: false,
      currentWeight: 0,
      maxWeight: 0,
      newWeight: 0,
      errorMessage: `Bay not found for slot ${slotCode}`
    };
  }

  if (!bay.maxWeightKg) {
    // No weight limit set for this bay
    return {
      isValid: true,
      currentWeight: 0,
      maxWeight: 0,
      newWeight: additionalWeightKg
    };
  }

  const currentWeight = calculateBayCurrentWeight(layout, bay.id, currentSlotInventories);
  const newWeight = currentWeight + additionalWeightKg;

  if (newWeight > bay.maxWeightKg) {
    return {
      isValid: false,
      currentWeight,
      maxWeight: bay.maxWeightKg,
      newWeight,
      errorMessage: `Adding ${additionalWeightKg}kg would exceed bay weight limit. Current: ${currentWeight}kg, Limit: ${bay.maxWeightKg}kg, Would be: ${newWeight}kg`
    };
  }

  return {
    isValid: true,
    currentWeight,
    maxWeight: bay.maxWeightKg,
    newWeight
  };
}