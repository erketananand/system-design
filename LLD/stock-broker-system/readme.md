# Stock Broker (Zerodha) - LLD Implementation

A comprehensive stock brokerage platform implementation demonstrating Low-Level Design principles with TypeScript.

## 🎯 Features

### Primary Features
- **User Account Management**: Registration, login, fund deposits/withdrawals
- **Stock Order Management**: Market, Limit, Stop-Loss orders with validation
- **Portfolio Management**: Holdings tracking, P&L calculations, performance metrics
- **Market Data**: Real-time stock prices, sector-wise browsing
- **Order Book & Trade History**: Complete order lifecycle tracking
- **Watchlist Management**: Custom watchlists with price alerts

### Secondary Features
- Advanced order types (Bracket, Cover, GTC, IOC)
- Reporting & Analytics (P&L statements, tax reports)
- Charges & Fee Management (Brokerage, STT, GST calculations)

## 🏗️ Architecture

### Design Patterns
- **Singleton**: MarketDataService, ExchangeGateway, MainController
- **Strategy**: Order execution strategies
- **State**: Order lifecycle management
- **Factory**: Order creation
- **Repository**: Data access abstraction
- **Observer**: Market data updates

### Layers
```
Console Interface
      ↓
Main Controller (Facade)
      ↓
Services (Business Logic)
      ↓
Repositories (Data Access)
      ↓
In-Memory Database
```

## 📦 Project Structure

```
src/
├── enums/              # Type-safe enumerations
├── utils/              # Utility classes (IdGenerator, Logger)
├── models/             # Domain entities
├── states/             # State pattern implementations
├── strategies/         # Strategy pattern implementations
├── factories/          # Factory pattern implementations
├── database/           # In-memory database
├── repositories/       # Data access layer
├── services/           # Business logic
└── console/            # CLI interface
```

## 🚀 Quick Start

### Installation
```bash
npm install
```

### Build
```bash
npm run build
```

### Run
```bash
npm start
```

### Development Mode
```bash
npm run dev
```

## 💻 Usage

### Main Menu
1. **User Management**: Register, login, manage account
2. **Market Data**: Browse stocks, view prices
3. **Trading**: Place orders, manage positions
4. **Portfolio**: View holdings, track P&L
5. **Watchlist**: Create and manage watchlists
6. **Reports**: Generate statements and analytics

### Sample Workflow
```
1. Register new user
2. Add funds to account
3. Browse available stocks
4. Create watchlist
5. Place buy order
6. View order status
7. Check portfolio
8. Generate P&L report
```

## 🔧 Configuration

### Pre-loaded Stocks
System includes 25 Indian stocks across sectors:
- Technology (TCS, INFY, WIPRO)
- Banking (HDFC, ICICI, SBI)
- Energy (RELIANCE)
- Consumer (HINDUNILVR, ITC)
- Auto (MARUTI, TATAMOTORS)

### Trading Parameters
- Minimum order quantity: 1
- Brokerage: 0.03% (configurable)
- STT: 0.025% on sell side
- GST: 18% on brokerage

## 📊 Data Models

### Core Entities
- User, Account, Stock, Order, Trade
- Portfolio, Holding, Watchlist, Transaction

### Services
- OrderService, PortfolioService, WatchlistService
- AccountService, ReportingService
- MarketDataService, ExchangeGateway

## 🧪 Example Operations

### Place Order
```typescript
// Market order
orderService.placeOrder({
  userId: 'user-123',
  stockSymbol: 'RELIANCE',
  orderType: OrderType.MARKET,
  side: OrderSide.BUY,
  quantity: 10
});
```

### Check Portfolio
```typescript
const summary = portfolioService.getPortfolioSummary('user-123');
console.log(`Total Value: ₹${summary.totalValue}`);
console.log(`P&L: ₹${summary.totalPnL}`);
```

## 📈 System Capabilities

- **Users**: Unlimited
- **Stocks**: 25 pre-loaded (extensible)
- **Orders**: Unlimited (in-memory)
- **Watchlists**: Multiple per user
- **Real-time Updates**: Simulated market data

## 🎓 Design Principles

- **SOLID Principles**: Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion
- **DRY**: Don't repeat yourself
- **KISS**: Keep it simple, stupid
- **Clean Code**: Meaningful names, small functions, proper abstraction

## 📝 Notes

- This is a demonstration project for LLD interviews
- Exchange simulation runs in-memory (not connected to real exchanges)
- Settlement is T+0 (simplified from real T+2)
- No external API integrations required
- All operations are synchronous for simplicity

## 🤝 Contributing

This is an educational project. Feel free to extend with:
- Additional order types
- More advanced analytics
- WebSocket support for real-time updates
- REST API layer
- Database persistence

## 📄 License

MIT License - Feel free to use for learning and interviews

---

**Built with ❤️ for LLD Interview Preparation**
