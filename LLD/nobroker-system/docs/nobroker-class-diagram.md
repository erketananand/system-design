# NoBroker System - Complete Class Diagram

This diagram represents the complete architecture of the NoBroker Real Estate Platform with proper UML relationships.

## Design Patterns Used
1. **Singleton Pattern**: InMemoryDatabase, MainController
2. **Repository Pattern**: IRepository interface with 12 implementations
3. **Factory Pattern**: PropertyFactory, ListingFactory for creating properties and listings
4. **State Pattern**: IListingState with 4 listing states (Draft, Live, Paused, Closed)
5. **Strategy Pattern**: ISearchStrategy with 3 sorting strategies
6. **Observer Pattern**: SavedSearchAlert system for notifying users

```mermaid
classDiagram
    %% ============================================
    %% ENUMS
    %% ============================================
    class UserRole {
        <<enumeration>>
        OWNER
        SEEKER
    }

    class AccountTier {
        <<enumeration>>
        STANDARD
        PREMIUM
    }

    class PropertyType {
        <<enumeration>>
        PG
        FLAT
        VILLA
        LAND
    }

    class ListingStatus {
        <<enumeration>>
        DRAFT
        LIVE
        PAUSED
        CLOSED
        UNDER_DISCUSSION
    }

    class ListingPurpose {
        <<enumeration>>
        SALE
        RENT
        BOTH
    }

    class ListingVisibility {
        <<enumeration>>
        NORMAL
        FEATURED
        PREMIUM
    }

    class FurnishingType {
        <<enumeration>>
        FULLY_FURNISHED
        SEMI_FURNISHED
        UNFURNISHED
    }

    class PropertyConfiguration {
        <<enumeration>>
        BHK_1
        BHK_2
        BHK_3
        BHK_4_PLUS
    }

    class MessageType {
        <<enumeration>>
        TEXT
        VISIT_PROPOSAL
        OFFER
        SYSTEM
    }

    class VisitStatus {
        <<enumeration>>
        PROPOSED
        ACCEPTED
        DECLINED
        COMPLETED
        CANCELLED
    }

    class OfferStatus {
        <<enumeration>>
        PENDING
        ACCEPTED
        REJECTED
        COUNTERED
        EXPIRED
    }

    class AlertChannel {
        <<enumeration>>
        IN_APP
        EMAIL
        SMS
    }

    class AlertFrequency {
        <<enumeration>>
        INSTANT
        DAILY
        WEEKLY
    }

    %% ============================================
    %% CORE MODELS
    %% ============================================
    class User {
        +String id
        +String name
        +String email
        +String phone
        +String passwordHash
        +UserRole[] roles
        +AccountTier accountTier
        +UserPreference preferences
        +Date createdAt
        +Date updatedAt
        +updateProfile(name, phone) void
        +setPreferences(prefs) void
        +isOwner() boolean
        +isSeeker() boolean
        +addRole(role) void
        +upgradeTier(newTier) void
        +isPremium() boolean
    }

    class UserPreference {
        +String userId
        +String[] preferredLocations
        +PropertyType[] preferredPropertyTypes
        +number minBudget
        +number maxBudget
        +FurnishingType[] preferredFurnishing
        +updatePreferences(prefs) void
    }

    class Property {
        +String id
        +String ownerId
        +String title
        +String description
        +PropertyType propertyType
        +StructureType structureType
        +PropertyConfiguration configuration
        +PgSharingType pgSharingType
        +number carpetAreaSqFt
        +number builtUpAreaSqFt
        +Address address
        +FurnishingType furnishingType
        +number propertyAgeYears
        +number floorNumber
        +number totalFloors
        +boolean parkingAvailable
        +Amenity[] amenities
        +Date createdAt
        +Date updatedAt
        +addAmenity(amenity) void
        +removeAmenity(amenity) void
        +isAmenityAvailable(amenity) boolean
        +setAreaDetails(carpetArea, builtUpArea) void
        +setFloorDetails(floorNumber, totalFloors) void
        +isPG() boolean
        +isFlat() boolean
    }

    class Address {
        +String id
        +String city
        +String area
        +String locality
        +String landmark
        +number latitude
        +number longitude
        +Date createdAt
        +getFullAddress() String
        +matchesLocation(location) boolean
        +hasGeoCoordinates() boolean
    }

    class PropertyListing {
        +String id
        +String propertyId
        +String ownerId
        +ListingPurpose listingPurpose
        +number basePrice
        +number expectedRent
        +number securityDeposit
        +ListingStatus listingStatus
        +ListingVisibility visibilityLevel
        +boolean isContactVisible
        +Date postedAt
        +Date createdAt
        +Date updatedAt
        +publish() void
        +pause() void
        +close() void
        +markUnderDiscussion() void
        +updatePrice(newBasePrice, newRent) void
        +boostVisibility(level) void
        +isLive() boolean
        +isDraft() boolean
        +isClosed() boolean
    }

    class SearchCriteria {
        +String id
        +String userId
        +String name
        +String[] locations
        +number minBudget
        +number maxBudget
        +PropertyType[] propertyTypes
        +PropertyConfiguration[] configurations
        +FurnishingType[] furnishingTypes
        +Date createdAt
        +Date updatedAt
        +matchesListing(listing, property) boolean
        +updateCriteria(updates) void
    }

    class SavedSearchAlert {
        +String id
        +String searchCriteriaId
        +String userId
        +AlertChannel channel
        +AlertFrequency frequency
        +boolean active
        +Date lastTriggeredAt
        +Date createdAt
        +activate() void
        +deactivate() void
        +updateLastTriggered() void
    }

    class ChatThread {
        +String id
        +String listingId
        +String ownerId
        +String seekerId
        +boolean active
        +Date lastActivityAt
        +Date createdAt
        +updateActivity() void
        +closeThread() void
        +reopenThread() void
        +isParticipant(userId) boolean
    }

    class ChatMessage {
        +String id
        +String threadId
        +String senderId
        +MessageType messageType
        +String content
        +Date sentAt
        +boolean isRead
        +markAsRead() void
        +isFromSender(userId) boolean
    }

    class VisitSlot {
        +String id
        +String threadId
        +String proposedBy
        +Date proposedDateTime
        +VisitStatus status
        +Date createdAt
        +accept() void
        +decline() void
        +complete() void
        +cancel() void
        +isPending() boolean
        +isAccepted() boolean
    }

    class Offer {
        +String id
        +String threadId
        +String listingId
        +String offeredById
        +String offeredToId
        +number amount
        +OfferStatus status
        +String counterOfferId
        +Date expiresAt
        +Date createdAt
        +accept() void
        +reject() void
        +markCountered(counterOfferId) void
        +expire() void
        +isPending() boolean
        +isAccepted() boolean
        +hasExpired() boolean
    }

    class Review {
        +String id
        +String reviewerId
        +String revieweeUserId
        +String propertyId
        +number rating
        +String title
        +String comment
        +boolean flagged
        +Date createdAt
        +flag() void
        +unflag() void
        +isPropertyReview() boolean
        +isUserReview() boolean
    }

    %% ============================================
    %% SERVICES
    %% ============================================
    class UserService {
        -UserRepository userRepository
        +registerUser(name, email, phone, password, roles) User
        +authenticate(email, password) User
        +getUserById(id) User
        +getUserByEmail(email) User
        +updateUserProfile(userId, updates) void
        +upgradeTier(userId, tier) void
        +addUserRole(userId, role) void
    }

    class PropertyService {
        -PropertyRepository propertyRepository
        -AddressRepository addressRepository
        +createProperty(propertyData) Property
        +getPropertyById(id) Property
        +getOwnerProperties(ownerId) Property[]
        +updateProperty(propertyId, updates) void
        +deleteProperty(propertyId) void
        +addAmenity(propertyId, amenity) void
    }

    class PropertyListingService {
        -PropertyListingRepository listingRepository
        -PropertyRepository propertyRepository
        +createListing(listingData) PropertyListing
        +getListingById(id) PropertyListing
        +getOwnerListings(ownerId) PropertyListing[]
        +getLiveListings() PropertyListing[]
        +publishListing(listingId) void
        +pauseListing(listingId) void
        +closeListing(listingId) void
        +updatePrice(listingId, basePrice, rent) void
        +boostVisibility(listingId, level) void
    }

    class SearchService {
        -PropertyListingRepository listingRepository
        -PropertyRepository propertyRepository
        -SearchCriteriaRepository searchCriteriaRepository
        +search(criteria, strategy) PropertyListing[]
        +createSearchCriteria(userId, name, locations, minBudget, maxBudget) SearchCriteria
        +getUserSavedSearches(userId) SearchCriteria[]
        +updateSearchCriteria(criteriaId, updates) void
        +deleteSearchCriteria(criteriaId) void
    }

    class AlertService {
        -SavedSearchAlertRepository alertRepository
        -SearchCriteriaRepository searchCriteriaRepository
        +createAlert(searchCriteriaId, userId, channel, frequency) SavedSearchAlert
        +getUserAlerts(userId) SavedSearchAlert[]
        +deactivateAlert(alertId) void
        +triggerAlert(alertId) void
        +checkAndNotifyAlerts() void
    }

    class ChatService {
        -ChatThreadRepository threadRepository
        -ChatMessageRepository messageRepository
        +getOrCreateThread(listingId, ownerId, seekerId) ChatThread
        +getThreadById(threadId) ChatThread
        +getUserThreads(userId) ChatThread[]
        +sendTextMessage(threadId, senderId, content) ChatMessage
        +getThreadMessages(threadId) ChatMessage[]
        +markMessageAsRead(messageId) void
        +closeThread(threadId) void
    }

    class VisitService {
        -VisitSlotRepository visitRepository
        -ChatThreadRepository threadRepository
        +proposeVisit(threadId, proposedBy, dateTime) VisitSlot
        +acceptVisit(visitId) void
        +declineVisit(visitId) void
        +completeVisit(visitId) void
        +cancelVisit(visitId) void
        +getThreadVisits(threadId) VisitSlot[]
        +getUserVisits(userId) VisitSlot[]
    }

    class OfferService {
        -OfferRepository offerRepository
        -ChatThreadRepository threadRepository
        +createOffer(threadId, listingId, offeredById, amount) Offer
        +acceptOffer(offerId) void
        +rejectOffer(offerId) void
        +counterOffer(offerId, newAmount) Offer
        +getThreadOffers(threadId) Offer[]
        +getUserOffers(userId) Offer[]
    }

    class ReviewService {
        -ReviewRepository reviewRepository
        +createReview(reviewData) Review
        +getPropertyReviews(propertyId) Review[]
        +getUserReviews(userId) Review[]
        +getReviewById(reviewId) Review
        +flagReview(reviewId) void
        +calculateAverageRating(targetId) number
    }

    class MainController {
        <<Singleton>>
        -static MainController instance
        +UserService userService
        +PropertyService propertyService
        +PropertyListingService listingService
        +SearchService searchService
        +AlertService alertService
        +ChatService chatService
        +VisitService visitService
        +OfferService offerService
        +ReviewService reviewService
        +static getInstance() MainController
        +printDatabaseStats() void
    }

    %% ============================================
    %% REPOSITORIES
    %% ============================================
    class IRepository~T~ {
        <<interface>>
        +findById(id: String) T
        +findAll() T[]
        +save(entity: T) T
        +delete(id: String) boolean
        +exists(id: String) boolean
        +count() number
        +clear() void
    }

    class UserRepository {
        -InMemoryDatabase db
        +findByEmail(email: String) User
        +findByRole(role: UserRole) User[]
    }

    class PropertyRepository {
        -InMemoryDatabase db
        +findByOwnerId(ownerId: String) Property[]
        +findByType(type: PropertyType) Property[]
    }

    class AddressRepository {
        -InMemoryDatabase db
        +findByCity(city: String) Address[]
    }

    class PropertyListingRepository {
        -InMemoryDatabase db
        +findByOwnerId(ownerId: String) PropertyListing[]
        +findByStatus(status: ListingStatus) PropertyListing[]
        +findLiveListings() PropertyListing[]
    }

    class SearchCriteriaRepository {
        -InMemoryDatabase db
        +findByUserId(userId: String) SearchCriteria[]
    }

    class SavedSearchAlertRepository {
        -InMemoryDatabase db
        +findByUserId(userId: String) SavedSearchAlert[]
        +findActiveAlerts() SavedSearchAlert[]
    }

    class ChatThreadRepository {
        -InMemoryDatabase db
        +findByUserId(userId: String) ChatThread[]
        +findByListing(listingId: String) ChatThread[]
    }

    class ChatMessageRepository {
        -InMemoryDatabase db
        +findByThreadId(threadId: String) ChatMessage[]
    }

    class VisitSlotRepository {
        -InMemoryDatabase db
        +findByThreadId(threadId: String) VisitSlot[]
        +findByUser(userId: String) VisitSlot[]
    }

    class OfferRepository {
        -InMemoryDatabase db
        +findByThreadId(threadId: String) Offer[]
        +findByUser(userId: String) Offer[]
    }

    class ReviewRepository {
        -InMemoryDatabase db
        +findByPropertyId(propertyId: String) Review[]
        +findByUserId(userId: String) Review[]
    }

    %% ============================================
    %% DATABASE (SINGLETON)
    %% ============================================
    class InMemoryDatabase {
        <<Singleton>>
        -static InMemoryDatabase instance
        +Map~String, User~ users
        +Map~String, Property~ properties
        +Map~String, Address~ addresses
        +Map~String, PropertyListing~ propertyListings
        +Map~String, ChatThread~ chatThreads
        +Map~String, ChatMessage~ chatMessages
        +Map~String, VisitSlot~ visitSlots
        +Map~String, Offer~ offers
        +Map~String, SearchCriteria~ searchCriteria
        +Map~String, SavedSearchAlert~ savedSearchAlerts
        +Map~String, Review~ reviews
        +static getInstance() InMemoryDatabase
        +clearAll() void
        +getStats() Object
        +printStats() void
    }

    %% ============================================
    %% STATE PATTERN
    %% ============================================
    class IListingState {
        <<interface>>
        +publish(listing) void
        +pause(listing) void
        +close(listing) void
        +markUnderDiscussion(listing) void
        +getStateName() String
    }

    class DraftState {
        +publish(listing) void
        +pause(listing) void
        +close(listing) void
        +markUnderDiscussion(listing) void
        +getStateName() String
    }

    class LiveState {
        +publish(listing) void
        +pause(listing) void
        +close(listing) void
        +markUnderDiscussion(listing) void
        +getStateName() String
    }

    class PausedState {
        +publish(listing) void
        +pause(listing) void
        +close(listing) void
        +markUnderDiscussion(listing) void
        +getStateName() String
    }

    class ClosedState {
        +publish(listing) void
        +pause(listing) void
        +close(listing) void
        +markUnderDiscussion(listing) void
        +getStateName() String
    }

    %% ============================================
    %% STRATEGY PATTERN
    %% ============================================
    class ISearchStrategy {
        <<interface>>
        +sort(listings: PropertyListing[]) PropertyListing[]
        +getStrategyName() String
    }

    class PriceSortStrategy {
        -boolean ascending
        +sort(listings: PropertyListing[]) PropertyListing[]
        +getStrategyName() String
    }

    class DateSortStrategy {
        -boolean newestFirst
        +sort(listings: PropertyListing[]) PropertyListing[]
        +getStrategyName() String
    }

    class RelevanceSortStrategy {
        +sort(listings: PropertyListing[]) PropertyListing[]
        +getStrategyName() String
    }

    %% ============================================
    %% FACTORY PATTERN
    %% ============================================
    class PropertyFactory {
        <<Factory>>
        +static createPG(ownerId, title, address, sharingType) Property
        +static createFlat(ownerId, title, address, configuration) Property
        +static createVilla(ownerId, title, address, configuration) Property
        +static createLand(ownerId, title, address, areaDetails) Property
    }

    class ListingFactory {
        <<Factory>>
        +static createSaleListing(propertyId, ownerId, basePrice) PropertyListing
        +static createRentListing(propertyId, ownerId, rent, deposit) PropertyListing
        +static createBothListing(propertyId, ownerId, basePrice, rent, deposit) PropertyListing
    }

    %% ============================================
    %% RELATIONSHIPS - ENUMS TO MODELS
    %% ============================================
    User --> UserRole : uses
    User --> AccountTier : uses
    Property --> PropertyType : uses
    Property --> FurnishingType : uses
    Property --> PropertyConfiguration : uses
    PropertyListing --> ListingStatus : uses
    PropertyListing --> ListingPurpose : uses
    PropertyListing --> ListingVisibility : uses
    ChatMessage --> MessageType : uses
    VisitSlot --> VisitStatus : uses
    Offer --> OfferStatus : uses
    SavedSearchAlert --> AlertChannel : uses
    SavedSearchAlert --> AlertFrequency : uses

    %% ============================================
    %% RELATIONSHIPS - COMPOSITION (*--)
    %% User owns UserPreference (lifecycle dependent)
    %% Property owns Address (lifecycle dependent)
    %% ============================================
    User *-- UserPreference : composition
    Property *-- Address : composition

    %% ============================================
    %% RELATIONSHIPS - AGGREGATION (o--)
    %% PropertyListing aggregates Property
    %% ChatThread aggregates PropertyListing
    %% ============================================
    PropertyListing o-- Property : aggregation
    ChatThread o-- PropertyListing : aggregation

    %% ============================================
    %% RELATIONSHIPS - ASSOCIATION (-->)
    %% Simple references between entities
    %% ============================================
    Property --> User : owner
    PropertyListing --> User : owner
    PropertyListing --> Property : property
    SearchCriteria --> User : user
    SavedSearchAlert --> SearchCriteria : searchCriteria
    SavedSearchAlert --> User : user
    ChatThread --> PropertyListing : listing
    ChatThread --> User : owner
    ChatThread --> User : seeker
    ChatMessage --> ChatThread : thread
    ChatMessage --> User : sender
    VisitSlot --> ChatThread : thread
    VisitSlot --> User : proposedBy
    Offer --> ChatThread : thread
    Offer --> PropertyListing : listing
    Offer --> User : offeredBy
    Offer --> User : offeredTo
    Review --> User : reviewer
    Review --> User : reviewee
    Review --> Property : property

    %% ============================================
    %% RELATIONSHIPS - SERVICES TO REPOSITORIES
    %% ============================================
    UserService --> UserRepository : uses
    UserService ..> User : creates/manages

    PropertyService --> PropertyRepository : uses
    PropertyService --> AddressRepository : uses
    PropertyService ..> Property : creates/manages

    PropertyListingService --> PropertyListingRepository : uses
    PropertyListingService --> PropertyRepository : uses
    PropertyListingService ..> PropertyListing : creates/manages

    SearchService --> PropertyListingRepository : uses
    SearchService --> PropertyRepository : uses
    SearchService --> SearchCriteriaRepository : uses
    SearchService --> ISearchStrategy : uses
    SearchService ..> SearchCriteria : creates/manages

    AlertService --> SavedSearchAlertRepository : uses
    AlertService --> SearchCriteriaRepository : uses
    AlertService ..> SavedSearchAlert : creates/manages

    ChatService --> ChatThreadRepository : uses
    ChatService --> ChatMessageRepository : uses
    ChatService ..> ChatThread : creates/manages
    ChatService ..> ChatMessage : creates

    VisitService --> VisitSlotRepository : uses
    VisitService --> ChatThreadRepository : uses
    VisitService ..> VisitSlot : creates/manages

    OfferService --> OfferRepository : uses
    OfferService --> ChatThreadRepository : uses
    OfferService ..> Offer : creates/manages

    ReviewService --> ReviewRepository : uses
    ReviewService ..> Review : creates/manages

    MainController --> UserService : aggregates
    MainController --> PropertyService : aggregates
    MainController --> PropertyListingService : aggregates
    MainController --> SearchService : aggregates
    MainController --> AlertService : aggregates
    MainController --> ChatService : aggregates
    MainController --> VisitService : aggregates
    MainController --> OfferService : aggregates
    MainController --> ReviewService : aggregates

    %% ============================================
    %% RELATIONSHIPS - REPOSITORY IMPLEMENTATIONS
    %% ============================================
    UserRepository ..|> IRepository : implements
    PropertyRepository ..|> IRepository : implements
    AddressRepository ..|> IRepository : implements
    PropertyListingRepository ..|> IRepository : implements
    SearchCriteriaRepository ..|> IRepository : implements
    SavedSearchAlertRepository ..|> IRepository : implements
    ChatThreadRepository ..|> IRepository : implements
    ChatMessageRepository ..|> IRepository : implements
    VisitSlotRepository ..|> IRepository : implements
    OfferRepository ..|> IRepository : implements
    ReviewRepository ..|> IRepository : implements

    %% ============================================
    %% RELATIONSHIPS - REPOSITORIES TO DATABASE
    %% ============================================
    UserRepository --> InMemoryDatabase : uses
    PropertyRepository --> InMemoryDatabase : uses
    AddressRepository --> InMemoryDatabase : uses
    PropertyListingRepository --> InMemoryDatabase : uses
    SearchCriteriaRepository --> InMemoryDatabase : uses
    SavedSearchAlertRepository --> InMemoryDatabase : uses
    ChatThreadRepository --> InMemoryDatabase : uses
    ChatMessageRepository --> InMemoryDatabase : uses
    VisitSlotRepository --> InMemoryDatabase : uses
    OfferRepository --> InMemoryDatabase : uses
    ReviewRepository --> InMemoryDatabase : uses

    %% ============================================
    %% RELATIONSHIPS - STATE PATTERN
    %% ============================================
    DraftState ..|> IListingState : implements
    LiveState ..|> IListingState : implements
    PausedState ..|> IListingState : implements
    ClosedState ..|> IListingState : implements
    PropertyListing --> IListingState : uses

    %% ============================================
    %% RELATIONSHIPS - STRATEGY PATTERN
    %% ============================================
    PriceSortStrategy ..|> ISearchStrategy : implements
    DateSortStrategy ..|> ISearchStrategy : implements
    RelevanceSortStrategy ..|> ISearchStrategy : implements

    %% ============================================
    %% RELATIONSHIPS - FACTORY PATTERN
    %% ============================================
    PropertyFactory ..> Property : creates
    ListingFactory ..> PropertyListing : creates
```

