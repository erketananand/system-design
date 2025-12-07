## URL Shortener Service

### **System Architecture**

```
┌──────────────────────────────────────────────────────────────┐
│                  DNS + CDN (Global)                           │
│              (Geographic Load Distribution)                   │
└──────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼─────┐        ┌─────▼──────┐       ┌─────▼──────┐
   │  Region  │        │  Region    │       │  Region    │
   │   US     │        │    EU      │       │   ASIA     │
   └────┬─────┘        └─────┬──────┘       └─────┬──────┘
        │                    │                     │
┌───────▼────────────────────▼─────────────────────▼───────┐
│              Load Balancer (L7 - Application)             │
│         (Route based on URL pattern: /shorten vs /:code)  │
└───────────────────────────┬───────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼─────┐      ┌─────▼──────┐     ┌─────▼──────┐
   │Shortening│      │Redirection │     │ Analytics  │
   │ Service  │      │  Service   │     │  Service   │
   └────┬─────┘      └─────┬──────┘     └─────┬──────┘
        │                  │                   │
   ┌────▼─────┐      ┌─────▼──────┐     ┌─────▼──────┐
   │   Key    │      │ Distributed│     │ Analytics  │
   │Generation│      │   Cache    │     │    DB      │
   │ Service  │      │  (Redis)   │     │(ClickHouse)│
   └────┬─────┘      └─────┬──────┘     └────────────┘
        │                  │
   ┌────▼─────┐      ┌─────▼──────┐
   │   KGS    │      │    URL     │
   │ Database │      │  Mappings  │
   │          │      │    DB      │
   └──────────┘      │(PostgreSQL)│
                     │ + Replicas │
                     └────────────┘

┌──────────────────────────────────────────────────────────┐
│       Message Queue (Kafka) - Async Analytics             │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│    Rate Limiter (Redis) - Prevent Abuse                  │
└──────────────────────────────────────────────────────────┘
```


***

## Key Components

### **1. Shortening Service**

- **Responsibilities**: Generate short URLs, validate long URLs, store mappings[^2] [^4]
- **Features**:
    - URL validation (check format, DNS resolution)
    - Duplicate detection (same long URL → same short URL)
    - Custom alias support
    - Expiration date handling
    - User authentication and authorization
- **Performance**: <100ms for URL shortening[^2]

**API Endpoints**:

```
POST /api/v1/shorten
  Body: { longUrl, customAlias?, expiresAt?, userId? }
  Response: { shortUrl, shortCode, expiresAt }

GET /api/v1/url/:shortCode
  Response: { longUrl, createdAt, clicks, expiresAt }

DELETE /api/v1/url/:shortCode
  Auth: Required (only owner)
```


### **2. Key Generation Service (KGS)**

- **Purpose**: Pre-generate unique short codes to avoid collisions[^3]
- **Algorithm**: Base62 encoding of sequential IDs[^5] [^1] [^2]
- **Base62 Character Set**: `A-Z, a-z, 0-9` = 62 characters
- **Capacity**: 7-char code = 62^7 = **3.5 trillion unique URLs**[^1] [^2]
- **Implementation**:
    - Pre-generate millions of keys in batches
    - Store unused keys in dedicated database
    - Mark keys as "used" atomically
    - Prevent collisions with distributed locks[^3]

**Key Space Calculation**:

```
Length | Combinations
--------|-------------
6 chars | 62^6 = 56.8 billion
7 chars | 62^7 = 3.5 trillion
8 chars | 62^8 = 218 trillion
```


### **3. Redirection Service**

- **Responsibilities**: Fast URL lookup and HTTP redirect[^4] [^2]
- **Cache-First Strategy**: 95%+ cache hit ratio[^2] [^3]
- **Redirect Types**:
    - **301 Moved Permanently**: Cached by browsers (SEO friendly)
    - **302 Found**: Temporary redirect (better for analytics)
- **Performance**: <10ms cache hit, <50ms cache miss[^3]


### **4. Analytics Service**

