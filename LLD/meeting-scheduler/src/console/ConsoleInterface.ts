import * as readline from 'readline';
import { UserService } from '../services/UserService';
import { EventService } from '../services/EventService';
import { InvitationService } from '../services/InvitationService';
import { RoomService } from '../services/RoomService';
import { NotificationService } from '../services/NotificationService';
import { RecurrenceService } from '../services/RecurrenceService';
import { ConflictDetector } from '../services/ConflictDetector';
import { RecurrenceRule } from '../models/RecurrenceRule';
import { RecurrencePattern } from '../enums/RecurrencePattern';
import { InvitationStatus } from '../enums/InvitationStatus';
import { NotificationType } from '../enums/NotificationType';
import { Logger } from '../utils/Logger';
import { InMemoryDatabase } from '../database/InMemoryDatabase';
import { EmailNotificationObserver } from '../observers/EmailNotificationObserver';
import { InAppNotificationObserver } from '../observers/InAppNotificationObserver';
import { ReminderObserver } from '../observers/ReminderObserver';

export class ConsoleInterface {
  private userService = new UserService();
  private eventService = new EventService();
  private invitationService = new InvitationService();
  private roomService = new RoomService();
  private notificationService = new NotificationService();
  private recurrenceService = new RecurrenceService();
  private conflictDetector = new ConflictDetector();
  private db = InMemoryDatabase.getInstance();

  private rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  private currentUserId: string | null = null;

  constructor() {
    // Attach observers to invitation service
    this.invitationService.attach(new EmailNotificationObserver());
    this.invitationService.attach(new InAppNotificationObserver());
    this.invitationService.attach(new ReminderObserver(15));
  }

  public async start(): Promise<void> {
    this.printWelcome();
    await this.initializeSampleData();
    await this.mainMenu();
  }

  private printWelcome(): void {
    console.clear();
    console.log('\n' + '='.repeat(70));
    console.log(' '.repeat(20) + 'MEETING SCHEDULER');
    console.log(' '.repeat(18) + '(Google Calendar Clone)');
    console.log('='.repeat(70));
    console.log('  Design Patterns: Singleton, Strategy, State, Observer, Factory, Repository');
    console.log('  Technology: Node.js + TypeScript + In-Memory Database');
    console.log('='.repeat(70) + '\n');
  }

  private async initializeSampleData(): Promise<void> {
    try {
      // Create sample users
      const user1 = this.userService.createUser('Alice Johnson', 'alice@email.com', 'America/New_York');
      const user2 = this.userService.createUser('Bob Smith', 'bob@email.com', 'America/Los_Angeles');
      const user3 = this.userService.createUser('Charlie Brown', 'charlie@email.com', 'Asia/Kolkata');

      // Create sample meeting rooms
      this.roomService.createRoom('Conference Room A', 10, 'Building 1, Floor 2', ['PROJECTOR', 'WHITEBOARD']);
      this.roomService.createRoom('Conference Room B', 6, 'Building 1, Floor 3', ['VIDEO_CONFERENCE', 'TV']);
      this.roomService.createRoom('Board Room', 20, 'Building 2, Floor 5', ['PROJECTOR', 'VIDEO_CONFERENCE', 'WHITEBOARD']);

      Logger.success('Sample data initialized successfully');
    } catch (error) {
      Logger.warn('Sample data already exists or initialization failed');
    }
  }

