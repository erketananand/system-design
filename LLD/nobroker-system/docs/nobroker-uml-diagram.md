# NOBROKER - Class Diagram

## Core Domain Classes

### User
- id: string  
- name: string  
- email: string  
- phone: string  
- roles: UserRole[]  
- accountTier: AccountTier  
- preferences: UserPreference | null  
- createdAt: Date  
- updatedAt: Date  

**Methods:**  
- updateProfile(name: string, phone: string): void  
- setPreferences(prefs: UserPreference): void  
- isOwner(): boolean  
- isSeeker(): boolean  
- upgradeTier(newTier: AccountTier): void  

---

### UserPreference
- preferredLocations: string[]  
- minBudget: number | null  
- maxBudget: number | null  
- preferredPropertyTypes: PropertyType[]  
- preferredConfigurations: PropertyConfiguration[]  
- preferredFurnishingTypes: FurnishingType[]  

**Methods:**  
- matchesListing(listing: PropertyListing): boolean  

---

### Property
- id: string  
- title: string  
- description: string  
- propertyType: PropertyType  // PG, FLAT, VILLA, LAND  
- structureType: StructureType // APARTMENT, STANDALONE, PG_HOUSE  
- configuration: PropertyConfiguration | null // 1RK, 1BHK, 2BHK, etc.  
- pgSharingType: PgSharingType | null // SINGLE, DOUBLE, TRIPLE, etc.  
- carpetAreaSqFt: number | null  
- builtUpAreaSqFt: number | null  
- address: Address  
- furnishingType: FurnishingType  
- propertyAgeYears: number | null  
- floorNumber: number | null  
- totalFloors: number | null  
- parkingAvailable: boolean  
- amenities: Amenity[]  

**Methods:**  
- addAmenity(amenity: Amenity): void  
- removeAmenity(amenity: Amenity): void  
- isAmenityAvailable(amenity: Amenity): boolean  

---

### Address
- id: string  
- city: string  
- area: string  
- locality: string  
- landmark: string | null  
- latitude: number | null  
- longitude: number | null  

**Methods:**  
- getFullAddress(): string  

---

### PropertyListing
- id: string  
- property: Property  
- owner: User  
- listingPurpose: ListingPurpose // SALE, RENT, BOTH  
- basePrice: number  
- expectedRent: number | null  
- securityDeposit: number | null  
- listingStatus: ListingStatus  
- visibilityLevel: ListingVisibility // NORMAL, BOOSTED, PREMIUM  
- postedAt: Date  
- updatedAt: Date  
- isContactVisible: boolean  

**Methods:**  
- publish(): void  
- pause(): void  
- close(): void  
- markUnderDiscussion(): void  
- updatePrice(newBasePrice: number, newRent?: number): void  
- canChat(user: User): boolean  

---

### ChatThread
- id: string  
- listing: PropertyListing  
- owner: User  
- seeker: User  
- messages: ChatMessage[]  
- active: boolean  
- lastActivityAt: Date  

**Methods:**  
- sendMessage(sender: User, content: string): ChatMessage  
- proposeVisit(sender: User, slot: VisitSlot): void  
- proposeOffer(sender: User, offer: Offer): void  
- closeThread(): void  

---

### ChatMessage
- id: string  
- thread: ChatThread  
- sender: User  
- content: string  
- messageType: MessageType // TEXT, VISIT_PROPOSAL, OFFER_PROPOSAL, SYSTEM  
- createdAt: Date  

**Methods:**  
- isSystemMessage(): boolean  

---

### VisitSlot
- id: string  
- proposedBy: User  
- proposedFor: Date  
- status: VisitStatus // PROPOSED, ACCEPTED, REJECTED, CANCELLED  
- respondedBy: User | null  
- respondedAt: Date | null  

**Methods:**  
- accept(user: User): void  
- reject(user: User): void  
- cancel(user: User): void  

---

### Offer
- id: string  
- thread: ChatThread  
- listing: PropertyListing  
- offeredBy: User  
- offeredTo: User  
- amount: number  
- createdAt: Date  
- expiresAt: Date | null  
- status: OfferStatus // PENDING, ACCEPTED, REJECTED, COUNTERED, EXPIRED  
- counterOfferId: string | null  

**Methods:**  
- accept(user: User): void  
- reject(user: User): void  
- counter(user: User, newAmount: number): Offer  
- expire(): void  

---

