import * as readline from 'readline';
import { ParkingLotService } from '../services/ParkingLotService';
import { SetupService } from '../services/SetupService';
import { PaymentService } from '../services/PaymentService';
import { ReportService } from '../services/ReportService';
import { VehicleFactory } from '../factories/VehicleFactory';
import { VehicleType } from '../enums/VehicleType';
import { PaymentMethod } from '../enums/PaymentMethod';
import { Logger } from '../utils/Logger';
import { NearestSpotStrategy } from '../strategies/NearestSpotStrategy';
import { DurationAwareStrategy } from '../strategies/DurationAwareStrategy';
import { HourlyPricingStrategy } from '../strategies/HourlyPricingStrategy';
import { FlatRatePricingStrategy } from '../strategies/FlatRatePricingStrategy';

export class ConsoleInterface {
  private parkingLot = ParkingLotService.getInstance();
  private setupService = new SetupService();
  private paymentService = new PaymentService();
  private reportService = new ReportService();

  private rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  public async start(): Promise<void> {
    this.printWelcome();

    // Initialize parking lot
    console.log('\nInitializing parking lot system...\n');
    this.setupService.initializeParkingLot(3);

    await this.mainMenu();
  }

  private printWelcome(): void {
    console.clear();
    console.log('\n' + '='.repeat(70));
    console.log(' '.repeat(20) + 'PARKING LOT SYSTEM');
    console.log('='.repeat(70));
    console.log('  Duration-Aware Spot Allocation');
    console.log('  Design Patterns: Singleton, Factory, Strategy, State');
    console.log('  Technology: Node.js + TypeScript');
    console.log('='.repeat(70) + '\n');
  }

  private async mainMenu(): Promise<void> {
    while (true) {
      console.log('\n' + '─'.repeat(70));
      console.log('MAIN MENU');
      console.log('─'.repeat(70));
      console.log('1. Park Vehicle');
      console.log('2. Unpark Vehicle');
      console.log('3. View Availability');
      console.log('4. View Currently Parked Vehicles');
      console.log('5. System Reports');
      console.log('6. Change Settings');
      console.log('7. Exit');
      console.log('─'.repeat(70));

      const choice = await this.prompt('Enter your choice (1-7): ');

      try {
        switch (choice) {
          case '1':
            await this.parkVehicleFlow();
            break;
          case '2':
            await this.unparkVehicleFlow();
            break;
          case '3':
            this.viewAvailability();
            break;
          case '4':
            this.viewCurrentlyParked();
            break;
          case '5':
            await this.reportsMenu();
            break;
          case '6':
            await this.settingsMenu();
            break;
          case '7':
            console.log('\nThank you for using Parking Lot System!\n');
            this.rl.close();
            process.exit(0);
          default:
            Logger.error('Invalid choice. Please enter a number between 1-7.');
        }
      } catch (error: any) {
        Logger.error(error.message);
      }
    }
  }

