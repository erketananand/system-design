import { User } from '../models/User';
import { Event } from '../models/Event';
import { Calendar } from '../models/Calendar';
import { Invitation } from '../models/Invitation';
import { MeetingRoom } from '../models/MeetingRoom';
import { RoomBooking } from '../models/RoomBooking';
import { Notification } from '../models/Notification';

export class InMemoryDatabase {
  private static instance: InMemoryDatabase;

  public users: Map<string, User> = new Map();
  public events: Map<string, Event> = new Map();
  public calendars: Map<string, Calendar> = new Map();
  public invitations: Map<string, Invitation> = new Map();
  public meetingRooms: Map<string, MeetingRoom> = new Map();
  public roomBookings: Map<string, RoomBooking> = new Map();
  public notifications: Map<string, Notification> = new Map();

  private constructor() {
    console.log('[DATABASE] In-Memory Database initialized');
  }

  public static getInstance(): InMemoryDatabase {
    if (!InMemoryDatabase.instance) {
      InMemoryDatabase.instance = new InMemoryDatabase();
    }
    return InMemoryDatabase.instance;
  }

  public clearAll(): void {
    this.users.clear();
    this.events.clear();
    this.calendars.clear();
    this.invitations.clear();
    this.meetingRooms.clear();
    this.roomBookings.clear();
    this.notifications.clear();
    console.log('[DATABASE] All data cleared');
  }

  public getStats(): Record<string, number> {
    return {
      users: this.users.size,
      events: this.events.size,
      calendars: this.calendars.size,
      invitations: this.invitations.size,
      meetingRooms: this.meetingRooms.size,
      roomBookings: this.roomBookings.size,
      notifications: this.notifications.size
    };
  }

  public printStats(): void {
    console.log('\n' + '='.repeat(70));
    console.log('DATABASE STATISTICS');
    console.log('='.repeat(70));
    const stats = this.getStats();
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`  ${key.padEnd(20)}: ${value}`);
    });
    console.log('='.repeat(70) + '\n');
  }

  public getTotalRecords(): number {
    const stats = this.getStats();
    return Object.values(stats).reduce((sum, count) => sum + count, 0);
  }
}
