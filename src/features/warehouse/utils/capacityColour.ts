// Utilities for capacity-based color coding
import type { Level } from '../types';

export function getCapacityColor(level: Level): string {
  // Since levels no longer have capacity, return based on whether they have stock
  return level.quantity && level.quantity > 0 ? '#22c55e' : '#e5e7eb'; // green if has stock, gray if empty
}

export function getCapacityLabel(level: Level): string {
  // Since levels no longer have capacity, return based on whether they have stock
  return level.quantity && level.quantity > 0 ? 'In Use' : 'Empty';
}

export function getCapacityAlpha(level: Level): number {
  // Return fixed alpha based on stock presence
  return level.quantity && level.quantity > 0 ? 1.0 : 0.3;
}

export function isSlotOverCapacity(level: Level): boolean {
  // No capacity limits on levels anymore
  return false;
}

export function isSlotNearCapacity(level: Level, threshold = 85): boolean {
  // No capacity limits on levels anymore
  return false;
}

export const CAPACITY_LEGEND = [
  { color: '#e5e7eb', label: 'Empty', range: 'No stock' },
  { color: '#22c55e', label: 'In Use', range: 'Has stock' }
];