export interface BusinessWeekPeriod {
  start: Date;
  end: Date;
  hours: number;
  description: string;
}

export const getBusinessWeekPeriod = (): BusinessWeekPeriod => {
  const now = new Date();
  
  console.log('🚨 BUSINESS WEEK DEBUG - Current time:', now.toISOString());
  console.log('🚨 Day of week:', now.getDay(), ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()]);
  console.log('🚨 Current hour:', now.getHours());
  
  // Calculate Monday 6am to current time
  const mondayStart = new Date(now);
  
  // Find the most recent Monday
  const daysToMonday = (now.getDay() + 6) % 7; // Convert Sunday=0 to Sunday=6, Monday=0
  mondayStart.setDate(now.getDate() - daysToMonday);
  mondayStart.setHours(6, 0, 0, 0);
  
  console.log('🚨 Days to Monday:', daysToMonday);
  console.log('🚨 Monday start after calculation:', mondayStart.toISOString());
  
  // If today is Monday and we're before 6am, go back to previous Monday
  if (now.getDay() === 1 && now.getHours() < 6) {
    mondayStart.setDate(mondayStart.getDate() - 7);
    console.log('🚨 Adjusted to previous Monday (before 6am):', mondayStart.toISOString());
  }
  
  const endTime = new Date(now);
  
  // Calculate hours
  const millisecondsDiff = endTime.getTime() - mondayStart.getTime();
  const hours = millisecondsDiff / (1000 * 60 * 60);
  
  console.log('🚨 FINAL CALCULATION:');
  console.log('🚨 Start:', mondayStart.toISOString());
  console.log('🚨 End:', endTime.toISOString());
  console.log('🚨 Hours:', hours);
  console.log('🚨 Days:', hours / 24);
  
  // Validation for Saturday
  if (now.getDay() === 6) {
    console.log('🚨 SATURDAY VALIDATION: Should be ~120+ hours, actual:', hours);
  }
  
  // Create description
  const formatDate = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const day = days[date.getDay()];
    const dateStr = `${date.getDate()}/${date.getMonth() + 1}`;
    const timeStr = date === endTime ? 
      `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}` : 
      '6am';
    return `${day} ${dateStr} ${timeStr}`;
  };
  
  const description = `${formatDate(mondayStart)} - ${formatDate(endTime)}`;
  
  return {
    start: mondayStart,
    end: endTime,
    hours: Math.round(hours * 10) / 10,
    description
  };
};

export const formatForSupabaseQuery = (date: Date): string => {
  // Return full ISO string to preserve the exact time
  return date.toISOString();
};