  private async parkVehicleFlow(): Promise<void> {
    console.log('\n' + '─'.repeat(70));
    console.log('PARK VEHICLE');
    console.log('─'.repeat(70));

    // Get vehicle details
    const licensePlate = await this.prompt('Enter license plate: ');
    if (!licensePlate) {
      Logger.error('License plate cannot be empty');
      return;
    }

    console.log('\nVehicle Types:');
    console.log('1. Car');
    console.log('2. Bike');
    console.log('3. Truck');
    console.log('4. Van');
    const typeChoice = await this.prompt('Select vehicle type (1-4): ');

    let vehicleType: VehicleType;
    switch (typeChoice) {
      case '1': vehicleType = VehicleType.CAR; break;
      case '2': vehicleType = VehicleType.BIKE; break;
      case '3': vehicleType = VehicleType.TRUCK; break;
      case '4': vehicleType = VehicleType.VAN; break;
      default:
        Logger.error('Invalid vehicle type');
        return;
    }

    const color = await this.prompt('Enter vehicle color: ');
    const durationStr = await this.prompt('Expected parking duration (hours): ');
    const expectedDuration = parseFloat(durationStr);

    if (isNaN(expectedDuration) || expectedDuration <= 0) {
      Logger.error('Invalid duration. Must be a positive number.');
      return;
    }

    // Create vehicle
    const vehicle = VehicleFactory.createVehicle(vehicleType, licensePlate, color);

    // Park vehicle
    const ticket = this.parkingLot.parkVehicle(vehicle, expectedDuration, 'GATE-ENTRY-1');

    // Display ticket
    console.log('\n' + '='.repeat(70));
    console.log('PARKING TICKET');
    console.log('='.repeat(70));
    console.log(`Ticket Number: ${ticket.ticketNumber}`);
    console.log(`License Plate: ${licensePlate}`);
    console.log(`Vehicle Type: ${vehicleType}`);
    console.log(`Entry Time: ${ticket.entryTime.toLocaleString()}`);
    console.log(`Expected Duration: ${expectedDuration} hours`);
    console.log(`Status: ${ticket.status}`);
    console.log('='.repeat(70));
    console.log('\n⚠️  Please keep this ticket number for exit!');
  }

  private async unparkVehicleFlow(): Promise<void> {
    console.log('\n' + '─'.repeat(70));
    console.log('UNPARK VEHICLE');
    console.log('─'.repeat(70));

    const ticketNumber = await this.prompt('Enter ticket number: ');
    if (!ticketNumber) {
      Logger.error('Ticket number cannot be empty');
      return;
    }

    // Unpark vehicle
    const payment = this.parkingLot.unparkVehicle(ticketNumber, 'GATE-EXIT-1');

    // Display payment details
    console.log('\n' + '='.repeat(70));
    console.log('PAYMENT RECEIPT');
    console.log('='.repeat(70));
    console.log(`Ticket Number: ${ticketNumber}`);
    console.log(`Base Amount: $${payment.baseAmount.toFixed(2)}`);
    console.log(`Overstay Penalty: $${payment.overstayPenalty.toFixed(2)}`);
    console.log(`Discounts: $${payment.discounts.toFixed(2)}`);
    console.log('─'.repeat(70));
    console.log(`TOTAL AMOUNT: $${payment.amount.toFixed(2)}`);
    console.log('='.repeat(70));

    if (payment.overstayPenalty > 0) {
      console.log('\n⚠️  Overstay penalty applied!');
    }

    // Process payment
    console.log('\nPayment Methods:');
    console.log('1. Cash');
    console.log('2. Card');
    console.log('3. Wallet');
    const methodChoice = await this.prompt('Select payment method (1-3): ');

    let method: PaymentMethod;
    switch (methodChoice) {
      case '1': method = PaymentMethod.CASH; break;
      case '2': method = PaymentMethod.CARD; break;
      case '3': method = PaymentMethod.WALLET; break;
      default:
        Logger.error('Invalid payment method');
        return;
    }

    this.paymentService.processPayment(payment, method);
    console.log('\n✅ Payment successful! Thank you!');
  }

  private viewAvailability(): void {
    const summary = this.parkingLot.getAvailabilitySummary();

    console.log('\n' + '='.repeat(70));
    console.log('PARKING AVAILABILITY');
    console.log('='.repeat(70));
    console.log(`Total Floors: ${summary.totalFloors}\n`);

    summary.floors.forEach((floor: any) => {
      const occupancyRate = ((floor.occupied / floor.totalSpots) * 100).toFixed(1);
      console.log(`Floor ${floor.floorNumber}:`);
      console.log(`  Total Spots: ${floor.totalSpots}`);
      console.log(`  Available: ${floor.available}`);
      console.log(`  Occupied: ${floor.occupied}`);
      console.log(`  Occupancy: ${occupancyRate}%`);
      console.log('');
    });
    console.log('='.repeat(70));
  }

