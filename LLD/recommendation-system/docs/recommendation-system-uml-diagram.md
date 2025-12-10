# RECOMMENDATION SYSTEM - CLASS DIAGRAM

## Core Classes

### User
- id: string
- name: string
- attributes: Map<string, string>
- createdAt: Date
- updatedAt: Date
- Methods:
  - constructor(name: string, attributes?: Map<string, string>, id?: string)
  - updateAttributes(attributes: Map<string, string>): void
  - getAttribute(key: string): string | undefined
  - update(): void

### Item
- id: string
- name: string
- attributes: Map<string, string>
- tags: string[]
- createdAt: Date
- updatedAt: Date
- Methods:
  - constructor(name: string, attributes?: Map<string, string>, tags?: string[], id?: string)
  - addTag(tag: string): void
  - removeTag(tag: string): void
  - getAttribute(key: string): string | undefined
  - updateAttributes(attributes: Map<string, string>): void
  - update(): void

### Interaction
- id: string
- userId: string
- itemId: string
- type: InteractionType
- weight: number
- timestamp: Date
- metadata: Map<string, string>
- Methods:
  - constructor(userId: string, itemId: string, type: InteractionType, weight?: number, metadata?: Map<string, string>, id?: string)
  - getKey(): string

### Recommendation
- id: string
- userId: string
- itemId: string
- score: number
- strategyName: string
- generatedAt: Date
- Methods:
  - constructor(userId: string, itemId: string, score: number, strategyName: string, id?: string)

---

## Enums

### InteractionType
- VIEW
- CLICK
- LIKE
- DISLIKE
- RATING
- PURCHASE

### StrategyType
- COLLABORATIVE_FILTERING
- CONTENT_BASED
- POPULARITY
- HYBRID

### SimilarityMetric
- COSINE
- JACCARD
- EUCLIDEAN

---

## Utility Classes

### IdGenerator
- Methods:
  - static generateUUID(): string
  - static generateId(prefix?: string): string

### Logger
- Methods:
  - static info(msg: string): void
  - static error(msg: string): void
  - static warn(msg: string): void
  - static debug(msg: string): void

---

## Database Layer

### InMemoryDatabase (Singleton)
- users: Map<string, User>
- items: Map<string, Item>
- interactions: Map<string, Interaction>
- Methods:
  - private constructor()
  - static getInstance(): InMemoryDatabase
  - clearAll(): void
  - getStats(): Record<string, number>

---

## Repository Layer

### IRepository<T>
- Methods:
  - findById(id: string): T | undefined
  - findAll(): T[]
  - save(entity: T): T
  - delete(id: string): boolean
  - exists(id: string): boolean
  - count(): number
  - clear(): void

### UserRepository implements IRepository<User>
- db: InMemoryDatabase
- Methods:
  - findById(id: string): User | undefined
  - findAll(): User[]
  - save(user: User): User
  - delete(id: string): boolean
  - exists(id: string): boolean
  - count(): number
  - clear(): void
  - findByAttribute(key: string, value: string): User[]

### ItemRepository implements IRepository<Item>
- db: InMemoryDatabase
- Methods:
  - findById(id: string): Item | undefined
  - findAll(): Item[]
  - save(item: Item): Item
  - delete(id: string): boolean
  - exists(id: string): boolean
  - count(): number
  - clear(): void
  - findByTag(tag: string): Item[]
  - findByAttribute(key: string, value: string): Item[]

### InteractionRepository implements IRepository<Interaction>
- db: InMemoryDatabase
- Methods:
  - findById(id: string): Interaction | undefined
  - findAll(): Interaction[]
  - save(interaction: Interaction): Interaction
  - delete(id: string): boolean
  - exists(id: string): boolean
  - count(): number
  - clear(): void
  - findByUserId(userId: string): Interaction[]
  - findByItemId(itemId: string): Interaction[]
  - findByUserAndItem(userId: string, itemId: string): Interaction[]

---

## Strategy Interfaces and Implementations

### IRecommendationStrategy
- Methods:
  - getName(): string
  - recommend(userId: string, topN: number, filters?: Map<string, string>): Recommendation[]

