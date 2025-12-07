## Inventory Stock Server System

### **System Architecture**

```
┌──────────────────────────────────────────────────────────────────┐
│                  Global Load Balancer (Geo-Distributed)          │
│                   (Route to Nearest Region)                      │
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
│         (Authentication, Rate Limiting, Routing)          │
└───────────────────────────┬───────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼─────┐      ┌─────▼──────┐     ┌─────▼──────┐
   │Inventory │      │Reservation │     │ Warehouse  │
   │ Service  │◄────▶│  Service   │────▶│  Service   │
   └────┬─────┘      └─────┬──────┘     └─────┬──────┘
        │                  │                   │
   ┌────▼─────┐      ┌─────▼──────┐     ┌─────▼──────┐
   │Inventory │      │Reservation │     │ Warehouse  │
   │    DB    │      │   Cache    │     │    DB      │
   │(Postgres)│      │  (Redis)   │     │            │
   └────┬─────┘      └────────────┘     └────────────┘
        │
   ┌────▼─────┐      ┌──────────────┐
   │ Read     │      │ Write-Ahead  │
   │ Replica  │      │     Log      │
   │          │      │   (Kafka)    │
   └──────────┘      └──────────────┘

┌──────────────────────────────────────────────────────────┐
│           Message Queue (Kafka/RabbitMQ)                  │
│  Topics: inventory.updates, reservations, cancellations  │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│      Event Processing Pipeline                            │
│  - Stock updates, Low stock alerts, Analytics            │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│    Distributed Cache (Redis Cluster)                      │
│  - Hot SKUs, Availability checks, Reservation locks      │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│    Background Jobs (Cron/Scheduler)                       │
│  - Expire reservations, Sync warehouses, Replenishment   │
└──────────────────────────────────────────────────────────┘
```


***

## Key Components

### **1. Inventory Service**

- **Responsibilities**: Core inventory management, stock tracking, availability checks[^1]
- **Features**:
    - Real-time stock level management across warehouses
    - Multi-location inventory aggregation
    - Stock adjustments (restock, damage, returns)
    - Low stock alerts and replenishment triggers
    - Batch inventory updates for imports
- **Performance**: <100ms for availability checks, handles 100k+ updates/min[^4] [^1]
- **Consistency**: Strong consistency using ACID transactions for critical operations[^1]

**API Endpoints**:

```
GET  /api/v1/inventory/check?sku=ABC123&quantity=5
POST /api/v1/inventory/adjust
GET  /api/v1/inventory/warehouses/:warehouseId/stock
POST /api/v1/inventory/bulk-update
GET  /api/v1/inventory/low-stock
```


### **2. Reservation Service**

- **Responsibilities**: Temporary stock holds during checkout, prevent overselling[^5] [^3]
- **Locking Strategies**:
    - **Pessimistic Locking**: Lock inventory rows during reservation (for high-value items)[^3] [^5]
    - **Optimistic Locking**: Version-based concurrency control (for most products)[^6] [^5] [^3]
- **Features**:
    - Temporary reservations with TTL (10 minutes default)
    - Automatic expiration and release of expired reservations
    - Reservation extension for authenticated users
    - Batch reservation for multi-item orders
- **Implementation**: Redis for fast reservation tracking with TTL[^3]


### **3. Warehouse Service**

- **Responsibilities**: Multi-warehouse inventory distribution, inter-warehouse transfers[^1]
- **Features**:
    - Warehouse-specific stock tracking
    - Geographic routing (nearest warehouse selection)
    - Transfer order management
    - Warehouse capacity planning
    - Regional fulfillment optimization


### **4. Order Integration Service**

- **Responsibilities**: Bridge between order processing and inventory[^1]
- **Workflow**:
    - Receive order placement events
    - Reserve inventory atomically
    - Commit or rollback based on payment status
    - Handle order cancellations and refunds
- **Pattern**: Saga pattern for distributed transactions[^1]


### **5. Database Layer**

- **Primary DB**: PostgreSQL with ACID guarantees for strong consistency[^1]
- **Read Replicas**: 3-5 replicas for scaling read operations[^7] [^1]
- **Partitioning**: Shard by warehouse_id or product_category[^7] [^1]
- **Replication**: Multi-master replication across regions for disaster recovery[^2] [^7]


### **6. Cache Layer (Redis Cluster)**

- **Purpose**: Ultra-fast availability checks and hot SKU caching[^1]
- **Cached Data**:
    - Available stock for top 10% SKUs (1-5 min TTL)
    - Active reservations (real-time)
    - Warehouse locations and capacities
- **Eviction**: LRU policy with write-through for critical updates
- **Performance**: <10ms cache response time[^1]


### **7. Event Streaming (Kafka)**

- **Purpose**: Real-time inventory event processing, audit trail[^1]
- **Topics**:
    - `inventory.stock.updated` - Stock level changes
    - `inventory.reserved` - Reservation events
    - `inventory.released` - Release events
    - `inventory.low.stock` - Alert triggers
- **Consumers**: Analytics, notifications, reporting services


### **8. Background Job Scheduler**

- **Jobs**:
    - **Reservation Cleanup**: Expire and release reservations every 1 minute
    - **Stock Reconciliation**: Daily audit between warehouses and DB
    - **Low Stock Alerts**: Check thresholds every 5 minutes
    - **Demand Forecasting**: ML-based prediction for replenishment

***

## Key Workflows

### **Workflow 1: Stock Availability Check**

