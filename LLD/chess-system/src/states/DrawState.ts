/**
 * DrawState.ts
 * State when game ends in a draw
 */

import { GameState } from './GameState';
import { Move } from '../models/Move';
import { GameStatus } from '../enums/GameStatus';
import { DrawReason } from '../enums/DrawReason';
import { Logger } from '../utils/Logger';

export class DrawState extends GameState {
  private reason: DrawReason;

  constructor(game: any, reason: DrawReason) {
    super(game);
    this.reason = reason;
    Logger.info(`Game drawn: ${reason}`);
  }

  public handleMove(move: Move): void {
    Logger.warn('Game is over. No more moves allowed.');
  }

  public checkGameStatus(): void {
    // Game is already over
  }

  public getStatus(): GameStatus {
    return GameStatus.DRAW;
  }

  public canMove(): boolean {
    return false;
  }

  public getReason(): DrawReason {
    return this.reason;
  }
}
