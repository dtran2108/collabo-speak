/**
 * Get a time-based greeting
 * @param hour - The current hour (0-23)
 * @returns A greeting string based on the time of day
 */
export function getTimeBasedGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) {
    return 'Good morning'
  } else if (hour >= 12 && hour < 17) {
    return 'Good afternoon'
  } else {
    return 'Good evening'
  }
}

/**
 * Get a personalized greeting with the user's name
 * @param fullName - The user's full name
 * @param hour - The current hour (0-23), defaults to current time
 * @returns A personalized greeting string
 */
export function getPersonalizedGreeting(fullName?: string | null, hour?: number): string {
  const currentHour = hour ?? new Date().getHours()
  const greeting = getTimeBasedGreeting(currentHour)
  
  if (fullName) {
    return `${greeting}, ${fullName}!`
  }
  
  return greeting
}