### ISimilarityCalculator
- Methods:
  - getName(): string
  - computeSimilarity(vectorA: number[], vectorB: number[]): number

### CollaborativeFilteringStrategy implements IRecommendationStrategy
- userRepository: UserRepository
- itemRepository: ItemRepository
- interactionRepository: InteractionRepository
- similarityCalculator: ISimilarityCalculator
- Methods:
  - constructor(userRepo: UserRepository, itemRepo: ItemRepository, interactionRepo: InteractionRepository, similarityCalculator: ISimilarityCalculator)
  - getName(): string
  - recommend(userId: string, topN: number, filters?: Map<string, string>): Recommendation[]
  - private buildUserItemMatrix(): number[][]
  - private computeSimilarUsers(targetUserId: string, k: number): string[]

### ContentBasedStrategy implements IRecommendationStrategy
- itemRepository: ItemRepository
- interactionRepository: InteractionRepository
- similarityCalculator: ISimilarityCalculator
- Methods:
  - constructor(itemRepo: ItemRepository, interactionRepo: InteractionRepository, similarityCalculator: ISimilarityCalculator)
  - getName(): string
  - recommend(userId: string, topN: number, filters?: Map<string, string>): Recommendation[]
  - private buildItemFeatureVector(item: Item): number[]

### PopularityBasedStrategy implements IRecommendationStrategy
- interactionRepository: InteractionRepository
- itemRepository: ItemRepository
- Methods:
  - constructor(interactionRepo: InteractionRepository, itemRepo: ItemRepository)
  - getName(): string
  - recommend(userId: string, topN: number, filters?: Map<string, string>): Recommendation[]
  - private computeItemPopularity(): Map<string, number>

### HybridStrategy implements IRecommendationStrategy
- strategies: IRecommendationStrategy[]
- Methods:
  - constructor(strategies: IRecommendationStrategy[])
  - getName(): string
  - recommend(userId: string, topN: number, filters?: Map<string, string>): Recommendation[]
  - private mergeAndRank(recommendations: Recommendation[], topN: number): Recommendation[]

---

## Similarity Calculators

### CosineSimilarityCalculator implements ISimilarityCalculator
- Methods:
  - getName(): string
  - computeSimilarity(vectorA: number[], vectorB: number[]): number

### JaccardSimilarityCalculator implements ISimilarityCalculator
- Methods:
  - getName(): string
  - computeSimilarity(vectorA: number[], vectorB: number[]): number

### EuclideanSimilarityCalculator implements ISimilarityCalculator
- Methods:
  - getName(): string
  - computeSimilarity(vectorA: number[], vectorB: number[]): number

---

## Services

### UserService
- userRepository: UserRepository
- Methods:
  - constructor(userRepository: UserRepository)
  - createUser(name: string, attributes?: Map<string, string>): User
  - getUserById(id: string): User | undefined
  - updateUserAttributes(id: string, attributes: Map<string, string>): void

### ItemService
- itemRepository: ItemRepository
- Methods:
  - constructor(itemRepository: ItemRepository)
  - createItem(name: string, attributes?: Map<string, string>, tags?: string[]): Item
  - getItemById(id: string): Item | undefined
  - addTagToItem(itemId: string, tag: string): void

### InteractionService (Observable)
- interactionRepository: InteractionRepository
- observers: IInteractionObserver[]
- Methods:
  - constructor(interactionRepository: InteractionRepository)
  - recordInteraction(userId: string, itemId: string, type: InteractionType, weight?: number, metadata?: Map<string, string>): Interaction
  - getInteractionsByUser(userId: string): Interaction[]
  - getInteractionsByItem(itemId: string): Interaction[]
  - addObserver(observer: IInteractionObserver): void
  - removeObserver(observer: IInteractionObserver): void
  - notifyObservers(interaction: Interaction): void

### RecommendationService
- recommendationEngine: RecommendationEngine
- Methods:
  - constructor(recommendationEngine: RecommendationEngine)
  - getRecommendations(userId: string, topN: number, strategyType?: StrategyType): Recommendation[]
  - getSimilarItems(itemId: string, topN: number, metric?: SimilarityMetric): Item[]

---

## Observer Pattern

