# Recommendation System - Complete Class Diagram

This diagram represents the complete architecture of the Recommendation System with proper UML relationships.

## Design Patterns Used
1. **Singleton Pattern**: InMemoryDatabase, RecommendationEngine
2. **Repository Pattern**: IRepository interface with 3 implementations
3. **Factory Pattern**: StrategyFactory, InteractionFactory for creating strategies and interactions
4. **Strategy Pattern**: IRecommendationStrategy (4 implementations), ISimilarityCalculator (3 implementations)
5. **Observer Pattern**: IInteractionObserver with 2 implementations for event handling

```mermaid
classDiagram
    %% ============================================
    %% ENUMS
    %% ============================================
    class InteractionType {
        <<enumeration>>
        VIEW
        CLICK
        LIKE
        DISLIKE
        RATING
        PURCHASE
        ADD_TO_CART
        SHARE
    }

    class StrategyType {
        <<enumeration>>
        COLLABORATIVE_FILTERING
        CONTENT_BASED
        POPULARITY
        HYBRID
    }

    class SimilarityMetric {
        <<enumeration>>
        COSINE
        EUCLIDEAN
        JACCARD
    }

    %% ============================================
    %% CORE MODELS
    %% ============================================
    class User {
        +String id
        +String name
        +Map~String, String~ attributes
        +Date createdAt
        +Date updatedAt
        +updateAttributes(attributes) void
        +getAttribute(key) String
        +setAttribute(key, value) void
        +removeAttribute(key) boolean
        +update() void
        +isValid() boolean
        +getAttributeCount() number
    }

    class Item {
        +String id
        +String name
        +Map~String, String~ attributes
        +String[] tags
        +Date createdAt
        +Date updatedAt
        +addTag(tag) void
        +removeTag(tag) boolean
        +hasTag(tag) boolean
        +getAttribute(key) String
        +setAttribute(key, value) void
        +updateAttributes(attributes) void
        +removeAttribute(key) boolean
        +update() void
        +isValid() boolean
        +getTagCount() number
    }

    class Interaction {
        +String id
        +String userId
        +String itemId
        +InteractionType type
        +number weight
        +Date timestamp
        +Map~String, String~ metadata
        -validateWeight(weight) number
        +getKey() String
        +setMetadata(key, value) void
        +getMetadata(key) String
        +isRating() boolean
        +isPurchase() boolean
        +isPositive() boolean
        +isNegative() boolean
    }

    class Recommendation {
        +String id
        +String userId
        +String itemId
        +number score
        +String strategyName
        +Date generatedAt
        -validateScore(score) number
        +getKey() String
        +isHighConfidence() boolean
        +isMediumConfidence() boolean
        +isLowConfidence() boolean
    }

    %% ============================================
    %% RECOMMENDATION ENGINE (SINGLETON)
    %% ============================================
    class RecommendationEngine {
        <<Singleton>>
        -static RecommendationEngine instance
        -Map~StrategyType, IRecommendationStrategy~ strategies
        -StrategyType defaultStrategy
        -UserRepository userRepo
        -ItemRepository itemRepo
        -InteractionRepository interactionRepo
        -RecommendationCache cache
        -ISimilarityCalculator defaultSimilarityCalculator
        +static initialize(userRepo, itemRepo, interactionRepo, cache, calculator) RecommendationEngine
        +static getInstance() RecommendationEngine
        +registerStrategy(type, strategy) void
        +setDefaultStrategy(type) void
        +getRecommendations(userId, topN, strategyType?, filters?) Recommendation[]
        +getSimilarItems(itemId, topN, metric?) Item[]
        +clearCache() void
        +getCacheStats() Object
        +getAvailableStrategies() StrategyType[]
        -getStrategy(type) IRecommendationStrategy
        -applyDiversification(recommendations) Recommendation[]
    }

    %% ============================================
    %% SERVICES
    %% ============================================
    class RecommendationService {
        -RecommendationEngine engine
        +getRecommendations(userId, topN, strategyType?, filters?) Recommendation[]
        +getRecommendationsWithDetails(userId, topN, strategyType?) Array
        +getSimilarItems(itemId, topN, metric?) Item[]
        +clearCache() void
        +getCacheStats() Object
        +getAvailableStrategies() StrategyType[]
        -getItemFromEngine(itemId) Item
    }

    class UserService {
        -UserRepository userRepository
        +createUser(name, attributes?) User
        +getUserById(id) User
        +getAllUsers() User[]
        +updateUser(id, updates) User
        +deleteUser(id) boolean
        +searchUsers(query) User[]
        +getUserStats() Object
    }

    class ItemService {
        -ItemRepository itemRepository
        +createItem(name, attributes?, tags?) Item
        +getItemById(id) Item
        +getAllItems() Item[]
        +updateItem(id, updates) Item
        +deleteItem(id) boolean
        +searchItems(query) Item[]
        +getItemsByTag(tag) Item[]
        +getItemStats() Object
    }

    class InteractionService {
        -InteractionRepository interactionRepository
        -IInteractionObserver[] observers
        +recordInteraction(userId, itemId, type, weight?, metadata?) Interaction
        +getInteractionsByUser(userId) Interaction[]
        +getInteractionsByItem(itemId) Interaction[]
        +getInteractionsByUserAndItem(userId, itemId) Interaction[]
        +getPositiveInteractions(userId) Interaction[]
        +getNegativeInteractions(userId) Interaction[]
        +addObserver(observer) void
        +removeObserver(observer) void
        -notifyObservers(interaction) void
        +getInteractionStats() Object
    }

    %% ============================================
    %% CACHE
    %% ============================================
    class RecommendationCache {
        -Map~String, CacheEntry~ cache
        -number ttlInMillis
        +get(key) Recommendation[]
        +set(key, recommendations) void
        +invalidate(key) void
        +invalidateForUser(userId) void
        +invalidateAll() void
        +getSize() number
        +clear() void
        -isExpired(timestamp) boolean
    }

    class CacheEntry {
        <<interface>>
        +Recommendation[] recommendations
        +number timestamp
    }

    %% ============================================
    %% REPOSITORIES
    %% ============================================
    class IRepository~T~ {
        <<interface>>
        +findById(id) T
        +findAll() T[]
        +save(entity) T
        +delete(id) boolean
        +exists(id) boolean
        +count() number
        +clear() void
    }

    class UserRepository {
        -InMemoryDatabase db
        +findByName(name) User[]
        +findByAttribute(key, value) User[]
    }

    class ItemRepository {
        -InMemoryDatabase db
        +findByTag(tag) Item[]
        +findByAttribute(key, value) Item[]
        +findByName(name) Item[]
    }

    class InteractionRepository {
        -InMemoryDatabase db
        +findByUserId(userId) Interaction[]
        +findByItemId(itemId) Interaction[]
        +findByUserAndItem(userId, itemId) Interaction[]
        +findByType(type) Interaction[]
        +findPositiveInteractions(userId) Interaction[]
        +findNegativeInteractions(userId) Interaction[]
        +findByUserAndType(userId, type) Interaction[]
    }

    %% ============================================
    %% DATABASE (SINGLETON)
    %% ============================================
    class InMemoryDatabase {
        <<Singleton>>
        -static InMemoryDatabase instance
        +Map~String, User~ users
        +Map~String, Item~ items
        +Map~String, Interaction~ interactions
        +static getInstance() InMemoryDatabase
        +clearAll() void
        +getStats() Object
        +printStats() void
        +exportData() Object
        +importData(data) void
    }

    %% ============================================
    %% STRATEGY PATTERN - RECOMMENDATION
    %% ============================================
    class IRecommendationStrategy {
        <<interface>>
        +getName() String
        +recommend(userId, topN, filters?) Recommendation[]
    }

    class CollaborativeFilteringStrategy {
        -UserRepository userRepo
        -ItemRepository itemRepo
        -InteractionRepository interactionRepo
        -ISimilarityCalculator similarityCalculator
        +getName() String
        +recommend(userId, topN, filters?) Recommendation[]
        -buildUserItemMatrix() Object
        -findSimilarUsers(targetUserIndex, matrix, userIds) Array
        -generateRecommendations(userId, similarUsers, matrix, itemIds, topN, filters?) Recommendation[]
        -applyFilters(items, filters) Item[]
    }

    class ContentBasedStrategy {
        -ItemRepository itemRepo
        -InteractionRepository interactionRepo
        -ISimilarityCalculator similarityCalculator
        +getName() String
        +recommend(userId, topN, filters?) Recommendation[]
        -buildUserProfile(likedItems) Map
        -buildItemProfile(item) Map
        -calculateProfileSimilarity(userProfile, itemProfile) number
        -extractFeatures(item) number[]
        -applyFilters(items, filters) Item[]
    }

    class PopularityBasedStrategy {
        -InteractionRepository interactionRepo
        -ItemRepository itemRepo
        +getName() String
        +recommend(userId, topN, filters?) Recommendation[]
        -computeItemPopularity() Map
        -applyFilters(itemIds, filters) String[]
    }

    class HybridStrategy {
        -IRecommendationStrategy[] strategies
        +getName() String
        +recommend(userId, topN, filters?) Recommendation[]
        -mergeAndRank(recommendations, topN) Recommendation[]
    }

    %% ============================================
    %% STRATEGY PATTERN - SIMILARITY
    %% ============================================
    class ISimilarityCalculator {
        <<interface>>
        +getName() String
        +computeSimilarity(vectorA, vectorB) number
    }

    class CosineSimilarityCalculator {
        +getName() String
        +computeSimilarity(vectorA, vectorB) number
    }

    class EuclideanSimilarityCalculator {
        +getName() String
        +computeSimilarity(vectorA, vectorB) number
    }

    class JaccardSimilarityCalculator {
        +getName() String
        +computeSimilarity(vectorA, vectorB) number
    }

    %% ============================================
    %% OBSERVER PATTERN
    %% ============================================
    class IInteractionObserver {
        <<interface>>
        +onInteractionRecorded(interaction) void
    }

    class CacheInvalidationObserver {
        -RecommendationCache cache
        +onInteractionRecorded(interaction) void
    }

    class ModelUpdateObserver {
        +onInteractionRecorded(interaction) void
        +triggerBatchUpdate() void
    }

    %% ============================================
    %% FACTORY PATTERN
    %% ============================================
    class StrategyFactory {
        <<Factory>>
        +static createStrategy(type, deps) IRecommendationStrategy
        +static createSimilarityCalculator(metric) ISimilarityCalculator
    }

    class StrategyDependencies {
        <<interface>>
        +UserRepository userRepo
        +ItemRepository itemRepo
        +InteractionRepository interactionRepo
        +ISimilarityCalculator similarityCalculator
    }

    class InteractionFactory {
        <<Factory>>
        +static create(userId, itemId, type, weight?, metadata?) Interaction
        +static createView(userId, itemId) Interaction
        +static createLike(userId, itemId) Interaction
        +static createRating(userId, itemId, rating) Interaction
        +static createPurchase(userId, itemId, metadata?) Interaction
    }

    %% ============================================
    %% UTILITIES
    %% ============================================
    class IdGenerator {
        <<utility>>
        +static generateUUID() String
    }

    class Logger {
        <<utility>>
        +static info(message) void
        +static success(message) void
        +static error(message) void
        +static warn(message) void
        +static debug(message) void
    }

    class ConsoleInterface {
        -UserService userService
        -ItemService itemService
        -InteractionService interactionService
        -RecommendationService recommendationService
        +start() void
        -showMainMenu() void
        -handleUserManagement() void
        -handleItemManagement() void
        -handleInteractions() void
        -handleRecommendations() void
    }

    %% ============================================
    %% RELATIONSHIPS - ENUMS TO MODELS
    %% ============================================
    Interaction --> InteractionType : uses
    Recommendation --> StrategyType : uses

    %% ============================================
    %% RELATIONSHIPS - ASSOCIATION (-->)
    %% Core model relationships
    %% ============================================
    Interaction --> User : references
    Interaction --> Item : references
    Recommendation --> User : references
    Recommendation --> Item : references

    %% ============================================
    %% RELATIONSHIPS - ENGINE & SERVICES
    %% ============================================
    RecommendationEngine --> UserRepository : uses
    RecommendationEngine --> ItemRepository : uses
    RecommendationEngine --> InteractionRepository : uses
    RecommendationEngine --> RecommendationCache : uses
    RecommendationEngine --> IRecommendationStrategy : uses
    RecommendationEngine --> ISimilarityCalculator : uses
    RecommendationEngine ..> Recommendation : creates

    RecommendationService --> RecommendationEngine : uses
    RecommendationService ..> Recommendation : manages

    UserService --> UserRepository : uses
    UserService ..> User : creates/manages

    ItemService --> ItemRepository : uses
    ItemService ..> Item : creates/manages

    InteractionService --> InteractionRepository : uses
    InteractionService --> IInteractionObserver : notifies
    InteractionService --> InteractionFactory : uses
    InteractionService ..> Interaction : creates/manages

    ConsoleInterface --> UserService : uses
    ConsoleInterface --> ItemService : uses
    ConsoleInterface --> InteractionService : uses
    ConsoleInterface --> RecommendationService : uses

    %% ============================================
    %% RELATIONSHIPS - CACHE
    %% ============================================
    RecommendationCache *-- CacheEntry : composition

    %% ============================================
    %% RELATIONSHIPS - REPOSITORY IMPLEMENTATIONS
    %% ============================================
    UserRepository ..|> IRepository : implements
    ItemRepository ..|> IRepository : implements
    InteractionRepository ..|> IRepository : implements

    %% ============================================
    %% RELATIONSHIPS - REPOSITORIES TO DATABASE
    %% ============================================
    UserRepository --> InMemoryDatabase : uses
    ItemRepository --> InMemoryDatabase : uses
    InteractionRepository --> InMemoryDatabase : uses

    %% ============================================
    %% RELATIONSHIPS - STRATEGY IMPLEMENTATIONS
    %% ============================================
    CollaborativeFilteringStrategy ..|> IRecommendationStrategy : implements
    ContentBasedStrategy ..|> IRecommendationStrategy : implements
    PopularityBasedStrategy ..|> IRecommendationStrategy : implements
    HybridStrategy ..|> IRecommendationStrategy : implements

    CollaborativeFilteringStrategy --> UserRepository : uses
    CollaborativeFilteringStrategy --> ItemRepository : uses
    CollaborativeFilteringStrategy --> InteractionRepository : uses
    CollaborativeFilteringStrategy --> ISimilarityCalculator : uses

    ContentBasedStrategy --> ItemRepository : uses
    ContentBasedStrategy --> InteractionRepository : uses
    ContentBasedStrategy --> ISimilarityCalculator : uses

    PopularityBasedStrategy --> InteractionRepository : uses
    PopularityBasedStrategy --> ItemRepository : uses

    HybridStrategy o-- IRecommendationStrategy : aggregates

    %% ============================================
    %% RELATIONSHIPS - SIMILARITY IMPLEMENTATIONS
    %% ============================================
    CosineSimilarityCalculator ..|> ISimilarityCalculator : implements
    EuclideanSimilarityCalculator ..|> ISimilarityCalculator : implements
    JaccardSimilarityCalculator ..|> ISimilarityCalculator : implements

    %% ============================================
    %% RELATIONSHIPS - OBSERVER IMPLEMENTATIONS
    %% ============================================
    CacheInvalidationObserver ..|> IInteractionObserver : implements
    ModelUpdateObserver ..|> IInteractionObserver : implements

    CacheInvalidationObserver --> RecommendationCache : uses

    %% ============================================
    %% RELATIONSHIPS - FACTORY PATTERN
    %% ============================================
    StrategyFactory ..> IRecommendationStrategy : creates
    StrategyFactory ..> CollaborativeFilteringStrategy : creates
    StrategyFactory ..> ContentBasedStrategy : creates
    StrategyFactory ..> PopularityBasedStrategy : creates
    StrategyFactory ..> HybridStrategy : creates
    StrategyFactory ..> ISimilarityCalculator : creates
    StrategyFactory --> StrategyDependencies : uses

    InteractionFactory ..> Interaction : creates

    %% ============================================
    %% RELATIONSHIPS - UTILITIES
    %% ============================================
    User ..> IdGenerator : uses
    Item ..> IdGenerator : uses
    Interaction ..> IdGenerator : uses
    Recommendation ..> IdGenerator : uses
```

