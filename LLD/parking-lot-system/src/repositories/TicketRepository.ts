import { IRepository } from './IRepository';
import { Ticket } from '../models/Ticket';
import { InMemoryDatabase } from '../database/InMemoryDatabase';
import { TicketStatus } from '../enums/TicketStatus';

export class TicketRepository implements IRepository<Ticket> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): Ticket | undefined {
    return this.db.tickets.get(id);
  }

  public findAll(): Ticket[] {
    return Array.from(this.db.tickets.values());
  }

  public save(entity: Ticket): Ticket {
    this.db.saveTicket(entity);
    return entity;
  }

  public delete(id: string): boolean {
    return this.db.tickets.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.tickets.has(id);
  }

  public count(): number {
    return this.db.tickets.size;
  }

  public clear(): void {
    this.db.tickets.clear();
  }

  // Custom query methods
  public findByTicketNumber(ticketNumber: string): Ticket | undefined {
    return this.db.getTicketByNumber(ticketNumber);
  }

  public findByVehicleId(vehicleId: string): Ticket[] {
    return Array.from(this.db.tickets.values()).filter(
      t => t.vehicleId === vehicleId
    );
  }

  public findByStatus(status: TicketStatus): Ticket[] {
    return Array.from(this.db.tickets.values()).filter(
      t => t.status === status
    );
  }

  public findActiveTicketForVehicle(vehicleId: string): Ticket | undefined {
    return this.db.getActiveTicketForVehicle(vehicleId);
  }

  public findBySpotId(spotId: string): Ticket[] {
    return Array.from(this.db.tickets.values()).filter(
      t => t.spotId === spotId
    );
  }

  public closeTicket(ticketId: string): void {
    this.db.closeTicket(ticketId);
  }
}