  private async mainMenu(): Promise<void> {
    while (true) {
      console.log('\n' + '='.repeat(70));
      console.log('MAIN MENU');
      console.log('='.repeat(70));
      console.log('1.  User Management');
      console.log('2.  Event Management');
      console.log('3.  Schedule Meeting');
      console.log('4.  Manage Invitations');
      console.log('5.  Room Management');
      console.log('6.  View Notifications');
      console.log('7.  Recurring Events');
      console.log('8.  View Calendar');
      console.log('9.  Check Conflicts');
      console.log('10. Database Statistics');
      console.log('0.  Exit');
      console.log('='.repeat(70));

      const choice = await this.prompt('Enter your choice: ');

      switch (choice) {
        case '1':
          await this.userManagementMenu();
          break;
        case '2':
          await this.eventManagementMenu();
          break;
        case '3':
          await this.scheduleMeetingFlow();
          break;
        case '4':
          await this.invitationManagementMenu();
          break;
        case '5':
          await this.roomManagementMenu();
          break;
        case '6':
          await this.viewNotificationsMenu();
          break;
        case '7':
          await this.recurringEventMenu();
          break;
        case '8':
          await this.viewCalendarMenu();
          break;
        case '9':
          await this.checkConflictsMenu();
          break;
        case '10':
          this.db.printStats();
          break;
        case '0':
          console.log('\nThank you for using Meeting Scheduler!\n');
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
    console.log('4. Set Current User');
    console.log('0. Back');

    const choice = await this.prompt('Enter choice: ');

    switch (choice) {
      case '1':
        await this.createUserFlow();
        break;
      case '2':
        await this.listAllUsers();
        break;
      case '3':
        await this.viewUserDetails();
        break;
      case '4':
        await this.setCurrentUser();
        break;
      case '0':
        return;
      default:
        Logger.error('Invalid choice');
    }
  }

  private async createUserFlow(): Promise<void> {
    const name = await this.prompt('Enter name: ');
    const email = await this.prompt('Enter email: ');
    const timezone = await this.prompt('Enter timezone (default UTC): ') || 'UTC';

    try {
      const user = this.userService.createUser(name, email, timezone);
      console.log('\n✅ User created successfully!');
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
    } catch (error) {
      Logger.error(`Failed to create user: ${error}`);
    }
  }

  private async listAllUsers(): Promise<void> {
    const users = this.userService.getAllUsers();
    console.log(`\n📋 Total Users: ${users.length}`);
    console.log('-'.repeat(70));
    users.forEach(user => {
      console.log(`${user.id} | ${user.name} | ${user.email} | ${user.timezone}`);
    });
  }

  private async viewUserDetails(): Promise<void> {
    const userId = await this.prompt('Enter user ID: ');
    try {
      const user = this.userService.getUserById(userId);
      console.log('\n' + user.getInfo());
      console.log(`Working Hours: ${user.workingHoursStart}:00 - ${user.workingHoursEnd}:00`);
    } catch (error) {
      Logger.error(`${error}`);
    }
  }

  private async setCurrentUser(): Promise<void> {
    const userId = await this.prompt('Enter user ID: ');
    try {
      const user = this.userService.getUserById(userId);
      this.currentUserId = userId;
      Logger.success(`Current user set to: ${user.name}`);
    } catch (error) {
      Logger.error(`${error}`);
    }
  }

  private async eventManagementMenu(): Promise<void> {
    console.log('\n--- EVENT MANAGEMENT ---');
    console.log('1. Create Single Event');
    console.log('2. List All Events');
    console.log('3. View Event Details');
    console.log('4. Cancel Event');
    console.log('5. View My Events');
    console.log('0. Back');

    const choice = await this.prompt('Enter choice: ');

    switch (choice) {
      case '1':
        await this.createEventFlow();
        break;
      case '2':
        await this.listAllEvents();
        break;
      case '3':
        await this.viewEventDetails();
        break;
      case '4':
        await this.cancelEventFlow();
        break;
      case '5':
        await this.viewMyEvents();
        break;
      case '0':
        return;
      default:
        Logger.error('Invalid choice');
    }
  }

  private async createEventFlow(): Promise<void> {
    if (!this.currentUserId) {
      Logger.error('Please set current user first');
      return;
    }

    const title = await this.prompt('Enter event title: ');
    const description = await this.prompt('Enter description: ');
    const location = await this.prompt('Enter location: ');
    const startTimeStr = await this.prompt('Enter start time (YYYY-MM-DD HH:MM): ');
    const durationMin = parseInt(await this.prompt('Enter duration in minutes: '));

    try {
      const startTime = new Date(startTimeStr);
      const endTime = new Date(startTime.getTime() + durationMin * 60000);

      const event = this.eventService.createEvent(title, this.currentUserId, startTime, endTime, description, location);
      console.log('\n✅ Event created successfully!');
      console.log(`   ID: ${event.id}`);
      console.log(`   Title: ${event.title}`);
      console.log(`   Time: ${event.startTime.toLocaleString()} - ${event.endTime.toLocaleString()}`);
    } catch (error) {
      Logger.error(`Failed to create event: ${error}`);
    }
  }

  private async listAllEvents(): Promise<void> {
    const events = this.eventService.getUpcomingEvents();
    console.log(`\n📅 Upcoming Events: ${events.length}`);
    console.log('-'.repeat(70));
    events.forEach(event => {
      console.log(`${event.id} | ${event.title} | ${event.startTime.toLocaleString()}`);
    });
  }

  private async viewEventDetails(): Promise<void> {
    const eventId = await this.prompt('Enter event ID: ');
    try {
      const event = this.eventService.getEventById(eventId);
      console.log('\n' + event.getInfo());
      console.log(`Description: ${event.description}`);
      console.log(`Location: ${event.location}`);
      console.log(`Participants: ${event.participantIds.length}`);
      console.log(`Status: ${event.status}`);
    } catch (error) {
      Logger.error(`${error}`);
    }
  }

  private async cancelEventFlow(): Promise<void> {
    const eventId = await this.prompt('Enter event ID to cancel: ');
    try {
      this.eventService.cancelEvent(eventId);
      console.log('\n✅ Event cancelled successfully!');
    } catch (error) {
      Logger.error(`${error}`);
    }
  }

  private async viewMyEvents(): Promise<void> {
    if (!this.currentUserId) {
      Logger.error('Please set current user first');
      return;
    }

    const events = this.eventService.getEventsForUser(this.currentUserId);
    console.log(`\n📅 My Events: ${events.length}`);
    console.log('-'.repeat(70));
    events.forEach(event => {
      console.log(`${event.id} | ${event.title} | ${event.startTime.toLocaleString()} | ${event.status}`);
    });
  }

  private async scheduleMeetingFlow(): Promise<void> {
    if (!this.currentUserId) {
      Logger.error('Please set current user first');
      return;
    }

    console.log('\n--- SCHEDULE MEETING ---');
    const title = await this.prompt('Enter meeting title: ');
    const description = await this.prompt('Enter description: ');
    const startTimeStr = await this.prompt('Enter start time (YYYY-MM-DD HH:MM): ');
    const durationMin = parseInt(await this.prompt('Enter duration in minutes: '));

    const participantIdsStr = await this.prompt('Enter participant IDs (comma-separated): ');
    const participantIds = participantIdsStr.split(',').map(id => id.trim()).filter(id => id.length > 0);

    const needRoom = await this.prompt('Need meeting room? (y/n): ');
    let roomId: string | undefined;

    try {
      const startTime = new Date(startTimeStr);
      const endTime = new Date(startTime.getTime() + durationMin * 60000);

      // Check conflicts
      const conflicts = this.conflictDetector.detectUserConflicts(this.currentUserId, startTime, endTime);
      if (conflicts.length > 0) {
        Logger.warn(`You have ${conflicts.length} conflicting events!`);
        const proceed = await this.prompt('Continue anyway? (y/n): ');
        if (proceed.toLowerCase() !== 'y') return;
      }

      // Handle room booking
      if (needRoom.toLowerCase() === 'y') {
        const requiredCapacity = participantIds.length + 1;
        const availableRooms = this.roomService.findAvailableRooms(startTime, endTime, requiredCapacity);

        if (availableRooms.length === 0) {
          Logger.error('No rooms available for this time slot');
          return;
        }

        console.log('\nAvailable Rooms:');
        availableRooms.forEach((room, idx) => {
          console.log(`${idx + 1}. ${room.name} (Capacity: ${room.capacity})`);
        });

        const roomChoice = parseInt(await this.prompt('Select room number: ')) - 1;
        if (roomChoice >= 0 && roomChoice < availableRooms.length) {
          roomId = availableRooms[roomChoice].id;
        }
      }

      // Create event
      const event = this.eventService.createEvent(title, this.currentUserId, startTime, endTime, description);

      // Add participants
      for (const participantId of participantIds) {
        this.eventService.addParticipantToEvent(event.id, participantId);
      }

      // Book room if selected
      if (roomId) {
        this.roomService.bookRoom(roomId, event.id, startTime, endTime);
        Logger.success('Room booked successfully');
      }

      // Send invitations
      const invitations = this.invitationService.sendInvitations(event.id, participantIds);

      console.log('\n✅ Meeting scheduled successfully!');
      console.log(`   Event ID: ${event.id}`);
      console.log(`   Invitations sent: ${invitations.length}`);

    } catch (error) {
      Logger.error(`Failed to schedule meeting: ${error}`);
    }
  }

  private async invitationManagementMenu(): Promise<void> {
    if (!this.currentUserId) {
      Logger.error('Please set current user first');
      return;
    }

    console.log('\n--- MANAGE INVITATIONS ---');
    console.log('1. View Pending Invitations');
    console.log('2. Respond to Invitation');
    console.log('3. View All My Invitations');
    console.log('0. Back');

    const choice = await this.prompt('Enter choice: ');

    switch (choice) {
      case '1':
        await this.viewPendingInvitations();
        break;
      case '2':
        await this.respondToInvitation();
        break;
      case '3':
        await this.viewAllInvitations();
        break;
      case '0':
        return;
      default:
        Logger.error('Invalid choice');
    }
  }

  private async viewPendingInvitations(): Promise<void> {
    const invitations = this.invitationService.getPendingInvitations(this.currentUserId!);
    console.log(`\n📨 Pending Invitations: ${invitations.length}`);
    console.log('-'.repeat(70));
    invitations.forEach(inv => {
      console.log(`${inv.id} | Event: ${inv.eventId} | Sent: ${inv.sentAt.toLocaleString()}`);
    });
  }

  private async respondToInvitation(): Promise<void> {
    const invitationId = await this.prompt('Enter invitation ID: ');
    console.log('\nResponse: 1=Accept, 2=Decline, 3=Tentative');
    const response = await this.prompt('Enter choice: ');

    try {
      switch (response) {
        case '1':
          this.invitationService.acceptInvitation(invitationId);
          break;
        case '2':
          this.invitationService.declineInvitation(invitationId);
          break;
        case '3':
          this.invitationService.tentativeInvitation(invitationId);
          break;
        default:
          Logger.error('Invalid response');
          return;
      }
      console.log('\n✅ Response recorded successfully!');
    } catch (error) {
      Logger.error(`${error}`);
    }
  }

  private async viewAllInvitations(): Promise<void> {
    const invitations = this.invitationService.getInvitationsForUser(this.currentUserId!);
    console.log(`\n📨 All Invitations: ${invitations.length}`);
    console.log('-'.repeat(70));
    invitations.forEach(inv => {
      console.log(`${inv.id} | Event: ${inv.eventId} | Status: ${inv.status}`);
    });
  }

  private async roomManagementMenu(): Promise<void> {
    console.log('\n--- ROOM MANAGEMENT ---');
    console.log('1. Create Room');
    console.log('2. List All Rooms');
    console.log('3. Check Room Availability');
    console.log('0. Back');

    const choice = await this.prompt('Enter choice: ');

    switch (choice) {
      case '1':
        await this.createRoomFlow();
        break;
      case '2':
        await this.listAllRooms();
        break;
      case '3':
        await this.checkRoomAvailability();
        break;
      case '0':
        return;
      default:
        Logger.error('Invalid choice');
    }
  }

  private async createRoomFlow(): Promise<void> {
    const name = await this.prompt('Enter room name: ');
    const capacity = parseInt(await this.prompt('Enter capacity: '));
    const location = await this.prompt('Enter location: ');

    try {
      const room = this.roomService.createRoom(name, capacity, location);
      console.log('\n✅ Room created successfully!');
      console.log(`   ID: ${room.id}`);
    } catch (error) {
      Logger.error(`${error}`);
    }
  }

  private async listAllRooms(): Promise<void> {
    const rooms = this.roomService.getAllRooms();
    console.log(`\n🏢 Total Rooms: ${rooms.length}`);
    console.log('-'.repeat(70));
    rooms.forEach(room => {
      console.log(`${room.id} | ${room.name} | Capacity: ${room.capacity} | ${room.location}`);
    });
  }

  private async checkRoomAvailability(): Promise<void> {
    const startTimeStr = await this.prompt('Enter start time (YYYY-MM-DD HH:MM): ');
    const durationMin = parseInt(await this.prompt('Enter duration in minutes: '));
    const capacity = parseInt(await this.prompt('Enter required capacity: '));

    try {
      const startTime = new Date(startTimeStr);
      const endTime = new Date(startTime.getTime() + durationMin * 60000);
      const rooms = this.roomService.findAvailableRooms(startTime, endTime, capacity);

      console.log(`\n✅ Available Rooms: ${rooms.length}`);
      rooms.forEach(room => {
        console.log(`   ${room.name} (Capacity: ${room.capacity})`);
      });
    } catch (error) {
      Logger.error(`${error}`);
    }
  }

  private async viewNotificationsMenu(): Promise<void> {
    if (!this.currentUserId) {
      Logger.error('Please set current user first');
      return;
    }

    const notifications = this.notificationService.getAllNotifications(this.currentUserId);
    const unreadCount = this.notificationService.getUnreadCount(this.currentUserId);

    console.log(`\n🔔 Notifications (${unreadCount} unread)`);
    console.log('-'.repeat(70));
    notifications.forEach(notif => {
      const status = notif.isRead ? '✓' : '●';
      console.log(`${status} [${notif.type}] ${notif.message}`);
    });
  }

  private async recurringEventMenu(): Promise<void> {
    console.log('\n--- RECURRING EVENTS ---');
    console.log('1. Create Daily Recurring Event');
    console.log('2. Create Weekly Recurring Event');
    console.log('3. Create Monthly Recurring Event');
    console.log('0. Back');

    const choice = await this.prompt('Enter choice: ');

    switch (choice) {
      case '1':
        await this.createRecurringEvent(RecurrencePattern.DAILY);
        break;
      case '2':
        await this.createRecurringEvent(RecurrencePattern.WEEKLY);
        break;
      case '3':
        await this.createRecurringEvent(RecurrencePattern.MONTHLY);
        break;
      case '0':
        return;
      default:
        Logger.error('Invalid choice');
    }
  }

  private async createRecurringEvent(pattern: RecurrencePattern): Promise<void> {
    if (!this.currentUserId) {
      Logger.error('Please set current user first');
      return;
    }

    const title = await this.prompt('Enter event title: ');
    const startTimeStr = await this.prompt('Enter start time (YYYY-MM-DD HH:MM): ');
    const durationMin = parseInt(await this.prompt('Enter duration in minutes: '));
    const interval = parseInt(await this.prompt('Enter interval (1=every, 2=every other, etc): '));
    const occurrences = parseInt(await this.prompt('Enter number of occurrences: '));

    try {
      const startTime = new Date(startTimeStr);
      const endTime = new Date(startTime.getTime() + durationMin * 60000);

      const rule = new RecurrenceRule(pattern, interval, null, occurrences);
      const event = this.eventService.createRecurringEvent(title, this.currentUserId, startTime, endTime, rule);

      console.log('\n✅ Recurring event created successfully!');
      console.log(`   Pattern: ${pattern}`);
      console.log(`   Occurrences: ${occurrences}`);
    } catch (error) {
      Logger.error(`${error}`);
    }
  }

  private async viewCalendarMenu(): Promise<void> {
    if (!this.currentUserId) {
      Logger.error('Please set current user first');
      return;
    }

    const events = this.eventService.getEventsForUser(this.currentUserId);
    console.log(`\n📅 My Calendar`);
    console.log('-'.repeat(70));

    const sortedEvents = events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    sortedEvents.forEach(event => {
      console.log(`📌 ${event.title}`);
      console.log(`   ${event.startTime.toLocaleString()} - ${event.endTime.toLocaleString()}`);
      console.log(`   Location: ${event.location || 'Not specified'}`);
      console.log(`   Status: ${event.status}`);
      console.log('');
    });
  }

  private async checkConflictsMenu(): Promise<void> {
    if (!this.currentUserId) {
      Logger.error('Please set current user first');
      return;
    }

    const startTimeStr = await this.prompt('Enter start time (YYYY-MM-DD HH:MM): ');
    const durationMin = parseInt(await this.prompt('Enter duration in minutes: '));

    try {
      const startTime = new Date(startTimeStr);
      const endTime = new Date(startTime.getTime() + durationMin * 60000);

      const conflicts = this.conflictDetector.detectUserConflicts(this.currentUserId, startTime, endTime);

      if (conflicts.length === 0) {
        console.log('\n✅ No conflicts found! Time slot is available.');
      } else {
        console.log(`\n⚠️  Found ${conflicts.length} conflicts:`);
        conflicts.forEach(event => {
          console.log(`   - ${event.title} (${event.startTime.toLocaleString()})`);
        });

        console.log('\nSuggesting alternative time slots...');
        const suggestions = this.conflictDetector.suggestAlternativeSlots(
          [this.currentUserId],
          durationMin * 60000,
          startTime,
          3
        );

        if (suggestions.length > 0) {
          console.log('\nAvailable alternatives:');
          suggestions.forEach((slot, idx) => {
            console.log(`${idx + 1}. ${slot.startTime.toLocaleString()} - ${slot.endTime.toLocaleString()}`);
          });
        }
      }
    } catch (error) {
      Logger.error(`${error}`);
    }
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