```
1. User views product → Frontend requests availability
2. API Gateway → Inventory Service
3. Check Redis cache for SKU availability
4. Cache HIT → Return cached stock count (<10ms)
5. Cache MISS → Query database (with read replica)
6. Aggregate stock across warehouses
7. Update cache with result (TTL: 5 min)
8. Return availability to user
```

**Performance**: 95% cache hit rate, <100ms p99 latency[^1]

### **Workflow 2: Order Placement with Reservation (Optimistic Locking)**

```
1. User adds to cart → Proceeds to checkout
2. Order Service → Reservation Service
3. Check availability: SELECT available_quantity, version 
   FROM Inventory WHERE product_id = ? AND warehouse_id = ?
4. If available_quantity >= requested_quantity:
   a. Create reservation record in Redis (TTL: 10 min)
   b. UPDATE Inventory SET 
      available_quantity = available_quantity - ?,
      reserved_quantity = reserved_quantity + ?,
      version = version + 1
      WHERE product_id = ? AND version = ?
   c. If UPDATE affected_rows = 0 → VERSION CONFLICT → Retry
5. Return reservation_id to Order Service
6. User completes payment (or times out)
7a. Payment Success → Commit reservation
    - UPDATE Inventory SET reserved_quantity = reserved_quantity - ?
    - Publish event: inventory.committed
7b. Payment Failure/Timeout → Release reservation
    - UPDATE Inventory SET 
      available_quantity = available_quantity + ?,
      reserved_quantity = reserved_quantity - ?
    - Delete Redis reservation
    - Publish event: inventory.released
```

**Concurrency Control**: Optimistic locking with version field prevents overselling[^6] [^3]

### **Workflow 3: Order Cancellation**

```
1. User cancels order → Order Service
2. Order Service → Inventory Service
3. Validate order status (must be before shipment)
4. Begin transaction:
   a. UPDATE Inventory SET 
      available_quantity = available_quantity + cancelled_quantity
      WHERE product_id = ? AND warehouse_id = ?
   b. INSERT INTO InventoryTransactions 
      (type='REFUND', quantity, reference_order_id)
   c. Commit transaction
5. Publish event: inventory.refunded
6. Update cache: INCR stock count in Redis
7. Notify Warehouse Service for restocking
```

**Atomicity**: All-or-nothing with database transactions[^1]

### **Workflow 4: Multi-Warehouse Stock Allocation**

```
1. Order requires 10 units of SKU-123
2. Query warehouse stock availability:
   SELECT warehouse_id, available_quantity, distance
   FROM Inventory
   WHERE product_id = 'SKU-123' 
   AND available_quantity > 0
   ORDER BY distance ASC
3. Allocate inventory greedily:
   - Warehouse A (nearest): 7 units available → Reserve 7
   - Warehouse B: 5 units available → Reserve 3 (remaining needed)
4. Create split shipment with tracking per warehouse
5. Deduct stock atomically from both warehouses
```

**Optimization**: Minimize shipping cost by preferring nearest warehouses

### **Workflow 5: Reservation Expiration (Background Job)**

```
Every 1 minute:
1. Scan Redis for expired reservations (TTL expired)
2. Batch process expired reservations (up to 1000 at a time)
3. For each expired reservation:
   a. UPDATE Inventory SET
      available_quantity = available_quantity + reservation_quantity,
      reserved_quantity = reserved_quantity - reservation_quantity
   b. Delete reservation from Redis
   c. Log expiration event
4. Publish events: inventory.reservation.expired
```

**Efficiency**: Batch processing reduces database load[^1]

***

## Database Schema Design

### **Products Table**

```sql
CREATE TABLE Products (
    ProductID BIGINT PRIMARY KEY AUTO_INCREMENT,
    SKU VARCHAR(100) UNIQUE NOT NULL,
    ProductName VARCHAR(255) NOT NULL,
    CategoryID BIGINT,
    BrandID BIGINT,
    UnitPrice DECIMAL(10, 2) NOT NULL,
    Weight DECIMAL(8, 2) COMMENT 'In kg',
    Dimensions JSON COMMENT '{"length": 10, "width": 20, "height": 5}',
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sku (SKU),
    INDEX idx_category (CategoryID),
    INDEX idx_active (IsActive)
);
```


### **Warehouses Table**

```sql
CREATE TABLE Warehouses (
    WarehouseID BIGINT PRIMARY KEY AUTO_INCREMENT,
    WarehouseCode VARCHAR(20) UNIQUE NOT NULL,
    WarehouseName VARCHAR(100) NOT NULL,
    Location VARCHAR(255) NOT NULL,
    City VARCHAR(100) NOT NULL,
    State VARCHAR(100),
    Country VARCHAR(100) NOT NULL,
    PostalCode VARCHAR(20),
    Latitude DECIMAL(10, 8),
    Longitude DECIMAL(11, 8),
    TotalCapacity INT COMMENT 'Max items',
    CurrentOccupancy INT DEFAULT 0,
    Status ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE') DEFAULT 'ACTIVE',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_location (City, Country),
    INDEX idx_status (Status)
);
```


### **Inventory Table (Core)**

