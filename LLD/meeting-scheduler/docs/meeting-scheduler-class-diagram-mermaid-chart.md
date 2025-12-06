# Meeting Scheduler - Complete Class Diagram with UML Relationships

This diagram represents the complete architecture of the Meeting Scheduler system using proper UML relationship notation.

## Design Patterns Implemented
1. **Singleton Pattern**: InMemoryDatabase
2. **Repository Pattern**: IRepository interface with 7 implementations
3. **Factory Pattern**: EventFactory for creating different types of events
4. **Observer Pattern**: IInvitationObserver with multiple notification observers
5. **Strategy Pattern**: IRecurrenceStrategy with Daily, Weekly, Monthly strategies
6. **State Pattern**: IInvitationState with 4 state implementations

```mermaid
classDiagram
    %% ============================================
    %% ENUMS
    %% ============================================
    class EventStatus {
        <<enumeration>>
        SCHEDULED
        CANCELLED
        COMPLETED
    }

    class InvitationStatus {
        <<enumeration>>
        PENDING
        ACCEPTED
        DECLINED
        TENTATIVE
    }

    class NotificationType {
        <<enumeration>>
        INVITATION
        REMINDER
        UPDATE
        CANCELLATION
        RESPONSE
    }

    class RecurrencePattern {
        <<enumeration>>
        DAILY
        WEEKLY
        MONTHLY
    }

    class DayOfWeek {
        <<enumeration>>
        SUNDAY
        MONDAY
        TUESDAY
        WEDNESDAY
        THURSDAY
        FRIDAY
        SATURDAY
    }

    %% ============================================
    %% CORE MODELS
    %% ============================================
    class Event {
        +String id
        +String title
        +String description
        +Date startTime
        +Date endTime
        +String location
        +String organizerId
        +String[] participantIds
        +String roomId
        +RecurrenceRule recurrenceRule
        +Boolean isRecurring
        +String parentEventId
        +EventStatus status
        +Date createdAt
        +Date updatedAt
        +addParticipant(userId: String) void
        +removeParticipant(userId: String) void
        +assignRoom(roomId: String) void
        +cancel() void
        +hasConflict(otherEvent: Event) boolean
        +getDuration() number
        +setRecurrence(rule: RecurrenceRule) void
        +updateDetails(updates: Partial~Event~) void
        +getInfo() String
    }

    class User {
        +String id
        +String name
        +String email
        +String timezone
        +number workingHoursStart
        +number workingHoursEnd
        +NotificationPreference[] notificationPreferences
        +Date createdAt
        +Date updatedAt
        +updateWorkingHours(start: number, end: number) void
        +isAvailable(startTime: Date, endTime: Date) boolean
        +addNotificationPreference(preference: NotificationPreference) void
        +getInfo() String
    }

    class Calendar {
        +String id
        +String userId
        +String[] events
        +addEvent(eventId: String) void
        +removeEvent(eventId: String) void
        +hasEvent(eventId: String) boolean
        +getEventCount() number
        +getInfo() String
    }

    class MeetingRoom {
        +String id
        +String name
        +number capacity
        +String[] amenities
        +String location
        +Boolean isAvailable
        +Date createdAt
        +Date updatedAt
        +addAmenity(amenity: String) void
        +checkCapacity(requiredCapacity: number) boolean
        +setAvailability(available: boolean) void
        +getInfo() String
    }

    class RoomBooking {
        +String id
        +String roomId
        +String eventId
        +Date startTime
        +Date endTime
        +Date bookedAt
        +isActive() boolean
        +hasConflict(other: RoomBooking) boolean
        +getInfo() String
    }

    class Invitation {
        +String id
        +String eventId
        +String userId
        +InvitationStatus status
        +Date sentAt
        +Date respondedAt
        +accept() void
        +decline() void
        +tentative() void
        +updateStatus(status: InvitationStatus) void
        +isPending() boolean
        +isAccepted() boolean
        +isDeclined() boolean
        +isTentative() boolean
        +getInfo() String
    }

    class RecurrenceRule {
        +String id
        +RecurrencePattern pattern
        +number interval
        +Date endDate
        +number occurrenceCount
        +DayOfWeek[] daysOfWeek
        +Date[] exceptions
        +addException(date: Date) void
        +isValidOccurrence(date: Date) boolean
        +setDaysOfWeek(days: DayOfWeek[]) void
        +getInfo() String
    }

    class Notification {
        +String id
        +String userId
        +String eventId
        +NotificationType type
        +String message
        +Date sentAt
        +Boolean isRead
        +markAsRead() void
        +send() void
        +getInfo() String
    }

    class NotificationPreference {
        +String userId
        +NotificationType notificationType
        +number minutesBefore
        +Boolean enabled
        +toggle() void
        +updateMinutes(minutes: number) void
        +getInfo() String
    }

    class TimeSlot {
        +Date startTime
        +Date endTime
        +String[] availableParticipants
        +getDuration() number
        +overlaps(other: TimeSlot) boolean
        +addParticipant(userId: String) void
        +getInfo() String
    }

    %% ============================================
    %% SERVICES
    %% ============================================
    class EventService {
        -EventRepository eventRepo
        -CalendarRepository calendarRepo
        +createEvent(title, organizerId, startTime, endTime, description, location) Event
        +createRecurringEvent(title, organizerId, startTime, endTime, rule, description, location) Event
        +getEventById(id: String) Event
        +updateEvent(eventId: String, updates: Partial~Event~) Event
        +cancelEvent(eventId: String) void
        +getEventsForUser(userId: String) Event[]
        +getEventsByOrganizer(organizerId: String) Event[]
        +getUpcomingEvents() Event[]
        +addParticipantToEvent(eventId, userId) void
        +removeParticipantFromEvent(eventId, userId) void
    }

    class InvitationService {
        -InvitationRepository invitationRepo
        -EventRepository eventRepo
        -IInvitationObserver[] observers
        +sendInvitations(eventId: String, userIds: String[]) Invitation[]
        +respondToInvitation(invitationId: String, status: InvitationStatus) void
        +acceptInvitation(invitationId: String) void
        +declineInvitation(invitationId: String) void
        +tentativeInvitation(invitationId: String) void
        +getInvitationsForUser(userId: String) Invitation[]
        +getPendingInvitations(userId: String) Invitation[]
        +getInvitationsForEvent(eventId: String) Invitation[]
        +attach(observer: IInvitationObserver) void
        +detach(observer: IInvitationObserver) void
    }

    class RoomService {
        -MeetingRoomRepository roomRepo
        -RoomBookingRepository bookingRepo
        +createRoom(name, capacity, location, amenities) MeetingRoom
        +getRoomById(id: String) MeetingRoom
        +getAllRooms() MeetingRoom[]
        +findAvailableRooms(startTime, endTime, requiredCapacity) MeetingRoom[]
        +bookRoom(roomId, eventId, startTime, endTime) RoomBooking
        +releaseRoom(roomId, eventId) void
        +checkRoomAvailability(roomId, startTime, endTime) boolean
        +getRoomBookings(roomId: String) RoomBooking[]
    }

    class NotificationService {
        -NotificationRepository notificationRepo
        -UserRepository userRepo
        +sendNotification(userId, eventId, type, message) Notification
        +notifyParticipants(userIds, eventId, type, message) void
        +scheduleReminder(eventId, userId, minutesBefore) void
        +getUnreadNotifications(userId: String) Notification[]
        +getAllNotifications(userId: String) Notification[]
        +markAsRead(notificationId: String) void
        +markAllAsRead(userId: String) void
        +getUnreadCount(userId: String) number
    }

    class UserService {
        -UserRepository userRepo
        -CalendarRepository calendarRepo
        +createUser(name, email, timezone) User
        +getUserById(id: String) User
        +getUserByEmail(email: String) User
        +getAllUsers() User[]
        +updateWorkingHours(userId, start, end) void
        +deleteUser(userId: String) void
        +getUserCount() number
    }

    class RecurrenceService {
        -Map~RecurrencePattern, IRecurrenceStrategy~ strategyMap
        +setStrategy(pattern: RecurrencePattern, strategy: IRecurrenceStrategy) void
        +generateOccurrences(rule: RecurrenceRule, startDate, endDate) Date[]
        +createRecurringEvents(baseEvent: Event, rule: RecurrenceRule, endDate: Date) Event[]
        +getNextOccurrence(rule: RecurrenceRule, fromDate: Date) Date
        +expandRecurringEvent(event: Event, startDate, endDate) Event[]
    }

    class ConflictDetector {
        -EventRepository eventRepo
        -CalendarRepository calendarRepo
        +detectUserConflicts(userId, startTime, endTime, excludeEventId) Event[]
        +detectRoomConflicts(roomId, startTime, endTime, excludeEventId) Event[]
        +hasConflict(event: Event) boolean
        +suggestAlternativeSlots(participants, duration, preferredDate, numSlots) TimeSlot[]
    }

    %% ============================================
    %% REPOSITORIES
    %% ============================================
    class IRepository~T~ {
        <<interface>>
        +findById(id: String) T
        +findAll() T[]
        +save(entity: T) T
        +delete(id: String) boolean
        +exists(id: String) boolean
        +count() number
        +clear() void
    }

    class EventRepository {
        -InMemoryDatabase db
        +findByOrganizer(organizerId: String) Event[]
        +findByParticipant(userId: String) Event[]
        +findByRoom(roomId: String) Event[]
        +findUpcoming() Event[]
        +findByDateRange(startDate, endDate) Event[]
    }

    class CalendarRepository {
        -InMemoryDatabase db
        +findByUser(userId: String) Calendar
    }

    class UserRepository {
        -InMemoryDatabase db
        +findByEmail(email: String) User
        +emailExists(email: String) boolean
    }

    class InvitationRepository {
        -InMemoryDatabase db
        +findByUser(userId: String) Invitation[]
        +findByEvent(eventId: String) Invitation[]
        +findPending(userId: String) Invitation[]
        +findByEventAndUser(eventId, userId) Invitation
    }

    class MeetingRoomRepository {
        -InMemoryDatabase db
        +findByName(name: String) MeetingRoom
        +findByCapacity(minCapacity: number) MeetingRoom[]
    }

    class RoomBookingRepository {
        -InMemoryDatabase db
        +findByRoom(roomId: String) RoomBooking[]
        +findByEvent(eventId: String) RoomBooking
        +findByDateRange(roomId, startTime, endTime) RoomBooking[]
    }

    class NotificationRepository {
        -InMemoryDatabase db
        +findByUser(userId: String) Notification[]
        +findUnread(userId: String) Notification[]
        +markAllAsRead(userId: String) void
    }

    %% ============================================
    %% DATABASE (SINGLETON)
    %% ============================================
    class InMemoryDatabase {
        <<Singleton>>
        -static InMemoryDatabase instance
        +Map~String, User~ users
        +Map~String, Event~ events
        +Map~String, Calendar~ calendars
        +Map~String, Invitation~ invitations
        +Map~String, MeetingRoom~ meetingRooms
        +Map~String, RoomBooking~ roomBookings
        +Map~String, Notification~ notifications
        +static getInstance() InMemoryDatabase
        +clearAll() void
        +getStats() Object
        +printStats() void
    }

    %% ============================================
    %% OBSERVER PATTERN
    %% ============================================
    class IInvitationObserver {
        <<interface>>
        +update(invitation: Invitation) void
    }

    class EmailNotificationObserver {
        +update(invitation: Invitation) void
    }

    class InAppNotificationObserver {
        +update(invitation: Invitation) void
    }

    class ReminderObserver {
        +update(invitation: Invitation) void
    }

    %% ============================================
    %% STRATEGY PATTERN
    %% ============================================
    class IRecurrenceStrategy {
        <<interface>>
        +generateOccurrences(startDate, endDate, interval) Date[]
        +getNextOccurrence(fromDate, interval) Date
    }

    class DailyRecurrenceStrategy {
        +generateOccurrences(startDate, endDate, interval) Date[]
        +getNextOccurrence(fromDate, interval) Date
    }

    class WeeklyRecurrenceStrategy {
        +generateOccurrences(startDate, endDate, interval) Date[]
        +getNextOccurrence(fromDate, interval) Date
    }

    class MonthlyRecurrenceStrategy {
        +generateOccurrences(startDate, endDate, interval) Date[]
        +getNextOccurrence(fromDate, interval) Date
    }

    %% ============================================
    %% STATE PATTERN
    %% ============================================
    class IInvitationState {
        <<interface>>
        +accept(invitation: Invitation) void
        +decline(invitation: Invitation) void
        +tentative(invitation: Invitation) void
        +getStatusName() InvitationStatus
    }

    class PendingInvitationState {
        +accept(invitation: Invitation) void
        +decline(invitation: Invitation) void
        +tentative(invitation: Invitation) void
        +getStatusName() InvitationStatus
    }

    class AcceptedInvitationState {
        +accept(invitation: Invitation) void
        +decline(invitation: Invitation) void
        +tentative(invitation: Invitation) void
        +getStatusName() InvitationStatus
    }

    class DeclinedInvitationState {
        +accept(invitation: Invitation) void
        +decline(invitation: Invitation) void
        +tentative(invitation: Invitation) void
        +getStatusName() InvitationStatus
    }

    class TentativeInvitationState {
        +accept(invitation: Invitation) void
        +decline(invitation: Invitation) void
        +tentative(invitation: Invitation) void
        +getStatusName() InvitationStatus
    }

    %% ============================================
    %% FACTORY PATTERN
    %% ============================================
    class EventFactory {
        <<Factory>>
        +static createSingleEvent(title, organizerId, startTime, endTime, description, location) Event
        +static createRecurringEvent(title, organizerId, startTime, endTime, rule, description, location) Event
        +static createEventInstance(parentEvent: Event, occurrenceDate: Date) Event
    }

    %% ============================================
    %% RELATIONSHIPS - ENUMS TO MODELS
    %% ============================================
    Event --> EventStatus : uses
    Invitation --> InvitationStatus : uses
    Notification --> NotificationType : uses
    NotificationPreference --> NotificationType : uses
    RecurrenceRule --> RecurrencePattern : uses
    RecurrenceRule --> DayOfWeek : uses
    IInvitationState --> InvitationStatus : returns

    %% ============================================
    %% RELATIONSHIPS - COMPOSITION (*--)
    %% Event owns RecurrenceRule (lifecycle dependent)
    %% User owns NotificationPreferences (lifecycle dependent)
    %% ============================================
    Event *-- RecurrenceRule : composition
    User *-- NotificationPreference : composition

    %% ============================================
    %% RELATIONSHIPS - AGGREGATION (o--)
    %% Calendar contains Events but they exist independently
    %% InvitationService aggregates Observers
    %% ============================================
    Calendar o-- Event : aggregation
    InvitationService o-- IInvitationObserver : aggregation

    %% ============================================
    %% RELATIONSHIPS - ASSOCIATION (-->)
    %% Simple references between entities
    %% ============================================
    Event --> User : organizer
    Event --> MeetingRoom : room
    Event --> Event : parent
    Calendar --> User : owner
    RoomBooking --> MeetingRoom : room
    RoomBooking --> Event : event
    Invitation --> Event : event
    Invitation --> User : invitee
    Notification --> User : recipient
    Notification --> Event : event
    NotificationPreference --> User : owner

    %% ============================================
    %% RELATIONSHIPS - SERVICES TO REPOSITORIES
    %% Services depend on repositories
    %% ============================================
    EventService --> EventRepository : uses
    EventService --> CalendarRepository : uses
    EventService --> EventFactory : uses
    EventService ..> Event : creates/manages
    
    InvitationService --> InvitationRepository : uses
    InvitationService --> EventRepository : uses
    InvitationService ..> Invitation : creates/manages
    
    RoomService --> MeetingRoomRepository : uses
    RoomService --> RoomBookingRepository : uses
    RoomService ..> MeetingRoom : creates/manages
    RoomService ..> RoomBooking : creates/manages
    
    NotificationService --> NotificationRepository : uses
    NotificationService --> UserRepository : uses
    NotificationService ..> Notification : creates/manages
    
    UserService --> UserRepository : uses
    UserService --> CalendarRepository : uses
    UserService ..> User : creates/manages
    UserService ..> Calendar : creates/manages
    
    RecurrenceService --> IRecurrenceStrategy : uses
    RecurrenceService ..> Event : generates
    RecurrenceService --> RecurrenceRule : uses
    
    ConflictDetector --> EventRepository : uses
    ConflictDetector --> CalendarRepository : uses
    ConflictDetector ..> TimeSlot : creates

    %% ============================================
    %% RELATIONSHIPS - REPOSITORY IMPLEMENTATIONS
    %% All repositories implement IRepository interface
    %% ============================================
    EventRepository ..|> IRepository : implements
    CalendarRepository ..|> IRepository : implements
    UserRepository ..|> IRepository : implements
    InvitationRepository ..|> IRepository : implements
    MeetingRoomRepository ..|> IRepository : implements
    RoomBookingRepository ..|> IRepository : implements
    NotificationRepository ..|> IRepository : implements

    %% ============================================
    %% RELATIONSHIPS - REPOSITORIES TO DATABASE
    %% All repositories use singleton database
    %% ============================================
    EventRepository --> InMemoryDatabase : uses
    CalendarRepository --> InMemoryDatabase : uses
    UserRepository --> InMemoryDatabase : uses
    InvitationRepository --> InMemoryDatabase : uses
    MeetingRoomRepository --> InMemoryDatabase : uses
    RoomBookingRepository --> InMemoryDatabase : uses
    NotificationRepository --> InMemoryDatabase : uses

    %% ============================================
    %% RELATIONSHIPS - OBSERVER PATTERN
    %% Concrete observers implement interface
    %% ============================================
    EmailNotificationObserver ..|> IInvitationObserver : implements
    InAppNotificationObserver ..|> IInvitationObserver : implements
    ReminderObserver ..|> IInvitationObserver : implements

    %% ============================================
    %% RELATIONSHIPS - STRATEGY PATTERN
    %% Concrete strategies implement interface
    %% ============================================
    DailyRecurrenceStrategy ..|> IRecurrenceStrategy : implements
    WeeklyRecurrenceStrategy ..|> IRecurrenceStrategy : implements
    MonthlyRecurrenceStrategy ..|> IRecurrenceStrategy : implements

    %% ============================================
    %% RELATIONSHIPS - STATE PATTERN
    %% Concrete states implement interface
    %% ============================================
    PendingInvitationState ..|> IInvitationState : implements
    AcceptedInvitationState ..|> IInvitationState : implements
    DeclinedInvitationState ..|> IInvitationState : implements
    TentativeInvitationState ..|> IInvitationState : implements

    %% ============================================
    %% RELATIONSHIPS - FACTORY PATTERN
    %% Factory creates Event instances
    %% ============================================
    EventFactory ..> Event : creates
    EventFactory --> RecurrenceRule : uses
```

