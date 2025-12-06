import { MeetingRoom } from '../models/MeetingRoom';
import { RoomBooking } from '../models/RoomBooking';
import { MeetingRoomRepository } from '../repositories/MeetingRoomRepository';
import { RoomBookingRepository } from '../repositories/RoomBookingRepository';
import { Logger } from '../utils/Logger';

export class RoomService {
  private roomRepo = new MeetingRoomRepository();
  private bookingRepo = new RoomBookingRepository();

  public createRoom(name: string, capacity: number, location: string, amenities: string[] = []): MeetingRoom {
    const existing = this.roomRepo.findByName(name);
    if (existing) {
      throw new Error(`Room with name ${name} already exists`);
    }

    const room = new MeetingRoom(name, capacity, location, amenities);
    this.roomRepo.save(room);
    Logger.success(`Meeting room created: ${room.name} (${room.id})`);
    return room;
  }

  public getRoomById(id: string): MeetingRoom {
    const room = this.roomRepo.findById(id);
    if (!room) {
      throw new Error(`Room not found: ${id}`);
    }
    return room;
  }

  public getAllRooms(): MeetingRoom[] {
    return this.roomRepo.findAll();
  }

  public findAvailableRooms(startTime: Date, endTime: Date, requiredCapacity: number = 1): MeetingRoom[] {
    const allRooms = this.roomRepo.findByCapacity(requiredCapacity);
    const availableRooms: MeetingRoom[] = [];

    for (const room of allRooms) {
      if (!room.isAvailable) continue;

      const conflicts = this.bookingRepo.findByDateRange(room.id, startTime, endTime);
      if (conflicts.length === 0) {
        availableRooms.push(room);
      }
    }

    return availableRooms;
  }

  public bookRoom(roomId: string, eventId: string, startTime: Date, endTime: Date): RoomBooking {
    const room = this.getRoomById(roomId);

    if (!room.isAvailable) {
      throw new Error(`Room ${room.name} is not available`);
    }

    // Check for conflicts
    const conflicts = this.bookingRepo.findByDateRange(roomId, startTime, endTime);
    if (conflicts.length > 0) {
      throw new Error(`Room ${room.name} is already booked for the specified time`);
    }

    const booking = new RoomBooking(roomId, eventId, startTime, endTime);
    this.bookingRepo.save(booking);
    Logger.success(`Room ${room.name} booked for event ${eventId}`);
    return booking;
  }

  public releaseRoom(roomId: string, eventId: string): void {
    const booking = this.bookingRepo.findByEvent(eventId);
    if (!booking) {
      Logger.warn(`No booking found for event ${eventId}`);
      return;
    }

    this.bookingRepo.delete(booking.id);
    Logger.info(`Room ${roomId} released for event ${eventId}`);
  }

  public checkRoomAvailability(roomId: string, startTime: Date, endTime: Date): boolean {
    const conflicts = this.bookingRepo.findByDateRange(roomId, startTime, endTime);
    return conflicts.length === 0;
  }

  public getRoomBookings(roomId: string): RoomBooking[] {
    return this.bookingRepo.findByRoom(roomId);
  }
}
