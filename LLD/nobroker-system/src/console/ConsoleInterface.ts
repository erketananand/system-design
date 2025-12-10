import * as readline from 'readline';
import { MainController } from '../services/MainController';
import { User } from '../models/User';
import { Property } from '../models/Property';
import { PropertyListing } from '../models/PropertyListing';
import { Address } from '../models/Address';
import { SearchCriteria } from '../models/SearchCriteria';
import { UserRole } from '../enums/UserRole';
import { AccountTier } from '../enums/AccountTier';
import { PropertyType } from '../enums/PropertyType';
import { StructureType } from '../enums/StructureType';
import { PropertyConfiguration } from '../enums/PropertyConfiguration';
import { PgSharingType } from '../enums/PgSharingType';
import { FurnishingType } from '../enums/FurnishingType';
import { ListingPurpose } from '../enums/ListingPurpose';
import { Amenity } from '../enums/Amenity';
import { AlertChannel } from '../enums/AlertChannel';
import { AlertFrequency } from '../enums/AlertFrequency';
import { Logger } from '../utils/Logger';
import { PriceSortStrategy } from '../strategies/PriceSortStrategy';
import { DateSortStrategy } from '../strategies/DateSortStrategy';
import { RelevanceSortStrategy } from '../strategies/RelevanceSortStrategy';

export class ConsoleInterface {
  private controller = MainController.getInstance();
  private currentUser: User | null = null;

  private rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  public async start(): Promise<void> {
    this.printWelcome();
    await this.mainMenu();
  }

  private printWelcome(): void {
    console.clear();
    Logger.header('NOBROKER - REAL ESTATE PLATFORM');
    console.log('  🏠 Direct interaction between Property Owners & Seekers');
    console.log('  💰 No Broker Fees - Connect Directly');
    console.log('  🔍 Advanced Search & Filters');
    console.log('  💬 In-App Chat, Visits & Negotiation');
    console.log('  🔔 Saved Searches & Instant Alerts');
    console.log();
    console.log('  Design Patterns: Singleton, Factory, State, Strategy, Observer, Builder, Repository');
    console.log('  Technology: Node.js + TypeScript');
    Logger.divider();
  }

  private async mainMenu(): Promise<void> {
    while (true) {
      console.log('\n--- MAIN MENU ---');
      if (this.currentUser) {
        console.log(`Logged in as: ${this.currentUser.name} (${this.currentUser.email})`);
        console.log(`Account Tier: ${this.currentUser.accountTier}`);
        console.log(`Roles: ${this.currentUser.roles.join(', ')}`);
        console.log();
      }
      console.log('1. User Management');
      console.log('2. Property & Listing Management');
      console.log('3. Search Properties');
      console.log('4. Saved Searches & Alerts');
      console.log('5. Chat, Visits & Offers');
      console.log('6. Reviews & Ratings');
      console.log('7. Database Stats');
      console.log('8. Exit');
      console.log();

      const choice = await this.prompt('Enter your choice: ');

      switch (choice) {
        case '1':
          await this.userManagementMenu();
          break;
        case '2':
          await this.propertyManagementMenu();
          break;
        case '3':
          await this.searchPropertiesMenu();
          break;
        case '4':
          await this.savedSearchesMenu();
          break;
        case '5':
          await this.chatMenu();
          break;
        case '6':
          await this.reviewsMenu();
          break;
        case '7':
          this.controller.printDatabaseStats();
          break;
        case '8':
          console.log('\nThank you for using NoBroker! Goodbye!\n');
          this.rl.close();
          process.exit(0);
        default:
          Logger.error('Invalid choice. Please try again.');
      }
    }
  }

