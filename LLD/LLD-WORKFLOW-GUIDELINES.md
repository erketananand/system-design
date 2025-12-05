# LLD INTERVIEW PROBLEMS (COMPLETE GUIDE)

## Overview
This document provides a streamlined, structured approach to design and implement Low-Level Design (LLD) systems.

---

## WORKFLOW STEPS

### **Step 1: Requirements Gathering & Feature Classification**

**Objective:** Define clear, implementable scope

**Output File:** `{system-name}-requirements.md`

**Process:**
1. Analyze the system domain
2. Classify features into three categories:

   **Primary Features (4-6 features)** - Core/MVP
   - Essential functionality without which system cannot operate
   - Must be implemented for basic system operation
   - Focus on "must-have" not "nice-to-have"

   **Secondary Features (2-3 features)**
   - Important but not critical for MVP
   - Enhance user experience
   - Can be added after core functionality

   **Future Enhancements (2-3 features)**
   - Advanced features for scaling
   - Require architectural extensions
   - Demonstrate system extensibility

**Template Structure:**
```markdown
# {SYSTEM NAME} - REQUIREMENTS DOCUMENT

## PROJECT SCOPE:
[Brief description of the system]

## PRIMARY FEATURES (CORE/MVP):
1. Feature Name
   - Sub-requirement 1
   - Sub-requirement 2

## SECONDARY FEATURES:
1. Feature Name
   - Details

## FUTURE ENHANCEMENTS:
1. Feature Name
   - Details

## KEY DESIGN NOTES:
- Important design decisions
- Constraints and assumptions

## IMPLEMENTATION DETAILS:
- Technology: Node.js with TypeScript
- Interface: Console-based dynamic input
- Storage: In-memory data layer
```

**Deliverable:** Markdown file with categorized features, design notes, and implementation details

---

### **Step 2: Low-Level Design (LLD)**

**Objective:** Create comprehensive class diagram with design patterns

**Output File:** `{system-name}-class-diagram.md`

**Process:**
1. Identify core entities (nouns in requirements)
2. Define relationships (associations, inheritance, composition)
3. Apply design patterns:
   - **Creational:** Singleton, Factory, Builder
   - **Structural:** Adapter, Facade, Decorator
   - **Behavioral:** State, Strategy, Observer, Command

4. Document each class:
   - Attributes with types
   - Methods with parameters and return types
   - Responsibilities and constraints

**Template Structure:**
```markdown
# {SYSTEM NAME} - Class Diagram

## Core Classes

### ClassName
- attribute1: type
- attribute2: type
- Methods:
  - method1(param: type): returnType
  - method2(): void

[Repeat for each class]

## Design Patterns Applied
1. Pattern Name
   - Classes involved
   - Justification

## Relationships
- Class A (1) → (M) Class B
- Class C extends Class D
```

**Key Design Principles:**
- Single Responsibility Principle
- Open/Closed Principle
- Dependency Inversion
- Interface Segregation

**Deliverable:** Markdown file with complete class diagram and design patterns

---

### **Step 3: Data Modeling**

**Objective:** Design normalized database schema

**Output File:** `{system-name}-schema.md`

**Process:**
1. Map domain entities to database tables
2. Define:
   - Primary keys (PK)
   - Foreign keys (FK)
   - Constraints (NOT NULL, UNIQUE, CHECK)
   - Indexes for performance

3. Establish relationships:
   - One-to-One (1:1)
   - One-to-Many (1:M)
   - Many-to-Many (M:N)

4. Normalize to 3NF (Third Normal Form)

**Template Structure:**
```markdown
# {SYSTEM NAME} - Database Schema

## Table: TableName

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| name | VARCHAR(100) | NOT NULL | Name field |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `name`
- FOREIGN KEY: `ref_id` REFERENCES `OtherTable(id)`

[Repeat for each table]

## Relationships
- TableA (1) → (M) TableB
```

**Deliverable:** Markdown file with detailed schemas and relationships

---

### **Step 4: Implementation - FILE GENERATION GUIDE**

**Objective:** Build complete working system in TypeScript

**Technology Stack:**
- **Language:** TypeScript (Node.js)
- **Interface:** Console-based with readline
- **Storage:** In-memory (Maps/Arrays)
- **Architecture:** Layered (Models → Repositories → Services → Controllers → Console)

---

## 📁 DETAILED FILE GENERATION INSTRUCTIONS

### **Phase 1: Configuration Files (4 files)**

#### File 1: `package.json`
```json
{
  "name": "{system-name}",
  "version": "1.0.0",
  "description": "{System Name} LLD Implementation",
  "main": "dist/console/ConsoleInterface.js",
  "scripts": {
    "build": "tsc",
    "start": "tsc && node dist/console/ConsoleInterface.js",
    "dev": "ts-node src/console/ConsoleInterface.ts"
  },
  "keywords": ["lld", "typescript", "design-patterns"],
  "author": "",
  "license": "MIT",
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.1"
  }
}
```