```sql
CREATE TABLE Inventory (
    InventoryID BIGINT PRIMARY KEY AUTO_INCREMENT,
    ProductID BIGINT NOT NULL,
    WarehouseID BIGINT NOT NULL,
    
    -- Stock tracking
    AvailableQuantity INT NOT NULL DEFAULT 0 COMMENT 'Ready to sell',
    ReservedQuantity INT NOT NULL DEFAULT 0 COMMENT 'Temporarily held',
    DamagedQuantity INT DEFAULT 0 COMMENT 'Damaged/defective',
    InTransitQuantity INT DEFAULT 0 COMMENT 'Being transferred',
    
    -- Computed total
    TotalQuantity INT GENERATED ALWAYS AS 
        (AvailableQuantity + ReservedQuantity + DamagedQuantity + InTransitQuantity) STORED,
    
    -- Thresholds
    LowStockThreshold INT DEFAULT 10,
    ReorderPoint INT DEFAULT 20,
    MaxStockLevel INT COMMENT 'Warehouse capacity limit',
    
    -- Optimistic locking
    Version INT DEFAULT 1 COMMENT 'For concurrency control',
    
    -- Timestamps
    LastRestockedAt TIMESTAMP,
    LastSoldAt TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
    FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID) ON DELETE CASCADE,
    
    UNIQUE KEY unique_product_warehouse (ProductID, WarehouseID),
    INDEX idx_product (ProductID),
    INDEX idx_warehouse (WarehouseID),
    INDEX idx_available (AvailableQuantity),
    INDEX idx_low_stock (ProductID, AvailableQuantity),
    
    CHECK (AvailableQuantity >= 0),
    CHECK (ReservedQuantity >= 0),
    CHECK (DamagedQuantity >= 0),
    CHECK (InTransitQuantity >= 0)
);
```


### **Inventory Transactions (Audit Log)**

```sql
CREATE TABLE InventoryTransactions (
    TransactionID BIGINT PRIMARY KEY AUTO_INCREMENT,
    TransactionUUID VARCHAR(36) UNIQUE NOT NULL COMMENT 'Idempotency key',
    ProductID BIGINT NOT NULL,
    WarehouseID BIGINT NOT NULL,
    
    TransactionType ENUM('RESTOCK', 'SALE', 'RESERVATION', 'RELEASE', 'REFUND', 
                         'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT', 'DAMAGE') NOT NULL,
    
    QuantityChange INT NOT NULL COMMENT 'Positive for additions, negative for deductions',
    QuantityBefore INT NOT NULL,
    QuantityAfter INT NOT NULL,
    
    -- Reference to external entities
    OrderID BIGINT COMMENT 'If related to order',
    ReservationID VARCHAR(100) COMMENT 'If related to reservation',
    TransferID BIGINT COMMENT 'If inter-warehouse transfer',
    
    -- Metadata
    PerformedBy VARCHAR(100) COMMENT 'User or system',
    Reason TEXT,
    Metadata JSON COMMENT 'Additional context',
    
    TransactionDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
    FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID) ON DELETE CASCADE,
    
    INDEX idx_product (ProductID, TransactionDate DESC),
    INDEX idx_warehouse (WarehouseID, TransactionDate DESC),
    INDEX idx_order (OrderID),
    INDEX idx_type (TransactionType, TransactionDate),
    INDEX idx_uuid (TransactionUUID)
);
```


### **Reservations Table**

```sql
CREATE TABLE Reservations (
    ReservationID BIGINT PRIMARY KEY AUTO_INCREMENT,
    ReservationUUID VARCHAR(36) UNIQUE NOT NULL,
    ProductID BIGINT NOT NULL,
    WarehouseID BIGINT NOT NULL,
    OrderID BIGINT COMMENT 'Reference to order',
    UserID BIGINT,
    
    QuantityReserved INT NOT NULL,
    Status ENUM('ACTIVE', 'COMMITTED', 'RELEASED', 'EXPIRED') DEFAULT 'ACTIVE',
    
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ExpiresAt TIMESTAMP NOT NULL COMMENT 'Auto-release after expiry',
    CommittedAt TIMESTAMP,
    ReleasedAt TIMESTAMP,
    
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
    FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID) ON DELETE CASCADE,
    
    INDEX idx_product_warehouse (ProductID, WarehouseID),
    INDEX idx_status_expiry (Status, ExpiresAt),
    INDEX idx_order (OrderID),
    INDEX idx_uuid (ReservationUUID),
    
    CHECK (QuantityReserved > 0)
);
```


### **Warehouse Transfers Table**

```sql
CREATE TABLE WarehouseTransfers (
    TransferID BIGINT PRIMARY KEY AUTO_INCREMENT,
    ProductID BIGINT NOT NULL,
    SourceWarehouseID BIGINT NOT NULL,
    DestinationWarehouseID BIGINT NOT NULL,
    
    Quantity INT NOT NULL,
    TransferStatus ENUM('INITIATED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED') DEFAULT 'INITIATED',
    
    InitiatedBy VARCHAR(100),
    InitiatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ShippedAt TIMESTAMP,
    ReceivedAt TIMESTAMP,
    
    TrackingNumber VARCHAR(100),
    ShippingCost DECIMAL(10, 2),
    Notes TEXT,
    
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
    FOREIGN KEY (SourceWarehouseID) REFERENCES Warehouses(WarehouseID) ON DELETE CASCADE,
    FOREIGN KEY (DestinationWarehouseID) REFERENCES Warehouses(WarehouseID) ON DELETE CASCADE,
    
    INDEX idx_product (ProductID),
    INDEX idx_source (SourceWarehouseID, TransferStatus),
    INDEX idx_destination (DestinationWarehouseID, TransferStatus),
    INDEX idx_status (TransferStatus, InitiatedAt),
    
    CHECK (SourceWarehouseID != DestinationWarehouseID),
    CHECK (Quantity > 0)
);
```


