/**
 * InMemoryDatabase.ts
 * Singleton in-memory database for storing game data
 */

import { Move } from '../models/Move';
import { Player } from '../models/Player';

export class InMemoryDatabase {
  private static instance: InMemoryDatabase | null = null;

  private games: Map<string, any> = new Map(); // Game objects
  private moves: Map<string, Move> = new Map();
  private players: Map<string, Player> = new Map();
  private boards: Map<string, any> = new Map();
  private positionHistory: Map<string, any> = new Map();

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   * @returns InMemoryDatabase instance
   */
  public static getInstance(): InMemoryDatabase {
    if (!InMemoryDatabase.instance) {
      InMemoryDatabase.instance = new InMemoryDatabase();
    }
    return InMemoryDatabase.instance;
  }

  /**
   * Reset database (useful for testing or new games)
   */
  public reset(): void {
    this.games.clear();
    this.moves.clear();
    this.players.clear();
    this.boards.clear();
    this.positionHistory.clear();
  }

  /**
   * Reset singleton instance
   */
  public static resetInstance(): void {
    if (InMemoryDatabase.instance) {
      InMemoryDatabase.instance.reset();
      InMemoryDatabase.instance = null;
    }
  }

  // Getters for data stores
  public getGames(): Map<string, any> {
    return this.games;
  }

  public getMoves(): Map<string, Move> {
    return this.moves;
  }

  public getPlayers(): Map<string, Player> {
    return this.players;
  }

  public getBoards(): Map<string, any> {
    return this.boards;
  }

  public getPositionHistory(): Map<string, any> {
    return this.positionHistory;
  }
}