## UML Relationship Types Explained

### 1. Composition (*--)
**Meaning**: Strong ownership - child cannot exist without parent
- **Event *-- RecurrenceRule**: RecurrenceRule is part of Event, destroyed when Event is destroyed
- **User *-- NotificationPreference**: NotificationPreferences belong to User, removed when User is deleted

### 2. Aggregation (o--)
**Meaning**: Weak ownership - child can exist independently
- **Calendar o-- Event**: Calendar contains Event references, but Events exist independently
- **InvitationService o-- IInvitationObserver**: Service aggregates observers, but observers can exist independently

### 3. Association (-->)
**Meaning**: Simple relationship or reference
- **Event --> User**: Event references its organizer
- **Event --> MeetingRoom**: Event references a room
- **Invitation --> Event**: Invitation references an event
- **RoomBooking --> Event**: Booking references an event

### 4. Dependency (..>)
**Meaning**: One class uses another (creates, manages, or depends on)
- **EventService ..> Event**: Service creates and manages Event instances
- **EventFactory ..> Event**: Factory creates Event instances
- **ConflictDetector ..> TimeSlot**: Creates TimeSlot objects for suggestions

### 5. Implementation (..|>)
**Meaning**: Class implements an interface
- **EventRepository ..|> IRepository**: Implements repository interface
- **DailyRecurrenceStrategy ..|> IRecurrenceStrategy**: Implements strategy interface
- **EmailNotificationObserver ..|> IInvitationObserver**: Implements observer interface

