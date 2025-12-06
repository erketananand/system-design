/**
 * PositionHistoryRepository.ts
 * Repository for managing position history for draw detection
 */

import { IRepository } from './IRepository';
import { PositionHistory } from '../models/PositionHistory';
import { InMemoryDatabase } from '../database/InMemoryDatabase';

export class PositionHistoryRepository implements IRepository<PositionHistory> {
  private db: InMemoryDatabase;

  constructor() {
    this.db = InMemoryDatabase.getInstance();
  }

  public save(position: PositionHistory): PositionHistory {
    this.db.getPositionHistory().set(position.getId(), position);
    return position;
  }

  public findById(id: string): PositionHistory | null {
    return this.db.getPositionHistory().get(id) || null;
  }

  public findAll(): PositionHistory[] {
    return Array.from(this.db.getPositionHistory().values());
  }

  public delete(id: string): boolean {
    return this.db.getPositionHistory().delete(id);
  }

  public update(position: PositionHistory): PositionHistory | null {
    if (this.db.getPositionHistory().has(position.getId())) {
      this.db.getPositionHistory().set(position.getId(), position);
      return position;
    }
    return null;
  }

  /**
   * Find position by game ID and board hash
   * @param gameId - Game ID
   * @param boardHash - Board hash
   * @returns PositionHistory or null
   */
  public findByGameAndHash(gameId: string, boardHash: string): PositionHistory | null {
    const positions = this.findAll();
    return positions.find(
      p => p.getGameId() === gameId && p.getBoardHash() === boardHash
    ) || null;
  }

  /**
   * Find all positions for a game
   * @param gameId - Game ID
   * @returns Array of position histories
   */
  public findByGameId(gameId: string): PositionHistory[] {
    return this.findAll().filter(p => p.getGameId() === gameId);
  }

  /**
   * Check if any position has threefold repetition
   * @param gameId - Game ID
   * @returns True if threefold repetition detected
   */
  public hasThreefoldRepetition(gameId: string): boolean {
    const positions = this.findByGameId(gameId);
    return positions.some(p => p.isThreefoldRepetition());
  }

  /**
   * Clear all position history
   */
  public clear(): void {
    this.db.getPositionHistory().clear();
  }

  /**
   * Record position occurrence
   * @param gameId - Game ID
   * @param boardHash - Board hash
   * @param moveNumber - Move number
   * @returns Updated or new position history
   */
  public recordPosition(gameId: string, boardHash: string, moveNumber: number): PositionHistory {
    const existing = this.findByGameAndHash(gameId, boardHash);

    if (existing) {
      existing.incrementOccurrence(moveNumber);
      this.update(existing);
      return existing;
    } else {
      const newPosition = new PositionHistory(gameId, boardHash, moveNumber);
      return this.save(newPosition);
    }
  }
}
