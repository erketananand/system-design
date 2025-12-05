/**
 * Game.ts
 * Main Game class - Singleton pattern
 * Orchestrates the entire chess game
 */

import { Board } from './Board';
import { Player } from './Player';
import { Move } from './Move';
import { Position } from './Position';
import { GameState } from '../states/GameState';
import { InProgressState } from '../states/InProgressState';
import { PieceColor } from '../enums/PieceColor';
import { PieceType } from '../enums/PieceType';
import { GameStatus } from '../enums/GameStatus';
import { DrawReason } from '../enums/DrawReason';
import { MoveType } from '../enums/MoveType';
import { IdGenerator } from '../utils/IdGenerator';
import { Logger } from '../utils/Logger';
import { BoardUtils } from '../utils/BoardUtils';
import { MoveValidator } from '../validators/MoveValidator';
import { PieceFactory } from '../factories/PieceFactory';
import { MoveCommand } from '../commands/MoveCommand';

export class Game {
  private static instance: Game | null = null;

  private readonly id: string;
  private board: Board;
  private whitePlayer: Player;
  private blackPlayer: Player;
  private currentPlayer: Player;
  private gameState: GameState;
  private moveHistory: Move[] = [];
  private positionHistory: Map<string, number> = new Map();
  private halfMoveClock: number = 0;
  private fullMoveNumber: number = 1;
  private readonly startTime: Date;
  private endTime: Date | null = null;

  private constructor() {
    this.id = IdGenerator.generateId('GAME');
    this.board = new Board();
    this.whitePlayer = new Player('White', PieceColor.WHITE);
    this.blackPlayer = new Player('Black', PieceColor.BLACK);
    this.currentPlayer = this.whitePlayer;
    this.gameState = new InProgressState(this);
    this.startTime = new Date();

    Logger.info('Game instance created');
  }

  /**
   * Get singleton instance
   * @returns Game instance
   */
  public static getInstance(): Game {
    if (!Game.instance) {
      Game.instance = new Game();
    }
    return Game.instance;
  }

  /**
   * Reset singleton instance (for new game)
   */
  public static resetInstance(): void {
    Game.instance = null;
    Logger.info('Game instance reset');
  }

  /**
   * Start a new game with player names
   * @param whiteName - White player name
   * @param blackName - Black player name
   */
  public startNewGame(whiteName: string, blackName: string): void {
    this.whitePlayer = new Player(whiteName, PieceColor.WHITE);
    this.blackPlayer = new Player(blackName, PieceColor.BLACK);
    this.currentPlayer = this.whitePlayer;

    // Initialize board with starting position
    this.setupBoard();

    // Register players as observers
    this.board.registerObserver(this.whitePlayer);
    this.board.registerObserver(this.blackPlayer);

    // Reset game state
    this.gameState = new InProgressState(this);
    this.moveHistory = [];
    this.positionHistory.clear();
    this.halfMoveClock = 0;
    this.fullMoveNumber = 1;

    // Record initial position
    const initialHash = BoardUtils.hashBoard(this.board);
    this.positionHistory.set(initialHash, 1);

    Logger.info(`New game started: ${whiteName} (White) vs ${blackName} (Black)`);
  }

  /**
   * Setup board with standard chess starting position
   */
  private setupBoard(): void {
    this.board.initializeBoard();

    // Create and place all pieces
    const whitePieces = PieceFactory.createStartingPieces(PieceColor.WHITE);
    const blackPieces = PieceFactory.createStartingPieces(PieceColor.BLACK);

    for (const piece of whitePieces) {
      this.board.addPiece(piece);
    }

    for (const piece of blackPieces) {
      this.board.addPiece(piece);
    }

    Logger.info('Board setup complete');
  }

