/**
 * PlayerRepository.ts
 * Repository for managing Player entities
 */

import { IRepository } from './IRepository';
import { Player } from '../models/Player';
import { PieceColor } from '../enums/PieceColor';
import { InMemoryDatabase } from '../database/InMemoryDatabase';

export class PlayerRepository implements IRepository<Player> {
  private db: InMemoryDatabase;

  constructor() {
    this.db = InMemoryDatabase.getInstance();
  }

  public save(player: Player): Player {
    this.db.getPlayers().set(player.getId(), player);
    return player;
  }

  public findById(id: string): Player | null {
    return this.db.getPlayers().get(id) || null;
  }

  public findAll(): Player[] {
    return Array.from(this.db.getPlayers().values());
  }

  public delete(id: string): boolean {
    return this.db.getPlayers().delete(id);
  }

  public update(player: Player): Player | null {
    if (this.db.getPlayers().has(player.getId())) {
      this.db.getPlayers().set(player.getId(), player);
      return player;
    }
    return null;
  }

  /**
   * Find player by color
   * @param color - Player color
   * @returns Player or null
   */
  public findByColor(color: PieceColor): Player | null {
    const players = this.findAll();
    return players.find(p => p.getColor() === color) || null;
  }

  /**
   * Get white player
   * @returns White player or null
   */
  public getWhitePlayer(): Player | null {
    return this.findByColor(PieceColor.WHITE);
  }

  /**
   * Get black player
   * @returns Black player or null
   */
  public getBlackPlayer(): Player | null {
    return this.findByColor(PieceColor.BLACK);
  }

  /**
   * Clear all players
   */
  public clear(): void {
    this.db.getPlayers().clear();
  }

  /**
   * Check if both players exist
   * @returns True if both players exist
   */
  public hasBothPlayers(): boolean {
    return this.getWhitePlayer() !== null && this.getBlackPlayer() !== null;
  }
}