- **Responsibilities**: Track clicks, user agents, geolocation, referrers[^4] [^3]
- **Async Processing**: Write to message queue, process asynchronously
- **Metrics**:
    - Total clicks per short URL
    - Geographic distribution
    - Device types (mobile/desktop)
    - Referrer sources
    - Time-series data (hourly/daily trends)
- **Storage**: ClickHouse or similar OLAP database[^2]


### **5. Database Layer**

#### **Primary Database (PostgreSQL/MySQL)**

- **Purpose**: Store URL mappings[^1] [^2]
- **Sharding Strategy**: Hash-based on short code[^6] [^2]
- **Replication**: Master-slave with 3-5 read replicas[^2]
- **Partitioning**: Partition by creation date for cold data archival


#### **KGS Database**

- **Purpose**: Store pre-generated keys[^3]
- **Structure**: Simple table with keys marked as used/unused
- **Concurrency**: Distributed locks to prevent duplicate key assignment


### **6. Cache Layer (Redis Cluster)**

- **Purpose**: Ultra-fast URL lookups[^3] [^2]
- **Cache Strategy**: Least Recently Used (LRU) eviction
- **Data Cached**:
    - Hot URLs (top 20% accessed URLs)
    - Recently created URLs (1-hour TTL)
    - Analytics counters
- **Performance**: 10M+ reads per second[^2]
- **Replication**: Redis Cluster with master-slave nodes


### **7. Rate Limiter**

- **Purpose**: Prevent abuse and DDoS attacks[^2]
- **Limits**:
    - Anonymous users: 10 URL shortening requests/hour
    - Authenticated users: 1000 requests/hour
    - Per IP: 100 requests/minute
- **Implementation**: Token bucket algorithm with Redis

***

## Key Workflows

### **Workflow 1: URL Shortening (Write Path)**

```
┌─────────────┐
│   User      │
│  Submits    │
│  Long URL   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. Frontend sends request               │
│    POST /api/v1/shorten                  │
│    { longUrl: "https://example.com/..." }│
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 2. API Gateway: Rate Limiting           │
│    - Check user/IP rate limit           │
│    - If exceeded: 429 Too Many Requests  │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 3. Shortening Service: Validate URL     │
│    - Check URL format (regex)           │
│    - Verify protocol (http/https)       │
│    - Optional: Check DNS resolution     │
│    - Sanitize and normalize URL         │
└──────┬──────────────────────────────────┘
       │
       ├─── Invalid ───┐
       │               ▼
       │        ┌──────────────┐
       │        │ Return Error │
       │        │ 400 Bad Req  │
       │        └──────────────┘
       │
       └─── Valid ───┐
                     ▼
┌─────────────────────────────────────────┐
│ 4. Check for Existing Mapping           │
│    SELECT short_code FROM urls          │
│    WHERE long_url_hash = MD5(longUrl)   │
│    AND is_expired = FALSE                │
└──────┬──────────────────────────────────┘
       │
       ├─── Found ───┐
       │             ▼
       │      ┌──────────────┐
       │      │ Return Existing│
       │      │ Short URL    │
       │      └──────────────┘
       │
       └─── Not Found ───┐
                         ▼
┌─────────────────────────────────────────┐
│ 5. Generate Short Code                  │
│    Option A: Key Generation Service     │
│      - Request pre-generated key from KGS│
│      - KGS marks key as "used"          │
│    Option B: Counter + Base62           │
│      - Get next ID from distributed counter│
│      - Convert ID to Base62 string      │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 6. Store URL Mapping                    │
│    INSERT INTO urls (                    │
│      short_code, long_url,               │
│      long_url_hash, user_id,             │
│      created_at, expires_at              │
│    ) VALUES (?, ?, MD5(?), ?, NOW(), ?)  │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 7. Cache the Mapping                    │
│    SET short:{shortCode} {longUrl} EX 3600│
│    - TTL: 1 hour for new URLs           │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 8. Publish Event (Async)                │
│    Kafka.publish('url.created', {        │
│      shortCode, longUrl, userId          │
│    })                                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 9. Return Response                      │
│    { shortUrl: "https://short.ly/abc123",│
│      shortCode: "abc123",                │
│      longUrl, createdAt, expiresAt }     │
└─────────────────────────────────────────┘
```

