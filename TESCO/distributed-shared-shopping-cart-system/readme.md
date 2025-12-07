## Distributed Shared Shopping Cart System

### **System Architecture**

```
┌──────────────────────────────────────────────────────────────────┐
│                  Global Load Balancer (DNS)                       │
│              (Geographic Traffic Routing)                         │
└──────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼─────┐        ┌─────▼──────┐       ┌─────▼──────┐
   │  Region  │        │  Region    │       │  Region    │
   │   US     │        │    EU      │       │   ASIA     │
   └────┬─────┘        └─────┬──────┘       └─────┬──────┘
        │                    │                     │
┌───────▼────────────────────▼─────────────────────▼───────┐
│              API Gateway + Load Balancer                  │
│         (WebSocket Support, Rate Limiting)                │
└───────────────────────────┬───────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼─────┐      ┌─────▼──────┐     ┌─────▼──────┐
   │ WebSocket│      │   Cart     │     │ Inventory  │
   │ Service  │◄────▶│  Service   │────▶│  Service   │
   └────┬─────┘      └─────┬──────┘     └─────┬──────┘
        │                  │                   │
   ┌────▼─────┐      ┌─────▼──────┐     ┌─────▼──────┐
   │Connection│      │Distributed │     │ Inventory  │
   │ Manager  │      │   Cache    │     │    DB      │
   │          │      │  (Redis)   │     │            │
   └──────────┘      └─────┬──────┘     └────────────┘
                           │
                     ┌─────▼──────┐
                     │   Cart     │
                     │  Database  │
                     │ (Postgres) │
                     └────────────┘

┌──────────────────────────────────────────────────────────┐
│           Message Queue (Kafka/RabbitMQ)                  │
│  Topics: cart.events, inventory.updates, sync.conflicts  │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│         CRDT Conflict Resolution Engine                   │
│  (Handles concurrent updates across regions)              │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│    Session Store (Redis Cluster with Replication)        │
│  (Stores user sessions, active connections, cart locks)   │
└──────────────────────────────────────────────────────────┘
```


### **Core Components**

### **1. WebSocket Service**

- **Responsibilities**: Real-time bidirectional communication for collaborative cart updates[^4] [^5]
- **Features**:
    - Persistent WebSocket connections for active users
    - Real-time event broadcasting to all cart members
    - Connection pooling and heartbeat mechanism
    - Automatic reconnection with exponential backoff
    - Room-based isolation (one room per shared cart)
- **Performance**: Support 100k+ concurrent WebSocket connections per instance[^4]
- **Protocol**: WebSocket with fallback to Server-Sent Events (SSE)


### **2. Cart Service (Distributed)**

- **Responsibilities**: Cart CRUD operations, collaborative access control, conflict resolution[^3] [^1]
- **Features**:
    - Multi-user cart sharing with role-based access
    - Optimistic concurrency control with version vectors
    - CRDT-based conflict resolution for concurrent edits[^3]
    - Cart locking during checkout (distributed locks via Redis)
    - Cart merge on conflict using OR-Sets[^3]
- **API Endpoints**:
    - `POST /api/v1/carts/create` - Create shared cart
    - `POST /api/v1/carts/:id/share` - Generate share link
    - `POST /api/v1/carts/:id/join` - Join shared cart
    - `PUT /api/v1/carts/:id/items` - Add/update items (with version)
    - `DELETE /api/v1/carts/:id/items/:itemId` - Remove items
    - `GET /api/v1/carts/:id/members` - Get all cart members


### **3. Distributed Cache (Redis Cluster)**

- **Purpose**: High-performance cart data caching with geo-replication[^2]
- **Data Structures**:
    - Sorted Sets for cart items (score = timestamp)
    - Hash Maps for cart metadata
    - Sets for cart members/active connections
    - Pub/Sub for real-time event broadcasting
- **Consistency**: Redis Cluster with master-slave replication, automatic failover
- **TTL**: Active carts cached for 24 hours, extended on activity


### **4. CRDT Conflict Resolution Engine**

- **Purpose**: Resolve conflicts from concurrent cart updates across users/regions[^5] [^3]
- **Strategy**: OR-Set (Observed-Remove Set) for shopping cart items[^3]
- **Algorithm**:
    - Each operation tagged with unique ID (user + timestamp + random)
    - Add operations: Insert item with unique tag
    - Remove operations: Record removal tag
    - Merge: Union of all adds, minus observed removes
    - Result: Both concurrent adds preserved, explicit removes honored[^3]


### **5. Session Management**

- **Approach**: Centralized session store (Redis) for stateless app servers[^2]
- **Benefits**:
    - Servers are stateless, easy horizontal scaling
    - User sessions survive server restarts/failures
    - Consistent cart state across load-balanced requests[^2]


### **6. Inventory Service**

- **Responsibilities**: Real-time stock validation, reservation management
- **Features**:
    - Pessimistic locking for checkout
    - Reservation timeout (10 minutes)
    - Stock level broadcasting to connected carts
    - Low-stock warnings

***

## Key Workflows

### **Workflow 1: Real-Time Item Addition with CRDT Merge**

