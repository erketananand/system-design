/**
 * MoveCommand.ts
 * Command pattern for move execution and undo
 */

import { Move } from '../models/Move';
import { Board } from '../models/Board';
import { Piece } from '../models/pieces/Piece';
import { Position } from '../models/Position';

export class MoveCommand {
  private readonly move: Move;
  private readonly board: Board;
  private capturedPiece: Piece | null = null;
  private previousPosition: Position;
  private pieceHadMoved: boolean;

  constructor(move: Move, board: Board) {
    this.move = move;
    this.board = board;
    this.previousPosition = move.getFrom();
    this.pieceHadMoved = move.getPiece().hasPieceMoved();
  }

  /**
   * Execute the move
   */
  public execute(): void {
    const piece = this.move.getPiece();
    const from = this.move.getFrom();
    const to = this.move.getTo();

    // Check if capturing a piece
    this.capturedPiece = this.board.getPieceAt(to);

    if (this.capturedPiece) {
      this.board.removePiece(this.capturedPiece);
      this.move.setCapturedPiece(this.capturedPiece);
    }

    // Move the piece
    this.board.movePiece(from, to);
  }

  /**
   * Undo the move
   */
  public undo(): void {
    const piece = this.move.getPiece();
    const from = this.move.getFrom();
    const to = this.move.getTo();

    // Move piece back
    this.board.movePiece(to, from);
    piece.setHasMoved(this.pieceHadMoved);

    // Restore captured piece
    if (this.capturedPiece) {
      this.board.addPiece(this.capturedPiece);
      this.board.setPieceAt(to, this.capturedPiece);
    }
  }

  public getMove(): Move {
    return this.move;
  }

  public getCapturedPiece(): Piece | null {
    return this.capturedPiece;
  }
}
