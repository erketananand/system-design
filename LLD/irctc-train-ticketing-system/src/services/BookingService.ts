import { Booking } from '../models/Booking';
import { Passenger } from '../models/Passenger';
import { Payment } from '../models/Payment';
import { Train } from '../models/Train';
import { Station } from '../models/Station';
import { BookingRepository } from '../repositories/BookingRepository';
import { PaymentRepository } from '../repositories/PaymentRepository';
import { TrainRepository } from '../repositories/TrainRepository';
import { CoachType } from '../enums/CoachType';
import { BookingStatus } from '../enums/BookingStatus';
import { ISeatAllocationStrategy } from '../strategies/seat-allocation/ISeatAllocationStrategy';
import { BerthPreferenceStrategy } from '../strategies/seat-allocation/BerthPreferenceStrategy';
import { IPaymentMethod } from '../strategies/payment/IPaymentMethod';
import { ConfirmedState } from '../states/ConfirmedState';
import { WaitlistState } from '../states/WaitlistState';
import { BookingNotifier } from '../observers/BookingNotifier';
import { Logger } from '../utils/Logger';

export class BookingService {
  private bookingRepo = new BookingRepository();
  private paymentRepo = new PaymentRepository();
  private trainRepo = new TrainRepository();
  private notifier = BookingNotifier.getInstance();

  /**
   * Create a new booking
   */
  public createBooking(
    userId: string,
    trainId: string,
    passengers: Passenger[],
    journeyDate: Date,
    sourceStation: Station,
    destinationStation: Station,
    coachType: CoachType,
    totalFare: number
  ): Booking | null {
    const train = this.trainRepo.findById(trainId);

    if (!train) {
      Logger.error('Train not found.');
      return null;
    }

    // Check if train operates on journey date
    if (!train.isOperatingOn(journeyDate)) {
      Logger.error('Train does not operate on selected date.');
      return null;
    }

    // Create booking
    const booking = new Booking(
      userId,
      trainId,
      passengers,
      journeyDate,
      sourceStation,
      destinationStation,
      coachType,
      totalFare
    );

    // Try to allocate seats
    const availableSeats = train.getAvailableSeats(coachType, journeyDate);

    if (availableSeats >= passengers.length) {
      // Allocate seats using strategy
      const strategy: ISeatAllocationStrategy = new BerthPreferenceStrategy();
      const result = strategy.allocateSeats(train, passengers, coachType, journeyDate);

      if (result.success) {
        Logger.success(`Seats allocated: ${result.message}`);
      } else {
        Logger.warn(`Seat allocation issue: ${result.message}`);
      }
    } else {
      // Add to waitlist
      const waitlistPosition = this.getNextWaitlistPosition(trainId, journeyDate, coachType);
      booking.addToWaitlist(waitlistPosition);
      Logger.warn(`Booking added to waitlist at position ${waitlistPosition}`);
    }

    this.bookingRepo.save(booking);
    Logger.success(`Booking created with PNR: ${booking.pnr}`);
    return booking;
  }

  /**
   * Process payment for booking
   */
  public processPayment(
    bookingId: string,
    paymentMethod: IPaymentMethod
  ): boolean {
    const booking = this.bookingRepo.findById(bookingId);

    if (!booking) {
      Logger.error('Booking not found.');
      return false;
    }

    // Create payment
    const payment = new Payment(bookingId, booking.totalFare, paymentMethod);

    // Process payment
    const success = payment.process();

    if (success) {
      booking.setPaymentId(payment.id);

      // Confirm booking if seats were allocated
      if (booking.getStatus() !== BookingStatus.WAITLIST) {
        booking.confirm();
      }

      this.paymentRepo.save(payment);
      this.bookingRepo.update(booking);

      // Notify observers
      this.notifier.notifyStatusChange(
        booking,
        BookingStatus.PENDING_PAYMENT,
        booking.getStatus()
      );

      Logger.success(`Payment successful for PNR: ${booking.pnr}`);
      return true;
    } else {
      this.paymentRepo.save(payment);
      Logger.error('Payment failed.');
      return false;
    }
  }

