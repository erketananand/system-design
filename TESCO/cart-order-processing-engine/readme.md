## Cart and Order Processing Engine

### **System Architecture**

```
┌──────────────────────────────────────────────────────────────┐
│               API Gateway + Load Balancer                    │
│         (Authentication, Rate Limiting, Routing)             │
└──────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼─────┐        ┌─────▼──────┐       ┌─────▼──────┐
   │  Cart    │        │  Order     │       │  Payment   │
   │ Service  │───────▶│ Service    │──────▶│  Service   │
   └────┬─────┘        └─────┬──────┘       └─────┬──────┘
        │                    │                     │
   ┌────▼─────┐        ┌─────▼──────┐       ┌─────▼──────┐
   │  Cart    │        │  Order     │       │  Payment   │
   │   DB     │        │   DB       │       │  Gateway   │
   │ (Redis)  │        │(Postgres)  │       │            │
   └──────────┘        └────────────┘       └────────────┘
        │                    │
        │              ┌─────▼──────┐
        └─────────────▶│ Inventory  │
                       │  Service   │
                       └─────┬──────┘
                             │
                    ┌────────┼────────┐
                    │                 │
             ┌──────▼──────┐   ┌─────▼──────┐
             │ Notification│   │ Analytics  │
             │  Service    │   │  Service   │
             └─────────────┘   └────────────┘
                    
   ┌──────────────────────────────────────────┐
   │  Message Queue (Kafka/RabbitMQ)          │
   │  - Order Events, Inventory Updates       │
   └──────────────────────────────────────────┘
```


### **Core Components**

### **1. Cart Service**

- **Responsibilities**: Manage shopping carts, calculate totals, apply discounts[^3] [^1]
- **Features**:
    - Add/update/remove items
    - Session-based (guest) and persistent (logged-in) carts
    - Real-time price updates
    - Cart abandonment tracking
- **Storage**: Redis for active carts (TTL: 24 hours), PostgreSQL for persistent storage[^1]
- **Performance**: <100ms response time, 50k+ concurrent carts


### **2. Order Service**

- **Responsibilities**: Order creation, state management, fulfillment orchestration[^2] [^4]
- **State Machine**: Cart → Pending → Confirmed → Processing → Shipped → Delivered[^5] [^6]
- **Features**:
    - Order validation and fraud checks
    - Inventory reservation
    - Saga pattern for distributed transactions
    - Order history and tracking
- **Database**: PostgreSQL with event sourcing for audit trail[^3]


### **3. Payment Service**

- **Responsibilities**: Payment processing, refunds, fraud detection[^4]
- **Integrations**: Razorpay, Stripe, PayPal
- **State Machine**: Pending → Authorized → Captured → Failed/Refunded[^6] [^5]
- **Security**: PCI-DSS compliance, tokenization, 3D Secure


### **4. Inventory Service**

- **Responsibilities**: Stock management, reservation, availability checks[^2] [^4]
- **Features**:
    - Real-time stock updates
    - Pessimistic locking for reservations
    - Automatic release after timeout
    - Low stock alerts


### **5. Notification Service**

- **Responsibilities**: Send order confirmations, updates, tracking info
- **Channels**: Email, SMS, Push notifications
- **Async Processing**: Message queue for reliability


### **Workflow: Cart to Order**

```
1. User adds items → Cart Service → Update Redis cache
2. User checks out → Cart Service validates → Order Service
3. Order Service creates order → Reserve inventory → Inventory Service
4. Payment processing → Payment Service → Payment Gateway
5. Payment success → Order confirmed → Release inventory reservation
6. Order fulfillment → Update order state → Notify user
7. Payment failure → Cancel order → Release inventory → Notify user
```


***

## Key Workflows

### **Workflow 1: Add Item to Cart**

```
┌─────────────┐
│   User      │
│ Clicks Add  │
│  to Cart    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. Frontend sends request               │
│    POST /api/cart/items                 │
│    { productId, variantId, quantity }   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 2. Cart Service validates request       │
│    - Check user authentication          │
│    - Validate product exists            │
│    - Check if variant is active         │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 3. Inventory Service: Check Availability│
│    GET /api/inventory/check             │
│    ?sku={variantId}&quantity={qty}      │
└──────┬──────────────────────────────────┘
       │
       ├─── Not Available ───┐
       │                     ▼
       │              ┌──────────────┐
       │              │ Return Error │
       │              │ "Out of Stock│
       │              └──────────────┘
       │
       └─── Available ───┐
                         ▼
┌─────────────────────────────────────────┐
│ 4. Get/Create Cart                      │
│    - If user logged in: find by UserID  │
│    - If guest: find by SessionID        │
│    - If no cart exists: create new cart │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 5. Add/Update Cart Item                 │
│    - If item exists: quantity += qty    │
│    - If new item: create CartItem       │
│    - Update cart.UpdatedAt              │
│    - Update cart.LastActivityAt         │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 6. Save to Database                     │
│    - INSERT/UPDATE CartItems            │
│    - UPDATE Carts SET UpdatedAt=NOW()   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 7. Update Redis Cache                   │
│    - SET cart:{cartId} {cartData} EX 86400│
│    - Extend TTL on activity             │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 8. Calculate Cart Totals                │
│    - Subtotal = sum(item.price * qty)   │
│    - Apply any active auto-coupons      │
│    - Calculate tax (if applicable)      │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 9. Return Response                      │
│    { cart, items, subtotal, itemCount } │
└─────────────────────────────────────────┘
```


***

### **Workflow 2: Checkout and Order Creation (Complete Flow)**