  // User Management Menu
  private async userManagementMenu(): Promise<void> {
    while (true) {
      console.log('\n--- USER MANAGEMENT ---');
      console.log('1. Register New User');
      console.log('2. Login');
      console.log('3. Logout');
      console.log('4. Upgrade to Premium');
      console.log('5. View My Profile');
      console.log('6. Back to Main Menu');
      console.log();

      const choice = await this.prompt('Enter your choice: ');

      switch (choice) {
        case '1':
          await this.registerUser();
          break;
        case '2':
          await this.loginUser();
          break;
        case '3':
          this.logoutUser();
          break;
        case '4':
          await this.upgradeToPremium();
          break;
        case '5':
          this.viewProfile();
          break;
        case '6':
          return;
        default:
          Logger.error('Invalid choice');
      }
    }
  }

  private async registerUser(): Promise<void> {
    Logger.header('USER REGISTRATION');

    const name = await this.prompt('Enter your name: ');
    const email = await this.prompt('Enter your email: ');
    const phone = await this.prompt('Enter your phone: ');
    const password = await this.prompt('Enter your password: ');

    console.log('\nSelect your role(s):');
    console.log('1. Property Owner');
    console.log('2. Property Seeker');
    console.log('3. Both');

    const roleChoice = await this.prompt('Enter choice: ');
    let roles: UserRole[] = [];

    if (roleChoice === '1') roles = [UserRole.OWNER];
    else if (roleChoice === '2') roles = [UserRole.SEEKER];
    else if (roleChoice === '3') roles = [UserRole.OWNER, UserRole.SEEKER];
    else {
      Logger.error('Invalid role choice');
      return;
    }

    try {
      const user = this.controller.userService.registerUser(name, email, phone, password, roles);
      Logger.success(`User registered successfully! User ID: ${user.id}`);
      this.currentUser = user;
    } catch (error: any) {
      Logger.error(`Registration failed: ${error.message}`);
    }
  }

  private async loginUser(): Promise<void> {
    Logger.header('USER LOGIN');

    const email = await this.prompt('Enter your email: ');
    const password = await this.prompt('Enter your password: ');

    const user = this.controller.userService.authenticate(email, password);
    if (user) {
      this.currentUser = user;
      Logger.success(`Welcome back, ${user.name}!`);
    } else {
      Logger.error('Invalid credentials');
    }
  }

  private logoutUser(): void {
    if (this.currentUser) {
      Logger.success(`Logged out ${this.currentUser.name}`);
      this.currentUser = null;
    } else {
      Logger.warn('No user is currently logged in');
    }
  }

  private async upgradeToPremium(): Promise<void> {
    if (!this.currentUser) {
      Logger.error('Please login first');
      return;
    }

    if (this.currentUser.isPremium()) {
      Logger.warn('You are already a Premium user');
      return;
    }

    const confirm = await this.prompt('Upgrade to Premium account? (yes/no): ');
    if (confirm.toLowerCase() === 'yes') {
      this.controller.userService.upgradeTier(this.currentUser.id, AccountTier.PREMIUM);
      this.currentUser = this.controller.userService.getUserById(this.currentUser.id)!;
      Logger.success('Successfully upgraded to Premium account!');
    }
  }

  private viewProfile(): void {
    if (!this.currentUser) {
      Logger.error('Please login first');
      return;
    }

    Logger.header('MY PROFILE');
    console.log(`Name: ${this.currentUser.name}`);
    console.log(`Email: ${this.currentUser.email}`);
    console.log(`Phone: ${this.currentUser.phone}`);
    console.log(`Account Tier: ${this.currentUser.accountTier}`);
    console.log(`Roles: ${this.currentUser.roles.join(', ')}`);
    console.log(`Account Created: ${this.currentUser.createdAt.toLocaleString()}`);
  }

