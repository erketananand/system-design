/**
 * MoveRepository.ts
 * Repository for managing Move entities
 */

import { IRepository } from './IRepository';
import { Move } from '../models/Move';
import { InMemoryDatabase } from '../database/InMemoryDatabase';

export class MoveRepository implements IRepository<Move> {
  private db: InMemoryDatabase;

  constructor() {
    this.db = InMemoryDatabase.getInstance();
  }

  public save(move: Move): Move {
    this.db.getMoves().set(move.getId(), move);
    return move;
  }

  public findById(id: string): Move | null {
    return this.db.getMoves().get(id) || null;
  }

  public findAll(): Move[] {
    return Array.from(this.db.getMoves().values());
  }

  public delete(id: string): boolean {
    return this.db.getMoves().delete(id);
  }

  public update(move: Move): Move | null {
    if (this.db.getMoves().has(move.getId())) {
      this.db.getMoves().set(move.getId(), move);
      return move;
    }
    return null;
  }

  /**
   * Find moves by game ID
   * @param gameId - Game ID
   * @returns Array of moves for the game
   */
  public findByGameId(gameId: string): Move[] {
    // In a real implementation, moves would have gameId reference
    // For now, return all moves (single game assumption)
    return this.findAll();
  }

  /**
   * Get the last move made
   * @returns Last move or null
   */
  public getLastMove(): Move | null {
    const moves = this.findAll();
    return moves.length > 0 ? moves[moves.length - 1] : null;
  }

  /**
   * Get moves sorted by timestamp
   * @returns Sorted array of moves
   */
  public findAllSorted(): Move[] {
    return this.findAll().sort((a, b) => 
      a.getTimestamp().getTime() - b.getTimestamp().getTime()
    );
  }

  /**
   * Clear all moves
   */
  public clear(): void {
    this.db.getMoves().clear();
  }

  /**
   * Get move count
   * @returns Number of moves
   */
  public count(): number {
    return this.db.getMoves().size;
  }
}
