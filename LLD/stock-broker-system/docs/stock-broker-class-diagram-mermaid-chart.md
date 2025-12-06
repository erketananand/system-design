# Stock Broker System - Complete Class Diagram

This diagram represents the complete architecture of the Stock Broker System with proper UML relationships.

## Design Patterns Used
1. **Singleton Pattern**: InMemoryDatabase, ExchangeGateway, MarketDataService
2. **Repository Pattern**: IRepository interface with 8 implementations
3. **Factory Pattern**: OrderFactory for creating different order types
4. **Strategy Pattern**: IOrderValidationStrategy with 3 validation strategies

```mermaid
classDiagram
    %% ============================================
    %% ENUMS
    %% ============================================
    class OrderType {
        <<enumeration>>
        MARKET
        LIMIT
        STOP_LOSS
        BRACKET
        COVER
    }

    class OrderStatus {
        <<enumeration>>
        PENDING
        SENT_TO_EXCHANGE
        EXECUTED
        CANCELLED
        REJECTED
        PARTIALLY_EXECUTED
    }

    class OrderSide {
        <<enumeration>>
        BUY
        SELL
    }

    class OrderValidity {
        <<enumeration>>
        DAY
        IOC
        GTD
    }

    class TransactionType {
        <<enumeration>>
        DEPOSIT
        WITHDRAWAL
        CHARGE
        ADJUSTMENT
        TRADE_DEBIT
        TRADE_CREDIT
    }

    class Sector {
        <<enumeration>>
        TECHNOLOGY
        BANKING
        FINANCE
        ENERGY
        CONSUMER_GOODS
        AUTOMOBILE
        PHARMACEUTICAL
        INFRASTRUCTURE
        TELECOM
        METALS
        REAL_ESTATE
        FMCG
        MEDIA
        HEALTHCARE
        UTILITIES
    }

    %% ============================================
    %% CORE MODELS
    %% ============================================
    class User {
        +String id
        +String name
        +String email
        +String pan
        +String bankAccountNumber
        +Date createdAt
        +Date updatedAt
        +updateProfile(name, email, bankAccountNumber) void
        +getMaskedBankAccount() String
        +isValidPAN() boolean
        +getSummary() String
    }

    class Account {
        +String id
        +String userId
        +number balance
        +number blockedAmount
        +Date createdAt
        +Date updatedAt
        +credit(amount: number) void
        +debit(amount: number) void
        +canBlockAmount(amount: number) boolean
        +blockAmount(amount: number) void
        +releaseBlockedAmount(amount: number) void
        +getAvailableBalance() number
        +getTotalBalance() number
    }

    class Portfolio {
        +String id
        +String userId
        +Map~String, Holding~ holdings
        +Date createdAt
        +Date updatedAt
        +addOrUpdateHolding(stockSymbol, quantity, price) void
        +reduceHolding(stockSymbol, quantity) void
        +getHolding(stockSymbol) Holding
        +hasHolding(stockSymbol) boolean
        +getTotalCurrentValue(priceProvider) number
        +getTotalInvestedAmount() number
        +getTotalPnL(priceProvider) number
        +getAllHoldings() Holding[]
    }

    class Holding {
        +String id
        +String userId
        +String stockSymbol
        +number quantity
        +number averageBuyPrice
        +Date createdAt
        +Date updatedAt
        +addQuantity(quantity, price) void
        +reduceQuantity(quantity) void
        +getCurrentValue(currentPrice) number
        +getInvestedAmount() number
        +getUnrealizedPnL(currentPrice) number
        +getUnrealizedPnLPercentage(currentPrice) number
        +hasQuantity() boolean
    }

    class Order {
        +String id
        +String userId
        +String stockSymbol
        +OrderType orderType
        +OrderSide side
        +number quantity
        +number price
        +number triggerPrice
        +OrderStatus status
        +OrderValidity validity
        +Date createdAt
        +Date updatedAt
        +String exchangeOrderId
        +String remarks
        +markSentToExchange(exchangeOrderId) void
        +markExecuted() void
        +markCancelled(remarks) void
        +markRejected(remarks) void
        +markPartiallyExecuted() void
        +isActive() boolean
        +getDisplayString() String
        +getEstimatedValue() number
    }

    class Trade {
        +String id
        +String userId
        +String orderId
        +String stockSymbol
        +OrderSide side
        +number quantity
        +number price
        +Date executedAt
        +number brokerage
        +number taxes
        +number totalCharges
        +getTradeValue() number
        +getNetAmount() number
        +getRealizedPnL(buyAveragePrice) number
        +getDisplayString() String
    }

    class Stock {
        +String symbol
        +String companyName
        +Sector sector
        +number lastTradedPrice
        +number dayOpenPrice
        +number dayHighPrice
        +number dayLowPrice
        +number previousClosePrice
        +number dayVolume
        +Date lastUpdatedAt
        +updatePrice(newPrice, volume) void
        +getDayChange() number
        +getDayChangePercentage() number
        +resetDay(openPrice) void
        +getQuote() Object
    }

    class Transaction {
        +String id
        +String userId
        +TransactionType type
        +number amount
        +String description
        +Date createdAt
        +isCredit() boolean
        +isDebit() boolean
        +getDisplayString() String
        +getFormattedAmount() String
    }

    class Watchlist {
        +String id
        +String userId
        +String name
        +Set~String~ stockSymbols
        +Date createdAt
        +Date updatedAt
        +addStock(symbol) void
        +removeStock(symbol) void
        +hasStock(symbol) boolean
        +getStockSymbols() String[]
        +getStockCount() number
        +rename(newName) void
        +clear() void
    }

    %% ============================================
    %% SERVICES
    %% ============================================
    class OrderService {
        -OrderRepository orderRepository
        -AccountRepository accountRepository
        -PortfolioRepository portfolioRepository
        -TradeRepository tradeRepository
        -StockRepository stockRepository
        -ExchangeGateway exchangeGateway
        -MarketDataService marketDataService
        -AccountService accountService
        -PortfolioService portfolioService
        +placeOrder(orderRequest) Order
        +cancelOrder(orderId, userId) void
        +getOrderById(orderId) Order
        +getOrdersForUser(userId) Order[]
        +tryExecuteOrder(order) boolean
        +estimateOrderCost(order, currentPrice) number
    }

    class AccountService {
        -AccountRepository accountRepository
        -TransactionRepository transactionRepository
        +createAccount(userId, initialBalance) Account
        +getAccount(userId) Account
        +deposit(userId, amount) Transaction
        +withdraw(userId, amount) Transaction
        +getBalance(userId) number
        +getTransactionHistory(userId) Transaction[]
        +addCharge(userId, amount, description) Transaction
    }

    class PortfolioService {
        -PortfolioRepository portfolioRepository
        -TradeRepository tradeRepository
        -MarketDataService marketDataService
        +getOrCreatePortfolio(userId) Portfolio
        +getPortfolioSummary(userId) PortfolioSummary
        +updatePortfolioOnTrade(trade) void
        +calculateRealizedPnL(userId, startDate, endDate) number
        +getHoldingDetails(userId, stockSymbol) Object
    }

    class WatchlistService {
        -WatchlistRepository watchlistRepository
        -StockRepository stockRepository
        +createWatchlist(userId, name) Watchlist
        +getWatchlistsForUser(userId) Watchlist[]
        +addStockToWatchlist(watchlistId, stockSymbol) void
        +removeStockFromWatchlist(watchlistId, stockSymbol) void
        +deleteWatchlist(watchlistId) void
        +getWatchlistWithPrices(watchlistId) Object
    }

    class MarketDataService {
        <<Singleton>>
        -static MarketDataService instance
        -StockRepository stockRepository
        +static getInstance() MarketDataService
        +getStock(symbol) Stock
        +getAllStocks() Stock[]
        +getCurrentPrice(symbol) number
        +updateStockPrice(symbol, price, volume) void
        +searchStocks(query) Stock[]
        +getStocksBySector(sector) Stock[]
    }

    class ExchangeGateway {
        <<Singleton>>
        -static ExchangeGateway instance
        -MarketDataService marketDataService
        -ChargeCalculatorService chargeCalculator
        +static getInstance() ExchangeGateway
        +sendOrder(order) String
        +cancelOrder(exchangeOrderId) boolean
        +getOrderStatus(exchangeOrderId) OrderStatus
        +simulateExecution(order) Trade
    }

    class ChargeCalculatorService {
        +calculateBrokerage(tradeValue, orderType) number
        +calculateTaxes(tradeValue, brokerage) number
        +calculateTotalCharges(tradeValue, orderType) Object
        +estimateCharges(quantity, price, side, orderType) Object
    }

    class MainController {
        -AccountService accountService
        -OrderService orderService
        -PortfolioService portfolioService
        -WatchlistService watchlistService
        -MarketDataService marketDataService
        +initialize() void
        +handleUserRegistration(userData) void
        +handleOrderPlacement(orderData) void
        +handleOrderCancellation(orderId) void
        +showPortfolio(userId) void
        +showOrderBook(userId) void
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
        +findByPAN(pan: String) User
    }

    class AccountRepository {
        -InMemoryDatabase db
        +findByUserId(userId: String) Account
        +existsByUserId(userId: String) boolean
        +update(account: Account) Account
    }

    class PortfolioRepository {
        -InMemoryDatabase db
        +findByUserId(userId: String) Portfolio
        +update(portfolio: Portfolio) Portfolio
    }

    class OrderRepository {
        -InMemoryDatabase db
        +findByUserId(userId: String) Order[]
        +findByExchangeOrderId(exchangeOrderId: String) Order
        +findActiveOrders(userId: String) Order[]
        +update(order: Order) Order
    }

    class TradeRepository {
        -InMemoryDatabase db
        +findByUserId(userId: String) Trade[]
        +findByOrderId(orderId: String) Trade[]
        +findByStockSymbol(symbol: String) Trade[]
        +findByDateRange(userId, startDate, endDate) Trade[]
    }

    class StockRepository {
        -InMemoryDatabase db
        +findBySymbol(symbol: String) Stock
        +findBySector(sector: Sector) Stock[]
        +searchByName(query: String) Stock[]
        +update(stock: Stock) Stock
    }

    class WatchlistRepository {
        -InMemoryDatabase db
        +findByUserId(userId: String) Watchlist[]
        +update(watchlist: Watchlist) Watchlist
    }

    class TransactionRepository {
        -InMemoryDatabase db
        +findByUserId(userId: String) Transaction[]
        +findByType(userId, type: TransactionType) Transaction[]
        +findByDateRange(userId, startDate, endDate) Transaction[]
    }

    %% ============================================
    %% DATABASE (SINGLETON)
    %% ============================================
    class InMemoryDatabase {
        <<Singleton>>
        -static InMemoryDatabase instance
        +Map~String, User~ users
        +Map~String, Account~ accounts
        +Map~String, Stock~ stocks
        +Map~String, Order~ orders
        +Map~String, Trade~ trades
        +Map~String, Portfolio~ portfolios
        +Map~String, Watchlist~ watchlists
        +Map~String, Transaction~ transactions
        +Map~String, Account~ accountsByUserId
        +Map~String, Portfolio~ portfoliosByUserId
        +static getInstance() InMemoryDatabase
        +clearAll() void
        +getStats() Object
        +printStats() void
    }

    %% ============================================
    %% STRATEGY PATTERN
    %% ============================================
    class IOrderValidationStrategy {
        <<interface>>
        +validate(order, account, stock, portfolio) void
        +getStrategyName() String
    }

    class MarketOrderValidationStrategy {
        +validate(order, account, stock, portfolio) void
        +getStrategyName() String
    }

    class LimitOrderValidationStrategy {
        +validate(order, account, stock, portfolio) void
        +getStrategyName() String
    }

    class StopLossOrderValidationStrategy {
        +validate(order, account, stock, portfolio) void
        +getStrategyName() String
    }

    %% ============================================
    %% FACTORY PATTERN
    %% ============================================
    class OrderFactory {
        <<Factory>>
        +static createMarketOrder(userId, stockSymbol, side, quantity, validity) Order
        +static createLimitOrder(userId, stockSymbol, side, quantity, price, validity) Order
        +static createStopLossOrder(userId, stockSymbol, side, quantity, triggerPrice, validity) Order
        +static createFromRequest(orderRequest: OrderRequest) Order
    }

    class OrderRequest {
        <<interface>>
        +String userId
        +String stockSymbol
        +OrderType orderType
        +OrderSide side
        +number quantity
        +number price
        +number triggerPrice
        +OrderValidity validity
    }

    %% ============================================
    %% RELATIONSHIPS - ENUMS TO MODELS
    %% ============================================
    Order --> OrderType : uses
    Order --> OrderSide : uses
    Order --> OrderStatus : uses
    Order --> OrderValidity : uses
    Trade --> OrderSide : uses
    Transaction --> TransactionType : uses
    Stock --> Sector : uses

    %% ============================================
    %% RELATIONSHIPS - COMPOSITION (*--)
    %% User owns Account (lifecycle dependent)
    %% User owns Portfolio (lifecycle dependent)
    %% Portfolio owns Holdings (lifecycle dependent)
    %% ============================================
    User *-- Account : composition
    User *-- Portfolio : composition
    Portfolio *-- Holding : composition

    %% ============================================
    %% RELATIONSHIPS - AGGREGATION (o--)
    %% Watchlist aggregates Stock symbols
    %% ============================================
    Watchlist o-- Stock : aggregation

    %% ============================================
    %% RELATIONSHIPS - ASSOCIATION (-->)
    %% Simple references between entities
    %% ============================================
    Account --> User : userId references
    Portfolio --> User : userId references
    Holding --> User : userId references
    Holding --> Stock : stockSymbol references
    Order --> User : userId references
    Order --> Stock : stockSymbol references
    Trade --> User : userId references
    Trade --> Order : orderId references
    Trade --> Stock : stockSymbol references
    Transaction --> User : userId references
    Watchlist --> User : userId references

    %% ============================================
    %% RELATIONSHIPS - SERVICES TO REPOSITORIES
    %% ============================================
    OrderService --> OrderRepository : uses
    OrderService --> AccountRepository : uses
    OrderService --> PortfolioRepository : uses
    OrderService --> TradeRepository : uses
    OrderService --> StockRepository : uses
    OrderService --> ExchangeGateway : uses
    OrderService --> MarketDataService : uses
    OrderService --> AccountService : uses
    OrderService --> PortfolioService : uses
    OrderService --> IOrderValidationStrategy : uses
    OrderService ..> Order : creates/manages
    OrderService ..> Trade : creates

    AccountService --> AccountRepository : uses
    AccountService --> TransactionRepository : uses
    AccountService ..> Account : creates/manages
    AccountService ..> Transaction : creates

    PortfolioService --> PortfolioRepository : uses
    PortfolioService --> TradeRepository : uses
    PortfolioService --> MarketDataService : uses
    PortfolioService ..> Portfolio : manages

    WatchlistService --> WatchlistRepository : uses
    WatchlistService --> StockRepository : uses
    WatchlistService ..> Watchlist : creates/manages

    MarketDataService --> StockRepository : uses
    MarketDataService ..> Stock : manages

    ExchangeGateway --> MarketDataService : uses
    ExchangeGateway --> ChargeCalculatorService : uses
    ExchangeGateway ..> Trade : creates

    MainController --> AccountService : uses
    MainController --> OrderService : uses
    MainController --> PortfolioService : uses
    MainController --> WatchlistService : uses
    MainController --> MarketDataService : uses

    %% ============================================
    %% RELATIONSHIPS - REPOSITORY IMPLEMENTATIONS
    %% ============================================
    UserRepository ..|> IRepository : implements
    AccountRepository ..|> IRepository : implements
    PortfolioRepository ..|> IRepository : implements
    OrderRepository ..|> IRepository : implements
    TradeRepository ..|> IRepository : implements
    StockRepository ..|> IRepository : implements
    WatchlistRepository ..|> IRepository : implements
    TransactionRepository ..|> IRepository : implements

    %% ============================================
    %% RELATIONSHIPS - REPOSITORIES TO DATABASE
    %% ============================================
    UserRepository --> InMemoryDatabase : uses
    AccountRepository --> InMemoryDatabase : uses
    PortfolioRepository --> InMemoryDatabase : uses
    OrderRepository --> InMemoryDatabase : uses
    TradeRepository --> InMemoryDatabase : uses
    StockRepository --> InMemoryDatabase : uses
    WatchlistRepository --> InMemoryDatabase : uses
    TransactionRepository --> InMemoryDatabase : uses

    %% ============================================
    %% RELATIONSHIPS - STRATEGY PATTERN
    %% ============================================
    MarketOrderValidationStrategy ..|> IOrderValidationStrategy : implements
    LimitOrderValidationStrategy ..|> IOrderValidationStrategy : implements
    StopLossOrderValidationStrategy ..|> IOrderValidationStrategy : implements

    %% ============================================
    %% RELATIONSHIPS - FACTORY PATTERN
    %% ============================================
    OrderFactory ..> Order : creates
    OrderFactory --> OrderRequest : uses
```

