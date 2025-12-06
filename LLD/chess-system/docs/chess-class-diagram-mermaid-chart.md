# Chess System - Complete Class Diagram
https://www.mermaidchart.com/
```mermaid
classDiagram
    %% Enums
    class PieceType {
        <<enumeration>>
        KING
        QUEEN
        ROOK
        BISHOP
        KNIGHT
        PAWN
    }

    class PieceColor {
        <<enumeration>>
        WHITE
        BLACK
    }

    class GameStatus {
        <<enumeration>>
        IN_PROGRESS
        CHECK
        CHECKMATE
        STALEMATE
        DRAW
    }

    class MoveType {
        <<enumeration>>
        NORMAL
        CAPTURE
        CASTLING
        EN_PASSANT
        PROMOTION
    }

    class DrawReason {
        <<enumeration>>
        STALEMATE
        THREEFOLD_REPETITION
        FIFTY_MOVE_RULE
        INSUFFICIENT_MATERIAL
        AGREEMENT
    }

    class CastlingType {
        <<enumeration>>
        KINGSIDE
        QUEENSIDE
    }

    %% Core Models
    class Position {
        -file: string
        -rank: number
        +Position(file: string, rank: number)
        +static fromNotation(notation: string): Position
        +toNotation(): string
        +equals(other: Position): boolean
        +isValid(): boolean
        +getFile(): string
        +getRank(): number
    }

    class Cell {
        -id: string
        -position: Position
        -piece: Piece | null
        +Cell(position: Position)
        +setPiece(piece: Piece | null): void
        +getPiece(): Piece | null
        +isEmpty(): boolean
        +getPosition(): Position
        +getId(): string
        +toString(): string
    }

    class Board {
        -id: string
        -cells: Map~string, Cell~
        -whitePieces: Piece[]
        -blackPieces: Piece[]
        -observers: BoardObserver[]
        +Board()
        -initializeCells(): void
        +initializeBoard(): void
        +getPieceAt(position: Position): Piece | null
        +movePiece(from: Position, to: Position): boolean
        +removePiece(piece: Piece): void
        +addPiece(piece: Piece): void
        +findKing(color: PieceColor): King | null
        +getAllPieces(color: PieceColor): Piece[]
        +attachObserver(observer: BoardObserver): void
        +detachObserver(observer: BoardObserver): void
        -notifyObservers(): void
        +getCell(position: Position): Cell | null
        +clone(): Board
        +toString(): string
    }

    class Move {
        -id: string
        -from: Position
        -to: Position
        -piece: Piece
        -moveType: MoveType
        -capturedPiece: Piece | null
        -promotionPiece: PieceType | null
        -isCheck: boolean
        -isCheckmate: boolean
        -timestamp: Date
        -notation: string
        +Move(from: Position, to: Position, piece: Piece, moveType: MoveType)
        +setCapturedPiece(piece: Piece): void
        +setPromotion(pieceType: PieceType): void
        +setCheck(isCheck: boolean): void
        +setCheckmate(isCheckmate: boolean): void
        +setNotation(notation: string): void
        +toAlgebraicNotation(): string
        +getId(): string
        +getFrom(): Position
        +getTo(): Position
        +getPiece(): Piece
        +getMoveType(): MoveType
    }

    class Player {
        -id: string
        -name: string
        -color: PieceColor
        -isHuman: boolean
        -capturedPieces: Piece[]
        -drawOffered: boolean
        +Player(name: string, color: PieceColor, isHuman: boolean)
        +getName(): string
        +getColor(): PieceColor
        +getIsHuman(): boolean
        +addCapturedPiece(piece: Piece): void
        +getCapturedPieces(): Piece[]
        +getCapturedValue(): number
        +offerDraw(): void
        +isDrawOffered(): boolean
        +resetDrawOffer(): void
        +onBoardChanged(board: Board): void
        +getId(): string
    }

    class Game {
        -static instance: Game | null
        -id: string
        -board: Board
        -whitePlayer: Player
        -blackPlayer: Player
        -currentPlayer: Player
        -gameState: GameState
        -moveHistory: Move[]
        -positionHistory: Map~string, number~
        -halfMoveClock: number
        -fullMoveNumber: number
        -startTime: Date
        -endTime: Date | null
        -Game()
        +static getInstance(): Game
        +static resetInstance(): void
        +startNewGame(whiteName: string, blackName: string): void
        +makeMove(from: Position, to: Position, promotionPiece?: PieceType): boolean
        +isInCheck(color: PieceColor): boolean
        +isCheckmate(color: PieceColor): boolean
        +isStalemate(color: PieceColor): boolean
        +detectDraw(): DrawReason | null
        +offerDraw(): void
        +acceptDraw(): void
        +resign(): void
        +getBoard(): Board
        +getCurrentPlayer(): Player
        +getWhitePlayer(): Player
        +getBlackPlayer(): Player
        +getGameState(): GameState
        +setState(state: GameState): void
        +getMoveHistory(): Move[]
        +getStatus(): GameStatus
        +switchPlayer(): void
    }

    class PositionHistory {
        -id: string
        -gameId: string
        -boardHash: string
        -occurrenceCount: number
        -firstOccurrenceMove: number
        -lastOccurrenceMove: number
        +PositionHistory(gameId: string, boardHash: string, moveNumber: number)
        +incrementOccurrence(moveNumber: number): void
        +getId(): string
        +getGameId(): string
        +getBoardHash(): string
        +getOccurrenceCount(): number
        +getFirstOccurrenceMove(): number
        +getLastOccurrenceMove(): number
    }

    %% Abstract Piece Class
    class Piece {
        <<abstract>>
        #id: string
        #type: PieceType
        #color: PieceColor
        #position: Position
        #hasMoved: boolean
        #value: number
        +Piece(color: PieceColor, position: Position, type: PieceType, value: number)
        +canMove(to: Position, board: Board): boolean
        #isValidMoveForPiece(to: Position, board: Board): boolean*
        +getPossibleMoves(board: Board): Position[]*
        +getType(): PieceType
        +getColor(): PieceColor
        +getPosition(): Position
        +setPosition(position: Position): void
        +hasPieceMoved(): boolean
        +setHasMoved(moved: boolean): void
        +getValue(): number
        +getId(): string
        +getSymbol(): string*
        +clone(): Piece*
    }

    %% Concrete Pieces
    class King {
        +King(color: PieceColor, position: Position)
        +isValidMoveForPiece(to: Position, board: Board): boolean
        +getPossibleMoves(board: Board): Position[]
        +canCastle(castlingType: CastlingType, board: Board): boolean
        +getSymbol(): string
        +clone(): King
    }

    class Queen {
        +Queen(color: PieceColor, position: Position)
        +isValidMoveForPiece(to: Position, board: Board): boolean
        +getPossibleMoves(board: Board): Position[]
        +getSymbol(): string
        +clone(): Queen
    }

    class Rook {
        +Rook(color: PieceColor, position: Position)
        +isValidMoveForPiece(to: Position, board: Board): boolean
        +getPossibleMoves(board: Board): Position[]
        +getSymbol(): string
        +clone(): Rook
    }

    class Bishop {
        +Bishop(color: PieceColor, position: Position)
        +isValidMoveForPiece(to: Position, board: Board): boolean
        +getPossibleMoves(board: Board): Position[]
        +getSymbol(): string
        +clone(): Bishop
    }

    class Knight {
        +Knight(color: PieceColor, position: Position)
        +isValidMoveForPiece(to: Position, board: Board): boolean
        +getPossibleMoves(board: Board): Position[]
        +getSymbol(): string
        +clone(): Knight
    }

    class Pawn {
        -enPassantEligible: boolean
        +Pawn(color: PieceColor, position: Position)
        +isValidMoveForPiece(to: Position, board: Board): boolean
        +getPossibleMoves(board: Board): Position[]
        +canPromote(): boolean
        +setEnPassantEligible(eligible: boolean): void
        +isEnPassantEligible(): boolean
        +getSymbol(): string
        +clone(): Pawn
    }

    %% State Pattern
    class GameState {
        <<abstract>>
        #game: Game
        +GameState(game: Game)
        +handleMove(move: Move): void*
        +checkGameStatus(): void*
        +getStatus(): GameStatus*
        +canMove(): boolean*
    }

    class InProgressState {
        +InProgressState(game: Game)
        +handleMove(move: Move): void
        +checkGameStatus(): void
        +getStatus(): GameStatus
        +canMove(): boolean
    }

    class CheckState {
        +CheckState(game: Game)
        +handleMove(move: Move): void
        +checkGameStatus(): void
        +getStatus(): GameStatus
        +canMove(): boolean
    }

    class CheckmateState {
        -winner: Player
        +CheckmateState(game: Game, winner: Player)
        +handleMove(move: Move): void
        +checkGameStatus(): void
        +getStatus(): GameStatus
        +canMove(): boolean
        +getWinner(): Player
    }

    class StalemateState {
        +StalemateState(game: Game)
        +handleMove(move: Move): void
        +checkGameStatus(): void
        +getStatus(): GameStatus
        +canMove(): boolean
    }

    class DrawState {
        -reason: DrawReason
        +DrawState(game: Game, reason: DrawReason)
        +handleMove(move: Move): void
        +checkGameStatus(): void
        +getStatus(): GameStatus
        +canMove(): boolean
        +getReason(): DrawReason
    }

    %% Observer Pattern
    class BoardObserver {
        <<interface>>
        +onBoardChanged(board: Board): void
    }

    %% Command Pattern
    class MoveCommand {
        -move: Move
        -board: Board
        -capturedPiece: Piece | null
        -previousPosition: Position
        -pieceHadMoved: boolean
        +MoveCommand(move: Move, board: Board)
        +execute(): void
        +undo(): void
    }

    %% Factory Pattern
    class PieceFactory {
        <<factory>>
        +static createPiece(type: PieceType, color: PieceColor, position: Position): Piece
        +static createPawn(color: PieceColor, position: Position): Pawn
        +static createRook(color: PieceColor, position: Position): Rook
        +static createKnight(color: PieceColor, position: Position): Knight
        +static createBishop(color: PieceColor, position: Position): Bishop
        +static createQueen(color: PieceColor, position: Position): Queen
        +static createKing(color: PieceColor, position: Position): King
        +static setupStandardBoard(): Piece[]
    }

    %% Validators
    class MoveValidator {
        <<utility>>
        +static isMoveLegal(from: Position, to: Position, board: Board): boolean
        +static doesMovePutOwnKingInCheck(from: Position, to: Position, board: Board, color: PieceColor): boolean
        +static isSquareUnderAttack(position: Position, board: Board, attackingColor: PieceColor): boolean
        +static hasLegalMoves(color: PieceColor, board: Board): boolean
        +static canCastleKingside(color: PieceColor, board: Board): boolean
        +static canCastleQueenside(color: PieceColor, board: Board): boolean
    }

    %% Services
    class GameService {
        -gameRepository: GameRepository
        -moveRepository: MoveRepository
        -playerRepository: PlayerRepository
        -game: Game | null
        +GameService()
        +createNewGame(whiteName: string, blackName: string): Game
        +getCurrentGame(): Game | null
        +makeMove(from: string, to: string, promotionPiece?: PieceType): boolean
        +getMoveHistory(): Move[]
        +offerDraw(): void
        +acceptDraw(): void
        +resign(): void
        +getGameStatus(): GameStatus
        +saveGame(): void
        +loadGame(gameId: string): Game | null
    }

    class NotationService {
        <<utility>>
        +static toAlgebraicNotation(move: Move, board: Board): string
        +static fromAlgebraicNotation(notation: string, board: Board): Object | null
        +static positionToNotation(position: Position): string
        +static notationToPosition(notation: string): Position | null
    }

    %% Repository Pattern
    class IRepository~T~ {
        <<interface>>
        +save(entity: T): T
        +findById(id: string): T | null
        +findAll(): T[]
        +delete(id: string): boolean
        +update(entity: T): T | null
    }

    class GameRepository {
        -db: InMemoryDatabase
        +GameRepository()
        +save(game: Game): Game
        +findById(id: string): Game | null
        +findAll(): Game[]
        +delete(id: string): boolean
        +update(game: Game): Game | null
        +findActiveGame(): Game | null
        +clear(): void
    }

    class MoveRepository {
        -db: InMemoryDatabase
        +MoveRepository()
        +save(move: Move): Move
        +findById(id: string): Move | null
        +findAll(): Move[]
        +delete(id: string): boolean
        +update(move: Move): Move | null
        +findByGameId(gameId: string): Move[]
        +clear(): void
    }

    class PlayerRepository {
        -db: InMemoryDatabase
        +PlayerRepository()
        +save(player: Player): Player
        +findById(id: string): Player | null
        +findAll(): Player[]
        +delete(id: string): boolean
        +update(player: Player): Player | null
        +findByColor(color: PieceColor): Player | null
        +clear(): void
    }

    class PositionHistoryRepository {
        -db: InMemoryDatabase
        +PositionHistoryRepository()
        +save(positionHistory: PositionHistory): PositionHistory
        +findById(id: string): PositionHistory | null
        +findAll(): PositionHistory[]
        +delete(id: string): boolean
        +update(positionHistory: PositionHistory): PositionHistory | null
        +findByBoardHash(hash: string): PositionHistory | null
        +clear(): void
    }

    %% Database
    class InMemoryDatabase {
        -static instance: InMemoryDatabase | null
        -games: Map~string, Game~
        -moves: Map~string, Move~
        -players: Map~string, Player~
        -boards: Map~string, Board~
        -positionHistory: Map~string, PositionHistory~
        -InMemoryDatabase()
        +static getInstance(): InMemoryDatabase
        +static resetInstance(): void
        +reset(): void
        +getGames(): Map~string, Game~
        +getMoves(): Map~string, Move~
        +getPlayers(): Map~string, Player~
        +getBoards(): Map~string, Board~
        +getPositionHistory(): Map~string, PositionHistory~
    }

    %% Utilities
    class BoardUtils {
        <<utility>>
        +static isPathClear(from: Position, to: Position, board: Board): boolean
        +static generateBoardHash(board: Board): string
        +static isPositionValid(position: Position): boolean
        +static getPositionsBetween(from: Position, to: Position): Position[]
    }

    class IdGenerator {
        <<utility>>
        -static counters: Map~string, number~
        +static generateId(prefix: string): string
        +static reset(): void
    }

    class Logger {
        <<utility>>
        +static info(message: string): void
        +static warn(message: string): void
        +static error(message: string): void
        +static debug(message: string): void
    }

    %% Console Interface
    class ChessConsole {
        -gameService: GameService
        -rl: readline.Interface
        -isRunning: boolean
        +ChessConsole()
        +start(): Promise~void~
        -displayWelcome(): void
        -displayMenu(): Promise~void~
        -startNewGame(): Promise~void~
        -playGame(): Promise~void~
        -displayBoard(): void
        -makeMove(): Promise~void~
        -offerDraw(): Promise~void~
        -resign(): Promise~void~
        -showMoveHistory(): void
    }

    %% Relationships - Inheritance (Extends)
    Piece <|-- King : extends
    Piece <|-- Queen : extends
    Piece <|-- Rook : extends
    Piece <|-- Bishop : extends
    Piece <|-- Knight : extends
    Piece <|-- Pawn : extends
    
    GameState <|-- InProgressState : extends
    GameState <|-- CheckState : extends
    GameState <|-- CheckmateState : extends
    GameState <|-- StalemateState : extends
    GameState <|-- DrawState : extends
    
    IRepository~T~ <|.. GameRepository : implements
    IRepository~T~ <|.. MoveRepository : implements
    IRepository~T~ <|.. PlayerRepository : implements
    IRepository~T~ <|.. PositionHistoryRepository : implements
    
    BoardObserver <|.. Player : implements

    %% Relationships - Composition (Strong ownership)
    Game *-- Board : contains
    Game *-- Player : contains (2)
    Game *-- Move : contains (history)
    Board *-- Cell : contains (64)
    Cell *-- Position : contains
    Cell *-- Piece : contains (0..1)
    Move *-- Position : contains (from/to)
    MoveCommand *-- Move : contains
    MoveCommand *-- Board : operates on
    
    %% Relationships - Aggregation (Shared ownership)
    Game o-- GameState : has current
    Game o-- PositionHistory : tracks
    Board o-- Piece : manages
    Player o-- Piece : captured pieces
    Move o-- Piece : references
    
    %% Relationships - Association
    Game --> MoveValidator : uses
    Game --> PieceFactory : uses
    Game --> BoardUtils : uses
    Game --> NotationService : uses
    Board --> BoardObserver : notifies
    Piece --> Board : validates moves
    Piece --> PieceType : typed by
    Piece --> PieceColor : colored by
    Player --> PieceColor : has color
    Move --> MoveType : has type
    GameState --> GameStatus : returns
    DrawState --> DrawReason : has reason
    King --> CastlingType : supports
    
    GameService --> Game : manages
    GameService --> GameRepository : uses
    GameService --> MoveRepository : uses
    GameService --> PlayerRepository : uses
    
    GameRepository --> InMemoryDatabase : uses
    MoveRepository --> InMemoryDatabase : uses
    PlayerRepository --> InMemoryDatabase : uses
    PositionHistoryRepository --> InMemoryDatabase : uses
    
    ChessConsole --> GameService : uses
    
    PieceFactory ..> Piece : creates
    PieceFactory ..> King : creates
    PieceFactory ..> Queen : creates
    PieceFactory ..> Rook : creates
    PieceFactory ..> Bishop : creates
    PieceFactory ..> Knight : creates
    PieceFactory ..> Pawn : creates
    
    MoveValidator --> Board : validates
    MoveValidator --> Position : uses
    BoardUtils --> Board : analyzes
    BoardUtils --> Position : uses
```

