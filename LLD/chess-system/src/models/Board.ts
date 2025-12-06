/**
 * Board.ts
 * Represents the chess board with 64 cells
 */

import { Cell } from './Cell';
import { Position } from './Position';
import { Piece } from './pieces/Piece';
import { PieceColor } from '../enums/PieceColor';
import { PieceType } from '../enums/PieceType';
import { King } from './pieces/King';
import { BoardObserver } from './BoardObserver';
import { IdGenerator } from '../utils/IdGenerator';
import { BoardUtils } from '../utils/BoardUtils';

export class Board {
  private readonly id: string;
  private cells: Map<string, Cell> = new Map();
  private whitePieces: Piece[] = [];
  private blackPieces: Piece[] = [];
  private observers: BoardObserver[] = [];

  constructor() {
    this.id = IdGenerator.generateId('BOARD');
    this.initializeCells();
  }

  /**
   * Initialize all 64 cells on the board
   */
  private initializeCells(): void {
    for (let rank = 1; rank <= 8; rank++) {
      for (let file = 'a'; file <= 'h'; file = String.fromCharCode(file.charCodeAt(0) + 1)) {
        const position = new Position(file, rank);
        const cell = new Cell(position);
        this.cells.set(position.toNotation(), cell);
      }
    }
  }

  /**
   * Initialize board with starting chess position
   */
  public initializeBoard(): void {
    // This will be called from a factory/setup service
    // For now, just clear the board
    this.whitePieces = [];
    this.blackPieces = [];

    for (const cell of this.cells.values()) {
      cell.setPiece(null);
    }
  }

  /**
   * Get cell at position
   * @param position - Position to get
   * @returns Cell at position
   */
  public getCell(position: Position): Cell {
    const cell = this.cells.get(position.toNotation());
    if (!cell) {
      throw new Error(`Cell not found at position: ${position.toNotation()}`);
    }
    return cell;
  }

  /**
   * Get piece at position
   * @param position - Position to check
   * @returns Piece at position or null
   */
  public getPieceAt(position: Position): Piece | null {
    const cell = this.cells.get(position.toNotation());
    return cell ? cell.getPiece() : null;
  }

  /**
   * Set piece at position
   * @param position - Position to set
   * @param piece - Piece to place (or null to clear)
   */
  public setPieceAt(position: Position, piece: Piece | null): void {
    const cell = this.getCell(position);
    cell.setPiece(piece);

    if (piece) {
      piece.setPosition(position);
    }

    this.notifyObservers();
  }

  /**
   * Move piece from one position to another
   * @param from - Source position
   * @param to - Destination position
   */
  public movePiece(from: Position, to: Position): void {
    const piece = this.getPieceAt(from);
    if (!piece) {
      throw new Error(`No piece at position: ${from.toNotation()}`);
    }

    // Remove piece from source
    this.setPieceAt(from, null);

    // Place piece at destination
    this.setPieceAt(to, piece);
    piece.move(to);

    this.notifyObservers();
  }

  /**
   * Get all pieces of a specific color
   * @param color - Color filter (optional)
   * @returns Array of pieces
   */
  public getAllPieces(color?: PieceColor): Piece[] {
    if (color === PieceColor.WHITE) {
      return [...this.whitePieces];
    }
    if (color === PieceColor.BLACK) {
      return [...this.blackPieces];
    }
    return [...this.whitePieces, ...this.blackPieces];
  }

  /**
   * Add piece to board
   * @param piece - Piece to add
   */
  public addPiece(piece: Piece): void {
    this.setPieceAt(piece.getPosition(), piece);

    if (piece.getColor() === PieceColor.WHITE) {
      this.whitePieces.push(piece);
    } else {
      this.blackPieces.push(piece);
    }
  }

  /**
   * Remove piece from board
   * @param piece - Piece to remove
   */
  public removePiece(piece: Piece): void {
    this.setPieceAt(piece.getPosition(), null);

    if (piece.getColor() === PieceColor.WHITE) {
      this.whitePieces = this.whitePieces.filter(p => p.getId() !== piece.getId());
    } else {
      this.blackPieces = this.blackPieces.filter(p => p.getId() !== piece.getId());
    }
  }

  /**
   * Get king of specific color
   * @param color - Color of king
   * @returns King piece
   */
  public getKing(color: PieceColor): King {
    const pieces = color === PieceColor.WHITE ? this.whitePieces : this.blackPieces;
    const king = pieces.find(p => p.getType() === PieceType.KING);

    if (!king) {
      throw new Error(`King not found for color: ${color}`);
    }

    return king as King;
  }

  /**
   * Check if path between two positions is clear
   * @param from - Starting position
   * @param to - Ending position
   * @returns True if path is clear
   */
  public isPathClear(from: Position, to: Position): boolean {
    const positions = BoardUtils.getPositionsBetween(from, to);

    for (const pos of positions) {
      if (this.getPieceAt(pos) !== null) {
        return false;
      }
    }

    return true;
  }

  /**
   * Clone the board
   * @returns Cloned board
   */
  public clone(): Board {
    const clonedBoard = new Board();

    // Clone all pieces
    for (const piece of this.whitePieces) {
      const clonedPiece = piece.clone();
      clonedBoard.addPiece(clonedPiece);
    }

    for (const piece of this.blackPieces) {
      const clonedPiece = piece.clone();
      clonedBoard.addPiece(clonedPiece);
    }

    return clonedBoard;
  }

  /**
   * Display board as string
   * @returns String representation of board
   */
  public display(): string {
    let display = `
  a b c d e f g h
`;

    for (let rank = 8; rank >= 1; rank--) {
      display += `${rank} `;

      for (let file = 'a'; file <= 'h'; file = String.fromCharCode(file.charCodeAt(0) + 1)) {
        const position = new Position(file, rank);
        const cell = this.getCell(position);
        display += cell.toString() + ' ';
      }

      display += `${rank}
`;
    }

    display += `  a b c d e f g h
`;
    return display;
  }

  /**
   * Register observer for board changes
   * @param observer - Observer to register
   */
  public registerObserver(observer: BoardObserver): void {
    this.observers.push(observer);
  }

  /**
   * Notify all observers of board change
   */
  public notifyObservers(): void {
    for (const observer of this.observers) {
      observer.onBoardChanged(this);
    }
  }

  public getCellNotation(position: Position): string {
    return position.toNotation();
  }

  public getId(): string {
    return this.id;
  }

  public getCells(): Map<string, Cell> {
    return this.cells;
  }
}
