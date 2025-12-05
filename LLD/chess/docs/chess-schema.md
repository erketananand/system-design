# CHESS SYSTEM - DATABASE SCHEMA DESIGN

## Schema Overview

This schema represents the in-memory database structure for the Chess system. All tables are normalized to **3NF (Third Normal Form)** to eliminate redundancy while maintaining data integrity.

---

## Entity-Relationship Summary

```
GAME (1) ←→ (2) PLAYER
GAME (1) ←→ (M) MOVE
GAME (1) ←→ (1) BOARD
BOARD (1) ←→ (64) CELL
CELL (1) ←→ (0..1) PIECE
MOVE (M) ←→ (1) PIECE
PLAYER (1) ←→ (M) CAPTURED_PIECE
```

---

## Tables

### **1. GAME**

Stores game instances with current state and metadata.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| **id** | VARCHAR(50) | PK, NOT NULL | Unique identifier (e.g., "GAME-001") |
| board_id | VARCHAR(50) | FK → BOARD(id), NOT NULL | Reference to board |
| white_player_id | VARCHAR(50) | FK → PLAYER(id), NOT NULL | White player reference |
| black_player_id | VARCHAR(50) | FK → PLAYER(id), NOT NULL | Black player reference |
| current_player_id | VARCHAR(50) | FK → PLAYER(id), NOT NULL | Current turn player |
| game_status | ENUM | NOT NULL | NOT_STARTED, IN_PROGRESS, CHECK, CHECKMATE, STALEMATE, DRAW, RESIGNED |
| half_move_clock | INTEGER | NOT NULL, DEFAULT 0 | Moves since last pawn move/capture (50-move rule) |
| full_move_number | INTEGER | NOT NULL, DEFAULT 1 | Full move count (increments after Black's move) |
| draw_reason | ENUM | NULL | STALEMATE, INSUFFICIENT_MATERIAL, THREEFOLD_REPETITION, FIFTY_MOVE_RULE, AGREEMENT |
| winner_id | VARCHAR(50) | FK → PLAYER(id), NULL | Winner player reference (null if draw) |
| start_time | TIMESTAMP | NOT NULL | Game start timestamp |
| end_time | TIMESTAMP | NULL | Game end timestamp |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update time |

**Indexes:**
- PRIMARY KEY: `id`
- INDEX: `game_status`
- INDEX: `white_player_id, black_player_id`

---

### **2. PLAYER**

Stores player information and game-specific data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| **id** | VARCHAR(50) | PK, NOT NULL | Unique identifier (e.g., "PLAYER-001") |
| name | VARCHAR(100) | NOT NULL | Player name |
| color | ENUM | NOT NULL | WHITE, BLACK |
| is_human | BOOLEAN | NOT NULL, DEFAULT TRUE | Human vs AI player |
| draw_offered | BOOLEAN | NOT NULL, DEFAULT FALSE | Has player offered draw |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation time |

**Indexes:**
- PRIMARY KEY: `id`
- UNIQUE INDEX: `color` (per game context)

---

### **3. BOARD**

Stores board configuration and state.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| **id** | VARCHAR(50) | PK, NOT NULL | Unique identifier (e.g., "BOARD-001") |
| game_id | VARCHAR(50) | FK → GAME(id), NOT NULL | Reference to game |
| board_hash | VARCHAR(64) | NOT NULL | Hash for position comparison (threefold repetition) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update time |

**Indexes:**
- PRIMARY KEY: `id`
- INDEX: `game_id`
- INDEX: `board_hash` (for threefold repetition detection)

---

### **4. CELL**

Represents each square on the 8×8 chess board.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| **id** | VARCHAR(50) | PK, NOT NULL | Unique identifier (e.g., "CELL-001") |
| board_id | VARCHAR(50) | FK → BOARD(id), NOT NULL | Reference to board |
| file | CHAR(1) | NOT NULL, CHECK (file IN 'a'..'h') | Column: a-h |
| rank | INTEGER | NOT NULL, CHECK (rank BETWEEN 1 AND 8) | Row: 1-8 |
| notation | VARCHAR(2) | NOT NULL, UNIQUE | Algebraic notation (e.g., "e4") |
| piece_id | VARCHAR(50) | FK → PIECE(id), NULL | Reference to piece (null if empty) |

**Indexes:**
- PRIMARY KEY: `id`
- UNIQUE INDEX: `board_id, file, rank`
- UNIQUE INDEX: `board_id, notation`
- INDEX: `piece_id`

---

### **5. PIECE**

Stores all chess pieces with their state.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| **id** | VARCHAR(50) | PK, NOT NULL | Unique identifier (e.g., "PIECE-001") |
| type | ENUM | NOT NULL | PAWN, ROOK, KNIGHT, BISHOP, QUEEN, KING |
| color | ENUM | NOT NULL | WHITE, BLACK |
| current_position | VARCHAR(2) | NOT NULL | Current algebraic notation (e.g., "e4") |
| has_moved | BOOLEAN | NOT NULL, DEFAULT FALSE | Has piece moved (for castling, en passant) |
| is_captured | BOOLEAN | NOT NULL, DEFAULT FALSE | Is piece captured |
| captured_by_player_id | VARCHAR(50) | FK → PLAYER(id), NULL | Player who captured this piece |
| value | INTEGER | NOT NULL | Material value (P=1, N=3, B=3, R=5, Q=9, K=1000) |
| en_passant_eligible | BOOLEAN | NOT NULL, DEFAULT FALSE | Pawn only: eligible for en passant |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update time |

**Indexes:**
- PRIMARY KEY: `id`
- INDEX: `color, is_captured`
- INDEX: `type, color`
- INDEX: `current_position`

---

### **6. MOVE**

Records all moves made during the game.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| **id** | VARCHAR(50) | PK, NOT NULL | Unique identifier (e.g., "MOVE-001") |
| game_id | VARCHAR(50) | FK → GAME(id), NOT NULL | Reference to game |
| piece_id | VARCHAR(50) | FK → PIECE(id), NOT NULL | Piece being moved |
| from_position | VARCHAR(2) | NOT NULL | Source position (e.g., "e2") |
| to_position | VARCHAR(2) | NOT NULL | Destination position (e.g., "e4") |
| move_type | ENUM | NOT NULL | NORMAL, CAPTURE, CASTLING_KINGSIDE, CASTLING_QUEENSIDE, EN_PASSANT, PROMOTION |
| captured_piece_id | VARCHAR(50) | FK → PIECE(id), NULL | Captured piece reference |
| promotion_piece_type | ENUM | NULL | QUEEN, ROOK, BISHOP, KNIGHT (for pawn promotion) |
| is_check | BOOLEAN | NOT NULL, DEFAULT FALSE | Does move result in check |
| is_checkmate | BOOLEAN | NOT NULL, DEFAULT FALSE | Does move result in checkmate |
| notation | VARCHAR(10) | NOT NULL | Standard Algebraic Notation (e.g., "Nf3", "O-O") |
| move_number | INTEGER | NOT NULL | Sequential move number |
| timestamp | TIMESTAMP | NOT NULL, DEFAULT NOW() | When move was made |

**Indexes:**
- PRIMARY KEY: `id`
- INDEX: `game_id, move_number`
- INDEX: `piece_id`
- INDEX: `timestamp`

---

### **7. POSITION_HISTORY**

Tracks board positions for threefold repetition detection.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| **id** | VARCHAR(50) | PK, NOT NULL | Unique identifier |
| game_id | VARCHAR(50) | FK → GAME(id), NOT NULL | Reference to game |
| board_hash | VARCHAR(64) | NOT NULL | Hash of board position |
| occurrence_count | INTEGER | NOT NULL, DEFAULT 1 | Number of times position occurred |
| first_occurrence_move | INTEGER | NOT NULL | Move number of first occurrence |
| last_occurrence_move | INTEGER | NOT NULL | Move number of last occurrence |

**Indexes:**
- PRIMARY KEY: `id`
- UNIQUE INDEX: `game_id, board_hash`
- INDEX: `occurrence_count` (for quick threefold repetition check)

---

### **8. CAPTURED_PIECES**

Junction table tracking captured pieces per player.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| **id** | VARCHAR(50) | PK, NOT NULL | Unique identifier |
| player_id | VARCHAR(50) | FK → PLAYER(id), NOT NULL | Player who captured |
| piece_id | VARCHAR(50) | FK → PIECE(id), NOT NULL | Captured piece |
| captured_at_move | INTEGER | NOT NULL | Move number when captured |
| timestamp | TIMESTAMP | NOT NULL, DEFAULT NOW() | Capture timestamp |

**Indexes:**
- PRIMARY KEY: `id`
- INDEX: `player_id`
- INDEX: `piece_id`

---

## Normalization Analysis

### **1st Normal Form (1NF)** ✅
- All tables have atomic values
- No repeating groups
- Each column contains single value

### **2nd Normal Form (2NF)** ✅
- All tables in 1NF
- No partial dependencies (all non-key attributes depend on entire primary key)
- Single-column primary keys eliminate partial dependency issues

### **3rd Normal Form (3NF)** ✅
- All tables in 2NF
- No transitive dependencies
- Examples:
  - `winner_id` in GAME references PLAYER (not storing winner name directly)
  - `current_position` in PIECE is independent attribute (not derived)
  - `board_hash` stored separately for performance (acceptable denormalization)

---

## Relationships Detail

### **One-to-One (1:1)**
- **GAME → BOARD**: Each game has exactly one board

### **One-to-Many (1:M)**
- **GAME → MOVE**: One game has many moves
- **GAME → POSITION_HISTORY**: One game has many position snapshots
- **PLAYER → CAPTURED_PIECES**: One player captures many pieces
- **BOARD → CELL**: One board has 64 cells

### **Many-to-One (M:1)**
- **MOVE → PIECE**: Many moves can involve same piece
- **MOVE → GAME**: Many moves belong to one game
- **CELL → PIECE**: Many cells can reference pieces (over time)

---

## Constraints & Business Rules

### **Check Constraints**
```sql
-- Cell position validation
CHECK (file IN ('a','b','c','d','e','f','g','h'))
CHECK (rank BETWEEN 1 AND 8)

-- Move number validation
CHECK (move_number > 0)
CHECK (full_move_number > 0)
CHECK (half_move_clock >= 0)

-- Occurrence count validation
CHECK (occurrence_count > 0)
```

### **Foreign Key Constraints**
```sql
-- Game relationships
FOREIGN KEY (board_id) REFERENCES BOARD(id) ON DELETE CASCADE
FOREIGN KEY (white_player_id) REFERENCES PLAYER(id)
FOREIGN KEY (black_player_id) REFERENCES PLAYER(id)
FOREIGN KEY (current_player_id) REFERENCES PLAYER(id)

-- Move relationships
FOREIGN KEY (game_id) REFERENCES GAME(id) ON DELETE CASCADE
FOREIGN KEY (piece_id) REFERENCES PIECE(id)
FOREIGN KEY (captured_piece_id) REFERENCES PIECE(id)

-- Cell relationships
FOREIGN KEY (board_id) REFERENCES BOARD(id) ON DELETE CASCADE
FOREIGN KEY (piece_id) REFERENCES PIECE(id)
```

### **Unique Constraints**
```sql
-- Each board has unique cells
UNIQUE (board_id, file, rank)
UNIQUE (board_id, notation)

-- Position hash uniqueness per game
UNIQUE (game_id, board_hash)

-- Players per game
UNIQUE (color) -- within game context
```

---

## Query Optimization Indexes

### **Critical Queries & Indexes**

**1. Get current board state:**
```sql
INDEX ON cell(board_id, notation)
INDEX ON piece(id, is_captured)
```

**2. Find legal moves for piece:**
```sql
INDEX ON piece(current_position, color, is_captured)
INDEX ON cell(board_id, file, rank)
```

**3. Check threefold repetition:**
```sql
INDEX ON position_history(game_id, board_hash)
INDEX ON position_history(occurrence_count)
```

**4. Get move history:**
```sql
INDEX ON move(game_id, move_number)
INDEX ON move(timestamp)
```

**5. Find captured pieces:**
```sql
INDEX ON captured_pieces(player_id)
INDEX ON piece(is_captured, captured_by_player_id)
```

---

## In-Memory Implementation Notes

Since this is an **in-memory database** implementation:

1. **Maps vs Arrays:**
   - Use `Map<string, T>` for O(1) lookups (cells, pieces)
   - Use `Array<T>` for ordered data (moves, history)

2. **Denormalization for Performance:**
   - `board_hash` stored with board for quick comparisons
   - `current_position` stored with piece (redundant with cell relationship)
   - `captured_by_player_id` stored with piece (redundant with junction table)

3. **No Actual Foreign Keys:**
   - In-memory: Store object references
   - Repositories validate referential integrity

4. **Indexing Strategy:**
   - Primary lookups: Use Map keys
   - Secondary lookups: Filter arrays (acceptable for small datasets)
   - For larger scale: Implement secondary Maps

---

## Sample Data Structure (In-Memory)

```typescript
// InMemoryDatabase structure
{
  games: Map<string, Game>,           // "GAME-001" → Game object
  players: Map<string, Player>,       // "PLAYER-001" → Player object
  moves: Map<string, Move>,           // "MOVE-001" → Move object
  boards: Map<string, Board>,         // "BOARD-001" → Board object
  cells: Map<string, Cell>,           // "CELL-001" → Cell object
  pieces: Map<string, Piece>,         // "PIECE-001" → Piece object
  positionHistory: Map<string, PositionHistory>,
  capturedPieces: Map<string, CapturedPiece>
}
```

---

## Database Statistics (Per Game)

| Entity | Estimated Count | Storage Type |
|--------|----------------|--------------|
| GAME | 1 | Map (single active) |
| PLAYER | 2 | Map |
| BOARD | 1 | Map |
| CELL | 64 | Map (constant) |
| PIECE | 32 initially, 2-32 during game | Map |
| MOVE | 40-80 average, 200+ max | Map |
| POSITION_HISTORY | 20-100 | Map |
| CAPTURED_PIECES | 0-30 | Map |

**Total Memory:** ~50KB per game (JavaScript objects)

---

## SQL DDL (For Reference)

```sql
-- Note: Actual implementation uses TypeScript Maps, not SQL
-- This DDL is for documentation and potential future persistence

CREATE TABLE game (
  id VARCHAR(50) PRIMARY KEY,
  board_id VARCHAR(50) NOT NULL,
  white_player_id VARCHAR(50) NOT NULL,
  black_player_id VARCHAR(50) NOT NULL,
  current_player_id VARCHAR(50) NOT NULL,
  game_status VARCHAR(20) NOT NULL,
  half_move_clock INTEGER NOT NULL DEFAULT 0,
  full_move_number INTEGER NOT NULL DEFAULT 1,
  draw_reason VARCHAR(30),
  winner_id VARCHAR(50),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE player (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(10) NOT NULL,
  is_human BOOLEAN NOT NULL DEFAULT TRUE,
  draw_offered BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE board (
  id VARCHAR(50) PRIMARY KEY,
  game_id VARCHAR(50) NOT NULL,
  board_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES game(id) ON DELETE CASCADE
);

CREATE TABLE cell (
  id VARCHAR(50) PRIMARY KEY,
  board_id VARCHAR(50) NOT NULL,
  file CHAR(1) NOT NULL CHECK (file IN ('a','b','c','d','e','f','g','h')),
  rank INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 8),
  notation VARCHAR(2) NOT NULL,
  piece_id VARCHAR(50),
  FOREIGN KEY (board_id) REFERENCES board(id) ON DELETE CASCADE,
  UNIQUE (board_id, file, rank),
  UNIQUE (board_id, notation)
);

CREATE TABLE piece (
  id VARCHAR(50) PRIMARY KEY,
  type VARCHAR(10) NOT NULL,
  color VARCHAR(10) NOT NULL,
  current_position VARCHAR(2) NOT NULL,
  has_moved BOOLEAN NOT NULL DEFAULT FALSE,
  is_captured BOOLEAN NOT NULL DEFAULT FALSE,
  captured_by_player_id VARCHAR(50),
  value INTEGER NOT NULL,
  en_passant_eligible BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE move (
  id VARCHAR(50) PRIMARY KEY,
  game_id VARCHAR(50) NOT NULL,
  piece_id VARCHAR(50) NOT NULL,
  from_position VARCHAR(2) NOT NULL,
  to_position VARCHAR(2) NOT NULL,
  move_type VARCHAR(30) NOT NULL,
  captured_piece_id VARCHAR(50),
  promotion_piece_type VARCHAR(10),
  is_check BOOLEAN NOT NULL DEFAULT FALSE,
  is_checkmate BOOLEAN NOT NULL DEFAULT FALSE,
  notation VARCHAR(10) NOT NULL,
  move_number INTEGER NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES game(id) ON DELETE CASCADE,
  FOREIGN KEY (piece_id) REFERENCES piece(id),
  FOREIGN KEY (captured_piece_id) REFERENCES piece(id)
);

CREATE TABLE position_history (
  id VARCHAR(50) PRIMARY KEY,
  game_id VARCHAR(50) NOT NULL,
  board_hash VARCHAR(64) NOT NULL,
  occurrence_count INTEGER NOT NULL DEFAULT 1,
  first_occurrence_move INTEGER NOT NULL,
  last_occurrence_move INTEGER NOT NULL,
  FOREIGN KEY (game_id) REFERENCES game(id) ON DELETE CASCADE,
  UNIQUE (game_id, board_hash)
);

CREATE TABLE captured_pieces (
  id VARCHAR(50) PRIMARY KEY,
  player_id VARCHAR(50) NOT NULL,
  piece_id VARCHAR(50) NOT NULL,
  captured_at_move INTEGER NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES player(id),
  FOREIGN KEY (piece_id) REFERENCES piece(id)
);
```

---

**Document Status:** ✅ Complete  
**Normalization Level:** 3NF  
**Total Tables:** 8 tables  
**Total Indexes:** 25+ indexes for optimal performance  
**Next Step:** TypeScript implementation
