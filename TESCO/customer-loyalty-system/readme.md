## Customer Loyalty Management System - Complete Design

### **System Architecture**

```
┌──────────────────────────────────────────────────────────────┐
│               API Gateway + Load Balancer                    │
│         (Authentication, Rate Limiting, Routing)             │
└──────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼─────┐        ┌──────▼─────┐       ┌───────▼────┐
   │ Loyalty  │        │ Points     │       │ Rewards    │
   │ Service  │──────▶│ Engine     │──────▶│ Service    │
   └────┬─────┘        └─────┬──────┘       └─────┬──────┘
        │                    │                    │
   ┌────▼─────┐        ┌─────▼──────┐       ┌─────▼──────┐
   │ Member   │        │ Points     │       │ Rewards    │
   │   DB     │        │  Ledger    │       │ Catalog    │
   │(Postgres)│        │   (DB)     │       │    (DB)    │
   └──────────┘        └────────────┘       └────────────┘
        │                    │
        │              ┌─────▼──────┐
        └────────────▶│ Tier       │
                       │ Service    │
                       └─────┬──────┘
                             │
                    ┌────────┼────────┐
                    │                 │
             ┌──────▼──────┐   ┌──────▼─────┐
             │ Analytics   │   │Notification│
             │  Service    │   │  Service   │
             └─────────────┘   └────────────┘
                    
   ┌──────────────────────────────────────────┐
   │  Redis Cache (Member Tiers & Points)     │
   └──────────────────────────────────────────┘
   
   ┌──────────────────────────────────────────┐
   │  Message Queue (Kafka/RabbitMQ)          │
   │  - Points Events, Tier Changes, Rewards  │
   └──────────────────────────────────────────┘
   
   ┌──────────────────────────────────────────┐
   │  External Systems Integration            │
   │  - Order Service, CRM, Email Marketing   │
   └──────────────────────────────────────────┘
```


### **Core Components**

### **1. Loyalty Service**

- **Responsibilities**: Member enrollment, profile management, program configuration[^4][^1]
- **Features**:
    - Member registration and onboarding
    - Multi-tier program management
    - Program rules configuration
    - Member dashboard and activity tracking
- **API Endpoints**:
    - `POST /api/v1/loyalty/enroll` - Enroll member
    - `GET /api/v1/loyalty/members/:id` - Get member profile
    - `GET /api/v1/loyalty/programs` - Get active programs


### **2. Points Engine**

- **Responsibilities**: Points accrual, redemption, expiration management[^3][^5]
- **Features**:
    - Real-time points calculation based on transactions
    - Bonus points for promotions
    - Points expiration based on inactivity
    - Pending → Available → Expired lifecycle[^3]
    - Idempotent operations to prevent duplicates[^5]
- **Performance**: <100ms for points calculation, handles 10k+ concurrent transactions


### **3. Tier Service**

- **Responsibilities**: Tier qualification, upgrades/downgrades, tier benefits[^6][^3]
- **Tier Types**: Bronze → Silver → Gold → Platinum
- **Features**:
    - Automatic tier calculations based on points/spending
    - Tier maintenance periods (annual qualification)
    - Tier-specific benefits and multipliers
    - Historical tier tracking[^3]


### **4. Rewards Service**

- **Responsibilities**: Rewards catalog, redemption processing[^1][^3]
- **Reward Types**:
    - Discount coupons
    - Free products
    - Cashback
    - Partner rewards (airline miles, gift cards)
    - Experiential rewards (events, VIP access)
- **Features**: Reward eligibility validation, inventory management, partner integrations[^6]


### **5. Analytics Service**

- **Responsibilities**: Member segmentation, program performance metrics[^7][^1]
- **Metrics**:
    - Points earning/burn rate
    - Member lifetime value
    - Tier distribution
    - Redemption patterns
    - Engagement scores
- **Real-time**: Streaming analytics for dashboards[^1]


### **6. Notification Service**

- **Responsibilities**: Member communications, engagement campaigns[^1]
- **Channels**: Email, SMS, Push notifications, In-app messages
- **Triggers**:
    - Points earned/redeemed
    - Tier upgrades
    - Points expiring soon
    - Birthday rewards
    - Personalized offers[^1]


### **Key Workflows**

### **Points Earning Flow**

```
1. Order placed → Order Service publishes event → Kafka
2. Points Engine consumes event → Calculate points
3. Create pending points transaction → Points Ledger
4. After holding period → Move to available points
5. Update member total points → Trigger tier check
6. Notify member → Send confirmation
```


### **Tier Evaluation Flow**

```
1. Points updated → Tier Service triggered
2. Calculate qualification metrics (points/spend in period)
3. Compare against tier thresholds
4. If qualified → Upgrade tier → Unlock benefits
5. If downgrade → Notify member → Grace period
6. Update tier history → Analytics
```


### **Reward Redemption Flow**

```
1. Member requests reward → Validate eligibility
2. Check points balance → Lock points (pessimistic)
3. Reserve reward inventory → External partner if needed
4. Deduct points → Create redemption transaction
5. Fulfill reward → Generate coupon/voucher
6. Notify member → Send confirmation
```


***

## Database Schema Design

### **Loyalty Programs Table**

```sql
CREATE TABLE LoyaltyPrograms (
    ProgramID BIGINT PRIMARY KEY AUTO_INCREMENT,
    ProgramName VARCHAR(100) NOT NULL,
    Description TEXT,
    ProgramType ENUM('POINTS', 'TIERED', 'CASHBACK', 'HYBRID') DEFAULT 'TIERED',
    Status ENUM('DRAFT', 'ACTIVE', 'SUSPENDED', 'ARCHIVED') DEFAULT 'DRAFT',
    StartDate DATE NOT NULL,
    EndDate DATE COMMENT 'NULL for ongoing programs',
    PointsPerDollar DECIMAL(5, 2) DEFAULT 1.00 COMMENT 'Base earning rate',
    Currency VARCHAR(3) DEFAULT 'INR',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (Status, StartDate)
);
```


