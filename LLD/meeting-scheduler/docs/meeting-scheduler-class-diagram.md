# MEETING SCHEDULER - CLASS DIAGRAM

## Core Classes

### User
- id: string
- name: string
- email: string
- timezone: string
- workingHoursStart: number
- workingHoursEnd: number
- notificationPreferences: NotificationPreference[]
- createdAt: Date
- updatedAt: Date
- **Methods:**
  - constructor(name: string, email: string, timezone: string)
  - updateWorkingHours(start: number, end: number): void
  - isAvailable(startTime: Date, endTime: Date): boolean
  - addNotificationPreference(preference: NotificationPreference): void

### Event
- id: string
- title: string
- description: string
- startTime: Date
- endTime: Date
- location: string
- organizerId: string
- participantIds: string[]
- roomId: string | null
- recurrenceRule: RecurrenceRule | null
- isRecurring: boolean
- parentEventId: string | null
- status: EventStatus
- createdAt: Date
- updatedAt: Date
- **Methods:**
  - constructor(title: string, organizerId: string, startTime: Date, endTime: Date)
  - addParticipant(userId: string): void
  - removeParticipant(userId: string): void
  - assignRoom(roomId: string): void
  - cancel(): void
  - update(details: Partial<Event>): void
  - hasConflict(otherEvent: Event): boolean
  - getDuration(): number

### RecurrenceRule
- id: string
- pattern: RecurrencePattern
- interval: number
- endDate: Date | null
- occurrenceCount: number | null
- daysOfWeek: DayOfWeek[]
- exceptions: Date[]
- **Methods:**
  - constructor(pattern: RecurrencePattern, interval: number)
  - addException(date: Date): void
  - getNextOccurrence(fromDate: Date): Date | null
  - getAllOccurrences(startDate: Date, endDate: Date): Date[]
  - isValidOccurrence(date: Date): boolean

### Invitation
- id: string
- eventId: string
- userId: string
- status: InvitationStatus
- sentAt: Date
- respondedAt: Date | null
- **Methods:**
  - constructor(eventId: string, userId: string)
  - accept(): void
  - decline(): void
  - tentative(): void
  - isPending(): boolean
  - updateStatus(status: InvitationStatus): void

### MeetingRoom
- id: string
- name: string
- capacity: number
- amenities: string[]
- location: string
- isAvailable: boolean
- **Methods:**
  - constructor(name: string, capacity: number, location: string)
  - addAmenity(amenity: string): void
  - checkCapacity(requiredCapacity: number): boolean
  - setAvailability(available: boolean): void

### Notification
- id: string
- userId: string
- eventId: string
- type: NotificationType
- message: string
- sentAt: Date
- isRead: boolean
- **Methods:**
  - constructor(userId: string, eventId: string, type: NotificationType, message: string)
  - markAsRead(): void
  - send(): void

### Calendar
- id: string
- userId: string
- events: string[]
- **Methods:**
  - constructor(userId: string)
  - addEvent(eventId: string): void
  - removeEvent(eventId: string): void
  - getEvents(startDate: Date, endDate: Date): string[]
  - hasConflict(startTime: Date, endTime: Date): boolean

### NotificationPreference
- userId: string
- notificationType: NotificationType
- minutesBefore: number
- enabled: boolean
- **Methods:**
  - constructor(userId: string, type: NotificationType, minutesBefore: number)
  - toggle(): void

---

## Service Classes

### CalendarService (Singleton)
- instance: CalendarService
- userRepo: UserRepository
- eventRepo: EventRepository
- calendarRepo: CalendarRepository
- invitationRepo: InvitationRepository
- **Methods:**
  - getInstance(): CalendarService
  - createEvent(event: Event): Event
  - updateEvent(eventId: string, updates: Partial<Event>): Event
  - cancelEvent(eventId: string): void
  - getEventsForUser(userId: string, startDate: Date, endDate: Date): Event[]
  - checkAvailability(userId: string, startTime: Date, endTime: Date): boolean

### MeetingScheduler
- eventService: EventService
- roomService: RoomService
- notificationService: NotificationService
- conflictDetector: ConflictDetector
- **Methods:**
  - scheduleMeeting(organizer: User, participants: User[], startTime: Date, endTime: Date, roomId?: string): Event
  - findAvailableSlots(participants: User[], duration: number, startDate: Date, endDate: Date): TimeSlot[]
  - rescheduleMeeting(eventId: string, newStartTime: Date, newEndTime: Date): Event
  - cancelMeeting(eventId: string): void

