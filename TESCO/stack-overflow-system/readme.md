## Stack Overflow System Design

### **System Architecture**

```
┌──────────────────────────────────────────────────────────────┐
│                  CDN + Load Balancer                          │
│              (Global Content Distribution)                    │
└──────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼─────┐        ┌─────▼──────┐       ┌─────▼──────┐
   │  Web     │        │  Mobile    │       │    API     │
   │  Client  │        │    App     │       │  Gateway   │
   └────┬─────┘        └─────┬──────┘       └─────┬──────┘
        │                    │                     │
┌───────▼────────────────────▼─────────────────────▼───────┐
│           API Gateway (Auth, Rate Limiting)               │
└───────────────────────────┬───────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼─────┐      ┌─────▼──────┐     ┌─────▼──────┐
   │  User    │      │ Question   │     │ Reputation │
   │ Service  │      │  Service   │     │  Service   │
   └────┬─────┘      └─────┬──────┘     └─────┬──────┘
        │                  │                   │
   ┌────▼─────┐      ┌─────▼──────┐     ┌─────▼──────┐
   │  User    │      │ Question   │     │ Reputation │
   │   DB     │      │    DB      │     │    DB      │
   │(Postgres)│      │(Postgres)  │     │            │
   └────┬─────┘      └─────┬──────┘     └────────────┘
        │                  │
   ┌────▼─────┐      ┌─────▼──────┐
   │ Session  │      │Elasticsearch│
   │  Store   │      │   Search    │
   │ (Redis)  │      │   Index     │
   └──────────┘      └────────────┘

┌──────────────────────────────────────────────────────────┐
│            Ancillary Services                             │
├──────────────┬────────────┬──────────────┬───────────────┤
│ Notification │   Vote     │   Badge      │  Moderation   │
│   Service    │  Service   │   Service    │   Service     │
└──────────────┴────────────┴──────────────┴───────────────┘

┌──────────────────────────────────────────────────────────┐
│       Event Stream (Kafka)                                │
│  Topics: questions, answers, votes, reputation           │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│    Cache Layer (Redis)                                    │
│  - Hot questions, User sessions, Vote counts             │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│    Object Storage (S3)                                    │
│  - User avatars, Question images, Attachments            │
└──────────────────────────────────────────────────────────┘
```


***

## Key Components

### **1. User Service**

- **Responsibilities**: User registration, authentication, profile management[^1]
- **Features**:
    - Email/OAuth registration (Google, GitHub)
    - Email verification and password reset
    - Profile management (bio, location, website, avatar)
    - Privacy settings
    - Activity history tracking
- **Authentication**: JWT tokens with refresh tokens
- **Performance**: <100ms for profile operations

**API Endpoints**:

```
POST /api/v1/users/register
POST /api/v1/users/login
GET  /api/v1/users/:userId/profile
PUT  /api/v1/users/:userId/profile
GET  /api/v1/users/:userId/activity
```


### **2. Question Service**

- **Responsibilities**: Create, read, update questions and answers[^2] [^1]
- **Features**:
    - Question posting with title, body, tags
    - Rich text editor support (Markdown)
    - Answer posting with code highlighting
    - Comment threading
    - Edit history and revisions
    - Duplicate question detection
- **Performance**: <200ms for question retrieval[^2]

**API Endpoints**:

```
POST /api/v1/questions
GET  /api/v1/questions/:id
PUT  /api/v1/questions/:id
DELETE /api/v1/questions/:id
POST /api/v1/questions/:id/answers
POST /api/v1/answers/:id/comments
```


### **3. Reputation Service**

- **Responsibilities**: Calculate and manage user reputation scores[^4] [^5] [^1]
- **Features**:
    - Point-based reputation system
    - Action-based scoring (upvote, accepted answer, downvote)
    - Privilege unlocking based on reputation
    - Badge awards (gold, silver, bronze)
    - Reputation history tracking
- **Algorithm**: Event-driven reputation calculation

**Reputation Points**:[^5] [^4]

```
Action                          Points
─────────────────────────────────────
Question upvoted                +5
Answer upvoted                  +10
Answer accepted                 +15
Accept an answer                +2
Question downvoted              -2
Answer downvoted                -2
Downvote someone's answer       -1
```

**Privilege Levels**:

```
Reputation    Privilege
─────────────────────────────────────
15            Upvote
50            Comment everywhere
75            Set bounty
125           Downvote
250           Vote to close/reopen
500           Edit questions/answers
1000          Delete posts
2000          Edit others' posts
3000          Vote to delete
10000         Moderator tools
25000         Access to site analytics
```


### **4. Vote Service**

- **Responsibilities**: Handle upvotes/downvotes on questions and answers[^1]
- **Features**:
    - Vote casting (upvote, downvote)
    - Vote retraction
    - Vote fraud detection
    - Vote locking after time period
    - Real-time vote count aggregation
- **Concurrency**: Distributed locks to prevent duplicate votes
- **Performance**: <50ms for vote operations


### **5. Search Service (Elasticsearch)**

- **Responsibilities**: Full-text search across questions, answers, users[^2] [^1]
- **Features**:
    - Question search by keywords, tags, user
    - Advanced filters (date range, score, views)
    - Autocomplete for tags
    - Search result ranking (relevance, recency, votes)
    - Fuzzy matching and typo tolerance
- **Indexing**: Real-time indexing via event stream
- **Performance**: <100ms search queries[^2]


### **6. Badge Service**

- **Responsibilities**: Award and track user badges[^5] [^1]
- **Badge Types**:
    - **Participation**: First question, first answer
    - **Quality**: Nice/Good/Great question/answer (vote thresholds)
    - **Moderation**: Reviewer, Editor, Deputy
    - **Special**: Famous question (10k views), Popular question (1k views)
- **Processing**: Background jobs check badge criteria


### **7. Notification Service**

- **Responsibilities**: Multi-channel notifications[^1]
- **Notification Types**:
    - New answer to your question
    - Comment on your post
    - Your answer accepted
    - Badge earned
    - Reputation milestone reached
- **Channels**: Email, in-app notifications, push notifications
- **Delivery**: Async via message queue


### **8. Moderation Service**

- **Responsibilities**: Content moderation, flagging, review queues[^1]
- **Features**:
    - Flag inappropriate content
    - Review queue for moderators
    - Close/reopen questions
    - Delete spam posts
    - Suspend users