```
┌─────────────┐
│   User      │
│  Proceeds   │
│to Checkout  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ PHASE 1: Pre-Checkout Validation       │
└─────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. Validate Cart                        │
│    - Check cart not empty               │
│    - Verify all items still available   │
│    - Check prices haven't changed       │
│    - Validate minimum order value       │
└──────┬──────────────────────────────────┘
       │
       ├─── Invalid ───┐
       │               ▼
       │        ┌─────────────────┐
       │        │ Show Error      │
       │        │ "Price changed" │
       │        │ or "Out of stock│
       │        └─────────────────┘
       │
       └─── Valid ───┐
                     ▼
┌─────────────────────────────────────────┐
│ 2. Apply Coupons (if provided)          │
│    POST /api/coupons/validate            │
│    - Validate coupon code                │
│    - Check eligibility                   │
│    - Calculate discount                  │
│    - Update cart total                   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 3. Collect Checkout Information         │
│    - Shipping address                    │
│    - Billing address                     │
│    - Shipping method                     │
│    - Payment method                      │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ PHASE 2: Inventory Reservation          │
└─────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 4. Reserve Inventory (10 min hold)      │
│    POST /api/inventory/reserve           │
│    For each item in cart:                │
│      - Check available quantity          │
│      - Create reservation record         │
│      - UPDATE Inventory SET              │
│        available_qty = available_qty - qty│
│        reserved_qty = reserved_qty + qty │
│      - Store reservation_id in Redis     │
│        with TTL=600 seconds              │
└──────┬──────────────────────────────────┘
       │
       ├─── Reservation Failed ───┐
       │                           ▼
       │                    ┌──────────────┐
       │                    │ Rollback &   │
       │                    │ Show Error   │
       │                    └──────────────┘
       │
       └─── Reserved ───┐
                        ▼
┌─────────────────────────────────────────┐
│ PHASE 3: Order Creation (SAGA Pattern) │
└─────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 5. Create Order Record                  │
│    BEGIN TRANSACTION                     │
│    INSERT INTO Orders (                  │
│      OrderNumber, UserID, CartID,        │
│      Status='PENDING',                   │
│      PaymentStatus='PENDING',            │
│      SubtotalAmount, DiscountAmount,     │
│      TaxAmount, ShippingAmount,          │
│      TotalAmount, ShippingAddressID,     │
│      BillingAddressID                    │
│    )                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 6. Create Order Items                   │
│    For each cart item:                   │
│      INSERT INTO OrderItems (            │
│        OrderID, VariantID, ProductName,  │
│        SKU, Quantity, UnitPrice,         │
│        DiscountAmount, TotalPrice        │
│      )                                   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 7. Link Applied Coupons                 │
│    INSERT INTO OrderCoupons (            │
│      OrderID, CouponID, CouponCode,      │
│      DiscountApplied                     │
│    )                                     │
│    COMMIT TRANSACTION                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ PHASE 4: Payment Processing             │
└─────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 8. Initiate Payment                     │
│    POST /api/payments/process            │
│    { orderId, amount, paymentMethod }    │
│    - Call payment gateway (Stripe/Razorpay)│
│    - Store payment intent ID             │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 9. User Completes Payment               │
│    - Redirect to payment gateway         │
│    - User enters card details            │
│    - 3D Secure authentication            │
└──────┬──────────────────────────────────┘
       │
       ├─── Payment Failed ───┐
       │                      ▼
       │              ┌───────────────────┐
       │              │ 9a. Compensate    │
       │              │ - Release inventory│
       │              │ - UPDATE Orders    │
       │              │   SET Status=     │
       │              │   'CANCELLED'     │
       │              │ - Release coupons │
       │              │ - Notify user     │
       │              └───────────────────┘
       │
       └─── Payment Success ───┐
                                ▼
┌─────────────────────────────────────────┐
│ PHASE 5: Order Confirmation             │
└─────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 10. Update Order Status                 │
│     UPDATE Orders SET                    │
│       OrderStatus = 'CONFIRMED',         │
│       PaymentStatus = 'CAPTURED',        │
│       ConfirmedAt = NOW()                │
│     WHERE OrderID = ?                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 11. Commit Inventory Reservations       │
│     For each reservation:                │
│       UPDATE Inventory SET               │
│         reserved_qty = reserved_qty - qty│
│       WHERE ProductID = ?                │
│     - Delete reservation from Redis      │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 12. Record Coupon Redemption            │
│     INSERT INTO CouponRedemptionLog (    │
│       CouponID, UserID, OrderID,         │
│       DiscountApplied, Status='SUCCESS'  │
│     )                                    │
│     UPDATE Coupons SET                   │
│       CurrentUsageCount += 1             │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 13. Mark Cart as Converted              │
│     UPDATE Carts SET                     │
│       Status = 'CONVERTED'               │
│     WHERE CartID = ?                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 14. Create Order State History          │
│     INSERT INTO OrderStateHistory (      │
│       OrderID, ToStatus='CONFIRMED'      │
│     )                                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 15. Publish Events                      │
│     - order.created (Kafka)              │
│     - inventory.committed                │
│     - coupon.redeemed                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 16. Send Notifications                  │
│     - Email: Order confirmation          │
│     - SMS: Order summary                 │
│     - Push: "Order placed successfully"  │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 17. Return Success Response             │
│     { orderId, orderNumber, status,      │
│       estimatedDelivery, trackingURL }   │
└─────────────────────────────────────────┘
```


***

### **Workflow 3: Order Cancellation**

```
┌─────────────┐
│   User      │
│  Cancels    │
│   Order     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. Validate Cancellation Eligibility    │
│    - Check order status                  │
│    - Allow if: PENDING, CONFIRMED        │
│    - Deny if: SHIPPED, DELIVERED         │
│    - Check cancellation deadline         │
└──────┬──────────────────────────────────┘
       │
       ├─── Cannot Cancel ───┐
       │                     ▼
       │              ┌──────────────┐
       │              │ Return Error │
       │              │ "Cannot cancel│
       │              │ shipped orders│
       │              └──────────────┘
       │
       └─── Can Cancel ───┐
                          ▼
┌─────────────────────────────────────────┐
│ 2. Begin Compensation Transaction       │
│    BEGIN TRANSACTION                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 3. Update Order Status                  │
│    UPDATE Orders SET                     │
│      OrderStatus = 'CANCELLED',          │
│      CancelledAt = NOW()                 │
│    WHERE OrderID = ?                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 4. Refund Inventory                     │
│    For each order item:                  │
│      UPDATE Inventory SET                │
│        available_qty += item.quantity    │
│      WHERE VariantID = item.variantId    │
│    - Log refund transaction              │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 5. Reverse Coupon Usage                 │
│    UPDATE Coupons SET                    │
│      CurrentUsageCount -= 1              │
│    WHERE CouponID IN (                   │
│      SELECT CouponID FROM OrderCoupons   │
│      WHERE OrderID = ?                   │
│    )                                     │
│    UPDATE CouponRedemptionLog SET        │
│      Status = 'REVERSED'                 │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 6. Process Payment Refund               │
│    POST /api/payments/refund             │
│    { orderId, amount, reason }           │
│    - Call payment gateway refund API     │
│    - UPDATE Payments SET                 │
│        PaymentStatus = 'REFUNDED',       │
│        RefundAmount = TotalAmount,       │
│        RefundedAt = NOW()                │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 7. Create State History                 │
│    INSERT INTO OrderStateHistory (       │
│      OrderID, FromStatus='CONFIRMED',    │
│      ToStatus='CANCELLED',               │
│      ChangedBy, ChangeReason             │
│    )                                     │
│    COMMIT TRANSACTION                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 8. Publish Events                       │
│    - order.cancelled                     │
│    - inventory.refunded                  │
│    - payment.refunded                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 9. Send Notifications                   │
│    - Email: Cancellation confirmation    │
│    - SMS: "Order cancelled, refund in 5-7│
│            business days"                │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 10. Return Success Response             │
│     { status: 'CANCELLED',               │
│       refundAmount, refundETA }          │
└─────────────────────────────────────────┘
```

**Atomicity**: All-or-nothing with transaction rollback on failure

***

## Database Schema

### **Users Table**

```sql
CREATE TABLE Users (
    UserID BIGINT PRIMARY KEY AUTO_INCREMENT,
    Email VARCHAR(255) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    FirstName VARCHAR(100),
    LastName VARCHAR(100),
    PhoneNumber VARCHAR(20),
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    LastLoginAt TIMESTAMP,
    INDEX idx_email (Email),
    INDEX idx_phone (PhoneNumber)
);
```


### **Products Table**