### InvitationService
- invitationRepo: InvitationRepository
- eventRepo: EventRepository
- notificationService: NotificationService
- observers: IInvitationObserver[]
- **Methods:**
  - sendInvitations(eventId: string, userIds: string[]): Invitation[]
  - respondToInvitation(invitationId: string, status: InvitationStatus): void
  - getInvitationsForUser(userId: string): Invitation[]
  - attach(observer: IInvitationObserver): void
  - detach(observer: IInvitationObserver): void
  - notify(invitation: Invitation): void

### RoomService
- roomRepo: RoomRepository
- roomBookingRepo: RoomBookingRepository
- **Methods:**
  - createRoom(name: string, capacity: number, location: string): MeetingRoom
  - findAvailableRooms(startTime: Date, endTime: Date, requiredCapacity: number): MeetingRoom[]
  - bookRoom(roomId: string, eventId: string, startTime: Date, endTime: Date): RoomBooking
  - releaseRoom(roomId: string, eventId: string): void
  - checkRoomAvailability(roomId: string, startTime: Date, endTime: Date): boolean

### NotificationService
- notificationRepo: NotificationRepository
- userRepo: UserRepository
- **Methods:**
  - sendNotification(userId: string, eventId: string, type: NotificationType, message: string): Notification
  - scheduleReminder(eventId: string, minutesBefore: number): void
  - notifyParticipants(eventId: string, message: string): void
  - getUnreadNotifications(userId: string): Notification[]
  - markAsRead(notificationId: string): void

### RecurrenceService
- strategyMap: Map<RecurrencePattern, IRecurrenceStrategy>
- **Methods:**
  - setStrategy(pattern: RecurrencePattern, strategy: IRecurrenceStrategy): void
  - generateOccurrences(rule: RecurrenceRule, startDate: Date, endDate: Date): Date[]
  - createRecurringEvents(baseEvent: Event, rule: RecurrenceRule): Event[]
  - updateRecurringSeries(eventId: string, updates: Partial<Event>, updateType: UpdateType): void

### ConflictDetector
- eventRepo: EventRepository
- calendarRepo: CalendarRepository
- **Methods:**
  - detectUserConflicts(userId: string, startTime: Date, endTime: Date): Event[]
  - detectRoomConflicts(roomId: string, startTime: Date, endTime: Date): Event[]
  - hasConflict(event: Event): boolean
  - suggestAlternativeSlots(participants: string[], duration: number, preferredDate: Date): TimeSlot[]

---

## Strategy Pattern - Recurrence Strategies

### IRecurrenceStrategy (Interface)
- **Methods:**
  - generateOccurrences(startDate: Date, endDate: Date, interval: number): Date[]
  - getNextOccurrence(fromDate: Date, interval: number): Date

### DailyRecurrenceStrategy
- **Methods:**
  - generateOccurrences(startDate: Date, endDate: Date, interval: number): Date[]
  - getNextOccurrence(fromDate: Date, interval: number): Date

### WeeklyRecurrenceStrategy
- daysOfWeek: DayOfWeek[]
- **Methods:**
  - generateOccurrences(startDate: Date, endDate: Date, interval: number): Date[]
  - getNextOccurrence(fromDate: Date, interval: number): Date

### MonthlyRecurrenceStrategy
- **Methods:**
  - generateOccurrences(startDate: Date, endDate: Date, interval: number): Date[]
  - getNextOccurrence(fromDate: Date, interval: number): Date

---

## State Pattern - Invitation States

### IInvitationState (Interface)
- **Methods:**
  - accept(invitation: Invitation): void
  - decline(invitation: Invitation): void
  - tentative(invitation: Invitation): void
  - getStatusName(): InvitationStatus

### PendingInvitationState
- **Methods:**
  - accept(invitation: Invitation): void
  - decline(invitation: Invitation): void
  - tentative(invitation: Invitation): void
  - getStatusName(): InvitationStatus

### AcceptedInvitationState
- **Methods:**
  - accept(invitation: Invitation): void
  - decline(invitation: Invitation): void
  - tentative(invitation: Invitation): void
  - getStatusName(): InvitationStatus

### DeclinedInvitationState
- **Methods:**
  - accept(invitation: Invitation): void
  - decline(invitation: Invitation): void
  - tentative(invitation: Invitation): void
  - getStatusName(): InvitationStatus

### TentativeInvitationState
- **Methods:**
  - accept(invitation: Invitation): void
  - decline(invitation: Invitation): void
  - tentative(invitation: Invitation): void
  - getStatusName(): InvitationStatus

---

## Observer Pattern - Notification Observers

### IInvitationObserver (Interface)
- **Methods:**
  - update(invitation: Invitation): void

### EmailNotificationObserver
- notificationService: NotificationService
- **Methods:**
  - update(invitation: Invitation): void

### InAppNotificationObserver
- notificationService: NotificationService
- **Methods:**
  - update(invitation: Invitation): void

