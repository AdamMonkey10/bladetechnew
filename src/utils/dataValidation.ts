// Data validation utilities to prevent timesheet entry errors
export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

export interface TimeEntryValidation {
  maxHoursPerShift: number;
  maxHoursPerActivity: number;
  maxHoursPerDay: number;
  minHoursPerEntry: number;
}

const DEFAULT_VALIDATION_CONFIG: TimeEntryValidation = {
  maxHoursPerShift: 24,
  maxHoursPerActivity: 16,
  maxHoursPerDay: 24,
  minHoursPerEntry: 0.1
};

/**
 * Validates time spent entry to prevent decimal point errors
 */
export function validateTimeSpent(
  timeSpent: number | string,
  activityName: string,
  config: TimeEntryValidation = DEFAULT_VALIDATION_CONFIG
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    warnings: [],
    errors: []
  };

  const timeValue = typeof timeSpent === 'string' ? parseFloat(timeSpent) : timeSpent;

  if (isNaN(timeValue) || timeValue < 0) {
    result.isValid = false;
    result.errors.push('Time spent must be a valid positive number');
    return result;
  }

  // Check for obvious decimal point errors (like 945 instead of 9.45)
  if (timeValue > config.maxHoursPerActivity) {
    result.isValid = false;
    result.errors.push(
      `Time spent (${timeValue} hours) exceeds maximum of ${config.maxHoursPerActivity} hours for a single activity. Did you forget a decimal point?`
    );
  }

  // Check for unrealistic high values that might be decimal point errors
  if (timeValue > config.maxHoursPerShift) {
    result.isValid = false;
    result.errors.push(
      `Time spent (${timeValue} hours) exceeds maximum of ${config.maxHoursPerShift} hours per shift. Please check your entry.`
    );
  }

  // Warning for high but possible values
  if (timeValue > 12 && timeValue <= config.maxHoursPerActivity) {
    result.warnings.push(
      `Time spent (${timeValue} hours) is unusually high for ${activityName}. Please verify this is correct.`
    );
  }

  // Check for too small values
  if (timeValue > 0 && timeValue < config.minHoursPerEntry) {
    result.warnings.push(
      `Time spent (${timeValue} hours) is very low. Consider using ${config.minHoursPerEntry} hours minimum.`
    );
  }

  return result;
}

/**
 * Validates data completeness and quality for activities
 * Note: Total time validation removed as operators can work multiple machines simultaneously
 */
export function validateActivityCompleteness(
  activities: Array<{ name: string; entries: Array<{ time_spent?: number; units_produced?: number; sku?: string }> }>
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    warnings: [],
    errors: []
  };

  let incompleteEntries = 0;
  let totalEntries = 0;

  activities.forEach((activity, activityIndex) => {
    activity.entries.forEach((entry, entryIndex) => {
      totalEntries++;
      
      // Check for missing time when units are present
      if (entry.units_produced && entry.units_produced > 0 && (!entry.time_spent || entry.time_spent === 0)) {
        incompleteEntries++;
        result.warnings.push(
          `${activity.name} entry ${entryIndex + 1}: Units produced (${entry.units_produced}) but no time spent recorded`
        );
      }
      
      // Check for missing units when time is present for production activities
      if (entry.time_spent && entry.time_spent > 0 && activity.name !== 'Downtime' && (!entry.units_produced || entry.units_produced === 0)) {
        incompleteEntries++;
        result.warnings.push(
          `${activity.name} entry ${entryIndex + 1}: Time spent (${entry.time_spent}h) but no units produced recorded`
        );
      }
    });
  });

  // Add completion summary
  if (incompleteEntries > 0) {
    const completionRate = ((totalEntries - incompleteEntries) / totalEntries * 100).toFixed(1);
    result.warnings.unshift(
      `Data completion: ${completionRate}% (${incompleteEntries} of ${totalEntries} entries need attention)`
    );
  }

  return result;
}

/**
 * Detects potential decimal point errors in time entries
 */
