## E-Commerce Typeahead System

### **System Architecture**

```
┌──────────────────────────────────────────────────────────────┐
│                  CDN + Load Balancer                          │
│              (Geographic Traffic Distribution)                │
└──────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼─────┐        ┌─────▼──────┐       ┌─────▼──────┐
   │ API      │        │ WebSocket  │       │  Mobile    │
   │ Gateway  │        │  Server    │       │    API     │
   └────┬─────┘        └─────┬──────┘       └─────┬──────┘
        │                    │                     │
┌───────▼────────────────────▼─────────────────────▼───────┐
│           Suggestion Service Cluster                      │
│         (Stateless, Horizontally Scalable)                │
└───────────────────────────┬───────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼─────┐      ┌─────▼──────┐     ┌─────▼──────┐
   │  Trie    │      │Elasticsearch│     │  Redis     │
   │  Cache   │      │   Cluster   │     │  Cache     │
   │(In-Memory)      │   (Search)  │     │ (Hot Keys) │
   └────┬─────┘      └─────┬──────┘     └─────┬──────┘
        │                  │                   │
   ┌────▼─────┐      ┌─────▼──────┐     ┌─────▼──────┐
   │ Products │      │  Search    │     │  Popular   │
   │   DB     │      │  Index     │     │  Queries   │
   │(PostgreSQL)     │            │     │   Cache    │
   └────┬─────┘      └────────────┘     └────────────┘
        │
   ┌────▼─────┐
   │ Read     │
   │ Replicas │
   └──────────┘

┌──────────────────────────────────────────────────────────┐
│       Analytics Pipeline (Kafka + Spark)                  │
│  - Query logs, Click tracking, Popularity scoring        │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│    Background Jobs                                        │
│  - Trie rebuild, Index updates, Trending recalculation   │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│    ML/Ranking Service (Optional)                          │
│  - Personalized suggestions, Click-through prediction    │
└──────────────────────────────────────────────────────────┘
```


***

## Key Components

### **1. Suggestion Service**

- **Responsibilities**: Core autocomplete logic, query processing, result ranking[^2] [^4]
- **Features**:
    - Prefix matching with fuzzy search tolerance
    - Multi-source suggestion aggregation (products, categories, brands, queries)
    - Personalized suggestions based on user history
    - Typo correction and spell checking
    - Real-time filtering by availability, price, location
- **Performance**: <100ms response time[^4] [^2]

**API Endpoints**:

```
GET /api/v1/suggestions?q=iphone&limit=10&userId=123
GET /api/v1/trending?category=electronics&limit=5
POST /api/v1/suggestions/click
  Body: { query, suggestionClicked, userId }
```


### **2. Trie Data Structure (In-Memory)**

- **Purpose**: Fast prefix-based lookups with O(k) complexity where k = query length[^5] [^1] [^2]
- **Storage**: Product names, categories, brands, popular queries
- **Node Structure**: Each node stores:
    - Character
    - Children map (char → node)
    - Top N suggestions with frequency/weight
    - Metadata (category, price range)
- **Optimization**: Store top 10 suggestions at each node to avoid traversing entire subtree[^1]
- **Memory**: ~1-5GB for millions of terms[^1]

**Trie Node Example**:

```
Node 'p' {
  children: {
    'h': Node,
    'l': Node,
    'r': Node
  },
  topSuggestions: [
    { term: "phone", weight: 10000, type: "product" },
    { term: "playstation", weight: 8500, type: "product" },
    { term: "printer", weight: 5000, type: "product" }
  ],
  isEndOfWord: false
}
```


### **3. Elasticsearch Cluster**

- **Purpose**: Full-text search, typo tolerance, fuzzy matching[^6] [^2]
- **Analyzers**:
    - Standard analyzer for tokenization
    - Ngram analyzer for partial matching
    - Phonetic analyzer for sound-alike matches
- **Index Structure**: Products index with optimized fields
- **Performance**: 10-50ms query time with proper sharding
- **Advantages**: Handles complex queries, multi-field search, filters[^6]

**ES Query Example**:

```json
{
  "suggest": {
    "product-suggest": {
      "prefix": "iphone",
      "completion": {
        "field": "name_suggest",
        "size": 10,
        "fuzzy": {
          "fuzziness": "AUTO"
        }
      }
    }
  }
}
```


### **4. Redis Cache (L1 Cache)**

- **Purpose**: Cache hot queries and results[^2]
- **Data Cached**:
    - Top 1000 popular queries with pre-computed results
    - Recent user queries (personalization)
    - Trending searches by category
    - Query → results mapping with 5-minute TTL
- **Hit Rate**: 60-80% for popular queries
- **Performance**: <5ms cache hit


### **5. Analytics Pipeline**

- **Purpose**: Track query patterns, click-through rates, popularity trends[^2]
- **Components**:
    - **Kafka**: Stream query events in real-time
    - **Spark Streaming**: Aggregate and calculate popularity scores
    - **ClickHouse**: Store historical analytics data
- **Metrics Tracked**:
    - Query frequency
    - Click-through rate (CTR)
    - Position of clicked suggestion
    - Time to click
    - User demographics


### **6. Background Jobs**