```
┌─────────────┐        ┌─────────────┐
│  User A     │        │  User B     │
│  (NY)       │        │  (London)   │
└──────┬──────┘        └──────┬──────┘
       │                      │
       │ Add Item (Laptop)    │ Add Item (Mouse)
       │                      │
       ▼                      ▼
┌──────────────┐      ┌──────────────┐
│ WebSocket    │      │ WebSocket    │
│ Server (US)  │      │ Server (EU)  │
└──────┬───────┘      └──────┬───────┘
       │                      │
       ▼                      ▼
┌─────────────────────────────────────────┐
│ 1. Receive Add Item Event               │
│    { type: 'ITEM_ADDED',                 │
│      cartId, userId, productInfo,        │
│      operationId: 'userA_123_xyz',       │
│      vectorClock: {userA: 5, userB: 3} } │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 2. Validate User Permission             │
│    SELECT * FROM CartMembers             │
│    WHERE CartID = ? AND UserID = ?       │
│    - Check canAdd permission             │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 3. Create CRDT Add Tag                  │
│    addTag = {                            │
│      operationId: 'userA_1733592000_abc',│
│      userId: 'userA',                    │
│      timestamp: 1733592000               │
│    }                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 4. Insert Cart Item with CRDT Metadata  │
│    INSERT INTO CartItems (               │
│      CartID, VariantID, ItemUUID,        │
│      AddTags='[{operationId, ...}]',     │
│      RemoveTags='[]',                    │
│      Quantity, VectorClock, Version=1    │
│    )                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 5. Update Cart Vector Clock             │
│    UPDATE SharedCarts SET                │
│      VectorClock = JSON_SET(             │
│        VectorClock, '$.userA',           │
│        VectorClock->'$.userA' + 1        │
│      ),                                  │
│      UpdatedAt = NOW()                   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 6. Log Activity                         │
│    INSERT INTO CartActivityLog (         │
│      CartID, UserID,                     │
│      ActivityType='ITEM_ADDED',          │
│      OperationID, NewValue               │
│    )                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 7. Publish to Message Queue             │
│    Kafka.publish('cart.events', {        │
│      type: 'ITEM_ADDED',                 │
│      cartId, operationId, item,          │
│      vectorClock, region: 'US'           │
│    })                                    │
└──────┬──────────────────────────────────┘
       │
       ├──────────────────┬─────────────────┐
       │                  │                 │
       ▼                  ▼                 ▼
┌────────────┐    ┌────────────┐    ┌────────────┐
│ Broadcast  │    │ Propagate  │    │ Update     │
│ via        │    │ to Other   │    │ Redis      │
│ WebSocket  │    │ Regions    │    │ Cache      │
└────────────┘    └────────────┘    └────────────┘
       │                  │                 │
       ▼                  ▼                 ▼
┌─────────────────────────────────────────┐
│ 8. Broadcast to All Cart Members        │
│    For each active WebSocket connection: │
│      socket.send({                       │
│        type: 'ITEM_ADDED',               │
│        item, addedBy: 'userA',           │
│        timestamp, vectorClock            │
│      })                                  │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 9. Receive at Other Regions             │
│    EU Server consumes Kafka event        │
│    - Merge CRDT operation                │
│    - Update local database               │
│    - Broadcast to local WebSocket clients│
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 10. CONFLICT DETECTION & RESOLUTION     │
│     If User B also added item:           │
│       - Compare vector clocks            │
│       - Detect concurrent operation      │
│       - Merge using OR-Set:              │
│         * Keep both add operations       │
│         * Sum quantities OR keep separate│
│       - Log conflict resolution          │
│       INSERT INTO CartActivityLog (      │
│         ActivityType='CONFLICT_RESOLVED',│
│         ConflictDetected=TRUE            │
│       )                                  │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 11. Update All Clients                  │
│     Broadcast merged state to all users: │
│     { type: 'CART_UPDATED',              │
│       items: [mergedItems],              │
│       vectorClock: {userA: 6, userB: 4} }│
└─────────────────────────────────────────┘
```

**Latency**: <200ms global propagation, <50ms local updates

***

### **Workflow 2: Member Joins Shared Cart**

```
┌─────────────┐
│  User C     │
│ Clicks Share│
│    Link     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. Frontend sends join request          │
│    POST /api/carts/join                  │
│    { shareToken, userId }                │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 2. Validate Share Token                 │
│    SELECT * FROM SharedCarts             │
│    WHERE ShareToken = ?                  │
│      AND ShareTokenExpiresAt > NOW()     │
│      AND Status = 'ACTIVE'               │
└──────┬──────────────────────────────────┘
       │
       ├─── Invalid ───┐
       │               ▼
       │        ┌──────────────┐
       │        │ Return Error │
       │        │ "Invalid link│
       │        └──────────────┘
       │
       └─── Valid ───┐
                     ▼
┌─────────────────────────────────────────┐
│ 3. Check Member Limit                   │
│    SELECT COUNT(*) FROM CartMembers      │
│    WHERE CartID = ?                      │
│    - Compare with MaxMembers             │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 4. Add User as Cart Member              │
│    INSERT INTO CartMembers (             │
│      CartID, UserID, Role='EDITOR',      │
│      Permissions='{"canAdd":true,...}',  │
│      JoinedAt=NOW(), IsOnline=FALSE      │
│    )                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 5. Initialize Vector Clock Entry        │
│    UPDATE SharedCarts SET                │
│      VectorClock = JSON_SET(             │
│        VectorClock, '$.userC', 0         │
│      )                                   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 6. Establish WebSocket Connection       │
│    - Client connects to WebSocket server │
│    - Server validates user & cart access │
│    - Add to cart "room"                  │
│    UPDATE CartMembers SET                │
│      IsOnline=TRUE,                      │
│      ConnectionID='WS_userC_...'         │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 7. Send Full Cart State to New Member   │
│    socket.send({                         │
│      type: 'CART_SYNC',                  │
│      cart: { items, members, totals },   │
│      vectorClock                         │
│    })                                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 8. Broadcast Member Joined              │
│    To all other online members:          │
│    socket.send({                         │
│      type: 'MEMBER_JOINED',              │
│      userId: 'userC',                    │
│      userName: 'Charlie',                │
│      timestamp                           │
│    })                                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 9. Log Activity                         │
│    INSERT INTO CartActivityLog (         │
│      ActivityType='MEMBER_JOINED',       │
│      UserID='userC'                      │
│    )                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 10. Return Success                      │
│     { cartId, cartData, yourRole,        │
│       onlineMembers: [...] }             │
└─────────────────────────────────────────┘
```


***

### **Workflow 3: Checkout Lock Acquisition (Prevent Concurrent Checkouts)**

```
┌─────────────┐
│  User A     │
│   Starts    │
│  Checkout   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. Request Checkout Lock                │
│    POST /api/carts/:id/lock              │
│    { userId }                            │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 2. Attempt Distributed Lock (Redis)     │
│    SETNX cart:lock:{cartId} {userId}     │
│    EX 600  // 10 minutes                 │
└──────┬──────────────────────────────────┘
       │
       ├─── Lock Failed ───┐
       │                   ▼
       │            ┌──────────────────┐
       │            │ Return Error     │
       │            │ "Cart locked by  │
       │            │  another user"   │
       │            └──────────────────┘
       │
       └─── Lock Acquired ───┐
                             ▼
┌─────────────────────────────────────────┐
│ 3. Update Cart Lock Status              │
│    UPDATE SharedCarts SET                │
│      Status = 'LOCKED',                  │
│      LockedUntil = NOW() + INTERVAL 10 MIN│
│    WHERE CartID = ?                      │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 4. Store Lock Record in DB              │
│    INSERT INTO DistributedLocks (        │
│      ResourceType='CART',                │
│      ResourceID={cartId},                │
│      LockHolder={userId},                │
│      LockToken={uuid},                   │
│      ExpiresAt=NOW()+10MIN               │
│    )                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 5. Broadcast Lock Event                 │
│    To all cart members:                  │
│    socket.send({                         │
│      type: 'CART_LOCKED',                │
│      lockedBy: 'userA',                  │
│      message: 'User A is checking out'   │
│    })                                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 6. Disable Edit Actions for Others      │
│    - Frontend disables add/remove buttons│
│    - Show "Checkout in progress" banner  │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 7. User A Completes/Cancels Checkout    │
│    - On success: Cart → Order            │
│    - On cancel: Release lock             │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 8. Release Lock                         │
│    DEL cart:lock:{cartId}                │
│    UPDATE SharedCarts SET                │
│      Status = 'ACTIVE', LockedUntil=NULL │
│    UPDATE DistributedLocks SET           │
│      IsReleased=TRUE, ReleasedAt=NOW()   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 9. Broadcast Unlock Event               │
│    socket.send({                         │
│      type: 'CART_UNLOCKED',              │
│      message: 'Cart available again'     │
│    })                                    │
└─────────────────────────────────────────┘
```