## UML Relationship Types Explained

### 1. Composition (*--)
**Meaning**: Strong ownership - child cannot exist without parent
- **RecommendationCache *-- CacheEntry**: CacheEntry exists only within cache, destroyed with cache

### 2. Aggregation (o--)
**Meaning**: Weak ownership - child can exist independently
- **HybridStrategy o-- IRecommendationStrategy**: HybridStrategy aggregates multiple strategies, but strategies exist independently

### 3. Association (-->)
**Meaning**: Simple relationship or reference
- **Interaction --> User**: Interaction references user
- **Interaction --> Item**: Interaction references item
- **Recommendation --> User**: Recommendation references user
- **Recommendation --> Item**: Recommendation references item
- **RecommendationEngine --> UserRepository**: Engine uses repository
- **CollaborativeFilteringStrategy --> ISimilarityCalculator**: Strategy uses calculator

### 4. Dependency (..>)
**Meaning**: One class uses another (creates, manages, or depends on)
- **RecommendationEngine ..> Recommendation**: Engine creates recommendations
- **UserService ..> User**: Service creates and manages users
- **StrategyFactory ..> IRecommendationStrategy**: Factory creates strategy instances
- **InteractionFactory ..> Interaction**: Factory creates interactions

### 5. Implementation (..|>)
**Meaning**: Class implements an interface
- **UserRepository ..|> IRepository**: Implements repository interface
- **CollaborativeFilteringStrategy ..|> IRecommendationStrategy**: Implements recommendation strategy
- **CosineSimilarityCalculator ..|> ISimilarityCalculator**: Implements similarity calculator
- **CacheInvalidationObserver ..|> IInteractionObserver**: Implements observer interface