## UML Relationship Types Explained

### 1. Composition (*--)
**Meaning**: Strong ownership - child cannot exist without parent
- **User *-- UserPreference**: UserPreference belongs to User, destroyed when User is deleted
- **Property *-- Address**: Address is part of Property, removed when Property is deleted

### 2. Aggregation (o--)
**Meaning**: Weak ownership - child can exist independently
- **PropertyListing o-- Property**: PropertyListing references Property, but Property exists independently
- **ChatThread o-- PropertyListing**: ChatThread references PropertyListing, but listing can exist without thread

### 3. Association (-->)
**Meaning**: Simple relationship or reference
- **Property --> User**: Property references its owner
- **PropertyListing --> User**: Listing references owner
- **ChatThread --> User**: Thread references owner and seeker
- **Offer --> User**: Offer references offeredBy and offeredTo users

### 4. Dependency (..>)
**Meaning**: One class uses another (creates, manages, or depends on)
- **UserService ..> User**: Service creates and manages User instances
- **PropertyFactory ..> Property**: Factory creates Property instances
- **SearchService ..> SearchCriteria**: Service manages SearchCriteria

### 5. Implementation (..|>)
**Meaning**: Class implements an interface
- **UserRepository ..|> IRepository**: Implements repository interface
- **DraftState ..|> IListingState**: Implements listing state interface
- **PriceSortStrategy ..|> ISearchStrategy**: Implements search strategy