```sql
CREATE TABLE Products (
    ProductID BIGINT PRIMARY KEY AUTO_INCREMENT,
    SKU VARCHAR(100) UNIQUE NOT NULL,
    ProductName VARCHAR(255) NOT NULL,
    Description TEXT,
    CategoryID BIGINT,
    BrandID BIGINT,
    BasePrice DECIMAL(10, 2) NOT NULL,
    Currency VARCHAR(3) DEFAULT 'INR',
    IsActive BOOLEAN DEFAULT TRUE,
    ImageURL VARCHAR(500),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sku (SKU),
    INDEX idx_category (CategoryID),
    INDEX idx_active (IsActive)
);
```


### **Product Variants Table**

```sql
CREATE TABLE ProductVariants (
    VariantID BIGINT PRIMARY KEY AUTO_INCREMENT,
    ProductID BIGINT NOT NULL,
    SKU VARCHAR(100) UNIQUE NOT NULL,
    VariantName VARCHAR(100),
    AttributesJSON JSON COMMENT '{"size": "L", "color": "Red"}',
    Price DECIMAL(10, 2) NOT NULL,
    CompareAtPrice DECIMAL(10, 2) COMMENT 'Original price for showing discount',
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
    INDEX idx_product (ProductID),
    INDEX idx_sku (SKU)
);
```


### **Inventory Table**

```sql
CREATE TABLE Inventory (
    InventoryID BIGINT PRIMARY KEY AUTO_INCREMENT,
    VariantID BIGINT UNIQUE NOT NULL,
    AvailableQuantity INT NOT NULL DEFAULT 0,
    ReservedQuantity INT NOT NULL DEFAULT 0,
    TotalQuantity INT GENERATED ALWAYS AS (AvailableQuantity + ReservedQuantity) STORED,
    LowStockThreshold INT DEFAULT 10,
    LastRestockedAt TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    Version INT DEFAULT 0 COMMENT 'For optimistic locking',
    FOREIGN KEY (VariantID) REFERENCES ProductVariants(VariantID) ON DELETE CASCADE,
    INDEX idx_variant (VariantID),
    INDEX idx_availability (AvailableQuantity),
    CHECK (AvailableQuantity >= 0),
    CHECK (ReservedQuantity >= 0)
);
```


### **Carts Table**

```sql
CREATE TABLE Carts (
    CartID BIGINT PRIMARY KEY AUTO_INCREMENT,
    CartUUID VARCHAR(36) UNIQUE NOT NULL,
    UserID BIGINT COMMENT 'NULL for guest carts',
    SessionID VARCHAR(100) NOT NULL,
    Status ENUM('ACTIVE', 'ABANDONED', 'CONVERTED', 'EXPIRED') DEFAULT 'ACTIVE',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    LastActivityAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ExpiresAt TIMESTAMP COMMENT 'Auto-expire after 24 hours of inactivity',
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    INDEX idx_user (UserID),
    INDEX idx_session (SessionID),
    INDEX idx_status_activity (Status, LastActivityAt),
    INDEX idx_uuid (CartUUID)
);
```


### **Cart Items Table**

```sql
CREATE TABLE CartItems (
    CartItemID BIGINT PRIMARY KEY AUTO_INCREMENT,
    CartID BIGINT NOT NULL,
    VariantID BIGINT NOT NULL,
    Quantity INT NOT NULL DEFAULT 1,
    Price DECIMAL(10, 2) NOT NULL COMMENT 'Price at time of adding',
    AddedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (CartID) REFERENCES Carts(CartID) ON DELETE CASCADE,
    FOREIGN KEY (VariantID) REFERENCES ProductVariants(VariantID) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_variant (CartID, VariantID),
    INDEX idx_cart (CartID),
    INDEX idx_variant (VariantID),
    CHECK (Quantity > 0)
);
```


### **Cart Coupons Junction Table**

```sql
CREATE TABLE CartCoupons (
    CartCouponID BIGINT PRIMARY KEY AUTO_INCREMENT,
    CartID BIGINT NOT NULL,
    CouponID BIGINT NOT NULL,
    AppliedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    DiscountCalculated DECIMAL(10, 2) DEFAULT 0.00,
    FOREIGN KEY (CartID) REFERENCES Carts(CartID) ON DELETE CASCADE,
    FOREIGN KEY (CouponID) REFERENCES Coupons(CouponID) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_coupon (CartID, CouponID),
    INDEX idx_cart (CartID)
);
```


### **Addresses Table**

```sql
CREATE TABLE Addresses (
    AddressID BIGINT PRIMARY KEY AUTO_INCREMENT,
    UserID BIGINT NOT NULL,
    RecipientName VARCHAR(100) NOT NULL,
    AddressLine1 VARCHAR(255) NOT NULL,
    AddressLine2 VARCHAR(255),
    City VARCHAR(100) NOT NULL,
    State VARCHAR(100) NOT NULL,
    PostalCode VARCHAR(20) NOT NULL,
    Country VARCHAR(100) NOT NULL,
    PhoneNumber VARCHAR(20) NOT NULL,
    IsDefault BOOLEAN DEFAULT FALSE,
    AddressType ENUM('SHIPPING', 'BILLING', 'BOTH') DEFAULT 'BOTH',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    INDEX idx_user (UserID),
    INDEX idx_default (UserID, IsDefault)
);
```


### **Orders Table**

```sql
CREATE TABLE Orders (
    OrderID BIGINT PRIMARY KEY AUTO_INCREMENT,
    OrderNumber VARCHAR(20) UNIQUE NOT NULL,
    UserID BIGINT NOT NULL,
    CartID BIGINT COMMENT 'Reference to original cart',
    OrderStatus ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED') DEFAULT 'PENDING',
    PaymentStatus ENUM('PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
    ShipmentStatus ENUM('PENDING', 'READY', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED') DEFAULT 'PENDING',
    
    -- Price breakdown
    SubtotalAmount DECIMAL(12, 2) NOT NULL,
    DiscountAmount DECIMAL(10, 2) DEFAULT 0.00,
    TaxAmount DECIMAL(10, 2) DEFAULT 0.00,
    ShippingAmount DECIMAL(10, 2) DEFAULT 0.00,
    TotalAmount DECIMAL(12, 2) NOT NULL,
    Currency VARCHAR(3) DEFAULT 'INR',
    
    -- Addresses
    ShippingAddressID BIGINT NOT NULL,
    BillingAddressID BIGINT NOT NULL,
    
    -- Payment info
    PaymentMethod VARCHAR(50),
    PaymentID VARCHAR(100) COMMENT 'External payment gateway ID',
    TransactionID VARCHAR(100),
    
    -- Tracking
    TrackingNumber VARCHAR(100),
    CourierService VARCHAR(100),
    EstimatedDeliveryDate DATE,
    
    -- Timestamps
    OrderDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ConfirmedAt TIMESTAMP,
    ShippedAt TIMESTAMP,
    DeliveredAt TIMESTAMP,
    CancelledAt TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (CartID) REFERENCES Carts(CartID) ON DELETE SET NULL,
    FOREIGN KEY (ShippingAddressID) REFERENCES Addresses(AddressID) ON DELETE RESTRICT,
    FOREIGN KEY (BillingAddressID) REFERENCES Addresses(AddressID) ON DELETE RESTRICT,
    
    INDEX idx_user_orders (UserID, OrderDate DESC),
    INDEX idx_order_number (OrderNumber),
    INDEX idx_order_status (OrderStatus, OrderDate),
    INDEX idx_payment_status (PaymentStatus),
    INDEX idx_tracking (TrackingNumber)
);
```