### **Loyalty Tiers Table**

```sql
CREATE TABLE LoyaltyTiers (
    TierID BIGINT PRIMARY KEY AUTO_INCREMENT,
    ProgramID BIGINT NOT NULL,
    TierName VARCHAR(50) NOT NULL,
    TierLevel INT NOT NULL COMMENT 'Numeric order: 1=Bronze, 2=Silver, etc.',
    MinPointsRequired INT NOT NULL DEFAULT 0,
    MinSpendRequired DECIMAL(12, 2) COMMENT 'Alternative qualification',
    PointsMultiplier DECIMAL(3, 2) DEFAULT 1.00 COMMENT 'Earning rate multiplier',
    Description TEXT,
    Benefits JSON COMMENT '["Free shipping", "Birthday rewards", "Priority support"]',
    BadgeImageURL VARCHAR(500),
    QualificationPeriodDays INT DEFAULT 365 COMMENT 'Rolling qualification window',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ProgramID) REFERENCES LoyaltyPrograms(ProgramID) ON DELETE CASCADE,
    UNIQUE KEY unique_program_level (ProgramID, TierLevel),
    INDEX idx_program (ProgramID)
);
```


### **Loyalty Members Table**

```sql
CREATE TABLE LoyaltyMembers (
    MemberID BIGINT PRIMARY KEY AUTO_INCREMENT,
    UserID BIGINT UNIQUE NOT NULL,
    ProgramID BIGINT NOT NULL,
    MemberNumber VARCHAR(20) UNIQUE NOT NULL COMMENT 'External member ID',
    CurrentTierID BIGINT NOT NULL,
    TotalPointsEarned BIGINT DEFAULT 0 COMMENT 'Lifetime points earned',
    AvailablePoints INT DEFAULT 0 COMMENT 'Current redeemable points',
    PendingPoints INT DEFAULT 0 COMMENT 'Points in holding period',
    ExpiredPoints BIGINT DEFAULT 0 COMMENT 'Historical expired points',
    TotalSpend DECIMAL(12, 2) DEFAULT 0.00 COMMENT 'Lifetime spend',
    EnrollmentDate DATE NOT NULL,
    LastActivityDate DATE,
    NextTierPoints INT COMMENT 'Points needed for next tier',
    AccountStatus ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'CLOSED') DEFAULT 'ACTIVE',
    PreferredChannel ENUM('EMAIL', 'SMS', 'PUSH', 'IN_APP') DEFAULT 'EMAIL',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (ProgramID) REFERENCES LoyaltyPrograms(ProgramID) ON DELETE RESTRICT,
    FOREIGN KEY (CurrentTierID) REFERENCES LoyaltyTiers(TierID) ON DELETE RESTRICT,
    INDEX idx_user (UserID),
    INDEX idx_program (ProgramID),
    INDEX idx_member_number (MemberNumber),
    INDEX idx_tier (CurrentTierID),
    INDEX idx_status (AccountStatus)
);
```


### **Points Ledger Table (Transaction Log)**

```sql
CREATE TABLE PointsLedger (
    TransactionID BIGINT PRIMARY KEY AUTO_INCREMENT,
    TransactionUUID VARCHAR(36) UNIQUE NOT NULL COMMENT 'For idempotency',
    MemberID BIGINT NOT NULL,
    TransactionType ENUM('EARN', 'REDEEM', 'EXPIRE', 'ADJUST', 'BONUS', 'REFUND') NOT NULL,
    PointsChange INT NOT NULL COMMENT 'Positive for earn, negative for redeem',
    BalanceAfter INT NOT NULL COMMENT 'Snapshot of available points after transaction',
    Status ENUM('PENDING', 'AVAILABLE', 'EXPIRED', 'REVERSED') DEFAULT 'PENDING',
    
    -- Transaction context
    OrderID BIGINT COMMENT 'Reference order for earn transactions',
    RedemptionID BIGINT COMMENT 'Reference redemption record',
    CampaignID BIGINT COMMENT 'Promotional campaign reference',
    
    -- Lifecycle timestamps
    TransactionDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    AvailableDate TIMESTAMP COMMENT 'When pending points become available',
    ExpirationDate TIMESTAMP COMMENT 'When points expire',
    ExpiredAt TIMESTAMP COMMENT 'Actual expiration timestamp',
    
    -- Metadata
    Description VARCHAR(255),
    SourceSystem VARCHAR(50) DEFAULT 'LOYALTY_ENGINE',
    Metadata JSON COMMENT 'Additional context',
    
    FOREIGN KEY (MemberID) REFERENCES LoyaltyMembers(MemberID) ON DELETE CASCADE,
    INDEX idx_member (MemberID, TransactionDate DESC),
    INDEX idx_uuid (TransactionUUID),
    INDEX idx_status (Status, ExpirationDate),
    INDEX idx_order (OrderID),
    INDEX idx_type (TransactionType, TransactionDate)
);
```


### **Member Tier History Table**