### **Low Stock Alerts Table**

```sql
CREATE TABLE LowStockAlerts (
    AlertID BIGINT PRIMARY KEY AUTO_INCREMENT,
    ProductID BIGINT NOT NULL,
    WarehouseID BIGINT NOT NULL,
    CurrentQuantity INT NOT NULL,
    ThresholdQuantity INT NOT NULL,
    AlertStatus ENUM('TRIGGERED', 'ACKNOWLEDGED', 'RESOLVED') DEFAULT 'TRIGGERED',
    
    TriggeredAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    AcknowledgedAt TIMESTAMP,
    AcknowledgedBy VARCHAR(100),
    ResolvedAt TIMESTAMP,
    
    NotificationsSent INT DEFAULT 0,
    LastNotificationAt TIMESTAMP,
    
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
    FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID) ON DELETE CASCADE,
    
    INDEX idx_status (AlertStatus, TriggeredAt),
    INDEX idx_product_warehouse (ProductID, WarehouseID)
);
```


***

## Low-Level Design (LLD) - TypeScript

### **Domain Models**

```typescript
// Enums
enum TransactionType {
  RESTOCK = 'RESTOCK',
  SALE = 'SALE',
  RESERVATION = 'RESERVATION',
  RELEASE = 'RELEASE',
  REFUND = 'REFUND',
  TRANSFER_OUT = 'TRANSFER_OUT',
  TRANSFER_IN = 'TRANSFER_IN',
  ADJUSTMENT = 'ADJUSTMENT',
  DAMAGE = 'DAMAGE'
}

enum ReservationStatus {
  ACTIVE = 'ACTIVE',
  COMMITTED = 'COMMITTED',
  RELEASED = 'RELEASED',
  EXPIRED = 'EXPIRED'
}

enum WarehouseStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE'
}

// Interfaces
interface StockLevel {
  availableQuantity: number;
  reservedQuantity: number;
  damagedQuantity: number;
  inTransitQuantity: number;
  totalQuantity: number;
}

interface ReservationRequest {
  productId: string;
  warehouseId: string;
  quantity: number;
  orderId?: string;
  userId?: string;
  ttlMinutes?: number;
}

interface ReservationResult {
  reservationId: string;
  status: ReservationStatus;
  expiresAt: Date;
  allocations: Array<{
    warehouseId: string;
    quantity: number;
  }>;
}

interface AvailabilityCheck {
  productId: string;
  requestedQuantity: number;
  isAvailable: boolean;
  availableQuantity: number;
  warehouses: Array<{
    warehouseId: string;
    warehouseName: string;
    availableQuantity: number;
    distance?: number;
  }>;
}
```


### **Inventory Stock Entity**

