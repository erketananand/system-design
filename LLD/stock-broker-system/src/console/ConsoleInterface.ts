import * as readline from 'readline';
import { MainController } from '../services/MainController';
import { User } from '../models/User';
import { OrderType } from '../enums/OrderType';
import { OrderSide } from '../enums/OrderSide';
import { OrderValidity } from '../enums/OrderValidity';
import { Logger } from '../utils/Logger';

export class ConsoleInterface {
  private controller: MainController;
  private currentUser: User | null = null;

  private rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  constructor() {
    this.controller = MainController.getInstance();
  }

  public async start(): Promise<void> {
    this.printWelcome();

    // Initialize system with sample stocks
    this.controller.initializeSystem();

    await this.mainMenu();
  }

  private printWelcome(): void {
    Logger.clear();
    Logger.separator('=', 80);
    console.log('                    STOCK BROKER (ZERODHA) - LLD SYSTEM');
    Logger.separator('=', 80);
    console.log('  Design Patterns: Singleton, Strategy, Factory, Repository, Observer, Facade');
    console.log('  Technology: Node.js + TypeScript');
    console.log('  Features: Order Management, Portfolio Tracking, Watchlists, Market Data');
    Logger.separator('=', 80);
    console.log('');
  }

  private async mainMenu(): Promise<void> {
    while (true) {
      console.log('\n' + '='.repeat(80));
      console.log('MAIN MENU');
      console.log('='.repeat(80));

      if (this.currentUser) {
        console.log(`Logged in as: ${this.currentUser.name} (${this.currentUser.email})`);
        console.log('');
        console.log('1. Account Management');
        console.log('2. Browse Market');
        console.log('3. Place Order');
        console.log('4. View Orders');
        console.log('5. View Portfolio');
        console.log('6. Manage Watchlists');
        console.log('7. Logout');
        console.log('8. Exit');
      } else {
        console.log('1. Register');
        console.log('2. Login');
        console.log('3. Browse Market (Guest)');
        console.log('4. Exit');
      }
      console.log('');

      const choice = await this.prompt('Enter your choice: ');

      try {
        if (this.currentUser) {
          await this.handleLoggedInMenu(choice);
        } else {
          await this.handleGuestMenu(choice);
        }
      } catch (error: any) {
        Logger.error('Error: ' + error.message);
        await this.prompt('Press Enter to continue...');
      }
    }
  }

  private async handleGuestMenu(choice: string): Promise<void> {
    switch (choice) {
      case '1':
        await this.registerUser();
        break;
      case '2':
        await this.loginUser();
        break;
      case '3':
        await this.browseMarket();
        break;
      case '4':
        console.log('\nThank you for using Stock Broker System!\n');
        this.rl.close();
        process.exit(0);
      default:
        console.log('Invalid choice!');
    }
  }

  private async handleLoggedInMenu(choice: string): Promise<void> {
    switch (choice) {
      case '1':
        await this.accountManagement();
        break;
      case '2':
        await this.browseMarket();
        break;
      case '3':
        await this.placeOrder();
        break;
      case '4':
        await this.viewOrders();
        break;
      case '5':
        await this.viewPortfolio();
        break;
      case '6':
        await this.manageWatchlists();
        break;
      case '7':
        this.currentUser = null;
        Logger.success('Logged out successfully');
        break;
      case '8':
        console.log('\nThank you for using Stock Broker System!\n');
        this.rl.close();
        process.exit(0);
      default:
        console.log('Invalid choice!');
    }
  }

  // ==================== USER MANAGEMENT ====================

  private async registerUser(): Promise<void> {
    console.log('\n--- USER REGISTRATION ---');

    const name = await this.prompt('Enter your name: ');
    const email = await this.prompt('Enter your email: ');
    const pan = await this.prompt('Enter your PAN: ');
    const bankAccount = await this.prompt('Enter your bank account number: ');

    try {
      const user = this.controller.registerUser(name, email, pan.toUpperCase(), bankAccount);
      Logger.success(`Registration successful! User ID: ${user.id}`);
      this.currentUser = user;
    } catch (error: any) {
      Logger.error('Registration failed: ' + error.message);
    }

    await this.prompt('Press Enter to continue...');
  }

