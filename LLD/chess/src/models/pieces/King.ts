/**
 * King.ts
 * Implements movement rules for King pieces (one square in any direction)
 * - Moves one square in any direction
 * - Most important piece (game ends if checkmated)
 * - Can castle with rook under specific conditions
 * - Cannot move into check
 */

import { Piece } from './Piece';
import { Position } from '../Position';
import { PieceType } from '../../enums/PieceType';
import { PieceColor } from '../../enums/PieceColor';
import { CastlingType } from '../../enums/CastlingType';
import { Board } from '../Board';

export class King extends Piece {
  constructor(color: PieceColor, position: Position) {
    super(color, position, PieceType.KING, 1000); // King is invaluable
  }

  public isValidMoveForPiece(to: Position, board: Board): boolean {
    const fileDiff = Math.abs(to.getFile().charCodeAt(0) - this.position.getFile().charCodeAt(0));
    const rankDiff = Math.abs(to.getRank() - this.position.getRank());

    // One square in any direction
    return fileDiff <= 1 && rankDiff <= 1 && (fileDiff + rankDiff > 0);
  }

  public getPossibleMoves(board: Board): Position[] {
    const moves: Position[] = [];
    const directions = [
      { dx: 0, dy: 1 },   // Up
      { dx: 0, dy: -1 },  // Down
      { dx: 1, dy: 0 },   // Right
      { dx: -1, dy: 0 },  // Left
      { dx: 1, dy: 1 },   // Up-Right
      { dx: 1, dy: -1 },  // Down-Right
      { dx: -1, dy: 1 },  // Up-Left
      { dx: -1, dy: -1 }  // Down-Left
    ];

    for (const dir of directions) {
      const file = String.fromCharCode(this.position.getFile().charCodeAt(0) + dir.dx);
      const rank = this.position.getRank() + dir.dy;

      if (file >= 'a' && file <= 'h' && rank >= 1 && rank <= 8) {
        const pos = new Position(file, rank);
        const piece = board.getPieceAt(pos);

        if (piece === null || piece.getColor() !== this.color) {
          moves.push(pos);
        }
      }
    }

    return moves;
  }

  public getAttackingSquares(board: Board): Position[] {
    return this.getPossibleMoves(board);
  }

  /**
   * Check if king can castle
   * @param castlingType - Kingside or Queenside
   * @param board - Current board
   * @returns True if castling is possible
   */
  public canCastle(castlingType: CastlingType, board: Board): boolean {
    // King must not have moved
    if (this.hasMoved) {
      return false;
    }

    const rank = this.position.getRank();
    const rookFile = castlingType === CastlingType.KINGSIDE ? 'h' : 'a';
    const rookPos = new Position(rookFile, rank);
    const rook = board.getPieceAt(rookPos);

    // Rook must exist and not have moved
    if (!rook || rook.getType() !== PieceType.ROOK || rook.hasPieceMoved()) {
      return false;
    }

    // Check if squares between king and rook are empty
    const direction = castlingType === CastlingType.KINGSIDE ? 1 : -1;
    const squaresToCheck = castlingType === CastlingType.KINGSIDE ? 2 : 3;

    for (let i = 1; i <= squaresToCheck; i++) {
      const file = String.fromCharCode(this.position.getFile().charCodeAt(0) + (i * direction));
      const pos = new Position(file, rank);
      if (board.getPieceAt(pos) !== null) {
        return false;
      }
    }

    return true;
  }

  public clone(): King {
    const cloned = new King(this.color, this.position.clone());
    cloned.setHasMoved(this.hasMoved);
    return cloned;
  }
}
