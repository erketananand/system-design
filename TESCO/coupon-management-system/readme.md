## Coupon Management System

### **System Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway + Load Balancer                  │
│            (Rate Limiting, Auth, Request Routing)               │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼─────┐        ┌──────▼─────┐       ┌───────▼────┐
   │ Coupon   │        │ Validation │       │ Analytics  │
   │ Service  │───────▶│ Service    │       │ Service    │
   └────┬─────┘        └─────┬──────┘       └─────┬──────┘
        │                    │                     │
   ┌────▼─────┐        ┌─────▼──────┐       ┌─────▼──────┐
   │ Coupon   │        │ Rules      │       │ Metrics    │
   │ Database │        │ Engine     │       │ Database   │
   │(Postgres)│        │            │       │(ClickHouse)│
   └──────────┘        └─────┬──────┘       └────────────┘
                             │
                    ┌────────┼────────┐
                    │                 │
             ┌──────▼──────┐   ┌──────▼─────┐
             │ Cart        │   │ Order      │
             │ Service     │   │ Service    │
             └─────────────┘   └────────────┘
                    
   ┌─────────────────────────────────────────┐
   │  Redis Cache (Active Coupons & Rules)   │
   └─────────────────────────────────────────┘
   
   ┌─────────────────────────────────────────┐
   │  Message Queue (Kafka/RabbitMQ)         │
   │  - Coupon Events, Usage Analytics       │
   └─────────────────────────────────────────┘
```


### **Core Components**

### **1. Coupon Service**

- **Responsibilities**: CRUD operations for coupons, code generation, bulk creation[^1]
- **Features**:
    - Dynamic coupon code generation (UUID/custom patterns)
    - Bulk coupon creation for campaigns (100k+ codes)
    - Coupon lifecycle management (draft, active, expired, suspended)
- **API Endpoints**:
    - `POST /api/v1/coupons` - Create coupon
    - `GET /api/v1/coupons/:id` - Get coupon details
    - `PUT /api/v1/coupons/:id/activate` - Activate/deactivate
    - `POST /api/v1/coupons/bulk` - Bulk creation


### **2. Validation Service**

- **Responsibilities**: Real-time coupon validation, eligibility checks[^3] [^1]
- **Validation Rules**:
    - Expiry date validation
    - Usage limit checks (per user, total)
    - Minimum cart value requirements
    - Product/category applicability
    - User segment eligibility
    - Combinability rules
- **Performance**: <50ms validation latency[^3]


### **3. Rules Engine**

- **Responsibilities**: Execute complex coupon rules and calculate discounts[^2] [^4]
- **Discount Types**:
    - Flat discount (₹100 off)
    - Percentage discount (20% off)
    - Capped percentage (20% off, max ₹500)
    - Buy X Get Y free
    - Tiered discounts (spend ₹1000 get 10%, ₹2000 get 15%)
- **Pattern**: Strategy + Chain of Responsibility for multiple coupons[^4] [^2]


### **4. Analytics Service**

- **Responsibilities**: Track coupon usage, generate insights[^5]
- **Metrics**: Usage rate, conversion rate, revenue impact, fraud detection
- **Real-time**: Stream processing via Kafka for live dashboards


### **Scalability Strategies**

### **Caching Layer (Redis)**

- Cache active coupons with 1-hour TTL[^3]
- Cache validation rules to avoid DB hits
- Distributed cache for multi-region deployment


### **Database Design**

- Partition coupons by `created_date` for archival[^3]
- Index on `code`, `status`, `expiry_date` for fast lookups
- Read replicas for validation queries


### **Async Processing**

- Queue coupon usage events for analytics[^3]
- Batch processing for usage limit updates
- Event-driven architecture for real-time notifications

***

## Key Workflows

### **Workflow 1: Coupon Validation**

```
┌─────────────┐
│   User      │
│  Applies    │
│  Coupon     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. Frontend sends validation request    │
│    POST /api/coupons/validate            │
│    { couponCode, cartId, userId }        │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 2. Lookup Coupon                        │
│    SELECT * FROM Coupons                 │
│    WHERE Code = ? AND Status = 'ACTIVE'  │
└──────┬──────────────────────────────────┘
       │
       ├─── Not Found ───┐
       │                 ▼
       │          ┌──────────────┐
       │          │ Return Error │
       │          │ "Invalid code│
       │          └──────────────┘
       │
       └─── Found ───┐
                     ▼