### IInteractionObserver
- Methods:
  - onInteractionRecorded(interaction: Interaction): void

### CacheInvalidationObserver implements IInteractionObserver
- recommendationCache: RecommendationCache
- Methods:
  - constructor(recommendationCache: RecommendationCache)
  - onInteractionRecorded(interaction: Interaction): void

### ModelUpdateObserver implements IInteractionObserver
- Methods:
  - onInteractionRecorded(interaction: Interaction): void

---

## Caching

### RecommendationCache
- cache: Map<string, Recommendation[]>
- ttlInMillis: number
- Methods:
  - constructor(ttlInMillis: number)
  - get(key: string): Recommendation[] | undefined
  - set(key: string, recommendations: Recommendation[]): void
  - invalidate(key: string): void
  - invalidateForUser(userId: string): void
  - buildKey(userId: string, strategyName: string): string

---

## Factories

### StrategyFactory
- Methods:
  - static createStrategy(type: StrategyType, deps: StrategyDependencies): IRecommendationStrategy

### InteractionFactory
- Methods:
  - static create(userId: string, itemId: string, type: InteractionType, weight?: number, metadata?: Map<string, string>): Interaction

---

## Recommendation Engine (Facade + Singleton)

### RecommendationEngine
- private static instance: RecommendationEngine
- userRepository: UserRepository
- itemRepository: ItemRepository
- interactionRepository: InteractionRepository
- recommendationCache: RecommendationCache
- strategies: Map<StrategyType, IRecommendationStrategy>
- defaultSimilarityCalculator: ISimilarityCalculator
- Methods:
  - private constructor(userRepo: UserRepository, itemRepo: ItemRepository, interactionRepo: InteractionRepository, cache: RecommendationCache, similarityCalculator: ISimilarityCalculator)
  - static getInstance(): RecommendationEngine
  - registerStrategy(type: StrategyType, strategy: IRecommendationStrategy): void
  - getRecommendations(userId: string, topN: number, strategyType?: StrategyType, filters?: Map<string, string>): Recommendation[]
  - getSimilarItems(itemId: string, topN: number, metric?: SimilarityMetric): Item[]
  - private getOrCreateStrategy(strategyType: StrategyType): IRecommendationStrategy

---

## Relationships

- InMemoryDatabase (1) → (M) User
- InMemoryDatabase (1) → (M) Item
- InMemoryDatabase (1) → (M) Interaction
- UserRepository (1) → (1) InMemoryDatabase
- ItemRepository (1) → (1) InMemoryDatabase
- InteractionRepository (1) → (1) InMemoryDatabase
- RecommendationEngine (1) → (M) IRecommendationStrategy
- RecommendationEngine (1) → (1) RecommendationCache
- RecommendationEngine (1) → (1) ISimilarityCalculator
- InteractionService (1) → (M) IInteractionObserver
- HybridStrategy (1) → (M) IRecommendationStrategy

---

## Design Patterns Applied

1. Strategy Pattern
   - Interfaces: IRecommendationStrategy, ISimilarityCalculator
   - Implementations: CollaborativeFilteringStrategy, ContentBasedStrategy, PopularityBasedStrategy, HybridStrategy, CosineSimilarityCalculator, JaccardSimilarityCalculator, EuclideanSimilarityCalculator
   - Justification: Allow easy swapping and combination of recommendation algorithms and similarity measures.

2. Singleton Pattern
   - Classes: InMemoryDatabase, RecommendationEngine
   - Justification: Ensure a single source of truth for in-memory data and centralized recommendation orchestration.

3. Observer Pattern
   - Interfaces: IInteractionObserver
   - Subjects: InteractionService
   - Observers: CacheInvalidationObserver, ModelUpdateObserver
   - Justification: Decouple side-effects (cache invalidation, model updates) from interaction recording.

4. Repository Pattern
   - Interfaces: IRepository<T>
   - Implementations: UserRepository, ItemRepository, InteractionRepository
   - Justification: Abstract data access and keep business logic independent of storage implementation.

5. Factory Pattern
   - Classes: StrategyFactory, InteractionFactory
   - Justification: Centralize and simplify creation of strategies and interaction objects based on configuration or input.