### SearchCriteria
- id: string  
- user: User  
- name: string  
- locations: string[]  
- minBudget: number | null  
- maxBudget: number | null  
- propertyTypes: PropertyType[]  
- configurations: PropertyConfiguration[]  
- furnishingTypes: FurnishingType[]  
- listingPurposes: ListingPurpose[]  
- requiredAmenities: Amenity[]  

**Methods:**  
- matchesListing(listing: PropertyListing): boolean  

---

### SavedSearchAlert
- id: string  
- searchCriteria: SearchCriteria  
- user: User  
- channel: AlertChannel // IN_APP, EMAIL, SMS  
- frequency: AlertFrequency // INSTANT, DAILY  
- lastNotifiedAt: Date | null  
- active: boolean  

**Methods:**  
- notify(listings: PropertyListing[]): void  
- deactivate(): void  

---

### Review
- id: string  
- reviewer: User  
- revieweeUser: User | null  
- property: Property | null  
- rating: number  // 1–5  
- title: string  
- comment: string  
- createdAt: Date  
- flagged: boolean  

**Methods:**  
- flag(): void  

---

## Supporting Enums & Value Types

### Enums
- **UserRole:** OWNER, SEEKER  
- **AccountTier:** STANDARD, PREMIUM  
- **PropertyType:** PG, FLAT, VILLA, LAND  
- **StructureType:** APARTMENT, STANDALONE, PG_HOUSE  
- **PropertyConfiguration:** STUDIO, RK1, BHK1, BHK2, BHK3, BHK4, DUPLEX, OTHER  
- **PgSharingType:** SINGLE, DOUBLE, TRIPLE, FOUR_SHARING, FIVE_SHARING  
- **FurnishingType:** FULLY_FURNISHED, SEMI_FURNISHED, UNFURNISHED  
- **ListingPurpose:** SALE, RENT, BOTH  
- **ListingStatus:** DRAFT, LIVE, PAUSED, UNDER_DISCUSSION, CLOSED  
- **ListingVisibility:** NORMAL, BOOSTED, PREMIUM  
- **Amenity:** LIFT, CCTV, SECURITY_GUARD, GATED_COMMUNITY, BALCONY, MODULAR_KITCHEN, AC, GEYSER, WIFI, PARKING, POWER_BACKUP, WATER_SUPPLY, OTHER  
- **MessageType:** TEXT, VISIT_PROPOSAL, OFFER_PROPOSAL, SYSTEM  
- **VisitStatus:** PROPOSED, ACCEPTED, REJECTED, CANCELLED  
- **OfferStatus:** PENDING, ACCEPTED, REJECTED, COUNTERED, EXPIRED  
- **AlertChannel:** IN_APP, EMAIL, SMS  
- **AlertFrequency:** INSTANT, DAILY  

---

## Repository Layer Interfaces

### IRepository<T>
- findById(id: string): T | undefined  
- findAll(): T[]  
- save(entity: T): T  
- delete(id: string): boolean  
- exists(id: string): boolean  
- count(): number  
- clear(): void  

---

### UserRepository implements IRepository<User>
**Additional methods:**  
- findByEmail(email: string): User | undefined  
- findByPhone(phone: string): User | undefined  
- findByRole(role: UserRole): User[]  
- findByAccountTier(tier: AccountTier): User[]  

---

### PropertyRepository implements IRepository<Property>
**Additional methods:**  
- findByCity(city: string): Property[]  
- findByPropertyType(type: PropertyType): Property[]  
- findByFurnishingType(furnishing: FurnishingType): Property[]  

---

### PropertyListingRepository implements IRepository<PropertyListing>
**Additional methods:**  
- findLiveListings(): PropertyListing[]  
- findByOwner(ownerId: string): PropertyListing[]  
- findByStatus(status: ListingStatus): PropertyListing[]  
- findByFilters(criteria: SearchCriteria): PropertyListing[]  
- findByPurpose(purpose: ListingPurpose): PropertyListing[]  

---

### ChatThreadRepository implements IRepository<ChatThread>
**Additional methods:**  
- findByListingAndUsers(listingId: string, ownerId: string, seekerId: string): ChatThread | undefined  
- findByUser(userId: string): ChatThread[]  
- findByListing(listingId: string): ChatThread[]  
- findActiveThreads(): ChatThread[]  

---

### ChatMessageRepository implements IRepository<ChatMessage>
**Additional methods:**  
- findByThread(threadId: string): ChatMessage[]  
- findBySender(senderId: string): ChatMessage[]  