  /**
   * Make a move
   * @param from - Source position
   * @param to - Destination position
   * @param promotionPiece - Piece type for pawn promotion (optional)
   * @returns Move object if successful, null otherwise
   */
  public makeMove(from: Position, to: Position, promotionPiece?: PieceType): Move | null {
    // Check if moves are allowed in current state
    if (!this.gameState.canMove()) {
      Logger.warn('Moves not allowed in current game state');
      return null;
    }

    // Validate move
    if (!this.isValidMove(from, to)) {
      Logger.warn(`Invalid move: ${from.toNotation()} to ${to.toNotation()}`);
      return null;
    }

    const piece = this.board.getPieceAt(from);
    if (!piece) {
      Logger.error('No piece at source position');
      return null;
    }

    // Check if it's the current player's piece
    if (piece.getColor() !== this.currentPlayer.getColor()) {
      Logger.warn('Not your piece!');
      return null;
    }

    // Determine move type
    const capturedPiece = this.board.getPieceAt(to);
    const moveType = capturedPiece ? MoveType.CAPTURE : MoveType.NORMAL;

    // Create move
    const move = new Move(from, to, piece, moveType);

    // Handle pawn promotion
    if (piece.getType() === PieceType.PAWN) {
      const pawn = piece as any;
      if (pawn.canPromote() && to.getRank() === (piece.getColor() === PieceColor.WHITE ? 8 : 1)) {
        const promoType = promotionPiece || PieceType.QUEEN;
        move.setPromotion(promoType);

        // Create new piece and replace pawn
        const promotedPiece = PieceFactory.createPiece(promoType, piece.getColor(), to);
        this.board.removePiece(piece);
        this.board.addPiece(promotedPiece);
        Logger.info(`Pawn promoted to ${promoType}`);
      }
    }

    // Execute move using command pattern
    const command = new MoveCommand(move, this.board);
    command.execute();

    // Handle captured piece
    if (capturedPiece) {
      this.currentPlayer.addCapturedPiece(capturedPiece);
      Logger.info(`${piece.getType()} captures ${capturedPiece.getType()}`);
    }

    // Update move history
    this.moveHistory.push(move);

    // Update half-move clock (for 50-move rule)
    if (piece.getType() === PieceType.PAWN || capturedPiece) {
      this.halfMoveClock = 0;
    } else {
      this.halfMoveClock++;
    }

    // Update position history
    const boardHash = BoardUtils.hashBoard(this.board);
    const count = this.positionHistory.get(boardHash) || 0;
    this.positionHistory.set(boardHash, count + 1);

    // Generate algebraic notation
    move.setNotation(move.toAlgebraicNotation());

    // Handle state changes (check, checkmate, etc.)
    this.gameState.handleMove(move);

    // Switch turns
    this.switchTurn();

    Logger.info(`Move: ${move.toAlgebraicNotation()}`);
    return move;
  }

  /**
   * Check if a move is valid
   * @param from - Source position
   * @param to - Destination position
   * @returns True if valid
   */
  public isValidMove(from: Position, to: Position): boolean {
    return MoveValidator.isMoveLegal(from, to, this.board);
  }

  /**
   * Get all possible moves for a piece at position
   * @param position - Position of piece
   * @returns Array of valid positions
   */
  public getPossibleMovesFor(position: Position): Position[] {
    const piece = this.board.getPieceAt(position);
    if (!piece) {
      return [];
    }

    const possibleMoves = piece.getPossibleMoves(this.board);

    // Filter out moves that would put own king in check
    return possibleMoves.filter(to => 
      !MoveValidator.doesMovePutOwnKingInCheck(position, to, this.board, piece.getColor())
    );
  }

  /**
   * Check if a color is in check
   * @param color - Color to check
   * @returns True if in check
   */
  public isInCheck(color: PieceColor): boolean {
    const king = this.board.getKing(color);
    const opponentColor = color === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
    const attackedSquares = MoveValidator.getAttackingSquaresForColor(opponentColor, this.board);

    return attackedSquares.has(king.getPosition().toNotation());
  }