  // Property Management Menu
  private async propertyManagementMenu(): Promise<void> {
    if (!this.currentUser) {
      Logger.error('Please login first');
      return;
    }

    if (!this.currentUser.isOwner()) {
      Logger.error('You must have Owner role to manage properties');
      return;
    }

    while (true) {
      console.log('\n--- PROPERTY & LISTING MANAGEMENT ---');
      console.log('1. Create New Property');
      console.log('2. View My Properties');
      console.log('3. Create Listing for Property');
      console.log('4. View My Listings');
      console.log('5. Publish Listing');
      console.log('6. Pause Listing');
      console.log('7. Close Listing');
      console.log('8. Back to Main Menu');
      console.log();

      const choice = await this.prompt('Enter your choice: ');

      switch (choice) {
        case '1':
          await this.createProperty();
          break;
        case '2':
          this.viewMyProperties();
          break;
        case '3':
          await this.createListing();
          break;
        case '4':
          this.viewMyListings();
          break;
        case '5':
          await this.publishListing();
          break;
        case '6':
          await this.pauseListing();
          break;
        case '7':
          await this.closeListing();
          break;
        case '8':
          return;
        default:
          Logger.error('Invalid choice');
      }
    }
  }

  private async createProperty(): Promise<void> {
    Logger.header('CREATE NEW PROPERTY');

    const title = await this.prompt('Property Title: ');
    const description = await this.prompt('Description: ');

    console.log('\nProperty Type:');
    console.log('1. PG, 2. Flat, 3. Villa, 4. Land');
    const typeChoice = await this.prompt('Choose: ');

    let propertyType: PropertyType;
    if (typeChoice === '1') propertyType = PropertyType.PG;
    else if (typeChoice === '2') propertyType = PropertyType.FLAT;
    else if (typeChoice === '3') propertyType = PropertyType.VILLA;
    else if (typeChoice === '4') propertyType = PropertyType.LAND;
    else { Logger.error('Invalid choice'); return; }

    // Address
    const city = await this.prompt('City: ');
    const area = await this.prompt('Area: ');
    const locality = await this.prompt('Locality: ');
    const landmark = await this.prompt('Landmark (optional): ');

    const address = new Address(city, area, locality, landmark || null);

    console.log('\nFurnishing Type:');
    console.log('1. Fully Furnished, 2. Semi Furnished, 3. Unfurnished');
    const furnishChoice = await this.prompt('Choose: ');

    let furnishingType: FurnishingType;
    if (furnishChoice === '1') furnishingType = FurnishingType.FULLY_FURNISHED;
    else if (furnishChoice === '2') furnishingType = FurnishingType.SEMI_FURNISHED;
    else furnishingType = FurnishingType.UNFURNISHED;

    try {
      const property = this.controller.propertyService.createProperty({
        ownerId: this.currentUser!.id,
        title,
        description,
        propertyType,
        address,
        furnishingType
      });

      Logger.success(`Property created successfully! ID: ${property.id}`);
    } catch (error: any) {
      Logger.error(`Failed to create property: ${error.message}`);
    }
  }

  private viewMyProperties(): void {
    const properties = this.controller.propertyService.getOwnerProperties(this.currentUser!.id);

    if (properties.length === 0) {
      Logger.warn('You have no properties');
      return;
    }

    Logger.header('MY PROPERTIES');
    properties.forEach((prop, idx) => {
      console.log(`${idx + 1}. ${prop.title} (${prop.propertyType})`);
      console.log(`   ID: ${prop.id}`);
      console.log(`   Location: ${prop.address.getFullAddress()}`);
      console.log(`   Furnishing: ${prop.furnishingType}`);
      console.log();
    });
  }