- **Trie Rebuild**: Daily or hourly incremental updates[^1] [^2]
- **Index Sync**: Push product updates to Elasticsearch
- **Trending Calculator**: Compute trending searches every 15 minutes
- **Query Aggregator**: Aggregate logs to update popularity weights
- **Cold Data Archival**: Move old analytics to cold storage


### **7. ML Ranking Service (Optional)**

- **Purpose**: Personalized suggestion ranking[^2]
- **Features**:
    - User preference modeling
    - Context-aware suggestions (time, location, device)
    - Click prediction models
    - A/B testing framework
- **Models**: XGBoost, Neural Networks for CTR prediction

***

## Key Workflows

### **Workflow 1: User Types Query (Read Path)**

```
┌─────────────┐
│   User      │
│   Types     │
│  "iphone 1" │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. Frontend: Debounce Input (200ms)     │
│    - Prevent excessive API calls        │
│    - Only trigger after user pauses     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 2. Send AJAX Request                    │
│    GET /api/v1/suggestions?q=iphone+1    │
│        &limit=10&userId=123              │
│    Headers: {                            │
│      X-Session-ID: "abc123",             │
│      X-Device: "mobile"                  │
│    }                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 3. API Gateway: Rate Limiting           │
│    - Check user rate limit (100 req/min)│
│    - Validate session                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 4. Suggestion Service: Query Parsing    │
│    - Normalize: "iphone 1" → "iphone 1" │
│    - Tokenize: ["iphone", "1"]          │
│    - Detect language: English            │
│    - Extract filters (if any)            │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 5. Check Redis Cache (L1)               │
│    key = "suggestions:iphone 1:10"       │
│    GET {key}                             │
└──────┬──────────────────────────────────┘
       │
       ├─── Cache HIT (70% requests) ───┐
       │                                 ▼
       │                          ┌──────────────┐
       │                          │ Return cached│
       │                          │  results     │
       │                          │  <5ms        │
       │                          └──────┬───────┘
       │                                 │
       │                                 └───┐
       │                                     │
       └─── Cache MISS (30% requests) ───┐  │
                                          ▼  │
┌─────────────────────────────────────────┐ │
│ 6. Multi-Source Query (Parallel)        │ │
│    Launch 3 concurrent queries:          │ │
│                                          │ │
│    A) Trie Lookup (In-Memory)            │ │
│       - Traverse trie with prefix        │ │
│       - Get top 10 from node             │ │
│       - Time: 1-2ms                      │ │
│                                          │ │
│    B) Elasticsearch Query                │ │
│       - Fuzzy prefix match               │ │
│       - Filter by availability           │ │
│       - Time: 10-30ms                    │ │
│                                          │ │
│    C) Redis Popular Queries              │ │
│       - Get trending searches            │ │
│       - Time: 2-5ms                      │ │
└──────┬──────────────────────────────────┘ │
       │                                     │
       ▼                                     │
┌─────────────────────────────────────────┐ │
│ 7. Aggregate Results                    │ │
│    Combine all sources:                  │ │
│    - Trie: ["iphone 15", "iphone 14"]   │ │
│    - ES: ["iphone 13", "iphone 15 pro"] │ │
│    - Trending: ["iphone 15 plus"]        │ │
│                                          │ │
│    Merged: [                             │ │
│      "iphone 15",                        │ │
│      "iphone 15 pro",                    │ │
│      "iphone 15 plus",                   │ │
│      "iphone 14",                        │ │
│      "iphone 13"                         │ │
│    ]                                     │ │
└──────┬──────────────────────────────────┘ │
       │                                     │
       ▼                                     │
┌─────────────────────────────────────────┐ │
│ 8. Score and Rank Suggestions           │ │
│    For each suggestion:                  │ │
│      score = popularity * 0.5 +          │ │
│              relevance * 0.3 +           │ │
│              recency * 0.1 +             │ │
│              personalization * 0.1       │ │
│                                          │ │
│    Sort by score DESC                    │ │
│    Take top 10                           │ │
└──────┬──────────────────────────────────┘ │
       │                                     │
       ▼                                     │
┌─────────────────────────────────────────┐ │
│ 9. Enrich with Metadata                 │ │
│    For each suggestion:                  │ │
│      - Fetch product image               │ │
│      - Get price                         │ │
│      - Check availability                │ │
│      - Add category breadcrumb           │ │
│                                          │ │
│    Result:                               │ │
│    [                                     │ │
│      {                                   │ │
│        text: "iphone 15 pro",            │ │
│        type: "product",                  │ │
│        price: "$999",                    │ │
│        imageUrl: "https://...",          │ │
│        inStock: true,                    │ │
│        category: "Electronics > Phones"  │ │
│      },                                  │ │
│      ...                                 │ │
│    ]                                     │ │
└──────┬──────────────────────────────────┘ │
       │                                     │
       ▼                                     │
┌─────────────────────────────────────────┐ │
│ 10. Cache Result (Redis)                │ │
│     SET "suggestions:iphone 1:10"        │ │
│         {enrichedResults}                │ │
│         EX 300  # 5 minute TTL           │ │
└──────┬──────────────────────────────────┘ │
       │                                     │
       ▼                                     │
┌─────────────────────────────────────────┐ │
│ 11. Log Analytics Event (Async)         │ │
│     kafka.publish('query.performed', {   │ │
│       query: "iphone 1",                 │ │
│       userId: 123,                       │ │
│       sessionId: "abc123",               │ │
│       resultsCount: 10,                  │ │
│       latency: 45,  # ms                 │ │
│       timestamp: Date.now()              │ │
│     })                                   │ │
└──────┬──────────────────────────────────┘ │
       │                                     │
       ├─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 12. Return JSON Response                │
│     {                                    │
│       query: "iphone 1",                 │
│       suggestions: [...],                │
│       totalResults: 10,                  │
│       latency: 45,                       │
│       cached: false                      │
│     }                                    │
└─────────────────────────────────────────┘
```

