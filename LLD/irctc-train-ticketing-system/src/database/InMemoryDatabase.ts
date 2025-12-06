import { User } from '../models/User';
import { Station } from '../models/Station';
import { Train } from '../models/Train';
import { TrainSchedule } from '../models/TrainSchedule';
import { Coach } from '../models/Coach';
import { Seat } from '../models/Seat';
import { Booking } from '../models/Booking';
import { Payment } from '../models/Payment';

/**
 * In-Memory Database using Singleton Pattern
 * Stores all system data in memory using Maps
 */
export class InMemoryDatabase {
  private static instance: InMemoryDatabase;

  // Entity storage maps
  public users: Map<string, User> = new Map();
  public stations: Map<string, Station> = new Map();
  public trains: Map<string, Train> = new Map();
  public trainSchedules: Map<string, TrainSchedule> = new Map();
  public coaches: Map<string, Coach> = new Map();
  public seats: Map<string, Seat> = new Map();
  public bookings: Map<string, Booking> = new Map();
  public payments: Map<string, Payment> = new Map();

  // Indexes for faster lookups
  public usersByEmail: Map<string, User> = new Map();
  public usersByPhone: Map<string, User> = new Map();
  public stationsByCode: Map<string, Station> = new Map();
  public trainsByNumber: Map<string, Train> = new Map();
  public bookingsByPNR: Map<string, Booking> = new Map();
  public bookingsByUserId: Map<string, Booking[]> = new Map();
  public schedulesByTrainId: Map<string, TrainSchedule> = new Map();

  private constructor() {
    console.log('[DATABASE] In-Memory Database initialized');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): InMemoryDatabase {
    if (!InMemoryDatabase.instance) {
      InMemoryDatabase.instance = new InMemoryDatabase();
    }
    return InMemoryDatabase.instance;
  }

  /**
   * Clear all data (useful for testing)
   */
  public clearAll(): void {
    this.users.clear();
    this.stations.clear();
    this.trains.clear();
    this.trainSchedules.clear();
    this.coaches.clear();
    this.seats.clear();
    this.bookings.clear();
    this.payments.clear();

    // Clear indexes
    this.usersByEmail.clear();
    this.usersByPhone.clear();
    this.stationsByCode.clear();
    this.trainsByNumber.clear();
    this.bookingsByPNR.clear();
    this.bookingsByUserId.clear();
    this.schedulesByTrainId.clear();

    console.log('[DATABASE] All data cleared');
  }

  /**
   * Get database statistics
   */
  public getStats(): Record<string, number> {
    return {
      users: this.users.size,
      stations: this.stations.size,
      trains: this.trains.size,
      trainSchedules: this.trainSchedules.size,
      coaches: this.coaches.size,
      seats: this.seats.size,
      bookings: this.bookings.size,
      payments: this.payments.size
    };
  }

  /**
   * Print database statistics
   */
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

  /**
   * Add user to database with indexes
   */
  public addUser(user: User): void {
    this.users.set(user.id, user);
    this.usersByEmail.set(user.email, user);
    this.usersByPhone.set(user.phone, user);
  }

  /**
   * Add station to database with indexes
   */
  public addStation(station: Station): void {
    this.stations.set(station.id, station);
    this.stationsByCode.set(station.stationCode, station);
  }

  /**
   * Add train to database with indexes
   */
  public addTrain(train: Train): void {
    this.trains.set(train.id, train);
    this.trainsByNumber.set(train.trainNumber, train);
  }

  /**
   * Add train schedule with indexes
   */
  public addTrainSchedule(schedule: TrainSchedule): void {
    this.trainSchedules.set(schedule.id, schedule);
    this.schedulesByTrainId.set(schedule.trainId, schedule);
  }

  /**
   * Add booking with indexes
   */
  public addBooking(booking: Booking): void {
    this.bookings.set(booking.id, booking);
    this.bookingsByPNR.set(booking.pnr, booking);

    // Add to user's bookings
    if (!this.bookingsByUserId.has(booking.userId)) {
      this.bookingsByUserId.set(booking.userId, []);
    }
    this.bookingsByUserId.get(booking.userId)!.push(booking);
  }

  /**
   * Update booking indexes when booking changes
   */
  public updateBookingIndexes(booking: Booking): void {
    this.bookingsByPNR.set(booking.pnr, booking);
  }

  /**
   * Remove booking (for cancellations)
   */
  public removeBooking(bookingId: string): void {
    const booking = this.bookings.get(bookingId);
    if (booking) {
      this.bookings.delete(bookingId);
      this.bookingsByPNR.delete(booking.pnr);

      // Remove from user's bookings
      const userBookings = this.bookingsByUserId.get(booking.userId);
      if (userBookings) {
        const index = userBookings.findIndex(b => b.id === bookingId);
        if (index > -1) {
          userBookings.splice(index, 1);
        }
      }
    }
  }

  /**
   * Seed initial data for testing
   */
  public seedData(): void {
    console.log('\n[DATABASE] Seeding initial data...');

    // This method can be extended to add sample data
    // for testing purposes

    console.log('[DATABASE] Seeding complete\n');
  }

  /**
   * Export data (for backup/debugging)
   */
  public exportData(): any {
    return {
      users: Array.from(this.users.values()),
      stations: Array.from(this.stations.values()),
      trains: Array.from(this.trains.values()),
      trainSchedules: Array.from(this.trainSchedules.values()),
      coaches: Array.from(this.coaches.values()),
      seats: Array.from(this.seats.values()),
      bookings: Array.from(this.bookings.values()),
      payments: Array.from(this.payments.values())
    };
  }

  /**
   * Get total booking count for a train on a specific date
   */
  public getTrainBookingCount(trainId: string, journeyDate: Date): number {
    const dateKey = journeyDate.toISOString().split('T')[0];
    return Array.from(this.bookings.values()).filter(
      b => b.trainId === trainId && 
           b.journeyDate.toISOString().split('T')[0] === dateKey &&
           b.getStatus() !== 'CANCELLED'
    ).length;
  }

  /**
   * Get all bookings for a specific train and date
   */
  public getTrainBookings(trainId: string, journeyDate: Date): Booking[] {
    const dateKey = journeyDate.toISOString().split('T')[0];
    return Array.from(this.bookings.values()).filter(
      b => b.trainId === trainId && 
           b.journeyDate.toISOString().split('T')[0] === dateKey
    );
  }
}
