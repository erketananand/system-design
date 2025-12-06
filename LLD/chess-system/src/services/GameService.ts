/**
 * GameService.ts
 * Service layer for game operations
 */

import { Game } from '../models/Game';
import { GameRepository } from '../repositories/GameRepository';
import { MoveRepository } from '../repositories/MoveRepository';
import { PlayerRepository } from '../repositories/PlayerRepository';
import { Position } from '../models/Position';
import { Move } from '../models/Move';
import { PieceType } from '../enums/PieceType';
import { GameStatus } from '../enums/GameStatus';
import { Logger } from '../utils/Logger';

export class GameService {
  private gameRepository: GameRepository;
  private moveRepository: MoveRepository;
  private playerRepository: PlayerRepository;
  private game: Game | null = null;

  constructor() {
    this.gameRepository = new GameRepository();
    this.moveRepository = new MoveRepository();
    this.playerRepository = new PlayerRepository();
  }

  /**
   * Create and start a new game
   * @param whiteName - White player name
   * @param blackName - Black player name
   * @returns Game instance
   */
  public createNewGame(whiteName: string, blackName: string): Game {
    // Reset previous game
    Game.resetInstance();
    this.gameRepository.clear();
    this.moveRepository.clear();
    this.playerRepository.clear();

    // Create new game
    this.game = Game.getInstance();
    this.game.startNewGame(whiteName, blackName);

    // Save to repository
    this.gameRepository.save(this.game);
    this.playerRepository.save(this.game.getWhitePlayer());
    this.playerRepository.save(this.game.getBlackPlayer());

    Logger.info('New game created and saved');
    return this.game;
  }

  /**
   * Make a move
   * @param from - Source position notation (e.g., "e2")
   * @param to - Destination position notation (e.g., "e4")
   * @param promotion - Promotion piece type (optional)
   * @returns Move if successful, null otherwise
   */
  public makeMove(from: string, to: string, promotion?: PieceType): Move | null {
    if (!this.game) {
      Logger.error('No active game');
      return null;
    }

    try {
      const fromPos = Position.fromNotation(from);
      const toPos = Position.fromNotation(to);

      const move = this.game.makeMove(fromPos, toPos, promotion);

      if (move) {
        // Save move to repository
        this.moveRepository.save(move);
        this.gameRepository.update(this.game);
        return move;
      }

      return null;
    } catch (error) {
      Logger.error(`Invalid move: ${error}`);
      return null;
    }
  }

  /**
   * Get move history
   * @returns Array of moves
   */
  public getMoveHistory(): Move[] {
    if (!this.game) {
      return [];
    }
    return this.game.getMoveHistory();
  }

  /**
   * Get current game status
   * @returns GameStatus enum
   */
  public getCurrentGameStatus(): GameStatus {
    if (!this.game) {
      return GameStatus.NOT_STARTED;
    }
    return this.game.getGameStatus();
  }

  /**
   * Offer draw
   */
  public offerDraw(): void {
    if (!this.game) {
      Logger.error('No active game');
      return;
    }

    const currentPlayer = this.game.getCurrentPlayer();
    this.game.offerDraw(currentPlayer);
  }

  /**
   * Accept draw
   */
  public acceptDraw(): void {
    if (!this.game) {
      Logger.error('No active game');
      return;
    }

    const currentPlayer = this.game.getCurrentPlayer();
    this.game.acceptDraw(currentPlayer);
    this.gameRepository.update(this.game);
  }

  /**
   * Resign
   */
  public resign(): void {
    if (!this.game) {
      Logger.error('No active game');
      return;
    }

    const currentPlayer = this.game.getCurrentPlayer();
    this.game.resign(currentPlayer);
    this.gameRepository.update(this.game);
  }

  /**
   * Undo last move
   * @returns True if successful
   */
  public undoMove(): boolean {
    if (!this.game) {
      Logger.error('No active game');
      return false;
    }

    return this.game.undoLastMove();
  }

  /**
   * Get possible moves for a piece
   * @param position - Position notation (e.g., "e2")
   * @returns Array of position notations
   */
  public getPossibleMoves(position: string): string[] {
    if (!this.game) {
      return [];
    }

    try {
      const pos = Position.fromNotation(position);
      const moves = this.game.getPossibleMovesFor(pos);
      return moves.map(m => m.toNotation());
    } catch (error) {
      Logger.error(`Invalid position: ${error}`);
      return [];
    }
  }

  /**
   * Display board
   */
  public displayBoard(): void {
    if (!this.game) {
      console.log('No active game');
      return;
    }

    this.game.displayBoard();
  }

  /**
   * Export game to PGN format
   * @returns PGN string
   */
  public exportGameToPGN(): string {
    if (!this.game) {
      return '';
    }

    return this.game.exportToPGN();
  }

  /**
   * Get current game
   * @returns Game instance or null
   */
  public getCurrentGame(): Game | null {
    return this.game;
  }

  /**
   * Get game statistics
   * @returns Object with game stats
   */
  public getGameStatistics(): any {
    if (!this.game) {
      return null;
    }

    const whitePlayer = this.game.getWhitePlayer();
    const blackPlayer = this.game.getBlackPlayer();

    return {
      gameId: this.game.getId(),
      status: this.game.getGameStatus(),
      currentTurn: this.game.getCurrentPlayer().getName(),
      moveCount: this.game.getMoveHistory().length,
      fullMoveNumber: this.game.getFullMoveNumber(),
      whitePlayer: {
        name: whitePlayer.getName(),
        capturedValue: whitePlayer.getCapturedValue(),
        capturedPieces: whitePlayer.getCapturedPieces().length
      },
      blackPlayer: {
        name: blackPlayer.getName(),
        capturedValue: blackPlayer.getCapturedValue(),
        capturedPieces: blackPlayer.getCapturedPieces().length
      },
      startTime: this.game.getStartTime(),
      endTime: this.game.getEndTime()
    };
  }
}
