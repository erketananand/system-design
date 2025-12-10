import { Vehicle } from '../models/Vehicle';
import { ParkingSpot } from '../models/ParkingSpot';
import { Floor } from '../models/Floor';
import { Ticket } from '../models/Ticket';
import { Payment } from '../models/Payment';

export class InMemoryDatabase {
  private static instance: InMemoryDatabase;

  // Storage maps for all entities
  public vehicles: Map<string, Vehicle> = new Map();
  public parkingSpots: Map<string, ParkingSpot> = new Map();
  public floors: Map<string, Floor> = new Map();
  public tickets: Map<string, Ticket> = new Map();
  public payments: Map<string, Payment> = new Map();

  // Indexes for fast lookups
  private vehiclesByLicensePlate: Map<string, Vehicle> = new Map();
  private ticketsByNumber: Map<string, Ticket> = new Map();
  private spotsByFloor: Map<string, Set<string>> = new Map();
  private activeTicketsByVehicle: Map<string, string> = new Map();

  private constructor() {
    console.log('[DATABASE] In-Memory Database initialized');
  }

  public static getInstance(): InMemoryDatabase {
    if (!InMemoryDatabase.instance) {
      InMemoryDatabase.instance = new InMemoryDatabase();
    }
    return InMemoryDatabase.instance;
  }

  // Vehicle operations
  public saveVehicle(vehicle: Vehicle): void {
    this.vehicles.set(vehicle.id, vehicle);
    this.vehiclesByLicensePlate.set(vehicle.licensePlate, vehicle);
  }

  public getVehicleByLicensePlate(licensePlate: string): Vehicle | undefined {
    return this.vehiclesByLicensePlate.get(licensePlate);
  }

  // Ticket operations
  public saveTicket(ticket: Ticket): void {
    this.tickets.set(ticket.id, ticket);
    this.ticketsByNumber.set(ticket.ticketNumber, ticket);
    this.activeTicketsByVehicle.set(ticket.vehicleId, ticket.id);
  }

  public getTicketByNumber(ticketNumber: string): Ticket | undefined {
    return this.ticketsByNumber.get(ticketNumber);
  }

  public getActiveTicketForVehicle(vehicleId: string): Ticket | undefined {
    const ticketId = this.activeTicketsByVehicle.get(vehicleId);
    return ticketId ? this.tickets.get(ticketId) : undefined;
  }

  public closeTicket(ticketId: string): void {
    const ticket = this.tickets.get(ticketId);
    if (ticket) {
      this.activeTicketsByVehicle.delete(ticket.vehicleId);
    }
  }

  // Spot operations with floor indexing
  public saveSpot(spot: ParkingSpot): void {
    this.parkingSpots.set(spot.id, spot);

    if (!this.spotsByFloor.has(spot.floorId)) {
      this.spotsByFloor.set(spot.floorId, new Set());
    }
    this.spotsByFloor.get(spot.floorId)!.add(spot.id);
  }

  public getSpotsByFloor(floorId: string): ParkingSpot[] {
    const spotIds = this.spotsByFloor.get(floorId);
    if (!spotIds) return [];

    return Array.from(spotIds)
      .map(id => this.parkingSpots.get(id))
      .filter((spot): spot is ParkingSpot => spot !== undefined);
  }

  // Clear operations
  public clearAll(): void {
    this.vehicles.clear();
    this.parkingSpots.clear();
    this.floors.clear();
    this.tickets.clear();
    this.payments.clear();
    this.vehiclesByLicensePlate.clear();
    this.ticketsByNumber.clear();
    this.spotsByFloor.clear();
    this.activeTicketsByVehicle.clear();
    console.log('[DATABASE] All data cleared');
  }

  // Statistics
  public getStats(): Record<string, number> {
    return {
      vehicles: this.vehicles.size,
      parkingSpots: this.parkingSpots.size,
      floors: this.floors.size,
      tickets: this.tickets.size,
      payments: this.payments.size,
      activeTickets: this.activeTicketsByVehicle.size
    };
  }

  public printStats(): void {
    const stats = this.getStats();
    console.log('\n[DATABASE STATS]');
    console.log('='.repeat(50));
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`  ${key.padEnd(20)}: ${value}`);
    });
    console.log('='.repeat(50));
  }
}