```sql
CREATE TABLE MemberTierHistory (
    HistoryID BIGINT PRIMARY KEY AUTO_INCREMENT,
    MemberID BIGINT NOT NULL,
    FromTierID BIGINT,
    ToTierID BIGINT NOT NULL,
    ChangeType ENUM('UPGRADE', 'DOWNGRADE', 'INITIAL', 'MANUAL') NOT NULL,
    ChangeReason VARCHAR(255),
    QualifyingPoints INT COMMENT 'Points at time of change',
    QualifyingSpend DECIMAL(12, 2) COMMENT 'Spend at time of change',
    EffectiveDate DATE NOT NULL,
    ExpiryDate DATE COMMENT 'When tier expires/renews',
    ChangedBy VARCHAR(100) COMMENT 'System or admin user',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (MemberID) REFERENCES LoyaltyMembers(MemberID) ON DELETE CASCADE,
    FOREIGN KEY (FromTierID) REFERENCES LoyaltyTiers(TierID) ON DELETE SET NULL,
    FOREIGN KEY (ToTierID) REFERENCES LoyaltyTiers(TierID) ON DELETE RESTRICT,
    INDEX idx_member (MemberID, EffectiveDate DESC),
    INDEX idx_tier_change (ToTierID, EffectiveDate)
);
```


### **Rewards Catalog Table**

```sql
CREATE TABLE RewardsCatalog (
    RewardID BIGINT PRIMARY KEY AUTO_INCREMENT,
    ProgramID BIGINT NOT NULL,
    RewardName VARCHAR(255) NOT NULL,
    Description TEXT,
    RewardType ENUM('DISCOUNT_COUPON', 'FREE_PRODUCT', 'CASHBACK', 'PARTNER_REWARD', 'EXPERIENTIAL') NOT NULL,
    PointsCost INT NOT NULL,
    CashValue DECIMAL(10, 2) COMMENT 'Monetary equivalent',
    TierRestriction BIGINT COMMENT 'Minimum tier required',
    AvailableQuantity INT COMMENT 'NULL for unlimited',
    RedeemedCount INT DEFAULT 0,
    ImageURL VARCHAR(500),
    TermsAndConditions TEXT,
    ValidityDays INT COMMENT 'Days after redemption before expiry',
    Status ENUM('ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'EXPIRED') DEFAULT 'ACTIVE',
    StartDate DATE,
    EndDate DATE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ProgramID) REFERENCES LoyaltyPrograms(ProgramID) ON DELETE CASCADE,
    FOREIGN KEY (TierRestriction) REFERENCES LoyaltyTiers(TierID) ON DELETE SET NULL,
    INDEX idx_program (ProgramID),
    INDEX idx_status (Status),
    INDEX idx_tier (TierRestriction)
);
```


### **Reward Redemptions Table**

```sql
CREATE TABLE RewardRedemptions (
    RedemptionID BIGINT PRIMARY KEY AUTO_INCREMENT,
    MemberID BIGINT NOT NULL,
    RewardID BIGINT NOT NULL,
    PointsRedeemed INT NOT NULL,
    Status ENUM('PENDING', 'FULFILLED', 'CANCELLED', 'EXPIRED') DEFAULT 'PENDING',
    VoucherCode VARCHAR(100) UNIQUE COMMENT 'Generated coupon/voucher code',
    RedeemedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FulfilledAt TIMESTAMP,
    ExpiresAt TIMESTAMP,
    CancelledAt TIMESTAMP,
    CancellationReason TEXT,
    FulfillmentDetails JSON COMMENT 'Partner tracking info, delivery details',
    FOREIGN KEY (MemberID) REFERENCES LoyaltyMembers(MemberID) ON DELETE CASCADE,
    FOREIGN KEY (RewardID) REFERENCES RewardsCatalog(RewardID) ON DELETE RESTRICT,
    INDEX idx_member (MemberID, RedeemedAt DESC),
    INDEX idx_reward (RewardID),
    INDEX idx_status (Status),
    INDEX idx_voucher (VoucherCode)
);
```


### **Earning Rules Table**

```sql
CREATE TABLE EarningRules (
    RuleID BIGINT PRIMARY KEY AUTO_INCREMENT,
    ProgramID BIGINT NOT NULL,
    RuleName VARCHAR(100) NOT NULL,
    RuleType ENUM('PURCHASE', 'SIGNUP', 'REFERRAL', 'REVIEW', 'BIRTHDAY', 'SOCIAL_SHARE', 'CUSTOM') NOT NULL,
    PointsAwarded INT NOT NULL,
    IsMultiplier BOOLEAN DEFAULT FALSE COMMENT 'If TRUE, multiply by transaction value',
    TierMultiplier BOOLEAN DEFAULT TRUE COMMENT 'Apply tier multiplier',
    
    -- Conditions
    MinPurchaseAmount DECIMAL(10, 2),
    ProductCategoryID BIGINT COMMENT 'Specific category',
    ValidFrom DATE,
    ValidUntil DATE,
    MaxUsesPerMember INT COMMENT 'Usage limit per member',
    
    -- Pending period
    PendingPeriodDays INT DEFAULT 7 COMMENT 'Days before points become available',
    
    Status ENUM('ACTIVE', 'INACTIVE', 'EXPIRED') DEFAULT 'ACTIVE',
    Priority INT DEFAULT 0 COMMENT 'Rule evaluation order',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ProgramID) REFERENCES LoyaltyPrograms(ProgramID) ON DELETE CASCADE,
    INDEX idx_program (ProgramID),
    INDEX idx_type_status (RuleType, Status),
    INDEX idx_priority (Priority)
);
```


### **Member Activities Table (Engagement Tracking)**

```sql
CREATE TABLE MemberActivities (
    ActivityID BIGINT PRIMARY KEY AUTO_INCREMENT,
    MemberID BIGINT NOT NULL,
    ActivityType ENUM('PURCHASE', 'REDEMPTION', 'TIER_CHANGE', 'REVIEW', 'REFERRAL', 'LOGIN', 'PROFILE_UPDATE') NOT NULL,
    ActivityDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PointsImpact INT DEFAULT 0 COMMENT 'Points earned/spent',
    RelatedEntityID BIGINT COMMENT 'Order/Redemption/Review ID',
    Details JSON COMMENT 'Activity-specific metadata',
    FOREIGN KEY (MemberID) REFERENCES LoyaltyMembers(MemberID) ON DELETE CASCADE,
    INDEX idx_member (MemberID, ActivityDate DESC),
    INDEX idx_activity_type (ActivityType, ActivityDate)
);
```