### **Order Items Table**

```sql
CREATE TABLE OrderItems (
    OrderItemID BIGINT PRIMARY KEY AUTO_INCREMENT,
    OrderID BIGINT NOT NULL,
    VariantID BIGINT NOT NULL,
    
    -- Denormalized product info (historical record)
    ProductName VARCHAR(255) NOT NULL,
    SKU VARCHAR(100) NOT NULL,
    VariantAttributes JSON,
    ProductImageURL VARCHAR(500),
    
    -- Pricing
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(10, 2) NOT NULL,
    DiscountAmount DECIMAL(10, 2) DEFAULT 0.00,
    TaxAmount DECIMAL(10, 2) DEFAULT 0.00,
    TotalPrice DECIMAL(12, 2) NOT NULL,
    
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE,
    FOREIGN KEY (VariantID) REFERENCES ProductVariants(VariantID) ON DELETE RESTRICT,
    INDEX idx_order (OrderID),
    INDEX idx_variant (VariantID),
    CHECK (Quantity > 0)
);
```


### **Order Coupons Applied Table**

```sql
CREATE TABLE OrderCoupons (
    OrderCouponID BIGINT PRIMARY KEY AUTO_INCREMENT,
    OrderID BIGINT NOT NULL,
    CouponID BIGINT NOT NULL,
    CouponCode VARCHAR(50) NOT NULL,
    DiscountApplied DECIMAL(10, 2) NOT NULL,
    AppliedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE,
    FOREIGN KEY (CouponID) REFERENCES Coupons(CouponID) ON DELETE RESTRICT,
    INDEX idx_order (OrderID),
    INDEX idx_coupon (CouponID)
);
```


### **Order State History Table (Audit Trail)**

```sql
CREATE TABLE OrderStateHistory (
    HistoryID BIGINT PRIMARY KEY AUTO_INCREMENT,
    OrderID BIGINT NOT NULL,
    FromStatus ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'),
    ToStatus ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED') NOT NULL,
    ChangedBy VARCHAR(100) COMMENT 'User or system who changed the status',
    ChangeReason TEXT,
    ChangedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Metadata JSON COMMENT 'Additional context about the change',
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE,
    INDEX idx_order_history (OrderID, ChangedAt)
);
```


### **Inventory Reservations Table**

```sql
CREATE TABLE InventoryReservations (
    ReservationID BIGINT PRIMARY KEY AUTO_INCREMENT,
    ReservationUUID VARCHAR(36) UNIQUE NOT NULL,
    OrderID BIGINT COMMENT 'NULL during checkout, filled after order creation',
    CartID BIGINT,
    VariantID BIGINT NOT NULL,
    QuantityReserved INT NOT NULL,
    Status ENUM('ACTIVE', 'CONFIRMED', 'RELEASED', 'EXPIRED') DEFAULT 'ACTIVE',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ExpiresAt TIMESTAMP NOT NULL COMMENT 'Auto-release after 10 minutes',
    ReleasedAt TIMESTAMP,
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE SET NULL,
    FOREIGN KEY (CartID) REFERENCES Carts(CartID) ON DELETE CASCADE,
    FOREIGN KEY (VariantID) REFERENCES ProductVariants(VariantID) ON DELETE CASCADE,
    INDEX idx_order (OrderID),
    INDEX idx_variant_status (VariantID, Status),
    INDEX idx_expiry (ExpiresAt, Status),
    CHECK (QuantityReserved > 0)
);
```


### **Payments Table**

```sql
CREATE TABLE Payments (
    PaymentID BIGINT PRIMARY KEY AUTO_INCREMENT,
    OrderID BIGINT UNIQUE NOT NULL,
    PaymentMethod ENUM('CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING', 'WALLET', 'COD') NOT NULL,
    Amount DECIMAL(12, 2) NOT NULL,
    Currency VARCHAR(3) DEFAULT 'INR',
    PaymentGateway VARCHAR(50) COMMENT 'Razorpay, Stripe, etc.',
    GatewayPaymentID VARCHAR(100) UNIQUE,
    GatewayTransactionID VARCHAR(100),
    PaymentStatus ENUM('PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
    FailureReason TEXT,
    RefundAmount DECIMAL(12, 2),
    RefundedAt TIMESTAMP,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE,
    INDEX idx_gateway_payment (GatewayPaymentID),
    INDEX idx_status (PaymentStatus),
    INDEX idx_order (OrderID)
);
```

## Key Schema Relationships

1. **Users** ← (1:N) → **Carts**: User can have multiple carts (active, abandoned)
2. **Carts** ← (1:N) → **CartItems**: Cart contains multiple items
3. **Carts** ← (N:M) → **Coupons**: Many-to-many via **CartCoupons**
4. **Carts** ← (1:1) → **Orders**: Cart converts to order on checkout
5. **Orders** ← (1:N) → **OrderItems**: Order contains multiple items
6. **Orders** ← (1:1) → **Payments**: Each order has one payment record
7. **Orders** ← (N:M) → **Coupons**: Many-to-many via **OrderCoupons**
8. **ProductVariants** ← (1:1) → **Inventory**: Each variant has inventory record
9. **Orders** ← (1:N) → **OrderStateHistory**: Full state transition audit trail

### **Key Indexes for Performance**

- **Carts**: `(Status, LastActivityAt)` for abandoned cart cleanup
- **Orders**: `(UserID, OrderDate DESC)` for user order history
- **OrderItems**: `(OrderID)` for fast order details retrieval
- **InventoryReservations**: `(ExpiresAt, Status)` for cleanup jobs
- **CartItems**: `(CartID, VariantID)` unique constraint prevents duplicates


***

## Low-Level Design (LLD) - TypeScript

### **Domain Models and Types**

```typescript
// Enums
enum CartStatus {
  ACTIVE = 'ACTIVE',
  ABANDONED = 'ABANDONED',
  CONVERTED = 'CONVERTED',
  EXPIRED = 'EXPIRED'
}

enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

enum PaymentStatus {
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  CAPTURED = 'CAPTURED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

enum ShipmentStatus {
  PENDING = 'PENDING',
  READY = 'READY',
  SHIPPED = 'SHIPPED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED'
}

// Interfaces
interface Address {
  id: string;
  recipientName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
}

interface ProductInfo {
  productId: string;
  variantId: string;
  name: string;
  sku: string;
  price: number;
  imageUrl?: string;
  attributes?: Record<string, string>; // { size: 'L', color: 'Red' }
}

interface CartItemData {
  productInfo: ProductInfo;
  quantity: number;
  addedAt: Date;
}

interface PriceBreakdown {
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
}
```