  private async loginUser(): Promise<void> {
    console.log('\n--- LOGIN ---');

    const email = await this.prompt('Enter your email: ');
    const user = this.controller.getUserByEmail(email);

    if (user) {
      this.currentUser = user;
      Logger.success(`Welcome back, ${user.name}!`);
    } else {
      Logger.error('User not found');
    }

    await this.prompt('Press Enter to continue...');
  }

  // ==================== ACCOUNT MANAGEMENT ====================

  private async accountManagement(): Promise<void> {
    if (!this.currentUser) return;

    while (true) {
      console.log('\n--- ACCOUNT MANAGEMENT ---');

      const balance = this.controller.getAccountBalance(this.currentUser.id);
      console.log(`\nCurrent Balance: ₹${balance.balance.toFixed(2)}`);
      console.log(`Available: ₹${balance.available.toFixed(2)}`);
      console.log(`Blocked: ₹${balance.blocked.toFixed(2)}`);
      console.log('');
      console.log('1. Deposit Funds');
      console.log('2. Withdraw Funds');
      console.log('3. View Transaction History');
      console.log('4. Back to Main Menu');
      console.log('');

      const choice = await this.prompt('Enter your choice: ');

      try {
        switch (choice) {
          case '1':
            await this.depositFunds();
            break;
          case '2':
            await this.withdrawFunds();
            break;
          case '3':
            await this.viewTransactionHistory();
            break;
          case '4':
            return;
          default:
            console.log('Invalid choice!');
        }
      } catch (error: any) {
        Logger.error('Error: ' + error.message);
        await this.prompt('Press Enter to continue...');
      }
    }
  }

  private async depositFunds(): Promise<void> {
    if (!this.currentUser) return;

    const amountStr = await this.prompt('Enter deposit amount: ₹');
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) {
      Logger.error('Invalid amount');
      return;
    }

    const txn = this.controller.deposit(this.currentUser.id, amount);
    Logger.success(`Deposited ₹${amount.toFixed(2)} successfully!`);
    console.log(`Transaction ID: ${txn.id}`);

