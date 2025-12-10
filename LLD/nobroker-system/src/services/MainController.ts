import { UserService } from './UserService';
import { PropertyService } from './PropertyService';
import { PropertyListingService } from './PropertyListingService';
import { SearchService } from './SearchService';
import { AlertService } from './AlertService';
import { ChatService } from './ChatService';
import { VisitService } from './VisitService';
import { OfferService } from './OfferService';
import { ReviewService } from './ReviewService';
import { InMemoryDatabase } from '../database/InMemoryDatabase';

export class MainController {
  private static instance: MainController;

  // Service instances
  public userService: UserService;
  public propertyService: PropertyService;
  public listingService: PropertyListingService;
  public searchService: SearchService;
  public alertService: AlertService;
  public chatService: ChatService;
  public visitService: VisitService;
  public offerService: OfferService;
  public reviewService: ReviewService;

  // Database
  private database: InMemoryDatabase;

  private constructor() {
    this.database = InMemoryDatabase.getInstance();

    this.userService = new UserService();
    this.propertyService = new PropertyService();
    this.listingService = new PropertyListingService();
    this.searchService = new SearchService();
    this.alertService = new AlertService();
    this.chatService = new ChatService();
    this.visitService = new VisitService();
    this.offerService = new OfferService();
    this.reviewService = new ReviewService();
  }

  public static getInstance(): MainController {
    if (!MainController.instance) {
      MainController.instance = new MainController();
    }
    return MainController.instance;
  }

  public getDatabase(): InMemoryDatabase {
    return this.database;
  }

  public printDatabaseStats(): void {
    this.database.printStats();
  }

  public clearAllData(): void {
    this.database.clearAll();
  }
}