### **Cart Item Entity**

```typescript
class CartItem {
  readonly id: string;
  private productInfo: ProductInfo;
  private quantity: number;
  private addedAt: Date;
  private updatedAt: Date;

  constructor(data: CartItemData) {
    this.id = this.generateId();
    this.productInfo = data.productInfo;
    this.quantity = data.quantity;
    this.addedAt = data.addedAt;
    this.updatedAt = new Date();
  }

  private generateId(): string {
    return `ITEM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Getters
  getProductInfo(): ProductInfo { return { ...this.productInfo }; }
  getQuantity(): number { return this.quantity; }
  getItemTotal(): number { return this.productInfo.price * this.quantity; }
  getProductId(): string { return this.productInfo.productId; }
  getVariantId(): string { return this.productInfo.variantId; }

  // Update quantity
  updateQuantity(newQuantity: number): void {
    if (newQuantity <= 0) {
      throw new Error('Quantity must be positive');
    }
    this.quantity = newQuantity;
    this.updatedAt = new Date();
  }

  // Update price (for price changes)
  updatePrice(newPrice: number): void {
    if (newPrice < 0) {
      throw new Error('Price cannot be negative');
    }
    this.productInfo.price = newPrice;
    this.updatedAt = new Date();
  }

  // Serialize for storage
  toJSON(): object {
    return {
      id: this.id,
      productInfo: this.productInfo,
      quantity: this.quantity,
      addedAt: this.addedAt,
      updatedAt: this.updatedAt
    };
  }
}
```


### **Shopping Cart Entity**

```typescript
class ShoppingCart {
  readonly cartId: string;
  private userId: string | null; // null for guest carts
  private sessionId: string;
  private items: Map<string, CartItem>; // variantId -> CartItem
  private status: CartStatus;
  private appliedCoupons: string[];
  private createdAt: Date;
  private updatedAt: Date;
  private lastActivityAt: Date;

  constructor(userId: string | null, sessionId: string) {
    this.cartId = this.generateCartId();
    this.userId = userId;
    this.sessionId = sessionId;
    this.items = new Map();
    this.status = CartStatus.ACTIVE;
    this.appliedCoupons = [];
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.lastActivityAt = new Date();
  }