**Performance**: <100ms end-to-end, <50ms for 90th percentile[^4] [^2]

***

### **Workflow 2: User Clicks Suggestion**

```
┌─────────────┐
│   User      │
│   Clicks    │
│ "iphone 15" │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. Send Click Event (Async)             │
│    POST /api/v1/suggestions/click        │
│    Body: {                               │
│      query: "iphone 1",                  │
│      suggestionClicked: "iphone 15",     │
│      position: 0,  # First result        │
│      userId: 123,                        │
│      sessionId: "abc123",                │
│      timestamp: Date.now()               │
│    }                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 2. Acknowledge Immediately              │
│    - Return 202 Accepted                │
│    - Process asynchronously              │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 3. Publish to Kafka                     │
│    kafka.publish('click.tracked', {      │
│      query: "iphone 1",                  │
│      clicked: "iphone 15",               │
│      position: 0,                        │
│      userId: 123,                        │
│      sessionId: "abc123",                │
│      timestamp: Date.now()               │
│    })                                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 4. Spark Streaming: Process Event       │
│    - Aggregate clicks per suggestion     │
│    - Calculate CTR                       │
│    - Update popularity scores            │
│    - Detect trending queries             │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 5. Update Trie Weights (Batch)          │
│    - Every 15 minutes or hourly          │
│    - Rebuild affected nodes              │
│    - Update top N suggestions            │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 6. Store in Analytics DB                │
│    INSERT INTO click_events              │
│      (query, clicked_suggestion,         │
│       position, user_id, timestamp)      │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 7. Update User Profile (Personalization)│
│    - Store recent searches               │
│    - Update preference vector            │
│    - Feed to ML model                    │
└─────────────────────────────────────────┘
```

**Latency**: <5ms acknowledgment, async processing

***

### **Workflow 3: Trie Building/Updating (Write Path)**

```
┌─────────────┐
│  Cron Job   │
│  (Hourly)   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. Fetch Product Data                   │
│    SELECT product_id, name, category,    │
│           popularity_score, is_active    │
│    FROM products                         │
│    WHERE is_active = TRUE                │
│    ORDER BY popularity_score DESC        │
│    - 10M products                        │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 2. Fetch Search Query Stats             │
│    SELECT query, click_count,            │
│           search_count, last_searched    │
│    FROM query_analytics                  │
│    WHERE last_searched > NOW() - 30 days │
│    ORDER BY click_count DESC             │
│    - 50M queries                         │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 3. Build Trie in Memory                 │
│    trie = new Trie()                     │
│                                          │
│    For each product:                     │
│      terms = tokenize(product.name)      │
│      For each term:                      │
│        trie.insert(term, {               │
│          text: product.name,             │
│          type: 'product',                │
│          weight: product.popularity,     │
│          metadata: {...}                 │
│        })                                │
│                                          │
│    For each query:                       │
│      trie.insert(query, {                │
│        text: query,                      │
│        type: 'query',                    │
│        weight: query.click_count,        │
│        metadata: {...}                   │
│      })                                  │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 4. Optimize Trie (Bottom-Up)            │
│    For each node (post-order traversal): │
│      - Aggregate child suggestions       │
│      - Sort by weight                    │
│      - Keep top 10                       │
│      - Store at node level               │
│                                          │
│    This precomputes results for fast     │
│    retrieval during queries              │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 5. Serialize Trie                       │
│    - Convert to JSON or binary format    │
│    - Compress with gzip                  │
│    - Store in S3/distributed storage     │
│    - Size: ~1-5GB compressed             │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 6. Deploy to Suggestion Servers          │
│    - Download new trie from S3           │
│    - Load into memory                    │
│    - Atomic swap (blue-green deployment) │
│    - Keep old trie for rollback          │
│    - Deployment time: ~5 minutes         │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 7. Warm Up Cache                        │
│    - Pre-load top 1000 queries into Redis│
│    - Prime in-memory caches              │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 8. Health Check & Rollback              │
│    - Monitor error rates                 │
│    - Check latency metrics               │
│    - If issues: rollback to old trie     │
└─────────────────────────────────────────┘
```

**Frequency**: Hourly for incremental, daily for full rebuild[^1] [^2]

***

### **Workflow 4: Product Added/Updated**

