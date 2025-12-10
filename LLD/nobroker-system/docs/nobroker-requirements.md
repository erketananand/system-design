# NOBROKER - REQUIREMENTS DOCUMENT

## PROJECT SCOPE:

A comprehensive real estate broker-less platform that enables direct interaction between property owners and seekers without intermediary brokers. The system supports buying, selling, and renting various property types including PG (Paying Guest accommodations), Flats, Villas, and Land. Users can list properties with rich standardized details, search using advanced filters, chat to coordinate visits and negotiate, and manage their activity through saved searches and alerts.

***

## PRIMARY FEATURES (CORE/MVP):

### 1. User Management

- Register users as Property Owners, Property Seekers, or both.
- User authentication and basic profile management.
- Maintain user preferences (location, budget, property type, BHK/sharing, furnishing).
- Design user model so that additional account tiers or subscription capabilities can be added without breaking existing flows.


### 2. Property Listing Management

- Create property listings with detailed core attributes: property type (PG, Flat, Villa, Land), purpose (Sale, Rent, Both), location (city, area, locality), carpet/built-up area, price/rent, security deposit.
- Support standardized structure details:
    - For residential units: Apartment vs Standalone building.
    - Configuration: 1RK, 1BHK, 2RK, 2BHK, 3BHK, 4BHK, Studio, Duplex, etc.
    - PG capacity: Single/Double/Triple/4-sharing/5-sharing.
- Support furnishing and property condition: Fully-furnished, Semi-furnished, Unfurnished, property age, floor number, total floors, parking availability.
- Support amenity categories: basic (water, electricity, lift), safety (CCTV, security guard, gated community), comfort (balcony, modular kitchen, AC, geyser), connectivity (Wi‑Fi, nearby transport), and custom tags.
- Upload property images and basic documents (ownership proof placeholders).
- Edit, deactivate, or close listings; maintain listing status (Draft, Live, Paused, Under Discussion, Closed).
- Design listing structure so that monetization or subscription-based listing features (boost, highlight, premium visibility) can be added later.


### 3. Property Search \& Filtering

- Search properties by location hierarchy (city → area → locality), property type, listing purpose (buy/rent), and budget range.
- Advanced filters: BHK/room configuration (1RK–4BHK, PG sharing types), furnishing type, property type (Apartment/Standalone/PG/Villa/Land), area range, property age, floor, parking, and key amenities.
- Sort results by price, area, posted date, popularity, and relevance.
- View property details with owner contact option (contact reveal or chat entry point).
- Save favorite properties for quick access.


### 4. Saved Searches \& Alerts

- Allow users to save search criteria (location, budget, BHK, furnishing, property type, and key filters).
- Generate alerts for new properties matching saved criteria.
- Provide configurable alert channels (in-app notification as core; email/SMS can be added later) and frequency (instant, daily digest).
- Enable easy extension so that alerts can later depend on account tier or subscription benefits.


### 5. Chat-Based Interaction (Visits + Negotiation)

- Provide in-app chat between property owners and seekers for each listing.
- Through chat, users can coordinate and confirm property visit details (propose, accept, reschedule, cancel visit time slots) instead of a separate visit module.
- Support price negotiation in chat with structured actions such as “Propose Offer”, “Accept”, “Reject”, “Counter”, while keeping conversation history.
- Maintain conversation and negotiation state at listing–user pair level so that future features like automated suggestions, visit reminders, or payment links can be plugged in.

***

## SECONDARY FEATURES:

### 1. Account Tier \& Subscription Management

- Introduce two account tiers: **Standard Account** (free) and **Premium Account** (subscription-based).
- Example premium benefits: increased number of active listings, higher search result visibility, priority alerts, and chat/message priority.
- Support subscription lifecycle: activation, expiry, and upgrade/downgrade between Standard and Premium Accounts.
- Ensure this feature plugs into existing user, listing, search, and alert flows without changing their core contracts.


### 2. Reviews \& Ratings System