**Lock Timeout**: 10 minutes with automatic release

***

## Database Schema Design

### **Shared Carts Table**

```sql
CREATE TABLE SharedCarts (
    CartID BIGINT PRIMARY KEY AUTO_INCREMENT,
    CartUUID VARCHAR(36) UNIQUE NOT NULL,
    OwnerUserID BIGINT NOT NULL,
    CartName VARCHAR(100) DEFAULT 'Shared Cart',
    ShareToken VARCHAR(64) UNIQUE NOT NULL COMMENT 'Secret token for sharing',
    ShareTokenExpiresAt TIMESTAMP COMMENT 'Expiry for share link',
    IsPublicLink BOOLEAN DEFAULT FALSE COMMENT 'Anyone with link can join',
    MaxMembers INT DEFAULT 10 COMMENT 'Max participants allowed',
    Status ENUM('ACTIVE', 'LOCKED', 'CONVERTED', 'EXPIRED') DEFAULT 'ACTIVE',
    
    -- CRDT metadata
    VectorClock JSON COMMENT 'Lamport clock for causality tracking',
    
    -- Timestamps
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    LastActivityAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    LockedUntil TIMESTAMP COMMENT 'Checkout lock expiration',
    
    FOREIGN KEY (OwnerUserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    INDEX idx_owner (OwnerUserID),
    INDEX idx_share_token (ShareToken),
    INDEX idx_uuid (CartUUID),
    INDEX idx_status_activity (Status, LastActivityAt)
);
```


### **Cart Members Table (Access Control)**

```sql
CREATE TABLE CartMembers (
    MembershipID BIGINT PRIMARY KEY AUTO_INCREMENT,
    CartID BIGINT NOT NULL,
    UserID BIGINT NOT NULL,
    Role ENUM('OWNER', 'EDITOR', 'VIEWER') DEFAULT 'EDITOR',
    Permissions JSON COMMENT '{"canAdd": true, "canRemove": true, "canCheckout": false}',
    InvitedBy BIGINT,
    JoinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    LastSeenAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    IsOnline BOOLEAN DEFAULT FALSE,
    ConnectionID VARCHAR(100) COMMENT 'Active WebSocket connection ID',
    
    FOREIGN KEY (CartID) REFERENCES SharedCarts(CartID) ON DELETE CASCADE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (InvitedBy) REFERENCES Users(UserID) ON DELETE SET NULL,
    UNIQUE KEY unique_cart_user (CartID, UserID),
    INDEX idx_cart (CartID),
    INDEX idx_user (UserID),
    INDEX idx_online (CartID, IsOnline)
);
```


### **Cart Items with CRDT Metadata**

```sql
CREATE TABLE CartItems (
    CartItemID BIGINT PRIMARY KEY AUTO_INCREMENT,
    CartID BIGINT NOT NULL,
    VariantID BIGINT NOT NULL,
    
    -- CRDT fields for conflict-free merging
    ItemUUID VARCHAR(36) UNIQUE NOT NULL COMMENT 'Global unique identifier',
    AddedByUserID BIGINT NOT NULL,
    AddTags JSON NOT NULL COMMENT 'Set of unique add operation IDs',
    RemoveTags JSON COMMENT 'Set of observed remove operation IDs',
    
    -- Item details
    Quantity INT NOT NULL DEFAULT 1,
    Price DECIMAL(10, 2) NOT NULL,
    
    -- Version tracking
    Version INT DEFAULT 1 COMMENT 'Optimistic locking version',
    VectorClock JSON COMMENT 'Per-item causality tracking',
    
    -- Timestamps
    AddedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    LastModifiedBy BIGINT,
    
    -- Tombstone for CRDT (soft delete)
    IsDeleted BOOLEAN DEFAULT FALSE,
    DeletedAt TIMESTAMP,
    DeletedBy BIGINT,
    
    FOREIGN KEY (CartID) REFERENCES SharedCarts(CartID) ON DELETE CASCADE,
    FOREIGN KEY (VariantID) REFERENCES ProductVariants(VariantID) ON DELETE CASCADE,
    FOREIGN KEY (AddedByUserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (LastModifiedBy) REFERENCES Users(UserID) ON DELETE SET NULL,
    FOREIGN KEY (DeletedBy) REFERENCES Users(UserID) ON DELETE SET NULL,
    
    INDEX idx_cart (CartID),
    INDEX idx_variant (VariantID),
    INDEX idx_uuid (ItemUUID),
    INDEX idx_cart_active (CartID, IsDeleted),
    CHECK (Quantity > 0)
);
```


### **Cart Activity Log (Real-time Events)**

```sql
CREATE TABLE CartActivityLog (
    ActivityID BIGINT PRIMARY KEY AUTO_INCREMENT,
    CartID BIGINT NOT NULL,
    UserID BIGINT NOT NULL,
    ActivityType ENUM('ITEM_ADDED', 'ITEM_REMOVED', 'ITEM_UPDATED', 'QUANTITY_CHANGED', 
                      'MEMBER_JOINED', 'MEMBER_LEFT', 'CART_LOCKED', 'CART_UNLOCKED',
                      'CONFLICT_RESOLVED') NOT NULL,
    
    -- Activity details
    TargetItemID BIGINT COMMENT 'CartItemID if item-related',
    OldValue JSON COMMENT 'Previous state',
    NewValue JSON COMMENT 'New state',
    OperationID VARCHAR(100) UNIQUE COMMENT 'Unique operation ID for CRDT',
    
    -- Conflict resolution metadata
    ConflictDetected BOOLEAN DEFAULT FALSE,
    ConflictResolvedBy VARCHAR(50) COMMENT 'CRDT, USER, SYSTEM',
    
    -- Client metadata
    ClientID VARCHAR(100) COMMENT 'Browser/device identifier',
    IPAddress VARCHAR(45),
    
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (CartID) REFERENCES SharedCarts(CartID) ON DELETE CASCADE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (TargetItemID) REFERENCES CartItems(CartItemID) ON DELETE SET NULL,
    
    INDEX idx_cart_activity (CartID, CreatedAt DESC),
    INDEX idx_user_activity (UserID, CreatedAt DESC),
    INDEX idx_operation (OperationID)
);
```


### **Cart Synchronization State (Multi-Region)**