**Performance**: 50-100ms end-to-end[^2]

***

### **Workflow 2: URL Redirection (Read Path)**

```
┌─────────────┐
│   User      │
│  Clicks     │
│ Short URL   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. Browser sends GET request            │
│    GET https://short.ly/abc123           │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 2. Load Balancer routes to Redirection  │
│    Service (based on URL pattern)        │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 3. Check Redis Cache (Hot Path)         │
│    GET short:{shortCode}                 │
└──────┬──────────────────────────────────┘
       │
       ├─── Cache HIT (95% of requests) ───┐
       │                                    ▼
       │                             ┌──────────────┐
       │                             │ Get long URL │
       │                             │ from cache   │
       │                             │ <10ms        │
       │                             └──────┬───────┘
       │                                    │
       └─── Cache MISS (5% of requests) ───┤
                                            │
                                            ▼
┌─────────────────────────────────────────┐
│ 4. Query Database                       │
│    SELECT long_url, expires_at,          │
│           is_deleted                     │
│    FROM urls                             │
│    WHERE short_code = ?                  │
│    LIMIT 1                               │
└──────┬──────────────────────────────────┘
       │
       ├─── Not Found ───┐
       │                 ▼
       │          ┌──────────────┐
       │          │ Return 404   │
       │          │ Not Found    │
       │          └──────────────┘
       │
       └─── Found ───┐
                     ▼
┌─────────────────────────────────────────┐
│ 5. Validate URL Status                  │
│    - Check if expired                    │
│    - Check if deleted                    │
└──────┬──────────────────────────────────┘
       │
       ├─── Expired/Deleted ───┐
       │                       ▼
       │                ┌──────────────┐
       │                │ Return 410   │
       │                │ Gone         │
       │                └──────────────┘
       │
       └─── Valid ───┐
                     ▼
┌─────────────────────────────────────────┐
│ 6. Update Cache (if DB query)           │
│    SET short:{shortCode} {longUrl}       │
│    EXPIRE short:{shortCode} 86400        │
│    - Cache for 24 hours                  │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 7. Async Analytics (Fire-and-Forget)    │
│    Kafka.publish('url.accessed', {       │
│      shortCode, timestamp, userAgent,    │
│      ipAddress, referrer                 │
│    })                                    │
│    - No blocking, processed later        │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 8. Increment Click Counter (Redis)      │
│    INCR clicks:{shortCode}               │
│    - Atomic operation, instant           │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 9. HTTP Redirect (302 Found)            │
│    HTTP/1.1 302 Found                    │
│    Location: {longUrl}                   │
│    Cache-Control: no-cache               │
└─────────────────────────────────────────┘
```

**Performance**:

- Cache hit: <10ms[^3]
- Cache miss: <50ms[^3] [^2]

***

### **Workflow 3: Key Generation Service (Background)**

```
┌─────────────┐
│  KGS Daemon │
│  (Runs 24/7)│
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. Monitor Key Pool Size                │
│    SELECT COUNT(*) FROM pre_generated_keys│
│    WHERE is_used = FALSE                 │
└──────┬──────────────────────────────────┘
       │
       ├─── Pool > Threshold ───┐
       │                        ▼
       │                 ┌──────────────┐
       │                 │ Sleep 1 min  │
       │                 │ Check again  │
       │                 └──────────────┘
       │
       └─── Pool Low ───┐
                        ▼
┌─────────────────────────────────────────┐
│ 2. Generate Batch of Keys (1 million)   │
│    startID = getNextCounterValue()       │
│    endID = startID + 1,000,000           │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 3. Convert IDs to Base62                │
│    For id in range(startID, endID):      │
│      shortCode = base62Encode(id)        │
│      keys.append(shortCode)              │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 4. Batch Insert into KGS Database       │
│    BEGIN TRANSACTION                     │
│    INSERT INTO pre_generated_keys        │
│      (short_code, is_used, created_at)   │
│    VALUES                                │
│      ('abc123', FALSE, NOW()),           │
│      ('abc124', FALSE, NOW()),           │
│      ... (1 million rows)                │
│    COMMIT                                │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 5. Update Counter                       │
│    SET global_counter = endID            │
│    - Atomic operation with distributed lock│
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 6. Loop back to monitoring              │
└─────────────────────────────────────────┘
```