export function detectDecimalPointErrors(timeSpent: number | string): boolean {
  const timeValue = typeof timeSpent === 'string' ? parseFloat(timeSpent) : timeSpent;
  
  if (isNaN(timeValue)) return false;
  
  // Common decimal point error patterns:
  // 945 instead of 9.45
  // 1015 instead of 10.15
  // 36 instead of 3.6
  // 20 instead of 2.0
  
  // Check if the value is suspiciously high and could be a decimal point error
  if (timeValue >= 20 && timeValue <= 9999) {
    // Check if dividing by 100 would give a more reasonable value
    const correctedValue = timeValue / 100;
    return correctedValue >= 0.1 && correctedValue <= 24;
  }
  
  return false;
}

/**
 * Suggests correction for potential decimal point errors
 */
export function suggestDecimalCorrection(timeSpent: number | string): number | null {
  const timeValue = typeof timeSpent === 'string' ? parseFloat(timeSpent) : timeSpent;
  
  if (isNaN(timeValue)) return null;
  
  if (detectDecimalPointErrors(timeValue)) {
    return timeValue / 100;
  }
  
  return null;
}

/**
 * Validates production data for common errors
 */
export function validateProductionData(
  unitsProduced: number | undefined,
  timeSpent: number | undefined,
  activityName: string
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    warnings: [],
    errors: []
  };

  if (unitsProduced && unitsProduced > 0 && (!timeSpent || timeSpent === 0)) {
    result.warnings.push(
      `${activityName} has units produced (${unitsProduced}) but no time spent. Please add time spent for accurate analytics.`
    );
  }

  if (timeSpent && timeSpent > 0 && (!unitsProduced || unitsProduced === 0)) {
    result.warnings.push(
      `${activityName} has time spent (${timeSpent} hours) but no units produced. This may affect efficiency calculations.`
    );
  }

  // Check for unrealistic productivity rates
  if (unitsProduced && timeSpent && timeSpent > 0) {
    const unitsPerHour = unitsProduced / timeSpent;
    
    // Activity-specific productivity checks
    const productivityLimits: Record<string, { min: number; max: number }> = {
      'Laser1': { min: 10, max: 1000 },
      'Laser2': { min: 10, max: 800 },
      'Laser3': { min: 10, max: 1000 },
      'Welder': { min: 5, max: 500 },
      'Coating': { min: 50, max: 2000 },
      'Stacking': { min: 100, max: 3000 }
    };

    const limits = productivityLimits[activityName];
    if (limits) {
      if (unitsPerHour < limits.min) {
        result.warnings.push(
          `${activityName} productivity (${unitsPerHour.toFixed(1)} units/hour) is below expected minimum of ${limits.min}. Please verify time and units are correct.`
        );
      }
      
      if (unitsPerHour > limits.max) {
        result.warnings.push(
          `${activityName} productivity (${unitsPerHour.toFixed(1)} units/hour) is above expected maximum of ${limits.max}. Please verify time and units are correct.`
        );
      }
    }
  }

  return result;
}

/**
 * Calculate the correct shift_date based on shift type and business day boundary
 * 
 * Rules:
 * - Day shifts: Always use the form date, even for early starts (before 6 AM)
 * - Night shifts: Use 6 AM boundary rule only for evening-starting shifts
 *   - If starting in evening (>= 12 PM), keep form date
 *   - If starting before 6 AM, assign to previous day (overnight continuation)
 * - Unspecified type: Legacy behavior (< 6 AM = previous day)
 */
export function calculateShiftDate(
  formDate: string,
  startTime: string,
  endTime: string,
  shiftType?: 'Days' | 'Nights'
): string {
  const [startHour] = startTime.split(':').map(Number);
  
  // Day shifts: never move to previous day, even for early morning starts
  if (shiftType === 'Days') {
    return formDate;
  }
  
  // Night shifts: only move to previous day if this is an early morning end
  // (not an evening start that continues overnight)
  if (shiftType === 'Nights' && startHour >= 12) {
    return formDate;
  }
  
  // Legacy behavior for unspecified shift type or early morning continuations
  if (!isNaN(startHour) && startHour < 6) {
    const date = new Date(formDate);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
  }
  
  return formDate;
}

/**
 * Validates night shift times that cross midnight
 */