```
┌─────────────┐
│   Admin     │
│   Adds      │
│  Product    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. Product Service: Create Product      │
│    INSERT INTO products (...)            │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 2. Publish Event                        │
│    kafka.publish('product.created', {    │
│      productId: 12345,                   │
│      name: "iPhone 15 Pro Max",          │
│      category: "Electronics",            │
│      timestamp: Date.now()               │
│    })                                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 3. Index in Elasticsearch (Real-time)   │
│    POST /products/_doc/12345             │
│    {                                     │
│      "name": "iPhone 15 Pro Max",        │
│      "name_suggest": {                   │
│        "input": ["iphone", "iphone 15",  │
│                  "iphone 15 pro max"],   │
│        "weight": 100                     │
│      },                                  │
│      "category": "Electronics",          │
│      ...                                 │
│    }                                     │
│    - Available in <1 second              │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 4. Invalidate Cache                     │
│    - Clear related query caches          │
│    - Remove stale entries                │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 5. Schedule Trie Update                 │
│    - Add to update queue                 │
│    - Will be included in next rebuild    │
│    - Or insert into live trie (if supported)│
└─────────────────────────────────────────┘
```

**Latency**: Product searchable in Elasticsearch within 1 second, in Trie within 1 hour

***

## Database Schema Design

### **Products Table**

```sql
CREATE TABLE products (
    product_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_normalized VARCHAR(255) NOT NULL COMMENT 'Lowercase, cleaned',
    
    -- Category hierarchy
    category_id BIGINT,
    category_path VARCHAR(500) COMMENT 'Electronics > Mobile > Phones',
    brand_id BIGINT,
    brand_name VARCHAR(100),
    
    -- Search relevance
    popularity_score DECIMAL(10,2) DEFAULT 0 COMMENT 'Calculated from clicks, sales',
    search_weight INT DEFAULT 100,
    
    -- Pricing
    price DECIMAL(10,2),
    discount_percentage INT DEFAULT 0,
    
    -- Availability
    is_active BOOLEAN DEFAULT TRUE,
    in_stock BOOLEAN DEFAULT TRUE,
    stock_quantity INT DEFAULT 0,
    
    -- SEO
    description TEXT,
    keywords TEXT COMMENT 'Comma-separated search keywords',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_sold_at TIMESTAMP,
    
    FULLTEXT INDEX idx_name_fulltext (name, description, keywords),
    INDEX idx_name_normalized (name_normalized),
    INDEX idx_category (category_id, is_active),
    INDEX idx_brand (brand_id, is_active),
    INDEX idx_popularity (popularity_score DESC, is_active),
    INDEX idx_active_stock (is_active, in_stock)
);
```


### **Search Queries Table (Analytics)**

```sql
CREATE TABLE search_queries (
    query_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    query_text VARCHAR(255) NOT NULL,
    query_normalized VARCHAR(255) NOT NULL,
    
    -- Metrics
    search_count BIGINT DEFAULT 0,
    result_count INT,
    avg_click_position DECIMAL(5,2),
    
    -- Time windows
    searches_last_hour INT DEFAULT 0,
    searches_last_day INT DEFAULT 0,
    searches_last_week INT DEFAULT 0,
    searches_last_month INT DEFAULT 0,
    
    -- Status
    is_trending BOOLEAN DEFAULT FALSE,
    trending_score DECIMAL(10,2) DEFAULT 0,
    
    -- Timestamps
    first_searched_at TIMESTAMP,
    last_searched_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_query (query_normalized),
    INDEX idx_trending (is_trending, trending_score DESC),
    INDEX idx_popularity (search_count DESC, last_searched_at DESC),
    INDEX idx_last_searched (last_searched_at DESC)
);
```


### **Query Click Events Table**

```sql
CREATE TABLE query_click_events (
    event_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- Query details
    query_text VARCHAR(255) NOT NULL,
    query_id BIGINT,
    
    -- Click details
    clicked_suggestion VARCHAR(255) NOT NULL,
    clicked_product_id BIGINT,
    suggestion_position INT NOT NULL COMMENT '0-based index',
    suggestion_type ENUM('product', 'category', 'brand', 'query') NOT NULL,
    
    -- User context
    user_id BIGINT,
    session_id VARCHAR(100) NOT NULL,
    device_type ENUM('mobile', 'desktop', 'tablet'),
    
    -- Timing
    query_timestamp TIMESTAMP NOT NULL,
    click_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    time_to_click_ms INT COMMENT 'Milliseconds from query to click',
    
    -- Location
    country VARCHAR(2),
    city VARCHAR(100),
    
    INDEX idx_query (query_id, click_timestamp DESC),
    INDEX idx_product (clicked_product_id, click_timestamp DESC),
    INDEX idx_session (session_id, click_timestamp),
    INDEX idx_timestamp (click_timestamp DESC)
) ENGINE=InnoDB;

-- Partition by month
ALTER TABLE query_click_events PARTITION BY RANGE (TO_DAYS(click_timestamp)) (
    PARTITION p202412 VALUES LESS THAN (TO_DAYS('2025-01-01')),
    PARTITION p202501 VALUES LESS THAN (TO_DAYS('2025-02-01')),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```


### **Categories Table**

```sql
CREATE TABLE categories (
    category_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(100) NOT NULL,
    category_slug VARCHAR(100) UNIQUE NOT NULL,
    
    parent_category_id BIGINT,
    category_level INT DEFAULT 0 COMMENT '0=root, 1=subcategory, etc.',
    category_path VARCHAR(500) COMMENT 'Full path for hierarchy',
    
    -- Search
    search_weight INT DEFAULT 100,
    is_searchable BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_category_id) REFERENCES categories(category_id),
    INDEX idx_parent (parent_category_id),
    INDEX idx_slug (category_slug)
);
```


