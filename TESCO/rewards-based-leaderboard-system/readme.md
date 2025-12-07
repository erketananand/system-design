## Rewards-Based Leaderboard System

### **System Architecture**

```
┌──────────────────────────────────────────────────────────────┐
│                  Load Balancer (Global)                       │
│              (Geographic Traffic Distribution)                │
└──────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼─────┐        ┌─────▼──────┐       ┌─────▼──────┐
   │  API     │        │  WebSocket │       │  Admin     │
   │ Gateway  │        │  Server    │       │  Portal    │
   └────┬─────┘        └─────┬──────┘       └─────┬──────┘
        │                    │                     │
┌───────▼────────────────────▼─────────────────────▼───────┐
│           Core Leaderboard Services                       │
└───────────────────────────┬───────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼─────┐      ┌─────▼──────┐     ┌─────▼──────┐
   │ Rewards  │      │Leaderboard │     │ Ranking    │
   │ Service  │      │  Service   │     │  Service   │
   └────┬─────┘      └─────┬──────┘     └─────┬──────┘
        │                  │                   │
   ┌────▼─────┐      ┌─────▼──────┐     ┌─────▼──────┐
   │ Rewards  │      │   Redis    │     │ Ranking    │
   │ Database │      │  Sorted    │     │   Cache    │
   │(PostgreSQL)     │   Sets     │     │  (Redis)   │
   └────┬─────┘      └─────┬──────┘     └────────────┘
        │                  │
   ┌────▼─────┐      ┌─────▼──────┐
   │Transaction      │  Read      │
   │   Log    │      │ Replicas   │
   │          │      │            │
   └──────────┘      └────────────┘

┌──────────────────────────────────────────────────────────┐
│       Event Stream (Kafka/Pulsar)                         │
│  Topics: rewards.earned, leaderboard.updated             │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│    Background Jobs (Cron Scheduler)                       │
│  - Period resets, Badge calculation, Notifications       │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│    Analytics Database (ClickHouse)                        │
│  - Historical leaderboard data, Trend analysis           │
└──────────────────────────────────────────────────────────┘
```


***

## Key Components

### **1. Rewards Service**

- **Responsibilities**: Calculate and allocate reward points to customers[^4] [^5]
- **Features**:
    - Point calculation based on actions (purchases, referrals, reviews, etc.)
    - Multiplier support (VIP customers, special events)
    - Point expiration handling
    - Transaction history with audit trail
    - Idempotency to prevent duplicate points
- **Performance**: <50ms for point allocation[^5]

**Reward Actions**:

```typescript
- Purchase: Base points = order_value * 0.01
- Referral: 100 points
- Product Review: 20 points
- Social Share: 10 points
- Birthday Bonus: 500 points
- Tier Multiplier: Bronze(1x), Silver(1.5x), Gold(2x), Platinum(3x)
```


### **2. Leaderboard Service**

- **Responsibilities**: Real-time ranking updates, leaderboard queries[^2] [^1]
- **Features**:
    - Multiple leaderboard types (global, regional, tier-based, time-based)
    - Real-time rank updates using Redis Sorted Sets[^3] [^6] [^1]
    - Efficient range queries (top 100, surrounding ranks)
    - Period-based leaderboards (daily, weekly, monthly, all-time)
    - User rank lookup O(log N) complexity[^1]
- **Performance**: <10ms for read queries, <20ms for updates[^1]

**API Endpoints**:

```
GET  /api/v1/leaderboard/global?period=weekly&limit=100
GET  /api/v1/leaderboard/rank/:userId
GET  /api/v1/leaderboard/surrounding/:userId?range=10
POST /api/v1/leaderboard/update
```


### **3. Ranking Service**

- **Responsibilities**: Calculate percentile ranks, badges, achievements[^2]
- **Features**:
    - Percentile calculation (top 1%, 5%, 10%)
    - Badge assignment (Champion, Master, Expert, etc.)
    - Tier movement detection (promotion/demotion)
    - Historical rank tracking
    - Achievement unlock notifications
- **Processing**: Async batch jobs for badge calculations


### **4. Redis Sorted Sets (Core Data Structure)**

- **Purpose**: Ultra-fast in-memory leaderboard storage[^6] [^3] [^1]
- **Key Features**:
    - Automatic sorting by score (O(log N) insertion)[^1]
    - Range queries: ZRANGE, ZREVRANGE
    - Rank lookup: ZRANK, ZREVRANK
    - Score retrieval: ZSCORE
    - Atomic operations for thread-safety[^3]
- **Implementation**: Skip list + hash table internally[^1]
- **Capacity**: Handles millions of entries efficiently[^2] [^1]

**Redis Commands Used**:

```redis
ZADD leaderboard:global 1500 user:123    # Add/update score
ZREVRANGE leaderboard:global 0 99        # Get top 100
ZREVRANK leaderboard:global user:123     # Get user rank
ZSCORE leaderboard:global user:123       # Get user score
ZCOUNT leaderboard:global 1000 2000      # Count users in range
```


### **5. Rewards Database (PostgreSQL)**

- **Purpose**: Persistent storage for transactions, audit logs[^4] [^5]
- **Features**:
    - ACID transactions for point allocation
    - Complete audit trail
    - Point expiration tracking
    - User tier information
    - Historical analytics
- **Partitioning**: Partition by user_id and timestamp[^5]
- **Replication**: Master-slave with 3-5 read replicas


### **6. WebSocket Server**