  private generateCartId(): string {
    return `CART_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Add item to cart
  addItem(productInfo: ProductInfo, quantity: number): void {
    this.validateActiveCart();
    
    const variantId = productInfo.variantId;
    const existingItem = this.items.get(variantId);

    if (existingItem) {
      // Update existing item quantity
      existingItem.updateQuantity(existingItem.getQuantity() + quantity);
    } else {
      // Add new item
      const cartItem = new CartItem({
        productInfo,
        quantity,
        addedAt: new Date()
      });
      this.items.set(variantId, cartItem);
    }

    this.updateActivity();
  }

  // Update item quantity
  updateItemQuantity(variantId: string, quantity: number): void {
    this.validateActiveCart();
    
    const item = this.items.get(variantId);
    if (!item) {
      throw new Error(`Item with variantId ${variantId} not found in cart`);
    }

    if (quantity <= 0) {
      this.removeItem(variantId);
    } else {
      item.updateQuantity(quantity);
      this.updateActivity();
    }
  }

  // Remove item from cart
  removeItem(variantId: string): void {
    this.validateActiveCart();
    
    if (!this.items.has(variantId)) {
      throw new Error(`Item with variantId ${variantId} not found in cart`);
    }

    this.items.delete(variantId);
    this.updateActivity();
  }

  // Clear cart
  clear(): void {
    this.items.clear();
    this.appliedCoupons = [];
    this.updateActivity();
  }

  // Apply coupon
  applyCoupon(couponCode: string): void {
    if (!this.appliedCoupons.includes(couponCode)) {
      this.appliedCoupons.push(couponCode);
      this.updateActivity();
    }
  }

  // Remove coupon
  removeCoupon(couponCode: string): void {
    const index = this.appliedCoupons.indexOf(couponCode);
    if (index > -1) {
      this.appliedCoupons.splice(index, 1);
      this.updateActivity();
    }
  }

  // Calculate subtotal
  calculateSubtotal(): number {
    let subtotal = 0;
    this.items.forEach(item => {
      subtotal += item.getItemTotal();
    });
    return subtotal;
  }

  // Get all items
  getItems(): CartItem[] {
    return Array.from(this.items.values());
  }

  // Get item count
  getItemCount(): number {
    let count = 0;
    this.items.forEach(item => {
      count += item.getQuantity();
    });
    return count;
  }

  // Check if cart is empty
  isEmpty(): boolean {
    return this.items.size === 0;
  }

  // Getters
  getCartId(): string { return this.cartId; }
  getUserId(): string | null { return this.userId; }
  getStatus(): CartStatus { return this.status; }
  getAppliedCoupons(): string[] { return [...this.appliedCoupons]; }

  // Mark cart as converted to order
  markAsConverted(): void {
    this.status = CartStatus.CONVERTED;
    this.updatedAt = new Date();
  }

  // Mark cart as abandoned
  markAsAbandoned(): void {
    this.status = CartStatus.ABANDONED;
    this.updatedAt = new Date();
  }

  // Associate cart with user (for guest to logged-in conversion)
  associateWithUser(userId: string): void {
    if (this.userId) {
      throw new Error('Cart already associated with a user');
    }
    this.userId = userId;
    this.updatedAt = new Date();
  }

  private validateActiveCart(): void {
    if (this.status !== CartStatus.ACTIVE) {
      throw new Error(`Cannot modify cart with status: ${this.status}`);
    }
  }

  private updateActivity(): void {
    this.lastActivityAt = new Date();
    this.updatedAt = new Date();
  }

  // Serialize for storage
  toJSON(): object {
    return {
      cartId: this.cartId,
      userId: this.userId,
      sessionId: this.sessionId,
      items: Array.from(this.items.values()).map(item => item.toJSON()),
      status: this.status,
      appliedCoupons: this.appliedCoupons,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastActivityAt: this.lastActivityAt
    };
  }
}
```


### **Order Entity with State Machine**

```typescript
// State Machine Pattern for Order
interface OrderState {
  status: OrderStatus;
  canTransitionTo(newStatus: OrderStatus): boolean;
  onEntry(order: Order): void;
  onExit(order: Order): void;
}

// Concrete States
class PendingOrderState implements OrderState {
  status = OrderStatus.PENDING;

  canTransitionTo(newStatus: OrderStatus): boolean {
    return [OrderStatus.CONFIRMED, OrderStatus.CANCELLED].includes(newStatus);
  }

  onEntry(order: Order): void {
    console.log(`Order ${order.getOrderId()} is now pending payment`);
  }

  onExit(order: Order): void {
    console.log(`Order ${order.getOrderId()} leaving pending state`);
  }
}

class ConfirmedOrderState implements OrderState {
  status = OrderStatus.CONFIRMED;

  canTransitionTo(newStatus: OrderStatus): boolean {
    return [OrderStatus.PROCESSING, OrderStatus.CANCELLED].includes(newStatus);
  }

  onEntry(order: Order): void {
    console.log(`Order ${order.getOrderId()} confirmed. Starting processing`);
  }

  onExit(order: Order): void {}
}

class ProcessingOrderState implements OrderState {
  status = OrderStatus.PROCESSING;

  canTransitionTo(newStatus: OrderStatus): boolean {
    return [OrderStatus.SHIPPED, OrderStatus.CANCELLED].includes(newStatus);
  }

  onEntry(order: Order): void {
    console.log(`Order ${order.getOrderId()} is being processed`);
  }

  onExit(order: Order): void {}
}

class ShippedOrderState implements OrderState {
  status = OrderStatus.SHIPPED;

  canTransitionTo(newStatus: OrderStatus): boolean {
    return [OrderStatus.DELIVERED].includes(newStatus);
  }

  onEntry(order: Order): void {
    console.log(`Order ${order.getOrderId()} has been shipped`);
  }

  onExit(order: Order): void {}
}

class DeliveredOrderState implements OrderState {
  status = OrderStatus.DELIVERED;

  canTransitionTo(newStatus: OrderStatus): boolean {
    return [OrderStatus.REFUNDED].includes(newStatus);
  }

  onEntry(order: Order): void {
    console.log(`Order ${order.getOrderId()} has been delivered`);
  }

  onExit(order: Order): void {}
}

class CancelledOrderState implements OrderState {
  status = OrderStatus.CANCELLED;

  canTransitionTo(newStatus: OrderStatus): boolean {
    return false; // Terminal state
  }

  onEntry(order: Order): void {
    console.log(`Order ${order.getOrderId()} has been cancelled`);
  }

  onExit(order: Order): void {}
}

// Order Item
interface OrderItem {
  orderItemId: string;
  productInfo: ProductInfo;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

// Order Entity
class Order {
  readonly orderId: string;
  readonly orderNumber: string;
  private userId: string;
  private cartId: string;
  
  private items: OrderItem[];
  private priceBreakdown: PriceBreakdown;
  
  private currentState: OrderState;
  private stateHistory: Array<{ status: OrderStatus; timestamp: Date }>;
  
  private paymentStatus: PaymentStatus;
  private shipmentStatus: ShipmentStatus;
  
  private shippingAddress: Address;
  private billingAddress: Address;
  
  private createdAt: Date;
  private updatedAt: Date;
  
  private paymentId?: string;
  private trackingNumber?: string;

  constructor(
    userId: string,
    cartId: string,
    items: OrderItem[],
    priceBreakdown: PriceBreakdown,
    shippingAddress: Address,
    billingAddress: Address
  ) {
    this.orderId = this.generateOrderId();
    this.orderNumber = this.generateOrderNumber();
    this.userId = userId;
    this.cartId = cartId;
    this.items = items;
    this.priceBreakdown = priceBreakdown;
    this.currentState = new PendingOrderState();
    this.stateHistory = [{ status: OrderStatus.PENDING, timestamp: new Date() }];
    this.paymentStatus = PaymentStatus.PENDING;
    this.shipmentStatus = ShipmentStatus.PENDING;
    this.shippingAddress = shippingAddress;
    this.billingAddress = billingAddress;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    
    this.currentState.onEntry(this);
  }

  private generateOrderId(): string {
    return `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD${timestamp}${random}`;
  }

  // State transition
  transitionTo(newStatus: OrderStatus): void {
    if (!this.currentState.canTransitionTo(newStatus)) {
      throw new Error(
        `Invalid state transition from ${this.currentState.status} to ${newStatus}`
      );
    }

    this.currentState.onExit(this);
    
    // Create new state based on status
    switch (newStatus) {
      case OrderStatus.CONFIRMED:
        this.currentState = new ConfirmedOrderState();
        break;
      case OrderStatus.PROCESSING:
        this.currentState = new ProcessingOrderState();
        break;
      case OrderStatus.SHIPPED:
        this.currentState = new ShippedOrderState();
        break;
      case OrderStatus.DELIVERED:
        this.currentState = new DeliveredOrderState();
        break;
      case OrderStatus.CANCELLED:
        this.currentState = new CancelledOrderState();
        break;
      default:
        throw new Error(`Unknown order status: ${newStatus}`);
    }

    this.stateHistory.push({ status: newStatus, timestamp: new Date() });
    this.updatedAt = new Date();
    this.currentState.onEntry(this);
  }

  // Payment methods
  updatePaymentStatus(status: PaymentStatus, paymentId?: string): void {
    this.paymentStatus = status;
    if (paymentId) {
      this.paymentId = paymentId;
    }
    this.updatedAt = new Date();

    // Auto-transition based on payment status
    if (status === PaymentStatus.CAPTURED && this.getStatus() === OrderStatus.PENDING) {
      this.transitionTo(OrderStatus.CONFIRMED);
    } else if (status === PaymentStatus.FAILED) {
      this.transitionTo(OrderStatus.CANCELLED);
    }
  }

  // Shipment methods
  updateShipmentStatus(status: ShipmentStatus, trackingNumber?: string): void {
    this.shipmentStatus = status;
    if (trackingNumber) {
      this.trackingNumber = trackingNumber;
    }
    this.updatedAt = new Date();

    // Auto-transition based on shipment status
    if (status === ShipmentStatus.SHIPPED && this.getStatus() === OrderStatus.PROCESSING) {
      this.transitionTo(OrderStatus.SHIPPED);
    } else if (status === ShipmentStatus.DELIVERED && this.getStatus() === OrderStatus.SHIPPED) {
      this.transitionTo(OrderStatus.DELIVERED);
    }
  }

  // Cancel order
  cancel(reason: string): void {
    if (this.getStatus() === OrderStatus.DELIVERED) {
      throw new Error('Cannot cancel delivered order. Please initiate return.');
    }
    this.transitionTo(OrderStatus.CANCELLED);
  }

  // Getters
  getOrderId(): string { return this.orderId; }
  getOrderNumber(): string { return this.orderNumber; }
  getUserId(): string { return this.userId; }
  getStatus(): OrderStatus { return this.currentState.status; }
  getPaymentStatus(): PaymentStatus { return this.paymentStatus; }
  getShipmentStatus(): ShipmentStatus { return this.shipmentStatus; }
  getItems(): OrderItem[] { return [...this.items]; }
  getPriceBreakdown(): PriceBreakdown { return { ...this.priceBreakdown }; }
  getTotal(): number { return this.priceBreakdown.total; }
  getTrackingNumber(): string | undefined { return this.trackingNumber; }
  getStateHistory(): Array<{ status: OrderStatus; timestamp: Date }> {
    return [...this.stateHistory];
  }

  // Serialize for storage
  toJSON(): object {
    return {
      orderId: this.orderId,
      orderNumber: this.orderNumber,
      userId: this.userId,
      cartId: this.cartId,
      items: this.items,
      priceBreakdown: this.priceBreakdown,
      status: this.currentState.status,
      stateHistory: this.stateHistory,
      paymentStatus: this.paymentStatus,
      shipmentStatus: this.shipmentStatus,
      shippingAddress: this.shippingAddress,
      billingAddress: this.billingAddress,
      paymentId: this.paymentId,
      trackingNumber: this.trackingNumber,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
```


### **Cart Service**

```typescript
interface ICartRepository {
  save(cart: ShoppingCart): Promise<void>;
  findById(cartId: string): Promise<ShoppingCart | null>;
  findByUserId(userId: string): Promise<ShoppingCart | null>;
  findBySessionId(sessionId: string): Promise<ShoppingCart | null>;
  delete(cartId: string): Promise<void>;
}

interface IPriceCalculator {
  calculatePriceBreakdown(cart: ShoppingCart, coupons: string[]): Promise<PriceBreakdown>;
}

interface IInventoryService {
  checkAvailability(variantId: string, quantity: number): Promise<boolean>;
  reserveStock(items: Array<{ variantId: string; quantity: number }>): Promise<string>; // Returns reservationId
  releaseReservation(reservationId: string): Promise<void>;
}

class CartService {
  constructor(
    private cartRepository: ICartRepository,
    private priceCalculator: IPriceCalculator,
    private inventoryService: IInventoryService
  ) {}

  // Create or get cart
  async getOrCreateCart(userId: string | null, sessionId: string): Promise<ShoppingCart> {
    let cart: ShoppingCart | null = null;

    if (userId) {
      cart = await this.cartRepository.findByUserId(userId);
    } else {
      cart = await this.cartRepository.findBySessionId(sessionId);
    }

    if (!cart) {
      cart = new ShoppingCart(userId, sessionId);
      await this.cartRepository.save(cart);
    }

    return cart;
  }

  // Add item to cart
  async addItemToCart(
    cartId: string,
    productInfo: ProductInfo,
    quantity: number
  ): Promise<ShoppingCart> {
    const cart = await this.cartRepository.findById(cartId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    // Check inventory availability
    const isAvailable = await this.inventoryService.checkAvailability(
      productInfo.variantId,
      quantity
    );

    if (!isAvailable) {
      throw new Error('Product not available in requested quantity');
    }

    cart.addItem(productInfo, quantity);
    await this.cartRepository.save(cart);

    return cart;
  }

  // Update item quantity
  async updateItemQuantity(
    cartId: string,
    variantId: string,
    quantity: number
  ): Promise<ShoppingCart> {
    const cart = await this.cartRepository.findById(cartId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    if (quantity > 0) {
      const isAvailable = await this.inventoryService.checkAvailability(variantId, quantity);
      if (!isAvailable) {
        throw new Error('Product not available in requested quantity');
      }
    }

    cart.updateItemQuantity(variantId, quantity);
    await this.cartRepository.save(cart);

    return cart;
  }

  // Remove item
  async removeItemFromCart(cartId: string, variantId: string): Promise<ShoppingCart> {
    const cart = await this.cartRepository.findById(cartId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    cart.removeItem(variantId);
    await this.cartRepository.save(cart);

    return cart;
  }

  // Apply coupon
  async applyCoupon(cartId: string, couponCode: string): Promise<ShoppingCart> {
    const cart = await this.cartRepository.findById(cartId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    // Validate coupon through coupon service (not shown here)
    cart.applyCoupon(couponCode);
    await this.cartRepository.save(cart);

    return cart;
  }

  // Get cart with calculated prices
  async getCartWithPrices(cartId: string): Promise<{
    cart: ShoppingCart;
    priceBreakdown: PriceBreakdown;
  }> {
    const cart = await this.cartRepository.findById(cartId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    const priceBreakdown = await this.priceCalculator.calculatePriceBreakdown(
      cart,
      cart.getAppliedCoupons()
    );

    return { cart, priceBreakdown };
  }

  // Clear cart
  async clearCart(cartId: string): Promise<void> {
    const cart = await this.cartRepository.findById(cartId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    cart.clear();
    await this.cartRepository.save(cart);
  }

  // Merge guest cart with user cart on login
  async mergeGuestCart(guestSessionId: string, userId: string): Promise<ShoppingCart> {
    const guestCart = await this.cartRepository.findBySessionId(guestSessionId);
    const userCart = await this.cartRepository.findByUserId(userId);

    if (!guestCart) {
      if (userCart) return userCart;
      return new ShoppingCart(userId, guestSessionId);
    }

    if (!userCart) {
      guestCart.associateWithUser(userId);
      await this.cartRepository.save(guestCart);
      return guestCart;
    }

    // Merge items from guest cart to user cart
    guestCart.getItems().forEach(item => {
      userCart.addItem(item.getProductInfo(), item.getQuantity());
    });

    await this.cartRepository.save(userCart);
    await this.cartRepository.delete(guestCart.getCartId());

    return userCart;
  }
}
```


### **Order Service with Saga Pattern**

```typescript
interface IOrderRepository {
  save(order: Order): Promise<void>;
  findById(orderId: string): Promise<Order | null>;
  findByUserId(userId: string): Promise<Order[]>;
  update(order: Order): Promise<void>;
}

interface IPaymentService {
  processPayment(orderId: string, amount: number, paymentMethod: string): Promise<{
    success: boolean;
    paymentId: string;
    transactionId?: string;
  }>;
  refundPayment(paymentId: string): Promise<void>;
}

interface INotificationService {
  sendOrderConfirmation(order: Order): Promise<void>;
  sendOrderUpdate(order: Order): Promise<void>;
}

// Saga pattern for order processing
class OrderProcessingSaga {
  private compensations: Array<() => Promise<void>> = [];

  constructor(
    private inventoryService: IInventoryService,
    private paymentService: IPaymentService,
    private notificationService: INotificationService
  ) {}

  async execute(cart: ShoppingCart, orderData: {
    shippingAddress: Address;
    billingAddress: Address;
    paymentMethod: string;
  }): Promise<Order> {
    let reservationId: string | undefined;
    let paymentId: string | undefined;

    try {
      // Step 1: Reserve inventory
      const items = cart.getItems().map(item => ({
        variantId: item.getVariantId(),
        quantity: item.getQuantity()
      }));

      reservationId = await this.inventoryService.reserveStock(items);
      this.compensations.push(async () => {
        if (reservationId) {
          await this.inventoryService.releaseReservation(reservationId);
        }
      });

      // Step 2: Create order
      const orderItems: OrderItem[] = cart.getItems().map(item => ({
        orderItemId: `OITEM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productInfo: item.getProductInfo(),
        quantity: item.getQuantity(),
        unitPrice: item.getProductInfo().price,
        discount: 0,
        total: item.getItemTotal()
      }));

      const priceBreakdown: PriceBreakdown = {
        subtotal: cart.calculateSubtotal(),
        discount: 0,
        tax: cart.calculateSubtotal() * 0.18, // 18% GST
        shipping: 50,
        total: 0
      };
      priceBreakdown.total = priceBreakdown.subtotal - priceBreakdown.discount + 
                             priceBreakdown.tax + priceBreakdown.shipping;

      const order = new Order(
        cart.getUserId()!,
        cart.getCartId(),
        orderItems,
        priceBreakdown,
        orderData.shippingAddress,
        orderData.billingAddress
      );

      // Step 3: Process payment
      const paymentResult = await this.paymentService.processPayment(
        order.getOrderId(),
        priceBreakdown.total,
        orderData.paymentMethod
      );

      if (!paymentResult.success) {
        throw new Error('Payment processing failed');
      }

      paymentId = paymentResult.paymentId;
      this.compensations.push(async () => {
        if (paymentId) {
          await this.paymentService.refundPayment(paymentId);
        }
      });

      // Step 4: Update order with payment info
      order.updatePaymentStatus(PaymentStatus.CAPTURED, paymentId);

      // Step 5: Send confirmation
      await this.notificationService.sendOrderConfirmation(order);

      // Step 6: Mark cart as converted
      cart.markAsConverted();

      return order;

    } catch (error) {
      // Execute compensating transactions in reverse order
      console.error('Order processing failed, executing compensations:', error);
      for (let i = this.compensations.length - 1; i >= 0; i--) {
        try {
          await this.compensations[i]();
        } catch (compensationError) {
          console.error('Compensation failed:', compensationError);
        }
      }
      throw error;
    }
  }
}