## Relationship Legend

### 1. **Inheritance (Extends)** - `<|--`
- All piece classes (King, Queen, Rook, Bishop, Knight, Pawn) extend abstract Piece class
- All state classes extend abstract GameState class

### 2. **Implementation (Implements)** - `<|..`
- All Repository classes implement IRepository interface
- Player class implements BoardObserver interface

### 3. **Composition** (Strong ownership, lifecycle dependent) - `*--`
- Game *contains* Board (Board cannot exist without Game)
- Game *contains* Players (Players are created with Game)
- Board *contains* 64 Cells (Cells are part of Board)
- Cell *contains* Position (Position is part of Cell)
- Move *contains* Positions (from/to are integral to Move)

### 4. **Aggregation** (Shared ownership, lifecycle independent) - `o--`
- Game *has* GameState (State can change, exists independently)
- Board *manages* Pieces (Pieces can be moved/captured)
- Player *has* captured Pieces (Pieces exist independently)
- Move *references* Piece (Piece exists independently of Move)

### 5. **Association** (Uses/Depends on) - `-->`
- Game uses MoveValidator, PieceFactory, BoardUtils, NotationService
- GameService manages Game and uses Repositories
- Repositories use InMemoryDatabase
- ChessConsole uses GameService

### 6. **Dependency** (Creates/Instantiates) - `..>`
- PieceFactory creates all Piece types
- Factories create instances without strong ownership

## Design Patterns Used

1. **Singleton Pattern**: Game, InMemoryDatabase
2. **State Pattern**: GameState and its implementations
3. **Observer Pattern**: BoardObserver interface
4. **Command Pattern**: MoveCommand
5. **Factory Pattern**: PieceFactory
6. **Repository Pattern**: IRepository and implementations
7. **Template Method Pattern**: Piece.canMove()
8. **Value Object Pattern**: Position

