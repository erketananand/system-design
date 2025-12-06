import { Portfolio } from '../models/Portfolio';
import { Trade } from '../models/Trade';
import { PortfolioRepository } from '../repositories/PortfolioRepository';
import { TradeRepository } from '../repositories/TradeRepository';
import { MarketDataService } from './MarketDataService';
import { OrderSide } from '../enums/OrderSide';
import { Logger } from '../utils/Logger';

export interface PortfolioSummary {
  userId: string;
  totalInvested: number;
  currentValue: number;
  totalPnL: number;
  totalPnLPercentage: number;
  holdingsCount: number;
  holdings: {
    stockSymbol: string;
    quantity: number;
    averageBuyPrice: number;
    currentPrice: number;
    currentValue: number;
    investedAmount: number;
    unrealizedPnL: number;
    unrealizedPnLPercentage: number;
  }[];
}

export class PortfolioService {
  private portfolioRepository: PortfolioRepository;
  private tradeRepository: TradeRepository;
  private marketDataService: MarketDataService;

  constructor() {
    this.portfolioRepository = new PortfolioRepository();
    this.tradeRepository = new TradeRepository();
    this.marketDataService = MarketDataService.getInstance();
  }

  /**
   * Get or create portfolio for user
   */
  public getOrCreatePortfolio(userId: string): Portfolio {
    let portfolio = this.portfolioRepository.findByUserId(userId);

    if (!portfolio) {
      portfolio = new Portfolio(userId);
      this.portfolioRepository.save(portfolio);
      Logger.info(`[PortfolioService] Created portfolio for user ${userId}`);
    }

    return portfolio;
  }

  /**
   * Get portfolio summary with current prices
   */
  public getPortfolioSummary(userId: string): PortfolioSummary {
    const portfolio = this.getOrCreatePortfolio(userId);

    const priceProvider = (symbol: string) => this.marketDataService.getCurrentPrice(symbol);

    const holdings = portfolio.getAllHoldings().map(holding => {
      const currentPrice = priceProvider(holding.stockSymbol);
      const currentValue = holding.getCurrentValue(currentPrice);
      const investedAmount = holding.getInvestedAmount();
      const unrealizedPnL = holding.getUnrealizedPnL(currentPrice);
      const unrealizedPnLPercentage = holding.getUnrealizedPnLPercentage(currentPrice);

      return {
        stockSymbol: holding.stockSymbol,
        quantity: holding.quantity,
        averageBuyPrice: holding.averageBuyPrice,
        currentPrice,
        currentValue,
        investedAmount,
        unrealizedPnL,
        unrealizedPnLPercentage
      };
    });

    const totalInvested = portfolio.getTotalInvestedAmount();
    const currentValue = portfolio.getTotalCurrentValue(priceProvider);
    const totalPnL = portfolio.getUnrealizedPnL(priceProvider);
    const totalPnLPercentage = portfolio.getUnrealizedPnLPercentage(priceProvider);

    return {
      userId,
      totalInvested,
      currentValue,
      totalPnL,
      totalPnLPercentage,
      holdingsCount: holdings.length,
      holdings
    };
  }

  /**
   * Update portfolio holdings from trade
   */
  public updateHoldingsFromTrade(trade: Trade): void {
    const portfolio = this.getOrCreatePortfolio(trade.userId);

    if (trade.side === OrderSide.BUY) {
      portfolio.addOrUpdateHolding(trade.stockSymbol, trade.quantity, trade.price);
      Logger.info(`[PortfolioService] Added/Updated holding: ${trade.quantity} ${trade.stockSymbol}`);
    } else if (trade.side === OrderSide.SELL) {
      portfolio.reduceHolding(trade.stockSymbol, trade.quantity);
      Logger.info(`[PortfolioService] Reduced holding: ${trade.quantity} ${trade.stockSymbol}`);
    }

    this.portfolioRepository.save(portfolio);
  }

  /**
   * Get realized P&L from trades
   */
  public getRealizedPnL(userId: string): number {
    const trades = this.tradeRepository.findByUserId(userId);
    const portfolio = this.portfolioRepository.findByUserId(userId);

    let realizedPnL = 0;

    trades.forEach(trade => {
      if (trade.side === OrderSide.SELL && portfolio) {
        const holding = portfolio.getHolding(trade.stockSymbol);
        if (holding) {
          const pnl = trade.getRealizedPnL(holding.averageBuyPrice);
          if (pnl !== null) {
            realizedPnL += pnl;
          }
        }
      }
    });

    return realizedPnL;
  }
}