  /**
   * Check if a color is in checkmate
   * @param color - Color to check
   * @returns True if in checkmate
   */
  public isCheckmate(color: PieceColor): boolean {
    if (!this.isInCheck(color)) {
      return false;
    }

    // Check if any move can get out of check
    const pieces = this.board.getAllPieces(color);

    for (const piece of pieces) {
      const moves = this.getPossibleMovesFor(piece.getPosition());
      if (moves.length > 0) {
        return false; // Found a legal move
      }
    }

    return true; // No legal moves available
  }

  /**
   * Check if a color is in stalemate
   * @param color - Color to check
   * @returns True if in stalemate
   */
  public isStalemate(color: PieceColor): boolean {
    if (this.isInCheck(color)) {
      return false; // Can't be stalemate if in check
    }

    // Check if any legal moves exist
    const pieces = this.board.getAllPieces(color);

    for (const piece of pieces) {
      const moves = this.getPossibleMovesFor(piece.getPosition());
      if (moves.length > 0) {
        return false; // Found a legal move
      }
    }

    return true; // No legal moves but not in check
  }

  /**
   * Detect check after a move
   * @returns True if opponent is in check
   */
  public detectCheck(): boolean {
    const opponentColor = this.currentPlayer.getColor() === PieceColor.WHITE ? 
      PieceColor.BLACK : PieceColor.WHITE;
    return this.isInCheck(opponentColor);
  }

  /**
   * Detect checkmate
   * @returns True if checkmate
   */
  public detectCheckmate(): boolean {
    const opponentColor = this.currentPlayer.getColor() === PieceColor.WHITE ? 
      PieceColor.BLACK : PieceColor.WHITE;
    return this.isCheckmate(opponentColor);
  }

  /**
   * Detect stalemate
   * @returns True if stalemate
   */
  public detectStalemate(): boolean {
    const opponentColor = this.currentPlayer.getColor() === PieceColor.WHITE ? 
      PieceColor.BLACK : PieceColor.WHITE;
    return this.isStalemate(opponentColor);
  }

  /**
   * Detect draw conditions
   * @returns DrawReason if draw detected, null otherwise
   */
  public detectDraw(): DrawReason | null {
    // Fifty-move rule
    if (this.halfMoveClock >= 100) { // 50 moves = 100 half-moves
      return DrawReason.FIFTY_MOVE_RULE;
    }

    // Threefold repetition
    for (const count of this.positionHistory.values()) {
      if (count >= 3) {
        return DrawReason.THREEFOLD_REPETITION;
      }
    }

    // Insufficient material
    if (this.hasInsufficientMaterial()) {
      return DrawReason.INSUFFICIENT_MATERIAL;
    }

    return null;
  }

