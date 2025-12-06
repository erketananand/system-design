import * as readline from 'readline';
import { UserService } from '../services/UserService';
import { StationService } from '../services/StationService';
import { TrainService } from '../services/TrainService';
import { BookingService } from '../services/BookingService';
import { SetupService } from '../services/SetupService';
import { User } from '../models/User';
import { Train } from '../models/Train';
import { Passenger } from '../models/Passenger';
import { Gender } from '../enums/Gender';
import { BerthPreference } from '../enums/BerthPreference';
import { CreditCardPayment } from '../strategies/payment/CreditCardPayment';
import { UPIPayment } from '../strategies/payment/UPIPayment';
import { NetBankingPayment } from '../strategies/payment/NetBankingPayment';
import { EmailNotifier } from '../observers/EmailNotifier';
import { SMSNotifier } from '../observers/SMSNotifier';
import { BookingNotifier } from '../observers/BookingNotifier';
import { Logger } from '../utils/Logger';
import { InMemoryDatabase } from '../database/InMemoryDatabase';

export class ConsoleInterface {
  private userService = new UserService();
  private stationService = new StationService();
  private trainService = new TrainService();
  private bookingService = new BookingService();
  private setupService = new SetupService();
  private db = InMemoryDatabase.getInstance();
  private notifier = BookingNotifier.getInstance();

  private rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  private currentUser: User | null = null;

  public async start(): Promise<void> {
    this.printWelcome();
    this.initializeObservers();
    this.setupService.initializeSystem();
    await this.mainMenu();
  }

  private printWelcome(): void {
    console.clear();
    console.log('\n' + '='.repeat(80));
    console.log(' '.repeat(25) + 'IRCTC TRAIN TICKETING SYSTEM');
    console.log('='.repeat(80));
    console.log('  Design Patterns: Singleton, Factory, State, Strategy, Observer, Repository');
    console.log('  Technology: Node.js + TypeScript + In-Memory Database');
    console.log('='.repeat(80) + '\n');
  }

  private initializeObservers(): void {
    this.notifier.attach(new EmailNotifier());
    this.notifier.attach(new SMSNotifier());
  }

  private async mainMenu(): Promise<void> {
    while (true) {
      console.log('\n' + '='.repeat(80));
      console.log('MAIN MENU');
      console.log('='.repeat(80));

      if (this.currentUser) {
        console.log(`Logged in as: ${this.currentUser.name} (${this.currentUser.email})\n`);
        console.log('1. Search Trains');
        console.log('2. My Bookings');
        console.log('3. Check PNR Status');
        console.log('4. Cancel Booking');
        console.log('5. My Profile');
        console.log('6. Logout');
        console.log('7. Exit');
      } else {
        console.log('1. Register');
        console.log('2. Login');
        console.log('3. View All Stations');
        console.log('4. View All Trains');
        console.log('5. Database Statistics');
        console.log('6. Exit');
      }

      console.log('='.repeat(80));

      const choice = await this.prompt('\nEnter your choice: ');

      if (this.currentUser) {
        await this.handleAuthenticatedMenu(choice);
      } else {
        await this.handleUnauthenticatedMenu(choice);
      }
    }
  }

  private async handleUnauthenticatedMenu(choice: string): Promise<void> {
    switch (choice) {
      case '1':
        await this.registerUser();
        break;
      case '2':
        await this.loginUser();
        break;
      case '3':
        this.stationService.displayAllStations();
        break;
      case '4':
        await this.viewAllTrains();
        break;
      case '5':
        this.db.printStats();
        break;
      case '6':
        console.log('\nThank you for using IRCTC System!\n');
        this.rl.close();
        process.exit(0);
      default:
        Logger.error('Invalid choice. Please try again.');
    }
  }

  private async handleAuthenticatedMenu(choice: string): Promise<void> {
    switch (choice) {
      case '1':
        await this.searchAndBookTrains();
        break;
      case '2':
        await this.viewMyBookings();
        break;
      case '3':
        await this.checkPNRStatus();
        break;
      case '4':
        await this.cancelBooking();
        break;
      case '5':
        await this.viewProfile();
        break;
      case '6':
        this.logout();
        break;
      case '7':
        console.log('\nThank you for using IRCTC System!\n');
        this.rl.close();
        process.exit(0);
      default:
        Logger.error('Invalid choice. Please try again.');
    }
  }

  // ========== USER MANAGEMENT ==========

  private async registerUser(): Promise<void> {
    Logger.header('USER REGISTRATION');

    const name = await this.prompt('Enter your name: ');
    const email = await this.prompt('Enter your email: ');
    const phone = await this.prompt('Enter your phone: ');
    const password = await this.prompt('Enter your password: ');
    const dobStr = await this.prompt('Enter date of birth (YYYY-MM-DD) [optional]: ');

    const dob = dobStr ? new Date(dobStr) : undefined;

    const user = this.userService.register(name, email, phone, password, dob);

    if (user) {
      console.log('\n✓ Registration successful! Please login.');
    }
  }

