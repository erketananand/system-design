/**
 * InProgressState.ts
 * State when game is actively being played
 */

import { GameState } from './GameState';
import { Move } from '../models/Move';
import { GameStatus } from '../enums/GameStatus';
import { Logger } from '../utils/Logger';

export class InProgressState extends GameState {
  public handleMove(move: Move): void {
    Logger.info(`Move executed: ${move.toAlgebraicNotation()}`);
    this.checkGameStatus();
  }

  public checkGameStatus(): void {
    // Check if opponent is in check after this move
    const opponentColor = this.game.getCurrentPlayer().getColor() === 'WHITE' ? 'BLACK' : 'WHITE';

    if (this.game.isInCheck(opponentColor)) {
      Logger.warn(`${opponentColor} is in check!`);

      // Check if it's checkmate
      if (this.game.isCheckmate(opponentColor)) {
        const CheckmateState = require('./CheckmateState').CheckmateState;
        this.game.setState(new CheckmateState(this.game, this.game.getCurrentPlayer()));
        return;
      }

      // It's just check
      const CheckState = require('./CheckState').CheckState;
      this.game.setState(new CheckState(this.game));
      return;
    }

    // Check for stalemate
    if (this.game.isStalemate(opponentColor)) {
      const StalemateState = require('./StalemateState').StalemateState;
      this.game.setState(new StalemateState(this.game));
      return;
    }

    // Check for other draw conditions
    const drawReason = this.game.detectDraw();
    if (drawReason) {
      const DrawState = require('./DrawState').DrawState;
      this.game.setState(new DrawState(this.game, drawReason));
      return;
    }
  }

  public getStatus(): GameStatus {
    return GameStatus.IN_PROGRESS;
  }

  public canMove(): boolean {
    return true;
  }
}