  /**
   * Check for insufficient material
   * @returns True if insufficient material for checkmate
   */
  private hasInsufficientMaterial(): boolean {
    const whitePieces = this.board.getAllPieces(PieceColor.WHITE);
    const blackPieces = this.board.getAllPieces(PieceColor.BLACK);

    // King vs King
    if (whitePieces.length === 1 && blackPieces.length === 1) {
      return true;
    }

    // King + Bishop/Knight vs King
    if (whitePieces.length === 2 && blackPieces.length === 1) {
      const piece = whitePieces.find(p => p.getType() !== PieceType.KING);
      if (piece && (piece.getType() === PieceType.BISHOP || piece.getType() === PieceType.KNIGHT)) {
        return true;
      }
    }

    if (blackPieces.length === 2 && whitePieces.length === 1) {
      const piece = blackPieces.find(p => p.getType() !== PieceType.KING);
      if (piece && (piece.getType() === PieceType.BISHOP || piece.getType() === PieceType.KNIGHT)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Offer draw
   * @param player - Player offering draw
   */
  public offerDraw(player: Player): void {
    player.offerDraw();
    Logger.info(`${player.getName()} offers a draw`);
  }

  /**
   * Accept draw
   * @param player - Player accepting draw
   */
  public acceptDraw(player: Player): void {
    const opponent = player === this.whitePlayer ? this.blackPlayer : this.whitePlayer;

    if (opponent.isDrawOffered()) {
      const DrawState = require('../states/DrawState').DrawState;
      this.gameState = new DrawState(this, DrawReason.AGREEMENT);
      this.endTime = new Date();
      Logger.info('Draw accepted by agreement');
    } else {
      Logger.warn('No draw offer to accept');
    }
  }

  /**
   * Resign
   * @param player - Player resigning
   */
  public resign(player: Player): void {
    const winner = player === this.whitePlayer ? this.blackPlayer : this.whitePlayer;
    const CheckmateState = require('../states/CheckmateState').CheckmateState;
    this.gameState = new CheckmateState(this, winner);
    this.endTime = new Date();
    Logger.info(`${player.getName()} resigns. ${winner.getName()} wins!`);
  }

  /**
   * Switch turn to other player
   */
  public switchTurn(): void {
    this.currentPlayer = this.currentPlayer === this.whitePlayer ? 
      this.blackPlayer : this.whitePlayer;

    if (this.currentPlayer === this.whitePlayer) {
      this.fullMoveNumber++;
    }

    Logger.debug(`Turn: ${this.currentPlayer.getName()}`);
  }

  /**
   * Undo last move
   * @returns True if undo successful
   */
  public undoLastMove(): boolean {
    if (this.moveHistory.length === 0) {
      Logger.warn('No moves to undo');
      return false;
    }

    // For now, simple implementation
    // Full implementation would use command pattern's undo
    Logger.warn('Undo not fully implemented yet');
    return false;
  }

  /**
   * Display board
   */
  public displayBoard(): void {
    console.log(this.board.display());
  }

  /**
   * Export game to PGN format
   * @returns PGN string
   */
  public exportToPGN(): string {
    let pgn = `[Event "Casual Game"]
`;
    pgn += `[Site "Chess System"]
`;
    pgn += `[Date "${this.startTime.toISOString().split('T')[0]}"]
`;
    pgn += `[White "${this.whitePlayer.getName()}"]
`;
    pgn += `[Black "${this.blackPlayer.getName()}"]
`;
    pgn += `[Result "${this.getResult()}"]

`;

    // Add moves
    for (let i = 0; i < this.moveHistory.length; i++) {
      if (i % 2 === 0) {
        pgn += `${Math.floor(i / 2) + 1}. `;
      }
      pgn += this.moveHistory[i].toAlgebraicNotation() + ' ';
    }

    pgn += this.getResult();
    return pgn;
  }

  /**
   * Get game result string
   * @returns Result string
   */
  private getResult(): string {
    const status = this.gameState.getStatus();

    if (status === GameStatus.CHECKMATE) {
      const CheckmateState = this.gameState as any;
      return CheckmateState.getWinner().getColor() === PieceColor.WHITE ? '1-0' : '0-1';
    }

    if (status === GameStatus.DRAW || status === GameStatus.STALEMATE) {
      return '1/2-1/2';
    }

    return '*'; // Game in progress
  }

  // Getters
  public getId(): string { return this.id; }
  public getBoard(): Board { return this.board; }
  public getWhitePlayer(): Player { return this.whitePlayer; }
  public getBlackPlayer(): Player { return this.blackPlayer; }
  public getCurrentPlayer(): Player { return this.currentPlayer; }
  public getGameState(): GameState { return this.gameState; }
  public setState(state: GameState): void { this.gameState = state; }
  public getMoveHistory(): Move[] { return [...this.moveHistory]; }
  public getGameStatus(): GameStatus { return this.gameState.getStatus(); }
  public getHalfMoveClock(): number { return this.halfMoveClock; }
  public getFullMoveNumber(): number { return this.fullMoveNumber; }
  public getStartTime(): Date { return this.startTime; }
  public getEndTime(): Date | null { return this.endTime; }
}
