# STOCK BROKER (ZERODHA) - Class Diagram

## Core Domain Classes

### User
- id: string
- name: string
- email: string
- pan: string
- bankAccountNumber: string
- createdAt: Date
- updatedAt: Date
- Methods:
  - constructor(name: string, email: string, pan: string, bankAccountNumber: string, id?: string)
  - updateProfile(name?: string, email?: string, bankAccountNumber?: string): void
  - getMaskedBankAccount(): string

### Account
- id: string
- userId: string
- balance: number
- blockedAmount: number
- createdAt: Date
- updatedAt: Date
- Methods:
  - constructor(userId: string, initialBalance?: number, id?: string)
  - credit(amount: number): void
  - debit(amount: number): void
  - canBlockAmount(amount: number): boolean
  - blockAmount(amount: number): void
  - releaseBlockedAmount(amount: number): void
  - getAvailableBalance(): number

### Stock
- symbol: string
- companyName: string
- sector: string
- lastTradedPrice: number
- dayOpenPrice: number
- dayHighPrice: number
- dayLowPrice: number
- previousClosePrice: number
- dayVolume: number
- lastUpdatedAt: Date
- Methods:
  - constructor(symbol: string, companyName: string, sector: string, lastTradedPrice: number)
  - updatePrice(newPrice: number, volume: number): void
  - getDayChange(): number
  - getDayChangePercentage(): number

### Holding
- id: string
- userId: string
- stockSymbol: string
- quantity: number
- averageBuyPrice: number
- createdAt: Date
- updatedAt: Date
- Methods:
  - constructor(userId: string, stockSymbol: string, quantity: number, avgPrice: number, id?: string)
  - addQuantity(quantity: number, price: number): void
  - reduceQuantity(quantity: number): void
  - getCurrentValue(currentPrice: number): number

### Portfolio
- id: string
- userId: string
- holdings: Map<string, Holding>
- createdAt: Date
- updatedAt: Date
- Methods:
  - constructor(userId: string, id?: string)
  - addOrUpdateHolding(stockSymbol: string, quantity: number, price: number): void
  - reduceHolding(stockSymbol: string, quantity: number): void
  - getTotalCurrentValue(priceProvider: (symbol: string) => number): number
  - getTotalInvestedAmount(): number
  - getUnrealizedPnL(priceProvider: (symbol: string) => number): number

### Order
- id: string
- userId: string
- stockSymbol: string
- orderType: OrderType (MARKET, LIMIT, STOP_LOSS, BRACKET, COVER)
- side: OrderSide (BUY, SELL)
- quantity: number
- price: number | null
- triggerPrice: number | null
- status: OrderStatus (PENDING, SENT_TO_EXCHANGE, EXECUTED, CANCELLED, REJECTED)
- validity: OrderValidity (DAY, GTC, IOC)
- createdAt: Date
- updatedAt: Date
- exchangeOrderId: string | null
- remarks: string | null
- Methods:
  - constructor(userId: string, stockSymbol: string, orderType: OrderType, side: OrderSide, quantity: number, price?: number | null, triggerPrice?: number | null, validity?: OrderValidity, id?: string)
  - markSentToExchange(exchangeOrderId: string): void
  - markExecuted(): void
  - markCancelled(remarks?: string): void
  - markRejected(remarks: string): void
  - isActive(): boolean

### Trade
- id: string
- userId: string
- orderId: string
- stockSymbol: string
- side: OrderSide
- quantity: number
- price: number
- executedAt: Date
- brokerage: number
- taxes: number
- totalCharges: number
- Methods:
  - constructor(userId: string, orderId: string, stockSymbol: string, side: OrderSide, quantity: number, price: number, brokerage: number, taxes: number, id?: string)
  - getTradeValue(): number
  - getNetAmount(): number

### Watchlist
- id: string
- userId: string
- name: string
- stockSymbols: Set<string>
- createdAt: Date
- updatedAt: Date
- Methods:
  - constructor(userId: string, name: string, id?: string)
  - addStock(symbol: string): void
  - removeStock(symbol: string): void
  - hasStock(symbol: string): boolean

### Transaction
- id: string
- userId: string
- type: TransactionType (DEPOSIT, WITHDRAWAL, CHARGE, ADJUSTMENT)
- amount: number
- createdAt: Date
- description: string
- Methods:
  - constructor(userId: string, type: TransactionType, amount: number, description: string, id?: string)

## Service and Helper Classes

### MarketDataService (Singleton)
- stocks: Map<string, Stock>
- Methods:
  - static getInstance(): MarketDataService
  - addStock(stock: Stock): void
  - getStock(symbol: string): Stock | undefined
  - updateStockPrice(symbol: string, price: number, volume: number): void
  - getCurrentPrice(symbol: string): number
  - getTopGainers(limit: number): Stock[]
  - getTopLosers(limit: number): Stock[]

### ExchangeGateway (Singleton)
- Methods:
  - static getInstance(): ExchangeGateway
  - sendOrder(order: Order): string  // returns exchangeOrderId
  - cancelOrder(exchangeOrderId: string): boolean
  - getOrderStatus(exchangeOrderId: string): OrderStatus
  - simulateExecution(order: Order): Trade | null

