/**
 * CheckmateState.ts
 * State when game ends in checkmate
 */

import { GameState } from './GameState';
import { Move } from '../models/Move';
import { GameStatus } from '../enums/GameStatus';
import { Player } from '../models/Player';
import { Logger } from '../utils/Logger';

export class CheckmateState extends GameState {
  private winner: Player;

  constructor(game: any, winner: Player) {
    super(game);
    this.winner = winner;
    Logger.info(`Checkmate! ${winner.getName()} wins!`);
  }

  public handleMove(move: Move): void {
    Logger.warn('Game is over. No more moves allowed.');
  }

  public checkGameStatus(): void {
    // Game is already over
  }

  public getStatus(): GameStatus {
    return GameStatus.CHECKMATE;
  }

  public canMove(): boolean {
    return false;
  }

  public getWinner(): Player {
    return this.winner;
  }
}
