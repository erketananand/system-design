import { Floor } from '../models/Floor';
import { Vehicle } from '../models/Vehicle';
import { Ticket } from '../models/Ticket';
import { Payment } from '../models/Payment';
import { ParkingSpot } from '../models/ParkingSpot';
import { FloorRepository } from '../repositories/FloorRepository';
import { VehicleRepository } from '../repositories/VehicleRepository';
import { TicketRepository } from '../repositories/TicketRepository';
import { PaymentRepository } from '../repositories/PaymentRepository';
import { ParkingSpotRepository } from '../repositories/ParkingSpotRepository';
import { IAllocationStrategy } from '../strategies/IAllocationStrategy';
import { IPricingStrategy } from '../strategies/IPricingStrategy';
import { DurationAwareStrategy } from '../strategies/DurationAwareStrategy';
import { HourlyPricingStrategy } from '../strategies/HourlyPricingStrategy';
import { Logger } from '../utils/Logger';

export class ParkingLotService {
  private static instance: ParkingLotService;

  private floorRepo = new FloorRepository();
  private vehicleRepo = new VehicleRepository();
  private ticketRepo = new TicketRepository();
  private paymentRepo = new PaymentRepository();
  private spotRepo = new ParkingSpotRepository();

  private allocationStrategy: IAllocationStrategy;
  private pricingStrategy: IPricingStrategy;

  private name: string = 'City Center Parking Lot';

  private constructor() {
    this.allocationStrategy = new DurationAwareStrategy();
    this.pricingStrategy = new HourlyPricingStrategy();
    Logger.info('ParkingLotService initialized');
  }

  public static getInstance(): ParkingLotService {
    if (!ParkingLotService.instance) {
      ParkingLotService.instance = new ParkingLotService();
    }
    return ParkingLotService.instance;
  }

  // Park a vehicle
  public parkVehicle(
    vehicle: Vehicle,
    expectedDurationHours: number,
    entryGateId: string
  ): Ticket {
    // Check if vehicle already parked
    const activeTicket = this.ticketRepo.findActiveTicketForVehicle(vehicle.id);
    if (activeTicket) {
      throw new Error(`Vehicle ${vehicle.licensePlate} is already parked with ticket ${activeTicket.ticketNumber}`);
    }

    // Save vehicle if not exists
    if (!this.vehicleRepo.exists(vehicle.id)) {
      this.vehicleRepo.save(vehicle);
    }

    // Allocate spot using strategy
    const floors = this.floorRepo.findAll();
    const spot = this.allocationStrategy.allocateSpot(vehicle, expectedDurationHours, floors);

    if (!spot) {
      throw new Error('No available parking spots for this vehicle type');
    }

    // Create ticket
    const ticket = new Ticket(vehicle.id, spot.id, entryGateId, expectedDurationHours);

    // Assign spot
    spot.assignVehicle(vehicle.id, ticket.id);
    this.spotRepo.save(spot);

    // Save ticket
    this.ticketRepo.save(ticket);

    Logger.success(`Vehicle ${vehicle.licensePlate} parked at spot ${spot.spotNumber}`);
    return ticket;
  }

  // Unpark a vehicle
  public unparkVehicle(ticketNumber: string, exitGateId: string): Payment {
    // Find ticket
    const ticket = this.ticketRepo.findByTicketNumber(ticketNumber);
    if (!ticket) {
      throw new Error(`Ticket ${ticketNumber} not found`);
    }

    if (ticket.status !== 'OPEN') {
      throw new Error(`Ticket ${ticketNumber} is already closed`);
    }

    // Close ticket
    ticket.closeTicket(exitGateId);
    this.ticketRepo.save(ticket);
    this.ticketRepo.closeTicket(ticket.id);

    // Release spot
    const spot = this.spotRepo.findById(ticket.spotId);
    if (spot) {
      spot.releaseSpot();
      this.spotRepo.save(spot);
    }

    // Calculate fee
    const pricing = this.pricingStrategy.calculateFee(ticket);
    const payment = new Payment(
      ticket.id,
      pricing.baseAmount,
      pricing.overstayPenalty,
      pricing.discounts
    );
    this.paymentRepo.save(payment);

    Logger.success(`Vehicle unparked. Payment amount: $${payment.amount.toFixed(2)}`);
    return payment;
  }

  // Get availability summary
  public getAvailabilitySummary(): any {
    const floors = this.floorRepo.findAllSorted();
    const summary: any = {
      totalFloors: floors.length,
      floors: []
    };

    for (const floor of floors) {
      const spots = this.spotRepo.findByFloorId(floor.id);
      const available = spots.filter(s => s.isAvailable()).length;
      const occupied = spots.filter(s => s.state === 'OCCUPIED').length;

      summary.floors.push({
        floorNumber: floor.floorNumber,
        totalSpots: spots.length,
        available,
        occupied
      });
    }

    return summary;
  }

  // Change allocation strategy
  public setAllocationStrategy(strategy: IAllocationStrategy): void {
    this.allocationStrategy = strategy;
    Logger.info(`Allocation strategy changed to: ${strategy.getName()}`);
  }

  // Change pricing strategy
  public setPricingStrategy(strategy: IPricingStrategy): void {
    this.pricingStrategy = strategy;
    Logger.info(`Pricing strategy changed to: ${strategy.getName()}`);
  }

  public getName(): string {
    return this.name;
  }

  public getCurrentStrategies(): { allocation: string; pricing: string } {
    return {
      allocation: this.allocationStrategy.getName(),
      pricing: this.pricingStrategy.getName()
    };
  }
}