  private async loginUser(): Promise<void> {
    Logger.header('USER LOGIN');

    const email = await this.prompt('Enter your email: ');
    const password = await this.prompt('Enter your password: ');

    const user = this.userService.login(email, password);

    if (user) {
      this.currentUser = user;
      console.log('\n✓ Login successful!');
    }
  }

  private logout(): void {
    this.currentUser = null;
    Logger.success('Logged out successfully.');
  }

  private async viewProfile(): Promise<void> {
    if (!this.currentUser) return;

    Logger.header('MY PROFILE');
    console.log(`Name: ${this.currentUser.name}`);
    console.log(`Email: ${this.currentUser.email}`);
    console.log(`Phone: ${this.currentUser.phone}`);
    console.log(`Age: ${this.currentUser.getAge() || 'N/A'}`);
    console.log(`Member Since: ${this.currentUser.createdAt.toDateString()}`);
  }

  // ========== TRAIN SEARCH & BOOKING ==========

  private async searchAndBookTrains(): Promise<void> {
    Logger.header('SEARCH TRAINS');

    // Show available stations
    this.stationService.displayAllStations();

    const sourceCode = (await this.prompt('Enter source station code: ')).toUpperCase();
    const destCode = (await this.prompt('Enter destination station code: ')).toUpperCase();
    const dateStr = await this.prompt('Enter journey date (YYYY-MM-DD): ');

    const journeyDate = new Date(dateStr);
    const trains = this.trainService.searchTrains(sourceCode, destCode, journeyDate);

    if (trains.length === 0) {
      console.log('\nNo trains found for the selected route and date.');
      return;
    }

    // Display available trains
    console.log('\n' + '='.repeat(80));
    console.log('AVAILABLE TRAINS');
    console.log('='.repeat(80));
    console.log('No.  Train Number  Train Name'.padEnd(50) + 'Type');
    console.log('-'.repeat(80));

    trains.forEach((train, idx) => {
      const trainInfo = `${idx + 1}.   ${train.trainNumber.padEnd(13)} ${train.trainName}`;
      console.log(trainInfo.padEnd(50) + train.trainType);
    });
    console.log('='.repeat(80));

    const trainChoice = await this.prompt('\nSelect train number (or 0 to cancel): ');
    const trainIndex = parseInt(trainChoice) - 1;

    if (trainIndex < 0 || trainIndex >= trains.length) {
      console.log('Invalid selection.');
      return;
    }

    const selectedTrain = trains[trainIndex];
    await this.bookTicket(selectedTrain, sourceCode, destCode, journeyDate);
  }

  private async bookTicket(
    train: Train,
    sourceCode: string,
    destCode: string,
    journeyDate: Date
  ): Promise<void> {
    Logger.header('BOOK TICKET');

    // Display coach types and availability
    console.log('\nAvailable Coach Types:');
    const coachTypes = train.getAvailableCoachTypes();

    coachTypes.forEach((type, idx) => {
      const available = train.getAvailableSeats(type, journeyDate);
      const fare = this.trainService.calculateFare(train.id, type, sourceCode, destCode);
      console.log(`${idx + 1}. ${type.padEnd(15)} Available: ${available.toString().padEnd(5)} Fare: ₹${fare}`);
    });

    const coachChoice = await this.prompt('\nSelect coach type: ');
    const coachIndex = parseInt(coachChoice) - 1;

    if (coachIndex < 0 || coachIndex >= coachTypes.length) {
      console.log('Invalid selection.');
      return;
    }

    const selectedCoachType = coachTypes[coachIndex];
    const fare = this.trainService.calculateFare(train.id, selectedCoachType, sourceCode, destCode);

    // Get passenger details
    const passengerCount = parseInt(await this.prompt('\nEnter number of passengers: '));
    const passengers: Passenger[] = [];

    for (let i = 0; i < passengerCount; i++) {
      console.log(`\nPassenger ${i + 1}:`);
      const name = await this.prompt('  Name: ');
      const age = parseInt(await this.prompt('  Age: '));
      const gender = await this.prompt('  Gender (MALE/FEMALE/OTHER): ') as Gender;
      const berthPref = await this.prompt('  Berth Preference (LOWER/MIDDLE/UPPER/NO_PREFERENCE): ') as BerthPreference;

      const passenger = new Passenger(name, age, gender, berthPref);
      passengers.push(passenger);
    }

    const totalFare = fare * passengerCount;
    console.log(`\nTotal Fare: ₹${totalFare}`);

    const confirm = await this.prompt('\nConfirm booking? (yes/no): ');
    if (confirm.toLowerCase() !== 'yes') {
      console.log('Booking cancelled.');
      return;
    }

    // Create booking
    const sourceStation = this.stationService.getStationByCode(sourceCode)!;
    const destStation = this.stationService.getStationByCode(destCode)!;

    const booking = this.bookingService.createBooking(
      this.currentUser!.id,
      train.id,
      passengers,
      journeyDate,
      sourceStation,
      destStation,
      selectedCoachType,
      totalFare
    );

    if (!booking) {
      console.log('Booking failed.');
      return;
    }

    // Process payment
    await this.processPayment(booking.id, totalFare);
  }