## UML Relationship Types Explained

### 1. Composition (*--)
**Meaning**: Strong ownership - child cannot exist without parent
- **User *-- Account**: Account belongs to User, destroyed when User is deleted
- **User *-- Portfolio**: Portfolio belongs to User, removed with User
- **Portfolio *-- Holding**: Holdings are part of Portfolio, removed when Portfolio is deleted

### 2. Aggregation (o--)
**Meaning**: Weak ownership - child can exist independently
- **Watchlist o-- Stock**: Watchlist contains Stock references, but Stocks exist independently

### 3. Association (-->)
**Meaning**: Simple relationship or reference
- **Order --> User**: Order references its user
- **Order --> Stock**: Order references a stock
- **Trade --> Order**: Trade references an order
- **Holding --> Stock**: Holding references a stock

### 4. Dependency (..>)
**Meaning**: One class uses another (creates, manages, or depends on)
- **OrderService ..> Order**: Service creates and manages Order instances
- **OrderFactory ..> Order**: Factory creates Order instances
- **ExchangeGateway ..> Trade**: Creates Trade objects after execution

### 5. Implementation (..|>)
**Meaning**: Class implements an interface
- **UserRepository ..|> IRepository**: Implements repository interface
- **MarketOrderValidationStrategy ..|> IOrderValidationStrategy**: Implements validation strategy