## Architecture Layers

### Presentation Layer
- ConsoleInterface (not shown in diagram)

### Service Layer
- EventService
- InvitationService
- RoomService
- NotificationService
- UserService
- RecurrenceService
- ConflictDetector

### Repository Layer
- IRepository<T> (interface)
- EventRepository
- CalendarRepository
- UserRepository
- InvitationRepository
- MeetingRoomRepository
- RoomBookingRepository
- NotificationRepository

### Model Layer
- Event, User, Calendar
- MeetingRoom, RoomBooking
- Invitation, Notification
- RecurrenceRule, NotificationPreference
- TimeSlot

### Data Layer
- InMemoryDatabase (Singleton)

### Pattern Layer
- **Factory**: EventFactory
- **Observer**: IInvitationObserver + 3 implementations
- **Strategy**: IRecurrenceStrategy + 3 implementations
- **State**: IInvitationState + 4 implementations

## Design Pattern Details

### 1. Singleton Pattern
**Class**: InMemoryDatabase
**Purpose**: Ensure single instance of database across the application
**Implementation**: Private constructor, static getInstance() method

### 2. Repository Pattern
**Classes**: IRepository<T> interface + 7 implementations
**Purpose**: Abstract data access layer, provide clean separation of concerns
**Benefits**: Easy to test, swap data sources, maintain