---

### VisitSlotRepository implements IRepository<VisitSlot>
**Additional methods:**  
- findByStatus(status: VisitStatus): VisitSlot[]  
- findByUser(userId: string): VisitSlot[]  

---

### OfferRepository implements IRepository<Offer>
**Additional methods:**  
- findByListing(listingId: string): Offer[]  
- findByStatus(status: OfferStatus): Offer[]  
- findActiveByListing(listingId: string): Offer[]  
- findByThread(threadId: string): Offer[]  

---

### SearchCriteriaRepository implements IRepository<SearchCriteria>
**Additional methods:**  
- findByUser(userId: string): SearchCriteria[]  

---

### SavedSearchAlertRepository implements IRepository<SavedSearchAlert>
**Additional methods:**  
- findByUser(userId: string): SavedSearchAlert[]  
- findActiveAlerts(): SavedSearchAlert[]  
- findByFrequency(frequency: AlertFrequency): SavedSearchAlert[]  

---

### ReviewRepository implements IRepository<Review>
**Additional methods:**  
- findByProperty(propertyId: string): Review[]  
- findByReviewer(reviewerId: string): Review[]  
- findByRevieweeUser(userId: string): Review[]  
- findFlaggedReviews(): Review[]  

---

## Service Layer

### UserService
- registerUser(name: string, email: string, phone: string, password: string, roles: UserRole[]): User  
- authenticate(email: string, password: string): User | null  
- upgradeTier(userId: string, newTier: AccountTier): void  
- updatePreferences(userId: string, prefs: UserPreference): void  
- getUserById(userId: string): User | undefined  
- updateProfile(userId: string, name: string, phone: string): void  

---

### PropertyService
- createProperty(ownerId: string, propertyData: PropertyInput): Property  
- updateProperty(propertyId: string, propertyData: PropertyInput): Property  
- addAmenity(propertyId: string, amenity: Amenity): void  
- removeAmenity(propertyId: string, amenity: Amenity): void  
- getPropertyById(propertyId: string): Property | undefined  

---

### PropertyListingService
- createListing(ownerId: string, propertyId: string, listingData: ListingInput): PropertyListing  
- publishListing(listingId: string): void  
- pauseListing(listingId: string): void  
- closeListing(listingId: string): void  
- updateListingPrice(listingId: string, newPrice: number, newRent?: number): void  
- getListingById(listingId: string): PropertyListing | undefined  
- getOwnerListings(ownerId: string): PropertyListing[]  

---

### SearchService
- search(criteria: SearchCriteria): PropertyListing[]  
- createSearchCriteria(userId: string, input: SearchCriteriaInput): SearchCriteria  
- updateSearchCriteria(criteriaId: string, input: SearchCriteriaInput): SearchCriteria  
- deleteSearchCriteria(criteriaId: string): boolean  
- getUserSavedSearches(userId: string): SearchCriteria[]  

---

### AlertService
- createAlert(criteriaId: string, userId: string, channel: AlertChannel, frequency: AlertFrequency): SavedSearchAlert  
- deactivateAlert(alertId: string): void  
- processNewListing(listing: PropertyListing): void  
- processListingUpdate(listing: PropertyListing): void  
- dispatchPendingAlerts(): void  
- notifyMatchingAlerts(listing: PropertyListing): void  

---

### ChatService
- getOrCreateThread(listingId: string, ownerId: string, seekerId: string): ChatThread  
- sendTextMessage(threadId: string, senderId: string, content: string): ChatMessage  
- getThreadMessages(threadId: string): ChatMessage[]  
- getUserThreads(userId: string): ChatThread[]  
- closeThread(threadId: string): void  

---

### VisitService
- proposeVisit(threadId: string, proposerId: string, slotTime: Date): VisitSlot  
- acceptVisit(slotId: string, userId: string): void  
- rejectVisit(slotId: string, userId: string): void  
- cancelVisit(slotId: string, userId: string): void  
- getUserVisits(userId: string): VisitSlot[]  

---

### OfferService
- createOffer(threadId: string, listingId: string, offererId: string, amount: number, expiresAt?: Date): Offer  
- acceptOffer(offerId: string, userId: string): void  
- rejectOffer(offerId: string, userId: string): void  
- counterOffer(offerId: string, userId: string, newAmount: number): Offer  
- expireOffer(offerId: string): void  
- getListingOffers(listingId: string): Offer[]  