## Architecture Layers

### Presentation Layer
- ConsoleInterface (command-line interface)

### Controller Layer
- MainController (Singleton - orchestrates all services)

### Service Layer (9 Services)
- UserService
- PropertyService
- PropertyListingService
- SearchService
- AlertService
- ChatService
- VisitService
- OfferService
- ReviewService

### Repository Layer (11 Repositories + Interface)
- IRepository<T> (interface)
- UserRepository
- PropertyRepository
- AddressRepository
- PropertyListingRepository
- SearchCriteriaRepository
- SavedSearchAlertRepository
- ChatThreadRepository
- ChatMessageRepository
- VisitSlotRepository
- OfferRepository
- ReviewRepository

### Model Layer (14 Core Models)
- User, UserPreference
- Property, Address
- PropertyListing
- SearchCriteria, SavedSearchAlert
- ChatThread, ChatMessage
- VisitSlot, Offer
- Review

### Data Layer
- InMemoryDatabase (Singleton)

### Pattern Layer
- **Factory**: PropertyFactory, ListingFactory
- **State**: IListingState + 4 implementations
- **Strategy**: ISearchStrategy + 3 implementations

## Design Pattern Details

### 1. Singleton Pattern
**Classes**: InMemoryDatabase, MainController
**Purpose**: Ensure single instance across application
**Benefits**: 
- Centralized data storage
- Single point of control
- Consistent state management