  private viewCurrentlyParked(): void {
    const vehicles = this.reportService.getCurrentlyParkedVehicles();

    console.log('\n' + '='.repeat(70));
    console.log('CURRENTLY PARKED VEHICLES');
    console.log('='.repeat(70));

    if (vehicles.length === 0) {
      console.log('No vehicles currently parked.');
    } else {
      vehicles.forEach((v, index) => {
        console.log(`\n[${index + 1}] ${v.licensePlate} (${v.vehicleType})`);
        console.log(`    Ticket: ${v.ticketNumber}`);
        console.log(`    Spot: ${v.spotNumber}`);
        console.log(`    Entry: ${new Date(v.entryTime).toLocaleString()}`);
        console.log(`    Expected: ${v.expectedDuration}h | Current: ${v.currentDuration}h`);
        if (v.isOverstayed) {
          console.log(`    ⚠️  OVERSTAYED`);
        }
      });
    }
    console.log('\n' + '='.repeat(70));
  }

  private async reportsMenu(): Promise<void> {
    console.log('\n' + '─'.repeat(70));
    console.log('REPORTS MENU');
    console.log('─'.repeat(70));
    console.log('1. System Report');
    console.log('2. Revenue Report');
    console.log('3. Back to Main Menu');
    console.log('─'.repeat(70));

    const choice = await this.prompt('Enter your choice (1-3): ');

    switch (choice) {
      case '1':
        this.reportService.printSystemReport();
        break;
      case '2':
        this.paymentService.printRevenueReport();
        break;
      case '3':
        return;
      default:
        Logger.error('Invalid choice');
    }
  }

  private async settingsMenu(): Promise<void> {
    console.log('\n' + '─'.repeat(70));
    console.log('SETTINGS MENU');
    console.log('─'.repeat(70));
    console.log('1. Change Allocation Strategy');
    console.log('2. Change Pricing Strategy');
    console.log('3. View Current Strategies');
    console.log('4. Back to Main Menu');
    console.log('─'.repeat(70));

    const choice = await this.prompt('Enter your choice (1-4): ');

    switch (choice) {
      case '1':
        await this.changeAllocationStrategy();
        break;
      case '2':
        await this.changePricingStrategy();
        break;
      case '3':
        this.viewStrategies();
        break;
      case '4':
        return;
      default:
        Logger.error('Invalid choice');
    }
  }

  private async changeAllocationStrategy(): Promise<void> {
    console.log('\nAllocation Strategies:');
    console.log('1. Duration-Aware Strategy (Recommended)');
    console.log('2. Nearest Spot Strategy');

    const choice = await this.prompt('Select strategy (1-2): ');

    switch (choice) {
      case '1':
        this.parkingLot.setAllocationStrategy(new DurationAwareStrategy());
        break;
      case '2':
        this.parkingLot.setAllocationStrategy(new NearestSpotStrategy());
        break;
      default:
        Logger.error('Invalid choice');
    }
  }

  private async changePricingStrategy(): Promise<void> {
    console.log('\nPricing Strategies:');
    console.log('1. Hourly Pricing (with overstay penalty)');
    console.log('2. Flat Rate Pricing');

    const choice = await this.prompt('Select strategy (1-2): ');

    switch (choice) {
      case '1':
        this.parkingLot.setPricingStrategy(new HourlyPricingStrategy());
        break;
      case '2':
        this.parkingLot.setPricingStrategy(new FlatRatePricingStrategy());
        break;
      default:
        Logger.error('Invalid choice');
    }
  }

  private viewStrategies(): void {
    const strategies = this.parkingLot.getCurrentStrategies();

    console.log('\n' + '='.repeat(70));
    console.log('CURRENT STRATEGIES');
    console.log('='.repeat(70));
    console.log(`Allocation: ${strategies.allocation}`);
    console.log(`Pricing: ${strategies.pricing}`);
    console.log('='.repeat(70));
  }

  private prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }
}

// Start the application
const app = new ConsoleInterface();
app.start().catch(console.error);