**Key Assignment (During Shortening)**:

```sql
BEGIN TRANSACTION;

-- Acquire lock to prevent collisions
SELECT short_code FROM pre_generated_keys
WHERE is_used = FALSE
LIMIT 1
FOR UPDATE SKIP LOCKED;

-- Mark key as used
UPDATE pre_generated_keys
SET is_used = TRUE, used_at = NOW()
WHERE short_code = ?;

COMMIT;
```


***

## Database Schema Design

### **URLs Table (Main Mappings)**

```sql
CREATE TABLE urls (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    short_code VARCHAR(10) UNIQUE NOT NULL,
    long_url TEXT NOT NULL,
    long_url_hash CHAR(32) NOT NULL COMMENT 'MD5 hash for deduplication',
    
    -- Ownership
    user_id BIGINT COMMENT 'NULL for anonymous',
    
    -- Metadata
    title VARCHAR(255),
    description TEXT,
    
    -- Lifecycle
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP COMMENT 'NULL = never expires',
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    
    -- Analytics (denormalized for quick access)
    click_count BIGINT DEFAULT 0,
    last_accessed_at TIMESTAMP,
    
    INDEX idx_short_code (short_code),
    INDEX idx_long_url_hash (long_url_hash, is_deleted),
    INDEX idx_user (user_id, created_at DESC),
    INDEX idx_expires (expires_at, is_deleted)
) ENGINE=InnoDB;

-- Partition by creation date (monthly)
ALTER TABLE urls PARTITION BY RANGE (YEAR(created_at) * 100 + MONTH(created_at)) (
    PARTITION p202501 VALUES LESS THAN (202502),
    PARTITION p202502 VALUES LESS THAN (202503),
    -- ... future partitions
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```


### **Pre-Generated Keys Table (KGS)**

```sql
CREATE TABLE pre_generated_keys (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    short_code VARCHAR(10) UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP,
    
    INDEX idx_unused (is_used, id),
    INDEX idx_short_code (short_code)
) ENGINE=InnoDB;
```


### **Users Table**

```sql
CREATE TABLE users (
    user_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(50) UNIQUE,
    api_key VARCHAR(64) UNIQUE COMMENT 'For API access',
    
    -- Subscription
    plan_type ENUM('FREE', 'PRO', 'ENTERPRISE') DEFAULT 'FREE',
    rate_limit INT DEFAULT 1000 COMMENT 'URLs per day',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_api_key (api_key)
);
```


### **Click Analytics Table (Time-Series)**

```sql
CREATE TABLE click_analytics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    short_code VARCHAR(10) NOT NULL,
    
    -- Request details
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer TEXT,
    
    -- Geographic data (from IP)
    country VARCHAR(2),
    city VARCHAR(100),
    
    -- Device info
    device_type ENUM('MOBILE', 'DESKTOP', 'TABLET', 'BOT'),
    browser VARCHAR(50),
    os VARCHAR(50),
    
    INDEX idx_short_code_time (short_code, accessed_at DESC),
    INDEX idx_accessed_at (accessed_at)
) ENGINE=InnoDB;

-- Partition by month for efficient queries
ALTER TABLE click_analytics PARTITION BY RANGE (TO_DAYS(accessed_at)) (
    PARTITION p202501 VALUES LESS THAN (TO_DAYS('2025-02-01')),
    PARTITION p202502 VALUES LESS THAN (TO_DAYS('2025-03-01')),
    -- ... rolling partitions
);
```


### **Custom Aliases Table**

```sql
CREATE TABLE custom_aliases (
    alias VARCHAR(50) PRIMARY KEY,
    url_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    INDEX idx_user (user_id)
);
```


***

## Low-Level Design (LLD) - TypeScript

### **Domain Models**