- **Access Control**: Based on reputation privileges


### **9. Database Layer**

#### **Primary Database (PostgreSQL)**

- **Purpose**: Store users, questions, answers, comments[^2] [^1]
- **Sharding**: Shard by user_id or question_id
- **Replication**: Master-slave with 5+ read replicas[^2]
- **ACID**: Strong consistency for votes and reputation


#### **Cache Layer (Redis)**

- **Hot Questions**: Top questions cached with 5-minute TTL[^1] [^2]
- **Vote Counts**: Real-time aggregation
- **User Sessions**: JWT token blacklist
- **Rate Limiting**: Per-user request counters


### **10. Event Streaming (Kafka)**

- **Topics**:[^1]
    - `question.created` - New questions
    - `answer.posted` - New answers
    - `vote.cast` - Upvotes/downvotes
    - `reputation.changed` - Reputation updates
    - `badge.earned` - Badge awards
- **Consumers**: Search indexer, notification service, analytics

***

## Key Workflows

### **Workflow 1: User Registration**

```
┌─────────────┐
│   User      │
│  Registers  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. Frontend sends registration request  │
│    POST /api/v1/users/register           │
│    Body: {                               │
│      email: "user@example.com",          │
│      username: "john_doe",               │
│      password: "SecurePass123!",         │
│      displayName: "John Doe"             │
│    }                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 2. User Service: Validate Input         │
│    - Email format validation             │
│    - Password strength check             │
│      (min 8 chars, uppercase, number)    │
│    - Username format (alphanumeric, 3-20)│
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
│ 3. Check for Duplicate User             │
│    SELECT user_id FROM users             │
│    WHERE email = ? OR username = ?       │
└──────┬──────────────────────────────────┘
       │
       ├─── Exists ───┐
       │              ▼
       │       ┌──────────────┐
       │       │ Return Error │
       │       │ "Email/User  │
       │       │  taken"      │
       │       └──────────────┘
       │
       └─── Not Exists ───┐
                          ▼
┌─────────────────────────────────────────┐
│ 4. Hash Password                        │
│    password_hash = bcrypt.hash(          │
│      password, saltRounds=10             │
│    )                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 5. Create User Record                   │
│    BEGIN TRANSACTION                     │
│    INSERT INTO users (                   │
│      user_id, email, username,           │
│      password_hash, display_name,        │
│      reputation, created_at,             │
│      is_verified, status                 │
│    ) VALUES (                            │
│      UUID(), 'user@example.com',         │
│      'john_doe', $2b$10$...,             │
│      'John Doe', 1, NOW(),               │
│      FALSE, 'ACTIVE'                     │
│    )                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 6. Initialize User Profile              │
│    INSERT INTO user_profiles (           │
│      user_id, bio, location, website,    │
│      avatar_url                          │
│    ) VALUES (                            │
│      ?, '', '', '', '/default_avatar.png'│
│    )                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 7. Initialize Reputation Record         │
│    INSERT INTO user_reputation (         │
│      user_id, total_reputation,          │
│      question_reputation,                │
│      answer_reputation                   │
│    ) VALUES (?, 1, 0, 0)                 │
│    COMMIT TRANSACTION                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 8. Generate Verification Token          │
│    token = generateSecureToken(32)       │
│    INSERT INTO email_verifications (     │
│      user_id, token, expires_at          │
│    ) VALUES (                            │
│      ?, token, NOW() + INTERVAL 24 HOUR  │
│    )                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 9. Send Verification Email (Async)      │
│    kafka.publish('email.send', {         │
│      userId, email,                      │
│      type: 'VERIFICATION',               │
│      verificationLink:                   │
│        'https://so.com/verify?token=...' │
│    })                                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 10. Generate JWT Token                  │
│     payload = {                          │
│       userId, username, email,           │
│       reputation: 1                      │
│     }                                    │
│     accessToken = jwt.sign(payload,      │
│       SECRET, { expiresIn: '15m' })      │
│     refreshToken = jwt.sign({ userId },  │
│       REFRESH_SECRET, { expiresIn: '7d' })│
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 11. Return Response                     │
│     {                                    │
│       success: true,                     │
│       user: {                            │
│         userId, username, email,         │
│         displayName, reputation: 1       │
│       },                                 │
│       accessToken,                       │
│       refreshToken                       │
│     }                                    │
└─────────────────────────────────────────┘
```

**Performance**: <200ms registration[^1]

***

### **Workflow 2: Post Question**