### **Brands Table**

```sql
CREATE TABLE brands (
    brand_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    brand_name VARCHAR(100) UNIQUE NOT NULL,
    brand_slug VARCHAR(100) UNIQUE NOT NULL,
    
    logo_url TEXT,
    search_weight INT DEFAULT 100,
    is_active BOOLEAN DEFAULT TRUE,
    
    product_count INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_name (brand_name),
    INDEX idx_active (is_active, search_weight DESC)
);
```


### **Trending Queries Table**

```sql
CREATE TABLE trending_queries (
    trending_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    query_text VARCHAR(255) NOT NULL,
    query_id BIGINT,
    
    -- Trending metrics
    trending_score DECIMAL(10,2) NOT NULL,
    velocity DECIMAL(10,2) COMMENT 'Rate of growth',
    
    -- Time window
    time_window ENUM('hourly', 'daily', 'weekly') NOT NULL,
    window_start TIMESTAMP NOT NULL,
    window_end TIMESTAMP NOT NULL,
    
    -- Rankings
    rank_position INT,
    previous_rank INT,
    
    category_id BIGINT COMMENT 'Trending within category',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_window (time_window, window_start DESC),
    INDEX idx_score (trending_score DESC, time_window),
    INDEX idx_category (category_id, trending_score DESC)
);
```


### **User Search History Table**

```sql
CREATE TABLE user_search_history (
    history_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    session_id VARCHAR(100),
    
    query_text VARCHAR(255) NOT NULL,
    clicked_product_id BIGINT,
    
    search_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    INDEX idx_user_time (user_id, search_timestamp DESC),
    INDEX idx_session (session_id)
);
```


***

## Low-Level Design (LLD) - TypeScript

### **Domain Models**

```typescript
// Enums
enum SuggestionType {
  PRODUCT = 'product',
  CATEGORY = 'category',
  BRAND = 'brand',
  QUERY = 'query'
}

enum DeviceType {
  MOBILE = 'mobile',
  DESKTOP = 'desktop',
  TABLET = 'tablet'
}

// Interfaces
interface Suggestion {
  text: string;
  type: SuggestionType;
  weight: number;
  metadata?: SuggestionMetadata;
}

interface SuggestionMetadata {
  productId?: string;
  categoryId?: string;
  brandId?: string;
  price?: number;
  imageUrl?: string;
  inStock?: boolean;
  categoryPath?: string;
}

interface SuggestionRequest {
  query: string;
  limit?: number;
  userId?: string;
  sessionId?: string;
  deviceType?: DeviceType;
  filters?: SearchFilters;
}

interface SearchFilters {
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
}

interface SuggestionResponse {
  query: string;
  suggestions: EnrichedSuggestion[];
  totalResults: number;
  latency: number;
  cached: boolean;
}

interface EnrichedSuggestion extends Suggestion {
  position: number;
  highlightedText: string;
}

interface ClickEvent {
  query: string;
  clickedSuggestion: string;
  position: number;
  userId?: string;
  sessionId: string;
  timestamp: number;
}
```


### **Trie Node Implementation**

```typescript
class TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  topSuggestions: Suggestion[];
  frequency: number;

  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
    this.topSuggestions = [];
    this.frequency = 0;
  }

  hasChild(char: string): boolean {
    return this.children.has(char);
  }

  getChild(char: string): TrieNode | undefined {
    return this.children.get(char);
  }

  addChild(char: string, node: TrieNode): void {
    this.children.set(char, node);
  }

  setTopSuggestions(suggestions: Suggestion[]): void {
    this.topSuggestions = suggestions.slice(0, 10); // Keep top 10
  }

  getTopSuggestions(): Suggestion[] {
    return this.topSuggestions;
  }
}
```


### **Trie Data Structure**