## Architecture Layers

### Presentation Layer
- ConsoleInterface (command-line interface)

### Service Layer (4 Services)
- RecommendationService (recommendation generation)
- UserService (user management)
- ItemService (item/product management)
- InteractionService (interaction tracking with observer pattern)

### Engine Layer
- RecommendationEngine (Singleton - core recommendation orchestration)

### Cache Layer
- RecommendationCache (caching with TTL support)

### Repository Layer (3 Repositories + Interface)
- IRepository<T> (interface)
- UserRepository
- ItemRepository
- InteractionRepository

### Model Layer (4 Core Models)
- User
- Item
- Interaction
- Recommendation

### Strategy Layer
- **Recommendation Strategies**: 4 implementations
- **Similarity Calculators**: 3 implementations

### Observer Layer
- IInteractionObserver interface
- CacheInvalidationObserver
- ModelUpdateObserver

### Factory Layer
- StrategyFactory (creates recommendation strategies)
- InteractionFactory (creates interactions)

### Data Layer
- InMemoryDatabase (Singleton)

### Utility Layer
- IdGenerator
- Logger

## Design Pattern Details

### 1. Singleton Pattern
**Classes**: InMemoryDatabase, RecommendationEngine
**Purpose**: Ensure single instance across application
**Benefits**: 
- Centralized data storage
- Single recommendation engine instance
- Consistent state management
- Controlled access to shared resources