## Architecture Layers

### Presentation Layer
- ConsoleInterface (command-line interface)

### Controller Layer
- MainController (orchestrates services)

### Service Layer
- OrderService
- AccountService
- PortfolioService
- WatchlistService
- MarketDataService (Singleton)
- ExchangeGateway (Singleton)
- ChargeCalculatorService

### Repository Layer
- IRepository<T> (interface)
- UserRepository
- AccountRepository
- PortfolioRepository
- OrderRepository
- TradeRepository
- StockRepository
- WatchlistRepository
- TransactionRepository

### Model Layer
- User, Account, Portfolio, Holding
- Order, Trade, Stock
- Transaction, Watchlist

### Data Layer
- InMemoryDatabase (Singleton)

### Pattern Layer
- **Factory**: OrderFactory
- **Strategy**: IOrderValidationStrategy + 3 implementations

## Design Pattern Details

### 1. Singleton Pattern
**Classes**: InMemoryDatabase, ExchangeGateway, MarketDataService
**Purpose**: Ensure single instance across the application
**Benefits**: Centralized data storage, consistent state management

### 2. Repository Pattern
**Classes**: IRepository<T> interface + 8 implementations
**Purpose**: Abstract data access layer
**Benefits**: 
- Clean separation of concerns
- Easy to swap data sources
- Testable code