┌─────────────────────────────────────────┐
│ 3. Check Expiry                         │
│    IF NOW() < StartDate OR               │
│       NOW() > EndDate THEN               │
│       RETURN "Coupon expired"            │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 4. Check Usage Limits                   │
│    - Total usage: CurrentUsageCount      │
│      vs TotalUsageLimit                  │
│    - Per user: Query UserCouponUsage     │
│      vs MaxUsagePerUser                  │
└──────┬──────────────────────────────────┘
       │
       ├─── Limit Exceeded ───┐
       │                      ▼
       │               ┌──────────────┐
       │               │ Return Error │
       │               │ "Usage limit │
       │               │  exceeded"   │
       │               └──────────────┘
       │
       └─── Within Limit ───┐
                            ▼
┌─────────────────────────────────────────┐
│ 5. Get Cart Details                     │
│    SELECT * FROM Carts                   │
│    JOIN CartItems ON Carts.CartID        │
│    WHERE CartID = ?                      │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 6. Check Minimum Cart Value             │
│    IF cart.subtotal < MinCartValue THEN  │
│       RETURN "Minimum cart value ₹X"     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 7. Check Product/Category Applicability │
│    - Query CouponProducts                │
│    - Query CouponCategories              │
│    - Check if cart has eligible products │
└──────┬──────────────────────────────────┘
       │
       ├─── Not Applicable ───┐
       │                      ▼
       │               ┌──────────────┐
       │               │ Return Error │
       │               │ "Not valid for│
       │               │ cart items"  │
       │               └──────────────┘
       │
       └─── Applicable ───┐
                          ▼
┌─────────────────────────────────────────┐
│ 8. Check User Segment Eligibility       │
│    - Query user profile                  │
│    - Check if user in eligible segments  │
│      (new_users, premium, loyalty, etc.) │
└──────┬──────────────────────────────────┘
       │
       ├─── Not Eligible ───┐
       │                    ▼
       │             ┌──────────────┐
       │             │ Return Error │
       │             │ "Not eligible│
       │             └──────────────┘
       │
       └─── Eligible ───┐
                        ▼
┌─────────────────────────────────────────┐
│ 9. Check Time-Based Rules               │
│    - ValidDays: Check day of week        │
│    - ValidHours: Check current hour      │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 10. Calculate Discount                  │
│     Switch(CouponType):                  │
│       FLAT:                              │
│         discount = DiscountValue         │
│       PERCENTAGE:                        │
│         discount = subtotal * (Value/100)│
│       CAPPED_PERCENTAGE:                 │
│         discount = MIN(                  │
│           subtotal * (Value/100),        │
│           MaxDiscountCap                 │
│         )                                │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 11. Check Combinability                 │
│     - If cart has other coupons applied  │
│     - Check IsCombinable flag            │
│     - Validate combination rules         │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 12. Apply Coupon to Cart (Temporary)    │
│     INSERT INTO CartCoupons (            │
│       CartID, CouponID, DiscountCalculated│
│     )                                    │
│     - Update cart subtotal in memory     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 13. Return Validation Success           │
│     { isValid: true,                     │
│       couponCode, discount,              │
│       finalAmount, message }             │
└─────────────────────────────────────────┘
```

***

### **Workflow 2: Coupon Redemption (At Checkout)**

```
┌─────────────┐
│  Order      │
│  Payment    │
│  Success    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. Retrieve Applied Coupons             │
│    SELECT * FROM CartCoupons             │
│    WHERE CartID = ?                      │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 2. Begin Redemption Transaction         │
│    BEGIN TRANSACTION                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 3. Final Validation (Idempotency Check) │
│    SELECT * FROM CouponRedemptionLog     │
│    WHERE CouponID = ? AND OrderID = ?    │
│    - Prevent duplicate redemption        │
└──────┬──────────────────────────────────┘
       │
       ├─── Already Redeemed ───┐
       │                        ▼
       │                 ┌──────────────┐
       │                 │ Skip & Return│
       │                 │ (Idempotent) │
       │                 └──────────────┘
       │
       └─── Not Redeemed ───┐
                            ▼