#### File 2: `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### File 3: `.gitignore`
```
node_modules
dist
*.log
.env
.DS_Store
*.zip
```

#### File 4: `README.md`
```markdown
# {System Name} - LLD Implementation

## Quick Start
npm install
npm start

## Features
[List main features]

## Architecture
[Describe layers]

## Design Patterns
[List patterns used]
```

---

### **Phase 2: Enums (8-12 files)**

**Location:** `src/enums/`

**Purpose:** Type-safe enumerations for constants

**Common Enums to Create:**

#### 1. Status Enum
```typescript
// src/enums/Status.ts
export enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}
```

#### 2. Type Enums (varies by system)
```typescript
// Example: src/enums/UserType.ts
export enum UserType {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF'
}
```

#### 3. Action/Operation Enums
```typescript
// src/enums/OperationType.ts
export enum OperationType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  READ = 'READ'
}
```

**Guidelines:**
- Use UPPER_CASE for enum values
- Create one enum per concept
- Export all enums
- Keep enums simple (no complex logic)

---

### **Phase 3: Utility Classes (2 files)**

**Location:** `src/utils/`

#### File 1: `IdGenerator.ts`
```typescript
export class IdGenerator {
  private static counter = 0;

  static generateUUID(): string {
    this.counter++;
    return `${Date.now()}-${this.counter}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static generateId(prefix: string = 'ID'): string {
    this.counter++;
    return `${prefix}-${Date.now()}-${this.counter}`;
  }
}
```

#### File 2: `Logger.ts`
```typescript
export class Logger {
  static info(msg: string): void {
    console.log(`[INFO] ${new Date().toISOString()} - ${msg}`);
  }