- Rate and review properties after visits or stay/tenure completion.
- Rate owners and seekers based on reliability, responsiveness, and behavior.
- Display average ratings and key review snippets on listings and profiles.
- Support reporting and moderating inappropriate reviews.


### 3. Property Comparison

- Compare 2–4 properties side by side.
- Show comparative metrics for price, effective rent, area, BHK/sharing type, furnishing, key amenities, and location.
- Allow users to save or share comparison sets for later reference.

***

## FUTURE ENHANCEMENTS:

### 1. Virtual Tour Integration

- 360-degree virtual property tours and pre-recorded walkthrough videos.
- Video call facility for remote viewing within the chat context.
- Interactive floor plans and AR-based furniture/layout visualization.


### 2. Document \& Identity Verification

- Verification of property ownership documents and KYC for owners and seekers.
- Integration with external or government systems for authenticity checks.
- Digital agreement generation and signing flows, potentially linked to subscription tiers.


### 3. AI-Powered Insights \& Recommendations

- Personalized property recommendations based on user behavior, preferences, and chat/offer history.
- Dynamic pricing suggestions and neighborhood insights (average rents, typical price per area).
- Investment and yield analysis recommendations for buyers and owners.

***

## KEY DESIGN NOTES:

### Design Decisions:

- **Broker-less, chat-first experience:** All coordination (queries, visit planning, negotiation) happens via a unified chat channel between owner and seeker.
- **Rich, standardized listing metadata:** Strongly typed property attributes (BHK, PG sharing type, furnishing, amenities) as enums and value objects to ensure consistent filtering and comparison.
- **Extensible tiering model:** User and listing models are designed to attach tier/benefit information later (Standard vs Premium Accounts) without changing the core behavior.
- **Workflow states in domain layer:** Listing lifecycle and conversation/offer status are handled via state machines to keep transitions predictable and auditable.
- **Offline transaction assumption:** Financial payments and legal/registry transactions are considered out of scope and done offline; system focuses on discovery, coordination, and negotiation.


### Constraints \& Assumptions:

- Users must be registered to list properties, start chats, or save searches.
- A user can be both owner and seeker at the same time.
- Each listing can have multiple parallel chats with different seekers, but only one final “closed” outcome per listing (sold/rented).
- Visit and negotiation details are coordinated via chat; no separate transaction processing module is maintained.
- Transactional money flow, agreement execution, and government registration happen offline and are not modeled as first-class entities.


### Domain Entities:

- **User** (roles: Owner, Seeker; tiers: Standard Account, Premium Account as extendable concept).
- **Property** (types: PG, Flat, Villa, Land; structure: Apartment/Standalone; configuration: BHK/room/PG-sharing).
- **PropertyListing** (status-driven listing wrapper including pricing, purpose, visibility).
- **ChatThread** (owner–seeker conversation per listing).
- **VisitIntent / VisitSlot** (logical representation of visit proposals within chat context).
- **Offer** (structured offers negotiated in chat with states).
- **SearchCriteria** (saved search definitions powering alerts).
- **Alert** (notification instances for matching properties).
- **Review** (feedback on properties and users).

***

## IMPLEMENTATION DETAILS:

- **Technology:** Node.js with TypeScript.
- **Interface:** Console-based dynamic input using readline (menu-driven flows for user registration, listing, search, chat simulation, and saved searches).
- **Storage:** In-memory data layer using Maps and Arrays representing users, properties, listings, chats, offers, searches, and alerts.
- **Architecture:** Layered design – Models → Repositories → Services → Controller (MainController) → Console interface.
- **Patterns (planned):**
    - Singleton (InMemoryDatabase, MainController).
    - Factory (Property and Listing creation based on type/configuration).
    - State (Listing status, Offer/Negotiation status).
    - Strategy (Search ranking, alert prioritization).
    - Observer (Saved Searches \& Alerts notification pipeline).
    - Builder (complex Property and SearchCriteria construction).