- **Purpose**: Push real-time rank updates to connected clients[^2] [^1]
- **Features**:
    - Subscribe to leaderboard changes
    - Push notifications on rank changes
    - Real-time score updates
    - Milestone notifications
- **Protocol**: WebSocket with fallback to Server-Sent Events


### **7. Event Streaming (Kafka)**

- **Purpose**: Async processing of reward events[^5]
- **Topics**:
    - `rewards.earned` - New points allocated
    - `leaderboard.updated` - Rank changes
    - `achievements.unlocked` - Badge earned
    - `tier.changed` - User promoted/demoted
- **Consumers**: Analytics, notifications, badge calculator


### **8. Background Jobs**

- **Period Reset Job**: Reset daily/weekly/monthly leaderboards
- **Badge Calculation**: Compute achievements based on milestones
- **Expiration Handler**: Remove expired points
- **Snapshot Job**: Archive historical leaderboard data
- **Notification Dispatcher**: Send rank change notifications

***

## Key Workflows

### **Workflow 1: Customer Earns Rewards**

```
┌─────────────┐
│  Customer   │
│ Completes   │
│   Action    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. Action Event Triggered               │
│    Examples:                             │
│    - Purchase completed: $100            │
│    - Referral successful                 │
│    - Product review submitted            │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 2. Rewards Service: Calculate Points    │
│    - Fetch user tier (Gold = 2x)        │
│    - Base points = $100 * 0.01 = 1 point│
│    - With multiplier = 1 * 2 = 2 points │
│    - Check for special promotions (2x)  │
│    - Final points = 2 * 2 = 4 points    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 3. Idempotency Check                    │
│    SELECT * FROM reward_transactions     │
│    WHERE transaction_uuid = ?            │
│    - Prevent duplicate point allocation  │
└──────┬──────────────────────────────────┘
       │
       ├─── Already Processed ───┐
       │                         ▼
       │                  ┌──────────────┐
       │                  │ Return cached│
       │                  │   result     │
       │                  └──────────────┘
       │
       └─── New Transaction ───┐
                               ▼
┌─────────────────────────────────────────┐
│ 4. Persist to Database (ACID)           │
│    BEGIN TRANSACTION                     │
│    INSERT INTO reward_transactions (     │
│      transaction_uuid, user_id,          │
│      action_type, points_earned,         │
│      base_points, multiplier,            │
│      transaction_date, expires_at        │
│    )                                     │
│    UPDATE user_rewards SET               │
│      total_points = total_points + 4,    │
│      lifetime_points = lifetime_points + 4│
│    WHERE user_id = ?                     │
│    COMMIT TRANSACTION                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 5. Update Redis Sorted Sets (Real-time) │
│    # Global leaderboard                  │
│    ZINCRBY leaderboard:global 4 user:123 │
│                                          │
│    # Weekly leaderboard                  │
│    ZINCRBY leaderboard:weekly:2025-W49 4 user:123│
│                                          │
│    # Tier-based leaderboard              │
│    ZINCRBY leaderboard:tier:gold 4 user:123│
│                                          │
│    # Regional leaderboard                │
│    ZINCRBY leaderboard:region:US 4 user:123│
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 6. Get Updated Rank                     │
│    ZREVRANK leaderboard:global user:123  │
│    - Returns: 15 (user is now rank 16)  │
│    - Previous rank: 20                   │
│    - Rank improved by 4 positions!       │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 7. Publish Event to Kafka               │
│    kafka.publish('rewards.earned', {     │
│      userId: 'user:123',                 │
│      pointsEarned: 4,                    │
│      newTotalPoints: 1504,               │
│      actionType: 'PURCHASE',             │
│      oldRank: 20,                        │
│      newRank: 16,                        │
│      timestamp: Date.now()               │
│    })                                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 8. WebSocket Broadcast                  │
│    To user's connected clients:          │
│    socket.send({                         │
│      type: 'RANK_UPDATED',               │
│      newRank: 16,                        │
│      pointsEarned: 4,                    │
│      totalPoints: 1504,                  │
│      message: 'You moved up 4 ranks!'    │
│    })                                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 9. Check for Milestone Achievements     │
│    - Entered top 20? Badge: "Top 20"    │
│    - Reached 1500 points? Badge: "1.5K" │
│    - Tier promotion? Bronze → Silver     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 10. Return Response to Client           │
│     { success: true,                     │
│       pointsEarned: 4,                   │
│       totalPoints: 1504,                 │
│       currentRank: 16,                   │
│       rankChange: +4,                    │
│       badges: ['Top 20', '1.5K Points'] }│
└─────────────────────────────────────────┘
```

**Performance**: <50ms end-to-end[^1]

***

### **Workflow 2: Fetch Global Leaderboard (Top 100)**