```typescript
// Enums
enum URLStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  DELETED = 'DELETED'
}

enum PlanType {
  FREE = 'FREE',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE'
}

enum DeviceType {
  MOBILE = 'MOBILE',
  DESKTOP = 'DESKTOP',
  TABLET = 'TABLET',
  BOT = 'BOT'
}

// Interfaces
interface ShortenRequest {
  longUrl: string;
  customAlias?: string;
  expiresAt?: Date;
  userId?: string;
}

interface ShortenResponse {
  shortUrl: string;
  shortCode: string;
  longUrl: string;
  createdAt: Date;
  expiresAt?: Date;
}

interface URLMapping {
  id: string;
  shortCode: string;
  longUrl: string;
  longUrlHash: string;
  userId?: string;
  createdAt: Date;
  expiresAt?: Date;
  isDeleted: boolean;
  clickCount: number;
}

interface AnalyticsData {
  shortCode: string;
  accessedAt: Date;
  ipAddress: string;
  userAgent: string;
  referrer?: string;
  country?: string;
  deviceType: DeviceType;
}
```


### **Base62 Encoder**

```typescript
class Base62Encoder {
  private static readonly CHARSET = 
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  private static readonly BASE = 62;

  // Encode number to Base62 string
  static encode(num: number): string {
    if (num === 0) return this.CHARSET[^0];

    let encoded = '';
    while (num > 0) {
      const remainder = num % this.BASE;
      encoded = this.CHARSET[remainder] + encoded;
      num = Math.floor(num / this.BASE);
    }

    return encoded;
  }

  // Decode Base62 string to number
  static decode(str: string): number {
    let decoded = 0;
    const length = str.length;

    for (let i = 0; i < length; i++) {
      const char = str[i];
      const value = this.CHARSET.indexOf(char);
      
      if (value === -1) {
        throw new Error(`Invalid Base62 character: ${char}`);
      }

      decoded = decoded * this.BASE + value;
    }

    return decoded;
  }

  // Generate random Base62 string of given length
  static generateRandom(length: number = 7): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * this.BASE);
      result += this.CHARSET[randomIndex];
    }
    return result;
  }
}
```


### **URL Validator**

```typescript
class URLValidator {
  private static readonly URL_REGEX = 
    /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

  private static readonly BLACKLISTED_DOMAINS = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0'
  ];

  static validate(url: string): { isValid: boolean; error?: string } {
    // Check format
    if (!this.URL_REGEX.test(url)) {
      return { isValid: false, error: 'Invalid URL format' };
    }

    // Check protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return { isValid: false, error: 'URL must start with http:// or https://' };
    }

    // Check blacklisted domains
    try {
      const urlObj = new URL(url);
      if (this.BLACKLISTED_DOMAINS.some(domain => urlObj.hostname.includes(domain))) {
        return { isValid: false, error: 'Domain is blacklisted' };
      }
    } catch (error) {
      return { isValid: false, error: 'Invalid URL' };
    }

    // Check length
    if (url.length > 2048) {
      return { isValid: false, error: 'URL too long (max 2048 characters)' };
    }

    return { isValid: true };
  }

  static normalize(url: string): string {
    try {
      const urlObj = new URL(url);
      
      // Remove trailing slash
      urlObj.pathname = urlObj.pathname.replace(/\/$/, '');
      
      // Sort query parameters
      urlObj.searchParams.sort();
      
      // Remove fragments (if desired)
      // urlObj.hash = '';
      
      return urlObj.toString();
    } catch (error) {
      return url;
    }
  }

  static generateHash(url: string): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(url).digest('hex');
  }
}
```


### **Key Generation Service**