---

### ReviewService
- createReview(reviewerId: string, input: ReviewInput): Review  
- flagReview(reviewId: string): void  
- getPropertyReviews(propertyId: string): Review[]  
- getUserReviews(userId: string): Review[]  

---

### MainController (Singleton)
- static getInstance(): MainController  
- handleUserRegistration(): void  
- handleUserLogin(): void  
- handlePropertyCreation(): void  
- handleListingCreation(): void  
- handleSearchFlow(): void  
- handleSavedSearchAndAlertsFlow(): void  
- handleChatFlow(): void  
- handleVisitManagement(): void  
- handleOfferNegotiation(): void  
- handleReviewManagement(): void  

---

## Design Patterns Applied

### 1. Singleton Pattern
**Classes:** InMemoryDatabase, MainController  
**Justification:** Ensures single shared in-memory data store across the application and a single orchestration point for console-based workflow management.

### 2. Factory Pattern
**Classes:** PropertyFactory, ListingFactory  
**Justification:** Encapsulates complex creation logic for different property types (PG vs Flat vs Villa vs Land) and listing configurations with varying requirements.

### 3. State Pattern
**Classes:** ListingState (DraftState, LiveState, PausedState, UnderDiscussionState, ClosedState), OfferState (PendingState, AcceptedState, RejectedState, CounteredState, ExpiredState), VisitState (ProposedState, AcceptedState, RejectedState, CancelledState)  
**Justification:** Manages complex state transitions for listings, offers, and visit slots with validation and business rules at each state.

### 4. Strategy Pattern
**Classes:** SearchStrategy (RelevanceSearchStrategy, PriceSearchStrategy, DateSearchStrategy), AlertDispatchStrategy (InstantDispatchStrategy, BatchDispatchStrategy)  
**Justification:** Allows pluggable search ranking algorithms and flexible alert dispatch mechanisms based on user preferences and system load.

### 5. Observer Pattern
**Classes:** AlertService (observer), PropertyListingService (subject), SavedSearchAlert (concrete observer)  
**Justification:** When new listings are created or updated, registered alerts automatically check for matches and notify relevant users.

### 6. Builder Pattern
**Classes:** PropertyBuilder, SearchCriteriaBuilder  
**Justification:** Constructs complex Property and SearchCriteria objects step-by-step from console input with validation at each step.

### 7. Repository Pattern
**Classes:** All repository classes (UserRepository, PropertyRepository, etc.)  
**Justification:** Provides abstraction layer between domain logic and data persistence, making it easy to swap in-memory storage with actual database later.

---

## Relationships

- User (1) → (M) Property (owner relationship)  
- User (1) → (M) PropertyListing (owner relationship)  
- User (1) → (M) ChatThread (as owner or seeker)  
- User (1) → (M) SearchCriteria  
- User (1) → (M) SavedSearchAlert  
- User (1) → (M) Review (as reviewer)  
- Property (1) → (1) Address (composition)  
- Property (1) → (M) Review  
- PropertyListing (1) → (1) Property (association)  
- PropertyListing (1) → (1) User (owner)  
- PropertyListing (1) → (M) ChatThread  
- ChatThread (1) → (1) PropertyListing  
- ChatThread (1) → (1) User (owner)  
- ChatThread (1) → (1) User (seeker)  
- ChatThread (1) → (M) ChatMessage  
- ChatThread (1) → (M) VisitSlot  
- ChatThread (1) → (M) Offer  
- SearchCriteria (1) → (M) SavedSearchAlert  
- Offer (1) → (1) Offer (counter-offer relationship, optional)  

---

## Key Design Principles

### Single Responsibility Principle (SRP)
Each class has one reason to change: User manages user data, Property manages property attributes, ChatThread manages conversations, etc.

### Open/Closed Principle (OCP)
System is open for extension (new property types, new search strategies, new alert channels) but closed for modification through use of interfaces and abstract classes.

### Liskov Substitution Principle (LSP)
All State pattern implementations and Strategy pattern implementations can be substituted without breaking the system.

### Interface Segregation Principle (ISP)
Repository interfaces are kept focused; services depend only on repository methods they actually use.

### Dependency Inversion Principle (DIP)
Services depend on repository interfaces (IRepository<T>), not concrete implementations, allowing easy testing and future database swaps.

---

✅ **Saved as:** `nobroker-class-diagram.md`  
✅ **File reference:** [doc:2]

---