```
┌─────────────┐
│   User      │
│  Views      │
│Leaderboard  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. Frontend sends request               │
│    GET /api/v1/leaderboard/global        │
│    ?period=weekly&limit=100              │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 2. Leaderboard Service: Check Cache     │
│    key = "leaderboard:cache:weekly:top100│
│    GET {key}                             │
└──────┬──────────────────────────────────┘
       │
       ├─── Cache HIT (90% requests) ───┐
       │                                 ▼
       │                          ┌──────────────┐
       │                          │ Return cached│
       │                          │  response    │
       │                          │  <5ms        │
       │                          └──────────────┘
       │
       └─── Cache MISS ───┐
                          ▼
┌─────────────────────────────────────────┐
│ 3. Query Redis Sorted Set               │
│    ZREVRANGE leaderboard:weekly:2025-W49 │
│              0 99 WITHSCORES             │
│    Returns:                              │
│    [                                     │
│      ['user:456', 3200],  # Rank 1       │
│      ['user:789', 2950],  # Rank 2       │
│      ['user:123', 1504],  # Rank 16      │
│      ...                                 │
│    ]                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 4. Fetch User Details (Batch Query)     │
│    SELECT user_id, username, avatar_url, │
│           tier, country                  │
│    FROM users                            │
│    WHERE user_id IN (?, ?, ...)          │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 5. Enrich Leaderboard Data              │
│    Combine Redis scores with user info: │
│    [                                     │
│      {                                   │
│        rank: 1,                          │
│        userId: 'user:456',               │
│        username: 'john_doe',             │
│        avatarUrl: 'https://...',         │
│        points: 3200,                     │
│        tier: 'PLATINUM',                 │
│        country: 'US',                    │
│        badge: 'Champion'                 │
│      },                                  │
│      ...                                 │
│    ]                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 6. Cache Result (30 second TTL)         │
│    SET leaderboard:cache:weekly:top100   │
│        {enrichedData}                    │
│        EX 30                             │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 7. Return Response                      │
│    { leaderboard: [...],                 │
│      period: 'weekly',                   │
│      totalParticipants: 125000,          │
│      lastUpdated: '2025-12-07T23:51:00Z',│
│      userRank: 16 }                      │
└─────────────────────────────────────────┘
```

**Performance**:

- Cache hit: <5ms
- Cache miss: <20ms[^1]

***

### **Workflow 3: Get User's Current Rank and Surrounding**

```
┌─────────────┐
│   User      │
│  Checks     │
│  Own Rank   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. Request User Rank                    │
│    GET /api/v1/leaderboard/surrounding/  │
│        user:123?range=5                  │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 2. Get User's Rank (Redis)              │
│    ZREVRANK leaderboard:global user:123  │
│    Returns: 15 (0-indexed, actual rank 16)│
│                                          │
│    ZSCORE leaderboard:global user:123    │
│    Returns: 1504 (user's points)         │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 3. Get Surrounding Users                │
│    range = 5 (5 above, 5 below)          │
│    startRank = 15 - 5 = 10               │
│    endRank = 15 + 5 = 20                 │
│                                          │
│    ZREVRANGE leaderboard:global          │
│              10 20 WITHSCORES            │
│    Returns 11 users (ranks 11-21)        │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 4. Calculate Percentile                 │
│    ZCARD leaderboard:global              │
│    Returns: 125000 (total users)         │
│                                          │
│    percentile = (1 - 16/125000) * 100    │
│               = 99.99%                   │
│    userIsInTop = "Top 0.01%"             │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 5. Fetch User Details                   │
│    SELECT username, avatar_url, tier     │
│    FROM users WHERE user_id IN (...)     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 6. Return Response                      │
│    {                                     │
│      userRank: 16,                       │
│      userPoints: 1504,                   │
│      percentile: "Top 0.01%",            │
│      totalUsers: 125000,                 │
│      surrounding: [                      │
│        { rank: 11, user: '...', points: 1580 },│
│        ...                               │
│        { rank: 16, user: 'You', points: 1504, isCurrentUser: true },│
│        ...                               │
│        { rank: 21, user: '...', points: 1420 }│
│      ],                                  │
│      nextMilestone: {                    │
│        rank: 10,                         │
│        pointsNeeded: 82                  │
│      }                                   │
│    }                                     │
└─────────────────────────────────────────┘
```

**Performance**: <10ms[^1]

***

### **Workflow 4: Period Reset (Weekly Leaderboard)**

```
┌─────────────┐
│  Cron Job   │
│  (Monday    │
│  00:00 UTC) │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. Archive Previous Week's Leaderboard   │
│    key = "leaderboard:weekly:2025-W49"   │
│    ZREVRANGE {key} 0 -1 WITHSCORES       │
│    - Fetch all entries                   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 2. Calculate Weekly Winners             │
│    Top 3 users:                          │
│    - Rank 1: user:456 (3200 pts)         │
│    - Rank 2: user:789 (2950 pts)         │
│    - Rank 3: user:321 (2800 pts)         │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 3. Award Bonus Rewards                  │
│    BEGIN TRANSACTION                     │
│    INSERT INTO reward_transactions       │
│      (user_id, action_type,              │
│       points_earned, reason)             │
│    VALUES                                │
│      ('user:456', 'WEEKLY_WINNER', 1000, │
│       'Weekly Leaderboard #1'),          │
│      ('user:789', 'WEEKLY_WINNER', 500,  │
│       'Weekly Leaderboard #2'),          │
│      ('user:321', 'WEEKLY_WINNER', 250,  │
│       'Weekly Leaderboard #3')           │
│    COMMIT                                │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 4. Store to Analytics Database          │
│    INSERT INTO leaderboard_snapshots     │
│      (period_type, period_id,            │
│       snapshot_data, created_at)         │
│    VALUES ('WEEKLY', '2025-W49',         │
│            {archivedData}, NOW())        │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 5. Create New Week's Leaderboard        │
│    newKey = "leaderboard:weekly:2025-W50"│
│    - Redis will auto-create on first ZADD│
│    - Set expiry for 14 days (backup)     │
│    EXPIRE {newKey} 1209600               │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 6. Initialize New Period                │
│    - Copy user entries with 0 points     │
│    - OR start fresh (empty leaderboard)  │
│    - Depends on business logic           │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 7. Send Winner Notifications            │
│    kafka.publish('notifications.send', { │
│      userId: 'user:456',                 │
│      type: 'WEEKLY_WINNER',              │
│      message: 'Congratulations! You won  │
│                the weekly leaderboard!'  │
│    })                                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 8. Update User Badges                   │
│    INSERT INTO user_badges               │
│      (user_id, badge_type, earned_at)    │
│    VALUES ('user:456', 'WEEKLY_CHAMPION',│
│            NOW())                        │
└─────────────────────────────────────────┘
```

