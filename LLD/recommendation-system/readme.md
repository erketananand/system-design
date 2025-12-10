# Recommendation System - LLD Implementation

## Quick Start
```bash
npm install
npm start
```

## Directory Structure
```
src/
├── enums/
├── utils/
├── models/
├── strategies/
├── database/
├── repositories/
├── services/
├── observers/
├── factories/
└── console/
```

## Features
- Generic, domain-agnostic recommendation engine
- Multiple recommendation strategies (Collaborative Filtering, Content-Based, Popularity-Based, Hybrid)
- Flexible user and item attribute system
- Real-time interaction tracking
- Similarity calculation with multiple metrics
- Recommendation caching
- Observer pattern for event-driven updates

## Architecture
- **Models Layer**: User, Item, Interaction, Recommendation
- **Repository Layer**: Data access abstraction
- **Strategy Layer**: Pluggable recommendation algorithms
- **Service Layer**: Business logic orchestration
- **Console Layer**: Interactive CLI interface

## Design Patterns
- Strategy Pattern (recommendation algorithms, similarity metrics)
- Singleton Pattern (database, recommendation engine)
- Observer Pattern (interaction events)
- Repository Pattern (data access)
- Factory Pattern (strategy and interaction creation)

## Technology Stack
- Node.js with TypeScript
- In-memory data storage
- Console-based interface