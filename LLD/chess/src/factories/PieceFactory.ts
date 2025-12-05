/**
 * PieceFactory.ts
 * Factory for creating chess pieces (Factory Pattern)
 */

import { Piece } from '../models/pieces/Piece';
import { Pawn } from '../models/pieces/Pawn';
import { Rook } from '../models/pieces/Rook';
import { Knight } from '../models/pieces/Knight';
import { Bishop } from '../models/pieces/Bishop';
import { Queen } from '../models/pieces/Queen';
import { King } from '../models/pieces/King';
import { Position } from '../models/Position';
import { PieceType } from '../enums/PieceType';
import { PieceColor } from '../enums/PieceColor';

export class PieceFactory {
  /**
   * Create a piece of the specified type
   * @param type - Type of piece to create
   * @param color - Color of the piece
   * @param position - Position on the board
   * @returns Created piece
   */
  public static createPiece(type: PieceType, color: PieceColor, position: Position): Piece {
    switch (type) {
      case PieceType.PAWN:
        return this.createPawn(color, position);
      case PieceType.ROOK:
        return this.createRook(color, position);
      case PieceType.KNIGHT:
        return this.createKnight(color, position);
      case PieceType.BISHOP:
        return this.createBishop(color, position);
      case PieceType.QUEEN:
        return this.createQueen(color, position);
      case PieceType.KING:
        return this.createKing(color, position);
      default:
        throw new Error(`Unknown piece type: ${type}`);
    }
  }

  public static createPawn(color: PieceColor, position: Position): Pawn {
    return new Pawn(color, position);
  }

  public static createRook(color: PieceColor, position: Position): Rook {
    return new Rook(color, position);
  }

  public static createKnight(color: PieceColor, position: Position): Knight {
    return new Knight(color, position);
  }

  public static createBishop(color: PieceColor, position: Position): Bishop {
    return new Bishop(color, position);
  }

  public static createQueen(color: PieceColor, position: Position): Queen {
    return new Queen(color, position);
  }

  public static createKing(color: PieceColor, position: Position): King {
    return new King(color, position);
  }

  /**
   * Create all pieces for standard chess starting position
   * @param color - Color of pieces to create
   * @returns Array of pieces in starting positions
   */
  public static createStartingPieces(color: PieceColor): Piece[] {
    const pieces: Piece[] = [];
    const backRank = color === PieceColor.WHITE ? 1 : 8;
    const pawnRank = color === PieceColor.WHITE ? 2 : 7;

    // Back rank pieces
    pieces.push(this.createRook(color, new Position('a', backRank)));
    pieces.push(this.createKnight(color, new Position('b', backRank)));
    pieces.push(this.createBishop(color, new Position('c', backRank)));
    pieces.push(this.createQueen(color, new Position('d', backRank)));
    pieces.push(this.createKing(color, new Position('e', backRank)));
    pieces.push(this.createBishop(color, new Position('f', backRank)));
    pieces.push(this.createKnight(color, new Position('g', backRank)));
    pieces.push(this.createRook(color, new Position('h', backRank)));

    // Pawns
    for (let file = 'a'; file <= 'h'; file = String.fromCharCode(file.charCodeAt(0) + 1)) {
      pieces.push(this.createPawn(color, new Position(file, pawnRank)));
    }

    return pieces;
  }
}