```sql
CREATE TABLE CartSyncState (
    SyncID BIGINT PRIMARY KEY AUTO_INCREMENT,
    CartID BIGINT NOT NULL,
    RegionID VARCHAR(20) NOT NULL COMMENT 'us-east-1, eu-west-1, etc.',
    LastSyncedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    VectorClock JSON NOT NULL COMMENT 'Region-specific vector clock',
    PendingOperations JSON COMMENT 'Operations awaiting sync',
    SyncStatus ENUM('SYNCED', 'PENDING', 'CONFLICT', 'ERROR') DEFAULT 'SYNCED',
    ConflictCount INT DEFAULT 0,
    LastConflictAt TIMESTAMP,
    
    FOREIGN KEY (CartID) REFERENCES SharedCarts(CartID) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_region (CartID, RegionID),
    INDEX idx_cart (CartID),
    INDEX idx_status (SyncStatus, LastSyncedAt)
);
```


### **Distributed Locks Table (Checkout Coordination)**

```sql
CREATE TABLE DistributedLocks (
    LockID BIGINT PRIMARY KEY AUTO_INCREMENT,
    ResourceType ENUM('CART', 'INVENTORY', 'ORDER') NOT NULL,
    ResourceID BIGINT NOT NULL,
    LockHolder VARCHAR(100) NOT NULL COMMENT 'User or process holding lock',
    LockToken VARCHAR(64) UNIQUE NOT NULL COMMENT 'UUID for lock validation',
    AcquiredAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ExpiresAt TIMESTAMP NOT NULL,
    IsReleased BOOLEAN DEFAULT FALSE,
    ReleasedAt TIMESTAMP,
    
    UNIQUE KEY unique_resource (ResourceType, ResourceID, IsReleased),
    INDEX idx_expiry (ExpiresAt, IsReleased),
    INDEX idx_holder (LockHolder)
);
```


### **WebSocket Connections Tracking**

```sql
CREATE TABLE ActiveConnections (
    ConnectionID VARCHAR(100) PRIMARY KEY,
    UserID BIGINT NOT NULL,
    CartID BIGINT NOT NULL,
    SessionID VARCHAR(100) NOT NULL,
    ServerNodeID VARCHAR(50) NOT NULL COMMENT 'Which server handles this connection',
    ConnectedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    LastHeartbeatAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ClientMetadata JSON COMMENT '{"browser": "Chrome", "os": "Windows"}',
    
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (CartID) REFERENCES SharedCarts(CartID) ON DELETE CASCADE,
    INDEX idx_user (UserID),
    INDEX idx_cart (CartID),
    INDEX idx_server (ServerNodeID),
    INDEX idx_heartbeat (LastHeartbeatAt)
);
```


***

## Low-Level Design (LLD) - TypeScript

### **Domain Models**

```typescript
// Enums
enum CartRole {
  OWNER = 'OWNER',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER'
}

enum CartStatus {
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED',
  CONVERTED = 'CONVERTED',
  EXPIRED = 'EXPIRED'
}

enum ActivityType {
  ITEM_ADDED = 'ITEM_ADDED',
  ITEM_REMOVED = 'ITEM_REMOVED',
  ITEM_UPDATED = 'ITEM_UPDATED',
  QUANTITY_CHANGED = 'QUANTITY_CHANGED',
  MEMBER_JOINED = 'MEMBER_JOINED',
  MEMBER_LEFT = 'MEMBER_LEFT',
  CART_LOCKED = 'CART_LOCKED',
  CART_UNLOCKED = 'CART_UNLOCKED',
  CONFLICT_RESOLVED = 'CONFLICT_RESOLVED'
}

// CRDT Types
interface AddTag {
  operationId: string; // userId + timestamp + random
  userId: string;
  timestamp: number;
}

interface RemoveTag {
  operationId: string;
  userId: string;
  timestamp: number;
  removedTags: string[]; // Which add tags are being removed
}

interface VectorClock {
  [userId: string]: number; // Logical clock per user
}

interface CRDTMetadata {
  itemUUID: string;
  addTags: AddTag[];
  removeTags: RemoveTag[];
  vectorClock: VectorClock;
}

// Interfaces
interface CartMember {
  userId: string;
  role: CartRole;
  permissions: {
    canAdd: boolean;
    canRemove: boolean;
    canUpdate: boolean;
    canCheckout: boolean;
  };
  isOnline: boolean;
  connectionId?: string;
  lastSeenAt: Date;
}

interface CartItemData {
  itemUUID: string;
  variantId: string;
  productInfo: ProductInfo;
  quantity: number;
  price: number;
  addedByUserId: string;
  crdtMetadata: CRDTMetadata;
  version: number;
}

interface WebSocketMessage {
  type: string;
  cartId: string;
  userId: string;
  timestamp: number;
  data: any;
  operationId: string;
}
```


### **CRDT OR-Set Implementation**

```typescript
class CRDTORSet {
  private addTags: Map<string, AddTag>; // itemUUID -> AddTag
  private removeTags: Map<string, RemoveTag>; // itemUUID -> RemoveTag

  constructor() {
    this.addTags = new Map();
    this.removeTags = new Map();
  }

  // Add operation
  add(itemUUID: string, userId: string): AddTag {
    const operationId = this.generateOperationId(userId);
    const addTag: AddTag = {
      operationId,
      userId,
      timestamp: Date.now()
    };
    
    this.addTags.set(itemUUID, addTag);
    return addTag;
  }

  // Remove operation (records observed adds)
  remove(itemUUID: string, userId: string, observedAddTags: string[]): RemoveTag {
    const operationId = this.generateOperationId(userId);
    const removeTag: RemoveTag = {
      operationId,
      userId,
      timestamp: Date.now(),
      removedTags: observedAddTags
    };
    
    this.removeTags.set(itemUUID, removeTag);
    return removeTag;
  }

  // Check if item exists (not removed)
  contains(itemUUID: string): boolean {
    const addTag = this.addTags.get(itemUUID);
    if (!addTag) return false;

    const removeTag = this.removeTags.get(itemUUID);
    if (!removeTag) return true;

    // Item exists if its add tag is not in remove tags
    return !removeTag.removedTags.includes(addTag.operationId);
  }

  // Merge two OR-Sets (conflict resolution)
  merge(other: CRDTORSet): CRDTORSet {
    const merged = new CRDTORSet();

    // Union of all add tags
    this.addTags.forEach((tag, uuid) => merged.addTags.set(uuid, tag));
    other.addTags.forEach((tag, uuid) => {
      if (!merged.addTags.has(uuid)) {
        merged.addTags.set(uuid, tag);
      }
    });

    // Union of all remove tags
    this.removeTags.forEach((tag, uuid) => merged.removeTags.set(uuid, tag));
    other.removeTags.forEach((tag, uuid) => {
      const existing = merged.removeTags.get(uuid);
      if (!existing) {
        merged.removeTags.set(uuid, tag);
      } else {
        // Merge removed tags arrays
        const combinedRemovedTags = [
          ...new Set([...existing.removedTags, ...tag.removedTags])
        ];
        merged.removeTags.set(uuid, {
          ...tag,
          removedTags: combinedRemovedTags
        });
      }
    });

    return merged;
  }

  // Get all active items
  getActiveItems(): string[] {
    const activeItems: string[] = [];
    
    this.addTags.forEach((addTag, uuid) => {
      if (this.contains(uuid)) {
        activeItems.push(uuid);
      }
    });

    return activeItems;
  }

  private generateOperationId(userId: string): string {
    return `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Serialize for storage
  toJSON(): object {
    return {
      addTags: Array.from(this.addTags.entries()),
      removeTags: Array.from(this.removeTags.entries())
    };
  }

  // Deserialize from storage
  static fromJSON(data: any): CRDTORSet {
    const orSet = new CRDTORSet();
    orSet.addTags = new Map(data.addTags);
    orSet.removeTags = new Map(data.removeTags);
    return orSet;
  }
}
```


### **Vector Clock Implementation**

```typescript
class VectorClockManager {
  private clock: VectorClock;

