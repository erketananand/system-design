# CHESS SYSTEM - CLASS DIAGRAM & LOW-LEVEL DESIGN

## Design Patterns Applied

This design incorporates **8 design patterns** for a robust, maintainable chess system:

1. **Singleton** - Game, InMemoryDatabase
2. **Abstract Factory** - PieceFactory for creating pieces
3. **Strategy** - Move calculation strategies per piece type
4. **State** - Game states and turn management
5. **Command** - Move execution with undo capability
6. **Observer** - Board state change notifications
7. **Template Method** - Piece movement validation
8. **Repository** - Data access layer abstraction

---

## Core Class Diagram

### **1. ENUMS**

```typescript
// PieceType.ts
enum PieceType {
  PAWN = 'PAWN',
  ROOK = 'ROOK',
  KNIGHT = 'KNIGHT',
  BISHOP = 'BISHOP',
  QUEEN = 'QUEEN',
  KING = 'KING'
}

// PieceColor.ts
enum PieceColor {
  WHITE = 'WHITE',
  BLACK = 'BLACK'
}

// GameStatus.ts
enum GameStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  CHECK = 'CHECK',
  CHECKMATE = 'CHECKMATE',
  STALEMATE = 'STALEMATE',
  DRAW = 'DRAW',
  RESIGNED = 'RESIGNED'
}

// MoveType.ts
enum MoveType {
  NORMAL = 'NORMAL',
  CAPTURE = 'CAPTURE',
  CASTLING_KINGSIDE = 'CASTLING_KINGSIDE',
  CASTLING_QUEENSIDE = 'CASTLING_QUEENSIDE',
  EN_PASSANT = 'EN_PASSANT',
  PROMOTION = 'PROMOTION'
}

// DrawReason.ts
enum DrawReason {
  STALEMATE = 'STALEMATE',
  INSUFFICIENT_MATERIAL = 'INSUFFICIENT_MATERIAL',
  THREEFOLD_REPETITION = 'THREEFOLD_REPETITION',
  FIFTY_MOVE_RULE = 'FIFTY_MOVE_RULE',
  AGREEMENT = 'AGREEMENT'
}

// CastlingType.ts
enum CastlingType {
  KINGSIDE = 'KINGSIDE',
  QUEENSIDE = 'QUEENSIDE'
}
```

---

### **2. VALUE OBJECTS**

```typescript
// Position.ts
class Position {
  - file: string          // 'a' to 'h'
  - rank: number          // 1 to 8

  + constructor(file: string, rank: number)
  + static fromNotation(notation: string): Position  // "e4" -> Position
  + toNotation(): string                             // Position -> "e4"
  + equals(other: Position): boolean
  + isValid(): boolean
  + clone(): Position
  + getFile(): string
  + getRank(): number
  + toString(): string
}

// Move.ts
class Move {
  - id: string
  - from: Position
  - to: Position
  - piece: Piece
  - capturedPiece: Piece | null
  - moveType: MoveType
  - promotionPiece: PieceType | null
  - isCheck: boolean
  - isCheckmate: boolean
  - timestamp: Date
  - notation: string      // Algebraic notation: "e4", "Nf3", "O-O"

  + constructor(from: Position, to: Position, piece: Piece, moveType: MoveType)
  + setCapturedPiece(piece: Piece): void
  + setPromotion(pieceType: PieceType): void
  + setCheck(isCheck: boolean): void
  + setCheckmate(isCheckmate: boolean): void
  + toAlgebraicNotation(): string
  + toString(): string
  + getFrom(): Position
  + getTo(): Position
  + getPiece(): Piece
  + getCapturedPiece(): Piece | null
  + getMoveType(): MoveType
}
```

---

### **3. ABSTRACT BASE CLASSES**