```typescript
interface IKeyGenerationRepository {
  getUnusedKey(): Promise<string | null>;
  markKeyAsUsed(shortCode: string): Promise<void>;
  getUnusedKeyCount(): Promise<number>;
  generateKeys(count: number): Promise<void>;
}

class KeyGenerationService {
  private static readonly MIN_KEY_POOL_SIZE = 100000; // 100K keys
  private static readonly BATCH_SIZE = 1000000; // Generate 1M at a time

  constructor(
    private keyRepository: IKeyGenerationRepository,
    private counterService: IDistributedCounter
  ) {
    // Start background key generation
    this.startKeyGenerationWorker();
  }

  // Get next available key
  async getNextKey(): Promise<string> {
    const key = await this.keyRepository.getUnusedKey();
    
    if (!key) {
      throw new Error('No unused keys available. System overloaded.');
    }

    await this.keyRepository.markKeyAsUsed(key);
    return key;
  }

  // Background worker to maintain key pool
  private startKeyGenerationWorker(): void {
    setInterval(async () => {
      try {
        const unusedCount = await this.keyRepository.getUnusedKeyCount();
        
        if (unusedCount < KeyGenerationService.MIN_KEY_POOL_SIZE) {
          console.log(`Key pool low (${unusedCount}). Generating new batch...`);
          await this.generateKeyBatch();
        }
      } catch (error) {
        console.error('Error in key generation worker:', error);
      }
    }, 60000); // Check every minute
  }

  // Generate batch of keys
  private async generateKeyBatch(): Promise<void> {
    const startId = await this.counterService.getNextRange(
      KeyGenerationService.BATCH_SIZE
    );
    const endId = startId + KeyGenerationService.BATCH_SIZE;

    const keys: string[] = [];
    for (let id = startId; id < endId; id++) {
      const shortCode = Base62Encoder.encode(id);
      keys.push(shortCode);
    }

    await this.keyRepository.generateKeys(keys.length);
    console.log(`Generated ${keys.length} new keys`);
  }
}
```


### **URL Shortening Service**

