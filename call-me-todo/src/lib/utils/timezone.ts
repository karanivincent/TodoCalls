// Utility functions for timezone handling

export function getUserTimezone(): string {
  // Get browser's timezone
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'Africa/Nairobi'; // Default fallback
  }
}

export function formatInTimezone(date: string | Date, timezone: string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleString('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export function formatTimeInTimezone(date: string | Date, timezone: string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function getHourInTimezone(date: string | Date, timezone: string): number {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const formatted = dateObj.toLocaleString('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false
  });
  
  return parseInt(formatted);
}

// Get timezone offset in hours from UTC (more reliable method)
export function getTimezoneOffsetHours(timezone: string): number {
  // Create two dates: one in UTC and one in the target timezone
  const now = new Date();
  
  // Format the date in both timezones
  const utcString = now.toLocaleString('en-US', { timeZone: 'UTC', hour12: false });
  const tzString = now.toLocaleString('en-US', { timeZone: timezone, hour12: false });
  
  // Parse both strings to get the actual times
  const utcDate = new Date(utcString);
  const tzDate = new Date(tzString);
  
  // Calculate the difference in hours
  return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
}

// Common timezones for selection
export const commonTimezones = [
  { value: 'Africa/Nairobi', label: 'Nairobi (EAT)' },
  { value: 'Africa/Lagos', label: 'Lagos (WAT)' },
  { value: 'Africa/Cairo', label: 'Cairo (EET)' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'America/Chicago', label: 'Chicago (CST/CDT)' },
  { value: 'America/Denver', label: 'Denver (MST/MDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)' }
];