### 3. Factory Pattern
**Class**: EventFactory
**Purpose**: Centralize complex event creation logic
**Methods**:
- createSingleEvent(): Creates one-time events
- createRecurringEvent(): Creates events with recurrence rules
- createEventInstance(): Creates instances from recurring event template

### 4. Observer Pattern
**Interface**: IInvitationObserver
**Implementations**: EmailNotificationObserver, InAppNotificationObserver, ReminderObserver
**Purpose**: Notify multiple channels when invitation status changes
**Benefits**: Loose coupling, easy to add new notification types

### 5. Strategy Pattern
**Interface**: IRecurrenceStrategy
**Implementations**: DailyRecurrenceStrategy, WeeklyRecurrenceStrategy, MonthlyRecurrenceStrategy
**Purpose**: Encapsulate different recurrence calculation algorithms
**Benefits**: Easy to add new patterns (yearly, custom), swap at runtime

### 6. State Pattern
**Interface**: IInvitationState
**Implementations**: PendingInvitationState, AcceptedInvitationState, DeclinedInvitationState, TentativeInvitationState
**Purpose**: Manage invitation behavior based on current status
**Benefits**: Eliminates complex conditionals, clear state transitions

## Key Statistics

- **Total Classes**: 50+
- **Models**: 11 core domain models
- **Services**: 7 service classes
- **Repositories**: 7 + 1 interface
- **Design Patterns**: 6 patterns
- **Strategy Implementations**: 3
- **Observer Implementations**: 3
- **State Implementations**: 4
- **Enums**: 5

## Relationship Summary

| Relationship Type | Count | Usage |
|------------------|-------|-------|
| Composition (*--) | 2 | Strong ownership |
| Aggregation (o--) | 2 | Weak ownership |
| Association (-->) | 20+ | References |
| Dependency (..>) | 15+ | Usage/Creation |
| Implementation (..\|>) | 17 | Interface implementation |