```
┌─────────────┐
│   User      │
│   Posts     │
│  Question   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. Frontend sends question request      │
│    POST /api/v1/questions                │
│    Headers: { Authorization: Bearer JWT }│
│    Body: {                               │
│      title: "How to use async/await?",   │
│      body: "I'm confused about...",      │
│      tags: ["javascript", "async"]       │
│    }                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 2. API Gateway: Authenticate            │
│    - Verify JWT token                    │
│    - Extract userId from token           │
└──────┬──────────────────────────────────┘
       │
       ├─── Invalid Token ───┐
       │                     ▼
       │              ┌──────────────┐
       │              │ Return 401   │
       │              │ Unauthorized │
       │              └──────────────┘
       │
       └─── Authenticated ───┐
                             ▼
┌─────────────────────────────────────────┐
│ 3. Question Service: Validate Request   │
│    - Title: 15-150 chars                 │
│    - Body: Min 30 chars                  │
│    - Tags: 1-5 tags, each valid          │
│    - Check rate limit (max 6/day)        │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 4. Check User Privileges                │
│    SELECT reputation FROM users          │
│    WHERE user_id = ?                     │
│                                          │
│    - Reputation >= 1 to ask questions    │
│    - Check if user is suspended          │
└──────┬──────────────────────────────────┘
       │
       ├─── Insufficient Rep ───┐
       │                        ▼
       │                 ┌──────────────┐
       │                 │ Return 403   │
       │                 │ Forbidden    │
       │                 └──────────────┘
       │
       └─── Has Permission ───┐
                              ▼
┌─────────────────────────────────────────┐
│ 5. Sanitize Content                     │
│    - Remove XSS vulnerabilities          │
│    - Parse and validate Markdown         │
│    - Extract code blocks                 │
│    - Generate plain text excerpt         │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 6. Check for Duplicate Questions        │
│    Elasticsearch similarity search:      │
│    - Query existing questions with title │
│    - Calculate similarity score          │
│    - If score > 0.8, suggest duplicates  │
└──────┬──────────────────────────────────┘
       │
       ├─── Possible Duplicate ───┐
       │                          ▼
       │                   ┌──────────────┐
       │                   │ Return warning│
       │                   │ with similar │
       │                   │ questions    │
       │                   └──────────────┘
       │
       └─── Unique ───┐
                      ▼
┌─────────────────────────────────────────┐
│ 7. Validate and Fetch Tags             │
│    For each tag in request:              │
│      SELECT tag_id, tag_name             │
│      FROM tags WHERE tag_name = ?        │
│                                          │
│    If tag doesn't exist (new users):     │
│      - Require reputation >= 1500 to     │
│        create new tags                   │
│      - Return error if insufficient      │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 8. Create Question Record               │
│    BEGIN TRANSACTION                     │
│    INSERT INTO questions (               │
│      question_id, user_id, title,        │
│      body, body_html, excerpt,           │
│      view_count, vote_count,             │
│      answer_count, created_at,           │
│      last_activity_at, status            │
│    ) VALUES (                            │
│      UUID(), ?, 'How to use async...',   │
│      'I am confused...', '<p>I am...',   │
│      'I am confused about...', 0, 0, 0,  │
│      NOW(), NOW(), 'OPEN'                │
│    )                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 9. Link Tags to Question                │
│    For each tag:                         │
│      INSERT INTO question_tags (         │
│        question_id, tag_id               │
│      ) VALUES (?, ?)                     │
│                                          │
│      UPDATE tags SET                     │
│        question_count = question_count+1 │
│      WHERE tag_id = ?                    │
│    COMMIT TRANSACTION                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 10. Index in Elasticsearch (Async)      │
│     kafka.publish('question.created', {  │
│       questionId, userId, title, body,   │
│       tags, timestamp: Date.now()        │
│     })                                   │
│                                          │
│     ES Consumer will:                    │
│     POST /questions/_doc/{questionId}    │
│     { title, body, tags, userId, ... }   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 11. Update User Stats                   │
│     UPDATE users SET                     │
│       question_count = question_count + 1│
│     WHERE user_id = ?                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 12. Award First Question Badge (If new) │
│     Check if first question:             │
│     SELECT COUNT(*) FROM questions       │
│     WHERE user_id = ?                    │
│                                          │
│     If count = 1:                        │
│       kafka.publish('badge.check', {     │
│         userId, badgeType: 'FIRST_POST'  │
│       })                                 │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 13. Notify Followers (Async)            │
│     Get users following this tag:        │
│     SELECT user_id FROM tag_followers    │
│     WHERE tag_id IN (?)                  │
│                                          │
│     kafka.publish('notification.send', { │
│       userIds, type: 'NEW_QUESTION',     │
│       questionId, title                  │
│     })                                   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 14. Return Response                     │
│     {                                    │
│       success: true,                     │
│       question: {                        │
│         questionId, title, body,         │
│         tags, viewCount: 0,              │
│         voteCount: 0,                    │
│         answerCount: 0,                  │
│         createdAt,                       │
│         author: {                        │
│           userId, username, reputation   │
│         }                                │
│       },                                 │
│       url: '/questions/{id}/...'         │
│     }                                    │
└─────────────────────────────────────────┘
```

**Performance**: <300ms question creation[^2] [^1]

***

### **Workflow 3: Post Answer**

```
┌─────────────┐
│   User      │
│   Posts     │
│   Answer    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. Frontend sends answer request        │
│    POST /api/v1/questions/:id/answers    │
│    Body: {                               │
│      body: "You can use async/await..."  │
│    }                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 2. Authenticate & Validate              │
│    - Verify JWT token                    │
│    - Check body length (min 30 chars)    │
│    - Validate questionId exists          │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 3. Check Question Status                │
│    SELECT status, user_id FROM questions │
│    WHERE question_id = ?                 │
│                                          │
│    - Status must be 'OPEN' (not closed)  │
│    - Check if question owner (can't      │
│      answer own question)                │
└──────┬──────────────────────────────────┘
       │
       ├─── Invalid State ───┐
       │                     ▼
       │              ┌──────────────┐
       │              │ Return Error │
       │              │ "Question    │
       │              │  closed/own" │
       │              └──────────────┘
       │
       └─── Valid ───┐
                     ▼
┌─────────────────────────────────────────┐
│ 4. Sanitize Answer Content              │
│    - Remove XSS                          │
│    - Parse Markdown to HTML              │
│    - Syntax highlight code blocks        │
│    - Generate excerpt                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 5. Create Answer Record                 │
│    BEGIN TRANSACTION                     │
│    INSERT INTO answers (                 │
│      answer_id, question_id, user_id,    │
│      body, body_html, vote_count,        │
│      is_accepted, created_at             │
│    ) VALUES (                            │
│      UUID(), ?, ?, 'You can use...',     │
│      '<p>You can use...</p>', 0,         │
│      FALSE, NOW()                        │
│    )                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 6. Update Question Stats                │
│    UPDATE questions SET                  │
│      answer_count = answer_count + 1,    │
│      last_activity_at = NOW()            │
│    WHERE question_id = ?                 │
│    COMMIT TRANSACTION                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 7. Update User Stats                    │
│    UPDATE users SET                      │
│      answer_count = answer_count + 1     │
│    WHERE user_id = ?                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 8. Index in Elasticsearch               │
│    kafka.publish('answer.posted', {      │
│      answerId, questionId, userId, body  │
│    })                                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 9. Notify Question Owner                │
│    SELECT user_id FROM questions         │
│    WHERE question_id = ?                 │
│                                          │
│    kafka.publish('notification.send', {  │
│      userId, type: 'NEW_ANSWER',         │
│      questionId, answerId                │
│    })                                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 10. Check for First Answer Badge        │
│     SELECT COUNT(*) FROM answers         │
│     WHERE user_id = ?                    │
│     If count = 1:                        │
│       kafka.publish('badge.check', {     │
│         userId, badgeType: 'FIRST_ANSWER'│
│       })                                 │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 11. Return Response                     │
│     {                                    │
│       success: true,                     │
│       answer: {                          │
│         answerId, body, voteCount: 0,    │
│         isAccepted: false,               │
│         createdAt,                       │
│         author: { ... }                  │
│       }                                  │
│     }                                    │
└─────────────────────────────────────────┘
```