export function validateNightShiftTimes(
  startTime: string,
  endTime: string,
  shiftDate: string
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    warnings: [],
    errors: []
  };

  if (!startTime || !endTime) {
    return result;
  }

  // Parse times
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
    result.isValid = false;
    result.errors.push('Invalid time format. Use HH:MM format.');
    return result;
  }

  // Validate time ranges
  if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
    result.isValid = false;
    result.errors.push('Hours must be between 00 and 23.');
    return result;
  }
  
  if (startMin < 0 || startMin > 59 || endMin < 0 || endMin > 59) {
    result.isValid = false;
    result.errors.push('Minutes must be between 00 and 59.');
    return result;
  }

  // Create Date objects for calculation using proper timezone handling
  const baseDate = new Date(shiftDate + 'T00:00:00');
  const startDateTime = new Date(baseDate);
  startDateTime.setHours(startHour, startMin, 0, 0);
  
  const endDateTime = new Date(baseDate);
  endDateTime.setHours(endHour, endMin, 0, 0);
  
  // Handle overnight shifts (when end time is earlier than start time)
  const isOvernightShift = endDateTime <= startDateTime;
  
  if (isOvernightShift) {
    // Add one day to end time for overnight shifts
    endDateTime.setDate(endDateTime.getDate() + 1);
    
    // Show helpful message for overnight shifts
    result.warnings.push(
      `Night shift crosses midnight: ${startTime} → ${endTime} (+1 day)`
    );
  }

  // Calculate shift duration in hours
  const durationMs = endDateTime.getTime() - startDateTime.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);

  // Validate shift duration
  if (durationHours <= 0) {
    result.isValid = false;
    result.errors.push('Shift duration must be positive.');
    return result;
  }

  if (durationHours > 16) {
    result.isValid = false;
    result.errors.push(`Shift duration (${durationHours.toFixed(1)} hours) exceeds maximum of 16 hours.`);
  }

  if (durationHours > 12) {
    result.warnings.push(
      `Long shift detected (${durationHours.toFixed(1)} hours). Please verify this is correct.`
    );
  }

  // Add confirmation message for the calculated duration
  if (isOvernightShift) {
    result.warnings.push(
      `Total shift duration: ${durationHours.toFixed(1)} hours (overnight)`
    );
  }

  return result;
}

/**
 * Calculates the correct end timestamp for overnight shifts
 */
export function calculateShiftEndTime(
  startTime: string,
  endTime: string,
  shiftDate: string
): { startDateTime: string; endDateTime: string; isOvernightShift: boolean } {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  // Use consistent date parsing with timezone considerations
  const baseDate = new Date(shiftDate + 'T00:00:00');
  
  const startDateTime = new Date(baseDate);
  startDateTime.setHours(startHour, startMin, 0, 0);
  
  const endDateTime = new Date(baseDate);
  endDateTime.setHours(endHour, endMin, 0, 0);
  
  // Check if this is an overnight shift (end time is earlier than or equal to start time)
  const isOvernightShift = endDateTime <= startDateTime;
  
  if (isOvernightShift) {
    // Add one day to end time for overnight shifts
    endDateTime.setDate(endDateTime.getDate() + 1);
  }

  return {
    startDateTime: startDateTime.toISOString(),
    endDateTime: endDateTime.toISOString(),
    isOvernightShift
  };
}

/**
 * Comprehensive validation for shift form data
 */
export function validateShiftFormData(formData: {
  activities: Array<{
    name: string;
    entries: Array<{
      time_spent?: number;
      units_produced?: number;
      sku?: string;
    }>;
  }>;
  timeStart: string;
  timeFinish: string;
}): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    warnings: [],
    errors: []
  };

  // Validate data completeness (replaces problematic total hours validation)
  const completenessValidation = validateActivityCompleteness(formData.activities);
  result.warnings.push(...completenessValidation.warnings);

  // Validate each activity
  formData.activities.forEach(activity => {
    activity.entries.forEach(entry => {
      if (entry.time_spent) {
        const timeValidation = validateTimeSpent(entry.time_spent, activity.name);
        result.errors.push(...timeValidation.errors);
        result.warnings.push(...timeValidation.warnings);
        
        if (!timeValidation.isValid) {
          result.isValid = false;
        }
      }

      const productionValidation = validateProductionData(
        entry.units_produced,
        entry.time_spent,
        activity.name
      );
      result.warnings.push(...productionValidation.warnings);
    });
  });

  return result;
}