```typescript
class InventoryStock {
  readonly inventoryId: string;
  private productId: string;
  private warehouseId: string;
  
  // Stock tracking
  private availableQuantity: number;
  private reservedQuantity: number;
  private damagedQuantity: number;
  private inTransitQuantity: number;
  
  // Thresholds
  private lowStockThreshold: number;
  private reorderPoint: number;
  private maxStockLevel: number;
  
  // Optimistic locking
  private version: number;
  
  private lastRestockedAt: Date | null;
  private lastSoldAt: Date | null;
  private updatedAt: Date;

  constructor(
    productId: string,
    warehouseId: string,
    initialQuantity: number = 0,
    lowStockThreshold: number = 10,
    reorderPoint: number = 20
  ) {
    this.inventoryId = this.generateInventoryId();
    this.productId = productId;
    this.warehouseId = warehouseId;
    this.availableQuantity = initialQuantity;
    this.reservedQuantity = 0;
    this.damagedQuantity = 0;
    this.inTransitQuantity = 0;
    this.lowStockThreshold = lowStockThreshold;
    this.reorderPoint = reorderPoint;
    this.maxStockLevel = 10000; // Default max
    this.version = 1;
    this.lastRestockedAt = initialQuantity > 0 ? new Date() : null;
    this.lastSoldAt = null;
    this.updatedAt = new Date();
  }

  private generateInventoryId(): string {
    return `INV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Reserve stock (optimistic locking)
  reserve(quantity: number, currentVersion: number): void {
    if (this.version !== currentVersion) {
      throw new Error('Version conflict: inventory was modified by another transaction');
    }

    if (quantity <= 0) {
      throw new Error('Reservation quantity must be positive');
    }

    if (this.availableQuantity < quantity) {
      throw new Error(
        `Insufficient stock: available=${this.availableQuantity}, requested=${quantity}`
      );
    }

    this.availableQuantity -= quantity;
    this.reservedQuantity += quantity;
    this.version++;
    this.updatedAt = new Date();
  }

  // Release reserved stock
  release(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Release quantity must be positive');
    }

    if (this.reservedQuantity < quantity) {
      throw new Error(
        `Cannot release more than reserved: reserved=${this.reservedQuantity}, requested=${quantity}`
      );
    }

    this.reservedQuantity -= quantity;
    this.availableQuantity += quantity;
    this.version++;
    this.updatedAt = new Date();
  }

  // Commit reservation (convert reserved to sold)
  commitReservation(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Commit quantity must be positive');
    }

    if (this.reservedQuantity < quantity) {
      throw new Error(
        `Cannot commit more than reserved: reserved=${this.reservedQuantity}, requested=${quantity}`
      );
    }

    this.reservedQuantity -= quantity;
    this.lastSoldAt = new Date();
    this.version++;
    this.updatedAt = new Date();
  }

  // Restock inventory
  restock(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Restock quantity must be positive');
    }

    const newTotal = this.getTotalQuantity() + quantity;
    if (newTotal > this.maxStockLevel) {
      throw new Error(
        `Restock would exceed max capacity: current=${this.getTotalQuantity()}, adding=${quantity}, max=${this.maxStockLevel}`
      );
    }

    this.availableQuantity += quantity;
    this.lastRestockedAt = new Date();
    this.version++;
    this.updatedAt = new Date();
  }

  // Adjust stock (for corrections, damage, etc.)
  adjust(quantityChange: number, reason: string): void {
    if (quantityChange === 0) {
      return;
    }

    const newAvailable = this.availableQuantity + quantityChange;
    if (newAvailable < 0) {
      throw new Error(
        `Adjustment would result in negative stock: current=${this.availableQuantity}, change=${quantityChange}`
      );
    }

    this.availableQuantity = newAvailable;
    this.version++;
    this.updatedAt = new Date();
  }

  // Mark stock as damaged
  markDamaged(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Damage quantity must be positive');
    }

    if (this.availableQuantity < quantity) {
      throw new Error('Cannot damage more than available stock');
    }

    this.availableQuantity -= quantity;
    this.damagedQuantity += quantity;
    this.version++;
    this.updatedAt = new Date();
  }

  // Check if low stock alert should trigger
  isLowStock(): boolean {
    return this.availableQuantity <= this.lowStockThreshold;
  }

  // Check if reorder needed
  needsReorder(): boolean {
    return this.availableQuantity <= this.reorderPoint;
  }

  // Get total quantity across all states
  getTotalQuantity(): number {
    return this.availableQuantity + this.reservedQuantity + 
           this.damagedQuantity + this.inTransitQuantity;
  }

  // Getters
  getInventoryId(): string { return this.inventoryId; }
  getProductId(): string { return this.productId; }
  getWarehouseId(): string { return this.warehouseId; }
  getAvailableQuantity(): number { return this.availableQuantity; }
  getReservedQuantity(): number { return this.reservedQuantity; }
  getDamagedQuantity(): number { return this.damagedQuantity; }
  getInTransitQuantity(): number { return this.inTransitQuantity; }
  getVersion(): number { return this.version; }

  getStockLevel(): StockLevel {
    return {
      availableQuantity: this.availableQuantity,
      reservedQuantity: this.reservedQuantity,
      damagedQuantity: this.damagedQuantity,
      inTransitQuantity: this.inTransitQuantity,
      totalQuantity: this.getTotalQuantity()
    };
  }

  toJSON(): object {
    return {
      inventoryId: this.inventoryId,
      productId: this.productId,
      warehouseId: this.warehouseId,
      availableQuantity: this.availableQuantity,
      reservedQuantity: this.reservedQuantity,
      damagedQuantity: this.damagedQuantity,
      inTransitQuantity: this.inTransitQuantity,
      totalQuantity: this.getTotalQuantity(),
      lowStockThreshold: this.lowStockThreshold,
      reorderPoint: this.reorderPoint,
      version: this.version,
      lastRestockedAt: this.lastRestockedAt,
      lastSoldAt: this.lastSoldAt,
      updatedAt: this.updatedAt
    };
  }
}
```


### **Reservation Entity**

```typescript
class Reservation {
  readonly reservationId: string;
  readonly reservationUUID: string;
  private productId: string;
  private warehouseId: string;
  private orderId: string | null;
  private userId: string | null;
  private quantityReserved: number;
  private status: ReservationStatus;
  private createdAt: Date;
  private expiresAt: Date;
  private committedAt: Date | null;
  private releasedAt: Date | null;

  constructor(
    productId: string,
    warehouseId: string,
    quantityReserved: number,
    ttlMinutes: number = 10,
    orderId?: string,
    userId?: string
  ) {
    this.reservationId = this.generateReservationId();
    this.reservationUUID = this.generateUUID();
    this.productId = productId;
    this.warehouseId = warehouseId;
    this.quantityReserved = quantityReserved;
    this.status = ReservationStatus.ACTIVE;
    this.orderId = orderId || null;
    this.userId = userId || null;
    this.createdAt = new Date();
    this.expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    this.committedAt = null;
    this.releasedAt = null;
  }

  private generateReservationId(): string {
    return `RES_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateUUID(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 16)}`;
  }

  // Commit reservation (order paid)
  commit(): void {
    if (this.status !== ReservationStatus.ACTIVE) {
      throw new Error(`Cannot commit reservation with status: ${this.status}`);
    }

    if (this.isExpired()) {
      throw new Error('Cannot commit expired reservation');
    }

    this.status = ReservationStatus.COMMITTED;
    this.committedAt = new Date();
  }

  // Release reservation (order cancelled/timeout)
  release(): void {
    if (this.status === ReservationStatus.COMMITTED) {
      throw new Error('Cannot release committed reservation');
    }

    this.status = ReservationStatus.RELEASED;
    this.releasedAt = new Date();
  }

  // Mark as expired
  expire(): void {
    if (this.status !== ReservationStatus.ACTIVE) {
      return;
    }

    this.status = ReservationStatus.EXPIRED;
    this.releasedAt = new Date();
  }

