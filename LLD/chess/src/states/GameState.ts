/**
 * GameState.ts
 * Abstract base class for game states (State Pattern)
 */

import { Move } from '../models/Move';
import { GameStatus } from '../enums/GameStatus';

export abstract class GameState {
  protected game: any; // Will be Game instance

  constructor(game: any) {
    this.game = game;
  }

  /**
   * Handle a move in the current state
   * @param move - Move to handle
   */
  public abstract handleMove(move: Move): void;

  /**
   * Check and update game status
   */
  public abstract checkGameStatus(): void;

  /**
   * Get current game status
   * @returns GameStatus enum
   */
  public abstract getStatus(): GameStatus;

  /**
   * Check if moves are allowed in this state
   * @returns True if moves can be made
   */
  public abstract canMove(): boolean;
}