    await this.prompt('Press Enter to continue...');
  }

  private async withdrawFunds(): Promise<void> {
    if (!this.currentUser) return;

    const amountStr = await this.prompt('Enter withdrawal amount: ₹');
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) {
      Logger.error('Invalid amount');
      return;
    }

    const txn = this.controller.withdraw(this.currentUser.id, amount);
    Logger.success(`Withdrew ₹${amount.toFixed(2)} successfully!`);
    console.log(`Transaction ID: ${txn.id}`);

    await this.prompt('Press Enter to continue...');
  }

  private async viewTransactionHistory(): Promise<void> {
    if (!this.currentUser) return;

    const transactions = this.controller.getTransactionHistory(this.currentUser.id, 20);

    console.log('\n--- RECENT TRANSACTIONS ---');
    if (transactions.length === 0) {
      console.log('No transactions found.');
    } else {
      transactions.forEach((txn, index) => {
        console.log(`${index + 1}. ${txn.createdAt.toLocaleString()} - ${txn.getDisplayString()}`);
      });
    }

    await this.prompt('\nPress Enter to continue...');
  }

  // ==================== MARKET BROWSING ====================

  private async browseMarket(): Promise<void> {
    while (true) {
      console.log('\n--- MARKET DATA ---');
      console.log('1. View All Stocks');
      console.log('2. Search Stocks');
      console.log('3. Top Gainers');
      console.log('4. Top Losers');
      console.log('5. Most Active');
      console.log('6. Back');
      console.log('');

      const choice = await this.prompt('Enter your choice: ');

      try {
        switch (choice) {
          case '1':
            await this.viewAllStocks();
            break;
          case '2':
            await this.searchStocks();
            break;
          case '3':
            await this.viewTopGainers();
            break;
          case '4':
            await this.viewTopLosers();
            break;
          case '5':
            await this.viewMostActive();
            break;
          case '6':
            return;
          default:
            console.log('Invalid choice!');
        }
      } catch (error: any) {
        Logger.error('Error: ' + error.message);
        await this.prompt('Press Enter to continue...');
      }
    }
  }

  private async viewAllStocks(): Promise<void> {
    const stocks = this.controller.getAllStocks();

    console.log('\n--- ALL STOCKS ---');
    console.log('Symbol'.padEnd(15) + 'Company'.padEnd(30) + 'Price'.padEnd(12) + 'Change%');
    console.log('-'.repeat(70));

    stocks.forEach(stock => {
      const changeSign = stock.getDayChange() >= 0 ? '+' : '';
      console.log(
        stock.symbol.padEnd(15) +
        stock.companyName.substring(0, 28).padEnd(30) +
        `₹${stock.lastTradedPrice.toFixed(2)}`.padEnd(12) +
        `${changeSign}${stock.getDayChangePercentage().toFixed(2)}%`
      );
    });

    await this.prompt('\nPress Enter to continue...');
  }

  private async searchStocks(): Promise<void> {
    const query = await this.prompt('Enter stock symbol or company name: ');
    const stocks = this.controller.searchStocks(query);

    console.log(`\n--- SEARCH RESULTS (${stocks.length}) ---`);
    stocks.forEach(stock => {
      console.log(stock.getDisplayString());
    });

    await this.prompt('\nPress Enter to continue...');
  }

  private async viewTopGainers(): Promise<void> {
    const stocks = this.controller.getTopGainers(10);

    console.log('\n--- TOP 10 GAINERS ---');
    stocks.forEach((stock, index) => {
      console.log(`${index + 1}. ${stock.getDisplayString()}`);
    });

    await this.prompt('\nPress Enter to continue...');
  }

  private async viewTopLosers(): Promise<void> {
    const stocks = this.controller.getTopLosers(10);

    console.log('\n--- TOP 10 LOSERS ---');
    stocks.forEach((stock, index) => {
      console.log(`${index + 1}. ${stock.getDisplayString()}`);
    });

    await this.prompt('\nPress Enter to continue...');
  }

  private async viewMostActive(): Promise<void> {
    const stocks = this.controller.getMostActiveStocks(10);

    console.log('\n--- MOST ACTIVE STOCKS ---');
    stocks.forEach((stock, index) => {
      console.log(`${index + 1}. ${stock.symbol} - Volume: ${stock.dayVolume}`);
    });

    await this.prompt('\nPress Enter to continue...');
  }

  // ==================== ORDER PLACEMENT ====================

  private async placeOrder(): Promise<void> {
    if (!this.currentUser) return;

    console.log('\n--- PLACE ORDER ---');
    console.log('1. Market Order');
    console.log('2. Limit Order');
    console.log('3. Stop-Loss Order');
    console.log('4. Cancel');
    console.log('');

    const typeChoice = await this.prompt('Select order type: ');
    if (typeChoice === '4') return;

    const symbol = (await this.prompt('Enter stock symbol: ')).toUpperCase();
    const stock = this.controller.getStock(symbol);

    if (!stock) {
      Logger.error('Stock not found');
      await this.prompt('Press Enter to continue...');
      return;
    }

    console.log(`\nCurrent Price: ₹${stock.lastTradedPrice.toFixed(2)}`);

    const sideStr = await this.prompt('Enter side (BUY/SELL): ');
    const side = sideStr.toUpperCase() === 'BUY' ? OrderSide.BUY : OrderSide.SELL;

    const quantityStr = await this.prompt('Enter quantity: ');
    const quantity = parseInt(quantityStr);

    if (isNaN(quantity) || quantity <= 0) {
      Logger.error('Invalid quantity');
      await this.prompt('Press Enter to continue...');
      return;
    }

    try {
      let order;

      switch (typeChoice) {
        case '1': // Market Order
          order = this.controller.placeOrder({
            userId: this.currentUser.id,
            stockSymbol: symbol,
            orderType: OrderType.MARKET,
            side,
            quantity,
            validity: OrderValidity.DAY
          });
          break;

        case '2': // Limit Order
          const limitPriceStr = await this.prompt('Enter limit price: ₹');
          const limitPrice = parseFloat(limitPriceStr);

          order = this.controller.placeOrder({
            userId: this.currentUser.id,
            stockSymbol: symbol,
            orderType: OrderType.LIMIT,
            side,
            quantity,
            price: limitPrice,
            validity: OrderValidity.DAY
          });
          break;

        case '3': // Stop-Loss Order
          const triggerPriceStr = await this.prompt('Enter trigger price: ₹');
          const triggerPrice = parseFloat(triggerPriceStr);

          order = this.controller.placeOrder({
            userId: this.currentUser.id,
            stockSymbol: symbol,
            orderType: OrderType.STOP_LOSS,
            side,
            quantity,
            triggerPrice,
            validity: OrderValidity.DAY
          });
          break;

        default:
          Logger.error('Invalid order type');
          await this.prompt('Press Enter to continue...');
          return;
      }

      Logger.success(`Order placed successfully!`);
      console.log(`Order ID: ${order.id}`);
      console.log(`Status: ${order.status}`);

    } catch (error: any) {
      Logger.error('Order placement failed: ' + error.message);
    }

    await this.prompt('Press Enter to continue...');
  }

  // ==================== ORDER VIEWING ====================

  private async viewOrders(): Promise<void> {
    if (!this.currentUser) return;

    while (true) {
      console.log('\n--- ORDERS ---');
      console.log('1. View All Orders');
      console.log('2. View Open Orders');
      console.log('3. Cancel Order');
      console.log('4. Back');
      console.log('');

      const choice = await this.prompt('Enter your choice: ');

      try {
        switch (choice) {
          case '1':
            await this.viewAllOrders();
            break;
          case '2':
            await this.viewOpenOrders();
            break;
          case '3':
            await this.cancelOrder();
            break;
          case '4':
            return;
          default:
            console.log('Invalid choice!');
        }
      } catch (error: any) {
        Logger.error('Error: ' + error.message);
        await this.prompt('Press Enter to continue...');
      }
    }
  }

  private async viewAllOrders(): Promise<void> {
    if (!this.currentUser) return;

    const orders = this.controller.getUserOrders(this.currentUser.id);

    console.log('\n--- ALL ORDERS ---');
    if (orders.length === 0) {
      console.log('No orders found.');
    } else {
      orders.forEach((order, index) => {
        console.log(`${index + 1}. ${order.getDisplayString()} - ${order.createdAt.toLocaleString()}`);
      });
    }

    await this.prompt('\nPress Enter to continue...');
  }

  private async viewOpenOrders(): Promise<void> {
    if (!this.currentUser) return;

    const orders = this.controller.getOpenOrders(this.currentUser.id);

    console.log('\n--- OPEN ORDERS ---');
    if (orders.length === 0) {
      console.log('No open orders.');
    } else {
      orders.forEach((order, index) => {
        console.log(`${index + 1}. [${order.id}] ${order.getDisplayString()}`);
      });
    }

    await this.prompt('\nPress Enter to continue...');
  }

  private async cancelOrder(): Promise<void> {
    if (!this.currentUser) return;

    const orderId = await this.prompt('Enter order ID to cancel: ');

    this.controller.cancelOrder(this.currentUser.id, orderId);
    Logger.success('Order cancelled successfully');

    await this.prompt('Press Enter to continue...');
  }

  // ==================== PORTFOLIO ====================

  private async viewPortfolio(): Promise<void> {
    if (!this.currentUser) return;

    const summary = this.controller.getPortfolioSummary(this.currentUser.id);

    console.log('\n' + '='.repeat(80));
    console.log('PORTFOLIO SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Invested: ₹${summary.totalInvested.toFixed(2)}`);
    console.log(`Current Value: ₹${summary.currentValue.toFixed(2)}`);
    console.log(`Total P&L: ₹${summary.totalPnL.toFixed(2)} (${summary.totalPnLPercentage.toFixed(2)}%)`);
    console.log(`Holdings: ${summary.holdingsCount}`);
    console.log('');

    if (summary.holdings.length > 0) {
      console.log('Stock'.padEnd(12) + 'Qty'.padEnd(8) + 'Avg Price'.padEnd(12) + 
                  'Current'.padEnd(12) + 'P&L'.padEnd(15) + 'P&L%');
      console.log('-'.repeat(80));

      summary.holdings.forEach(holding => {
        const pnlSign = holding.unrealizedPnL >= 0 ? '+' : '';
        console.log(
          holding.stockSymbol.padEnd(12) +
          holding.quantity.toString().padEnd(8) +
          `₹${holding.averageBuyPrice.toFixed(2)}`.padEnd(12) +
          `₹${holding.currentPrice.toFixed(2)}`.padEnd(12) +
          `${pnlSign}₹${holding.unrealizedPnL.toFixed(2)}`.padEnd(15) +
          `${pnlSign}${holding.unrealizedPnLPercentage.toFixed(2)}%`
        );
      });
    } else {
      console.log('No holdings in portfolio.');
    }

    await this.prompt('\nPress Enter to continue...');
  }

  // ==================== WATCHLISTS ====================

  private async manageWatchlists(): Promise<void> {
    if (!this.currentUser) return;

    while (true) {
      console.log('\n--- WATCHLISTS ---');
      console.log('1. View Watchlists');
      console.log('2. Create Watchlist');
      console.log('3. Add Stock to Watchlist');
      console.log('4. Remove Stock from Watchlist');
      console.log('5. Delete Watchlist');
      console.log('6. Back');
      console.log('');

      const choice = await this.prompt('Enter your choice: ');

      try {
        switch (choice) {
          case '1':
            await this.viewWatchlists();
            break;
          case '2':
            await this.createWatchlist();
            break;
          case '3':
            await this.addToWatchlist();
            break;
          case '4':
            await this.removeFromWatchlist();
            break;
          case '5':
            await this.deleteWatchlist();
            break;
          case '6':
            return;
          default:
            console.log('Invalid choice!');
        }
      } catch (error: any) {
        Logger.error('Error: ' + error.message);
        await this.prompt('Press Enter to continue...');
      }
    }
  }

  private async viewWatchlists(): Promise<void> {
    if (!this.currentUser) return;

    const watchlists = this.controller.getUserWatchlists(this.currentUser.id);

    console.log('\n--- YOUR WATCHLISTS ---');
    if (watchlists.length === 0) {
      console.log('No watchlists found.');
    } else {
      for (const wl of watchlists) {
        console.log(`\n${wl.name} (ID: ${wl.id}) - ${wl.getStockCount()} stocks`);
        const view = this.controller.getWatchlistView(wl.id);
        view.forEach(stock => {
          const changeSign = stock.dayChange >= 0 ? '+' : '';
          console.log(`  ${stock.symbol.padEnd(12)} ₹${stock.currentPrice.toFixed(2).padEnd(10)} ${changeSign}${stock.dayChangePercentage.toFixed(2)}%`);
        });
      }
    }

    await this.prompt('\nPress Enter to continue...');
  }

  private async createWatchlist(): Promise<void> {
    if (!this.currentUser) return;

    const name = await this.prompt('Enter watchlist name: ');
    const watchlist = this.controller.createWatchlist(this.currentUser.id, name);
    Logger.success(`Watchlist '${name}' created! ID: ${watchlist.id}`);

    await this.prompt('Press Enter to continue...');
  }

  private async addToWatchlist(): Promise<void> {
    if (!this.currentUser) return;

    const watchlistId = await this.prompt('Enter watchlist ID: ');
    const symbol = (await this.prompt('Enter stock symbol: ')).toUpperCase();

    this.controller.addStockToWatchlist(watchlistId, symbol);
    Logger.success(`Added ${symbol} to watchlist`);

    await this.prompt('Press Enter to continue...');
  }

  private async removeFromWatchlist(): Promise<void> {
    if (!this.currentUser) return;

    const watchlistId = await this.prompt('Enter watchlist ID: ');
    const symbol = (await this.prompt('Enter stock symbol: ')).toUpperCase();

    this.controller.removeStockFromWatchlist(watchlistId, symbol);
    Logger.success(`Removed ${symbol} from watchlist`);

    await this.prompt('Press Enter to continue...');
  }

  private async deleteWatchlist(): Promise<void> {
    if (!this.currentUser) return;

    const watchlistId = await this.prompt('Enter watchlist ID: ');

    this.controller.deleteWatchlist(watchlistId, this.currentUser.id);
    Logger.success('Watchlist deleted');

    await this.prompt('Press Enter to continue...');
  }

  // ==================== UTILITY ====================

  private prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }
}

// Start the application
const app = new ConsoleInterface();
app.start().catch(console.error);
