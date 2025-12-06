/**
 * Rook.ts
 * Implements movement rules for Rook pieces (straight lines)
 * - Moves any number of squares horizontally or vertically
 * - Cannot jump over pieces
 * - Used in castling
 */

import { Piece } from './Piece';
import { Position } from '../Position';
import { PieceType } from '../../enums/PieceType';
import { PieceColor } from '../../enums/PieceColor';
import { Board } from '../Board';

export class Rook extends Piece {
  constructor(color: PieceColor, position: Position) {
    super(color, position, PieceType.ROOK, 5);
  }

  public isValidMoveForPiece(to: Position, board: Board): boolean {
    // Must move in straight line (same rank or same file)
    if (this.position.getFile() !== to.getFile() && this.position.getRank() !== to.getRank()) {
      return false;
    }

    // Check if path is clear
    return board.isPathClear(this.position, to);
  }

  public getPossibleMoves(board: Board): Position[] {
    const moves: Position[] = [];
    const directions = [
      { dx: 0, dy: 1 },  // Up
      { dx: 0, dy: -1 }, // Down
      { dx: 1, dy: 0 },  // Right
      { dx: -1, dy: 0 }  // Left
    ];

    for (const dir of directions) {
      let file = this.position.getFile().charCodeAt(0) + dir.dx;
      let rank = this.position.getRank() + dir.dy;

      while (file >= 'a'.charCodeAt(0) && file <= 'h'.charCodeAt(0) && rank >= 1 && rank <= 8) {
        const pos = new Position(String.fromCharCode(file), rank);
        const piece = board.getPieceAt(pos);

        if (piece === null) {
          moves.push(pos);
        } else {
          if (piece.getColor() !== this.color) {
            moves.push(pos); // Can capture
          }
          break; // Stop at first piece
        }

        file += dir.dx;
        rank += dir.dy;
      }
    }

    return moves;
  }

  public getAttackingSquares(board: Board): Position[] {
    return this.getPossibleMoves(board);
  }

  public clone(): Rook {
    const cloned = new Rook(this.color, this.position.clone());
    cloned.setHasMoved(this.hasMoved);
    return cloned;
  }
}