```typescript
class Trie {
  private root: TrieNode;
  private readonly MAX_SUGGESTIONS = 10;

  constructor() {
    this.root = new TrieNode();
  }

  // Insert a word/phrase with metadata
  insert(text: string, metadata: Suggestion): void {
    const normalized = this.normalize(text);
    let node = this.root;

    for (const char of normalized) {
      if (!node.hasChild(char)) {
        node.addChild(char, new TrieNode());
      }
      node = node.getChild(char)!;
    }

    node.isEndOfWord = true;
    node.frequency = metadata.weight;
    
    // Store the complete suggestion at the terminal node
    if (!node.topSuggestions.some(s => s.text === metadata.text)) {
      node.topSuggestions.push(metadata);
    }
  }

  // Search for suggestions by prefix
  search(prefix: string, limit: number = this.MAX_SUGGESTIONS): Suggestion[] {
    const normalized = this.normalize(prefix);
    let node = this.root;

    // Traverse to the prefix node
    for (const char of normalized) {
      if (!node.hasChild(char)) {
        return []; // No suggestions for this prefix
      }
      node = node.getChild(char)!;
    }

    // Check if this node has pre-computed top suggestions
    if (node.topSuggestions.length > 0) {
      return node.topSuggestions.slice(0, limit);
    }

    // Otherwise, collect suggestions from subtree (slower)
    return this.collectSuggestions(node, limit);
  }

  // Collect all suggestions from a subtree
  private collectSuggestions(node: TrieNode, limit: number): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const queue: TrieNode[] = [node];

    while (queue.length > 0 && suggestions.length < limit) {
      const current = queue.shift()!;

      if (current.isEndOfWord && current.topSuggestions.length > 0) {
        suggestions.push(...current.topSuggestions);
      }

      current.children.forEach(child => queue.push(child));
    }

    // Sort by weight and return top N
    return suggestions
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit);
  }

  // Build optimized trie with top suggestions at each node
  optimize(): void {
    this.computeTopSuggestions(this.root);
  }

  // Recursively compute top suggestions for each node (bottom-up)
  private computeTopSuggestions(node: TrieNode): Suggestion[] {
    const allSuggestions: Suggestion[] = [];

    // Add current node's suggestions
    if (node.isEndOfWord) {
      allSuggestions.push(...node.topSuggestions);
    }

    // Recursively get suggestions from children
    node.children.forEach(child => {
      const childSuggestions = this.computeTopSuggestions(child);
      allSuggestions.push(...childSuggestions);
    });

    // Sort by weight and keep top N
    const topN = allSuggestions
      .sort((a, b) => b.weight - a.weight)
      .slice(0, this.MAX_SUGGESTIONS);

    node.setTopSuggestions(topN);
    return topN;
  }

  // Normalize text for consistent matching
  private normalize(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  // Serialize trie to JSON
  toJSON(): string {
    return JSON.stringify(this.serializeNode(this.root));
  }

  private serializeNode(node: TrieNode): any {
    const serialized: any = {
      isEndOfWord: node.isEndOfWord,
      frequency: node.frequency,
      topSuggestions: node.topSuggestions,
      children: {}
    };

    node.children.forEach((child, char) => {
      serialized.children[char] = this.serializeNode(child);
    });

    return serialized;
  }

  // Deserialize trie from JSON
  static fromJSON(json: string): Trie {
    const trie = new Trie();
    const data = JSON.parse(json);
    trie.root = trie.deserializeNode(data);
    return trie;
  }

  private deserializeNode(data: any): TrieNode {
    const node = new TrieNode();
    node.isEndOfWord = data.isEndOfWord;
    node.frequency = data.frequency;
    node.topSuggestions = data.topSuggestions;

    Object.entries(data.children).forEach(([char, childData]) => {
      node.addChild(char, this.deserializeNode(childData));
    });

    return node;
  }
}
```


### **Suggestion Service**

