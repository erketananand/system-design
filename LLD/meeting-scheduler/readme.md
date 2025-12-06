# Meeting Scheduler - LLD Implementation

## Overview
A comprehensive calendar and meeting scheduling system inspired by Google Calendar, built with TypeScript and design patterns.

## Features
- ✅ User Management with timezone support
- ✅ Event/Meeting Creation and Management
- ✅ Recurring Events (Daily, Weekly, Monthly)
- ✅ Meeting Room Management and Booking
- ✅ Availability Checking & Conflict Detection
- ✅ Meeting Invitations & RSVP System
- ✅ Notification System with preferences
- ✅ Calendar Management

## Quick Start

### Installation
```bash
npm install
```

### Run Application
```bash
npm start
```

### Development Mode
```bash
npm run dev
```

## Architecture

### Layered Architecture
```
Console Interface (CLI)
        ↓
Service Layer (Business Logic)
        ↓
Repository Layer (Data Access)
        ↓
Database Layer (In-Memory Storage)
        ↓
Models (Domain Entities)
```

## Design Patterns Used

1. **Singleton Pattern** - CalendarService (single instance)
2. **Strategy Pattern** - Recurrence strategies (Daily, Weekly, Monthly)
3. **State Pattern** - Invitation states (Pending, Accepted, Declined, Tentative)
4. **Observer Pattern** - Notification observers (Email, InApp, Reminder)
5. **Factory Pattern** - Event creation factory
6. **Repository Pattern** - Data access abstraction

## Technology Stack
- **Language:** TypeScript
- **Runtime:** Node.js
- **Storage:** In-memory (Maps/Arrays)
- **Interface:** Console-based CLI

## Project Structure
```
src/
├── enums/          # Type-safe enumerations
├── utils/          # Utility classes (IdGenerator, Logger)
├── models/         # Domain entities
├── states/         # State pattern implementations
├── strategies/     # Strategy pattern implementations
├── observers/      # Observer pattern implementations
├── factories/      # Factory pattern implementations
├── database/       # In-memory database
├── repositories/   # Data access layer
├── services/       # Business logic layer
└── console/        # CLI interface
```

## Author
LLD Interview Preparation

## License
MIT
