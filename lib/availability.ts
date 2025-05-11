import { add, addDays, format, isAfter, isBefore, parseISO, set, startOfDay } from 'date-fns';
import { prisma } from '@/prisma';
import { isTimeSlotAvailable } from './google-calendar';

// Parse a time string in format "HH:MM" to hours and minutes
const parseTimeString = (timeString: string) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours, minutes };
};

// Get available time slots based on scheduling windows and calendar events
export const getAvailableTimeSlots = async (
  userId: string,
  startDate: Date,
  endDate: Date,
  durationMinutes: number,
  schedulingWindowIds?: string[]
) => {
  // Get user's scheduling windows
  const schedulingWindowsQuery = {
    where: {
      userId,
      isActive: true,
      ...(schedulingWindowIds && schedulingWindowIds.length > 0
        ? { id: { in: schedulingWindowIds } }
        : {}),
    },
    include: {
      timeSlots: true,
    },
  };

  const schedulingWindows = await prisma.schedulingWindow.findMany(schedulingWindowsQuery);

  if (schedulingWindows.length === 0) {
    return [];
  }

  // Generate all possible time slots within date range
  const allTimeSlots: Array<{ start: Date; end: Date }> = [];
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // For each day in the range
  let currentDate = startOfDay(startDate);
  const endDateDay = startOfDay(endDate);
  
  while (!isAfter(currentDate, endDateDay)) {
    const dayOfWeek = daysOfWeek[currentDate.getDay()];
    
    // Find scheduling windows for this day of week
    for (const window of schedulingWindows) {
      const timeSlotsForDay = window.timeSlots.filter(
        slot => slot.dayOfWeek === dayOfWeek
      );
      
      // For each time slot in the scheduling window
      for (const timeSlot of timeSlotsForDay) {
        const { hours: startHours, minutes: startMinutes } = parseTimeString(timeSlot.startTime);
        const { hours: endHours, minutes: endMinutes } = parseTimeString(timeSlot.endTime);
        
        // Set start time for this day
        let slotStart = set(new Date(currentDate), {
          hours: startHours,
          minutes: startMinutes,
          seconds: 0,
          milliseconds: 0,
        });
        
        // Set end time for this day
        const slotEnd = set(new Date(currentDate), {
          hours: endHours,
          minutes: endMinutes,
          seconds: 0,
          milliseconds: 0,
        });
        
        // Create 30-minute increments for the day
        while (add(slotStart, { minutes: durationMinutes }) <= slotEnd) {
          const timeSlotEnd = add(slotStart, { minutes: durationMinutes });
          
          // Only add slots that are in the future
          if (isAfter(slotStart, new Date())) {
            allTimeSlots.push({
              start: slotStart,
              end: timeSlotEnd,
            });
          }
          
          // Move to next increment
          slotStart = add(slotStart, { minutes: 30 });
        }
      }
    }
    
    // Move to next day
    currentDate = addDays(currentDate, 1);
  }
  
  // Filter out slots that conflict with calendar events
  const availableSlots: Array<{ start: Date; end: Date }> = [];
  
  for (const slot of allTimeSlots) {
    if (await isTimeSlotAvailable(userId, slot.start, slot.end)) {
      availableSlots.push(slot);
    }
  }
  
  return availableSlots;
};

// Format available time slots for the client
export const formatAvailableTimeSlots = (
  availableSlots: Array<{ start: Date; end: Date }>
) => {
  // Group slots by date
  const slotsByDate: Record<string, Array<{ time: string; iso: string }>> = {};
  
  for (const slot of availableSlots) {
    const dateKey = format(slot.start, 'yyyy-MM-dd');
    const timeStr = format(slot.start, 'h:mm a');
    
    if (!slotsByDate[dateKey]) {
      slotsByDate[dateKey] = [];
    }
    
    slotsByDate[dateKey].push({
      time: timeStr,
      iso: slot.start.toISOString(),
    });
  }
  
  // Convert to array of dates with slots
  return Object.entries(slotsByDate).map(([date, slots]) => ({
    date,
    dateDisplay: format(parseISO(date), 'EEEE, MMMM d, yyyy'),
    slots,
  }));
};

// Check if a scheduling link is valid and available for use
export const validateSchedulingLink = async (slug: string) => {
  const link = await prisma.schedulingLink.findUnique({
    where: { slug },
  });
  
  if (!link) {
    return { valid: false, reason: 'Link not found' };
  }
  
  if (!link.isActive) {
    return { valid: false, reason: 'Link is inactive' };
  }
  
  // Check usage limit
  if (link.usageLimit && link.usageCount >= link.usageLimit) {
    return { valid: false, reason: 'Usage limit reached' };
  }
  
  // Check expiration date
  if (link.expirationDate && isAfter(new Date(), link.expirationDate)) {
    return { valid: false, reason: 'Link has expired' };
  }
  
  return { valid: true, link };
}; 