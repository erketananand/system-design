import { IRepository } from './IRepository';
import { Portfolio } from '../models/Portfolio';
import { InMemoryDatabase } from '../database/InMemoryDatabase';

export class PortfolioRepository implements IRepository<Portfolio> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): Portfolio | undefined {
    return this.db.portfolios.get(id);
  }

  public findAll(): Portfolio[] {
    return Array.from(this.db.portfolios.values());
  }

  public save(portfolio: Portfolio): Portfolio {
    this.db.indexPortfolio(portfolio);
    return portfolio;
  }

  public delete(id: string): boolean {
    const portfolio = this.db.portfolios.get(id);
    if (portfolio) {
      this.db.portfoliosByUserId.delete(portfolio.userId);
    }
    return this.db.portfolios.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.portfolios.has(id);
  }

  public count(): number {
    return this.db.portfolios.size;
  }

  public clear(): void {
    this.db.portfolios.clear();
    this.db.portfoliosByUserId.clear();
  }

  // Custom query methods
  public findByUserId(userId: string): Portfolio | undefined {
    return this.db.portfoliosByUserId.get(userId);
  }

  public existsByUserId(userId: string): boolean {
    return this.db.portfoliosByUserId.has(userId);
  }

  public findPortfoliosWithHoldings(): Portfolio[] {
    return Array.from(this.db.portfolios.values()).filter(
      portfolio => portfolio.getHoldingsCount() > 0
    );
  }

  public findPortfoliosByStock(stockSymbol: string): Portfolio[] {
    return Array.from(this.db.portfolios.values()).filter(
      portfolio => portfolio.hasHolding(stockSymbol)
    );
  }
}
