/**
 * Move.ts
 * Represents a chess move with all relevant metadata
 */

import { Position } from './Position';
import { Piece } from './pieces/Piece';
import { MoveType } from '../enums/MoveType';
import { PieceType } from '../enums/PieceType';
import { IdGenerator } from '../utils/IdGenerator';

export class Move {
  private readonly id: string;
  private readonly from: Position;
  private readonly to: Position;
  private readonly piece: Piece;
  private readonly moveType: MoveType;
  private capturedPiece: Piece | null = null;
  private promotionPiece: PieceType | null = null;
  private isCheck: boolean = false;
  private isCheckmate: boolean = false;
  private readonly timestamp: Date;
  private notation: string = '';

  constructor(from: Position, to: Position, piece: Piece, moveType: MoveType = MoveType.NORMAL) {
    this.id = IdGenerator.generateId('MOVE');
    this.from = from;
    this.to = to;
    this.piece = piece;
    this.moveType = moveType;
    this.timestamp = new Date();
  }

  public setCapturedPiece(piece: Piece): void {
    this.capturedPiece = piece;
  }

  public setPromotion(pieceType: PieceType): void {
    this.promotionPiece = pieceType;
  }

  public setCheck(isCheck: boolean): void {
    this.isCheck = isCheck;
  }

  public setCheckmate(isCheckmate: boolean): void {
    this.isCheckmate = isCheckmate;
  }

  public setNotation(notation: string): void {
    this.notation = notation;
  }

  /**
   * Convert move to algebraic notation
   * @returns Algebraic notation string
   */
  public toAlgebraicNotation(): string {
    if (this.notation) {
      return this.notation;
    }

    // Special moves
    if (this.moveType === MoveType.CASTLING_KINGSIDE) {
      return 'O-O';
    }
    if (this.moveType === MoveType.CASTLING_QUEENSIDE) {
      return 'O-O-O';
    }

    let notation = '';

    // Piece symbol (except for pawns)
    if (this.piece.getType() !== PieceType.PAWN) {
      notation += this.getPieceSymbol(this.piece.getType());
    }

    // Capture notation
    if (this.capturedPiece) {
      if (this.piece.getType() === PieceType.PAWN) {
        notation += this.from.getFile(); // Pawn captures include file
      }
      notation += 'x';
    }

    // Destination
    notation += this.to.toNotation();

    // Promotion
    if (this.promotionPiece) {
      notation += '=' + this.getPieceSymbol(this.promotionPiece);
    }

    // Check/Checkmate
    if (this.isCheckmate) {
      notation += '#';
    } else if (this.isCheck) {
      notation += '+';
    }

    this.notation = notation;
    return notation;
  }

  private getPieceSymbol(type: PieceType): string {
    const symbols: { [key: string]: string } = {
      [PieceType.KING]: 'K',
      [PieceType.QUEEN]: 'Q',
      [PieceType.ROOK]: 'R',
      [PieceType.BISHOP]: 'B',
      [PieceType.KNIGHT]: 'N',
      [PieceType.PAWN]: ''
    };
    return symbols[type] || '';
  }

  public toString(): string {
    return this.toAlgebraicNotation();
  }

  // Getters
  public getId(): string { return this.id; }
  public getFrom(): Position { return this.from; }
  public getTo(): Position { return this.to; }
  public getPiece(): Piece { return this.piece; }
  public getCapturedPiece(): Piece | null { return this.capturedPiece; }
  public getMoveType(): MoveType { return this.moveType; }
  public getPromotionPiece(): PieceType | null { return this.promotionPiece; }
  public getIsCheck(): boolean { return this.isCheck; }
  public getIsCheckmate(): boolean { return this.isCheckmate; }
  public getTimestamp(): Date { return this.timestamp; }
  public getNotation(): string { return this.toAlgebraicNotation(); }
}
