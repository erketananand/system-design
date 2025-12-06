/**
 * CheckState.ts
 * State when a king is in check
 */

import { GameState } from './GameState';
import { Move } from '../models/Move';
import { GameStatus } from '../enums/GameStatus';
import { Logger } from '../utils/Logger';

export class CheckState extends GameState {
  public handleMove(move: Move): void {
    Logger.info(`Move executed while in check: ${move.toAlgebraicNotation()}`);
    move.setCheck(true);
    this.checkGameStatus();
  }

  public checkGameStatus(): void {
    const opponentColor = this.game.getCurrentPlayer().getColor() === 'WHITE' ? 'BLACK' : 'WHITE';

    // Check if opponent is still in check
    if (this.game.isInCheck(opponentColor)) {
      // Check if it's checkmate
      if (this.game.isCheckmate(opponentColor)) {
        const CheckmateState = require('./CheckmateState').CheckmateState;
        this.game.setState(new CheckmateState(this.game, this.game.getCurrentPlayer()));
        return;
      }
      // Still in check
      Logger.warn(`${opponentColor} is still in check!`);
      return;
    }

    // Check was resolved, return to in progress
    const InProgressState = require('./InProgressState').InProgressState;
    this.game.setState(new InProgressState(this.game));
  }

  public getStatus(): GameStatus {
    return GameStatus.CHECK;
  }

  public canMove(): boolean {
    return true; // Can move to get out of check
  }
}