**Performance**: <200ms answer creation[^1]

***

### **Workflow 4: Vote on Question/Answer**

```
┌─────────────┐
│   User      │
│  Upvotes    │
│   Answer    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. Frontend sends vote request          │
│    POST /api/v1/votes                    │
│    Body: {                               │
│      targetType: "ANSWER",               │
│      targetId: "ans_123",                │
│      voteType: "UPVOTE"                  │
│    }                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 2. Authenticate & Check Reputation      │
│    SELECT reputation FROM users          │
│    WHERE user_id = ?                     │
│                                          │
│    Upvote requires: reputation >= 15     │
│    Downvote requires: reputation >= 125  │
└──────┬──────────────────────────────────┘
       │
       ├─── Insufficient Rep ───┐
       │                        ▼
       │                 ┌──────────────┐
       │                 │ Return 403   │
       │                 │ "Need rep"   │
       │                 └──────────────┘
       │
       └─── Has Permission ───┐
                              ▼
┌─────────────────────────────────────────┐
│ 3. Check if Already Voted               │
│    SELECT vote_id, vote_type FROM votes  │
│    WHERE user_id = ?                     │
│      AND target_type = 'ANSWER'          │
│      AND target_id = 'ans_123'           │
└──────┬──────────────────────────────────┘
       │
       ├─── Already Voted Same ───┐
       │                          ▼
       │                   ┌──────────────┐
       │                   │ Return Error │
       │                   │ "Already     │
       │                   │  voted"      │
       │                   └──────────────┘
       │
       ├─── Voted Opposite ───┐
       │                      ▼
       │               ┌──────────────┐
       │               │ 3a. Change   │
       │               │  vote type   │
       │               │ (see below)  │
       │               └──────────────┘
       │
       └─── No Vote ───┐
                       ▼
┌─────────────────────────────────────────┐
│ 4. Prevent Self-Voting                  │
│    SELECT user_id FROM answers           │
│    WHERE answer_id = 'ans_123'           │
│                                          │
│    If answer.user_id == voting_user_id:  │
│      Return error "Can't vote on own"    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 5. Acquire Distributed Lock (Redis)     │
│    SETNX vote:lock:ans_123 {userId}      │
│         EX 5  # 5 second timeout         │
└──────┬──────────────────────────────────┘
       │
       ├─── Lock Failed ───┐
       │                   ▼
       │            ┌──────────────┐
       │            │ Retry or     │
       │            │ Return Error │
       │            └──────────────┘
       │
       └─── Lock Acquired ───┐
                             ▼
┌─────────────────────────────────────────┐
│ 6. Begin Database Transaction           │
│    BEGIN TRANSACTION                     │
│    INSERT INTO votes (                   │
│      vote_id, user_id, target_type,      │
│      target_id, vote_type, created_at    │
│    ) VALUES (                            │
│      UUID(), ?, 'ANSWER', 'ans_123',     │
│      'UPVOTE', NOW()                     │
│    )                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 7. Update Answer Vote Count             │
│    UPDATE answers SET                    │
│      vote_count = vote_count + 1         │
│    WHERE answer_id = 'ans_123'           │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 8. Update Author Reputation             │
│    Get answer author:                    │
│    SELECT user_id FROM answers           │
│    WHERE answer_id = 'ans_123'           │
│                                          │
│    UPDATE users SET                      │
│      reputation = reputation + 10        │
│    WHERE user_id = {author_id}           │
│                                          │
│    INSERT INTO reputation_history (      │
│      user_id, change_amount, reason,     │
│      source_id, created_at               │
│    ) VALUES (                            │
│      {author_id}, +10, 'ANSWER_UPVOTED', │
│      'ans_123', NOW()                    │
│    )                                     │
│    COMMIT TRANSACTION                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 9. Release Distributed Lock             │
│    DEL vote:lock:ans_123                 │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 10. Update Cache                        │
│     HINCRBY answer:ans_123 vote_count 1  │
│     HINCRBY user:{author_id} reputation 10│
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 11. Publish Events                      │
│     kafka.publish('vote.cast', {         │
│       voterId, targetType: 'ANSWER',     │
│       targetId, voteType: 'UPVOTE',      │
│       authorId, reputationChange: +10    │
│     })                                   │
│                                          │
│     kafka.publish('reputation.changed', {│
│       userId: authorId, change: +10,     │
│       newTotal, reason: 'ANSWER_UPVOTED' │
│     })                                   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 12. Notify Answer Author (Async)        │
│     kafka.publish('notification.send', { │
│       userId: authorId,                  │
│       type: 'ANSWER_UPVOTED',            │
│       voterId, answerId                  │
│     })                                   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 13. Check for Nice Answer Badge         │
│     If answer.vote_count >= 10:          │
│       kafka.publish('badge.check', {     │
│         userId: authorId,                │
│         badgeType: 'NICE_ANSWER',        │
│         answerId                         │
│       })                                 │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 14. Return Response                     │
│     {                                    │
│       success: true,                     │
│       voteCount: 11,                     │
│       userVote: "UPVOTE",                │
│       authorReputationChange: +10        │
│     }                                    │
└─────────────────────────────────────────┘
```

**Performance**: <100ms vote processing[^1]

***

### **Workflow 5: Post Comment**