### 2. Repository Pattern
**Classes**: IRepository<T> interface + 11 implementations
**Purpose**: Abstract data access layer
**Benefits**:
- Clean separation of concerns
- Easy to swap data sources
- Testable code
- Consistent CRUD operations

### 3. Factory Pattern
**Classes**: PropertyFactory, ListingFactory
**Purpose**: Centralize object creation logic
**Methods**:
- PropertyFactory:
  - createPG(): Creates PG properties
  - createFlat(): Creates flat properties
  - createVilla(): Creates villa properties
  - createLand(): Creates land properties
- ListingFactory:
  - createSaleListing(): Creates sale listings
  - createRentListing(): Creates rental listings
  - createBothListing(): Creates sale + rent listings

### 4. State Pattern
**Interface**: IListingState
**Implementations**:
- DraftState
- LiveState
- PausedState
- ClosedState
**Purpose**: Manage listing lifecycle transitions
**Benefits**:
- Clear state transitions
- State-specific behavior
- Eliminates complex conditionals

### 5. Strategy Pattern
**Interface**: ISearchStrategy
**Implementations**:
- PriceSortStrategy (low to high / high to low)
- DateSortStrategy (newest first / oldest first)
- RelevanceSortStrategy (premium listings first)
**Purpose**: Pluggable sorting algorithms
**Benefits**:
- Easy to add new sorting methods
- Swap algorithms at runtime
- Open/Closed Principle