```typescript
// Piece.ts (Abstract Base Class - Template Method Pattern)
abstract class Piece {
  # id: string
  # type: PieceType
  # color: PieceColor
  # position: Position
  # hasMoved: boolean
  # value: number          // Material value (P=1, N=3, B=3, R=5, Q=9, K=∞)

  + constructor(color: PieceColor, position: Position, type: PieceType)

  // Template Method - defines move validation algorithm
  + canMove(to: Position, board: Board): boolean {
      if (!to.isValid()) return false;
      if (this.position.equals(to)) return false;
      if (!this.isValidMoveForPiece(to, board)) return false;
      return true;
  }

  // Strategy Method - implemented by each piece type
  + abstract isValidMoveForPiece(to: Position, board: Board): boolean
  + abstract getPossibleMoves(board: Board): Position[]
  + abstract getAttackingSquares(board: Board): Position[]
  + abstract clone(): Piece

  // Common methods
  + move(to: Position): void
  + getType(): PieceType
  + getColor(): PieceColor
  + getPosition(): Position
  + setPosition(position: Position): void
  + getValue(): number
  + hasPieceMoved(): boolean
  + setHasMoved(moved: boolean): void
  + getSymbol(): string    // Unicode chess symbols
  + toString(): string
}
```

---

### **4. CONCRETE PIECE CLASSES (Strategy Pattern)**

```typescript
// Pawn.ts
class Pawn extends Piece {
  - enPassantEligible: boolean

  + constructor(color: PieceColor, position: Position)
  + isValidMoveForPiece(to: Position, board: Board): boolean
  + getPossibleMoves(board: Board): Position[]
  + getAttackingSquares(board: Board): Position[]
  + canPromote(): boolean
  + setEnPassantEligible(eligible: boolean): void
  + isEnPassantEligible(): boolean
  + clone(): Pawn
}

// Rook.ts
class Rook extends Piece {
  + constructor(color: PieceColor, position: Position)
  + isValidMoveForPiece(to: Position, board: Board): boolean
  + getPossibleMoves(board: Board): Position[]
  + getAttackingSquares(board: Board): Position[]
  + clone(): Rook
}

// Knight.ts
class Knight extends Piece {
  + constructor(color: PieceColor, position: Position)
  + isValidMoveForPiece(to: Position, board: Board): boolean
  + getPossibleMoves(board: Board): Position[]
  + getAttackingSquares(board: Board): Position[]
  + clone(): Knight
}

// Bishop.ts
class Bishop extends Piece {
  + constructor(color: PieceColor, position: Position)
  + isValidMoveForPiece(to: Position, board: Board): boolean
  + getPossibleMoves(board: Board): Position[]
  + getAttackingSquares(board: Board): Position[]
  + clone(): Bishop
}

// Queen.ts
class Queen extends Piece {
  + constructor(color: PieceColor, position: Position)
  + isValidMoveForPiece(to: Position, board: Board): boolean
  + getPossibleMoves(board: Board): Position[]
  + getAttackingSquares(board: Board): Position[]
  + clone(): Queen
}

// King.ts
class King extends Piece {
  + constructor(color: PieceColor, position: Position)
  + isValidMoveForPiece(to: Position, board: Board): boolean
  + getPossibleMoves(board: Board): Position[]
  + getAttackingSquares(board: Board): Position[]
  + canCastle(castlingType: CastlingType, board: Board): boolean
  + clone(): King
}
```

---

### **5. BOARD & CELL**

```typescript
// Cell.ts
class Cell {
  - position: Position
  - piece: Piece | null

  + constructor(position: Position)
  + setPiece(piece: Piece | null): void
  + getPiece(): Piece | null
  + isEmpty(): boolean
  + getPosition(): Position
  + toString(): string
}

// Board.ts
class Board {
  - id: string
  - cells: Map<string, Cell>    // Key: "a1", "e4", etc.
  - whitePieces: Piece[]
  - blackPieces: Piece[]
  - observers: BoardObserver[]   // Observer pattern

  + constructor()
  + initializeBoard(): void
  + getCell(position: Position): Cell
  + getPieceAt(position: Position): Piece | null
  + setPieceAt(position: Position, piece: Piece | null): void
  + movePiece(from: Position, to: Position): void
  + getAllPieces(color?: PieceColor): Piece[]
  + getKing(color: PieceColor): King
  + isPathClear(from: Position, to: Position): boolean
  + clone(): Board
  + display(): string
  + registerObserver(observer: BoardObserver): void
  + notifyObservers(): void
  + getCellNotation(position: Position): string
}

// BoardObserver.ts (Observer Pattern)
interface BoardObserver {
  + onBoardChanged(board: Board): void
}
```

