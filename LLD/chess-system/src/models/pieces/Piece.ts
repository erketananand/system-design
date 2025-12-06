/**
 * Piece.ts
 * Abstract base class for all chess pieces
 * Implements Template Method pattern for move validation
 */

import { Position } from '../Position';
import { PieceType } from '../../enums/PieceType';
import { PieceColor } from '../../enums/PieceColor';
import { Board } from '../Board';
import { IdGenerator } from '../../utils/IdGenerator';

export abstract class Piece {
  protected readonly id: string;
  protected readonly type: PieceType;
  protected readonly color: PieceColor;
  protected position: Position;
  protected hasMoved: boolean = false;
  protected readonly value: number;

  constructor(color: PieceColor, position: Position, type: PieceType, value: number) {
    this.id = IdGenerator.generateId('PIECE');
    this.type = type;
    this.color = color;
    this.position = position;
    this.value = value;
  }

  /**
   * Template Method - defines move validation algorithm
   * @param to - Destination position
   * @param board - Current board state
   * @returns True if move is valid
   */
  public canMove(to: Position, board: Board): boolean {
    if (!to.isValid()) {
      return false;
    }

    if (this.position.equals(to)) {
      return false;
    }

    // Check if destination has own piece
    const targetPiece = board.getPieceAt(to);
    if (targetPiece && targetPiece.getColor() === this.color) {
      return false;
    }

    return this.isValidMoveForPiece(to, board);
  }

  /**
   * Strategy Method - implemented by each piece type
   * @param to - Destination position
   * @param board - Current board state
   * @returns True if move is valid for this piece type
   */
  public abstract isValidMoveForPiece(to: Position, board: Board): boolean;

  /**
   * Get all possible moves for this piece
   * @param board - Current board state
   * @returns Array of valid positions
   */
  public abstract getPossibleMoves(board: Board): Position[];

  /**
   * Get all squares this piece is attacking
   * @param board - Current board state
   * @returns Array of attacked positions
   */
  public abstract getAttackingSquares(board: Board): Position[];

  /**
   * Clone this piece
   * @returns Cloned piece
   */
  public abstract clone(): Piece;

  /**
   * Move piece to new position
   * @param to - Destination position
   */
  public move(to: Position): void {
    this.position = to;
    this.hasMoved = true;
  }

  /**
   * Get Unicode symbol for this piece
   * @returns Unicode chess symbol
   */
  public getSymbol(): string {
    const symbols: { [key: string]: { [key: string]: string } } = {
      [PieceColor.WHITE]: {
        [PieceType.KING]: '♔',
        [PieceType.QUEEN]: '♕',
        [PieceType.ROOK]: '♖',
        [PieceType.BISHOP]: '♗',
        [PieceType.KNIGHT]: '♘',
        [PieceType.PAWN]: '♙'
      },
      [PieceColor.BLACK]: {
        [PieceType.KING]: '♚',
        [PieceType.QUEEN]: '♛',
        [PieceType.ROOK]: '♜',
        [PieceType.BISHOP]: '♝',
        [PieceType.KNIGHT]: '♞',
        [PieceType.PAWN]: '♟'
      }
    };
    return symbols[this.color][this.type];
  }

  public toString(): string {
    return `${this.color} ${this.type} at ${this.position.toNotation()}`;
  }

  // Getters and Setters
  public getId(): string { return this.id; }
  public getType(): PieceType { return this.type; }
  public getColor(): PieceColor { return this.color; }
  public getPosition(): Position { return this.position; }
  public setPosition(position: Position): void { this.position = position; }
  public getValue(): number { return this.value; }
  public hasPieceMoved(): boolean { return this.hasMoved; }
  public setHasMoved(moved: boolean): void { this.hasMoved = moved; }
}