### 2. Repository Pattern
**Classes**: IRepository<T> interface + 3 implementations
**Purpose**: Abstract data access layer
**Benefits**:
- Clean separation of concerns
- Easy to swap data sources
- Testable code
- Consistent CRUD operations
- Encapsulates database queries

### 3. Factory Pattern
**Classes**: StrategyFactory, InteractionFactory
**Purpose**: Centralize object creation logic
**Methods**:
- StrategyFactory:
  - createStrategy(): Creates appropriate recommendation strategy
  - createSimilarityCalculator(): Creates similarity calculator by metric
- InteractionFactory:
  - create(): Generic interaction creation
  - createView(), createLike(), createRating(), createPurchase(): Specialized creators
**Benefits**:
- Encapsulates complex creation logic
- Easy to extend with new strategies
- Consistent object initialization

### 4. Strategy Pattern - Recommendation
**Interface**: IRecommendationStrategy
**Implementations**:
- **CollaborativeFilteringStrategy**: User-based collaborative filtering
  - Finds similar users based on interaction patterns
  - Recommends items liked by similar users
  - Uses user-item matrix and similarity calculations
- **ContentBasedStrategy**: Item feature-based recommendations
  - Builds user profile from liked items
  - Finds items similar to user preferences
  - Uses item attributes and tags