### 3. Factory Pattern
**Class**: OrderFactory
**Purpose**: Centralize complex order creation logic
**Methods**:
- createMarketOrder(): Creates market orders
- createLimitOrder(): Creates limit orders with price
- createStopLossOrder(): Creates stop-loss orders with trigger
- createFromRequest(): Generic creation from request object

### 4. Strategy Pattern
**Interface**: IOrderValidationStrategy
**Implementations**: 
- MarketOrderValidationStrategy
- LimitOrderValidationStrategy
- StopLossOrderValidationStrategy
**Purpose**: Encapsulate different order validation algorithms
**Benefits**: 
- Easy to add new order types
- Swap validation logic at runtime
- Single Responsibility Principle

## Key Features

### Order Management
- Multiple order types (Market, Limit, Stop-Loss, Bracket, Cover)
- Order validation with strategy pattern
- Exchange integration simulation
- Order lifecycle tracking

### Portfolio Management
- Real-time holdings tracking
- Average buy price calculation
- Unrealized P&L calculation
- Portfolio diversification tracking

### Account Management
- Balance tracking
- Fund blocking for pending orders
- Transaction history
- Deposit/Withdrawal operations

### Trading Operations
- Buy/Sell execution
- Brokerage and tax calculation
- Trade settlement
- Realized P&L tracking