  constructor(initialClock: VectorClock = {}) {
    this.clock = { ...initialClock };
  }

  // Increment local clock for user
  increment(userId: string): void {
    this.clock[userId] = (this.clock[userId] || 0) + 1;
  }

  // Get current clock value for user
  get(userId: string): number {
    return this.clock[userId] || 0;
  }

  // Update clock on receiving remote operation
  update(userId: string, timestamp: number): void {
    this.clock[userId] = Math.max(this.clock[userId] || 0, timestamp);
  }

  // Merge two vector clocks (take max of each entry)
  merge(other: VectorClock): void {
    Object.keys(other).forEach(userId => {
      this.clock[userId] = Math.max(this.clock[userId] || 0, other[userId]);
    });
  }

  // Check if this clock happened before another (causality)
  happenedBefore(other: VectorClock): boolean {
    let strictlyLess = false;
    
    for (const userId in this.clock) {
      if (this.clock[userId] > (other[userId] || 0)) {
        return false; // Not happened before
      }
      if (this.clock[userId] < (other[userId] || 0)) {
        strictlyLess = true;
      }
    }

    return strictlyLess;
  }

  // Check if two clocks are concurrent (conflicting operations)
  isConcurrent(other: VectorClock): boolean {
    return !this.happenedBefore(other) && 
           !new VectorClockManager(other).happenedBefore(this.clock);
  }

  getClock(): VectorClock {
    return { ...this.clock };
  }
}
```


### **Shared Cart Item Entity**

```typescript
class SharedCartItem {
  readonly itemUUID: string;
  private variantId: string;
  private productInfo: ProductInfo;
  private quantity: number;
  private price: number;
  private addedByUserId: string;
  
  // CRDT metadata
  private crdtMetadata: CRDTMetadata;
  private version: number;
  private vectorClock: VectorClockManager;
  
  // State
  private isDeleted: boolean;
  private lastModifiedBy: string;
  private updatedAt: Date;

  constructor(data: CartItemData) {
    this.itemUUID = data.itemUUID || this.generateUUID();
    this.variantId = data.variantId;
    this.productInfo = data.productInfo;
    this.quantity = data.quantity;
    this.price = data.price;
    this.addedByUserId = data.addedByUserId;
    this.crdtMetadata = data.crdtMetadata;
    this.version = data.version || 1;
    this.vectorClock = new VectorClockManager(data.crdtMetadata.vectorClock);
    this.isDeleted = false;
    this.lastModifiedBy = data.addedByUserId;
    this.updatedAt = new Date();
  }