### OrderValidationService
- Methods:
  - validateOrder(order: Order, account: Account, holdings: Portfolio | null): void  // throws on invalid

### ChargeCalculatorService
- Methods:
  - calculateBrokerage(tradeValue: number, side: OrderSide): number
  - calculateTaxes(tradeValue: number): number
  - calculateTotalCharges(tradeValue: number, side: OrderSide): number

### OrderService
- accountRepository: AccountRepository
- orderRepository: OrderRepository
- portfolioRepository: PortfolioRepository
- tradeRepository: TradeRepository
- chargeCalculatorService: ChargeCalculatorService
- exchangeGateway: ExchangeGateway
- orderValidationService: OrderValidationService
- Methods:
  - placeOrder(orderRequest: OrderRequest): Order
  - cancelOrder(userId: string, orderId: string): void
  - getOrdersForUser(userId: string): Order[]
  - getOpenOrdersForUser(userId: string): Order[]
  - handleExchangeCallback(exchangeOrderId: string, status: OrderStatus): void

### PortfolioService
- portfolioRepository: PortfolioRepository
- tradeRepository: TradeRepository
- Methods:
  - getPortfolio(userId: string): Portfolio
  - updateHoldingsFromTrade(trade: Trade): void
  - getPortfolioSummary(userId: string): PortfolioSummary

### WatchlistService
- watchlistRepository: WatchlistRepository
- marketDataService: MarketDataService
- Methods:
  - createWatchlist(userId: string, name: string): Watchlist
  - addStockToWatchlist(watchlistId: string, symbol: string): void
  - removeStockFromWatchlist(watchlistId: string, symbol: string): void
  - getWatchlistsForUser(userId: string): Watchlist[]
  - getWatchlistView(watchlistId: string): WatchlistStockView[]

### AccountService
- accountRepository: AccountRepository
- transactionRepository: TransactionRepository
- Methods:
  - getAccount(userId: string): Account
  - deposit(userId: string, amount: number): Transaction
  - withdraw(userId: string, amount: number): Transaction
  - getTransactions(userId: string): Transaction[]

### ReportingService
- tradeRepository: TradeRepository
- portfolioRepository: PortfolioRepository
- transactionRepository: TransactionRepository
- Methods:
  - generatePnLReport(userId: string, from: Date, to: Date): PnLReport
  - generateTaxReport(userId: string, financialYear: string): TaxReport
  - generateTradeHistory(userId: string, from: Date, to: Date): Trade[]

### MainController (Singleton)
- orderService: OrderService
- portfolioService: PortfolioService
- accountService: AccountService
- watchlistService: WatchlistService
- reportingService: ReportingService
- Methods:
  - static getInstance(): MainController
  - placeOrderForUser(userId: string, orderRequest: OrderRequest): Order
  - cancelUserOrder(userId: string, orderId: string): void
  - getUserPortfolioSummary(userId: string): PortfolioSummary
  - getUserReports(userId: string, type: ReportType, params: any): any

## Repository Interfaces

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
- Methods:
  - findByEmail(email: string): User | undefined

### AccountRepository implements IRepository<Account>
- Methods:
  - findByUserId(userId: string): Account | undefined

### StockRepository implements IRepository<Stock>
- Methods:
  - findBySymbol(symbol: string): Stock | undefined
  - findBySector(sector: string): Stock[]

### OrderRepository implements IRepository<Order>
- Methods:
  - findByUserId(userId: string): Order[]
  - findOpenOrdersByUser(userId: string): Order[]
  - findByExchangeOrderId(exchangeOrderId: string): Order | undefined

### TradeRepository implements IRepository<Trade>
- Methods:
  - findByUserId(userId: string): Trade[]
  - findByOrderId(orderId: string): Trade[]

### PortfolioRepository implements IRepository<Portfolio>
- Methods:
  - findByUserId(userId: string): Portfolio | undefined

### WatchlistRepository implements IRepository<Watchlist>
- Methods:
  - findByUserId(userId: string): Watchlist[]

### TransactionRepository implements IRepository<Transaction>
- Methods:
  - findByUserId(userId: string): Transaction[]

## Design Patterns Applied

- Singleton: MarketDataService, ExchangeGateway, MainController
- Strategy: OrderType handling encapsulated via OrderValidation and ExchangeGateway strategies if extended
- State: Order status transitions (PENDING → SENT_TO_EXCHANGE → EXECUTED/CANCELLED/REJECTED)
- Factory: Order creation via higher-level factory method (in OrderService or dedicated OrderFactory)
- Repository: For all persistence/in-memory access of domain entities
- Facade: MainController acts as a facade over services for the console interface

## Relationships

- User (1) → (1) Account
- User (1) → (M) Order
- User (1) → (M) Trade
- User (1) → (1) Portfolio
- User (1) → (M) Watchlist
- Account (1) → (M) Transaction
- Portfolio (1) → (M) Holding
- Stock (1) → (M) Holding
- Stock (1) → (M) Order
- Order (1) → (M) Trade
- Services → use Repositories and Domain Models
- ConsoleInterface → uses MainController