  private async processPayment(bookingId: string, amount: number): Promise<void> {
    Logger.header('PAYMENT');

    console.log(`Amount to pay: ₹${amount}`);
    console.log('\nPayment Methods:');
    console.log('1. Credit Card');
    console.log('2. UPI');
    console.log('3. Net Banking');

    const choice = await this.prompt('\nSelect payment method: ');

    let paymentMethod;

    switch (choice) {
      case '1':
        const cardNumber = await this.prompt('Enter card number (16 digits): ');
        const cvv = await this.prompt('Enter CVV: ');
        const expiry = await this.prompt('Enter expiry (MM/YY): ');
        const cardHolder = await this.prompt('Enter cardholder name: ');
        paymentMethod = new CreditCardPayment(cardNumber, cvv, expiry, cardHolder);
        break;
      case '2':
        const upiId = await this.prompt('Enter UPI ID: ');
        paymentMethod = new UPIPayment(upiId);
        break;
      case '3':
        const bankName = await this.prompt('Enter bank name: ');
        const accountNumber = await this.prompt('Enter account number: ');
        paymentMethod = new NetBankingPayment(bankName, accountNumber);
        break;
      default:
        console.log('Invalid payment method.');
        return;
    }

    const success = this.bookingService.processPayment(bookingId, paymentMethod);

    if (success) {
      const booking = this.bookingService.getBookingByPNR(
        this.db.bookings.get(bookingId)!.pnr
      );
      if (booking) {
        this.bookingService.displayBookingDetails(booking);
      }
    }
  }

  // ========== BOOKING MANAGEMENT ==========

  private async viewMyBookings(): Promise<void> {
    Logger.header('MY BOOKINGS');

    const bookings = this.bookingService.getUserBookings(this.currentUser!.id);

    if (bookings.length === 0) {
      console.log('No bookings found.');
      return;
    }

    console.log('\n' + '='.repeat(80));
    bookings.forEach((booking, idx) => {
      console.log(`${idx + 1}. ${booking.getDisplayInfo()}`);
      console.log(`   ${booking.getJourneyDisplay()}`);
      console.log('-'.repeat(80));
    });
    console.log('='.repeat(80));

    const choice = await this.prompt('\nEnter booking number to view details (or 0 to go back): ');
    const index = parseInt(choice) - 1;

    if (index >= 0 && index < bookings.length) {
      this.bookingService.displayBookingDetails(bookings[index]);
    }
  }

  private async checkPNRStatus(): Promise<void> {
    Logger.header('CHECK PNR STATUS');

    const pnr = await this.prompt('Enter PNR number: ');
    const booking = this.bookingService.getBookingByPNR(pnr);

    if (!booking) {
      Logger.error('Booking not found.');
      return;
    }

    this.bookingService.displayBookingDetails(booking);
  }

  private async cancelBooking(): Promise<void> {
    Logger.header('CANCEL BOOKING');

    const pnr = await this.prompt('Enter PNR number: ');
    const booking = this.bookingService.getBookingByPNR(pnr);

    if (!booking) {
      Logger.error('Booking not found.');
      return;
    }

    if (booking.userId !== this.currentUser!.id) {
      Logger.error('You are not authorized to cancel this booking.');
      return;
    }

    this.bookingService.displayBookingDetails(booking);

    const confirm = await this.prompt('\nAre you sure you want to cancel? (yes/no): ');
    if (confirm.toLowerCase() === 'yes') {
      this.bookingService.cancelBooking(pnr);
    } else {
      console.log('Cancellation aborted.');
    }
  }

  // ========== UTILITY ==========

  private async viewAllTrains(): Promise<void> {
    Logger.header('ALL TRAINS');

    const trains = this.trainService.getAllTrains();

    if (trains.length === 0) {
      console.log('No trains available.');
      return;
    }

    console.log('\n' + '='.repeat(80));
    console.log('No.  Train Number  Train Name'.padEnd(50) + 'Route');
    console.log('-'.repeat(80));

    trains.forEach((train, idx) => {
      const trainInfo = `${idx + 1}.   ${train.trainNumber.padEnd(13)} ${train.trainName}`;
      console.log(trainInfo.padEnd(50) + train.getRouteDisplay());
    });
    console.log('='.repeat(80));

    const choice = await this.prompt('\nEnter train number to view details (or 0 to go back): ');
    const index = parseInt(choice) - 1;

    if (index >= 0 && index < trains.length) {
      this.trainService.displayTrainDetails(trains[index]);
    }
  }

  private prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }
}

// ========== START APPLICATION ==========
const app = new ConsoleInterface();
app.start().catch(console.error);