  private generateUUID(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Update quantity with version check (optimistic locking)
  updateQuantity(newQuantity: number, userId: string, currentVersion: number): void {
    if (this.version !== currentVersion) {
      throw new Error('Version conflict: item was modified by another user');
    }

    if (newQuantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    this.quantity = newQuantity;
    this.version++;
    this.vectorClock.increment(userId);
    this.lastModifiedBy = userId;
    this.updatedAt = new Date();
  }

  // Mark as deleted (tombstone for CRDT)
  markDeleted(userId: string): void {
    this.isDeleted = true;
    this.lastModifiedBy = userId;
    this.updatedAt = new Date();
    this.vectorClock.increment(userId);
  }

  // Merge with concurrent update
  mergeWith(other: SharedCartItem): SharedCartItem {
    // Use vector clocks to determine causality
    const isConcurrent = this.vectorClock.isConcurrent(other.getCRDTMetadata().vectorClock);

    if (!isConcurrent) {
      // One happened before the other, return latest
      return this.vectorClock.happenedBefore(other.getCRDTMetadata().vectorClock) ? other : this;
    }

    // Concurrent conflict: merge quantities (sum)
    const mergedQuantity = this.quantity + other.quantity;
    
    // Merge vector clocks
    const mergedVectorClock = new VectorClockManager(this.vectorClock.getClock());
    mergedVectorClock.merge(other.getCRDTMetadata().vectorClock);

    // Create merged item
    const merged = new SharedCartItem({
      itemUUID: this.itemUUID,
      variantId: this.variantId,
      productInfo: this.productInfo,
      quantity: mergedQuantity,
      price: this.price,
      addedByUserId: this.addedByUserId,
      crdtMetadata: {
        ...this.crdtMetadata,
        vectorClock: mergedVectorClock.getClock()
      },
      version: Math.max(this.version, other.version) + 1
    });

    return merged;
  }

  // Getters
  getItemUUID(): string { return this.itemUUID; }
  getVariantId(): string { return this.variantId; }
  getQuantity(): number { return this.quantity; }
  getPrice(): number { return this.price; }
  getVersion(): number { return this.version; }
  isItemDeleted(): boolean { return this.isDeleted; }
  getCRDTMetadata(): CRDTMetadata { return { ...this.crdtMetadata }; }
  getVectorClock(): VectorClock { return this.vectorClock.getClock(); }
  getItemTotal(): number { return this.price * this.quantity; }

  toJSON(): object {
    return {
      itemUUID: this.itemUUID,
      variantId: this.variantId,
      productInfo: this.productInfo,
      quantity: this.quantity,
      price: this.price,
      addedByUserId: this.addedByUserId,
      crdtMetadata: this.crdtMetadata,
      version: this.version,
      isDeleted: this.isDeleted,
      lastModifiedBy: this.lastModifiedBy,
      updatedAt: this.updatedAt
    };
  }
}
```


### **Shared Cart Entity**

```typescript
class SharedCart {
  readonly cartId: string;
  readonly cartUUID: string;
  private ownerId: string;
  private cartName: string;
  private shareToken: string;
  private status: CartStatus;
  
  // Members management
  private members: Map<string, CartMember>; // userId -> member
  
  // Items with CRDT
  private items: Map<string, SharedCartItem>; // itemUUID -> item
  private crdtOrSet: CRDTORSet;
  
  // Vector clock for cart-level causality
  private vectorClock: VectorClockManager;
  
  // Locks
  private isLocked: boolean;
  private lockedBy: string | null;
  private lockedUntil: Date | null;
  
  private createdAt: Date;
  private updatedAt: Date;
  private lastActivityAt: Date;

  constructor(ownerId: string, cartName: string = 'Shared Cart') {
    this.cartId = this.generateCartId();
    this.cartUUID = this.generateUUID();
    this.ownerId = ownerId;
    this.cartName = cartName;
    this.shareToken = this.generateShareToken();
    this.status = CartStatus.ACTIVE;
    this.members = new Map();
    this.items = new Map();
    this.crdtOrSet = new CRDTORSet();
    this.vectorClock = new VectorClockManager();
    this.isLocked = false;
    this.lockedBy = null;
    this.lockedUntil = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.lastActivityAt = new Date();

    // Add owner as first member
    this.addMember(ownerId, CartRole.OWNER);
  }

  private generateCartId(): string {
    return `CART_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateUUID(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 16)}`;
  }

  private generateShareToken(): string {
    return Buffer.from(`${this.cartUUID}_${Date.now()}_${Math.random()}`)
      .toString('base64')
      .substring(0, 32);
  }

  // Add member to shared cart
  addMember(userId: string, role: CartRole = CartRole.EDITOR): CartMember {
    if (this.members.has(userId)) {
      throw new Error('User already a member of this cart');
    }

    const member: CartMember = {
      userId,
      role,
      permissions: this.getDefaultPermissions(role),
      isOnline: false,
      lastSeenAt: new Date()
    };

    this.members.set(userId, member);
    this.updateActivity();
    return member;
  }

  private getDefaultPermissions(role: CartRole): CartMember['permissions'] {
    switch (role) {
      case CartRole.OWNER:
        return { canAdd: true, canRemove: true, canUpdate: true, canCheckout: true };
      case CartRole.EDITOR:
        return { canAdd: true, canRemove: true, canUpdate: true, canCheckout: false };
      case CartRole.VIEWER:
        return { canAdd: false, canRemove: false, canUpdate: false, canCheckout: false };
    }
  }

  // Add item to cart (CRDT add operation)
  addItem(
    productInfo: ProductInfo,
    variantId: string,
    quantity: number,
    price: number,
    userId: string
  ): SharedCartItem {
    this.validateActiveCart();
    this.checkPermission(userId, 'canAdd');

    // Generate unique operation ID
    const addTag = this.crdtOrSet.add(variantId, userId);
    
    const crdtMetadata: CRDTMetadata = {
      itemUUID: addTag.operationId,
      addTags: [addTag],
      removeTags: [],
      vectorClock: this.vectorClock.getClock()
    };

    const item = new SharedCartItem({
      itemUUID: addTag.operationId,
      variantId,
      productInfo,
      quantity,
      price,
      addedByUserId: userId,
      crdtMetadata,
      version: 1
    });

    this.items.set(item.getItemUUID(), item);
    this.vectorClock.increment(userId);
    this.updateActivity();

    return item;
  }

  // Remove item (CRDT remove operation)
  removeItem(itemUUID: string, userId: string): void {
    this.validateActiveCart();
    this.checkPermission(userId, 'canRemove');

    const item = this.items.get(itemUUID);
    if (!item) {
      throw new Error('Item not found in cart');
    }

    // Record observed add tags
    const addTags = item.getCRDTMetadata().addTags.map(tag => tag.operationId);
    this.crdtOrSet.remove(item.getVariantId(), userId, addTags);

    item.markDeleted(userId);
    this.vectorClock.increment(userId);
    this.updateActivity();
  }

  // Update item quantity
  updateItemQuantity(itemUUID: string, newQuantity: number, userId: string, version: number): void {
    this.validateActiveCart();
    this.checkPermission(userId, 'canUpdate');

    const item = this.items.get(itemUUID);
    if (!item) {
      throw new Error('Item not found in cart');
    }

    item.updateQuantity(newQuantity, userId, version);
    this.vectorClock.increment(userId);
    this.updateActivity();
  }

  // Merge cart state (conflict resolution)
  mergeWith(other: SharedCart): void {
    // Merge CRDT OR-Sets
    this.crdtOrSet = this.crdtOrSet.merge(other.crdtOrSet);

    // Merge items
    other.items.forEach((otherItem, uuid) => {
      const existingItem = this.items.get(uuid);
      
      if (!existingItem) {
        // New item from other cart
        this.items.set(uuid, otherItem);
      } else {
        // Merge concurrent updates
        const merged = existingItem.mergeWith(otherItem);
        this.items.set(uuid, merged);
      }
    });

    // Merge vector clocks
    this.vectorClock.merge(other.getVectorClock());

    // Remove items marked as deleted in OR-Set
    this.items.forEach((item, uuid) => {
      if (!this.crdtOrSet.contains(item.getVariantId()) || item.isItemDeleted()) {
        this.items.delete(uuid);
      }
    });

    this.updateActivity();
  }

  // Lock cart for checkout
  lock(userId: string, durationMinutes: number = 10): void {
    if (this.isLocked) {
      throw new Error('Cart is already locked');
    }

    this.checkPermission(userId, 'canCheckout');

    this.isLocked = true;
    this.lockedBy = userId;
    this.lockedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
    this.status = CartStatus.LOCKED;
    this.updateActivity();
  }

  // Unlock cart
  unlock(userId: string): void {
    if (!this.isLocked) {
      return;
    }

    if (this.lockedBy !== userId && !this.isOwner(userId)) {
      throw new Error('Only the lock holder or owner can unlock the cart');
    }

    this.isLocked = false;
    this.lockedBy = null;
    this.lockedUntil = null;
    this.status = CartStatus.ACTIVE;
    this.updateActivity();
  }

  // Check if lock expired
  checkLockExpiry(): void {
    if (this.isLocked && this.lockedUntil && this.lockedUntil < new Date()) {
      this.unlock(this.lockedBy!);
    }
  }

  // Mark member as online/offline
  updateMemberPresence(userId: string, isOnline: boolean, connectionId?: string): void {
    const member = this.members.get(userId);
    if (!member) {
      throw new Error('User is not a member of this cart');
    }

    member.isOnline = isOnline;
    member.connectionId = connectionId;
    member.lastSeenAt = new Date();
  }

  // Get online members
  getOnlineMembers(): CartMember[] {
    return Array.from(this.members.values()).filter(m => m.isOnline);
  }

  // Calculate cart totals
  calculateTotal(): number {
    let total = 0;
    this.items.forEach(item => {
      if (!item.isItemDeleted()) {
        total += item.getItemTotal();
      }
    });
    return total;
  }

  // Get active items (not deleted)
  getActiveItems(): SharedCartItem[] {
    return Array.from(this.items.values()).filter(item => !item.isItemDeleted());
  }

  private validateActiveCart(): void {
    if (this.status !== CartStatus.ACTIVE) {
      throw new Error(`Cannot modify cart with status: ${this.status}`);
    }
  }

  private checkPermission(userId: string, permission: keyof CartMember['permissions']): void {
    const member = this.members.get(userId);
    if (!member) {
      throw new Error('User is not a member of this cart');
    }

    if (!member.permissions[permission]) {
      throw new Error(`User does not have ${permission} permission`);
    }
  }

  private isOwner(userId: string): boolean {
    return this.ownerId === userId;
  }

  private updateActivity(): void {
    this.lastActivityAt = new Date();
    this.updatedAt = new Date();
  }

  // Getters
  getCartId(): string { return this.cartId; }
  getCartUUID(): string { return this.cartUUID; }
  getShareToken(): string { return this.shareToken; }
  getStatus(): CartStatus { return this.status; }
  getMembers(): CartMember[] { return Array.from(this.members.values()); }
  getVectorClock(): VectorClock { return this.vectorClock.getClock(); }
  getLockedStatus(): { isLocked: boolean; lockedBy: string | null; lockedUntil: Date | null } {
    return {
      isLocked: this.isLocked,
      lockedBy: this.lockedBy,
      lockedUntil: this.lockedUntil
    };
  }
}
```


### **WebSocket Service**

```typescript
import WebSocket from 'ws';

interface WebSocketConnection {
  socket: WebSocket;
  userId: string;
  cartId: string;
  connectionId: string;
  lastHeartbeat: Date;
}

class WebSocketService {
  private connections: Map<string, WebSocketConnection>; // connectionId -> connection
  private cartRooms: Map<string, Set<string>>; // cartId -> Set<connectionId>
  private heartbeatInterval: NodeJS.Timeout;

  constructor() {
    this.connections = new Map();
    this.cartRooms = new Map();
    this.startHeartbeatMonitor();
  }

  // Handle new WebSocket connection
  handleConnection(socket: WebSocket, userId: string, cartId: string): string {
    const connectionId = this.generateConnectionId(userId);
    
    const connection: WebSocketConnection = {
      socket,
      userId,
      cartId,
      connectionId,
      lastHeartbeat: new Date()
    };

    this.connections.set(connectionId, connection);

    // Add to cart room
    if (!this.cartRooms.has(cartId)) {
      this.cartRooms.set(cartId, new Set());
    }
    this.cartRooms.get(cartId)!.add(connectionId);

    // Setup event handlers
    socket.on('message', (data) => this.handleMessage(connectionId, data));
    socket.on('close', () => this.handleDisconnect(connectionId));
    socket.on('pong', () => this.handleHeartbeat(connectionId));

    // Send welcome message
    this.send(connectionId, {
      type: 'CONNECTED',
      connectionId,
      cartId,
      timestamp: Date.now()
    });

    // Notify other members
    this.broadcastToCart(cartId, {
      type: 'MEMBER_JOINED',
      userId,
      cartId,
      timestamp: Date.now()
    }, connectionId);

    return connectionId;
  }

  // Handle incoming message from client
  private handleMessage(connectionId: string, data: WebSocket.Data): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    try {
      const message = JSON.parse(data.toString());
      
      // Update heartbeat
      connection.lastHeartbeat = new Date();

      // Broadcast to all cart members
      this.broadcastToCart(connection.cartId, {
        ...message,
        userId: connection.userId,
        connectionId,
        timestamp: Date.now()
      }, connectionId);

    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  // Handle disconnection
  private handleDisconnect(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Remove from cart room
    const room = this.cartRooms.get(connection.cartId);
    if (room) {
      room.delete(connectionId);
      if (room.size === 0) {
        this.cartRooms.delete(connection.cartId);
      }
    }

    // Notify other members
    this.broadcastToCart(connection.cartId, {
      type: 'MEMBER_LEFT',
      userId: connection.userId,
      cartId: connection.cartId,
      timestamp: Date.now()
    });

    this.connections.delete(connectionId);
  }

  // Broadcast message to all members in a cart
  broadcastToCart(cartId: string, message: any, excludeConnectionId?: string): void {
    const room = this.cartRooms.get(cartId);
    if (!room) return;

    room.forEach(connectionId => {
      if (connectionId !== excludeConnectionId) {
        this.send(connectionId, message);
      }
    });
  }

  // Send message to specific connection
  private send(connectionId: string, message: any): void {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    connection.socket.send(JSON.stringify(message));
  }

  // Heartbeat monitoring
  private startHeartbeatMonitor(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      
      this.connections.forEach((connection, connectionId) => {
        const timeSinceHeartbeat = now - connection.lastHeartbeat.getTime();
        
        if (timeSinceHeartbeat > 60000) { // 60 seconds timeout
          console.log(`Connection ${connectionId} timed out`);
          connection.socket.terminate();
          this.handleDisconnect(connectionId);
        } else if (timeSinceHeartbeat > 30000) { // Ping after 30 seconds
          connection.socket.ping();
        }
      });
    }, 10000); // Check every 10 seconds
  }

  private handleHeartbeat(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.lastHeartbeat = new Date();
    }
  }

