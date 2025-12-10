import * as readline from 'readline';
import { UserService } from '../services/UserService';
import { ItemService } from '../services/ItemService';
import { InteractionService } from '../services/InteractionService';
import { RecommendationService } from '../services/RecommendationService';
import { RecommendationEngine } from '../engine/RecommendationEngine';
import { UserRepository } from '../repositories/UserRepository';
import { ItemRepository } from '../repositories/ItemRepository';
import { InteractionRepository } from '../repositories/InteractionRepository';
import { RecommendationCache } from '../cache/RecommendationCache';
import { CacheInvalidationObserver } from '../observers/CacheInvalidationObserver';
import { ModelUpdateObserver } from '../observers/ModelUpdateObserver';
import { CosineSimilarityCalculator } from '../strategies/CosineSimilarityCalculator';
import { InMemoryDatabase } from '../database/InMemoryDatabase';
import { InteractionType } from '../enums/InteractionType';
import { StrategyType } from '../enums/StrategyType';
import { Logger } from '../utils/Logger';

export class ConsoleInterface {
  private rl: readline.Interface;

  // Repositories
  private userRepo: UserRepository;
  private itemRepo: ItemRepository;
  private interactionRepo: InteractionRepository;

  // Services
  private userService: UserService;
  private itemService: ItemService;
  private interactionService: InteractionService;
  private recommendationService: RecommendationService;

  // Engine & Cache
  private cache: RecommendationCache;
  private engine: RecommendationEngine;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    // Initialize repositories
    this.userRepo = new UserRepository();
    this.itemRepo = new ItemRepository();
    this.interactionRepo = new InteractionRepository();

    // Initialize cache
    this.cache = new RecommendationCache(300000); // 5 minutes TTL

    // Initialize recommendation engine
    this.engine = RecommendationEngine.initialize(
      this.userRepo,
      this.itemRepo,
      this.interactionRepo,
      this.cache,
      new CosineSimilarityCalculator()
    );

    // Initialize services
    this.userService = new UserService(this.userRepo);
    this.itemService = new ItemService(this.itemRepo);
    this.interactionService = new InteractionService(this.interactionRepo);
    this.recommendationService = new RecommendationService(this.engine);

    // Setup observers
    const cacheObserver = new CacheInvalidationObserver(this.cache);
    const modelObserver = new ModelUpdateObserver();
    this.interactionService.addObserver(cacheObserver);
    this.interactionService.addObserver(modelObserver);