  private async createListing(): Promise<void> {
    const properties = this.controller.propertyService.getOwnerProperties(this.currentUser!.id);

    if (properties.length === 0) {
      Logger.error('Create a property first');
      return;
    }

    Logger.header('CREATE LISTING');
    this.viewMyProperties();

    const propId = await this.prompt('Enter Property ID: ');

    console.log('\nListing Purpose:');
    console.log('1. Sale, 2. Rent, 3. Both');
    const purposeChoice = await this.prompt('Choose: ');

    let purpose: ListingPurpose;
    if (purposeChoice === '1') purpose = ListingPurpose.SALE;
    else if (purposeChoice === '2') purpose = ListingPurpose.RENT;
    else purpose = ListingPurpose.BOTH;

    const basePrice = parseFloat(await this.prompt('Sale Price / Base Price: '));
    let expectedRent: number | undefined;
    let securityDeposit: number | undefined;

    if (purpose === ListingPurpose.RENT || purpose === ListingPurpose.BOTH) {
      expectedRent = parseFloat(await this.prompt('Monthly Rent: '));
      securityDeposit = parseFloat(await this.prompt('Security Deposit: '));
    }

    try {
      const listing = this.controller.listingService.createListing({
        propertyId: propId,
        ownerId: this.currentUser!.id,
        listingPurpose: purpose,
        basePrice,
        expectedRent,
        securityDeposit,
        ownerAccountTier: this.currentUser!.accountTier
      });

      Logger.success(`Listing created successfully! ID: ${listing.id}`);
      Logger.info('Remember to publish the listing to make it visible to seekers.');
    } catch (error: any) {
      Logger.error(`Failed to create listing: ${error.message}`);
    }
  }

  private viewMyListings(): void {
    const listings = this.controller.listingService.getOwnerListings(this.currentUser!.id);

    if (listings.length === 0) {
      Logger.warn('You have no listings');
      return;
    }

    Logger.header('MY LISTINGS');
    listings.forEach((listing, idx) => {
      const property = this.controller.propertyService.getPropertyById(listing.propertyId);
      console.log(`${idx + 1}. ${property?.title || 'Unknown'}`);
      console.log(`   Listing ID: ${listing.id}`);
      console.log(`   Purpose: ${listing.listingPurpose}`);
      console.log(`   Price: ₹${listing.basePrice}`);
      if (listing.expectedRent) console.log(`   Rent: ₹${listing.expectedRent}/month`);
      console.log(`   Status: ${listing.listingStatus}`);
      console.log(`   Visibility: ${listing.visibilityLevel}`);
      console.log();
    });
  }

  private async publishListing(): Promise<void> {
    this.viewMyListings();
    const listingId = await this.prompt('Enter Listing ID to publish: ');

    try {
      this.controller.listingService.publishListing(listingId);
      Logger.success('Listing published successfully!');
    } catch (error: any) {
      Logger.error(`Failed: ${error.message}`);
    }
  }

  private async pauseListing(): Promise<void> {
    this.viewMyListings();
    const listingId = await this.prompt('Enter Listing ID to pause: ');

    try {
      this.controller.listingService.pauseListing(listingId);
      Logger.success('Listing paused successfully!');
    } catch (error: any) {
      Logger.error(`Failed: ${error.message}`);
    }
  }

  private async closeListing(): Promise<void> {
    this.viewMyListings();
    const listingId = await this.prompt('Enter Listing ID to close: ');

    try {
      this.controller.listingService.closeListing(listingId);
      Logger.success('Listing closed successfully!');
    } catch (error: any) {
      Logger.error(`Failed: ${error.message}`);
    }
  }

