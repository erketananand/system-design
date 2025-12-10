import { TicketRepository } from '../repositories/TicketRepository';
import { VehicleRepository } from '../repositories/VehicleRepository';
import { ParkingSpotRepository } from '../repositories/ParkingSpotRepository';
import { PaymentRepository } from '../repositories/PaymentRepository';
import { TicketStatus } from '../enums/TicketStatus';
import { SpotState } from '../enums/SpotState';

export class ReportService {
  private ticketRepo = new TicketRepository();
  private vehicleRepo = new VehicleRepository();
  private spotRepo = new ParkingSpotRepository();
  private paymentRepo = new PaymentRepository();

  public printSystemReport(): void {
    console.log('\n' + '='.repeat(70));
    console.log('PARKING LOT SYSTEM REPORT');
    console.log('='.repeat(70));

    // Vehicles
    console.log(`\nVehicles:`);
    console.log(`  Total Registered: ${this.vehicleRepo.count()}`);

    // Tickets
    const openTickets = this.ticketRepo.findByStatus(TicketStatus.OPEN);
    const closedTickets = this.ticketRepo.findByStatus(TicketStatus.CLOSED);
    console.log(`\nTickets:`);
    console.log(`  Open: ${openTickets.length}`);
    console.log(`  Closed: ${closedTickets.length}`);
    console.log(`  Total: ${this.ticketRepo.count()}`);

    // Spots
    const availableSpots = this.spotRepo.findByState(SpotState.AVAILABLE);
    const occupiedSpots = this.spotRepo.findByState(SpotState.OCCUPIED);
    const reservedSpots = this.spotRepo.findByState(SpotState.RESERVED);
    console.log(`\nParking Spots:`);
    console.log(`  Available: ${availableSpots.length}`);
    console.log(`  Occupied: ${occupiedSpots.length}`);
    console.log(`  Reserved: ${reservedSpots.length}`);
    console.log(`  Total: ${this.spotRepo.count()}`);
    console.log(`  Occupancy Rate: ${((occupiedSpots.length / this.spotRepo.count()) * 100).toFixed(1)}%`);

    // Payments
    const revenue = this.paymentRepo.getTotalRevenue();
    console.log(`\nFinancials:`);
    console.log(`  Total Revenue: $${revenue.toFixed(2)}`);
    console.log(`  Total Payments: ${this.paymentRepo.count()}`);

    console.log('='.repeat(70) + '\n');
  }

  public getCurrentlyParkedVehicles(): any[] {
    const openTickets = this.ticketRepo.findByStatus(TicketStatus.OPEN);

    return openTickets.map(ticket => {
      const vehicle = this.vehicleRepo.findById(ticket.vehicleId);
      const spot = this.spotRepo.findById(ticket.spotId);
      const duration = ticket.calculateActualDuration();

      return {
        ticketNumber: ticket.ticketNumber,
        licensePlate: vehicle?.licensePlate || 'Unknown',
        vehicleType: vehicle?.type || 'Unknown',
        spotNumber: spot?.spotNumber || 'Unknown',
        entryTime: ticket.entryTime,
        expectedDuration: ticket.expectedDurationHours,
        currentDuration: duration,
        isOverstayed: ticket.isOverstayed()
      };
    });
  }
}