```
┌─────────────┐
│   User      │
│   Adds      │
│  Comment    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. Frontend sends comment request       │
│    POST /api/v1/answers/:id/comments     │
│    Body: {                               │
│      text: "Great answer! But what if..."│
│    }                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 2. Authenticate & Check Reputation      │
│    SELECT reputation FROM users          │
│    WHERE user_id = ?                     │
│                                          │
│    Comment everywhere: reputation >= 50  │
│    Comment own posts: reputation >= 1    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 3. Validate Comment                     │
│    - Length: 15-600 characters           │
│    - Rate limit: max 30 comments/hour    │
│    - Sanitize for XSS                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 4. Check Parent Exists                  │
│    SELECT answer_id, user_id             │
│    FROM answers                          │
│    WHERE answer_id = ?                   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 5. Create Comment Record                │
│    BEGIN TRANSACTION                     │
│    INSERT INTO comments (                │
│      comment_id, parent_type,            │
│      parent_id, user_id, text,           │
│      created_at                          │
│    ) VALUES (                            │
│      UUID(), 'ANSWER', ?,                │
│      ?, 'Great answer! But...',          │
│      NOW()                               │
│    )                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 6. Update Answer Comment Count          │
│    UPDATE answers SET                    │
│      comment_count = comment_count + 1,  │
│      last_activity_at = NOW()            │
│    WHERE answer_id = ?                   │
│    COMMIT TRANSACTION                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 7. Notify Answer Author                 │
│    kafka.publish('notification.send', {  │
│      userId: answer.user_id,             │
│      type: 'COMMENT_ON_ANSWER',          │
│      commentId, commentText              │
│    })                                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 8. Parse @mentions                      │
│    Extract usernames from comment:       │
│    "@john what do you think?"            │
│                                          │
│    For each mention:                     │
│      kafka.publish('notification.send', {│
│        userId, type: 'MENTIONED',        │
│        commentId                         │
│      })                                  │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 9. Return Response                      │
│    {                                     │
│      success: true,                      │
│      comment: {                          │
│        commentId, text, createdAt,       │
│        author: { username, reputation }  │
│      }                                   │
│    }                                     │
└─────────────────────────────────────────┘
```


***

## Database Schema Design

### **Users Table**

```sql
CREATE TABLE users (
    user_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    display_name VARCHAR(100) NOT NULL,
    
    -- Stats
    reputation INT DEFAULT 1,
    question_count INT DEFAULT 0,
    answer_count INT DEFAULT 0,
    
    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    is_moderator BOOLEAN DEFAULT FALSE,
    status ENUM('ACTIVE', 'SUSPENDED', 'DELETED') DEFAULT 'ACTIVE',
    
    -- Profile
    about_me TEXT,
    location VARCHAR(100),
    website VARCHAR(255),
    avatar_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_reputation (reputation DESC),
    INDEX idx_status (status)
);
```


### **Questions Table**

```sql
CREATE TABLE questions (
    question_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    
    title VARCHAR(150) NOT NULL,
    body TEXT NOT NULL,
    body_html TEXT NOT NULL,
    excerpt VARCHAR(500),
    
    -- Stats
    view_count INT DEFAULT 0,
    vote_count INT DEFAULT 0,
    answer_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    favorite_count INT DEFAULT 0,
    
    -- Status
    status ENUM('OPEN', 'CLOSED', 'DELETED', 'PROTECTED') DEFAULT 'OPEN',
    close_reason VARCHAR(255),
    
    -- Accepted answer
    accepted_answer_id BIGINT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    FULLTEXT INDEX idx_title_body (title, body),
    INDEX idx_user (user_id, created_at DESC),
    INDEX idx_status (status, last_activity_at DESC),
    INDEX idx_vote_count (vote_count DESC, created_at DESC),
    INDEX idx_created (created_at DESC)
);
```


### **Answers Table**

```sql
CREATE TABLE answers (
    answer_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    question_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    
    body TEXT NOT NULL,
    body_html TEXT NOT NULL,
    
    -- Stats
    vote_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    
    -- Status
    is_accepted BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    INDEX idx_question (question_id, vote_count DESC),
    INDEX idx_user (user_id, created_at DESC),
    INDEX idx_vote_count (vote_count DESC, created_at DESC),
    INDEX idx_accepted (is_accepted, question_id)
);
```


### **Comments Table**

```sql
CREATE TABLE comments (
    comment_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    
    -- Parent can be question or answer
    parent_type ENUM('QUESTION', 'ANSWER') NOT NULL,
    parent_id BIGINT NOT NULL,
    
    text VARCHAR(600) NOT NULL,
    
    -- Stats
    vote_count INT DEFAULT 0,
    
    -- Status
    is_deleted BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    INDEX idx_parent (parent_type, parent_id, created_at),
    INDEX idx_user (user_id, created_at DESC)
);
```


### **Tags Table**

```sql
CREATE TABLE tags (
    tag_id INT PRIMARY KEY AUTO_INCREMENT,
    tag_name VARCHAR(50) UNIQUE NOT NULL,
    tag_slug VARCHAR(50) UNIQUE NOT NULL,
    
    description TEXT,
    wiki_excerpt TEXT,
    
    question_count INT DEFAULT 0,
    follower_count INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_name (tag_name),
    INDEX idx_slug (tag_slug),
    INDEX idx_count (question_count DESC)
);
```


### **Question Tags Junction Table**

```sql
CREATE TABLE question_tags (
    question_id BIGINT NOT NULL,
    tag_id INT NOT NULL,
    
    PRIMARY KEY (question_id, tag_id),
    
    FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE,
    
    INDEX idx_tag (tag_id, question_id)
);
```


### **Votes Table**

```sql
CREATE TABLE votes (
    vote_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    
    -- Target can be question, answer, or comment
    target_type ENUM('QUESTION', 'ANSWER', 'COMMENT') NOT NULL,
    target_id BIGINT NOT NULL,
    
    vote_type ENUM('UPVOTE', 'DOWNVOTE') NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_vote (user_id, target_type, target_id),
    INDEX idx_target (target_type, target_id),
    INDEX idx_user (user_id, created_at DESC)
);
```


### **Reputation History Table**

```sql
CREATE TABLE reputation_history (
    history_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    
    change_amount INT NOT NULL COMMENT 'Can be positive or negative',
    reason ENUM('QUESTION_UPVOTED', 'QUESTION_DOWNVOTED',
                'ANSWER_UPVOTED', 'ANSWER_DOWNVOTED',
                'ANSWER_ACCEPTED', 'ACCEPT_ANSWER',
                'DOWNVOTE_PENALTY', 'BOUNTY_AWARDED',
                'SPAM_REMOVED', 'MANUAL_ADJUSTMENT') NOT NULL,
    
    source_type VARCHAR(20) COMMENT 'QUESTION, ANSWER, etc.',
    source_id BIGINT COMMENT 'ID of the source entity',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    INDEX idx_user_date (user_id, created_at DESC)
);
```


### **Badges Table**