  // Search Properties Menu
  private async searchPropertiesMenu(): Promise<void> {
    if (!this.currentUser) {
      Logger.error('Please login first');
      return;
    }

    Logger.header('SEARCH PROPERTIES');

    const city = await this.prompt('Enter city (or leave blank): ');
    const minBudgetStr = await this.prompt('Minimum budget (or leave blank): ');
    const maxBudgetStr = await this.prompt('Maximum budget (or leave blank): ');

    const minBudget = minBudgetStr ? parseFloat(minBudgetStr) : null;
    const maxBudget = maxBudgetStr ? parseFloat(maxBudgetStr) : null;

    const searchCriteria = new SearchCriteria(
      this.currentUser.id,
      'Quick Search',
      city ? [city] : [],
      minBudget,
      maxBudget
    );

    console.log('\nSort by:');
    console.log('1. Relevance (Premium first)');
    console.log('2. Price (Low to High)');
    console.log('3. Price (High to Low)');
    console.log('4. Newest First');

    const sortChoice = await this.prompt('Choose: ');

    let strategy;
    if (sortChoice === '2') strategy = new PriceSortStrategy(true);
    else if (sortChoice === '3') strategy = new PriceSortStrategy(false);
    else if (sortChoice === '4') strategy = new DateSortStrategy(true);
    else strategy = new RelevanceSortStrategy();

    const results = this.controller.searchService.search(searchCriteria, strategy);

    if (results.length === 0) {
      Logger.warn('No properties found matching your criteria');
      return;
    }

    Logger.success(`Found ${results.length} properties:`);
    Logger.separator();

    results.forEach((listing, idx) => {
      const property = this.controller.propertyService.getPropertyById(listing.propertyId);
      if (!property) return;

      console.log(`${idx + 1}. ${property.title}`);
      console.log(`   Listing ID: ${listing.id}`);
      console.log(`   Type: ${property.propertyType} | ${property.configuration || property.pgSharingType || 'N/A'}`);
      console.log(`   Location: ${property.address.getFullAddress()}`);
      console.log(`   Furnishing: ${property.furnishingType}`);
      console.log(`   Price: ₹${listing.basePrice}${listing.expectedRent ? ` | Rent: ₹${listing.expectedRent}/mo` : ''}`);
      console.log(`   Visibility: ${listing.visibilityLevel}`);
      console.log();
    });

    const saveSearch = await this.prompt('\nSave this search? (yes/no): ');
    if (saveSearch.toLowerCase() === 'yes') {
      const name = await this.prompt('Enter search name: ');
      searchCriteria.name = name;
      const saved = this.controller.searchService.createSearchCriteria(
        this.currentUser.id,
        name,
        city ? [city] : [],
        minBudget as number,
        maxBudget as number
      );
      Logger.success(`Search saved! ID: ${saved.id}`);
    }
  }

  // Saved Searches & Alerts Menu
  private async savedSearchesMenu(): Promise<void> {
    if (!this.currentUser) {
      Logger.error('Please login first');
      return;
    }

    while (true) {
      console.log('\n--- SAVED SEARCHES & ALERTS ---');
      console.log('1. View My Saved Searches');
      console.log('2. Create Alert for Saved Search');
      console.log('3. View My Alerts');
      console.log('4. Deactivate Alert');
      console.log('5. Back to Main Menu');
      console.log();

      const choice = await this.prompt('Enter your choice: ');

      switch (choice) {
        case '1':
          this.viewSavedSearches();
          break;
        case '2':
          await this.createAlert();
          break;
        case '3':
          this.viewAlerts();
          break;
        case '4':
          await this.deactivateAlert();
          break;
        case '5':
          return;
        default:
          Logger.error('Invalid choice');
      }
    }
  }

  private viewSavedSearches(): void {
    const searches = this.controller.searchService.getUserSavedSearches(this.currentUser!.id);

    if (searches.length === 0) {
      Logger.warn('You have no saved searches');
      return;
    }

    Logger.header('MY SAVED SEARCHES');
    searches.forEach((search, idx) => {
      console.log(`${idx + 1}. ${search.name}`);
      console.log(`   ID: ${search.id}`);
      console.log(`   Locations: ${search.locations.join(', ') || 'Any'}`);
      console.log(`   Budget: ₹${search.minBudget || 0} - ₹${search.maxBudget || 'No limit'}`);
      console.log();
    });
  }

  private async createAlert(): Promise<void> {
    this.viewSavedSearches();

    const searches = this.controller.searchService.getUserSavedSearches(this.currentUser!.id);
    if (searches.length === 0) return;

    const searchId = await this.prompt('Enter Search ID: ');

    console.log('\nAlert Frequency:');
    console.log('1. Instant, 2. Daily');
    const freqChoice = await this.prompt('Choose: ');

    const frequency = freqChoice === '2' ? AlertFrequency.DAILY : AlertFrequency.INSTANT;

    try {
      const alert = this.controller.alertService.createAlert(
        searchId,
        this.currentUser!.id,
        AlertChannel.IN_APP,
        frequency
      );
      Logger.success(`Alert created! ID: ${alert.id}`);
    } catch (error: any) {
      Logger.error(`Failed: ${error.message}`);
    }
  }