```typescript
interface IURLRepository {
  save(urlMapping: URLMapping): Promise<void>;
  findByShortCode(shortCode: string): Promise<URLMapping | null>;
  findByLongUrlHash(hash: string): Promise<URLMapping | null>;
  incrementClickCount(shortCode: string): Promise<void>;
}

interface ICache {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl: number): Promise<void>;
  delete(key: string): Promise<void>;
  increment(key: string): Promise<number>;
}

interface IEventPublisher {
  publish(topic: string, event: any): Promise<void>;
}

class URLShortenerService {
  constructor(
    private urlRepository: IURLRepository,
    private keyGenerationService: KeyGenerationService,
    private cache: ICache,
    private eventPublisher: IEventPublisher,
    private baseUrl: string = 'https://short.ly'
  ) {}

  // Shorten URL
  async shortenURL(request: ShortenRequest): Promise<ShortenResponse> {
    // Validate URL
    const validation = URLValidator.validate(request.longUrl);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Normalize URL
    const normalizedUrl = URLValidator.normalize(request.longUrl);
    const urlHash = URLValidator.generateHash(normalizedUrl);

    // Check for existing mapping (deduplication)
    const existing = await this.urlRepository.findByLongUrlHash(urlHash);
    if (existing && !existing.isDeleted && (!existing.expiresAt || existing.expiresAt > new Date())) {
      return {
        shortUrl: `${this.baseUrl}/${existing.shortCode}`,
        shortCode: existing.shortCode,
        longUrl: existing.longUrl,
        createdAt: existing.createdAt,
        expiresAt: existing.expiresAt
      };
    }

    // Generate short code
    let shortCode: string;
    if (request.customAlias) {
      // Validate custom alias
      if (!this.isValidAlias(request.customAlias)) {
        throw new Error('Invalid custom alias');
      }
      // Check if alias is available
      const aliasExists = await this.urlRepository.findByShortCode(request.customAlias);
      if (aliasExists) {
        throw new Error('Custom alias already taken');
      }
      shortCode = request.customAlias;
    } else {
      // Get pre-generated key
      shortCode = await this.keyGenerationService.getNextKey();
    }

    // Create URL mapping
    const urlMapping: URLMapping = {
      id: this.generateId(),
      shortCode,
      longUrl: normalizedUrl,
      longUrlHash: urlHash,
      userId: request.userId,
      createdAt: new Date(),
      expiresAt: request.expiresAt,
      isDeleted: false,
      clickCount: 0
    };

    // Save to database
    await this.urlRepository.save(urlMapping);

    // Cache the mapping (1 hour TTL)
    await this.cache.set(`short:${shortCode}`, normalizedUrl, 3600);

    // Publish event
    await this.eventPublisher.publish('url.created', {
      shortCode,
      longUrl: normalizedUrl,
      userId: request.userId,
      timestamp: Date.now()
    });

    return {
      shortUrl: `${this.baseUrl}/${shortCode}`,
      shortCode,
      longUrl: normalizedUrl,
      createdAt: urlMapping.createdAt,
      expiresAt: urlMapping.expiresAt
    };
  }

  // Resolve short code to long URL
  async resolveURL(shortCode: string): Promise<{ longUrl: string; shouldTrack: boolean }> {
    // Check cache first
    const cached = await this.cache.get(`short:${shortCode}`);
    if (cached) {
      // Async: Track click
      this.trackClick(shortCode).catch(err => 
        console.error('Failed to track click:', err)
      );
      return { longUrl: cached, shouldTrack: true };
    }

    // Query database
    const urlMapping = await this.urlRepository.findByShortCode(shortCode);
    
    if (!urlMapping) {
      throw new Error('URL not found');
    }

    // Check if expired
    if (urlMapping.expiresAt && urlMapping.expiresAt < new Date()) {
      throw new Error('URL expired');
    }

    // Check if deleted
    if (urlMapping.isDeleted) {
      throw new Error('URL deleted');
    }

    // Update cache (24 hour TTL)
    await this.cache.set(`short:${shortCode}`, urlMapping.longUrl, 86400);

    // Async: Track click
    this.trackClick(shortCode).catch(err => 
      console.error('Failed to track click:', err)
    );

    return { longUrl: urlMapping.longUrl, shouldTrack: true };
  }

  // Track click (async, non-blocking)
  private async trackClick(shortCode: string): Promise<void> {
    // Increment counter in Redis (fast)
    await this.cache.increment(`clicks:${shortCode}`);

    // Publish event for detailed analytics (processed async)
    await this.eventPublisher.publish('url.accessed', {
      shortCode,
      timestamp: Date.now()
    });
  }

  // Delete URL
  async deleteURL(shortCode: string, userId: string): Promise<void> {
    const urlMapping = await this.urlRepository.findByShortCode(shortCode);
    
    if (!urlMapping) {
      throw new Error('URL not found');
    }

    // Authorization check
    if (urlMapping.userId !== userId) {
      throw new Error('Unauthorized');
    }

    // Soft delete
    urlMapping.isDeleted = true;
    await this.urlRepository.save(urlMapping);

    // Remove from cache
    await this.cache.delete(`short:${shortCode}`);

    // Publish event
    await this.eventPublisher.publish('url.deleted', {
      shortCode,
      userId,
      timestamp: Date.now()
    });
  }

  private isValidAlias(alias: string): boolean {
    // 3-20 characters, alphanumeric and hyphens only
    const aliasRegex = /^[a-zA-Z0-9-]{3,20}$/;
    return aliasRegex.test(alias);
  }

  private generateId(): string {
    return `URL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```


### **Redirection Controller (Express.js)**

```typescript
import express, { Request, Response } from 'express';

class RedirectionController {
  constructor(
    private urlShortenerService: URLShortenerService,
    private analyticsCollector: AnalyticsCollector
  ) {}

