import * as Calendar from 'expo-calendar/legacy';

export type InspectionEvent = {
  id: string;
  title: string;
  address: string;
  startTime: Date;
  endTime: Date;
  phone: string | null;
};

function extractPhone(notes: string): string | null {
  const phoneMatch = notes.match(/(\d{10}|\d{4}\s\d{3}\s\d{3})/);
  return phoneMatch ? phoneMatch[0] : null;
}

export async function requestCalendarPermission(): Promise<boolean> {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    console.log('Calendar permission status:', status);
    return status === 'granted';
  } catch (err) {
    console.error('Calendar permission error:', err);
    return false;
  }
}

export async function getTodaysInspections(): Promise<InspectionEvent[]> {
  try {
    const calendars = await Calendar.getCalendarsAsync(
      Calendar.EntityTypes.EVENT
    );

    console.log('Found calendars:', calendars.map(c => c.title));

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const events = await Calendar.getEventsAsync(
      calendars.map(c => c.id),
      startOfDay,
      endOfDay
    );

    console.log('Total events today:', events.length);
    console.log('Titles:', events.map(e => e.title));

    const inspectionEvents = events.filter(event =>
      event.title?.toLowerCase().includes('inspection') ||
      event.title?.toLowerCase().includes('routine') ||
      event.title?.toLowerCase().includes('# ')
    );

    console.log('Inspection events found:', inspectionEvents.length);

    return inspectionEvents.map(event => ({
      id: event.id,
      title: event.title || 'Inspection',
      address: event.location || '',
      startTime: new Date(event.startDate as string),
      endTime: new Date(event.endDate as string),
      phone: extractPhone((event.notes as string) || ''),
    }));

  } catch (err) {
    console.error('Error fetching inspections:', err);
    return [];
  }
}