  static error(msg: string): void {
    console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`);
  }

  static success(msg: string): void {
    console.log(`[SUCCESS] ${new Date().toISOString()} - ${msg}`);
  }

  static warn(msg: string): void {
    console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`);
  }

  static debug(msg: string): void {
    console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`);
  }
}
```

---

### **Phase 4: Models (5-10 files)**

**Location:** `src/models/`

**Purpose:** Domain entities with business logic

**Model Template:**
```typescript
import { IdGenerator } from '../utils/IdGenerator';

export class ModelName {
  public readonly id: string;
  public attribute1: Type1;
  public attribute2: Type2;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(attribute1: Type1, attribute2: Type2, id?: string) {
    this.id = id || IdGenerator.generateUUID();
    this.attribute1 = attribute1;
    this.attribute2 = attribute2;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // Business logic methods
  public someBusinessMethod(): void {
    // Implementation
    this.update();
  }

  public update(): void {
    this.updatedAt = new Date();
  }

  // Validation methods
  public isValid(): boolean {
    return this.attribute1 !== null && this.attribute2 !== null;
  }
}
```

**Guidelines:**
- Include all domain attributes
- Add business validation methods
- Implement helper methods (calculate, transform, etc.)
- Use readonly for id
- Track createdAt and updatedAt
- Call update() when changing state

---

### **Phase 5: Design Patterns (varies by system)**

#### **A. State Pattern (if applicable)**

**Location:** `src/states/`

**When to Use:** Object behavior changes based on internal state

**Files to Create:**

1. **State Interface**
```typescript
// src/states/StateInterface.ts
export interface IState {
  handleAction(context: ContextClass): void;
  getStateName(): string;
}
```

2. **Concrete States** (2-5 files)
```typescript
// src/states/ConcreteStateA.ts
import { IState } from './StateInterface';

export class ConcreteStateA implements IState {
  handleAction(context: ContextClass): void {
    // State-specific behavior
  }

  getStateName(): string {
    return 'STATE_A';
  }
}
```

#### **B. Strategy Pattern (if applicable)**

**Location:** `src/strategies/`

**When to Use:** Multiple algorithm variants that can be swapped

**Files to Create:**

1. **Strategy Interface**
```typescript
// src/strategies/StrategyInterface.ts
export interface IStrategy {
  execute(input: InputType): OutputType;
  getStrategyName(): string;
}
```

2. **Concrete Strategies** (2-5 files)
```typescript
// src/strategies/ConcreteStrategyA.ts
import { IStrategy } from './StrategyInterface';

export class ConcreteStrategyA implements IStrategy {
  execute(input: InputType): OutputType {
    // Algorithm implementation
  }

  getStrategyName(): string {
    return 'STRATEGY_A';
  }
}
```

#### **C. Factory Pattern (if applicable)**

**Location:** `src/factories/`

**When to Use:** Complex object creation with multiple variants

```typescript
// src/factories/EntityFactory.ts
export class EntityFactory {
  static create(type: EntityType, ...params): Entity {
    switch(type) {
      case EntityType.TYPE_A:
        return new EntityA(...params);
      case EntityType.TYPE_B:
        return new EntityB(...params);
      default:
        throw new Error('Unknown entity type');
    }
  }
}
```

---

### **Phase 6: Database Layer (1 file)**

**Location:** `src/database/`

#### File: `InMemoryDatabase.ts`
```typescript
import { Entity1 } from '../models/Entity1';
import { Entity2 } from '../models/Entity2';

export class InMemoryDatabase {
  private static instance: InMemoryDatabase;

  // Storage maps (one per entity)
  public entity1s: Map<string, Entity1> = new Map();
  public entity2s: Map<string, Entity2> = new Map();
  // Add more as needed

  private constructor() {
    console.log('[DATABASE] In-Memory Database initialized');
  }

  public static getInstance(): InMemoryDatabase {
    if (!InMemoryDatabase.instance) {
      InMemoryDatabase.instance = new InMemoryDatabase();
    }
    return InMemoryDatabase.instance;
  }

  public clearAll(): void {
    this.entity1s.clear();
    this.entity2s.clear();
    console.log('[DATABASE] All data cleared');
  }

  public getStats(): Record<string, number> {
    return {
      entity1s: this.entity1s.size,
      entity2s: this.entity2s.size,
    };
  }

  public printStats(): void {
    const stats = this.getStats();
    console.log('\n[DATABASE STATS]');
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
  }
}
```

---

### **Phase 7: Repository Layer (5-10 files)**

**Location:** `src/repositories/`

**Purpose:** Data access abstraction

#### File 1: Generic Interface
```typescript
// src/repositories/IRepository.ts
export interface IRepository<T> {
  findById(id: string): T | undefined;
  findAll(): T[];
  save(entity: T): T;
  delete(id: string): boolean;
  exists(id: string): boolean;
  count(): number;
  clear(): void;
}
```

#### Files 2-N: Entity Repositories
```typescript
// src/repositories/Entity1Repository.ts
import { IRepository } from './IRepository';
import { Entity1 } from '../models/Entity1';
import { InMemoryDatabase } from '../database/InMemoryDatabase';

export class Entity1Repository implements IRepository<Entity1> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): Entity1 | undefined {
    return this.db.entity1s.get(id);
  }

  public findAll(): Entity1[] {
    return Array.from(this.db.entity1s.values());
  }

  public save(entity: Entity1): Entity1 {
    this.db.entity1s.set(entity.id, entity);
    return entity;
  }

  public delete(id: string): boolean {
    return this.db.entity1s.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.entity1s.has(id);
  }

  public count(): number {
    return this.db.entity1s.size;
  }

  public clear(): void {
    this.db.entity1s.clear();
  }

  // Custom query methods (3-5 per repository)
  public findByStatus(status: Status): Entity1[] {
    return Array.from(this.db.entity1s.values()).filter(
      e => e.status === status
    );
  }

  public findByParentId(parentId: string): Entity1[] {
    return Array.from(this.db.entity1s.values()).filter(
      e => e.parentId === parentId
    );
  }
}
```

**Repository Guidelines:**
- Implement IRepository<T>
- Add 3-5 custom query methods
- Use filter/find for in-memory queries
- Keep methods focused (single responsibility)
- Return arrays for multi-results, single entity or undefined for findById

---

### **Phase 8: Service Layer (3-5 files)**

**Location:** `src/services/`

**Purpose:** Business logic orchestration

#### Service Types:

**1. Setup/Configuration Service**
```typescript
// src/services/SetupService.ts
import { Entity1Repository } from '../repositories/Entity1Repository';
import { Entity2Repository } from '../repositories/Entity2Repository';

export class SetupService {
  private entity1Repo = new Entity1Repository();
  private entity2Repo = new Entity2Repository();

  public initializeSystem(config: Config): void {
    // Create initial entities
    // Setup relationships
    // Configure system
  }

  public getSystemSummary(): string {
    // Return system status
  }
}
```

**2. Entity-Specific Services**
```typescript
// src/services/Entity1Service.ts
import { Entity1 } from '../models/Entity1';
import { Entity1Repository } from '../repositories/Entity1Repository';

export class Entity1Service {
  private repo = new Entity1Repository();

  public create(params): Entity1 {
    const entity = new Entity1(params);
    return this.repo.save(entity);
  }

  public getById(id: string): Entity1 | undefined {
    return this.repo.findById(id);
  }

  public performBusinessOperation(id: string): void {
    const entity = this.repo.findById(id);
    if (!entity) throw new Error('Not found');

    // Business logic
    entity.someBusinessMethod();

    this.repo.save(entity);
  }
}
```

**3. Controller/Coordinator Service (Singleton)**
```typescript
// src/services/MainController.ts
import { Entity1Service } from './Entity1Service';
import { Entity2Service } from './Entity2Service';

export class MainController {
  private static instance: MainController;

  private entity1Service = new Entity1Service();
  private entity2Service = new Entity2Service();

  private constructor() {}

  public static getInstance(): MainController {
    if (!MainController.instance) {
      MainController.instance = new MainController();
    }
    return MainController.instance;
  }

  public handleComplexOperation(params): void {
    // Coordinate multiple services
    // Handle cross-entity operations
    // Maintain consistency
  }
}
```

---

### **Phase 9: Console Interface (1 file)**

**Location:** `src/console/`

#### File: `ConsoleInterface.ts`
```typescript
import * as readline from 'readline';
import { MainController } from '../services/MainController';
import { SetupService } from '../services/SetupService';
import { Logger } from '../utils/Logger';

export class ConsoleInterface {
  private controller = MainController.getInstance();
  private setupService = new SetupService();

  private rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  private currentContext: any = null;

  public async start(): Promise<void> {
    this.printWelcome();
    await this.mainMenu();
  }

  private printWelcome(): void {
    console.clear();
    console.log('\n' + '='.repeat(70));
    console.log(' '.repeat(20) + '{SYSTEM NAME}');
    console.log('='.repeat(70));
    console.log('  Design Patterns: [List patterns]');
    console.log('  Technology: Node.js + TypeScript');
    console.log('='.repeat(70) + '\n');
  }

  private async mainMenu(): Promise<void> {
    while (true) {
      console.log('\n--- MAIN MENU ---');
      console.log('1. Option 1');
      console.log('2. Option 2');
      console.log('3. Option 3');
      console.log('4. Exit');
      console.log();

      const choice = await this.prompt('Enter your choice: ');

      switch (choice) {
        case '1':
          await this.option1Flow();
          break;
        case '2':
          await this.option2Flow();
          break;
        case '3':
          await this.option3Flow();
          break;
        case '4':
          console.log('\nThank you!\n');
          this.rl.close();
          process.exit(0);
        default:
          Logger.error('Invalid choice');
      }
    }
  }

  private async option1Flow(): Promise<void> {
    // Implement menu option
    const input = await this.prompt('Enter value: ');
    // Process input
    // Call controller/service
    // Display result
  }

  private prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }
}

// Start the application
const app = new ConsoleInterface();
app.start().catch(console.error);
```

**Console Guidelines:**
- Menu-driven interface
- Input validation
- Clear error messages
- Display formatting
- Confirmation prompts
- Multiple menu levels
- Exit option at every level

---

## 📊 FILE COUNT SUMMARY

| Category | Files | Purpose |
|----------|-------|---------|
| **Config** | 4 | package.json, tsconfig.json, .gitignore, README |
| **Enums** | 8-12 | Type-safe constants |
| **Utils** | 2 | IdGenerator, Logger |
| **Models** | 5-10 | Domain entities |
| **States** | 0-5 | State pattern (if needed) |
| **Strategies** | 0-5 | Strategy pattern (if needed) |
| **Factories** | 0-3 | Factory pattern (if needed) |
| **Database** | 1 | InMemoryDatabase singleton |
| **Repositories** | 5-10 | Data access per entity |
| **Services** | 3-5 | Business logic |
| **Console** | 1 | Interactive CLI |
| **Total** | **30-50** | Complete system |

---

## 🔄 IMPLEMENTATION ORDER

### **Generate in this sequence:**

1. ✅ **Configuration files** (4) - Foundation
2. ✅ **Enums** (8-12) - Constants first
3. ✅ **Utils** (2) - Helper utilities
4. ✅ **Models** (5-10) - Domain logic
5. ✅ **Design Patterns** (0-10) - Behavioral abstractions
6. ✅ **Database** (1) - Storage layer
7. ✅ **Repositories** (5-10) - Data access
8. ✅ **Services** (3-5) - Business orchestration
9. ✅ **Console** (1) - User interface

### **Save after each phase!**

---

## ✅ SUCCESS CRITERIA

A system is **complete** when:

✅ Requirements documented with feature classification  
✅ Class diagram with 5+ design patterns  
✅ Normalized database schema (3NF)  
✅ 30-50 TypeScript files generated  
✅ All layers implemented  
✅ In-memory database operational  
✅ Console interface with 5+ menu options  
✅ All files saved with reference numbers  
✅ README and setup guide included  

---

## 🎯 READY-TO-USE STARTING TEMPLATE

```
I want to design [SYSTEM NAME] using the LLD workflow.

Step 1: Requirements Gathering
Please analyze the system and provide:
- Primary features (4-6)
- Secondary features (2-3)
- Future enhancements (2-3)

Save as {system-name}-requirements.md
```
