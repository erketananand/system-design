# Chess Game System

A comprehensive chess game system built with TypeScript, featuring complete rule enforcement, design patterns, and an interactive console interface.

## Features

### Primary Features (MVP)
- ✅ **Board & Piece Management**: 8×8 board with all 6 piece types
- ✅ **Move Validation**: Complete rule enforcement for all pieces
- ✅ **Turn Management**: Alternating turns with piece ownership validation
- ✅ **Check & Checkmate Detection**: Automatic detection and game-ending logic
- ✅ **Special Moves**: Castling, en passant, pawn promotion
- ✅ **Game State Management**: In Progress, Check, Checkmate, Stalemate, Draw

### Secondary Features
- ✅ **Move Notation**: Standard Algebraic Notation (SAN) support
- ✅ **Move History**: Complete game record with timestamps
- ✅ **Draw Conditions**: Threefold repetition, 50-move rule, insufficient material, agreement
- ✅ **PGN Export**: Export games in standard PGN format

## Design Patterns

This system implements 8 design patterns:

1. **Singleton**: Game, InMemoryDatabase
2. **Abstract Factory**: PieceFactory
3. **Strategy**: Piece movement algorithms
4. **State**: Game states (InProgress, Check, Checkmate, etc.)
5. **Command**: Move execution with undo capability
6. **Observer**: Board state change notifications
7. **Template Method**: Piece validation algorithm
8. **Repository**: Data access layer abstraction

## Architecture

```
chess-system/
├── src/
│   ├── enums/           # Type-safe enumerations (6 files)
│   ├── models/          # Domain entities (13 files)
│   │   └── pieces/      # Piece hierarchy (7 files)
│   ├── states/          # State pattern (6 files)
│   ├── factories/       # Factory pattern (1 file)
│   ├── validators/      # Move validation (1 file)
│   ├── commands/        # Command pattern (1 file)
│   ├── database/        # In-memory storage (1 file)
│   ├── repositories/    # Data access layer (5 files)
│   ├── services/        # Business logic (2 files)
│   ├── utils/           # Utility classes (3 files)
│   └── console/         # Interactive CLI (1 file)
├── docs/                # Documentation
├── package.json
├── tsconfig.json
└── README.md
```

**Total Files**: 40+ TypeScript files

## Installation

### Prerequisites
- Node.js >= 16.0.0
- npm >= 8.0.0

### Setup
```bash
# Clone or extract the project
cd chess-system

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

### Start the Console Interface
```bash
# Using ts-node (development)
npm run dev

# Or using the console script
npm run console

# Or after building
npm start
```

### Console Menu Options
1. **Start New Game**: Begin a new chess game with player names
2. **Make Move**: Execute a move (format: e2 e4, or e7 e8 Q for promotion)
3. **Display Board**: Show current board state with Unicode pieces
4. **Show Possible Moves**: See legal moves for a piece
5. **View Move History**: Display all moves in algebraic notation
6. **Game Statistics**: View game info and captured pieces
7. **Offer Draw**: Propose a draw to opponent
8. **Resign**: Resign the current game
9. **Export to PGN**: Export game in PGN format
0. **Exit**: Close the application

### Move Format
- Standard move: `e2 e4`
- Capture: `e5 d6`
- Pawn promotion: `e7 e8 Q` (Q/R/B/N)
- Castling: Move king two squares (e1 g1 for kingside)

### Example Game
```
1. Start New Game
   White: Alice
   Black: Bob

2. Make Move: e2 e4
3. Make Move: e7 e5
4. Make Move: g1 f3
5. Make Move: b8 c6
...
```

## Class Diagram Overview

### Core Models
- **Position**: Value object for board coordinates (a1-h8)
- **Move**: Represents chess moves with metadata
- **Piece** (Abstract): Base class for all pieces
  - Pawn, Rook, Knight, Bishop, Queen, King
- **Cell**: Individual board square
- **Board**: 8×8 grid with piece management
- **Player**: Player representation with captured pieces
- **Game**: Main game engine (Singleton)

### Game States
- **GameState** (Abstract)
- **InProgressState**
- **CheckState**
- **CheckmateState**
- **StalemateState**
- **DrawState**

### Services
- **GameService**: Orchestrates game operations
- **NotationService**: Chess notation utilities

### Repositories
- **GameRepository**
- **MoveRepository**
- **PlayerRepository**
- **PositionHistoryRepository**

## Testing Game Scenarios

### Check
```
1. e2 e4
2. e7 e5
3. f1 c4
4. b8 c6
5. d1 h5
6. g8 f6
7. h5 f7  # Check!
```

### Checkmate (Fool's Mate)
```
1. f2 f3
2. e7 e6
3. g2 g4
4. d8 h4  # Checkmate!
```

### Castling
```
1. e2 e4
2. e7 e5
3. g1 f3
4. b8 c6
5. f1 c4
6. f8 c5
7. e1 g1  # Kingside castling
```

### Stalemate Example
A position where the player to move has no legal moves but is not in check.

## Database Schema

In-memory database with 8 entity types:
- Game
- Player
- Board
- Cell
- Piece
- Move
- PositionHistory
- CapturedPieces

## Future Enhancements

- AI opponent with difficulty levels
- Tournament management
- ELO rating system
- Time controls (blitz, rapid, classical)
- Move analysis and hints
- Opening database
- Endgame tablebases
- Web/GUI interface
- Multiplayer over network

## Technical Details

- **Language**: TypeScript 5.3+
- **Runtime**: Node.js 16+
- **Patterns**: 8 design patterns
- **Architecture**: Layered (Models → Repositories → Services → Console)
- **Storage**: In-memory (Maps and Arrays)
- **Notation**: Standard Algebraic Notation (SAN)
- **Export**: PGN format support

## Documentation

See the `docs/` folder for:
- `chess-requirements.md`: Feature requirements and classification
- `chess-uml.md`: Complete class diagram
- `chess-schema.md`: Database schema design

## Contributing

This is a demonstration project for Low-Level Design (LLD) interviews and educational purposes.

## License

MIT License

---

**Enjoy playing chess!** ♔♕♖♗♘♙