---

### **6. PLAYER**

```typescript
// Player.ts
class Player implements BoardObserver {
  - id: string
  - name: string
  - color: PieceColor
  - isHuman: boolean
  - capturedPieces: Piece[]
  - drawOffered: boolean

  + constructor(name: string, color: PieceColor, isHuman: boolean)
  + getName(): string
  + getColor(): PieceColor
  + addCapturedPiece(piece: Piece): void
  + getCapturedPieces(): Piece[]
  + offerDraw(): void
  + acceptDraw(): boolean
  + isDrawOffered(): boolean
  + onBoardChanged(board: Board): void
  + toString(): string
}
```

---

### **7. GAME STATES (State Pattern)**

```typescript
// GameState.ts (Abstract State)
abstract class GameState {
  # game: Game

  + constructor(game: Game)
  + abstract handleMove(move: Move): void
  + abstract checkGameStatus(): void
  + abstract getStatus(): GameStatus
  + abstract canMove(): boolean
}

// InProgressState.ts
class InProgressState extends GameState {
  + handleMove(move: Move): void
  + checkGameStatus(): void
  + getStatus(): GameStatus
  + canMove(): boolean
}

// CheckState.ts
class CheckState extends GameState {
  - threatenedKing: King

  + handleMove(move: Move): void
  + checkGameStatus(): void
  + getStatus(): GameStatus
  + canMove(): boolean
  + getThreatenedKing(): King
}

// CheckmateState.ts
class CheckmateState extends GameState {
  - winner: Player

  + handleMove(move: Move): void
  + checkGameStatus(): void
  + getStatus(): GameStatus
  + canMove(): boolean
  + getWinner(): Player
}

// StalemateState.ts
class StalemateState extends GameState {
  + handleMove(move: Move): void
  + checkGameStatus(): void
  + getStatus(): GameStatus
  + canMove(): boolean
}

// DrawState.ts
class DrawState extends GameState {
  - reason: DrawReason

  + constructor(game: Game, reason: DrawReason)
  + handleMove(move: Move): void
  + checkGameStatus(): void
  + getStatus(): GameStatus
  + canMove(): boolean
  + getReason(): DrawReason
}
```

---

### **8. GAME (Singleton)**

```typescript
// Game.ts (Singleton Pattern)
class Game {
  - static instance: Game | null
  - id: string
  - board: Board
  - whitePlayer: Player
  - blackPlayer: Player
  - currentPlayer: Player
  - gameState: GameState
  - moveHistory: Move[]
  - positionHistory: Map<string, number>  // For threefold repetition
  - halfMoveClock: number                  // For fifty-move rule
  - fullMoveNumber: number
  - startTime: Date
  - endTime: Date | null

  - constructor()  // Private
  + static getInstance(): Game
  + static resetInstance(): void

  + startNewGame(whiteName: string, blackName: string): void
  + makeMove(from: Position, to: Position, promotionPiece?: PieceType): Move | null
  + isValidMove(from: Position, to: Position): boolean
  + getPossibleMovesFor(position: Position): Position[]
  + isInCheck(color: PieceColor): boolean
  + isCheckmate(color: PieceColor): boolean
  + isStalemate(color: PieceColor): boolean
  + detectCheck(): boolean
  + detectCheckmate(): boolean
  + detectStalemate(): boolean
  + detectDraw(): DrawReason | null
  + offerDraw(player: Player): void
  + acceptDraw(player: Player): void
  + resign(player: Player): void
  + switchTurn(): void
  + undoLastMove(): boolean
  + getMoveHistory(): Move[]
  + getGameState(): GameState
  + getCurrentPlayer(): Player
  + getBoard(): Board
  + displayBoard(): void
  + getGameStatus(): GameStatus
  + exportToPGN(): string
}
```