┌─────────────────────────────────────────┐
│ 4. Update Coupon Usage Count            │
│    UPDATE Coupons SET                    │
│      CurrentUsageCount += 1              │
│    WHERE CouponID = ?                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 5. Check if Exhausted                   │
│    IF CurrentUsageCount >= TotalUsageLimit│
│       UPDATE Coupons SET                 │
│         Status = 'EXHAUSTED'             │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 6. Update User-Specific Usage           │
│    INSERT INTO UserCouponUsage (         │
│      UserID, CouponID, UsageCount=1      │
│    )                                     │
│    ON DUPLICATE KEY UPDATE               │
│      UsageCount = UsageCount + 1,        │
│      LastUsedAt = NOW()                  │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 7. Log Redemption                       │
│    INSERT INTO CouponRedemptionLog (     │
│      CouponID, UserID, OrderID,          │
│      DiscountApplied, CartValue,         │
│      FinalValue, Status='SUCCESS',       │
│      IPAddress, UserAgent                │
│    )                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 8. Link Coupon to Order                 │
│    INSERT INTO OrderCoupons (            │
│      OrderID, CouponID, CouponCode,      │
│      DiscountApplied                     │
│    )                                     │
│    COMMIT TRANSACTION                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 9. Clear Cart Coupons                   │
│    DELETE FROM CartCoupons               │
│    WHERE CartID = ?                      │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 10. Publish Event                       │
│     - coupon.redeemed (Kafka)            │
│     { couponCode, userId, orderId,       │
│       discountAmount, timestamp }        │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 11. Update Analytics                    │
│     - Increment redemption counter       │
│     - Track revenue impact               │
│     - Update campaign metrics            │
└─────────────────────────────────────────┘
```


***

### **Workflow 3: Coupon Expiration (Background Job)**

```
┌─────────────┐
│  Cron Job   │
│  (Hourly)   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. Find Expired Coupons                 │
│    SELECT * FROM Coupons                 │
│    WHERE Status = 'ACTIVE'               │
│      AND EndDate < NOW()                 │
│    LIMIT 1000                            │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 2. Batch Update Status                  │
│    UPDATE Coupons SET                    │
│      Status = 'EXPIRED'                  │
│    WHERE CouponID IN (?)                 │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 3. Remove from Active Carts             │
│    DELETE FROM CartCoupons               │
│    WHERE CouponID IN (?)                 │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 4. Notify Affected Users (Optional)     │
│    - Find users with expired coupons     │
│    - Send "Your coupon expired" email    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 5. Update Cache                         │
│    - Remove from Redis active coupons    │
│    - Invalidate related cache keys       │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 6. Log Expiration Event                 │
│    - Record in audit log                 │
│    - Update analytics dashboard          │
└─────────────────────────────────────────┘
```


***


## Database Schema Design

### **Coupons Table**

```sql
CREATE TABLE Coupons (
    CouponID BIGINT PRIMARY KEY AUTO_INCREMENT,
    Code VARCHAR(50) UNIQUE NOT NULL,
    CouponType ENUM('PERCENTAGE', 'FLAT', 'CAPPED_PERCENTAGE', 'BUY_X_GET_Y') NOT NULL,
    Description TEXT,
    DiscountValue DECIMAL(10, 2) NOT NULL COMMENT 'Percentage or flat amount',
    MaxDiscountCap DECIMAL(10, 2) COMMENT 'For capped percentage coupons',
    Status ENUM('DRAFT', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'EXHAUSTED') DEFAULT 'DRAFT',
    StartDate DATETIME NOT NULL,
    EndDate DATETIME NOT NULL,
    TotalUsageLimit INT COMMENT 'Total number of times coupon can be used',
    CurrentUsageCount INT DEFAULT 0,
    MaxUsagePerUser INT COMMENT 'Maximum uses per user',
    CreatedBy VARCHAR(100) NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (Code),
    INDEX idx_status (Status, EndDate),
    INDEX idx_dates (StartDate, EndDate),
    CHECK (DiscountValue >= 0),
    CHECK (CurrentUsageCount >= 0),
    CHECK (EndDate > StartDate)
);
```


### **Coupon Rules Table**

```sql
CREATE TABLE CouponRules (
    RuleID BIGINT PRIMARY KEY AUTO_INCREMENT,
    CouponID BIGINT NOT NULL,
    MinCartValue DECIMAL(10, 2) COMMENT 'Minimum cart value required',
    MinQuantity INT COMMENT 'Minimum product quantity',
    ApplicabilityType ENUM('ALL_PRODUCTS', 'SPECIFIC_PRODUCTS', 'SPECIFIC_CATEGORIES', 'EXCLUDED_PRODUCTS') DEFAULT 'ALL_PRODUCTS',
    EligibleUserSegments JSON COMMENT '["new_users", "premium", "loyalty"]',
    ValidDays JSON COMMENT '[0,1,2,3,4,5,6] for days of week (0=Sunday)',
    ValidHoursStart INT COMMENT 'Valid from hour (0-23)',
    ValidHoursEnd INT COMMENT 'Valid until hour (0-23)',
    IsCombinable BOOLEAN DEFAULT FALSE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (CouponID) REFERENCES Coupons(CouponID) ON DELETE CASCADE,
    INDEX idx_coupon (CouponID)
);
```


### **Coupon Product Applicability Table**

```sql
CREATE TABLE CouponProducts (
    CouponProductID BIGINT PRIMARY KEY AUTO_INCREMENT,
    CouponID BIGINT NOT NULL,
    ProductID BIGINT NOT NULL,
    IsExcluded BOOLEAN DEFAULT FALSE COMMENT 'TRUE if product is excluded',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CouponID) REFERENCES Coupons(CouponID) ON DELETE CASCADE,
    UNIQUE KEY unique_coupon_product (CouponID, ProductID),
    INDEX idx_coupon (CouponID),
    INDEX idx_product (ProductID)
);
```


### **Coupon Category Applicability Table**

```sql
CREATE TABLE CouponCategories (
    CouponCategoryID BIGINT PRIMARY KEY AUTO_INCREMENT,
    CouponID BIGINT NOT NULL,
    CategoryID BIGINT NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CouponID) REFERENCES Coupons(CouponID) ON DELETE CASCADE,
    UNIQUE KEY unique_coupon_category (CouponID, CategoryID),
    INDEX idx_coupon (CouponID),
    INDEX idx_category (CategoryID)
);
```


### **User Coupon Usage Tracking**

```sql
CREATE TABLE UserCouponUsage (
    UsageID BIGINT PRIMARY KEY AUTO_INCREMENT,
    UserID BIGINT NOT NULL,
    CouponID BIGINT NOT NULL,
    UsageCount INT DEFAULT 1,
    FirstUsedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    LastUsedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (CouponID) REFERENCES Coupons(CouponID) ON DELETE CASCADE,
    UNIQUE KEY unique_user_coupon (UserID, CouponID),
    INDEX idx_user (UserID),
    INDEX idx_coupon (CouponID)
);
```


### **Coupon Redemption Log (Audit)**

```sql
CREATE TABLE CouponRedemptionLog (
    LogID BIGINT PRIMARY KEY AUTO_INCREMENT,
    CouponID BIGINT NOT NULL,
    UserID BIGINT NOT NULL,
    OrderID BIGINT COMMENT 'Reference to order where coupon was applied',
    DiscountApplied DECIMAL(10, 2) NOT NULL,
    CartValue DECIMAL(10, 2) NOT NULL,
    FinalValue DECIMAL(10, 2) NOT NULL,
    RedeemedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    IPAddress VARCHAR(45),
    UserAgent TEXT,
    Status ENUM('SUCCESS', 'FAILED', 'REVERSED') DEFAULT 'SUCCESS',
    FailureReason TEXT,
    FOREIGN KEY (CouponID) REFERENCES Coupons(CouponID) ON DELETE CASCADE,
    INDEX idx_coupon (CouponID, RedeemedAt),
    INDEX idx_user (UserID, RedeemedAt),
    INDEX idx_order (OrderID)
);
```

## Key Schema Relationships

1. **Coupons** ← (1:1) → **CouponRules**: Each coupon has one set of rules
2. **Coupons** ← (1:N) → **CouponProducts**: One coupon can apply to many products
3. **Coupons** ← (1:N) → **CouponCategories**: One coupon can apply to many categories
4. **Coupons** ← (1:N) → **UserCouponUsage**: Track usage per user
5. **Coupons** ← (1:N) → **CouponRedemptionLog**: Complete audit trail

### **Key Indexes for Performance**
- **CouponRedemptionLog**: `(CouponID, RedeemedAt)` for analytics


***

## Low-Level Design (LLD) - TypeScript

### **Core Domain Models**

```typescript
// Enums and Types
enum CouponType {
  PERCENTAGE = 'PERCENTAGE',
  FLAT = 'FLAT',
  CAPPED_PERCENTAGE = 'CAPPED_PERCENTAGE',
  BUY_X_GET_Y = 'BUY_X_GET_Y'
}