### **Partner Rewards Integration Table**

```sql
CREATE TABLE PartnerRewards (
    PartnerRewardID BIGINT PRIMARY KEY AUTO_INCREMENT,
    RewardID BIGINT NOT NULL,
    PartnerName VARCHAR(100) NOT NULL,
    PartnerAPIEndpoint VARCHAR(500),
    PartnerCredentials TEXT COMMENT 'Encrypted credentials',
    MappingConfig JSON COMMENT 'Field mappings for integration',
    Status ENUM('ACTIVE', 'INACTIVE', 'ERROR') DEFAULT 'ACTIVE',
    LastSyncAt TIMESTAMP,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (RewardID) REFERENCES RewardsCatalog(RewardID) ON DELETE CASCADE,
    INDEX idx_reward (RewardID),
    INDEX idx_partner (PartnerName)
);
```


***

## Low-Level Design (LLD) - TypeScript

### **Domain Models and Types**

```typescript
// Enums
enum TierLevel {
  BRONZE = 1,
  SILVER = 2,
  GOLD = 3,
  PLATINUM = 4
}

enum PointsTransactionType {
  EARN = 'EARN',
  REDEEM = 'REDEEM',
  EXPIRE = 'EXPIRE',
  ADJUST = 'ADJUST',
  BONUS = 'BONUS',
  REFUND = 'REFUND'
}

enum PointsStatus {
  PENDING = 'PENDING',
  AVAILABLE = 'AVAILABLE',
  EXPIRED = 'EXPIRED',
  REVERSED = 'REVERSED'
}

enum MemberStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  CLOSED = 'CLOSED'
}

enum RewardType {
  DISCOUNT_COUPON = 'DISCOUNT_COUPON',
  FREE_PRODUCT = 'FREE_PRODUCT',
  CASHBACK = 'CASHBACK',
  PARTNER_REWARD = 'PARTNER_REWARD',
  EXPERIENTIAL = 'EXPERIENTIAL'
}

enum RedemptionStatus {
  PENDING = 'PENDING',
  FULFILLED = 'FULFILLED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

// Interfaces
interface TierBenefits {
  freeShipping: boolean;
  pointsMultiplier: number;
  birthdayReward: number;
  prioritySupport: boolean;
  exclusiveDeals: boolean;
  earlyAccess: boolean;
}

interface PointsTransaction {
  transactionUUID: string;
  memberId: string;
  type: PointsTransactionType;
  pointsChange: number;
  balanceAfter: number;
  status: PointsStatus;
  orderId?: string;
  description: string;
  transactionDate: Date;
  availableDate?: Date;
  expirationDate?: Date;
}

interface MemberProfile {
  memberId: string;
  userId: string;
  memberNumber: string;
  currentTier: TierLevel;
  availablePoints: number;
  pendingPoints: number;
  totalPointsEarned: number;
  totalSpend: number;
  enrollmentDate: Date;
  status: MemberStatus;
}
```


### **Loyalty Tier Entity**

```typescript
class LoyaltyTier {
  readonly tierID: string;
  readonly tierName: string;
  readonly tierLevel: TierLevel;
  private minPointsRequired: number;
  private minSpendRequired: number;
  private pointsMultiplier: number;
  private benefits: TierBenefits;
  private qualificationPeriodDays: number;

  constructor(
    tierName: string,
    tierLevel: TierLevel,
    minPointsRequired: number,
    minSpendRequired: number,
    pointsMultiplier: number,
    benefits: TierBenefits,
    qualificationPeriodDays: number = 365
  ) {
    this.tierID = this.generateTierID();
    this.tierName = tierName;
    this.tierLevel = tierLevel;
    this.minPointsRequired = minPointsRequired;
    this.minSpendRequired = minSpendRequired;
    this.pointsMultiplier = pointsMultiplier;
    this.benefits = benefits;
    this.qualificationPeriodDays = qualificationPeriodDays;
  }

  private generateTierID(): string {
    return `TIER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Check if member qualifies for this tier
  isQualified(points: number, spend: number): boolean {
    return points >= this.minPointsRequired || spend >= this.minSpendRequired;
  }

  // Getters
  getTierLevel(): TierLevel { return this.tierLevel; }
  getTierName(): string { return this.tierName; }
  getMinPointsRequired(): number { return this.minPointsRequired; }
  getPointsMultiplier(): number { return this.pointsMultiplier; }
  getBenefits(): TierBenefits { return { ...this.benefits }; }
  getQualificationPeriod(): number { return this.qualificationPeriodDays; }

  // Check specific benefits
  hasFreeShipping(): boolean { return this.benefits.freeShipping; }
  hasPrioritySupport(): boolean { return this.benefits.prioritySupport; }
  getBirthdayReward(): number { return this.benefits.birthdayReward; }
}
```


### **Loyalty Member Entity**

```typescript
class LoyaltyMember {
  readonly memberId: string;
  readonly userId: string;
  readonly memberNumber: string;
  private programId: string;
  private currentTier: LoyaltyTier;
  
  // Points tracking
  private availablePoints: number;
  private pendingPoints: number;
  private totalPointsEarned: number;
  private expiredPoints: number;
  
  // Financial tracking
  private totalSpend: number;
  
  // Status
  private status: MemberStatus;
  private enrollmentDate: Date;
  private lastActivityDate: Date;
  
  // Tier progress
  private tierHistory: Array<{ tier: LoyaltyTier; effectiveDate: Date }>;