  private viewAlerts(): void {
    const alerts = this.controller.alertService.getUserAlerts(this.currentUser!.id);

    if (alerts.length === 0) {
      Logger.warn('You have no alerts');
      return;
    }

    Logger.header('MY ALERTS');
    alerts.forEach((alert, idx) => {
      console.log(`${idx + 1}. Alert ID: ${alert.id}`);
      console.log(`   Frequency: ${alert.frequency}`);
      console.log(`   Channel: ${alert.channel}`);
      console.log(`   Active: ${alert.active}`);
      console.log();
    });
  }

  private async deactivateAlert(): Promise<void> {
    this.viewAlerts();
    const alertId = await this.prompt('Enter Alert ID to deactivate: ');

    try {
      this.controller.alertService.deactivateAlert(alertId);
      Logger.success('Alert deactivated!');
    } catch (error: any) {
      Logger.error(`Failed: ${error.message}`);
    }
  }

  // Chat Menu
  private async chatMenu(): Promise<void> {
    if (!this.currentUser) {
      Logger.error('Please login first');
      return;
    }

    while (true) {
      console.log('\n--- CHAT, VISITS & OFFERS ---');
      console.log('1. Start Chat for a Listing');
      console.log('2. View My Chats');
      console.log('3. Send Message');
      console.log('4. Propose Visit');
      console.log('5. Make Offer');
      console.log('6. Back to Main Menu');
      console.log();

      const choice = await this.prompt('Enter your choice: ');

      switch (choice) {
        case '1':
          await this.startChat();
          break;
        case '2':
          this.viewMyChats();
          break;
        case '3':
          await this.sendMessage();
          break;
        case '4':
          await this.proposeVisit();
          break;
        case '5':
          await this.makeOffer();
          break;
        case '6':
          return;
        default:
          Logger.error('Invalid choice');
      }
    }
  }

  private async startChat(): Promise<void> {
    Logger.header('START CHAT');

    // Show some live listings
    const listings = this.controller.listingService.getLiveListings().slice(0, 10);

    if (listings.length === 0) {
      Logger.warn('No listings available');
      return;
    }

    console.log('Available Listings:');
    listings.forEach((listing, idx) => {
      const property = this.controller.propertyService.getPropertyById(listing.propertyId);
      console.log(`${idx + 1}. ${property?.title} - ₹${listing.basePrice} (ID: ${listing.id})`);
    });

    const listingId = await this.prompt('\nEnter Listing ID: ');

    const listing = this.controller.listingService.getListingById(listingId);
    if (!listing) {
      Logger.error('Listing not found');
      return;
    }

    try {
      const thread = this.controller.chatService.getOrCreateThread(
        listingId,
        listing.ownerId,
        this.currentUser!.id
      );
      Logger.success(`Chat started! Thread ID: ${thread.id}`);
    } catch (error: any) {
      Logger.error(`Failed: ${error.message}`);
    }
  }

  private viewMyChats(): void {
    const threads = this.controller.chatService.getUserThreads(this.currentUser!.id);

    if (threads.length === 0) {
      Logger.warn('You have no chats');
      return;
    }

    Logger.header('MY CHATS');
    threads.forEach((thread, idx) => {
      const listing = this.controller.listingService.getListingById(thread.listingId);
      const property = listing ? this.controller.propertyService.getPropertyById(listing.propertyId) : null;

      console.log(`${idx + 1}. ${property?.title || 'Unknown Property'}`);
      console.log(`   Thread ID: ${thread.id}`);
      console.log(`   Active: ${thread.active}`);
      console.log(`   Last Activity: ${thread.lastActivityAt.toLocaleString()}`);
      console.log();
    });
  }