  // Check if expired
  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  // Extend expiration
  extend(additionalMinutes: number): void {
    if (this.status !== ReservationStatus.ACTIVE) {
      throw new Error('Can only extend active reservations');
    }

    this.expiresAt = new Date(this.expiresAt.getTime() + additionalMinutes * 60 * 1000);
  }

  // Getters
  getReservationId(): string { return this.reservationId; }
  getReservationUUID(): string { return this.reservationUUID; }
  getProductId(): string { return this.productId; }
  getWarehouseId(): string { return this.warehouseId; }
  getQuantityReserved(): number { return this.quantityReserved; }
  getStatus(): ReservationStatus { return this.status; }
  getExpiresAt(): Date { return this.expiresAt; }
  getOrderId(): string | null { return this.orderId; }

  toJSON(): object {
    return {
      reservationId: this.reservationId,
      reservationUUID: this.reservationUUID,
      productId: this.productId,
      warehouseId: this.warehouseId,
      quantityReserved: this.quantityReserved,
      status: this.status,
      orderId: this.orderId,
      userId: this.userId,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
      committedAt: this.committedAt,
      releasedAt: this.releasedAt
    };
  }
}
```


### **Inventory Service (Main Orchestrator)**

```typescript
interface IInventoryRepository {
  findByProductAndWarehouse(productId: string, warehouseId: string): Promise<InventoryStock | null>;
  findByProduct(productId: string): Promise<InventoryStock[]>;
  save(inventory: InventoryStock): Promise<void>;
  update(inventory: InventoryStock): Promise<void>;
  updateWithVersion(inventory: InventoryStock, expectedVersion: number): Promise<boolean>;
}

interface IReservationRepository {
  save(reservation: Reservation): Promise<void>;
  findById(reservationId: string): Promise<Reservation | null>;
  findByUUID(uuid: string): Promise<Reservation | null>;
  findExpired(limit: number): Promise<Reservation[]>;
  update(reservation: Reservation): Promise<void>;
}

interface ITransactionLogger {
  log(transaction: {
    productId: string;
    warehouseId: string;
    type: TransactionType;
    quantityChange: number;
    quantityBefore: number;
    quantityAfter: number;
    metadata?: any;
  }): Promise<void>;
}

interface ICache {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl: number): Promise<void>;
  delete(key: string): Promise<void>;
  increment(key: string, amount: number): Promise<number>;
  decrement(key: string, amount: number): Promise<number>;
}

interface IEventPublisher {
  publish(topic: string, event: any): Promise<void>;
}

class InventoryService {
  constructor(
    private inventoryRepository: IInventoryRepository,
    private reservationRepository: IReservationRepository,
    private transactionLogger: ITransactionLogger,
    private cache: ICache,
    private eventPublisher: IEventPublisher
  ) {}