  /**
   * Cancel booking
   */
  public cancelBooking(pnr: string): boolean {
    const booking = this.bookingRepo.findByPNR(pnr);

    if (!booking) {
      Logger.error('Booking not found.');
      return false;
    }

    if (booking.getStatus() === BookingStatus.CANCELLED) {
      Logger.warn('Booking is already cancelled.');
      return false;
    }

    const refundAmount = booking.calculateRefund();
    const oldStatus = booking.getStatus();

    booking.cancel();
    this.bookingRepo.update(booking);

    // Process refund if payment was made
    if (booking.paymentId) {
      const payment = this.paymentRepo.findById(booking.paymentId);
      if (payment) {
        payment.refund(refundAmount);
        this.paymentRepo.update(payment);
      }
    }

    // Notify observers
    this.notifier.notifyCancellation(booking, refundAmount);

    // Promote waitlisted bookings
    this.promoteWaitlistedBookings(booking.trainId, booking.journeyDate, booking.coachType);

    Logger.success(`Booking ${pnr} cancelled. Refund: ₹${refundAmount}`);
    return true;
  }

  /**
   * Get booking by PNR
   */
  public getBookingByPNR(pnr: string): Booking | undefined {
    return this.bookingRepo.findByPNR(pnr);
  }

  /**
   * Get user bookings
   */
  public getUserBookings(userId: string): Booking[] {
    return this.bookingRepo.findByUserId(userId);
  }

  /**
   * Get upcoming bookings for user
   */
  public getUpcomingBookings(userId: string): Booking[] {
    return this.bookingRepo.findUpcomingBookings(userId);
  }

  /**
   * Promote waitlisted bookings
   */
  private promoteWaitlistedBookings(trainId: string, journeyDate: Date, coachType: CoachType): void {
    const train = this.trainRepo.findById(trainId);
    if (!train) return;

    const availableSeats = train.getAvailableSeats(coachType, journeyDate);
    const waitlistedBookings = this.bookingRepo
      .findByTrainAndDate(trainId, journeyDate)
      .filter(b => b.getStatus() === BookingStatus.WAITLIST)
      .sort((a, b) => {
        const aState = a.bookingState as WaitlistState;
        const bState = b.bookingState as WaitlistState;
        return aState.getWaitlistPosition() - bState.getWaitlistPosition();
      });

    let seatsToPromote = Math.min(availableSeats, waitlistedBookings.length);

    for (let i = 0; i < seatsToPromote; i++) {
      const booking = waitlistedBookings[i];
      booking.promoteFromWaitlist();
      this.bookingRepo.update(booking);

      // Notify observers
      this.notifier.notifyWaitlistPromotion(booking, booking.getStatus());

      Logger.success(`Booking ${booking.pnr} promoted from waitlist!`);
    }
  }

  /**
   * Get next waitlist position
   */
  private getNextWaitlistPosition(trainId: string, journeyDate: Date, coachType: CoachType): number {
    const bookings = this.bookingRepo.findByTrainAndDate(trainId, journeyDate);
    const waitlistedCount = bookings.filter(b => b.getStatus() === BookingStatus.WAITLIST).length;
    return waitlistedCount + 1;
  }

  /**
   * Display booking details
   */
  public displayBookingDetails(booking: Booking): void {
    console.log('\n' + '='.repeat(80));
    console.log(`BOOKING DETAILS - PNR: ${booking.pnr}`);
    console.log('='.repeat(80));
    console.log(`Status: ${booking.getStatus()}`);
    console.log(`Journey: ${booking.getJourneyDisplay()}`);
    console.log(`Coach Type: ${booking.coachType}`);
    console.log(`Total Fare: ₹${booking.totalFare}`);
    console.log(`Booked At: ${booking.bookedAt.toLocaleString()}`);

    console.log('\nPassengers:');
    booking.passengers.forEach((p, idx) => {
      console.log(`  ${idx + 1}. ${p.getDisplayInfo()}`);
    });

    console.log('='.repeat(80) + '\n');
  }
}