  private async sendMessage(): Promise<void> {
    this.viewMyChats();

    const threads = this.controller.chatService.getUserThreads(this.currentUser!.id);
    if (threads.length === 0) return;

    const threadId = await this.prompt('Enter Thread ID: ');
    const content = await this.prompt('Enter your message: ');

    try {
      this.controller.chatService.sendTextMessage(threadId, this.currentUser!.id, content);
      Logger.success('Message sent!');
    } catch (error: any) {
      Logger.error(`Failed: ${error.message}`);
    }
  }

  private async proposeVisit(): Promise<void> {
    this.viewMyChats();

    const threads = this.controller.chatService.getUserThreads(this.currentUser!.id);
    if (threads.length === 0) return;

    const threadId = await this.prompt('Enter Thread ID: ');
    const dateStr = await this.prompt('Enter visit date/time (YYYY-MM-DD HH:MM): ');

    try {
      const visitDate = new Date(dateStr);
      this.controller.visitService.proposeVisit(threadId, this.currentUser!.id, visitDate);
      Logger.success('Visit proposed!');
    } catch (error: any) {
      Logger.error(`Failed: ${error.message}`);
    }
  }

  private async makeOffer(): Promise<void> {
    this.viewMyChats();

    const threads = this.controller.chatService.getUserThreads(this.currentUser!.id);
    if (threads.length === 0) return;

    const threadId = await this.prompt('Enter Thread ID: ');
    const thread = this.controller.chatService.getThreadById(threadId);
    if (!thread) {
      Logger.error('Thread not found');
      return;
    }

    const amountStr = await this.prompt('Enter offer amount: ');
    const amount = parseFloat(amountStr);

    try {
      this.controller.offerService.createOffer(threadId, thread.listingId, this.currentUser!.id, amount);
      Logger.success('Offer created!');
    } catch (error: any) {
      Logger.error(`Failed: ${error.message}`);
    }
  }

  // Reviews Menu
  private async reviewsMenu(): Promise<void> {
    if (!this.currentUser) {
      Logger.error('Please login first');
      return;
    }

    console.log('\n--- REVIEWS & RATINGS ---');
    console.log('1. Write Review');
    console.log('2. View Reviews');
    console.log('3. Back to Main Menu');
    console.log();

    const choice = await this.prompt('Enter your choice: ');

    if (choice === '1') {
      await this.writeReview();
    } else if (choice === '2') {
      await this.viewReviews();
    }
  }

  private async writeReview(): Promise<void> {
    Logger.header('WRITE REVIEW');
    console.log('Review:');
    console.log('1. Property, 2. User');
    const typeChoice = await this.prompt('Choose: ');

    const rating = parseInt(await this.prompt('Rating (1-5): '));
    const title = await this.prompt('Title: ');
    const comment = await this.prompt('Comment: ');

    try {
      if (typeChoice === '1') {
        const propertyId = await this.prompt('Enter Property ID: ');
        this.controller.reviewService.createReview({
          reviewerId: this.currentUser!.id,
          rating,
          title,
          comment,
          propertyId
        });
      } else {
        const userId = await this.prompt('Enter User ID: ');
        this.controller.reviewService.createReview({
          reviewerId: this.currentUser!.id,
          rating,
          title,
          comment,
          revieweeUserId: userId
        });
      }
      Logger.success('Review submitted!');
    } catch (error: any) {
      Logger.error(`Failed: ${error.message}`);
    }
  }

  private async viewReviews(): Promise<void> {
    const id = await this.prompt('Enter Property ID or User ID: ');
    const reviews = [
      ...this.controller.reviewService.getPropertyReviews(id),
      ...this.controller.reviewService.getUserReviews(id)
    ];

    if (reviews.length === 0) {
      Logger.warn('No reviews found');
      return;
    }

    Logger.header('REVIEWS');
    reviews.forEach((review, idx) => {
      console.log(`${idx + 1}. ${review.title} - ${review.rating}/5 ⭐`);
      console.log(`   ${review.comment}`);
      console.log(`   Posted: ${review.createdAt.toLocaleString()}`);
      console.log();
    });
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