**Frequency**: Daily/Weekly/Monthly based on period type

***

## Database Schema Design

### **Users Table**

```sql
CREATE TABLE users (
    user_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    
    -- Tier system
    tier ENUM('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND') DEFAULT 'BRONZE',
    tier_updated_at TIMESTAMP,
    
    -- Geographic
    country VARCHAR(2),
    region VARCHAR(100),
    timezone VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tier (tier),
    INDEX idx_country (country)
);
```


### **User Rewards Table (Current Balance)**

```sql
CREATE TABLE user_rewards (
    user_id BIGINT PRIMARY KEY,
    
    -- Point balances
    total_points BIGINT DEFAULT 0 COMMENT 'Current available points',
    lifetime_points BIGINT DEFAULT 0 COMMENT 'Total earned (never decreases)',
    redeemed_points BIGINT DEFAULT 0 COMMENT 'Total spent',
    expired_points BIGINT DEFAULT 0 COMMENT 'Total expired',
    
    -- Leaderboard positions (denormalized for quick access)
    global_rank INT,
    weekly_rank INT,
    monthly_rank INT,
    
    -- Metadata
    last_reward_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    INDEX idx_total_points (total_points DESC),
    INDEX idx_lifetime_points (lifetime_points DESC)
);
```


### **Reward Transactions Table (Audit Log)**

```sql
CREATE TABLE reward_transactions (
    transaction_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_uuid VARCHAR(36) UNIQUE NOT NULL COMMENT 'Idempotency key',
    user_id BIGINT NOT NULL,
    
    -- Transaction details
    action_type ENUM('PURCHASE', 'REFERRAL', 'REVIEW', 'SOCIAL_SHARE', 
                     'BIRTHDAY_BONUS', 'WEEKLY_WINNER', 'MANUAL_ADJUSTMENT',
                     'REDEMPTION', 'EXPIRATION') NOT NULL,
    points_earned INT NOT NULL COMMENT 'Positive for earning, negative for spending',
    base_points INT COMMENT 'Before multipliers',
    multiplier DECIMAL(3,2) DEFAULT 1.00,
    
    -- Reference to source action
    order_id BIGINT COMMENT 'If from purchase',
    referral_id BIGINT COMMENT 'If from referral',
    reference_id VARCHAR(100) COMMENT 'Generic reference',
    
    -- Expiration
    expires_at TIMESTAMP COMMENT 'When these points expire',
    is_expired BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    reason TEXT,
    created_by VARCHAR(100) COMMENT 'System or admin user',
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    INDEX idx_user_date (user_id, transaction_date DESC),
    INDEX idx_uuid (transaction_uuid),
    INDEX idx_action_type (action_type, transaction_date),
    INDEX idx_expires (expires_at, is_expired)
) ENGINE=InnoDB;

-- Partition by month for efficient queries
ALTER TABLE reward_transactions PARTITION BY RANGE (YEAR(transaction_date) * 100 + MONTH(transaction_date)) (
    PARTITION p202501 VALUES LESS THAN (202502),
    PARTITION p202502 VALUES LESS THAN (202503),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```


### **Leaderboard Periods Table**

```sql
CREATE TABLE leaderboard_periods (
    period_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    period_type ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'ALL_TIME') NOT NULL,
    period_identifier VARCHAR(20) NOT NULL COMMENT 'e.g., 2025-W49, 2025-12, etc.',
    
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    
    -- Winners
    winner_user_id BIGINT,
    winner_points BIGINT,
    total_participants INT,
    
    -- Status
    status ENUM('ACTIVE', 'COMPLETED', 'ARCHIVED') DEFAULT 'ACTIVE',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    
    UNIQUE KEY unique_period (period_type, period_identifier),
    INDEX idx_dates (start_date, end_date),
    INDEX idx_status (status)
);
```


### **User Badges Table**

```sql
CREATE TABLE user_badges (
    badge_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    
    badge_type ENUM('TOP_10', 'TOP_100', 'TOP_1_PERCENT', 
                    'WEEKLY_CHAMPION', 'MONTHLY_CHAMPION',
                    'POINTS_1K', 'POINTS_5K', 'POINTS_10K',
                    'REFERRAL_MASTER', 'EARLY_ADOPTER') NOT NULL,
    
    badge_level INT DEFAULT 1 COMMENT 'For progressive badges',
    
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP COMMENT 'For time-limited badges',
    is_active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_user_badge (user_id, badge_type, badge_level),
    INDEX idx_user (user_id, earned_at DESC),
    INDEX idx_badge_type (badge_type)
);
```


### **Leaderboard Snapshots Table (Historical Data)**

```sql
CREATE TABLE leaderboard_snapshots (
    snapshot_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    period_type ENUM('DAILY', 'WEEKLY', 'MONTHLY') NOT NULL,
    period_identifier VARCHAR(20) NOT NULL,
    
    -- Top performers (JSON)
    top_100_data JSON COMMENT 'Snapshot of top 100 users',
    
    -- Statistics
    total_participants INT,
    total_points_awarded BIGINT,
    avg_points DECIMAL(10,2),
    median_points INT,
    
    snapshot_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_period (period_type, period_identifier),
    INDEX idx_date (snapshot_date DESC)
);
```


