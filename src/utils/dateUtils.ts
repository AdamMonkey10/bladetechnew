import { format } from 'date-fns';

export const formatDate = (date: Date | string, formatStr: string = 'dd/MM/yyyy'): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

export const formatDateTime = (date: Date | string): string => {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
};

export const formatDateRange = (startDate: string | Date, endDate: string | Date): string => {
  try {
    const start = formatDate(startDate, 'dd/MM');
    const end = formatDate(endDate, 'dd/MM/yyyy');
    return `${start} - ${end}`;
  } catch (error) {
    console.error('Error formatting date range:', error);
    return '';
  }
};

export const parseDateString = (dateStr: string): Date | null => {
  try {
    // Handle DD/MM/YYYY format
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    // Handle YYYY-MM-DD format (ISO)
    return new Date(dateStr);
  } catch (error) {
    console.error('Error parsing date string:', error);
    return null;
  }
};

export const formatForInput = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
};

export const getThisWeekRange = (): { start: Date; end: Date } => {
  const now = new Date();
  const currentDay = now.getDay();
  const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Sunday is 0
  
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  monday.setHours(6, 0, 0, 0); // Monday 6am
  
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  
  return { start: monday, end };
};

export const getLastWeekRange = (): { start: Date; end: Date } => {
  const thisWeek = getThisWeekRange();
  const start = new Date(thisWeek.start);
  start.setDate(start.getDate() - 7); // Previous Monday 6am
  
  const end = new Date(thisWeek.start);
  end.setDate(end.getDate() - 1); // Previous Sunday
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

export const getThisMonthRange = (): { start: Date; end: Date } => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

export const getLastMonthRange = (): { start: Date; end: Date } => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of previous month
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};