- **PopularityBasedStrategy**: Trending/popular items
  - Recommends globally popular items
  - Good for cold-start problems
  - No personalization required
- **HybridStrategy**: Combines multiple strategies
  - Merges recommendations from multiple sources
  - Weighted averaging of scores
  - Consensus boost for items recommended by multiple strategies
**Purpose**: Pluggable recommendation algorithms
**Benefits**:
- Easy to add new recommendation algorithms
- Swap strategies at runtime
- A/B testing different approaches
- Open/Closed Principle

### 5. Strategy Pattern - Similarity
**Interface**: ISimilarityCalculator
**Implementations**:
- **CosineSimilarityCalculator**: Angle-based similarity (0 to 1)
- **EuclideanSimilarityCalculator**: Distance-based similarity
- **JaccardSimilarityCalculator**: Set overlap similarity
**Purpose**: Different similarity computation methods
**Benefits**:
- Flexible similarity metrics
- Domain-specific calculations
- Easy to benchmark different methods

### 6. Observer Pattern
**Interface**: IInteractionObserver
**Implementations**:
- **CacheInvalidationObserver**: Invalidates cache when interactions occur
- **ModelUpdateObserver**: Triggers model updates on new interactions
**Purpose**: Event-driven updates when interactions are recorded
**Benefits**:
- Decoupled components
- Real-time cache invalidation
- Extensible event handling
- Automatic model updates