  // Check availability (cache-first)
  async checkAvailability(productId: string, requestedQuantity: number): Promise<AvailabilityCheck> {
    const cacheKey = `availability:${productId}`;
    
    // Try cache first
    let cachedAvailability = await this.cache.get(cacheKey);
    if (cachedAvailability && cachedAvailability.timestamp > Date.now() - 60000) { // 1 min cache
      return cachedAvailability.data;
    }

    // Query all warehouses for this product
    const inventoryRecords = await this.inventoryRepository.findByProduct(productId);
    
    if (inventoryRecords.length === 0) {
      return {
        productId,
        requestedQuantity,
        isAvailable: false,
        availableQuantity: 0,
        warehouses: []
      };
    }

    // Aggregate availability across warehouses
    let totalAvailable = 0;
    const warehouses = inventoryRecords.map(inv => {
      totalAvailable += inv.getAvailableQuantity();
      return {
        warehouseId: inv.getWarehouseId(),
        warehouseName: `Warehouse ${inv.getWarehouseId()}`, // Should fetch from warehouse service
        availableQuantity: inv.getAvailableQuantity()
      };
    }).filter(w => w.availableQuantity > 0);

    const result: AvailabilityCheck = {
      productId,
      requestedQuantity,
      isAvailable: totalAvailable >= requestedQuantity,
      availableQuantity: totalAvailable,
      warehouses
    };

    // Cache result
    await this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    }, 60); // 60 seconds TTL

    return result;
  }

  // Reserve inventory (with optimistic locking and retry)
  async reserveInventory(request: ReservationRequest): Promise<ReservationResult> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        return await this.attemptReservation(request);
      } catch (error: any) {
        if (error.message.includes('Version conflict') && attempt < maxRetries - 1) {
          attempt++;
          await this.sleep(100 * Math.pow(2, attempt)); // Exponential backoff
          continue;
        }
        throw error;
      }
    }

    throw new Error('Failed to reserve inventory after maximum retries');
  }

  private async attemptReservation(request: ReservationRequest): Promise<ReservationResult> {
    const { productId, quantity, orderId, userId, ttlMinutes = 10 } = request;

    // Check availability across warehouses
    const inventoryRecords = await this.inventoryRepository.findByProduct(productId);
    
    if (inventoryRecords.length === 0) {
      throw new Error('Product not found in any warehouse');
    }

    // Sort by available quantity (descending)
    inventoryRecords.sort((a, b) => b.getAvailableQuantity() - a.getAvailableQuantity());

    // Allocate inventory across warehouses
    let remainingQuantity = quantity;
    const allocations: Array<{ warehouseId: string; quantity: number; inventory: InventoryStock }> = [];

    for (const inventory of inventoryRecords) {
      if (remainingQuantity <= 0) break;

      const availableInWarehouse = inventory.getAvailableQuantity();
      if (availableInWarehouse > 0) {
        const allocatedQuantity = Math.min(availableInWarehouse, remainingQuantity);
        allocations.push({
          warehouseId: inventory.getWarehouseId(),
          quantity: allocatedQuantity,
          inventory
        });
        remainingQuantity -= allocatedQuantity;
      }
    }

    if (remainingQuantity > 0) {
      throw new Error(
        `Insufficient inventory: requested=${quantity}, available=${quantity - remainingQuantity}`
      );
    }

    // Create reservations and update inventory atomically
    const reservations: Reservation[] = [];
    
    for (const allocation of allocations) {
      const { warehouseId, quantity: allocatedQty, inventory } = allocation;
      const currentVersion = inventory.getVersion();

      // Reserve stock with optimistic locking
      inventory.reserve(allocatedQty, currentVersion);

      // Update database with version check
      const updated = await this.inventoryRepository.updateWithVersion(inventory, currentVersion);
      
      if (!updated) {
        // Version conflict - rollback and retry
        throw new Error('Version conflict: inventory was modified by another transaction');
      }

      // Create reservation record
      const reservation = new Reservation(
        productId,
        warehouseId,
        allocatedQty,
        ttlMinutes,
        orderId,
        userId
      );
      await this.reservationRepository.save(reservation);
      reservations.push(reservation);

      // Log transaction
      await this.transactionLogger.log({
        productId,
        warehouseId,
        type: TransactionType.RESERVATION,
        quantityChange: -allocatedQty,
        quantityBefore: inventory.getAvailableQuantity() + allocatedQty,
        quantityAfter: inventory.getAvailableQuantity(),
        metadata: { reservationId: reservation.getReservationId(), orderId }
      });
    }

    // Invalidate cache
    await this.cache.delete(`availability:${productId}`);

    // Publish event
    await this.eventPublisher.publish('inventory.reserved', {
      productId,
      quantity,
      orderId,
      allocations: allocations.map(a => ({
        warehouseId: a.warehouseId,
        quantity: a.quantity
      })),
      timestamp: Date.now()
    });

    return {
      reservationId: reservations[^0].getReservationId(),
      status: ReservationStatus.ACTIVE,
      expiresAt: reservations[^0].getExpiresAt(),
      allocations: allocations.map(a => ({
        warehouseId: a.warehouseId,
        quantity: a.quantity
      }))
    };
  }

  // Commit reservation (order paid)
  async commitReservation(reservationUUID: string): Promise<void> {
    const reservation = await this.reservationRepository.findByUUID(reservationUUID);
    
    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (reservation.getStatus() !== ReservationStatus.ACTIVE) {
      throw new Error(`Cannot commit reservation with status: ${reservation.getStatus()}`);
    }

    // Update inventory
    const inventory = await this.inventoryRepository.findByProductAndWarehouse(
      reservation.getProductId(),
      reservation.getWarehouseId()
    );

    if (!inventory) {
      throw new Error('Inventory record not found');
    }

    inventory.commitReservation(reservation.getQuantityReserved());
    await this.inventoryRepository.update(inventory);

    // Update reservation status
    reservation.commit();
    await this.reservationRepository.update(reservation);

    // Log transaction
    await this.transactionLogger.log({
      productId: reservation.getProductId(),
      warehouseId: reservation.getWarehouseId(),
      type: TransactionType.SALE,
      quantityChange: -reservation.getQuantityReserved(),
      quantityBefore: inventory.getReservedQuantity() + reservation.getQuantityReserved(),
      quantityAfter: inventory.getReservedQuantity(),
      metadata: { reservationId: reservation.getReservationId(), orderId: reservation.getOrderId() }
    });

    // Invalidate cache
    await this.cache.delete(`availability:${reservation.getProductId()}`);

    // Publish event
    await this.eventPublisher.publish('inventory.committed', {
      productId: reservation.getProductId(),
      warehouseId: reservation.getWarehouseId(),
      quantity: reservation.getQuantityReserved(),
      reservationId: reservation.getReservationId(),
      timestamp: Date.now()
    });
  }

  // Release reservation (order cancelled/timeout)
  async releaseReservation(reservationUUID: string): Promise<void> {
    const reservation = await this.reservationRepository.findByUUID(reservationUUID);
    
    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (reservation.getStatus() === ReservationStatus.COMMITTED) {
      throw new Error('Cannot release committed reservation');
    }

    if (reservation.getStatus() === ReservationStatus.RELEASED) {
      return; // Already released
    }

    // Update inventory
    const inventory = await this.inventoryRepository.findByProductAndWarehouse(
      reservation.getProductId(),
      reservation.getWarehouseId()
    );

    if (!inventory) {
      throw new Error('Inventory record not found');
    }

    inventory.release(reservation.getQuantityReserved());
    await this.inventoryRepository.update(inventory);

    // Update reservation status
    reservation.release();
    await this.reservationRepository.update(reservation);

    // Log transaction
    await this.transactionLogger.log({
      productId: reservation.getProductId(),
      warehouseId: reservation.getWarehouseId(),
      type: TransactionType.RELEASE,
      quantityChange: reservation.getQuantityReserved(),
      quantityBefore: inventory.getAvailableQuantity() - reservation.getQuantityReserved(),
      quantityAfter: inventory.getAvailableQuantity(),
      metadata: { reservationId: reservation.getReservationId() }
    });

    // Invalidate cache
    await this.cache.delete(`availability:${reservation.getProductId()}`);

    // Publish event
    await this.eventPublisher.publish('inventory.released', {
      productId: reservation.getProductId(),
      warehouseId: reservation.getWarehouseId(),
      quantity: reservation.getQuantityReserved(),
      reservationId: reservation.getReservationId(),
      timestamp: Date.now()
    });
  }

  // Process expired reservations (background job)
  async processExpiredReservations(): Promise<number> {
    const expiredReservations = await this.reservationRepository.findExpired(1000);
    let processedCount = 0;

    for (const reservation of expiredReservations) {
      try {
        await this.releaseReservation(reservation.getReservationUUID());
        processedCount++;
      } catch (error) {
        console.error(`Failed to release expired reservation ${reservation.getReservationId()}:`, error);
      }
    }

    return processedCount;
  }

  // Refund inventory (order cancelled after commit)
  async refundInventory(productId: string, warehouseId: string, quantity: number, orderId: string): Promise<void> {
    const inventory = await this.inventoryRepository.findByProductAndWarehouse(productId, warehouseId);
    
    if (!inventory) {
      throw new Error('Inventory record not found');
    }

    const quantityBefore = inventory.getAvailableQuantity();
    inventory.adjust(quantity, `Refund for order ${orderId}`);
    await this.inventoryRepository.update(inventory);

    // Log transaction
    await this.transactionLogger.log({
      productId,
      warehouseId,
      type: TransactionType.REFUND,
      quantityChange: quantity,
      quantityBefore,
      quantityAfter: inventory.getAvailableQuantity(),
      metadata: { orderId }
    });

    // Invalidate cache
    await this.cache.delete(`availability:${productId}`);

    // Publish event
    await this.eventPublisher.publish('inventory.refunded', {
      productId,
      warehouseId,
      quantity,
      orderId,
      timestamp: Date.now()
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```


### **Usage Example**

```typescript
// Initialize services
const inventoryRepository: IInventoryRepository = new InventoryRepositoryImpl();
const reservationRepository: IReservationRepository = new ReservationRepositoryImpl();
const transactionLogger: ITransactionLogger = new TransactionLoggerImpl();
const cache: ICache = new RedisCache();
const eventPublisher: IEventPublisher = new KafkaEventPublisher();

const inventoryService = new InventoryService(
  inventoryRepository,
  reservationRepository,
  transactionLogger,
  cache,
  eventPublisher
);

// Check availability
const availability = await inventoryService.checkAvailability('PROD-123', 5);
console.log('Available:', availability.isAvailable);
console.log('Total stock:', availability.availableQuantity);

// Reserve inventory for order
const reservation = await inventoryService.reserveInventory({
  productId: 'PROD-123',
  warehouseId: 'WH-001',
  quantity: 2,
  orderId: 'ORD-456',
  userId: 'USER-789',
  ttlMinutes: 10
});
console.log('Reservation ID:', reservation.reservationId);
console.log('Expires at:', reservation.expiresAt);

// Commit reservation (payment successful)
await inventoryService.commitReservation(reservation.reservationId);
console.log('Reservation committed');

// Or release reservation (payment failed)
// await inventoryService.releaseReservation(reservation.reservationId);

// Process expired reservations (background job)
const processedCount = await inventoryService.processExpiredReservations();
console.log(`Processed ${processedCount} expired reservations`);
```


## Key Design Patterns \& Techniques

1. **Optimistic Concurrency Control**: Version-based conflict detection prevents overselling[^5] [^3] [^6]
2. **Pessimistic Locking**: Optional row-level locking for high-value items[^5] [^3]
3. **Reservation Pattern**: Temporary holds with automatic expiration[^3]
4. **Event Sourcing**: Complete audit trail via transaction log[^1]
5. **Cache-Aside Pattern**: Redis caching for hot SKUs[^1]
6. **Retry with Exponential Backoff**: Handle transient conflicts[^1]
7. **CQRS**: Separate read/write paths for scalability[^1]
8. **Saga Pattern**: Distributed transaction management for order processing[^1]

This design ensures **strong consistency**, prevents overselling, and achieves **<100ms** availability checks while handling **100k+ transactions per minute**.[^2] [^4] [^1]
<span style="display:none">[^10] [^8] [^9]</span>

<div align="center">⁂</div>

[^1]: https://www.systemdesignhandbook.com/guides/design-inventory-management-system/

[^2]: https://www.cockroachlabs.com/blog/inventory-management-reference-architecture/

[^3]: https://dzone.com/articles/navigating-concurrency-optimistic-vs-pessimistic-c?fromrel=true

[^4]: https://enginebogie.com/public/question/high-level-design-design-inventory-management-system/1178

[^5]: https://www.youtube.com/watch?v=4Td1ViGU5LA

[^6]: https://vivekbansal.substack.com/p/optimistic-vs-pessimistic

[^7]: https://codemia.io/system-design/design-an-inventory-management-system/solutions/scqt0z/Design-an-Inventory-Management-System-with-Score-910

[^8]: https://www.youtube.com/watch?v=T-9s9U28KJM

[^9]: https://binmile.com/blog/inventory-management-system-design/

[^10]: https://bytebytego.com/courses/system-design-interview/hotel-reservation-system