```typescript
interface ITrieCache {
  getTrie(): Trie;
  updateTrie(trie: Trie): void;
}

interface IElasticsearchClient {
  searchSuggestions(query: string, limit: number, filters?: SearchFilters): Promise<Suggestion[]>;
}

interface ICache {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl: number): Promise<void>;
}

interface IEventPublisher {
  publish(topic: string, event: any): Promise<void>;
}

class SuggestionService {
  constructor(
    private trieCache: ITrieCache,
    private elasticsearchClient: IElasticsearchClient,
    private cache: ICache,
    private eventPublisher: IEventPublisher
  ) {}

  // Main method to get suggestions
  async getSuggestions(request: SuggestionRequest): Promise<SuggestionResponse> {
    const startTime = Date.now();
    const { query, limit = 10, userId, sessionId, filters } = request;

    // Normalize query
    const normalizedQuery = this.normalizeQuery(query);

    // Check cache
    const cacheKey = this.getCacheKey(normalizedQuery, limit, filters);
    const cached = await this.cache.get(cacheKey);
    
    if (cached) {
      const cachedResult = JSON.parse(cached);
      return {
        ...cachedResult,
        latency: Date.now() - startTime,
        cached: true
      };
    }

    // Multi-source query (parallel)
    const [trieSuggestions, esSuggestions, trendingSuggestions] = await Promise.all([
      this.getTrieSuggestions(normalizedQuery, limit),
      this.getElasticsearchSuggestions(normalizedQuery, limit, filters),
      this.getTrendingSuggestions(normalizedQuery, limit)
    ]);

    // Merge and rank suggestions
    const mergedSuggestions = this.mergeSuggestions(
      trieSuggestions,
      esSuggestions,
      trendingSuggestions
    );

    // Apply personalization
    const rankedSuggestions = await this.applyPersonalization(
      mergedSuggestions,
      userId,
      limit
    );

    // Enrich with metadata
    const enrichedSuggestions = await this.enrichSuggestions(rankedSuggestions, query);

    // Prepare response
    const response: SuggestionResponse = {
      query: normalizedQuery,
      suggestions: enrichedSuggestions.slice(0, limit),
      totalResults: enrichedSuggestions.length,
      latency: Date.now() - startTime,
      cached: false
    };

    // Cache result (5 minute TTL)
    await this.cache.set(cacheKey, JSON.stringify(response), 300);

    // Log analytics event (async)
    this.logQueryEvent(request, response).catch(err => 
      console.error('Failed to log query event:', err)
    );

    return response;
  }

  // Get suggestions from Trie
  private async getTrieSuggestions(query: string, limit: number): Promise<Suggestion[]> {
    try {
      const trie = this.trieCache.getTrie();
      return trie.search(query, limit);
    } catch (error) {
      console.error('Trie search error:', error);
      return [];
    }
  }

  // Get suggestions from Elasticsearch
  private async getElasticsearchSuggestions(
    query: string,
    limit: number,
    filters?: SearchFilters
  ): Promise<Suggestion[]> {
    try {
      return await this.elasticsearchClient.searchSuggestions(query, limit, filters);
    } catch (error) {
      console.error('Elasticsearch error:', error);
      return [];
    }
  }

  // Get trending suggestions
  private async getTrendingSuggestions(query: string, limit: number): Promise<Suggestion[]> {
    // Fetch from trending queries cache
    // Implementation depends on your trending algorithm
    return [];
  }

  // Merge suggestions from multiple sources
  private mergeSuggestions(...sources: Suggestion[][]): Suggestion[] {
    const merged = new Map<string, Suggestion>();

    sources.forEach(suggestions => {
      suggestions.forEach(suggestion => {
        const existing = merged.get(suggestion.text);
        if (!existing || existing.weight < suggestion.weight) {
          merged.set(suggestion.text, suggestion);
        }
      });
    });

    return Array.from(merged.values());
  }

  // Apply personalization based on user history
  private async applyPersonalization(
    suggestions: Suggestion[],
    userId?: string,
    limit: number = 10
  ): Promise<Suggestion[]> {
    if (!userId) {
      return this.rankByWeight(suggestions, limit);
    }

    // Fetch user's search history and preferences
    // Boost suggestions matching user interests
    // For now, just rank by weight
    return this.rankByWeight(suggestions, limit);
  }

  // Rank suggestions by weight
  private rankByWeight(suggestions: Suggestion[], limit: number): Suggestion[] {
    return suggestions
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit);
  }

  // Enrich suggestions with additional metadata
  private async enrichSuggestions(
    suggestions: Suggestion[],
    originalQuery: string
  ): Promise<EnrichedSuggestion[]> {
    return suggestions.map((suggestion, index) => ({
      ...suggestion,
      position: index,
      highlightedText: this.highlightMatch(suggestion.text, originalQuery)
    }));
  }

  // Highlight matching portion of suggestion
  private highlightMatch(text: string, query: string): string {
    const normalizedText = text.toLowerCase();
    const normalizedQuery = query.toLowerCase().trim();
    const index = normalizedText.indexOf(normalizedQuery);

    if (index === -1) {
      return text;
    }

    const before = text.substring(0, index);
    const match = text.substring(index, index + normalizedQuery.length);
    const after = text.substring(index + normalizedQuery.length);

    return `${before}<mark>${match}</mark>${after}`;
  }

  // Normalize query string
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  // Generate cache key
  private getCacheKey(query: string, limit: number, filters?: SearchFilters): string {
    const filterKey = filters ? JSON.stringify(filters) : 'none';
    return `suggestions:${query}:${limit}:${filterKey}`;
  }

  // Log query event for analytics
  private async logQueryEvent(
    request: SuggestionRequest,
    response: SuggestionResponse
  ): Promise<void> {
    await this.eventPublisher.publish('query.performed', {
      query: request.query,
      userId: request.userId,
      sessionId: request.sessionId,
      deviceType: request.deviceType,
      resultsCount: response.totalResults,
      latency: response.latency,
      cached: response.cached,
      timestamp: Date.now()
    });
  }

  // Track click event
  async trackClick(clickEvent: ClickEvent): Promise<void> {
    // Publish to Kafka for async processing
    await this.eventPublisher.publish('click.tracked', clickEvent);
  }
}
```


### **Trie Builder (Background Job)**

```typescript
interface IProductRepository {
  getAllActiveProducts(): Promise<Array<{
    productId: string;
    name: string;
    category: string;
    brand: string;
    popularityScore: number;
    price: number;
    inStock: boolean;
  }>>;
}

interface IQueryRepository {
  getPopularQueries(limit: number): Promise<Array<{
    queryText: string;
    searchCount: number;
  }>>;
}

class TrieBuilder {
  constructor(
    private productRepository: IProductRepository,
    private queryRepository: IQueryRepository
  ) {}

  // Build trie from products and queries
  async buildTrie(): Promise<Trie> {
    console.log('Starting trie build...');
    const startTime = Date.now();

    const trie = new Trie();

    // Add products
    const products = await this.productRepository.getAllActiveProducts();
    console.log(`Adding ${products.length} products to trie`);

    for (const product of products) {
      // Add full product name
      trie.insert(product.name, {
        text: product.name,
        type: SuggestionType.PRODUCT,
        weight: product.popularityScore,
        metadata: {
          productId: product.productId,
          price: product.price,
          inStock: product.inStock,
          categoryPath: product.category
        }
      });

      // Also add individual words for partial matching
      const words = product.name.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length >= 3) { // Only index words >= 3 chars
          trie.insert(word, {
            text: product.name,
            type: SuggestionType.PRODUCT,
            weight: product.popularityScore * 0.8, // Lower weight for partial match
            metadata: {
              productId: product.productId,
              price: product.price,
              inStock: product.inStock
            }
          });
        }
      });

      // Add brand
      if (product.brand) {
        trie.insert(product.brand, {
          text: product.brand,
          type: SuggestionType.BRAND,
          weight: product.popularityScore * 0.5,
          metadata: {}
        });
      }
    }

    // Add popular queries
    const queries = await this.queryRepository.getPopularQueries(50000);
    console.log(`Adding ${queries.length} queries to trie`);

    for (const query of queries) {
      trie.insert(query.queryText, {
        text: query.queryText,
        type: SuggestionType.QUERY,
        weight: query.searchCount,
        metadata: {}
      });
    }

    // Optimize trie (compute top suggestions at each node)
    console.log('Optimizing trie...');
    trie.optimize();

    const elapsed = Date.now() - startTime;
    console.log(`Trie build completed in ${elapsed}ms`);

    return trie;
  }

  // Serialize and save trie
  async saveTrie(trie: Trie, filepath: string): Promise<void> {
    const fs = require('fs');
    const zlib = require('zlib');

    const json = trie.toJSON();
    const compressed = zlib.gzipSync(json);
    
    fs.writeFileSync(filepath, compressed);
    console.log(`Trie saved to ${filepath} (${compressed.length} bytes)`);
  }

  // Load trie from file
  async loadTrie(filepath: string): Promise<Trie> {
    const fs = require('fs');
    const zlib = require('zlib');

    const compressed = fs.readFileSync(filepath);
    const json = zlib.gunzipSync(compressed).toString();
    
    return Trie.fromJSON(json);
  }
}
```