---

### **9. MOVE VALIDATOR**

```typescript
// MoveValidator.ts
class MoveValidator {
  + static validateMove(move: Move, board: Board, game: Game): boolean
  + static isMoveLegal(from: Position, to: Position, board: Board): boolean
  + static doesMovePutOwnKingInCheck(move: Move, board: Board, color: PieceColor): boolean
  + static canCastle(king: King, castlingType: CastlingType, board: Board): boolean
  + static isEnPassantValid(pawn: Pawn, to: Position, board: Board, lastMove: Move): boolean
  + static canPromote(pawn: Pawn): boolean
  + static getAttackingSquaresForColor(color: PieceColor, board: Board): Set<string>
}
```

---

### **10. PIECE FACTORY (Abstract Factory Pattern)**

```typescript
// PieceFactory.ts
class PieceFactory {
  + static createPiece(type: PieceType, color: PieceColor, position: Position): Piece
  + static createPawn(color: PieceColor, position: Position): Pawn
  + static createRook(color: PieceColor, position: Position): Rook
  + static createKnight(color: PieceColor, position: Position): Knight
  + static createBishop(color: PieceColor, position: Position): Bishop
  + static createQueen(color: PieceColor, position: Position): Queen
  + static createKing(color: PieceColor, position: Position): King
}
```

---

### **11. MOVE COMMAND (Command Pattern)**

```typescript
// MoveCommand.ts (Command Pattern for Undo)
class MoveCommand {
  - move: Move
  - board: Board
  - capturedPiece: Piece | null
  - previousState: any  // For undo

  + constructor(move: Move, board: Board)
  + execute(): void
  + undo(): void
  + getMove(): Move
}
```

---

### **12. REPOSITORIES**

```typescript
// IRepository.ts (Generic Interface)
interface IRepository<T> {
  + save(entity: T): T
  + findById(id: string): T | null
  + findAll(): T[]
  + delete(id: string): boolean
  + update(entity: T): T | null
}

// GameRepository.ts
class GameRepository implements IRepository<Game> {
  - games: Map<string, Game>

  + save(game: Game): Game
  + findById(id: string): Game | null
  + findAll(): Game[]
  + delete(id: string): boolean
  + update(game: Game): Game | null
  + findActiveGame(): Game | null
}

// MoveRepository.ts
class MoveRepository implements IRepository<Move> {
  - moves: Map<string, Move>

  + save(move: Move): Move
  + findById(id: string): Move | null
  + findAll(): Move[]
  + delete(id: string): boolean
  + update(move: Move): Move | null
  + findByGameId(gameId: string): Move[]
  + getLastMove(): Move | null
}

// PlayerRepository.ts
class PlayerRepository implements IRepository<Player> {
  - players: Map<string, Player>

  + save(player: Player): Player
  + findById(id: string): Player | null
  + findAll(): Player[]
  + delete(id: string): boolean
  + update(player: Player): Player | null
  + findByColor(color: PieceColor): Player | null
}
```

---

### **13. SERVICES**

```typescript
// GameService.ts
class GameService {
  - gameRepository: GameRepository
  - moveRepository: MoveRepository
  - playerRepository: PlayerRepository

  + constructor()
  + createNewGame(whiteName: string, blackName: string): Game
  + makeMove(from: string, to: string, promotion?: PieceType): Move | null
  + getMoveHistory(): Move[]
  + getCurrentGameStatus(): GameStatus
  + offerDraw(): void
  + acceptDraw(): void
  + resign(): void
  + undoMove(): boolean
  + getPossibleMoves(position: string): string[]
  + displayBoard(): void
  + exportGameToPGN(): string
}

// NotationService.ts
class NotationService {
  + static toAlgebraicNotation(move: Move, board: Board): string
  + static fromAlgebraicNotation(notation: string, board: Board): Move | null
  + static positionToNotation(position: Position): string
  + static notationToPosition(notation: string): Position
  + static moveToPGN(move: Move): string
}
```

