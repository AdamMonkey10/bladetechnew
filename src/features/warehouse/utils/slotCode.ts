// Utilities for slot code generation and parsing
import type { SlotCode } from '../types';

export function generateSlotCode(
  aisleId: string,
  bayId: string,
  locationId: string,
  levelId: string
): SlotCode {
  return `${aisleId}-${bayId}-${locationId}-${levelId}` as SlotCode;
}

export function parseSlotCode(code: SlotCode) {
  const [aisle, bay, location, level] = code.split('-');
  return { aisle, bay, location, level };
}

export function isValidSlotCode(code: string): code is SlotCode {
  const pattern = /^[A-Z]-[0-9]+-[A-Z]-[0-9]+$/;
  return pattern.test(code);
}

export function formatSlotDisplay(code: SlotCode): string {
  const { aisle, bay, location, level } = parseSlotCode(code);
  return `${aisle}-${bay}-${location}-${level}`;
}

export function searchSlotCodes(codes: SlotCode[], query: string): SlotCode[] {
  const normalizedQuery = query.toLowerCase().replace(/[-\s]/g, '');
  
  return codes.filter(code => {
    const normalizedCode = code.toLowerCase().replace(/[-\s]/g, '');
    return normalizedCode.includes(normalizedQuery);
  });
}