### **Reward Actions Config Table (Business Rules)**

```sql
CREATE TABLE reward_action_configs (
    action_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    action_type ENUM('PURCHASE', 'REFERRAL', 'REVIEW', 'SOCIAL_SHARE', 
                     'BIRTHDAY_BONUS', 'LOGIN_STREAK') NOT NULL,
    action_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Point calculation
    points_formula VARCHAR(255) COMMENT 'e.g., "order_value * 0.01"',
    base_points INT,
    
    -- Multipliers by tier
    bronze_multiplier DECIMAL(3,2) DEFAULT 1.00,
    silver_multiplier DECIMAL(3,2) DEFAULT 1.50,
    gold_multiplier DECIMAL(3,2) DEFAULT 2.00,
    platinum_multiplier DECIMAL(3,2) DEFAULT 3.00,
    diamond_multiplier DECIMAL(3,2) DEFAULT 5.00,
    
    -- Limits
    max_points_per_action INT COMMENT 'Cap per single action',
    max_daily_points INT COMMENT 'Daily limit for this action',
    cooldown_minutes INT COMMENT 'Minimum time between actions',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    effective_from TIMESTAMP,
    effective_until TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_action_type (action_type),
    INDEX idx_active (is_active)
);
```


***

## Low-Level Design (LLD) - TypeScript

### **Domain Models**

```typescript
// Enums
enum RewardActionType {
  PURCHASE = 'PURCHASE',
  REFERRAL = 'REFERRAL',
  REVIEW = 'REVIEW',
  SOCIAL_SHARE = 'SOCIAL_SHARE',
  BIRTHDAY_BONUS = 'BIRTHDAY_BONUS',
  WEEKLY_WINNER = 'WEEKLY_WINNER',
  MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT'
}

enum UserTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  DIAMOND = 'DIAMOND'
}

enum LeaderboardPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  ALL_TIME = 'ALL_TIME'
}

enum BadgeType {
  TOP_10 = 'TOP_10',
  TOP_100 = 'TOP_100',
  TOP_1_PERCENT = 'TOP_1_PERCENT',
  WEEKLY_CHAMPION = 'WEEKLY_CHAMPION',
  MONTHLY_CHAMPION = 'MONTHLY_CHAMPION',
  POINTS_1K = 'POINTS_1K',
  POINTS_5K = 'POINTS_5K',
  POINTS_10K = 'POINTS_10K'
}

// Interfaces
interface RewardTransaction {
  transactionId: string;
  transactionUuid: string;
  userId: string;
  actionType: RewardActionType;
  pointsEarned: number;
  basePoints: number;
  multiplier: number;
  orderId?: string;
  referralId?: string;
  reason?: string;
  expiresAt?: Date;
  transactionDate: Date;
}

interface UserRewards {
  userId: string;
  totalPoints: number;
  lifetimePoints: number;
  redeemedPoints: number;
  expiredPoints: number;
  globalRank?: number;
  weeklyRank?: number;
  monthlyRank?: number;
  lastRewardAt?: Date;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  points: number;
  tier: UserTier;
  country?: string;
  badges: BadgeType[];
  isCurrentUser?: boolean;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  period: LeaderboardPeriod;
  totalParticipants: number;
  lastUpdated: Date;
  userRank?: number;
  userPoints?: number;
}
```


### **Tier Multiplier Calculator**

```typescript
class TierMultiplierCalculator {
  private static readonly MULTIPLIERS: Record<UserTier, number> = {
    [UserTier.BRONZE]: 1.0,
    [UserTier.SILVER]: 1.5,
    [UserTier.GOLD]: 2.0,
    [UserTier.PLATINUM]: 3.0,
    [UserTier.DIAMOND]: 5.0
  };

  static getMultiplier(tier: UserTier): number {
    return this.MULTIPLIERS[tier];
  }

  static calculatePoints(basePoints: number, tier: UserTier): number {
    return Math.floor(basePoints * this.getMultiplier(tier));
  }

  // Determine tier based on lifetime points
  static determineTier(lifetimePoints: number): UserTier {
    if (lifetimePoints >= 50000) return UserTier.DIAMOND;
    if (lifetimePoints >= 20000) return UserTier.PLATINUM;
    if (lifetimePoints >= 10000) return UserTier.GOLD;
    if (lifetimePoints >= 5000) return UserTier.SILVER;
    return UserTier.BRONZE;
  }

  // Check if user should be promoted
  static shouldPromote(currentTier: UserTier, lifetimePoints: number): boolean {
    const newTier = this.determineTier(lifetimePoints);
    return this.getTierValue(newTier) > this.getTierValue(currentTier);
  }

  private static getTierValue(tier: UserTier): number {
    const tierValues = {
      [UserTier.BRONZE]: 1,
      [UserTier.SILVER]: 2,
      [UserTier.GOLD]: 3,
      [UserTier.PLATINUM]: 4,
      [UserTier.DIAMOND]: 5
    };
    return tierValues[tier];
  }
}
```


### **Rewards Service**