### ReminderObserver
- notificationService: NotificationService
- **Methods:**
  - update(invitation: Invitation): void

---

## Factory Pattern - Event Factory

### EventFactory
- **Methods:**
  - createSingleEvent(title: string, organizerId: string, startTime: Date, endTime: Date): Event
  - createRecurringEvent(title: string, organizerId: string, startTime: Date, endTime: Date, rule: RecurrenceRule): Event
  - createEventInstance(parentEvent: Event, occurrenceDate: Date): Event

---

## Repository Classes

### UserRepository
- Implements: IRepository<User>
- **Custom Methods:**
  - findByEmail(email: string): User | undefined
  - findByTimezone(timezone: string): User[]

### EventRepository
- Implements: IRepository<Event>
- **Custom Methods:**
  - findByOrganizer(organizerId: string): Event[]
  - findByParticipant(userId: string): Event[]
  - findByDateRange(startDate: Date, endDate: Date): Event[]
  - findByRoom(roomId: string): Event[]
  - findRecurringEvents(): Event[]

### CalendarRepository
- Implements: IRepository<Calendar>
- **Custom Methods:**
  - findByUser(userId: string): Calendar | undefined

### InvitationRepository
- Implements: IRepository<Invitation>
- **Custom Methods:**
  - findByEvent(eventId: string): Invitation[]
  - findByUser(userId: string): Invitation[]
  - findByStatus(userId: string, status: InvitationStatus): Invitation[]

### MeetingRoomRepository
- Implements: IRepository<MeetingRoom>
- **Custom Methods:**
  - findByCapacity(minCapacity: number): MeetingRoom[]
  - findByLocation(location: string): MeetingRoom[]
  - findAvailableRooms(): MeetingRoom[]

### RoomBookingRepository
- Implements: IRepository<RoomBooking>
- **Custom Methods:**
  - findByRoom(roomId: string): RoomBooking[]
  - findByEvent(eventId: string): RoomBooking | undefined
  - findByDateRange(roomId: string, startDate: Date, endDate: Date): RoomBooking[]

### NotificationRepository
- Implements: IRepository<Notification>
- **Custom Methods:**
  - findByUser(userId: string): Notification[]
  - findUnread(userId: string): Notification[]
  - findByEvent(eventId: string): Notification[]

---

## Helper Classes

### TimeSlot
- startTime: Date
- endTime: Date
- availableParticipants: string[]
- **Methods:**
  - constructor(startTime: Date, endTime: Date)
  - getDuration(): number
  - overlaps(other: TimeSlot): boolean

### RoomBooking
- id: string
- roomId: string
- eventId: string
- startTime: Date
- endTime: Date
- bookedAt: Date
- **Methods:**
  - constructor(roomId: string, eventId: string, startTime: Date, endTime: Date)
  - isActive(): boolean

---

## Design Patterns Applied

1. **Singleton Pattern**
   - Classes: CalendarService
   - Justification: Single point of access for calendar operations, maintains global state

2. **Strategy Pattern**
   - Classes: IRecurrenceStrategy, DailyRecurrenceStrategy, WeeklyRecurrenceStrategy, MonthlyRecurrenceStrategy
   - Justification: Different recurrence algorithms that can be swapped dynamically

3. **State Pattern**
   - Classes: IInvitationState, PendingInvitationState, AcceptedInvitationState, DeclinedInvitationState, TentativeInvitationState
   - Justification: Invitation behavior changes based on its status

4. **Observer Pattern**
   - Classes: IInvitationObserver, EmailNotificationObserver, InAppNotificationObserver, ReminderObserver
   - Justification: Multiple notification channels need to react to invitation changes

5. **Factory Pattern**
   - Classes: EventFactory
   - Justification: Complex event creation logic with multiple variants (single/recurring)

6. **Repository Pattern**
   - Classes: All Repository classes
   - Justification: Abstraction for data access, separation of concerns

---

## Relationships

- User (1) → (M) Calendar
- User (1) → (M) Event (as organizer)
- User (M) ← → (M) Event (as participants)
- User (1) → (M) Invitation
- User (1) → (M) Notification
- User (1) → (M) NotificationPreference
- Event (1) → (M) Invitation
- Event (1) → (1) RecurrenceRule (optional)
- Event (1) → (1) MeetingRoom (optional)
- Event (1) → (M) Event (parent-child for recurring)
- MeetingRoom (1) → (M) RoomBooking
- MeetingRoom (1) → (M) Event
- Calendar (1) → (M) Event
- Invitation (1) → (1) IInvitationState (composition)
- InvitationService (1) → (M) IInvitationObserver (aggregation)
- RecurrenceService (1) → (M) IRecurrenceStrategy (composition)
