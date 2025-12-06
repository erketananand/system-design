# IRCTC TRAIN TICKETING SYSTEM - REQUIREMENTS DOCUMENT

## PROJECT SCOPE:
Design an online railway reservation system similar to IRCTC that allows users to search trains, book tickets, manage bookings, check PNR status, handle waitlist management, and process refunds. The system focuses on core booking operations with seat allocation strategies and booking state management.

## PRIMARY FEATURES (CORE/MVP):

1. **User Management**
   - User registration and authentication
   - Profile management (name, contact, email, preferences)
   - Multiple passenger support per booking
   - User booking history

2. **Train Search & Availability**
   - Search trains by source, destination, and date
   - Display available trains with timings and fares
   - Show real-time seat availability (AC/Sleeper/General classes)
   - Filter by train type, departure time, journey duration

3. **Ticket Booking**
   - Select train, class, and seats
   - Add multiple passengers per booking
   - Seat allocation (confirmed/RAC/waitlist)
   - Generate PNR (Passenger Name Record)
   - Booking confirmation with ticket details

4. **Seat Allocation Strategy**
   - Automatic seat assignment based on availability
   - Priority-based allocation (Confirmed → RAC → Waitlist)
   - Dynamic seat upgrades from waitlist to confirmed
   - Coach and berth assignment logic

5. **Booking Management**
   - View booking details by PNR
   - Check current ticket status (Confirmed/RAC/Waitlist/Cancelled)
   - Booking history for users
   - Cancellation with refund calculation

6. **Payment Processing**
   - Multiple payment methods (Credit/Debit Card, UPI, Net Banking)
   - Payment verification and confirmation
   - Refund processing on cancellation
   - Payment transaction history

## SECONDARY FEATURES:

1. **Waitlist Management**
   - Automatic promotion from waitlist to RAC/Confirmed when seats available
   - Waitlist position tracking
   - Real-time status updates

2. **Train Schedule Management**
   - Admin can add/update train schedules
   - Manage routes, stations, and timings
   - Set fare structures per class
   - Configure seat capacity per coach

3. **Quota Management**
   - General quota, Tatkal quota, Ladies quota
   - Quota-based seat allocation
   - Senior citizen/disabled passenger concessions

## FUTURE ENHANCEMENTS:

1. **Dynamic Pricing & Surge Pricing**
   - Adjust fares based on demand and availability
   - Festival/holiday pricing strategies
   - Early bird discounts

2. **Meal & Accommodation Booking**
   - Add food/catering orders during booking
   - Hotel/lodge reservations at destination
   - E-catering integration

3. **Multi-City & Return Journey**
   - Round-trip booking support
   - Multi-segment journey planning
   - Connection train suggestions

## KEY DESIGN NOTES:

- **Concurrency Handling**: Use locking mechanism to prevent double booking during high traffic
- **State Management**: Implement State pattern for booking status transitions (Confirmed → Cancelled, Waitlist → RAC → Confirmed)
- **Strategy Pattern**: Multiple seat allocation strategies based on train type and class
- **Observer Pattern**: Notify users when waitlist status changes
- **Factory Pattern**: Create different ticket types and payment methods
- **Singleton Pattern**: Centralized booking manager and seat allocation service

## IMPLEMENTATION DETAILS:

- **Technology**: Node.js with TypeScript
- **Interface**: Console-based dynamic input with menu-driven flow
- **Storage**: In-memory data layer using Maps and Arrays
- **Architecture**: Layered (Models → Repositories → Services → Controllers → Console)
- **Design Patterns**: Singleton, Factory, State, Strategy, Observer
- **Booking Flow**: Search → Select → Book → Pay → Confirm/Waitlist
