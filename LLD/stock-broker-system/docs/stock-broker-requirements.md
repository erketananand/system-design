# STOCK BROKER (ZERODHA) - REQUIREMENTS DOCUMENT

## PROJECT SCOPE
A comprehensive online stock brokerage platform that enables users to manage their trading accounts, place orders with stock exchanges (NSE/BSE), track portfolios, create watchlists, and analyze their trading performance. The system acts as an intermediary between traders and stock exchanges, focusing on order management, portfolio tracking, and user experience.

---

## PRIMARY FEATURES (CORE/MVP)

### 1. User Account Management
- Register new trading accounts with KYC details (name, email, PAN, bank account)
- Login/Logout with secure authentication
- View account balance and available funds
- Add funds to trading account (deposit)
- Withdraw funds from trading account
- Track transaction history (deposits, withdrawals, charges)

### 2. Stock Order Management
- Place market orders (buy/sell at current market price)
- Place limit orders (buy/sell at specified price)
- Place stop-loss orders for risk management
- Modify pending orders (price, quantity)
- Cancel pending orders before execution
- View order status (PENDING, EXECUTED, CANCELLED, REJECTED)
- Order validation (sufficient funds, valid quantity, price range)

### 3. Portfolio Management
- View current holdings with quantity, average buy price, and current value
- Track portfolio total value and invested amount
- Calculate profit/loss for each holding (realized and unrealized)
- View portfolio performance metrics (total P&L, day's P&L, return %)
- Display portfolio distribution across sectors/industries
- Show cost basis and current market value

### 4. Market Data & Stock Information
- View real-time stock prices (fetched from simulated exchange)
- Display stock details (symbol, company name, sector, current price, day change %)
- Show available stocks for trading with market depth
- Browse stocks by sector/industry
- View stock price history and trends
- Display market indices (NIFTY50, SENSEX) - informational

### 5. Order Book & Trade History
- View all orders placed (open, executed, cancelled)
- Filter orders by status, date range, stock symbol
- Display order details (type, quantity, price, timestamp, status)
- Track executed trades with execution price and time
- View trade confirmations and transaction details
- Calculate brokerage charges and taxes per trade

### 6. Watchlist Management
- Create multiple custom watchlists (e.g., "Tech Stocks", "Long-term Picks")
- Add/remove stocks to watchlists
- View real-time prices for watchlist stocks
- Track price changes and percentage movements
- Set price alerts for stocks (notify when target price reached)
- Quickly place orders from watchlist

---

## SECONDARY FEATURES

### 1. Advanced Order Types
- Bracket orders (entry order with target and stop-loss)
- Cover orders (market order with mandatory stop-loss)
- After-market orders (AMO) for next trading session
- Good-Till-Cancelled (GTC) orders (valid for multiple days)
- Immediate-or-Cancel (IOC) orders (execute immediately or cancel)
- Day orders (valid only for current trading day)

### 2. Reporting & Analytics
- Generate profit/loss statements (daily, monthly, yearly)
- Tax reports for capital gains (short-term and long-term)
- Transaction history export (CSV, PDF)
- Portfolio performance analytics (return %, volatility)
- Sector-wise allocation reports
- Dividend tracking and reporting

### 3. Charges & Fee Management
- Calculate and display brokerage charges per trade
- Show STT (Securities Transaction Tax)
- Display GST on brokerage
- Track stamp duty and other regulatory charges
- Generate monthly/yearly charge statements
- Compare charges across different order types

---

## FUTURE ENHANCEMENTS

### 1. Margin Trading & Leverage
- Intraday trading with margin (up to 5x leverage)
- Margin requirement calculations
- Margin pledge and unpledge
- Auto-square-off for open intraday positions
- Interest calculation on margin used
- Risk management and exposure limits

### 2. Derivatives Trading
- Support for futures and options trading
- Options chain display with Greeks
- Strike price selection and analysis
- Expiry date management
- Premium calculations
- Options strategy builder

### 3. Algorithmic Trading & API
- REST API for order placement
- WebSocket for real-time market data
- Strategy backtesting capabilities
- Auto-execution based on technical indicators
- Trading bot integration
- Rate limits and risk controls for API access

---

## KEY DESIGN NOTES

### Design Decisions
- **Broker role focus**: System acts as intermediary, not an exchange
- **Exchange simulation**: Simulated exchange API for order execution
- **Account isolation**: Each user has separate trading account and portfolio
- **Order forwarding**: Orders sent to exchange for matching and execution
- **Real-time updates**: Market data and order status updates via polling/events
- **Charge calculation**: Automatic calculation of all trading charges

### Constraints & Assumptions
- Exchange simulation in-memory (represents NSE/BSE API)
- Trading hours: System operates 24/7 (no market hours restriction for demo)
- Instant order acknowledgment: Orders acknowledged immediately
- Settlement: T+0 simplified (actual markets use T+2)
- Pre-loaded stocks: 20-30 stocks available for trading
- Simplified KYC: Basic user details without actual verification
- No external integrations: Payment gateway and exchange API simulated

### Design Patterns to Apply
- **Singleton**: AccountManager, ExchangeGateway, MarketDataService
- **Strategy**: Different order type strategies (Market, Limit, StopLoss, Bracket, Cover)
- **State**: Order lifecycle states (PENDING → SENT_TO_EXCHANGE → EXECUTED/CANCELLED/REJECTED)
- **Factory**: Order creation factory for different order types
- **Observer**: Market data updates notify watchlists and portfolio trackers
- **Command**: Order placement/cancellation commands with audit trail
- **Repository**: Data access layer for all entities

---

## IMPLEMENTATION DETAILS

### Technology Stack
- **Language**: Node.js with TypeScript
- **Interface**: Console-based interactive CLI with dynamic input
- **Storage**: In-memory data structures (Maps, Arrays)
- **Architecture**: Layered architecture
  - Models (User, Stock, Order, Portfolio, Trade, Watchlist, Transaction)
  - Repositories (Data access layer)
  - Services (Business logic)
  - Gateway (Exchange communication simulation)
  - Console (User interaction)

### Data Layer
- **Users**: Map (userId → User)
- **Accounts**: Map (userId → Account) - balance, transactions
- **Stocks**: Map (symbol → Stock) - market data
- **Orders**: Map (orderId → Order) - user orders
- **Portfolios**: Map (userId → Portfolio) - holdings
- **Trades**: Map (tradeId → Trade) - executed trades
- **Watchlists**: Map (watchlistId → Watchlist) - custom lists
- **Transactions**: Map (transactionId → Transaction) - fund movements

### Core Workflows
1. **User Registration → Login → Add Funds to Account**
2. **Browse Stocks → Add to Watchlist → Monitor Prices**
3. **View Stock → Place Order → Send to Exchange → Order Executed → Update Portfolio**
4. **View Portfolio → Check Holdings → Track P&L → Generate Reports**
5. **View Order Book → Track Order Status → View Trade History**

### Key Components
- **ExchangeGateway**: Simulates communication with NSE/BSE
- **OrderService**: Validates and manages user orders
- **PortfolioService**: Tracks holdings and calculates P&L
- **MarketDataService**: Provides real-time stock prices
- **WatchlistService**: Manages user watchlists
- **AccountService**: Handles funds and transactions
- **ReportingService**: Generates analytics and reports

---

✅ **Document Status:** Complete and ready for Class Diagram phase
