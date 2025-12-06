import { IRepository } from './IRepository';
import { Watchlist } from '../models/Watchlist';
import { InMemoryDatabase } from '../database/InMemoryDatabase';

export class WatchlistRepository implements IRepository<Watchlist> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): Watchlist | undefined {
    return this.db.watchlists.get(id);
  }

  public findAll(): Watchlist[] {
    return Array.from(this.db.watchlists.values());
  }

  public save(watchlist: Watchlist): Watchlist {
    this.db.indexWatchlist(watchlist);
    return watchlist;
  }

  public delete(id: string): boolean {
    this.db.removeWatchlistFromIndexes(id);
    return true;
  }

  public exists(id: string): boolean {
    return this.db.watchlists.has(id);
  }

  public count(): number {
    return this.db.watchlists.size;
  }

  public clear(): void {
    this.db.watchlists.clear();
    this.db.watchlistsByUserId.clear();
  }

  // Custom query methods
  public findByUserId(userId: string): Watchlist[] {
    return this.db.watchlistsByUserId.get(userId) || [];
  }

  public findByUserAndName(userId: string, name: string): Watchlist | undefined {
    const userWatchlists = this.findByUserId(userId);
    return userWatchlists.find(
      watchlist => watchlist.name.toLowerCase() === name.toLowerCase()
    );
  }

  public existsByUserAndName(userId: string, name: string): boolean {
    return this.findByUserAndName(userId, name) !== undefined;
  }

  public findWatchlistsWithStock(stockSymbol: string): Watchlist[] {
    return Array.from(this.db.watchlists.values()).filter(
      watchlist => watchlist.hasStock(stockSymbol)
    );
  }

  public countByUser(userId: string): number {
    return this.findByUserId(userId).length;
  }
}