enum CouponStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
  EXHAUSTED = 'EXHAUSTED'
}

enum ApplicabilityType {
  ALL_PRODUCTS = 'ALL_PRODUCTS',
  SPECIFIC_PRODUCTS = 'SPECIFIC_PRODUCTS',
  SPECIFIC_CATEGORIES = 'SPECIFIC_CATEGORIES',
  EXCLUDED_PRODUCTS = 'EXCLUDED_PRODUCTS'
}

interface CouponRule {
  minCartValue?: number;
  maxUsagePerUser?: number;
  totalUsageLimit?: number;
  applicableProducts?: string[]; // Product IDs
  applicableCategories?: string[]; // Category IDs
  excludedProducts?: string[];
  eligibleUserSegments?: string[]; // 'new_users', 'premium', etc.
  validDays?: number[]; // [0-6] for days of week
  validHours?: { start: number; end: number };
  isCombinable?: boolean;
  minQuantity?: number; // For product-level coupons
}

interface DiscountResult {
  discountAmount: number;
  finalPrice: number;
  appliedCoupons: string[];
  message?: string;
}
```


### **Coupon Entity**

```typescript
class Coupon {
  readonly id: string;
  readonly code: string;
  readonly type: CouponType;
  readonly description: string;
  private status: CouponStatus;
  private rules: CouponRule;
  