  constructor(
    userId: string,
    programId: string,
    initialTier: LoyaltyTier
  ) {
    this.memberId = this.generateMemberId();
    this.userId = userId;
    this.memberNumber = this.generateMemberNumber();
    this.programId = programId;
    this.currentTier = initialTier;
    this.availablePoints = 0;
    this.pendingPoints = 0;
    this.totalPointsEarned = 0;
    this.expiredPoints = 0;
    this.totalSpend = 0;
    this.status = MemberStatus.ACTIVE;
    this.enrollmentDate = new Date();
    this.lastActivityDate = new Date();
    this.tierHistory = [{ tier: initialTier, effectiveDate: new Date() }];
  }

  private generateMemberId(): string {
    return `MEM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMemberNumber(): string {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `LM${timestamp}${random}`;
  }

  // Add points (earn transaction)
  addPendingPoints(points: number, description: string): void {
    if (points <= 0) {
      throw new Error('Points must be positive');
    }
    this.pendingPoints += points;
    this.totalPointsEarned += points;
    this.updateActivity();
  }

  // Move pending points to available (after holding period)
  releasePendingPoints(points: number): void {
    if (points > this.pendingPoints) {
      throw new Error('Insufficient pending points');
    }
    this.pendingPoints -= points;
    this.availablePoints += points;
    this.updateActivity();
  }

  // Redeem points
  redeemPoints(points: number): void {
    if (points <= 0) {
      throw new Error('Redemption amount must be positive');
    }
    if (points > this.availablePoints) {
      throw new Error(`Insufficient points. Available: ${this.availablePoints}, Required: ${points}`);
    }
    this.availablePoints -= points;
    this.updateActivity();
  }

  // Expire points
  expirePoints(points: number): void {
    if (points > this.availablePoints) {
      throw new Error('Cannot expire more points than available');
    }
    this.availablePoints -= points;
    this.expiredPoints += points;
    this.updateActivity();
  }

  // Add spend (for tier qualification)
  addSpend(amount: number): void {
    if (amount <= 0) {
      throw new Error('Spend amount must be positive');
    }
    this.totalSpend += amount;
    this.updateActivity();
  }

  // Tier management
  upgradeTier(newTier: LoyaltyTier): void {
    if (newTier.getTierLevel() <= this.currentTier.getTierLevel()) {
      throw new Error('New tier must be higher than current tier');
    }
    this.currentTier = newTier;
    this.tierHistory.push({ tier: newTier, effectiveDate: new Date() });
    this.updateActivity();
  }

  downgradeTier(newTier: LoyaltyTier): void {
    if (newTier.getTierLevel() >= this.currentTier.getTierLevel()) {
      throw new Error('New tier must be lower than current tier');
    }
    this.currentTier = newTier;
    this.tierHistory.push({ tier: newTier, effectiveDate: new Date() });
    this.updateActivity();
  }

  // Calculate points for transaction with tier multiplier
  calculateEarnedPoints(basePoints: number): number {
    return Math.floor(basePoints * this.currentTier.getPointsMultiplier());
  }

  // Get points needed for next tier
  getPointsToNextTier(nextTier: LoyaltyTier): number {
    const currentPoints = this.availablePoints + this.pendingPoints;
    const required = nextTier.getMinPointsRequired();
    return Math.max(0, required - currentPoints);
  }

  // Check if member is active
  isActive(): boolean {
    return this.status === MemberStatus.ACTIVE;
  }

  // Suspend member
  suspend(reason: string): void {
    if (this.status === MemberStatus.CLOSED) {
      throw new Error('Cannot suspend closed account');
    }
    this.status = MemberStatus.SUSPENDED;
    this.updateActivity();
  }

  // Reactivate member
  reactivate(): void {
    if (this.status === MemberStatus.CLOSED) {
      throw new Error('Cannot reactivate closed account');
    }
    this.status = MemberStatus.ACTIVE;
    this.updateActivity();
  }

  private updateActivity(): void {
    this.lastActivityDate = new Date();
  }

  // Getters
  getMemberId(): string { return this.memberId; }
  getMemberNumber(): string { return this.memberNumber; }
  getAvailablePoints(): number { return this.availablePoints; }
  getPendingPoints(): number { return this.pendingPoints; }
  getTotalPoints(): number { return this.availablePoints + this.pendingPoints; }
  getTotalPointsEarned(): number { return this.totalPointsEarned; }
  getExpiredPoints(): number { return this.expiredPoints; }
  getTotalSpend(): number { return this.totalSpend; }
  getCurrentTier(): LoyaltyTier { return this.currentTier; }
  getStatus(): MemberStatus { return this.status; }
  getTierHistory(): Array<{ tier: LoyaltyTier; effectiveDate: Date }> {
    return [...this.tierHistory];
  }

  // Get member profile
  getProfile(): MemberProfile {
    return {
      memberId: this.memberId,
      userId: this.userId,
      memberNumber: this.memberNumber,
      currentTier: this.currentTier.getTierLevel(),
      availablePoints: this.availablePoints,
      pendingPoints: this.pendingPoints,
      totalPointsEarned: this.totalPointsEarned,
      totalSpend: this.totalSpend,
      enrollmentDate: this.enrollmentDate,
      status: this.status
    };
  }
}
```


### **Points Engine (Strategy Pattern)**

```typescript
// Strategy interface for points calculation
interface PointsCalculationStrategy {
  calculate(transactionAmount: number, member: LoyaltyMember): number;
  getName(): string;
}

// Base points calculation
class BasePointsStrategy implements PointsCalculationStrategy {
  constructor(private pointsPerDollar: number) {}

  calculate(transactionAmount: number, member: LoyaltyMember): number {
    const basePoints = Math.floor(transactionAmount * this.pointsPerDollar);
    return member.calculateEarnedPoints(basePoints); // Apply tier multiplier
  }

  getName(): string {
    return 'BasePoints';
  }
}

// Bonus points for promotions
class BonusPointsStrategy implements PointsCalculationStrategy {
  constructor(private bonusMultiplier: number) {}

  calculate(transactionAmount: number, member: LoyaltyMember): number {
    const basePoints = Math.floor(transactionAmount);
    const bonusPoints = Math.floor(basePoints * this.bonusMultiplier);
    return member.calculateEarnedPoints(bonusPoints);
  }

  getName(): string {
    return 'BonusPoints';
  }
}

// Fixed points for activities
class FixedPointsStrategy implements PointsCalculationStrategy {
  constructor(private fixedPoints: number) {}

  calculate(transactionAmount: number, member: LoyaltyMember): number {
    return this.fixedPoints; // No tier multiplier for fixed activities
  }

  getName(): string {
    return 'FixedPoints';
  }
}

// Points Engine
class PointsEngine {
  private strategy: PointsCalculationStrategy;

  constructor(strategy: PointsCalculationStrategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy: PointsCalculationStrategy): void {
    this.strategy = strategy;
  }

  calculatePoints(transactionAmount: number, member: LoyaltyMember): number {
    return this.strategy.calculate(transactionAmount, member);
  }

  // Create points transaction with idempotency
  async createTransaction(
    member: LoyaltyMember,
    type: PointsTransactionType,
    points: number,
    description: string,
    idempotencyKey: string,
    metadata?: Record<string, any>
  ): Promise<PointsTransaction> {
    // Check idempotency (implementation would check database)
    // const existing = await this.checkIdempotency(idempotencyKey);
    // if (existing) return existing;

    const transaction: PointsTransaction = {
      transactionUUID: idempotencyKey,
      memberId: member.getMemberId(),
      type,
      pointsChange: type === PointsTransactionType.REDEEM ? -points : points,
      balanceAfter: member.getAvailablePoints(),
      status: type === PointsTransactionType.EARN ? PointsStatus.PENDING : PointsStatus.AVAILABLE,
      description,
      transactionDate: new Date(),
      availableDate: type === PointsTransactionType.EARN ? this.calculateAvailableDate(7) : undefined,
      expirationDate: type === PointsTransactionType.EARN ? this.calculateExpirationDate(365) : undefined
    };

    return transaction;
  }

  private calculateAvailableDate(daysFromNow: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date;
  }

  private calculateExpirationDate(daysFromNow: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date;
  }
}
```


### **Tier Manager Service**

```typescript
class TierManager {
  private tiers: Map<TierLevel, LoyaltyTier>;

  constructor() {
    this.tiers = new Map();
    this.initializeTiers();
  }

  private initializeTiers(): void {
    // Bronze Tier
    const bronze = new LoyaltyTier(
      'Bronze',
      TierLevel.BRONZE,
      0,
      0,
      1.0,
      {
        freeShipping: false,
        pointsMultiplier: 1.0,
        birthdayReward: 100,
        prioritySupport: false,
        exclusiveDeals: false,
        earlyAccess: false
      }
    );

    // Silver Tier
    const silver = new LoyaltyTier(
      'Silver',
      TierLevel.SILVER,
      5000,
      50000,
      1.25,
      {
        freeShipping: false,
        pointsMultiplier: 1.25,
        birthdayReward: 250,
        prioritySupport: false,
        exclusiveDeals: true,
        earlyAccess: false
      }
    );

    // Gold Tier
    const gold = new LoyaltyTier(
      'Gold',
      TierLevel.GOLD,
      15000,
      150000,
      1.5,
      {
        freeShipping: true,
        pointsMultiplier: 1.5,
        birthdayReward: 500,
        prioritySupport: true,
        exclusiveDeals: true,
        earlyAccess: true
      }
    );

    // Platinum Tier
    const platinum = new LoyaltyTier(
      'Platinum',
      TierLevel.PLATINUM,
      30000,
      300000,
      2.0,
      {
        freeShipping: true,
        pointsMultiplier: 2.0,
        birthdayReward: 1000,
        prioritySupport: true,
        exclusiveDeals: true,
        earlyAccess: true
      }
    );

    this.tiers.set(TierLevel.BRONZE, bronze);
    this.tiers.set(TierLevel.SILVER, silver);
    this.tiers.set(TierLevel.GOLD, gold);
    this.tiers.set(TierLevel.PLATINUM, platinum);
  }

  // Evaluate and update member tier
  evaluateTier(member: LoyaltyMember): LoyaltyTier {
    const currentTierLevel = member.getCurrentTier().getTierLevel();
    const totalPoints = member.getTotalPoints();
    const totalSpend = member.getTotalSpend();

    // Check from highest to lowest tier
    const tierLevels = [TierLevel.PLATINUM, TierLevel.GOLD, TierLevel.SILVER, TierLevel.BRONZE];
    
    for (const level of tierLevels) {
      const tier = this.tiers.get(level)!;
      if (tier.isQualified(totalPoints, totalSpend)) {
        // Upgrade if qualified for higher tier
        if (level > currentTierLevel) {
          member.upgradeTier(tier);
          return tier;
        }
        // Downgrade if no longer qualified for current tier
        if (level < currentTierLevel) {
          member.downgradeTier(tier);
          return tier;
        }
        // No change
        return tier;
      }
    }

    return this.tiers.get(TierLevel.BRONZE)!;
  }

  // Get next tier for a member
  getNextTier(currentTier: LoyaltyTier): LoyaltyTier | null {
    const currentLevel = currentTier.getTierLevel();
    const nextLevel = currentLevel + 1;
    return this.tiers.get(nextLevel as TierLevel) || null;
  }

  getTier(level: TierLevel): LoyaltyTier | undefined {
    return this.tiers.get(level);
  }

  getAllTiers(): LoyaltyTier[] {
    return Array.from(this.tiers.values()).sort((a, b) => 
      a.getTierLevel() - b.getTierLevel()
    );
  }
}
```


### **Reward Entity**

```typescript
class Reward {
  readonly rewardId: string;
  private rewardName: string;
  private description: string;
  private rewardType: RewardType;
  private pointsCost: number;
  private cashValue: number;
  private minTierRequired: TierLevel | null;
  private availableQuantity: number | null; // null = unlimited
  private redeemedCount: number;
  private validityDays: number;
  private isActive: boolean;

  constructor(
    rewardName: string,
    description: string,
    rewardType: RewardType,
    pointsCost: number,
    cashValue: number,
    minTierRequired: TierLevel | null = null,
    availableQuantity: number | null = null,
    validityDays: number = 30
  ) {
    this.rewardId = this.generateRewardId();
    this.rewardName = rewardName;
    this.description = description;
    this.rewardType = rewardType;
    this.pointsCost = pointsCost;
    this.cashValue = cashValue;
    this.minTierRequired = minTierRequired;
    this.availableQuantity = availableQuantity;
    this.redeemedCount = 0;
    this.validityDays = validityDays;
    this.isActive = true;
  }

  private generateRewardId(): string {
    return `RWD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Check if reward is available
  isAvailable(): boolean {
    if (!this.isActive) return false;
    if (this.availableQuantity === null) return true;
    return this.availableQuantity > this.redeemedCount;
  }

  // Check if member is eligible
  isEligible(member: LoyaltyMember): boolean {
    // Check points
    if (member.getAvailablePoints() < this.pointsCost) {
      return false;
    }

    // Check tier restriction
    if (this.minTierRequired !== null) {
      if (member.getCurrentTier().getTierLevel() < this.minTierRequired) {
        return false;
      }
    }

    return this.isAvailable();
  }

  // Record redemption
  recordRedemption(): void {
    if (!this.isAvailable()) {
      throw new Error('Reward not available');
    }
    this.redeemedCount++;
  }

  // Getters
  getRewardId(): string { return this.rewardId; }
  getRewardName(): string { return this.rewardName; }
  getRewardType(): RewardType { return this.rewardType; }
  getPointsCost(): number { return this.pointsCost; }
  getCashValue(): number { return this.cashValue; }
  getValidityDays(): number { return this.validityDays; }
  getRemainingQuantity(): number | null {
    if (this.availableQuantity === null) return null;
    return this.availableQuantity - this.redeemedCount;
  }
}
```


### **Loyalty Service (Facade Pattern)**

```typescript
interface ILoyaltyRepository {
  saveMember(member: LoyaltyMember): Promise<void>;
  findMemberById(memberId: string): Promise<LoyaltyMember | null>;
  findMemberByUserId(userId: string): Promise<LoyaltyMember | null>;
  updateMember(member: LoyaltyMember): Promise<void>;
}

interface IPointsLedgerRepository {
  saveTransaction(transaction: PointsTransaction): Promise<void>;
  findTransactionByUUID(uuid: string): Promise<PointsTransaction | null>;
  findMemberTransactions(memberId: string, limit: number): Promise<PointsTransaction[]>;
}

interface INotificationService {
  notifyPointsEarned(member: LoyaltyMember, points: number): Promise<void>;
  notifyTierUpgrade(member: LoyaltyMember, newTier: LoyaltyTier): Promise<void>;
  notifyPointsExpiring(member: LoyaltyMember, points: number, expiryDate: Date): Promise<void>;
  notifyRewardRedeemed(member: LoyaltyMember, reward: Reward): Promise<void>;
}

class LoyaltyService {
  constructor(
    private memberRepository: ILoyaltyRepository,
    private ledgerRepository: IPointsLedgerRepository,
    private tierManager: TierManager,
    private pointsEngine: PointsEngine,
    private notificationService: INotificationService
  ) {}