  // Handle redirect
  async handleRedirect(req: Request, res: Response): Promise<void> {
    const { shortCode } = req.params;

    try {
      // Resolve URL
      const { longUrl } = await this.urlShortenerService.resolveURL(shortCode);

      // Collect analytics data (async, non-blocking)
      this.analyticsCollector.collect({
        shortCode,
        accessedAt: new Date(),
        ipAddress: this.getClientIP(req),
        userAgent: req.headers['user-agent'] || '',
        referrer: req.headers['referer'],
        country: req.headers['cf-ipcountry'] as string, // Cloudflare header
        deviceType: this.detectDeviceType(req.headers['user-agent'] || '')
      }).catch(err => console.error('Analytics collection failed:', err));

      // Redirect (302 Found for analytics, 301 for SEO)
      res.redirect(302, longUrl);

    } catch (error: any) {
      if (error.message === 'URL not found') {
        res.status(404).json({ error: 'Short URL not found' });
      } else if (error.message === 'URL expired') {
        res.status(410).json({ error: 'Short URL has expired' });
      } else if (error.message === 'URL deleted') {
        res.status(410).json({ error: 'Short URL has been deleted' });
      } else {
        console.error('Redirect error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  // Handle shortening
  async handleShorten(req: Request, res: Response): Promise<void> {
    try {
      const request: ShortenRequest = {
        longUrl: req.body.longUrl,
        customAlias: req.body.customAlias,
        expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
        userId: req.user?.id // From auth middleware
      };

      const response = await this.urlShortenerService.shortenURL(request);
      res.status(201).json(response);

    } catch (error: any) {
      console.error('Shortening error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  private getClientIP(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[^0] ||
           req.headers['x-real-ip'] as string ||
           req.connection.remoteAddress ||
           '';
  }

  private detectDeviceType(userAgent: string): DeviceType {
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android')) return DeviceType.MOBILE;
    if (ua.includes('tablet') || ua.includes('ipad')) return DeviceType.TABLET;
    if (ua.includes('bot') || ua.includes('crawler')) return DeviceType.BOT;
    return DeviceType.DESKTOP;
  }
}

// Express routes
const router = express.Router();

router.post('/api/v1/shorten', (req, res) => 
  redirectionController.handleShorten(req, res)
);

router.get('/:shortCode', (req, res) => 
  redirectionController.handleRedirect(req, res)
);

export default router;
```


### **Analytics Collector**

```typescript
class AnalyticsCollector {
  constructor(
    private eventPublisher: IEventPublisher,
    private cache: ICache
  ) {}

  async collect(data: AnalyticsData): Promise<void> {
    // Increment Redis counter (real-time)
    await this.cache.increment(`clicks:${data.shortCode}`);

    // Publish to Kafka for detailed analytics (async processing)
    await this.eventPublisher.publish('analytics.click', {
      shortCode: data.shortCode,
      timestamp: data.accessedAt.getTime(),
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      referrer: data.referrer,
      country: data.country,
      deviceType: data.deviceType
    });
  }

  // Get click count for short code
  async getClickCount(shortCode: string): Promise<number> {
    const count = await this.cache.get(`clicks:${shortCode}`);
    return count ? parseInt(count) : 0;
  }
}
```


***

## Key Design Patterns \& Techniques

1. **Base62 Encoding**: URL-friendly short codes with huge namespace[^5] [^1] [^2]
2. **Key Generation Service**: Pre-generated keys prevent collisions[^3]
3. **Cache-Aside Pattern**: 95%+ cache hit rate for reads[^2] [^3]
4. **Hash-Based Deduplication**: Same long URL → same short URL[^1]
5. **Async Analytics**: Non-blocking click tracking[^2]
6. **Database Sharding**: Shard by short code for horizontal scaling[^6]
7. **Rate Limiting**: Token bucket algorithm prevents abuse
8. **Soft Deletes**: Preserve analytics data, prevent short code reuse

**Capacity**: Handles **3.5 trillion unique URLs** with 7-character codes, serving **1 million requests/second** with proper caching and replication.[^1] [^3] [^2]
<span style="display:none">[^10] [^7] [^8] [^9]</span>

<div align="center">⁂</div>

[^1]: https://www.geeksforgeeks.org/system-design/system-design-url-shortening-service/

[^2]: https://blog.algomaster.io/p/design-a-url-shortener

[^3]: https://systemdesign.one/url-shortening-system-design/

[^4]: https://www.hellointerview.com/learn/system-design/problem-breakdowns/bitly

[^5]: https://www.linkedin.com/pulse/building-url-shortener-using-hash-functions-base62-conversion-singh-y01oc

[^6]: https://www.designgurus.io/answers/detail/guide-to-designing-a-url-shortener

[^7]: https://bytebytego.com/courses/system-design-interview/design-a-url-shortener

[^8]: https://www.ijcrt.org/papers/IJCRT2505498.pdf

[^9]: https://www.linkedin.com/pulse/how-design-scalable-url-shortener-system-walkthrough-akash-srivastava-qqmvc

[^10]: https://www.youtube.com/watch?v=qSJAvd5Mgio