```sql
CREATE TABLE badges (
    badge_id INT PRIMARY KEY AUTO_INCREMENT,
    badge_name VARCHAR(50) UNIQUE NOT NULL,
    badge_description TEXT,
    
    badge_class ENUM('GOLD', 'SILVER', 'BRONZE') NOT NULL,
    badge_category ENUM('PARTICIPATION', 'MODERATION', 'QUALITY', 
                        'TAG_BASED', 'SPECIAL') NOT NULL,
    
    award_count INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_class (badge_class)
);
```


### **User Badges Junction Table**

```sql
CREATE TABLE user_badges (
    user_badge_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    badge_id INT NOT NULL,
    
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(badge_id) ON DELETE CASCADE,
    
    INDEX idx_user (user_id, awarded_at DESC),
    INDEX idx_badge (badge_id, awarded_at DESC)
);
```


### **Post Edit History Table**

```sql
CREATE TABLE post_edit_history (
    revision_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    post_type ENUM('QUESTION', 'ANSWER') NOT NULL,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    
    title_before VARCHAR(150),
    title_after VARCHAR(150),
    body_before TEXT,
    body_after TEXT,
    
    edit_comment VARCHAR(500),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    
    INDEX idx_post (post_type, post_id, created_at DESC)
);
```


***

## Low-Level Design (LLD) - TypeScript

### **Domain Models**

```typescript
// Enums
enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED'
}

enum QuestionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  DELETED = 'DELETED',
  PROTECTED = 'PROTECTED'
}

enum VoteType {
  UPVOTE = 'UPVOTE',
  DOWNVOTE = 'DOWNVOTE'
}

enum BadgeClass {
  GOLD = 'GOLD',
  SILVER = 'SILVER',
  BRONZE = 'BRONZE'
}

enum ReputationChangeReason {
  QUESTION_UPVOTED = 'QUESTION_UPVOTED',
  QUESTION_DOWNVOTED = 'QUESTION_DOWNVOTED',
  ANSWER_UPVOTED = 'ANSWER_UPVOTED',
  ANSWER_DOWNVOTED = 'ANSWER_DOWNVOTED',
  ANSWER_ACCEPTED = 'ANSWER_ACCEPTED',
  ACCEPT_ANSWER = 'ACCEPT_ANSWER',
  DOWNVOTE_PENALTY = 'DOWNVOTE_PENALTY'
}

// Interfaces
interface User {
  userId: string;
  username: string;
  email: string;
  displayName: string;
  reputation: number;
  questionCount: number;
  answerCount: number;
  isVerified: boolean;
  isModerator: boolean;
  status: UserStatus;
  avatarUrl?: string;
  aboutMe?: string;
  location?: string;
  website?: string;
  createdAt: Date;
  lastSeenAt: Date;
}

interface Question {
  questionId: string;
  userId: string;
  title: string;
  body: string;
  bodyHtml: string;
  excerpt: string;
  viewCount: number;
  voteCount: number;
  answerCount: number;
  commentCount: number;
  status: QuestionStatus;
  acceptedAnswerId?: string;
  createdAt: Date;
  lastActivityAt: Date;
}

interface Answer {
  answerId: string;
  questionId: string;
  userId: string;
  body: string;
  bodyHtml: string;
  voteCount: number;
  commentCount: number;
  isAccepted: boolean;
  createdAt: Date;
}

interface Comment {
  commentId: string;
  userId: string;
  parentType: 'QUESTION' | 'ANSWER';
  parentId: string;
  text: string;
  voteCount: number;
  createdAt: Date;
}

interface Vote {
  voteId: string;
  userId: string;
  targetType: 'QUESTION' | 'ANSWER' | 'COMMENT';
  targetId: string;
  voteType: VoteType;
  createdAt: Date;
}
```


### **Reputation Calculator**

```typescript
class ReputationCalculator {
  private static readonly REPUTATION_POINTS: Record<ReputationChangeReason, number> = {
    [ReputationChangeReason.QUESTION_UPVOTED]: 5,
    [ReputationChangeReason.QUESTION_DOWNVOTED]: -2,
    [ReputationChangeReason.ANSWER_UPVOTED]: 10,
    [ReputationChangeReason.ANSWER_DOWNVOTED]: -2,
    [ReputationChangeReason.ANSWER_ACCEPTED]: 15,
    [ReputationChangeReason.ACCEPT_ANSWER]: 2,
    [ReputationChangeReason.DOWNVOTE_PENALTY]: -1
  };

  static calculateChange(reason: ReputationChangeReason): number {
    return this.REPUTATION_POINTS[reason] || 0;
  }

  static canPerformAction(reputation: number, action: string): boolean {
    const privileges: Record<string, number> = {
      'UPVOTE': 15,
      'COMMENT_EVERYWHERE': 50,
      'DOWNVOTE': 125,
      'EDIT_COMMUNITY_WIKI': 100,
      'EDIT_QUESTIONS_ANSWERS': 2000,
      'VOTE_TO_DELETE': 10000
    };

    return reputation >= (privileges[action] || 0);
  }

  static getPrivilegeLevel(reputation: number): string {
    if (reputation >= 25000) return 'Trusted User';
    if (reputation >= 10000) return 'Moderator Tools';
    if (reputation >= 3000) return 'Vote to Delete';
    if (reputation >= 2000) return 'Edit Posts';
    if (reputation >= 500) return 'Edit Questions/Answers';
    if (reputation >= 125) return 'Downvote';
    if (reputation >= 50) return 'Comment Everywhere';
    if (reputation >= 15) return 'Upvote';
    return 'New User';
  }
}
```


### **User Service**