class OrderService {
  constructor(
    private orderRepository: IOrderRepository,
    private cartService: CartService,
    private inventoryService: IInventoryService,
    private paymentService: IPaymentService,
    private notificationService: INotificationService
  ) {}

  // Create order from cart
  async createOrder(
    cartId: string,
    orderData: {
      shippingAddress: Address;
      billingAddress: Address;
      paymentMethod: string;
    }
  ): Promise<Order> {
    const { cart } = await this.cartService.getCartWithPrices(cartId);

    if (cart.isEmpty()) {
      throw new Error('Cannot create order from empty cart');
    }

    if (!cart.getUserId()) {
      throw new Error('User must be logged in to place order');
    }

    // Execute saga
    const saga = new OrderProcessingSaga(
      this.inventoryService,
      this.paymentService,
      this.notificationService
    );

    const order = await saga.execute(cart, orderData);
    await this.orderRepository.save(order);

    return order;
  }

  // Get order by ID
  async getOrderById(orderId: string): Promise<Order | null> {
    return this.orderRepository.findById(orderId);
  }

  // Get user orders
  async getUserOrders(userId: string): Promise<Order[]> {
    return this.orderRepository.findByUserId(userId);
  }

  // Update order status
  async updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    order.transitionTo(newStatus);
    await this.orderRepository.update(order);
    await this.notificationService.sendOrderUpdate(order);