### **Express Controller**

```typescript
import express, { Request, Response } from 'express';

class SuggestionController {
  constructor(private suggestionService: SuggestionService) {}

  async handleGetSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const request: SuggestionRequest = {
        query: req.query.q as string,
        limit: parseInt(req.query.limit as string) || 10,
        userId: req.user?.id,
        sessionId: req.sessionID,
        deviceType: this.detectDeviceType(req),
        filters: this.extractFilters(req)
      };

      // Validate query
      if (!request.query || request.query.length < 2) {
        res.status(400).json({ error: 'Query must be at least 2 characters' });
        return;
      }

      const response = await this.suggestionService.getSuggestions(request);
      res.json(response);

    } catch (error: any) {
      console.error('Suggestion error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async handleTrackClick(req: Request, res: Response): Promise<void> {
    try {
      const clickEvent: ClickEvent = {
        query: req.body.query,
        clickedSuggestion: req.body.clickedSuggestion,
        position: req.body.position,
        userId: req.user?.id,
        sessionId: req.sessionID,
        timestamp: Date.now()
      };

      // Fire and forget
      this.suggestionService.trackClick(clickEvent).catch(err =>
        console.error('Failed to track click:', err)
      );

      res.status(202).json({ success: true });

    } catch (error: any) {
      console.error('Click tracking error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private detectDeviceType(req: Request): DeviceType {
    const ua = req.headers['user-agent']?.toLowerCase() || '';
    if (ua.includes('mobile')) return DeviceType.MOBILE;
    if (ua.includes('tablet')) return DeviceType.TABLET;
    return DeviceType.DESKTOP;
  }

  private extractFilters(req: Request): SearchFilters {
    return {
      categoryId: req.query.categoryId as string,
      brandId: req.query.brandId as string,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      inStockOnly: req.query.inStockOnly === 'true'
    };
  }
}

// Routes
const router = express.Router();
const controller = new SuggestionController(suggestionService);

router.get('/api/v1/suggestions', (req, res) => 
  controller.handleGetSuggestions(req, res)
);

router.post('/api/v1/suggestions/click', (req, res) => 
  controller.handleTrackClick(req, res)
);

export default router;
```


***

## Key Design Patterns \& Optimizations

1. **Trie with Pre-computed Top-N**: Store top suggestions at each node for O(k) lookups[^2] [^1]
2. **Multi-Source Aggregation**: Combine Trie, Elasticsearch, trending for comprehensive results[^2]
3. **Cache-Aside Pattern**: Redis caching for 60-80% hit rate
4. **Debouncing**: Frontend delays API calls by 200ms to reduce load[^2]
5. **Incremental Updates**: Hourly trie rebuilds instead of real-time[^1] [^2]
6. **Parallel Queries**: Launch Trie, ES, trending queries concurrently
7. **Blue-Green Deployment**: Atomic trie swap with rollback capability

**Performance**: **<100ms response**, supports **100M+ users**, **10K+ QPS**, **95%+ uptime**.[^3] [^4] [^2]
<span style="display:none">[^10] [^7] [^8] [^9]</span>

<div align="center">⁂</div>

[^1]: https://www.enjoyalgorithms.com/blog/design-typeahead-system/

[^2]: https://systemdesignschool.io/problems/typeahead/solution

[^3]: https://www.geeksforgeeks.org/system-design/googles-search-autocomplete-high-level-designhld/

[^4]: https://algomaster.io/learn/system-design/design-search-autocomplete-system

[^5]: https://news.ycombinator.com/item?id=29078919

[^6]: https://www.reddit.com/r/learnprogramming/comments/im13ox/has_anyone_built_up_a_autocomplete_system_will_a/

[^7]: https://www.educative.io/courses/grokking-the-system-design-interview/system-design-the-typeahead-suggestion-system

[^8]: https://www.youtube.com/watch?v=us0qySiUsGU

[^9]: https://milvus.io/ai-quick-reference/how-can-you-handle-scalability-issues-in-recommender-systems

[^10]: https://systemdesignprep.com/autocomplete.php

