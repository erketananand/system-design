import { IRepository } from './IRepository';
import { MeetingRoom } from '../models/MeetingRoom';
import { InMemoryDatabase } from '../database/InMemoryDatabase';

export class MeetingRoomRepository implements IRepository<MeetingRoom> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): MeetingRoom | undefined {
    return this.db.meetingRooms.get(id);
  }

  public findAll(): MeetingRoom[] {
    return Array.from(this.db.meetingRooms.values());
  }

  public save(room: MeetingRoom): MeetingRoom {
    this.db.meetingRooms.set(room.id, room);
    return room;
  }

  public delete(id: string): boolean {
    return this.db.meetingRooms.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.meetingRooms.has(id);
  }

  public count(): number {
    return this.db.meetingRooms.size;
  }

  public clear(): void {
    this.db.meetingRooms.clear();
  }

  // Custom query methods
  public findByCapacity(minCapacity: number): MeetingRoom[] {
    return Array.from(this.db.meetingRooms.values()).filter(r => r.capacity >= minCapacity);
  }

  public findByLocation(location: string): MeetingRoom[] {
    return Array.from(this.db.meetingRooms.values()).filter(r => r.location === location);
  }

  public findAvailableRooms(): MeetingRoom[] {
    return Array.from(this.db.meetingRooms.values()).filter(r => r.isAvailable);
  }

  public findByName(name: string): MeetingRoom | undefined {
    return Array.from(this.db.meetingRooms.values()).find(r => r.name === name);
  }
}
