/**
 * GameRepository.ts
 * Repository for managing Game entities
 */

import { IRepository } from './IRepository';
import { InMemoryDatabase } from '../database/InMemoryDatabase';

export class GameRepository implements IRepository<any> {
  private db: InMemoryDatabase;

  constructor() {
    this.db = InMemoryDatabase.getInstance();
  }

  public save(game: any): any {
    this.db.getGames().set(game.getId(), game);
    return game;
  }

  public findById(id: string): any | null {
    return this.db.getGames().get(id) || null;
  }

  public findAll(): any[] {
    return Array.from(this.db.getGames().values());
  }

  public delete(id: string): boolean {
    return this.db.getGames().delete(id);
  }

  public update(game: any): any | null {
    if (this.db.getGames().has(game.getId())) {
      this.db.getGames().set(game.getId(), game);
      return game;
    }
    return null;
  }

  /**
   * Find the active game (assuming single game at a time)
   * @returns Active game or null
   */
  public findActiveGame(): any | null {
    const games = this.findAll();
    return games.length > 0 ? games[0] : null;
  }

  /**
   * Clear all games
   */
  public clear(): void {
    this.db.getGames().clear();
  }
}