  // Enroll new member
  async enrollMember(userId: string, programId: string): Promise<LoyaltyMember> {
    // Check if already enrolled
    const existing = await this.memberRepository.findMemberByUserId(userId);
    if (existing) {
      throw new Error('User already enrolled in loyalty program');
    }

    // Create member with bronze tier
    const bronzeTier = this.tierManager.getTier(TierLevel.BRONZE)!;
    const member = new LoyaltyMember(userId, programId, bronzeTier);

    await this.memberRepository.saveMember(member);
    return member;
  }

  // Award points for purchase
  async awardPointsForPurchase(
    userId: string,
    orderId: string,
    purchaseAmount: number,
    idempotencyKey: string
  ): Promise<PointsTransaction> {
    const member = await this.memberRepository.findMemberByUserId(userId);
    if (!member) {
      throw new Error('Member not found');
    }

    if (!member.isActive()) {
      throw new Error('Member account is not active');
    }

    // Calculate points with tier multiplier
    const points = this.pointsEngine.calculatePoints(purchaseAmount, member);

    // Create transaction
    const transaction = await this.pointsEngine.createTransaction(
      member,
      PointsTransactionType.EARN,
      points,
      `Points earned from order ${orderId}`,
      idempotencyKey,
      { orderId, purchaseAmount }
    );

    // Add pending points to member
    member.addPendingPoints(points, `Order ${orderId}`);
    member.addSpend(purchaseAmount);

    await this.memberRepository.updateMember(member);
    await this.ledgerRepository.saveTransaction(transaction);

    // Check tier qualification
    const newTier = this.tierManager.evaluateTier(member);
    if (newTier.getTierLevel() > member.getCurrentTier().getTierLevel()) {
      await this.notificationService.notifyTierUpgrade(member, newTier);
    }

    await this.notificationService.notifyPointsEarned(member, points);

    return transaction;
  }