  private generateConnectionId(userId: string): string {
    return `WS_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup
  shutdown(): void {
    clearInterval(this.heartbeatInterval);
    this.connections.forEach((connection) => {
      connection.socket.close();
    });
  }
}
```


### **Shared Cart Service (Main Orchestrator)**

```typescript
interface ISharedCartRepository {
  save(cart: SharedCart): Promise<void>;
  findById(cartId: string): Promise<SharedCart | null>;
  findByShareToken(token: string): Promise<SharedCart | null>;
  update(cart: SharedCart): Promise<void>;
}

interface IDistributedCache {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl: number): Promise<void>;
  delete(key: string): Promise<void>;
  publish(channel: string, message: any): Promise<void>;
  subscribe(channel: string, handler: (message: any) => void): Promise<void>;
}

interface IDistributedLock {
  acquire(resourceId: string, holderId: string, ttl: number): Promise<boolean>;
  release(resourceId: string, holderId: string): Promise<void>;
}

class SharedCartService {
  constructor(
    private cartRepository: ISharedCartRepository,
    private cache: IDistributedCache,
    private distributedLock: IDistributedLock,
    private websocketService: WebSocketService,
    private inventoryService: IInventoryService
  ) {
    // Subscribe to cart events from other regions
    this.cache.subscribe('cart.events', (event) => this.handleRemoteCartEvent(event));
  }

  // Create shared cart
  async createSharedCart(ownerId: string, cartName: string): Promise<SharedCart> {
    const cart = new SharedCart(ownerId, cartName);
    
    await this.cartRepository.save(cart);
    await this.cacheCart(cart);

    return cart;
  }

  // Join shared cart via share token
  async joinSharedCart(shareToken: string, userId: string): Promise<SharedCart> {
    const cart = await this.findByShareToken(shareToken);
    if (!cart) {
      throw new Error('Invalid share token');
    }

    cart.addMember(userId, CartRole.EDITOR);
    await this.cartRepository.update(cart);
    await this.cacheCart(cart);

    // Broadcast member joined event
    this.websocketService.broadcastToCart(cart.getCartId(), {
      type: 'MEMBER_JOINED',
      userId,
      cartId: cart.getCartId(),
      timestamp: Date.now()
    });

    return cart;
  }

  // Add item to cart (with conflict resolution)
  async addItemToCart(
    cartId: string,
    userId: string,
    productInfo: ProductInfo,
    variantId: string,
    quantity: number,
    price: number,
    operationId: string
  ): Promise<SharedCartItem> {
    // Get cart from cache or database
    const cart = await this.getCart(cartId);

    // Check inventory availability
    const available = await this.inventoryService.checkAvailability(variantId, quantity);
    if (!available) {
      throw new Error('Product not available in requested quantity');
    }

    // Add item
    const item = cart.addItem(productInfo, variantId, quantity, price, userId);

    // Save and cache
    await this.cartRepository.update(cart);
    await this.cacheCart(cart);

    // Broadcast to all connected members
    this.websocketService.broadcastToCart(cartId, {
      type: 'ITEM_ADDED',
      cartId,
      userId,
      item: item.toJSON(),
      operationId,
      vectorClock: cart.getVectorClock(),
      timestamp: Date.now()
    });

    // Publish to other regions
    await this.cache.publish('cart.events', {
      type: 'ITEM_ADDED',
      cartId,
      userId,
      item: item.toJSON(),
      operationId,
      vectorClock: cart.getVectorClock()
    });

    return item;
  }

  // Handle remote cart events from other regions (CRDT merge)
  private async handleRemoteCartEvent(event: any): Promise<void> {
    const cart = await this.getCart(event.cartId);
    
    // Apply remote operation using CRDT
    // This is simplified - actual implementation would use CRDT merge logic
    
    // Broadcast to local WebSocket connections
    this.websocketService.broadcastToCart(event.cartId, {
      ...event,
      isRemote: true
    });
  }

  // Acquire lock for checkout
  async acquireCheckoutLock(cartId: string, userId: string): Promise<boolean> {
    const lockKey = `cart:lock:${cartId}`;
    const acquired = await this.distributedLock.acquire(lockKey, userId, 600); // 10 min TTL

    if (acquired) {
      const cart = await this.getCart(cartId);
      cart.lock(userId, 10);
      await this.cartRepository.update(cart);
      await this.cacheCart(cart);

      this.websocketService.broadcastToCart(cartId, {
        type: 'CART_LOCKED',
        cartId,
        lockedBy: userId,
        timestamp: Date.now()
      });
    }

    return acquired;
  }

  // Release checkout lock
  async releaseCheckoutLock(cartId: string, userId: string): Promise<void> {
    const lockKey = `cart:lock:${cartId}`;
    await this.distributedLock.release(lockKey, userId);

    const cart = await this.getCart(cartId);
    cart.unlock(userId);
    await this.cartRepository.update(cart);
    await this.cacheCart(cart);

    this.websocketService.broadcastToCart(cartId, {
      type: 'CART_UNLOCKED',
      cartId,
      timestamp: Date.now()
    });
  }

  // Get cart (cache-first)
  private async getCart(cartId: string): Promise<SharedCart> {
    const cacheKey = `cart:${cartId}`;
    
    // Try cache first
    let cartData = await this.cache.get(cacheKey);
    if (cartData) {
      return this.deserializeCart(cartData);
    }

    // Fallback to database
    const cart = await this.cartRepository.findById(cartId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    await this.cacheCart(cart);
    return cart;
  }

  private async findByShareToken(token: string): Promise<SharedCart | null> {
    return this.cartRepository.findByShareToken(token);
  }

  private async cacheCart(cart: SharedCart): Promise<void> {
    const cacheKey = `cart:${cart.getCartId()}`;
    await this.cache.set(cacheKey, this.serializeCart(cart), 86400); // 24 hours TTL
  }

  private serializeCart(cart: SharedCart): any {
    // Serialize cart for caching (implementation specific)
    return cart;
  }

  private deserializeCart(data: any): SharedCart {
    // Deserialize cart from cache (implementation specific)
    return data;
  }
}
```


## Key Design Patterns \& Techniques

1. **CRDT OR-Set**: Conflict-free replicated data type for automatic conflict resolution[^5] [^3]
2. **Vector Clocks**: Causality tracking for distributed operations[^5]
3. **WebSocket + Pub/Sub**: Real-time bidirectional communication[^4] [^5]
4. **Optimistic Locking**: Version-based concurrency control
5. **Distributed Locks**: Redis-based locks for checkout coordination
6. **Event Sourcing**: Activity log for audit trail and debugging
7. **Cache-Aside Pattern**: Redis caching with database fallback[^2]
8. **Multi-Region Replication**: Geographic distribution for low latency

This design ensures **strong eventual consistency**, handles network partitions gracefully, and provides seamless real-time collaboration for shared shopping carts at scale.[^1] [^5] [^2] [^3]
<span style="display:none">[^10] [^6] [^7] [^8] [^9]</span>

<div align="center">⁂</div>

[^1]: https://dev.to/savyjs/scalable-e-commerce-architecture-part-2-shopping-cart-3blg

[^2]: https://www.linkedin.com/posts/systemdesignengineer_sabah-added-5-items-to-shopping-cart-but-activity-7367458586471378944-EI0m

[^3]: https://dzone.com/articles/conflict-resolution-using-last-write-wins-vs-crdts

[^4]: https://www.multicollab.com/blog/why-websocket-is-critical-for-real-time-collaboration-in-wordpress/

[^5]: https://dev.to/dowerdev/building-a-real-time-collaborative-text-editor-websockets-implementation-with-crdt-data-structures-1bia

[^6]: https://dl.acm.org/doi/pdf/10.1145/352871.352895

[^7]: https://www.youtube.com/watch?v=-wJuExkI97s

[^8]: https://www.sharetribe.com/academy/multivendor-shopping-cart/

[^9]: https://github.com/luigiberrettini/shopping-cart-kata/blob/master/solution.md

[^10]: https://www.infoq.com/articles/database-merge-replication-crdt/