```typescript
interface IRewardRepository {
  saveTransaction(transaction: RewardTransaction): Promise<void>;
  getUserRewards(userId: string): Promise<UserRewards | null>;
  updateUserRewards(userId: string, pointsDelta: number): Promise<UserRewards>;
  findTransactionByUuid(uuid: string): Promise<RewardTransaction | null>;
}

interface ILeaderboardCache {
  updateScore(leaderboardKey: string, userId: string, pointsDelta: number): Promise<number>;
  getScore(leaderboardKey: string, userId: string): Promise<number | null>;
  getRank(leaderboardKey: string, userId: string): Promise<number | null>;
}

interface IEventPublisher {
  publish(topic: string, event: any): Promise<void>;
}

class RewardsService {
  constructor(
    private rewardRepository: IRewardRepository,
    private leaderboardCache: ILeaderboardCache,
    private eventPublisher: IEventPublisher
  ) {}

  // Allocate rewards to user
  async allocateRewards(
    userId: string,
    actionType: RewardActionType,
    basePoints: number,
    metadata?: {
      orderId?: string;
      referralId?: string;
      reason?: string;
    }
  ): Promise<{ pointsEarned: number; newRank: number }> {
    // Generate idempotency key
    const transactionUuid = this.generateTransactionUuid(userId, actionType, metadata);

    // Check for duplicate transaction
    const existing = await this.rewardRepository.findTransactionByUuid(transactionUuid);
    if (existing) {
      console.log(`Duplicate transaction detected: ${transactionUuid}`);
      const rank = await this.leaderboardCache.getRank('leaderboard:global', userId);
      return {
        pointsEarned: existing.pointsEarned,
        newRank: rank !== null ? rank + 1 : 0
      };
    }

    // Get user's current rewards and tier
    const userRewards = await this.rewardRepository.getUserRewards(userId);
    const userTier = userRewards 
      ? TierMultiplierCalculator.determineTier(userRewards.lifetimePoints)
      : UserTier.BRONZE;

    // Calculate points with multiplier
    const multiplier = TierMultiplierCalculator.getMultiplier(userTier);
    const pointsEarned = TierMultiplierCalculator.calculatePoints(basePoints, userTier);

    // Create transaction record
    const transaction: RewardTransaction = {
      transactionId: this.generateTransactionId(),
      transactionUuid,
      userId,
      actionType,
      pointsEarned,
      basePoints,
      multiplier,
      orderId: metadata?.orderId,
      referralId: metadata?.referralId,
      reason: metadata?.reason,
      expiresAt: this.calculateExpiration(actionType),
      transactionDate: new Date()
    };

    // Save to database (ACID transaction)
    await this.rewardRepository.saveTransaction(transaction);
    const updatedRewards = await this.rewardRepository.updateUserRewards(userId, pointsEarned);

    // Update Redis leaderboards (multiple periods)
    await this.updateLeaderboards(userId, pointsEarned);

    // Get new rank
    const newRank = await this.leaderboardCache.getRank('leaderboard:global', userId);

    // Publish event
    await this.eventPublisher.publish('rewards.earned', {
      userId,
      actionType,
      pointsEarned,
      newTotalPoints: updatedRewards.totalPoints,
      newLifetimePoints: updatedRewards.lifetimePoints,
      tier: userTier,
      newRank: newRank !== null ? newRank + 1 : 0,
      timestamp: Date.now()
    });

    // Check for tier promotion
    const shouldPromote = TierMultiplierCalculator.shouldPromote(
      userTier,
      updatedRewards.lifetimePoints
    );
    if (shouldPromote) {
      await this.handleTierPromotion(userId, updatedRewards.lifetimePoints);
    }

    return {
      pointsEarned,
      newRank: newRank !== null ? newRank + 1 : 0
    };
  }

  // Update multiple leaderboards
  private async updateLeaderboards(userId: string, pointsDelta: number): Promise<void> {
    const now = new Date();
    
    // Global leaderboard (all-time)
    await this.leaderboardCache.updateScore('leaderboard:global', userId, pointsDelta);

    // Weekly leaderboard
    const weekKey = this.getWeekIdentifier(now);
    await this.leaderboardCache.updateScore(`leaderboard:weekly:${weekKey}`, userId, pointsDelta);

    // Monthly leaderboard
    const monthKey = this.getMonthIdentifier(now);
    await this.leaderboardCache.updateScore(`leaderboard:monthly:${monthKey}`, userId, pointsDelta);

    // Daily leaderboard
    const dayKey = this.getDayIdentifier(now);
    await this.leaderboardCache.updateScore(`leaderboard:daily:${dayKey}`, userId, pointsDelta);
  }

  // Handle tier promotion
  private async handleTierPromotion(userId: string, lifetimePoints: number): Promise<void> {
    const newTier = TierMultiplierCalculator.determineTier(lifetimePoints);
    
    await this.eventPublisher.publish('tier.promoted', {
      userId,
      newTier,
      lifetimePoints,
      timestamp: Date.now()
    });
  }

  // Calculate expiration date for points
  private calculateExpiration(actionType: RewardActionType): Date | undefined {
    // Example: Points expire after 1 year
    if (actionType === RewardActionType.PURCHASE) {
      const expiration = new Date();
      expiration.setFullYear(expiration.getFullYear() + 1);
      return expiration;
    }
    // Some actions give non-expiring points
    return undefined;
  }

  private generateTransactionUuid(
    userId: string,
    actionType: RewardActionType,
    metadata?: any
  ): string {
    const crypto = require('crypto');
    const data = `${userId}-${actionType}-${JSON.stringify(metadata || {})}-${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 36);
  }

  private generateTransactionId(): string {
    return `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getWeekIdentifier(date: Date): string {
    // ISO week format: 2025-W49
    const year = date.getFullYear();
    const week = this.getISOWeek(date);
    return `${year}-W${String(week).padStart(2, '0')}`;
  }

  private getMonthIdentifier(date: Date): string {
    // Format: 2025-12
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  private getDayIdentifier(date: Date): string {
    // Format: 2025-12-07
    return date.toISOString().split('T')[^0];
  }

  private getISOWeek(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNumber;
  }
}
```


### **Leaderboard Service**

```typescript
interface IUserRepository {
  findByIds(userIds: string[]): Promise<Array<{ userId: string; username: string; avatarUrl?: string; tier: UserTier; country?: string }>>;
}

interface IBadgeRepository {
  getUserBadges(userId: string): Promise<BadgeType[]>;
}

class LeaderboardService {
  constructor(
    private leaderboardCache: ILeaderboardCache,
    private userRepository: IUserRepository,
    private badgeRepository: IBadgeRepository,
    private cache: ICache
  ) {}

  // Get global leaderboard
  async getGlobalLeaderboard(
    period: LeaderboardPeriod = LeaderboardPeriod.ALL_TIME,
    limit: number = 100
  ): Promise<LeaderboardResponse> {
    const leaderboardKey = this.getLeaderboardKey(period);
    const cacheKey = `leaderboard:cache:${period}:top${limit}`;

    // Check cache
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Query Redis Sorted Set
    const entries = await this.queryRedisLeaderboard(leaderboardKey, 0, limit - 1);

    // Fetch user details
    const userIds = entries.map(e => e.userId);
    const users = await this.userRepository.findByIds(userIds);
    const userMap = new Map(users.map(u => [u.userId, u]));

    // Enrich with badges
    const enrichedEntries = await Promise.all(
      entries.map(async (entry, index) => {
        const user = userMap.get(entry.userId);
        const badges = await this.badgeRepository.getUserBadges(entry.userId);
        
        return {
          rank: index + 1,
          userId: entry.userId,
          username: user?.username || 'Unknown',
          avatarUrl: user?.avatarUrl,
          points: entry.score,
          tier: user?.tier || UserTier.BRONZE,
          country: user?.country,
          badges
        };
      })
    );

    // Get total participants
    const totalParticipants = await this.getTotalParticipants(leaderboardKey);

    const response: LeaderboardResponse = {
      leaderboard: enrichedEntries,
      period,
      totalParticipants,
      lastUpdated: new Date()
    };

    // Cache for 30 seconds
    await this.cache.set(cacheKey, JSON.stringify(response), 30);

    return response;
  }

  // Get user's rank and surrounding users
  async getUserRankWithSurrounding(
    userId: string,
    period: LeaderboardPeriod = LeaderboardPeriod.ALL_TIME,
    range: number = 5
  ): Promise<{
    userRank: number;
    userPoints: number;
    percentile: string;
    totalUsers: number;
    surrounding: LeaderboardEntry[];
    nextMilestone?: { rank: number; pointsNeeded: number };
  }> {
    const leaderboardKey = this.getLeaderboardKey(period);

    // Get user's rank and score
    const userRank = await this.leaderboardCache.getRank(leaderboardKey, userId);
    const userScore = await this.leaderboardCache.getScore(leaderboardKey, userId);

    if (userRank === null || userScore === null) {
      throw new Error('User not found in leaderboard');
    }

    const actualRank = userRank + 1; // Redis uses 0-based indexing

    // Get surrounding users
    const startRank = Math.max(0, userRank - range);
    const endRank = userRank + range;
    const surroundingEntries = await this.queryRedisLeaderboard(leaderboardKey, startRank, endRank);

    // Enrich surrounding users
    const userIds = surroundingEntries.map(e => e.userId);
    const users = await this.userRepository.findByIds(userIds);
    const userMap = new Map(users.map(u => [u.userId, u]));

    const enrichedSurrounding = await Promise.all(
      surroundingEntries.map(async (entry, index) => {
        const user = userMap.get(entry.userId);
        const badges = await this.badgeRepository.getUserBadges(entry.userId);
        
        return {
          rank: startRank + index + 1,
          userId: entry.userId,
          username: user?.username || 'Unknown',
          avatarUrl: user?.avatarUrl,
          points: entry.score,
          tier: user?.tier || UserTier.BRONZE,
          country: user?.country,
          badges,
          isCurrentUser: entry.userId === userId
        };
      })
    );

    // Calculate percentile
    const totalUsers = await this.getTotalParticipants(leaderboardKey);
    const percentile = ((1 - actualRank / totalUsers) * 100).toFixed(2);

    // Calculate next milestone
    let nextMilestone;
    if (userRank > 0) {
      const nextEntry = await this.queryRedisLeaderboard(leaderboardKey, userRank - 1, userRank - 1);
      if (nextEntry.length > 0) {
        nextMilestone = {
          rank: actualRank - 1,
          pointsNeeded: nextEntry[^0].score - userScore
        };
      }
    }

    return {
      userRank: actualRank,
      userPoints: userScore,
      percentile: `Top ${percentile}%`,
      totalUsers,
      surrounding: enrichedSurrounding,
      nextMilestone
    };
  }

  // Query Redis Sorted Set
  private async queryRedisLeaderboard(
    key: string,
    start: number,
    end: number
  ): Promise<Array<{ userId: string; score: number }>> {
    // This would use actual Redis client
    // ZREVRANGE key start end WITHSCORES
    // Placeholder implementation
    return [];
  }

  // Get total participants
  private async getTotalParticipants(key: string): Promise<number> {
    // ZCARD key
    return 0;
  }

  // Get leaderboard key based on period
  private getLeaderboardKey(period: LeaderboardPeriod): string {
    const now = new Date();
    
    switch (period) {
      case LeaderboardPeriod.ALL_TIME:
        return 'leaderboard:global';
      case LeaderboardPeriod.WEEKLY:
        const week = this.getWeekIdentifier(now);
        return `leaderboard:weekly:${week}`;
      case LeaderboardPeriod.MONTHLY:
        const month = this.getMonthIdentifier(now);
        return `leaderboard:monthly:${month}`;
      case LeaderboardPeriod.DAILY:
        const day = this.getDayIdentifier(now);
        return `leaderboard:daily:${day}`;
    }
  }

  private getWeekIdentifier(date: Date): string {
    const year = date.getFullYear();
    const week = this.getISOWeek(date);
    return `${year}-W${String(week).padStart(2, '0')}`;
  }

  private getMonthIdentifier(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  private getDayIdentifier(date: Date): string {
    return date.toISOString().split('T')[^0];
  }

  private getISOWeek(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNumber;
  }
}
```


### **Redis Leaderboard Cache Implementation**

```typescript
import Redis from 'ioredis';

class RedisLeaderboardCache implements ILeaderboardCache {
  private redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  // Update score (increment)
  async updateScore(leaderboardKey: string, userId: string, pointsDelta: number): Promise<number> {
    // ZINCRBY key increment member
    const newScore = await this.redis.zincrby(leaderboardKey, pointsDelta, userId);
    return parseFloat(newScore);
  }

  // Get user's score
  async getScore(leaderboardKey: string, userId: string): Promise<number | null> {
    // ZSCORE key member
    const score = await this.redis.zscore(leaderboardKey, userId);
    return score !== null ? parseFloat(score) : null;
  }

  // Get user's rank (0-based)
  async getRank(leaderboardKey: string, userId: string): Promise<number | null> {
    // ZREVRANK key member (descending order - higher scores = lower rank numbers)
    const rank = await this.redis.zrevrank(leaderboardKey, userId);
    return rank;
  }

  // Get range of users with scores
  async getRange(
    leaderboardKey: string,
    start: number,
    end: number
  ): Promise<Array<{ userId: string; score: number }>> {
    // ZREVRANGE key start end WITHSCORES
    const results = await this.redis.zrevrange(leaderboardKey, start, end, 'WITHSCORES');
    
    const entries: Array<{ userId: string; score: number }> = [];
    for (let i = 0; i < results.length; i += 2) {
      entries.push({
        userId: results[i],
        score: parseFloat(results[i + 1])
      });
    }
    
    return entries;
  }

  // Get total count of users
  async getCount(leaderboardKey: string): Promise<number> {
    // ZCARD key
    return await this.redis.zcard(leaderboardKey);
  }

  // Get count of users within score range
  async getCountInRange(leaderboardKey: string, minScore: number, maxScore: number): Promise<number> {
    // ZCOUNT key min max
    return await this.redis.zcount(leaderboardKey, minScore, maxScore);
  }

  // Remove user from leaderboard
  async removeUser(leaderboardKey: string, userId: string): Promise<void> {
    // ZREM key member
    await this.redis.zrem(leaderboardKey, userId);
  }

  // Set expiration on leaderboard
  async setExpiration(leaderboardKey: string, seconds: number): Promise<void> {
    // EXPIRE key seconds
    await this.redis.expire(leaderboardKey, seconds);
  }
}
```


***

## Key Design Patterns \& Techniques

1. **Redis Sorted Sets**: O(log N) updates and queries for real-time leaderboards[^6] [^3] [^1]
2. **Tier Multiplier System**: Progressive rewards based on user loyalty
3. **Idempotency**: UUID-based deduplication prevents double points[^5]
4. **Multi-Period Leaderboards**: Daily, weekly, monthly, all-time tracking
5. **Cache-Aside Pattern**: 30-second cache for leaderboard reads
6. **Event-Driven Architecture**: Async processing for badges and notifications
7. **Database Partitioning**: Monthly partitions for transaction history[^5]
8. **WebSocket Updates**: Real-time rank change notifications[^2] [^1]

**Performance**: Handles **10M+ users**, **<10ms read queries**, **<50ms point allocation**, **real-time rank updates**.[^3] [^2] [^1]
<span style="display:none">[^10] [^7] [^8] [^9]</span>

<div align="center">⁂</div>

[^1]: https://systemdesign.one/leaderboard-system-design/

[^2]: https://algomaster.io/learn/system-design/design-real-time-gaming-leaderboard

[^3]: https://alexandrubagu.github.io/blog/hall-of-fame-implementation.html

[^4]: https://stackoverflow.com/questions/2312372/database-design-approach-for-storing-points-for-users

[^5]: https://www.zigpoll.com/content/what-strategies-can-be-implemented-in-our-ecommerce-platform-backend-to-handle-loyalty-program-reward-points-efficiently-for-returning-customers

[^6]: https://redis.io/solutions/leaderboards/

[^7]: https://www.youtube.com/watch?v=UerkzwZ_zSY

[^8]: https://bytebytego.com/courses/system-design-interview/real-time-gaming-leaderboard

[^9]: https://roadmap.sh/projects/realtime-leaderboard-system

[^10]: https://www.redpanda.com/blog/build-real-time-leaderboard-gaming

