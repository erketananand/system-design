# NoBroker - Real Estate Platform (LLD Implementation)

## Overview
A broker-less real estate platform enabling direct interaction between property owners and seekers for buying, selling, and renting properties (PG, Flat, Villa, Land).

## Quick Start
```bash
npm install
npm start
```

## Features
- User Management (Owner/Seeker roles, Standard/Premium accounts)
- Property Listing Management (PG, Flat, Villa, Land with detailed attributes)
- Advanced Search & Filtering (location, BHK, furnishing, amenities)
- Saved Searches & Alerts (instant/daily notifications)
- Chat-Based Interaction (visit scheduling + price negotiation)
- Reviews & Ratings System
- Property Comparison

## Architecture
- **Models:** Domain entities with business logic
- **Repositories:** Data access layer (in-memory)
- **Services:** Business orchestration
- **Console:** Interactive CLI interface

## Design Patterns
- **Singleton:** InMemoryDatabase, MainController
- **Factory:** PropertyFactory, ListingFactory
- **State:** ListingState, OfferState, VisitState
- **Strategy:** SearchStrategy, AlertDispatchStrategy
- **Observer:** AlertService for saved search notifications
- **Builder:** PropertyBuilder, SearchCriteriaBuilder
- **Repository:** Data access abstraction

## Technology Stack
- **Language:** TypeScript (Node.js)
- **Interface:** Console-based (readline)
- **Storage:** In-memory (Maps/Arrays)

## Project Structure
```
src/
├── enums/           # Type-safe enumerations
├── utils/           # Helper utilities
├── models/          # Domain entities
├── states/          # State pattern implementations
├── strategies/      # Strategy pattern implementations
├── factories/       # Factory pattern implementations
├── database/        # In-memory database
├── repositories/    # Data access layer
├── services/        # Business logic
└── console/         # CLI interface
```

## Author
LLD Implementation - NoBroker System
