# IRCTC Train Ticketing System - LLD Implementation

## Quick Start
```bash
npm install
npm start
```

## Features
- User Management (Registration, Authentication)
- Train Search & Availability
- Ticket Booking with Seat Allocation
- Waitlist Management (Waitlist → RAC → Confirmed)
- Payment Processing (Credit Card, UPI, Net Banking)
- Booking Cancellation with Refund
- PNR Status Check

## Architecture
**Layered Architecture:**
- Models (Domain Entities)
- Repositories (Data Access Layer)
- Services (Business Logic)
- Console (User Interface)

## Design Patterns
1. **Singleton Pattern**: BookingManager, SeatInventoryManager
2. **Factory Pattern**: TicketFactory for different booking types
3. **State Pattern**: Booking state transitions (Confirmed/RAC/Waitlist/Cancelled)
4. **Strategy Pattern**: Seat allocation strategies, Payment methods
5. **Observer Pattern**: Booking notifications (Email, SMS, Push)
6. **Repository Pattern**: Data access abstraction

## Technology Stack
- Language: TypeScript (Node.js)
- Interface: Console-based with readline
- Storage: In-memory (Maps/Arrays)

## Project Structure
```
src/
├── enums/           # Type-safe enumerations
├── utils/           # Helper utilities
├── models/          # Domain entities
├── states/          # State pattern implementation
├── strategies/      # Strategy pattern implementation
├── database/        # In-memory database
├── repositories/    # Data access layer
├── services/        # Business logic
└── console/         # CLI interface
```

## Usage
1. Register/Login as User
2. Search trains by source, destination, and date
3. Select train and class
4. Add passengers and book tickets
5. Make payment
6. Check PNR status
7. Cancel booking if needed

## Design Highlights
- **Concurrency Safe**: Seat locking mechanism prevents double booking
- **State Management**: Clean state transitions for booking lifecycle
- **Flexible Allocation**: Multiple seat allocation strategies
- **Notification System**: Observer pattern for multi-channel notifications
- **Refund Logic**: Time-based refund calculation