  // Discount parameters
  private discountValue: number; // Percentage or flat amount
  private maxDiscountCap?: number; // For capped percentage
  
  // Validity
  private startDate: Date;
  private endDate: Date;
  
  // Usage tracking
  private currentUsageCount: number;
  private usageByUser: Map<string, number>; // userId -> count
  
  // Metadata
  private createdBy: string;
  private createdAt: Date;
  private updatedAt: Date;

  constructor(data: CouponConstructorData) {
    this.id = data.id || this.generateId();
    this.code = data.code.toUpperCase();
    this.type = data.type;
    this.description = data.description;
    this.status = data.status || CouponStatus.DRAFT;
    this.rules = data.rules;
    this.discountValue = data.discountValue;
    this.maxDiscountCap = data.maxDiscountCap;
    this.startDate = data.startDate;
    this.endDate = data.endDate;
    this.currentUsageCount = 0;
    this.usageByUser = new Map();
    this.createdBy = data.createdBy;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  private generateId(): string {
    return `CPN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Getters
  getCode(): string { return this.code; }
  getStatus(): CouponStatus { return this.status; }
  getType(): CouponType { return this.type; }
  getRules(): CouponRule { return { ...this.rules }; }
  getDiscountValue(): number { return this.discountValue; }

  // Status management
  activate(): void {
    if (this.status !== CouponStatus.DRAFT && this.status !== CouponStatus.SUSPENDED) {
      throw new Error('Cannot activate coupon in current state');
    }
    this.status = CouponStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  suspend(): void {
    if (this.status !== CouponStatus.ACTIVE) {
      throw new Error('Only active coupons can be suspended');
    }
    this.status = CouponStatus.SUSPENDED;
    this.updatedAt = new Date();
  }

  // Check if coupon is valid for use
  isValid(): boolean {
    const now = new Date();
    return (
      this.status === CouponStatus.ACTIVE &&
      now >= this.startDate &&
      now <= this.endDate &&
      (!this.rules.totalUsageLimit || this.currentUsageCount < this.rules.totalUsageLimit)
    );
  }

  // Check user-specific usage
  canUserApply(userId: string): boolean {
    if (!this.rules.maxUsagePerUser) return true;
    const userUsage = this.usageByUser.get(userId) || 0;
    return userUsage < this.rules.maxUsagePerUser;
  }

  // Record usage
  recordUsage(userId: string): void {
    this.currentUsageCount++;
    const currentUserUsage = this.usageByUser.get(userId) || 0;
    this.usageByUser.set(userId, currentUserUsage + 1);
    
    // Check if exhausted
    if (this.rules.totalUsageLimit && this.currentUsageCount >= this.rules.totalUsageLimit) {
      this.status = CouponStatus.EXHAUSTED;
    }
    this.updatedAt = new Date();
  }
}
```


### **Discount Strategy Pattern**

```typescript
// Strategy interface
interface DiscountStrategy {
  calculate(cartValue: number, coupon: Coupon): number;
  getName(): string;
}

// Flat discount strategy
class FlatDiscountStrategy implements DiscountStrategy {
  calculate(cartValue: number, coupon: Coupon): number {
    const discount = coupon.getDiscountValue();
    return Math.min(discount, cartValue); // Can't discount more than cart value
  }

  getName(): string {
    return 'FlatDiscount';
  }
}

// Percentage discount strategy
class PercentageDiscountStrategy implements DiscountStrategy {
  calculate(cartValue: number, coupon: Coupon): number {
    const discountPercent = coupon.getDiscountValue();
    return (cartValue * discountPercent) / 100;
  }

  getName(): string {
    return 'PercentageDiscount';
  }
}

// Capped percentage discount strategy
class CappedPercentageDiscountStrategy implements DiscountStrategy {
  constructor(private maxCap: number) {}

  calculate(cartValue: number, coupon: Coupon): number {
    const discountPercent = coupon.getDiscountValue();
    const calculatedDiscount = (cartValue * discountPercent) / 100;
    return Math.min(calculatedDiscount, this.maxCap);
  }

  getName(): string {
    return 'CappedPercentageDiscount';
  }
}

// Strategy factory
class DiscountStrategyFactory {
  static createStrategy(coupon: Coupon): DiscountStrategy {
    switch (coupon.getType()) {
      case CouponType.FLAT:
        return new FlatDiscountStrategy();
      case CouponType.PERCENTAGE:
        return new PercentageDiscountStrategy();
      case CouponType.CAPPED_PERCENTAGE:
        return new CappedPercentageDiscountStrategy(coupon.getMaxDiscountCap()!);
      default:
        throw new Error(`Unsupported coupon type: ${coupon.getType()}`);
    }
  }
}
```


### **Chain of Responsibility for Multiple Coupons**

```typescript
// Cart item model
interface CartItem {
  productId: string;
  categoryId: string;
  price: number;
  quantity: number;
}

interface Cart {
  userId: string;
  items: CartItem[];
  subtotal: number;
}

// Coupon handler (Chain of Responsibility)
abstract class CouponHandler {
  protected nextHandler: CouponHandler | null = null;

  setNext(handler: CouponHandler): CouponHandler {
    this.nextHandler = handler;
    return handler;
  }

  abstract handle(cart: Cart, coupons: Coupon[]): DiscountResult;
}

// Concrete handler for applying coupons
class CouponApplicator extends CouponHandler {
  constructor(
    private validationService: CouponValidationService,
    private discountCalculator: DiscountCalculator
  ) {
    super();
  }

  handle(cart: Cart, coupons: Coupon[]): DiscountResult {
    let totalDiscount = 0;
    let currentCartValue = cart.subtotal;
    const appliedCoupons: string[] = [];
    const errors: string[] = [];

    for (const coupon of coupons) {
      try {
        // Validate coupon
        const validation = this.validationService.validate(cart, coupon);
        
        if (!validation.isValid) {
          errors.push(`${coupon.getCode()}: ${validation.reason}`);
          continue;
        }

        // Check combinability
        if (appliedCoupons.length > 0 && !coupon.getRules().isCombinable) {
          errors.push(`${coupon.getCode()}: Cannot combine with other coupons`);
          continue;
        }

        // Calculate discount
        const discount = this.discountCalculator.calculate(currentCartValue, coupon);
        
        if (discount > 0) {
          totalDiscount += discount;
          currentCartValue -= discount;
          appliedCoupons.push(coupon.getCode());
          coupon.recordUsage(cart.userId);
        }
      } catch (error) {
        errors.push(`${coupon.getCode()}: ${error.message}`);
      }
    }

    return {
      discountAmount: totalDiscount,
      finalPrice: Math.max(currentCartValue, 0),
      appliedCoupons,
      message: errors.length > 0 ? errors.join('; ') : undefined
    };
  }
}
```


### **Validation Service**

```typescript
interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

class CouponValidationService {
  validate(cart: Cart, coupon: Coupon): ValidationResult {
    // Check if coupon is valid
    if (!coupon.isValid()) {
      return { isValid: false, reason: 'Coupon is not active or has expired' };
    }

    // Check user eligibility
    if (!coupon.canUserApply(cart.userId)) {
      return { isValid: false, reason: 'Usage limit exceeded for this user' };
    }

    const rules = coupon.getRules();

    // Minimum cart value check
    if (rules.minCartValue && cart.subtotal < rules.minCartValue) {
      return { 
        isValid: false, 
        reason: `Minimum cart value ₹${rules.minCartValue} required` 
      };
    }

    // Product applicability check
    if (rules.applicableProducts && rules.applicableProducts.length > 0) {
      const hasApplicableProduct = cart.items.some(item =>
        rules.applicableProducts!.includes(item.productId)
      );
      if (!hasApplicableProduct) {
        return { isValid: false, reason: 'No applicable products in cart' };
      }
    }

    // Category applicability check
    if (rules.applicableCategories && rules.applicableCategories.length > 0) {
      const hasApplicableCategory = cart.items.some(item =>
        rules.applicableCategories!.includes(item.categoryId)
      );
      if (!hasApplicableCategory) {
        return { isValid: false, reason: 'No applicable categories in cart' };
      }
    }

    // Time-based validation
    if (rules.validDays) {
      const currentDay = new Date().getDay();
      if (!rules.validDays.includes(currentDay)) {
        return { isValid: false, reason: 'Coupon not valid on this day' };
      }
    }

    if (rules.validHours) {
      const currentHour = new Date().getHours();
      if (currentHour < rules.validHours.start || currentHour >= rules.validHours.end) {
        return { isValid: false, reason: 'Coupon not valid at this time' };
      }
    }

    return { isValid: true };
  }
}
```


### **Discount Calculator**

```typescript
class DiscountCalculator {
  calculate(cartValue: number, coupon: Coupon): number {
    const strategy = DiscountStrategyFactory.createStrategy(coupon);
    return strategy.calculate(cartValue, coupon);
  }
}
```


### **Coupon Manager (Singleton)**

```typescript
class CouponManager {
  private static instance: CouponManager;
  private coupons: Map<string, Coupon>;
  private validationService: CouponValidationService;
  private discountCalculator: DiscountCalculator;
  private lock: AsyncMutex; // For thread-safe operations

  private constructor() {
    this.coupons = new Map();
    this.validationService = new CouponValidationService();
    this.discountCalculator = new DiscountCalculator();
    this.lock = new AsyncMutex();
  }

  static getInstance(): CouponManager {
    if (!CouponManager.instance) {
      CouponManager.instance = new CouponManager();
    }
    return CouponManager.instance;
  }

  async addCoupon(coupon: Coupon): Promise<void> {
    await this.lock.runExclusive(() => {
      if (this.coupons.has(coupon.getCode())) {
        throw new Error(`Coupon with code ${coupon.getCode()} already exists`);
      }
      this.coupons.set(coupon.getCode(), coupon);
    });
  }

  async getCoupon(code: string): Promise<Coupon | undefined> {
    return this.coupons.get(code.toUpperCase());
  }

  async applyCoupons(cart: Cart, couponCodes: string[]): Promise<DiscountResult> {
    const coupons: Coupon[] = [];
    
    for (const code of couponCodes) {
      const coupon = await this.getCoupon(code);
      if (coupon) {
        coupons.push(coupon);
      }
    }

    if (coupons.length === 0) {
      throw new Error('No valid coupons found');
    }

    const applicator = new CouponApplicator(
      this.validationService,
      this.discountCalculator
    );

    return await this.lock.runExclusive(() => {
      return applicator.handle(cart, coupons);
    });
  }

  async bulkCreateCoupons(template: CouponTemplate, count: number): Promise<string[]> {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const code = this.generateUniqueCode(template.prefix);
      const coupon = new Coupon({
        ...template,
        code,
        id: undefined // Auto-generate
      });
      
      await this.addCoupon(coupon);
      codes.push(code);
    }

    return codes;
  }

  private generateUniqueCode(prefix: string): string {
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `${prefix}${randomPart}`;
  }
}

// Helper for async mutex (thread-safe operations)
class AsyncMutex {
  private mutex = Promise.resolve();

  async runExclusive<T>(callback: () => T | Promise<T>): Promise<T> {
    const release = await this.acquire();
    try {
      return await callback();
    } finally {
      release();
    }
  }

  private async acquire(): Promise<() => void> {
    let release: () => void;
    const nextMutex = new Promise<void>(resolve => {
      release = resolve;
    });
    const currentMutex = this.mutex;
    this.mutex = nextMutex;
    await currentMutex;
    return release!;
  }
}
```


### **Usage Example**

```typescript
// Initialize manager
const couponManager = CouponManager.getInstance();

// Create a coupon
const newUserCoupon = new Coupon({
  code: 'WELCOME50',
  type: CouponType.CAPPED_PERCENTAGE,
  description: 'Welcome offer for new users',
  status: CouponStatus.ACTIVE,
  discountValue: 50, // 50%
  maxDiscountCap: 500, // Max ₹500
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-12-31'),
  rules: {
    minCartValue: 1000,
    maxUsagePerUser: 1,
    totalUsageLimit: 10000,
    eligibleUserSegments: ['new_users'],
    isCombinable: false
  },
  createdBy: 'admin@tesco.com'
});

await couponManager.addCoupon(newUserCoupon);

// Apply coupon to cart
const cart: Cart = {
  userId: 'user123',
  items: [
    { productId: 'P1', categoryId: 'C1', price: 1500, quantity: 1 }
  ],
  subtotal: 1500
};

const result = await couponManager.applyCoupons(cart, ['WELCOME50']);
console.log(result);
// Output: { discountAmount: 500, finalPrice: 1000, appliedCoupons: ['WELCOME50'] }
```


## Key Design Patterns Used

1. **Strategy Pattern**: Different discount calculation strategies[^2] [^4]
2. **Chain of Responsibility**: Sequential coupon application[^4] [^2]
3. **Singleton**: Thread-safe CouponManager instance[^4]
4. **Factory**: DiscountStrategyFactory for strategy creation
5. **Template Method**: Validation flow in CouponValidationService

This design ensures extensibility, testability, and scalability while maintaining SOLID principles.[^1] [^2] [^4] [^3]
<span style="display:none">[^10] [^6] [^7] [^8] [^9]</span>

<div align="center">⁂</div>

[^1]: https://www.geeksforgeeks.org/system-design/design-coupon-and-voucher-management-system/

[^2]: https://www.youtube.com/watch?v=jbVevoGN_pM

[^3]: https://about.in.mercari.com/news/mercari-india/migrating-coupons-from-monolith-to-microservice/

[^4]: https://www.linkedin.com/posts/anurag-singh-6366a1293_lld-systemdesign-8weeklldchallenge-activity-7338939847669108736-uvtq

[^5]: https://community.dynamics.com/blogs/post/?postid=938f4356-e1ba-ee11-92bd-00224852a51f

[^6]: https://leetcode.com/discuss/interview-question/system-design/786972/coupon-management-system-system-design-interview/

[^7]: https://dribbble.com/search/coupon-management-system

[^8]: https://www.linkedin.com/posts/souvik-dey-250173214_lld-systemdesign-java-activity-7305930839547068416-pWiE

[^9]: https://github.com/ashishps1/awesome-low-level-design

[^10]: https://www.opslevel.com/resources/detailed-guide-to-how-to-scale-microservices