  // Redeem reward
  async redeemReward(
    userId: string,
    reward: Reward
  ): Promise<{ member: LoyaltyMember; voucherCode: string }> {
    const member = await this.memberRepository.findMemberByUserId(userId);
    if (!member) {
      throw new Error('Member not found');
    }

    if (!member.isActive()) {
      throw new Error('Member account is not active');
    }

    // Check eligibility
    if (!reward.isEligible(member)) {
      throw new Error('Member not eligible for this reward');
    }

    // Deduct points
    const pointsCost = reward.getPointsCost();
    member.redeemPoints(pointsCost);

    // Create redemption transaction
    const idempotencyKey = `REDEEM_${member.getMemberId()}_${reward.getRewardId()}_${Date.now()}`;
    const transaction = await this.pointsEngine.createTransaction(
      member,
      PointsTransactionType.REDEEM,
      pointsCost,
      `Redeemed: ${reward.getRewardName()}`,
      idempotencyKey,
      { rewardId: reward.getRewardId() }
    );

    // Record redemption
    reward.recordRedemption();

    // Generate voucher code
    const voucherCode = this.generateVoucherCode();

    await this.memberRepository.updateMember(member);
    await this.ledgerRepository.saveTransaction(transaction);
    await this.notificationService.notifyRewardRedeemed(member, reward);

    return { member, voucherCode };
  }