## Key Features

### User Management
- User attributes (flexible key-value pairs)
- Profile management
- User search capabilities

### Item Management
- Item attributes (metadata)
- Tagging system
- Item categorization
- Flexible attribute management

### Interaction Tracking
- Multiple interaction types (View, Click, Like, Rating, Purchase, etc.)
- Weighted interactions
- Metadata support
- Positive/negative classification
- Observer-based event system

### Recommendation Generation
- Multiple recommendation strategies
- Configurable top-N results
- Filtering support
- Score-based confidence levels
- Similar item discovery

### Caching System
- Time-based cache expiration (TTL)
- User-specific cache invalidation
- Automatic invalidation on interactions
- Cache statistics

### Similarity Computation
- Multiple similarity metrics
- Vector-based calculations
- User-user similarity
- Item-item similarity

## Business Flows

### User Interaction Flow
1. User interacts with item (view, like, purchase)
2. InteractionService records interaction
3. Observers notified:
   - CacheInvalidationObserver invalidates user's cache
   - ModelUpdateObserver triggers model updates
4. Interaction stored in repository

### Recommendation Generation Flow
1. User requests recommendations
2. RecommendationService calls RecommendationEngine
3. Engine checks cache for existing recommendations
4. If cache miss:
   - Selects appropriate strategy (default or specified)
   - Strategy computes recommendations
   - Results cached for future requests
