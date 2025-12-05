/**
 * MoveType.ts
 * Enum representing different types of chess moves
 */

export enum MoveType {
  NORMAL = 'NORMAL',
  CAPTURE = 'CAPTURE',
  CASTLING_KINGSIDE = 'CASTLING_KINGSIDE',
  CASTLING_QUEENSIDE = 'CASTLING_QUEENSIDE',
  EN_PASSANT = 'EN_PASSANT',
  PROMOTION = 'PROMOTION'
}