### Market Data
- Real-time price updates
- Stock search and filtering
- Sector-based categorization
- Price history tracking

### Watchlist
- Create custom watchlists
- Add/Remove stocks
- Track multiple watchlists per user

## Key Statistics

- **Total Classes**: 45+
- **Models**: 9 core domain models
- **Services**: 7 service classes
- **Repositories**: 8 + 1 interface
- **Design Patterns**: 4 patterns
- **Strategy Implementations**: 3
- **Enums**: 6
- **Singletons**: 3

## Relationship Summary

| Relationship Type | Count | Usage |
|------------------|-------|-------|
| Composition (*--) | 3 | Strong ownership |
| Aggregation (o--) | 1 | Weak ownership |
| Association (-->) | 15+ | References |
| Dependency (..>) | 12+ | Usage/Creation |
| Implementation (..\|>) | 11 | Interface implementation |

## Business Flow

### Order Placement Flow
1. User places order via MainController
2. OrderService validates using Strategy pattern
3. OrderFactory creates appropriate Order instance
4. Account funds blocked (for BUY)
5. Order sent to ExchangeGateway
6. Order executed → Trade created
7. Portfolio updated with new holdings
8. Account settled (funds deducted/credited)
9. Transaction recorded

### Portfolio Update Flow
1. Trade executed
2. PortfolioService receives Trade
3. Portfolio holdings updated
4. Average buy price recalculated
5. P&L calculated with MarketDataService

### Market Data Flow
1. Stock prices updated in MarketDataService
2. ExchangeGateway simulates trades
3. StockRepository stores updates
4. Real-time price available for quotes