    // Initialize with sample data
    this.initializeSampleData();
  }

  public async start(): Promise<void> {
    this.printWelcome();
    await this.mainMenu();
  }

  private printWelcome(): void {
    console.clear();
    console.log('\n' + '='.repeat(70));
    console.log(' '.repeat(18) + 'RECOMMENDATION SYSTEM');
    console.log('='.repeat(70));
    console.log('  Design Patterns: Strategy, Singleton, Observer, Repository, Factory');
    console.log('  Technology: Node.js + TypeScript');
    console.log('  Architecture: Layered (Models → Repos → Services → Engine)');
    console.log('='.repeat(70) + '\n');
  }

  private async mainMenu(): Promise<void> {
    while (true) {
      console.log('\n' + '='.repeat(70));
      console.log('MAIN MENU');
      console.log('='.repeat(70));
      console.log('1. User Management');
      console.log('2. Item Management');
      console.log('3. Interaction Management');
      console.log('4. Get Recommendations');
      console.log('5. Similar Items');
      console.log('6. View Statistics');
      console.log('7. Cache Management');
      console.log('8. Exit');
      console.log('='.repeat(70));

      const choice = await this.prompt('Enter your choice: ');

      switch (choice) {
        case '1':
          await this.userManagementMenu();
          break;
        case '2':
          await this.itemManagementMenu();
          break;
        case '3':
          await this.interactionManagementMenu();
          break;
        case '4':
          await this.recommendationMenu();
          break;
        case '5':
          await this.similarItemsMenu();
          break;
        case '6':
          await this.viewStatistics();
          break;
        case '7':
          await this.cacheManagementMenu();
          break;
        case '8':
          console.log('\nThank you for using Recommendation System!\n');
          this.rl.close();
          process.exit(0);
        default:
          Logger.error('Invalid choice. Please try again.');
      }
    }
  }

  private async userManagementMenu(): Promise<void> {
    console.log('\n--- USER MANAGEMENT ---');
    console.log('1. Create User');
    console.log('2. List All Users');
    console.log('3. View User Details');
    console.log('4. Back to Main Menu');

    const choice = await this.prompt('Enter your choice: ');

    switch (choice) {
      case '1':
        await this.createUser();
        break;
      case '2':
        await this.listUsers();
        break;
      case '3':
        await this.viewUserDetails();
        break;
      case '4':
        return;
      default:
        Logger.error('Invalid choice');
    }
  }

  private async itemManagementMenu(): Promise<void> {
    console.log('\n--- ITEM MANAGEMENT ---');
    console.log('1. Create Item');
    console.log('2. List All Items');
    console.log('3. View Item Details');
    console.log('4. Add Tag to Item');
    console.log('5. Back to Main Menu');

    const choice = await this.prompt('Enter your choice: ');

    switch (choice) {
      case '1':
        await this.createItem();
        break;
      case '2':
        await this.listItems();
        break;
      case '3':
        await this.viewItemDetails();
        break;
      case '4':
        await this.addTagToItem();
        break;
      case '5':
        return;
      default:
        Logger.error('Invalid choice');
    }
  }

  private async interactionManagementMenu(): Promise<void> {
    console.log('\n--- INTERACTION MANAGEMENT ---');
    console.log('1. Record Interaction');
    console.log('2. View User Interactions');
    console.log('3. View Item Interactions');
    console.log('4. Back to Main Menu');

    const choice = await this.prompt('Enter your choice: ');

    switch (choice) {
      case '1':
        await this.recordInteraction();
        break;
      case '2':
        await this.viewUserInteractions();
        break;
      case '3':
        await this.viewItemInteractions();
        break;
      case '4':
        return;
      default:
        Logger.error('Invalid choice');
    }
  }

  private async recommendationMenu(): Promise<void> {
    console.log('\n--- GET RECOMMENDATIONS ---');

    const users = this.userService.getAllUsers();
    if (users.length === 0) {
      Logger.warn('No users available. Please create users first.');
      return;
    }

    console.log('\nAvailable Users:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.id})`);
    });

    const userChoice = await this.prompt('Select user number: ');
    const userIndex = parseInt(userChoice) - 1;

    if (userIndex < 0 || userIndex >= users.length) {
      Logger.error('Invalid user selection');
      return;
    }

    const userId = users[userIndex].id;

    console.log('\nRecommendation Strategy:');
    console.log('1. Collaborative Filtering');
    console.log('2. Content-Based');
    console.log('3. Popularity');
    console.log('4. Hybrid (Default)');

    const strategyChoice = await this.prompt('Select strategy (press Enter for Hybrid): ');

    let strategy: StrategyType | undefined;
    switch (strategyChoice) {
      case '1':
        strategy = StrategyType.COLLABORATIVE_FILTERING;
        break;
      case '2':
        strategy = StrategyType.CONTENT_BASED;
        break;
      case '3':
        strategy = StrategyType.POPULARITY;
        break;
      case '4':
      case '':
        strategy = StrategyType.HYBRID;
        break;
      default:
        strategy = StrategyType.HYBRID;
    }

    const topN = await this.prompt('Number of recommendations (default 10): ');
    const n = topN ? parseInt(topN) : 10;

    console.log('\nGenerating recommendations...\n');
    const recommendations = this.recommendationService.getRecommendations(
      userId,
      n,
      strategy
    );

    if (recommendations.length === 0) {
      Logger.warn('No recommendations available for this user.');
      return;
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log(`RECOMMENDATIONS FOR ${users[userIndex].name} (Strategy: ${strategy})`);
    console.log('='.repeat(70));

    recommendations.forEach((rec, index) => {
      const item = this.itemService.getItemById(rec.itemId);
      console.log(`${index + 1}. Item: ${item?.name || 'Unknown'} | Score: ${rec.score.toFixed(4)} | Confidence: ${this.getConfidenceLevel(rec.score)}`);
    });

    console.log('='.repeat(70));
  }

  private async similarItemsMenu(): Promise<void> {
    console.log('\n--- FIND SIMILAR ITEMS ---');

    const items = this.itemService.getAllItems();
    if (items.length < 2) {
      Logger.warn('Need at least 2 items for similarity calculation.');
      return;
    }

    console.log('\nAvailable Items:');
    items.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name} (Tags: ${item.tags.join(', ') || 'None'})`);
    });

    const itemChoice = await this.prompt('Select item number: ');
    const itemIndex = parseInt(itemChoice) - 1;

    if (itemIndex < 0 || itemIndex >= items.length) {
      Logger.error('Invalid item selection');
      return;
    }

    const itemId = items[itemIndex].id;
    const topN = await this.prompt('Number of similar items (default 5): ');
    const n = topN ? parseInt(topN) : 5;

    console.log('\nFinding similar items...\n');
    const similarItems = this.recommendationService.getSimilarItems(itemId, n);

    if (similarItems.length === 0) {
      Logger.warn('No similar items found.');
      return;
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log(`SIMILAR ITEMS TO: ${items[itemIndex].name}`);
    console.log('='.repeat(70));

    similarItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name} | Tags: ${item.tags.join(', ') || 'None'}`);
    });

    console.log('='.repeat(70));
  }

  private async createUser(): Promise<void> {
    const name = await this.prompt('Enter user name: ');

    const addAttrs = await this.prompt('Add attributes? (y/n): ');
    let attributes: Map<string, string> | undefined;

    if (addAttrs.toLowerCase() === 'y') {
      attributes = new Map();
      const age = await this.prompt('Age: ');
      const location = await this.prompt('Location: ');

      if (age) attributes.set('age', age);
      if (location) attributes.set('location', location);
    }

    const user = this.userService.createUser(name, attributes);
    console.log(`\n✅ User created successfully! ID: ${user.id}`);
  }

  private async listUsers(): Promise<void> {
    const users = this.userService.getAllUsers();

    if (users.length === 0) {
      Logger.warn('No users found.');
      return;
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log('ALL USERS');
    console.log('='.repeat(70));

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} | ID: ${user.id} | Attributes: ${user.getAttributeCount()}`);
    });

    console.log('='.repeat(70));
  }

  private async viewUserDetails(): Promise<void> {
    const users = this.userService.getAllUsers();
    if (users.length === 0) {
      Logger.warn('No users available.');
      return;
    }

    console.log('\nAvailable Users:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
    });

    const choice = await this.prompt('Select user number: ');
    const index = parseInt(choice) - 1;

    if (index < 0 || index >= users.length) {
      Logger.error('Invalid selection');
      return;
    }

    const user = users[index];
    const interactions = this.interactionService.getInteractionsByUser(user.id);

    console.log(`\n${'='.repeat(70)}`);
    console.log(`USER DETAILS: ${user.name}`);
    console.log('='.repeat(70));
    console.log(`ID: ${user.id}`);
    console.log(`Created: ${user.createdAt.toLocaleString()}`);
    console.log(`Interactions: ${interactions.length}`);
    console.log(`\nAttributes:`);
    user.attributes.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log('='.repeat(70));
  }

  private async createItem(): Promise<void> {
    const name = await this.prompt('Enter item name: ');

    const addTags = await this.prompt('Add tags? (y/n): ');
    let tags: string[] = [];

    if (addTags.toLowerCase() === 'y') {
      const tagsInput = await this.prompt('Enter tags (comma-separated): ');
      tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
    }

    const item = this.itemService.createItem(name, undefined, tags);
    console.log(`\n✅ Item created successfully! ID: ${item.id}`);
  }

  private async listItems(): Promise<void> {
    const items = this.itemService.getAllItems();

    if (items.length === 0) {
      Logger.warn('No items found.');
      return;
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log('ALL ITEMS');
    console.log('='.repeat(70));

    items.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name} | Tags: ${item.tags.join(', ') || 'None'}`);
    });

    console.log('='.repeat(70));
  }

  private async viewItemDetails(): Promise<void> {
    const items = this.itemService.getAllItems();
    if (items.length === 0) {
      Logger.warn('No items available.');
      return;
    }

    console.log('\nAvailable Items:');
    items.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name}`);
    });

    const choice = await this.prompt('Select item number: ');
    const index = parseInt(choice) - 1;

    if (index < 0 || index >= items.length) {
      Logger.error('Invalid selection');
      return;
    }

    const item = items[index];
    const interactions = this.interactionService.getInteractionsByItem(item.id);

    console.log(`\n${'='.repeat(70)}`);
    console.log(`ITEM DETAILS: ${item.name}`);
    console.log('='.repeat(70));
    console.log(`ID: ${item.id}`);
    console.log(`Created: ${item.createdAt.toLocaleString()}`);
    console.log(`Tags: ${item.tags.join(', ') || 'None'}`);
    console.log(`Interactions: ${interactions.length}`);
    console.log('='.repeat(70));
  }

  private async addTagToItem(): Promise<void> {
    const items = this.itemService.getAllItems();
    if (items.length === 0) {
      Logger.warn('No items available.');
      return;
    }

    console.log('\nAvailable Items:');
    items.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name}`);
    });

    const choice = await this.prompt('Select item number: ');
    const index = parseInt(choice) - 1;

    if (index < 0 || index >= items.length) {
      Logger.error('Invalid selection');
      return;
    }

    const tag = await this.prompt('Enter tag name: ');
    this.itemService.addTagToItem(items[index].id, tag);
    console.log('\n✅ Tag added successfully!');
  }

  private async recordInteraction(): Promise<void> {
    const users = this.userService.getAllUsers();
    const items = this.itemService.getAllItems();

    if (users.length === 0 || items.length === 0) {
      Logger.warn('Need both users and items to record interactions.');
      return;
    }

    console.log('\nUsers:');
    users.forEach((u, i) => console.log(`${i + 1}. ${u.name}`));

    const userChoice = await this.prompt('Select user: ');
    const userIndex = parseInt(userChoice) - 1;

    console.log('\nItems:');
    items.forEach((it, i) => console.log(`${i + 1}. ${it.name}`));

    const itemChoice = await this.prompt('Select item: ');
    const itemIndex = parseInt(itemChoice) - 1;

    console.log('\nInteraction Types:');
    console.log('1. VIEW');
    console.log('2. CLICK');
    console.log('3. LIKE');
    console.log('4. DISLIKE');
    console.log('5. RATING');
    console.log('6. PURCHASE');

    const typeChoice = await this.prompt('Select type: ');

    let type: InteractionType;
    let weight: number | undefined;

    switch (typeChoice) {
      case '1': type = InteractionType.VIEW; break;
      case '2': type = InteractionType.CLICK; break;
      case '3': type = InteractionType.LIKE; break;
      case '4': type = InteractionType.DISLIKE; break;
      case '5':
        type = InteractionType.RATING;
        const rating = await this.prompt('Enter rating (0-5): ');
        weight = parseFloat(rating);
        break;
      case '6': type = InteractionType.PURCHASE; break;
      default:
        Logger.error('Invalid type');
        return;
    }

    if (userIndex >= 0 && userIndex < users.length && 
        itemIndex >= 0 && itemIndex < items.length) {
      this.interactionService.recordInteraction(
        users[userIndex].id,
        items[itemIndex].id,
        type,
        weight
      );
      console.log('\n✅ Interaction recorded successfully!');
    }
  }

  private async viewUserInteractions(): Promise<void> {
    const users = this.userService.getAllUsers();
    if (users.length === 0) {
      Logger.warn('No users available.');
      return;
    }

    console.log('\nUsers:');
    users.forEach((u, i) => console.log(`${i + 1}. ${u.name}`));

    const choice = await this.prompt('Select user: ');
    const index = parseInt(choice) - 1;

    if (index < 0 || index >= users.length) {
      Logger.error('Invalid selection');
      return;
    }

    const interactions = this.interactionService.getInteractionsByUser(users[index].id);

    console.log(`\n${'='.repeat(70)}`);
    console.log(`INTERACTIONS FOR: ${users[index].name}`);
    console.log('='.repeat(70));

    if (interactions.length === 0) {
      console.log('No interactions yet.');
    } else {
      interactions.forEach((inter, i) => {
        const item = this.itemService.getItemById(inter.itemId);
        console.log(`${i + 1}. ${inter.type} | Item: ${item?.name || 'Unknown'} | Score: ${inter.getScore()}`);
      });
    }

    console.log('='.repeat(70));
  }

  private async viewItemInteractions(): Promise<void> {
    const items = this.itemService.getAllItems();
    if (items.length === 0) {
      Logger.warn('No items available.');
      return;
    }

    console.log('\nItems:');
    items.forEach((it, i) => console.log(`${i + 1}. ${it.name}`));

    const choice = await this.prompt('Select item: ');
    const index = parseInt(choice) - 1;

    if (index < 0 || index >= items.length) {
      Logger.error('Invalid selection');
      return;
    }

    const interactions = this.interactionService.getInteractionsByItem(items[index].id);

    console.log(`\n${'='.repeat(70)}`);
    console.log(`INTERACTIONS FOR: ${items[index].name}`);
    console.log('='.repeat(70));

    if (interactions.length === 0) {
      console.log('No interactions yet.');
    } else {
      interactions.forEach((inter, i) => {
        const user = this.userService.getUserById(inter.userId);
        console.log(`${i + 1}. ${inter.type} | User: ${user?.name || 'Unknown'} | Score: ${inter.getScore()}`);
      });
    }

    console.log('='.repeat(70));
  }

  private async viewStatistics(): Promise<void> {
    const db = InMemoryDatabase.getInstance();
    const stats = db.getStats();
    const cacheStats = this.recommendationService.getCacheStats();

    console.log(`\n${'='.repeat(70)}`);
    console.log('SYSTEM STATISTICS');
    console.log('='.repeat(70));
    console.log(`Total Users: ${stats.users}`);
    console.log(`Total Items: ${stats.items}`);
    console.log(`Total Interactions: ${stats.interactions}`);
    console.log(`Cache Size: ${cacheStats.size} entries`);
    console.log('='.repeat(70));

    await this.prompt('Press Enter to continue...');
  }

  private async cacheManagementMenu(): Promise<void> {
    console.log('\n--- CACHE MANAGEMENT ---');
    console.log('1. View Cache Stats');
    console.log('2. Clear Cache');
    console.log('3. Back to Main Menu');

    const choice = await this.prompt('Enter your choice: ');

    switch (choice) {
      case '1':
        const stats = this.recommendationService.getCacheStats();
        console.log(`\nCache Entries: ${stats.size}`);
        break;
      case '2':
        this.recommendationService.clearCache();
        console.log('\n✅ Cache cleared successfully!');
        break;
      case '3':
        return;
      default:
        Logger.error('Invalid choice');
    }
  }

  private getConfidenceLevel(score: number): string {
    if (score >= 0.7) return 'HIGH';
    if (score >= 0.4) return 'MEDIUM';
    return 'LOW';
  }

  private initializeSampleData(): void {
    Logger.info('Initializing sample data...');

    // Create sample users
    const user1 = this.userService.createUser('Alice', new Map([['age', '25'], ['location', 'NYC']]));
    const user2 = this.userService.createUser('Bob', new Map([['age', '30'], ['location', 'LA']]));
    const user3 = this.userService.createUser('Charlie', new Map([['age', '28'], ['location', 'SF']]));

    // Create sample items
    const item1 = this.itemService.createItem('Laptop', undefined, ['electronics', 'computers']);
    const item2 = this.itemService.createItem('Smartphone', undefined, ['electronics', 'mobile']);
    const item3 = this.itemService.createItem('Headphones', undefined, ['electronics', 'audio']);
    const item4 = this.itemService.createItem('Book: AI Basics', undefined, ['books', 'technology']);
    const item5 = this.itemService.createItem('Desk Chair', undefined, ['furniture', 'office']);

    // Create sample interactions
    this.interactionService.recordInteraction(user1.id, item1.id, InteractionType.VIEW);
    this.interactionService.recordInteraction(user1.id, item1.id, InteractionType.LIKE);
    this.interactionService.recordInteraction(user1.id, item2.id, InteractionType.VIEW);
    this.interactionService.recordInteraction(user1.id, item3.id, InteractionType.PURCHASE);

    this.interactionService.recordInteraction(user2.id, item2.id, InteractionType.LIKE);
    this.interactionService.recordInteraction(user2.id, item3.id, InteractionType.VIEW);
    this.interactionService.recordInteraction(user2.id, item4.id, InteractionType.RATING, 4.5);

    this.interactionService.recordInteraction(user3.id, item1.id, InteractionType.VIEW);
    this.interactionService.recordInteraction(user3.id, item4.id, InteractionType.LIKE);
    this.interactionService.recordInteraction(user3.id, item5.id, InteractionType.PURCHASE);

    Logger.success('Sample data initialized successfully!');
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