```typescript
interface IUserRepository {
  createUser(user: Partial<User>): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findById(userId: string): Promise<User | null>;
  updateUser(userId: string, updates: Partial<User>): Promise<void>;
  updateReputation(userId: string, change: number): Promise<number>;
}

interface IPasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}

interface IJWTService {
  generateAccessToken(payload: any): string;
  generateRefreshToken(payload: any): string;
  verifyToken(token: string): any;
}

class UserService {
  constructor(
    private userRepository: IUserRepository,
    private passwordHasher: IPasswordHasher,
    private jwtService: IJWTService,
    private eventPublisher: IEventPublisher
  ) {}

  async registerUser(data: {
    email: string;
    username: string;
    password: string;
    displayName: string;
  }): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    // Validate input
    this.validateRegistration(data);

    // Check for duplicates
    const existingEmail = await this.userRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new Error('Email already registered');
    }

    const existingUsername = await this.userRepository.findByUsername(data.username);
    if (existingUsername) {
      throw new Error('Username already taken');
    }

    // Hash password
    const passwordHash = await this.passwordHasher.hash(data.password);

    // Create user
    const user = await this.userRepository.createUser({
      email: data.email,
      username: data.username,
      displayName: data.displayName,
      passwordHash,
      reputation: 1,
      questionCount: 0,
      answerCount: 0,
      isVerified: false,
      isModerator: false,
      status: UserStatus.ACTIVE,
      createdAt: new Date(),
      lastSeenAt: new Date()
    });

    // Generate tokens
    const accessToken = this.jwtService.generateAccessToken({
      userId: user.userId,
      username: user.username,
      reputation: user.reputation
    });

    const refreshToken = this.jwtService.generateRefreshToken({
      userId: user.userId
    });

    // Publish event
    await this.eventPublisher.publish('user.registered', {
      userId: user.userId,
      email: user.email,
      timestamp: Date.now()
    });

    return { user, accessToken, refreshToken };
  }

  async login(email: string, password: string): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new Error('Account is suspended or deleted');
    }

    const isValidPassword = await this.passwordHasher.compare(password, user.passwordHash);

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const accessToken = this.jwtService.generateAccessToken({
      userId: user.userId,
      username: user.username,
      reputation: user.reputation
    });

    const refreshToken = this.jwtService.generateRefreshToken({
      userId: user.userId
    });

    return { user, accessToken, refreshToken };
  }

  private validateRegistration(data: any): void {
    if (!this.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    if (!this.isValidUsername(data.username)) {
      throw new Error('Username must be 3-20 alphanumeric characters');
    }

    if (!this.isValidPassword(data.password)) {
      throw new Error('Password must be at least 8 characters with uppercase, lowercase, and number');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  }

  private isValidPassword(password: string): boolean {
    return password.length >= 8 &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /[0-9]/.test(password);
  }
}
```


### **Question Service**

```typescript
interface IQuestionRepository {
  createQuestion(question: Partial<Question>): Promise<Question>;
  findById(questionId: string): Promise<Question | null>;
  updateQuestion(questionId: string, updates: Partial<Question>): Promise<void>;
  incrementViewCount(questionId: string): Promise<void>;
  incrementAnswerCount(questionId: string): Promise<void>;
}

interface ITagRepository {
  findByNames(tagNames: string[]): Promise<Tag[]>;
  linkTagsToQuestion(questionId: string, tagIds: number[]): Promise<void>;
  incrementQuestionCount(tagId: number): Promise<void>;
}

interface IContentSanitizer {
  sanitizeHtml(html: string): string;
  markdownToHtml(markdown: string): string;
  extractExcerpt(text: string, maxLength: number): string;
}

class QuestionService {
  constructor(
    private questionRepository: IQuestionRepository,
    private tagRepository: ITagRepository,
    private userRepository: IUserRepository,
    private contentSanitizer: IContentSanitizer,
    private searchIndexer: ISearchIndexer,
    private eventPublisher: IEventPublisher
  ) {}

  async createQuestion(data: {
    userId: string;
    title: string;
    body: string;
    tags: string[];
  }): Promise<Question> {
    // Validate
    this.validateQuestion(data);

    // Check user privileges
    const user = await this.userRepository.findById(data.userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new Error('Cannot post questions while suspended');
    }

    // Check rate limit (implementation omitted)
    // await this.checkRateLimit(data.userId);

    // Sanitize content
    const bodyHtml = this.contentSanitizer.markdownToHtml(data.body);
    const sanitizedHtml = this.contentSanitizer.sanitizeHtml(bodyHtml);
    const excerpt = this.contentSanitizer.extractExcerpt(data.body, 500);

    // Validate and fetch tags
    const tags = await this.tagRepository.findByNames(data.tags);
    if (tags.length !== data.tags.length) {
      throw new Error('One or more tags are invalid');
    }

    // Create question
    const question = await this.questionRepository.createQuestion({
      userId: data.userId,
      title: data.title.trim(),
      body: data.body,
      bodyHtml: sanitizedHtml,
      excerpt,
      viewCount: 0,
      voteCount: 0,
      answerCount: 0,
      commentCount: 0,
      status: QuestionStatus.OPEN,
      createdAt: new Date(),
      lastActivityAt: new Date()
    });

    // Link tags
    const tagIds = tags.map(t => t.tagId);
    await this.tagRepository.linkTagsToQuestion(question.questionId, tagIds);

    // Update tag counts
    for (const tagId of tagIds) {
      await this.tagRepository.incrementQuestionCount(tagId);
    }

    // Update user stats
    await this.userRepository.updateUser(data.userId, {
      questionCount: user.questionCount + 1
    });

    // Index in search
    await this.searchIndexer.indexQuestion(question, tags);

    // Publish event
    await this.eventPublisher.publish('question.created', {
      questionId: question.questionId,
      userId: data.userId,
      title: question.title,
      tags: data.tags,
      timestamp: Date.now()
    });

    return question;
  }

  private validateQuestion(data: any): void {
    if (!data.title || data.title.length < 15 || data.title.length > 150) {
      throw new Error('Title must be between 15 and 150 characters');
    }

    if (!data.body || data.body.length < 30) {
      throw new Error('Question body must be at least 30 characters');
    }

    if (!data.tags || data.tags.length < 1 || data.tags.length > 5) {
      throw new Error('Must have 1-5 tags');
    }
  }
}
```


### **Vote Service**