    return order;
  }

  // Cancel order
  async cancelOrder(orderId: string, reason: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    order.cancel(reason);
    await this.orderRepository.update(order);

    // Refund payment if captured
    if (order.getPaymentStatus() === PaymentStatus.CAPTURED) {
      // Trigger refund process (async)
    }

    await this.notificationService.sendOrderUpdate(order);

    return order;
  }

  // Update shipment info
  async updateShipment(
    orderId: string,
    status: ShipmentStatus,
    trackingNumber?: string
  ): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    order.updateShipmentStatus(status, trackingNumber);
    await this.orderRepository.update(order);
    await this.notificationService.sendOrderUpdate(order);

    return order;
  }
}
```


### **Usage Example**

```typescript
// Initialize services
const cartRepository: ICartRepository = new CartRepositoryImpl();
const orderRepository: IOrderRepository = new OrderRepositoryImpl();
const inventoryService: IInventoryService = new InventoryServiceImpl();
const paymentService: IPaymentService = new PaymentServiceImpl();
const notificationService: INotificationService = new NotificationServiceImpl();
const priceCalculator: IPriceCalculator = new PriceCalculatorImpl();

const cartService = new CartService(cartRepository, priceCalculator, inventoryService);
const orderService = new OrderService(
  orderRepository,
  cartService,
  inventoryService,
  paymentService,
  notificationService
);

// User adds items to cart
const cart = await cartService.getOrCreateCart('user123', 'session456');

const product: ProductInfo = {
  productId: 'P001',
  variantId: 'V001',
  name: 'Laptop',
  sku: 'LAP-001',
  price: 50000,
  imageUrl: 'https://example.com/laptop.jpg'
};

await cartService.addItemToCart(cart.getCartId(), product, 1);

// Apply coupon
await cartService.applyCoupon(cart.getCartId(), 'SAVE20');

// Get cart with prices
const { cart: updatedCart, priceBreakdown } = await cartService.getCartWithPrices(cart.getCartId());
console.log('Total:', priceBreakdown.total);

// Checkout - create order
const order = await orderService.createOrder(cart.getCartId(), {
  shippingAddress: {
    id: 'ADDR1',
    recipientName: 'John Doe',
    addressLine1: '123 Main St',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400001',
    country: 'India',
    phoneNumber: '+919876543210'
  },
  billingAddress: {
    id: 'ADDR1',
    recipientName: 'John Doe',
    addressLine1: '123 Main St',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400001',
    country: 'India',
    phoneNumber: '+919876543210'
  },
  paymentMethod: 'UPI'
});

console.log('Order created:', order.getOrderNumber());
console.log('Order status:', order.getStatus());

// Update order status (by admin/system)
await orderService.updateOrderStatus(order.getOrderId(), OrderStatus.PROCESSING);
await orderService.updateShipment(
  order.getOrderId(),
  ShipmentStatus.SHIPPED,
  'TRK123456789'
);
```


## Key Design Patterns

1. **State Machine**: Order lifecycle management with well-defined transitions[^5] [^6]
2. **Saga Pattern**: Distributed transaction management with compensations[^1] [^3]
3. **Repository Pattern**: Data access abstraction
4. **Strategy Pattern**: Price calculation strategies
5. **Observer Pattern**: Event-driven notifications
6. **Factory Pattern**: State creation based on order status

This design ensures scalability, maintainability, and fault tolerance while handling high-volume e-commerce transactions.[^4] [^2] [^3] [^1]
<span style="display:none">[^10] [^7] [^8] [^9]</span>

<div align="center">⁂</div>

[^1]: https://dev.to/savyjs/scalable-e-commerce-architecture-part-2-shopping-cart-3blg

[^2]: https://www.youtube.com/watch?v=-wJuExkI97s

[^3]: https://blog.cloudpick.ai/shopping-cart-systems-architecture-components-technology-stack/

[^4]: https://www.linkedin.com/posts/sina-riyahi_an-example-of-microservices-1-customer-activity-7394706699065921536-SqSB

[^5]: https://bitbag.io/blog/workflow-in-the-order-process-in-sylius

[^6]: https://developer.shopware.com/docs/guides/plugins/plugins/checkout/order/using-the-state-machine.html

[^7]: https://www.linkedin.com/pulse/system-design-architecture-food-delivery-app-like-durgesh-sharma-tdhec

[^8]: https://www.geeksforgeeks.org/sql/how-to-design-a-database-for-shopping-cart/

[^9]: https://doc.akka.io/libraries/guide/microservices-tutorial/overview.html

[^10]: https://insights.daffodilsw.com/blog/microservices-architecture-in-e-commerce-a-ctos-guide

