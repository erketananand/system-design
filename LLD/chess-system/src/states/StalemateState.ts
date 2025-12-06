/**
 * StalemateState.ts
 * State when game ends in stalemate (draw)
 */

import { GameState } from './GameState';
import { Move } from '../models/Move';
import { GameStatus } from '../enums/GameStatus';
import { Logger } from '../utils/Logger';

export class StalemateState extends GameState {
  constructor(game: any) {
    super(game);
    Logger.info('Stalemate! Game is a draw.');
  }

  public handleMove(move: Move): void {
    Logger.warn('Game is over. No more moves allowed.');
  }

  public checkGameStatus(): void {
    // Game is already over
  }

  public getStatus(): GameStatus {
    return GameStatus.STALEMATE;
  }

  public canMove(): boolean {
    return false;
  }
}