```typescript
interface IVoteRepository {
  findVote(userId: string, targetType: string, targetId: string): Promise<Vote | null>;
  createVote(vote: Partial<Vote>): Promise<Vote>;
  updateVote(voteId: string, voteType: VoteType): Promise<void>;
  deleteVote(voteId: string): Promise<void>;
}

interface IVoteLockManager {
  acquireLock(targetId: string): Promise<boolean>;
  releaseLock(targetId: string): Promise<void>;
}

class VoteService {
  constructor(
    private voteRepository: IVoteRepository,
    private userRepository: IUserRepository,
    private questionRepository: IQuestionRepository,
    private answerRepository: IAnswerRepository,
    private voteLockManager: IVoteLockManager,
    private reputationService: IReputationService,
    private eventPublisher: IEventPublisher
  ) {}

  async castVote(data: {
    userId: string;
    targetType: 'QUESTION' | 'ANSWER';
    targetId: string;
    voteType: VoteType;
  }): Promise<{ voteCount: number; authorReputationChange: number }> {
    // Check user reputation
    const user = await this.userRepository.findById(data.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const requiredReputation = data.voteType === VoteType.UPVOTE ? 15 : 125;
    if (user.reputation < requiredReputation) {
      throw new Error(`Need ${requiredReputation} reputation to ${data.voteType.toLowerCase()}`);
    }

    // Get target author
    const target = await this.getTarget(data.targetType, data.targetId);
    if (!target) {
      throw new Error('Target not found');
    }

    // Prevent self-voting
    if (target.userId === data.userId) {
      throw new Error('Cannot vote on your own post');
    }

    // Check existing vote
    const existingVote = await this.voteRepository.findVote(
      data.userId,
      data.targetType,
      data.targetId
    );

    if (existingVote && existingVote.voteType === data.voteType) {
      throw new Error('Already voted');
    }

    // Acquire distributed lock
    const lockAcquired = await this.voteLockManager.acquireLock(data.targetId);
    if (!lockAcquired) {
      throw new Error('Unable to process vote. Please try again.');
    }

    try {
      let reputationChange = 0;

      if (existingVote) {
        // Change vote
        await this.voteRepository.updateVote(existingVote.voteId, data.voteType);
        reputationChange = this.calculateVoteChange(data.targetType, existingVote.voteType, data.voteType);
      } else {
        // New vote
        await this.voteRepository.createVote({
          userId: data.userId,
          targetType: data.targetType,
          targetId: data.targetId,
          voteType: data.voteType,
          createdAt: new Date()
        });
        reputationChange = this.calculateReputationChange(data.targetType, data.voteType);
      }

      // Update vote count on target
      const voteCountChange = existingVote ? (data.voteType === VoteType.UPVOTE ? 2 : -2) : (data.voteType === VoteType.UPVOTE ? 1 : -1);
      await this.updateTargetVoteCount(data.targetType, data.targetId, voteCountChange);

      // Update author reputation
      await this.reputationService.updateReputation(
        target.userId,
        reputationChange,
        this.getReputationReason(data.targetType, data.voteType),
        data.targetId
      );

      // Get updated vote count
      const updatedTarget = await this.getTarget(data.targetType, data.targetId);

      // Publish event
      await this.eventPublisher.publish('vote.cast', {
        voterId: data.userId,
        targetType: data.targetType,
        targetId: data.targetId,
        voteType: data.voteType,
        authorId: target.userId,
        reputationChange,
        timestamp: Date.now()
      });

      return {
        voteCount: updatedTarget.voteCount,
        authorReputationChange: reputationChange
      };

    } finally {
      await this.voteLockManager.releaseLock(data.targetId);
    }
  }

  private calculateReputationChange(targetType: string, voteType: VoteType): number {
    if (targetType === 'QUESTION') {
      return voteType === VoteType.UPVOTE ? 5 : -2;
    } else if (targetType === 'ANSWER') {
      return voteType === VoteType.UPVOTE ? 10 : -2;
    }
    return 0;
  }

  private calculateVoteChange(targetType: string, oldVote: VoteType, newVote: VoteType): number {
    const oldChange = this.calculateReputationChange(targetType, oldVote);
    const newChange = this.calculateReputationChange(targetType, newVote);
    return newChange - oldChange;
  }

  private getReputationReason(targetType: string, voteType: VoteType): ReputationChangeReason {
    if (targetType === 'QUESTION') {
      return voteType === VoteType.UPVOTE
        ? ReputationChangeReason.QUESTION_UPVOTED
        : ReputationChangeReason.QUESTION_DOWNVOTED;
    } else {
      return voteType === VoteType.UPVOTE
        ? ReputationChangeReason.ANSWER_UPVOTED
        : ReputationChangeReason.ANSWER_DOWNVOTED;
    }
  }

  private async getTarget(targetType: string, targetId: string): Promise<any> {
    if (targetType === 'QUESTION') {
      return await this.questionRepository.findById(targetId);
    } else {
      return await this.answerRepository.findById(targetId);
    }
  }

  private async updateTargetVoteCount(targetType: string, targetId: string, change: number): Promise<void> {
    if (targetType === 'QUESTION') {
      await this.questionRepository.updateQuestion(targetId, {
        voteCount: change // Actual implementation would use SQL increment
      });
    } else {
      await this.answerRepository.updateAnswer(targetId, {
        voteCount: change
      });
    }
  }
}
```


***

## Key Design Patterns \& Optimizations

1. **Reputation System**: Point-based gamification with privilege levels[^4] [^5] [^1]
2. **Distributed Locks**: Prevent duplicate votes with Redis locks[^1]
3. **Event-Driven Architecture**: Async notifications and indexing[^2] [^1]
4. **Full-Text Search**: Elasticsearch for fast question search[^2] [^1]
5. **Read Replicas**: 5+ replicas for scaling read queries[^2]
6. **Cache Layer**: Hot questions and user sessions cached[^2] [^1]
7. **Rate Limiting**: Prevent spam with per-user limits
8. **Content Sanitization**: XSS protection with HTML sanitizer

**Performance**: **<200ms question load**, **<100ms voting**, **99.9% uptime**, handles **6000+ requests/second**.[^3] [^1] [^2]
<span style="display:none">[^10] [^6] [^7] [^8] [^9]</span>

<div align="center">⁂</div>

[^1]: https://www.geeksforgeeks.org/system-design/system-design-stack-overflow/

[^2]: https://blog.bytebytego.com/p/ep27-stack-overflow-architecture

[^3]: https://newsletter.techworld-with-milan.com/p/stack-overflow-architecture

[^4]: https://sdlccorp.com/post/how-to-build-a-reputation-system-for-crypto-exchange-users/

[^5]: https://sloanreview.mit.edu/article/online-reputation-systems-how-to-design-one-that-does-what-you-need/

[^6]: https://stackoverflow.com/questions/tagged/system-design

[^7]: https://www.youtube.com/watch?v=fKc050dvNIE

[^8]: https://highscalability.com/stack-overflow-architecture/

[^9]: https://www.integrate.io/blog/complete-guide-to-database-schema-design-guide/

[^10]: https://www.dbvis.com/thetable/database-schema-design-a-comprehensive-guide-for-beginners-2/