---

### **14. DATABASE (Singleton)**

```typescript
// InMemoryDatabase.ts (Singleton)
class InMemoryDatabase {
  - static instance: InMemoryDatabase | null
  - games: Map<string, Game>
  - moves: Map<string, Move>
  - players: Map<string, Player>

  - constructor()  // Private
  + static getInstance(): InMemoryDatabase
  + reset(): void
  + getGames(): Map<string, Game>
  + getMoves(): Map<string, Move>
  + getPlayers(): Map<string, Player>
}
```

---

### **15. UTILITIES**

```typescript
// IdGenerator.ts
class IdGenerator {
  - static counter: number
  + static generateId(prefix: string): string
  + static reset(): void
}

// Logger.ts
class Logger {
  + static info(message: string): void
  + static error(message: string): void
  + static warn(message: string): void
  + static debug(message: string): void
}

// BoardUtils.ts
class BoardUtils {
  + static isPositionOnBoard(position: Position): boolean
  + static getDistance(from: Position, to: Position): number
  + static isDiagonal(from: Position, to: Position): boolean
  + static isStraight(from: Position, to: Position): boolean
  + static getDirection(from: Position, to: Position): {dx: number, dy: number}
  + static hashBoard(board: Board): string
}
```

---

### **16. CONSOLE INTERFACE**

```typescript
// ChessConsole.ts
class ChessConsole {
  - gameService: GameService
  - readline: readline.Interface

  + constructor()
  + start(): void
  + displayMenu(): void
  + handleStartNewGame(): void
  + handleMakeMove(): void
  + handleDisplayBoard(): void
  + handleShowMoves(): void
  + handleOfferDraw(): void
  + handleResign(): void
  + handleUndoMove(): void
  + handleMoveHistory(): void
  + handleExportPGN(): void
  + handleExit(): void
  - readInput(prompt: string): Promise<string>
}
```

---

## Design Pattern Summary

| Pattern | Classes | Purpose |
|---------|---------|---------|
| **Singleton** | Game, InMemoryDatabase | Single game instance, centralized data |
| **Abstract Factory** | PieceFactory | Create piece objects without specifying exact class |
| **Strategy** | Piece subclasses | Different move algorithms per piece type |
| **State** | GameState hierarchy | Game behavior changes based on state |
| **Command** | MoveCommand | Encapsulate moves for undo functionality |
| **Observer** | BoardObserver, Player | Notify players of board changes |
| **Template Method** | Piece.canMove() | Define algorithm skeleton, subclasses fill details |
| **Repository** | All Repository classes | Abstract data access layer |

---

## Class Relationships

- **Board** *contains* 64 **Cells**
- **Cell** *contains* 0 or 1 **Piece**
- **Piece** is *abstract parent* of 6 concrete piece types
- **Game** *has-a* **Board**, 2 **Players**, **GameState**
- **Player** *implements* **BoardObserver**
- **GameState** *has* multiple concrete states
- **Move** *references* **Piece** and **Positions**

---

## Key Design Decisions

1. **Position as Value Object:** Immutable, validated coordinates
2. **Piece Movement:** Each piece knows its own rules (Strategy)
3. **Check Detection:** Calculate all attacking squares after move
4. **Move Validation:** Multi-layer (piece rules → path clear → king safety)
5. **State Management:** Game state controls what operations are allowed
6. **Observer Pattern:** Players notified of board changes
7. **Command Pattern:** Moves are commands for undo support
8. **Repository Pattern:** Clean separation of business logic and data

---

**Document Status:** ✅ Complete  
**Total Classes:** 40+ classes across all layers  
**Design Patterns:** 8 patterns applied  
**Next Step:** Database schema design
