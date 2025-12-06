/**
 * Bishop.ts
 * Implements movement rules for Bishop pieces (diagonals)
 * - Moves any number of squares diagonally
 * - Cannot jump over pieces
 * - Each bishop stays on same color squares
 */

import { Piece } from './Piece';
import { Position } from '../Position';
import { PieceType } from '../../enums/PieceType';
import { PieceColor } from '../../enums/PieceColor';
import { Board } from '../Board';

export class Bishop extends Piece {
  constructor(color: PieceColor, position: Position) {
    super(color, position, PieceType.BISHOP, 3);
  }

  public isValidMoveForPiece(to: Position, board: Board): boolean {
    const fileDiff = Math.abs(to.getFile().charCodeAt(0) - this.position.getFile().charCodeAt(0));
    const rankDiff = Math.abs(to.getRank() - this.position.getRank());

    // Must move diagonally (equal file and rank difference)
    if (fileDiff !== rankDiff || fileDiff === 0) {
      return false;
    }

    // Check if path is clear
    return board.isPathClear(this.position, to);
  }

  public getPossibleMoves(board: Board): Position[] {
    const moves: Position[] = [];
    const directions = [
      { dx: 1, dy: 1 },   // Up-Right
      { dx: 1, dy: -1 },  // Down-Right
      { dx: -1, dy: 1 },  // Up-Left
      { dx: -1, dy: -1 }  // Down-Left
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

  public clone(): Bishop {
    const cloned = new Bishop(this.color, this.position.clone());
    cloned.setHasMoved(this.hasMoved);
    return cloned;
  }
}