5. Recommendations returned with scores

### Collaborative Filtering Flow
1. Build user-item interaction matrix
2. Find users similar to target user
3. Identify items liked by similar users
4. Filter out items target user already interacted with
5. Score items based on similar users' preferences
6. Return top-N recommendations

### Content-Based Flow
1. Get user's positive interactions (likes, high ratings)
2. Build user profile from liked items (attributes, tags)
3. Find candidate items (not yet interacted)
4. Calculate similarity between user profile and items
5. Score items based on profile match
6. Return top-N similar items

### Hybrid Strategy Flow
1. Collect recommendations from multiple strategies
2. Merge recommendations by item ID
3. Calculate weighted average scores
4. Boost items recommended by multiple strategies
5. Re-rank by final scores
6. Return diversified top-N recommendations

## Key Statistics

- **Total Classes**: 35+
- **Models**: 4 core domain models
- **Services**: 4 service classes
- **Repositories**: 3 + 1 interface
- **Design Patterns**: 5 patterns
- **Recommendation Strategies**: 4 implementations
- **Similarity Calculators**: 3 implementations
- **Observers**: 2 implementations
- **Enums**: 3
- **Singletons**: 2
- **Factories**: 2

## Relationship Summary

| Relationship Type | Count | Usage |
|------------------|-------|-------|
| Composition (*--) | 1 | Cache owns entries |
| Aggregation (o--) | 1 | Hybrid strategy aggregates |
| Association (-->) | 20+ | References |
| Dependency (..>) | 15+ | Usage/Creation |
| Implementation (..\|>) | 12 | Interface implementation |

## System Benefits

### For Users
- Personalized recommendations
- Discover relevant items
- Multiple recommendation approaches
- Real-time updates

### For Content Providers
- Increase engagement
- Better item discovery
- Data-driven insights
- Flexible recommendation logic

### Platform Features
- Scalable architecture
- Multiple recommendation algorithms
- Real-time interaction tracking
- Efficient caching
- Observer-based events
- Extensible design

## Algorithm Comparison

| Strategy | Best For | Cold Start | Personalization | Computation |
|----------|----------|------------|----------------|-------------|
| Collaborative Filtering | Users with interaction history | Poor | High | High |
| Content-Based | Items with rich metadata | Good | Medium | Medium |
| Popularity | New users, trending items | Excellent | None | Low |
| Hybrid | Best overall performance | Good | High | High |

## Cold Start Solutions

### New User (No interactions)
1. **Popularity Strategy**: Show trending items
2. **Ask for preferences**: Collect initial attributes
3. **Onboarding interactions**: Quick likes/dislikes

### New Item (No interactions)
1. **Content-Based**: Match to user profiles via attributes
2. **Featured placement**: Boost visibility temporarily
3. **Cold start boost**: Initial promotion period

## Extensibility Points

### Easy to Add
1. **New Recommendation Strategies**: Implement IRecommendationStrategy
2. **New Similarity Metrics**: Implement ISimilarityCalculator
3. **New Interaction Types**: Add to InteractionType enum
4. **New Observers**: Implement IInteractionObserver
5. **New Filters**: Extend filtering in strategies

### Customization Options
- Interaction weights by type
- Cache TTL configuration
- Similarity metric selection
- Strategy weights in hybrid
- Top-N result limits
- Filtering criteria
- Score thresholds

## Performance Optimizations

### Caching
- TTL-based expiration
- User-specific invalidation
- Lazy computation
- Pre-computed similarities

### Matrix Operations
- Sparse matrix optimization
- Incremental updates
- Batch processing
- Parallel computation

### Database Queries
- Indexed lookups
- Filtered queries
- Batch operations
- Repository pattern abstraction

