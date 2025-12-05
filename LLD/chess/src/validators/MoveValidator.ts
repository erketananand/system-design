/**
 * MoveValidator.ts
 * Utility class for validating chess moves
 */

import { Move } from '../models/Move';
import { Position } from '../models/Position';
import { Board } from '../models/Board';
import { PieceColor } from '../enums/PieceColor';
import { PieceType } from '../enums/PieceType';
import { CastlingType } from '../enums/CastlingType';
import { King } from '../models/pieces/King';
import { Pawn } from '../models/pieces/Pawn';

export class MoveValidator {
  /**
   * Validate if a move is legal
   * @param from - Source position
   * @param to - Destination position
   * @param board - Current board
   * @returns True if move is legal
   */
  public static isMoveLegal(from: Position, to: Position, board: Board): boolean {
    const piece = board.getPieceAt(from);

    if (!piece) {
      return false;
    }

    // Check if piece can make this move
    if (!piece.canMove(to, board)) {
      return false;
    }

    // Check if move puts own king in check
    if (this.doesMovePutOwnKingInCheck(from, to, board, piece.getColor())) {
      return false;
    }

    return true;
  }

  /**
   * Check if a move would put own king in check
   * @param from - Source position
   * @param to - Destination position
   * @param board - Current board
   * @param color - Color of moving player
   * @returns True if move puts own king in check
   */
  public static doesMovePutOwnKingInCheck(
    from: Position,
    to: Position,
    board: Board,
    color: PieceColor
  ): boolean {
    // Clone board and make the move
    const clonedBoard = board.clone();
    clonedBoard.movePiece(from, to);

    // Check if own king is in check after the move
    try {
      const king = clonedBoard.getKing(color);
      const opponentColor = color === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
      const attackedSquares = this.getAttackingSquaresForColor(opponentColor, clonedBoard);

      return attackedSquares.has(king.getPosition().toNotation());
    } catch (error) {
      // King not found (shouldn't happen in valid game)
      return true;
    }
  }

  /**
   * Get all squares attacked by a color
   * @param color - Color of attacking pieces
   * @param board - Current board
   * @returns Set of attacked position notations
   */
  public static getAttackingSquaresForColor(color: PieceColor, board: Board): Set<string> {
    const attackedSquares = new Set<string>();
    const pieces = board.getAllPieces(color);

    for (const piece of pieces) {
      const attacks = piece.getAttackingSquares(board);
      for (const pos of attacks) {
        attackedSquares.add(pos.toNotation());
      }
    }

    return attackedSquares;
  }

  /**
   * Check if castling is valid
   * @param king - King piece
   * @param castlingType - Type of castling
   * @param board - Current board
   * @returns True if castling is valid
   */
  public static canCastle(king: King, castlingType: CastlingType, board: Board): boolean {
    if (!king.canCastle(castlingType, board)) {
      return false;
    }

    // Check if king is currently in check
    const opponentColor = king.getColor() === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
    const attackedSquares = this.getAttackingSquaresForColor(opponentColor, board);

    if (attackedSquares.has(king.getPosition().toNotation())) {
      return false; // Can't castle out of check
    }

    // Check if squares king passes through are under attack
    const direction = castlingType === CastlingType.KINGSIDE ? 1 : -1;
    const kingFile = king.getPosition().getFile();
    const rank = king.getPosition().getRank();

    for (let i = 1; i <= 2; i++) {
      const file = String.fromCharCode(kingFile.charCodeAt(0) + (i * direction));
      const pos = new Position(file, rank);

      if (attackedSquares.has(pos.toNotation())) {
        return false; // Can't castle through check
      }
    }

    return true;
  }

  /**
   * Check if en passant is valid
   * @param pawn - Pawn making the capture
   * @param to - Destination position
   * @param board - Current board
   * @param lastMove - Last move made
   * @returns True if en passant is valid
   */
  public static isEnPassantValid(pawn: Pawn, to: Position, board: Board, lastMove: Move | null): boolean {
    if (!lastMove) {
      return false;
    }

    const lastPiece = lastMove.getPiece();

    // Last move must be a pawn moving 2 squares
    if (lastPiece.getType() !== PieceType.PAWN) {
      return false;
    }

    const rankDiff = Math.abs(lastMove.getTo().getRank() - lastMove.getFrom().getRank());
    if (rankDiff !== 2) {
      return false;
    }

    // Pawns must be on same rank
    if (pawn.getPosition().getRank() !== lastMove.getTo().getRank()) {
      return false;
    }

    // Pawns must be adjacent
    const fileDiff = Math.abs(
      pawn.getPosition().getFile().charCodeAt(0) - lastMove.getTo().getFile().charCodeAt(0)
    );
    if (fileDiff !== 1) {
      return false;
    }

    // Destination must be behind the opponent's pawn
    const direction = pawn.getColor() === PieceColor.WHITE ? 1 : -1;
    const expectedRank = lastMove.getTo().getRank() + direction;

    return to.getFile() === lastMove.getTo().getFile() && to.getRank() === expectedRank;
  }

  /**
   * Check if pawn can promote
   * @param pawn - Pawn to check
   * @returns True if pawn can promote
   */
  public static canPromote(pawn: Pawn): boolean {
    return pawn.canPromote();
  }
}