### 6. Observer Pattern
**Implementation**: SavedSearchAlert system
**Purpose**: Notify users when new listings match their saved searches
**Components**:
- SavedSearchAlert (Observer)
- AlertService (Subject)
- PropertyListingService (triggers notifications)
**Benefits**:
- Decoupled notification system
- Multiple notification channels (in-app, email, SMS)
- Flexible frequency (instant, daily, weekly)

## Key Features

### User Management
- Dual roles (Owner/Seeker)
- Account tiers (Standard/Premium)
- User preferences
- Profile management

### Property Management
- Multiple property types (PG, Flat, Villa, Land)
- Detailed specifications (area, floors, amenities)
- Address with geo-coordinates
- Furnishing types

### Listing Management
- Multiple purposes (Sale, Rent, Both)
- State-based lifecycle (Draft → Live → Paused/Closed)
- Visibility levels (Normal, Featured, Premium)
- Price management

### Search & Discovery
- Advanced search criteria
- Multiple sorting strategies
- Saved searches
- Alert system with multiple channels

### Communication
- Chat threads between owners and seekers
- Visit proposals and scheduling
- Offer negotiation
- Message history

### Reviews & Ratings
- Property reviews
- User reviews
- Rating system (1-5 stars)
- Flagging mechanism

## Business Flows