  // Get member dashboard
  async getMemberDashboard(userId: string): Promise<{
    profile: MemberProfile;
    currentTier: LoyaltyTier;
    nextTier: LoyaltyTier | null;
    pointsToNextTier: number;
    recentTransactions: PointsTransaction[];
  }> {
    const member = await this.memberRepository.findMemberByUserId(userId);
    if (!member) {
      throw new Error('Member not found');
    }

    const currentTier = member.getCurrentTier();
    const nextTier = this.tierManager.getNextTier(currentTier);
    const pointsToNextTier = nextTier ? member.getPointsToNextTier(nextTier) : 0;
    const recentTransactions = await this.ledgerRepository.findMemberTransactions(
      member.getMemberId(),
      10
    );

    return {
      profile: member.getProfile(),
      currentTier,
      nextTier,
      pointsToNextTier,
      recentTransactions
    };
  }

  private generateVoucherCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
```


### **Usage Example**

```typescript
// Initialize services
const memberRepository: ILoyaltyRepository = new LoyaltyRepositoryImpl();
const ledgerRepository: IPointsLedgerRepository = new PointsLedgerRepositoryImpl();
const tierManager = new TierManager();
const pointsStrategy = new BasePointsStrategy(1); // 1 point per dollar
const pointsEngine = new PointsEngine(pointsStrategy);
const notificationService: INotificationService = new NotificationServiceImpl();

const loyaltyService = new LoyaltyService(
  memberRepository,
  ledgerRepository,
  tierManager,
  pointsEngine,
  notificationService
);

// Enroll new member
const member = await loyaltyService.enrollMember('user123', 'program1');
console.log('Member enrolled:', member.getMemberNumber());

// Award points for purchase
const transaction = await loyaltyService.awardPointsForPurchase(
  'user123',
  'ORD123456',
  5000, // ₹5000 purchase
  'idempotency_key_12345'
);
console.log('Points awarded:', transaction.pointsChange);

// Get member dashboard
const dashboard = await loyaltyService.getMemberDashboard('user123');
console.log('Current tier:', dashboard.currentTier.getTierName());
console.log('Available points:', dashboard.profile.availablePoints);
console.log('Points to next tier:', dashboard.pointsToNextTier);

// Redeem reward
const reward = new Reward(
  '₹500 Discount Coupon',
  'Get ₹500 off on your next purchase',
  RewardType.DISCOUNT_COUPON,
  2500, // Cost: 2500 points
  500,  // Value: ₹500
  TierLevel.SILVER // Min tier: Silver
);

const redemption = await loyaltyService.redeemReward('user123', reward);
console.log('Voucher code:', redemption.voucherCode);
```


## Key Design Patterns

1. **Strategy Pattern**: Points calculation strategies[^3][^1]
2. **Facade Pattern**: LoyaltyService simplifies complex subsystems[^1]
3. **State Pattern**: Member status lifecycle management
4. **Observer Pattern**: Event-driven notifications[^1]
5. **Repository Pattern**: Data access abstraction[^5]
6. **Factory Pattern**: Transaction creation with idempotency[^5]

This comprehensive design ensures scalability, maintainability, and provides a robust foundation for enterprise loyalty programs with millions of members.[^2][^6][^5][^3][^1]
<span style="display:none">[^10][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://www.voucherify.io/blog/architecture-of-customer-loyalty-software-a-guide-for-product-managers

[^2]: https://leetcode.com/discuss/interview-question/6017309/

[^3]: https://www.griddynamics.com/blog/building-modern-customer-loyalty-engine

[^4]: https://www.openloyalty.io/insider/how-to-build-loyalty-program

[^5]: https://www.zigpoll.com/content/what-strategies-can-be-implemented-in-our-ecommerce-platform-backend-to-handle-loyalty-program-reward-points-efficiently-for-returning-customers

[^6]: https://omnivy.io/blog/how-to-design-loyalty-architecture

[^7]: https://www.oracle.com/us/products/applications/siebel/047108.pdf

[^8]: https://www.mastercardservices.com/en/advisors/consumer-engagement-loyalty-consulting/insights/how-build-customer-loyalty-program

[^9]: https://www.relevantaudience.com/seo/boost-search-visibility-with-loyalty-program-schema/

[^10]: https://whitelabel-loyalty.com/blog/loyalty/how-to-design-a-loyalty-program-in-4-steps/

