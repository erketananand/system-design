import { Stock } from '../models/Stock';
import { StockRepository } from '../repositories/StockRepository';
import { Sector } from '../enums/Sector';
import { Logger } from '../utils/Logger';

/**
 * Singleton service for managing market data
 */
export class MarketDataService {
  private static instance: MarketDataService;
  private stockRepository: StockRepository;

  private constructor() {
    this.stockRepository = new StockRepository();
    Logger.info('[MarketDataService] Initialized');
  }

  public static getInstance(): MarketDataService {
    if (!MarketDataService.instance) {
      MarketDataService.instance = new MarketDataService();
    }
    return MarketDataService.instance;
  }

  /**
   * Add stock to market
   */
  public addStock(stock: Stock): void {
    this.stockRepository.save(stock);
    Logger.info(`[MarketDataService] Added stock: ${stock.symbol}`);
  }

  /**
   * Get stock by symbol
   */
  public getStock(symbol: string): Stock | undefined {
    return this.stockRepository.findBySymbol(symbol);
  }

  /**
   * Get all stocks
   */
  public getAllStocks(): Stock[] {
    return this.stockRepository.findAll();
  }

  /**
   * Update stock price
   */
  public updateStockPrice(symbol: string, newPrice: number, volume: number): void {
    const stock = this.getStock(symbol);
    if (!stock) {
      throw new Error(`Stock ${symbol} not found`);
    }
    stock.updatePrice(newPrice, volume);
    this.stockRepository.save(stock);
  }

  /**
   * Get current price for a stock
   */
  public getCurrentPrice(symbol: string): number {
    const stock = this.getStock(symbol);
    if (!stock) {
      throw new Error(`Stock ${symbol} not found`);
    }
    return stock.lastTradedPrice;
  }

  /**
   * Get stocks by sector
   */
  public getStocksBySector(sector: Sector): Stock[] {
    return this.stockRepository.findBySector(sector);
  }

  /**
   * Get top gainers
   */
  public getTopGainers(limit: number = 10): Stock[] {
    return this.stockRepository.getTopGainers(limit);
  }

  /**
   * Get top losers
   */
  public getTopLosers(limit: number = 10): Stock[] {
    return this.stockRepository.getTopLosers(limit);
  }

  /**
   * Get most active stocks by volume
   */
  public getMostActive(limit: number = 10): Stock[] {
    return this.stockRepository.getMostActiveByVolume(limit);
  }

  /**
   * Search stocks by name or symbol
   */
  public searchStocks(query: string): Stock[] {
    return this.stockRepository.searchByName(query);
  }

  /**
   * Simulate price movement for all stocks
   */
  public simulatePriceMovement(): void {
    const stocks = this.getAllStocks();
    stocks.forEach(stock => {
      // Random price change between -2% to +2%
      const changePercent = (Math.random() - 0.5) * 4;
      const newPrice = stock.lastTradedPrice * (1 + changePercent / 100);
      const volume = Math.floor(Math.random() * 10000);
      stock.updatePrice(newPrice, volume);
      this.stockRepository.save(stock);
    });
    Logger.debug('[MarketDataService] Simulated price movement for all stocks');
  }

  /**
   * Load sample stocks
   */
  public loadSampleStocks(): void {
    const sampleStocks = [
      new Stock('RELIANCE', 'Reliance Industries Ltd', Sector.ENERGY, 2450.50),
      new Stock('TCS', 'Tata Consultancy Services Ltd', Sector.TECHNOLOGY, 3685.75),
      new Stock('HDFCBANK', 'HDFC Bank Ltd', Sector.BANKING, 1650.30),
      new Stock('INFY', 'Infosys Ltd', Sector.TECHNOLOGY, 1485.20),
      new Stock('ICICIBANK', 'ICICI Bank Ltd', Sector.BANKING, 985.40),
      new Stock('HINDUNILVR', 'Hindustan Unilever Ltd', Sector.FMCG, 2385.60),
      new Stock('ITC', 'ITC Ltd', Sector.FMCG, 445.80),
      new Stock('SBIN', 'State Bank of India', Sector.BANKING, 625.50),
      new Stock('BHARTIARTL', 'Bharti Airtel Ltd', Sector.TELECOM, 1285.90),
      new Stock('KOTAKBANK', 'Kotak Mahindra Bank Ltd', Sector.BANKING, 1785.25),
      new Stock('LT', 'Larsen & Toubro Ltd', Sector.INFRASTRUCTURE, 3450.80),
      new Stock('AXISBANK', 'Axis Bank Ltd', Sector.BANKING, 1085.60),
      new Stock('WIPRO', 'Wipro Ltd', Sector.TECHNOLOGY, 465.30),
      new Stock('MARUTI', 'Maruti Suzuki India Ltd', Sector.AUTOMOBILE, 10850.40),
      new Stock('TATAMOTORS', 'Tata Motors Ltd', Sector.AUTOMOBILE, 785.20),
      new Stock('SUNPHARMA', 'Sun Pharmaceutical Industries Ltd', Sector.PHARMACEUTICAL, 1685.50),
      new Stock('HCLTECH', 'HCL Technologies Ltd', Sector.TECHNOLOGY, 1565.90),
      new Stock('BAJFINANCE', 'Bajaj Finance Ltd', Sector.FINANCE, 7250.30),
      new Stock('TITAN', 'Titan Company Ltd', Sector.CONSUMER_GOODS, 3285.70),
      new Stock('ADANIPORTS', 'Adani Ports and Special Economic Zone Ltd', Sector.INFRASTRUCTURE, 1185.40),
      new Stock('ONGC', 'Oil and Natural Gas Corporation Ltd', Sector.ENERGY, 185.60),
      new Stock('NTPC', 'NTPC Ltd', Sector.UTILITIES, 285.30),
      new Stock('POWERGRID', 'Power Grid Corporation of India Ltd', Sector.UTILITIES, 245.80),
      new Stock('DRREDDY', 'Dr. Reddy\'s Laboratories Ltd', Sector.PHARMACEUTICAL, 5685.20),
      new Stock('TECHM', 'Tech Mahindra Ltd', Sector.TECHNOLOGY, 1385.50)
    ];

    sampleStocks.forEach(stock => this.addStock(stock));
    Logger.success(`[MarketDataService] Loaded ${sampleStocks.length} sample stocks`);
  }
}