### Property Listing Flow
1. Owner creates Property with details
2. Owner creates PropertyListing for Property
3. Listing starts in DraftState
4. Owner publishes → transitions to LiveState
5. Seekers can search and view listing
6. Can pause (PausedState) or close (ClosedState)

### Search & Alert Flow
1. Seeker creates SearchCriteria
2. Seeker saves search
3. Seeker creates SavedSearchAlert
4. When new listings match criteria
5. AlertService triggers notifications
6. Seeker receives alerts via chosen channel

### Communication Flow
1. Seeker finds interesting listing
2. ChatService creates ChatThread
3. Parties exchange ChatMessages
4. Seeker proposes VisitSlot
5. Owner accepts/declines visit
6. Seeker makes Offer
7. Owner accepts/rejects/counters offer

### Review Flow
1. After visit/transaction completed
2. User creates Review (property or user)
3. Review includes rating (1-5) and comment
4. Reviews visible to other users
5. Average ratings calculated

## Key Statistics

- **Total Classes**: 60+
- **Models**: 14 core domain models
- **Services**: 9 service classes
- **Repositories**: 11 + 1 interface
- **Design Patterns**: 6 patterns
- **State Implementations**: 4
- **Strategy Implementations**: 3
- **Enums**: 13
- **Singletons**: 2

## Relationship Summary

| Relationship Type | Count | Usage |
|------------------|-------|-------|
| Composition (*--) | 2 | Strong ownership |
| Aggregation (o--) | 2 | Weak ownership |
| Association (-->) | 25+ | References |
| Dependency (..>) | 15+ | Usage/Creation |
| Implementation (..\|>) | 18 | Interface implementation |

## Platform Benefits

### For Property Owners
- Direct reach to seekers
- No broker commission
- Multiple listing visibility options
- Premium features for better exposure
- Integrated chat and negotiation

### For Property Seekers
- Extensive property database
- Advanced search filters
- Saved searches with alerts
- Direct communication with owners
- Visit scheduling and offers
- Transparent reviews

### Platform Features
- Zero broker fees
- Verified listings
- Multiple property types
- Real-time notifications
- In-app negotiations
- Review system for trust

