import { IRepository } from './IRepository';
import { Stock } from '../models/Stock';
import { InMemoryDatabase } from '../database/InMemoryDatabase';
import { Sector } from '../enums/Sector';

export class StockRepository implements IRepository<Stock> {
  private db = InMemoryDatabase.getInstance();

  public findById(symbol: string): Stock | undefined {
    return this.db.stocks.get(symbol.toUpperCase());
  }

  public findAll(): Stock[] {
    return Array.from(this.db.stocks.values());
  }

  public save(stock: Stock): Stock {
    this.db.indexStock(stock);
    return stock;
  }

  public delete(symbol: string): boolean {
    const upperSymbol = symbol.toUpperCase();
    this.db.stocksBySymbol.delete(upperSymbol);
    return this.db.stocks.delete(upperSymbol);
  }

  public exists(symbol: string): boolean {
    return this.db.stocks.has(symbol.toUpperCase());
  }

  public count(): number {
    return this.db.stocks.size;
  }

  public clear(): void {
    this.db.stocks.clear();
    this.db.stocksBySymbol.clear();
  }

  // Custom query methods
  public findBySymbol(symbol: string): Stock | undefined {
    return this.db.stocksBySymbol.get(symbol.toUpperCase());
  }

  public findBySector(sector: Sector): Stock[] {
    return Array.from(this.db.stocks.values()).filter(
      stock => stock.sector === sector
    );
  }

  public findByPriceRange(minPrice: number, maxPrice: number): Stock[] {
    return Array.from(this.db.stocks.values()).filter(
      stock => stock.lastTradedPrice >= minPrice && stock.lastTradedPrice <= maxPrice
    );
  }

  public getTopGainers(limit: number = 10): Stock[] {
    return Array.from(this.db.stocks.values())
      .sort((a, b) => b.getDayChangePercentage() - a.getDayChangePercentage())
      .slice(0, limit);
  }

  public getTopLosers(limit: number = 10): Stock[] {
    return Array.from(this.db.stocks.values())
      .sort((a, b) => a.getDayChangePercentage() - b.getDayChangePercentage())
      .slice(0, limit);
  }

  public getMostActiveByVolume(limit: number = 10): Stock[] {
    return Array.from(this.db.stocks.values())
      .sort((a, b) => b.dayVolume - a.dayVolume)
      .slice(0, limit);
  }

  public searchByName(query: string): Stock[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.db.stocks.values()).filter(
      stock => 
        stock.symbol.toLowerCase().includes(lowerQuery) ||
        stock.companyName.toLowerCase().includes(lowerQuery)
    );
  }
}
