# Concurrency-Safe Seat Locking Mechanism

## Overview
The IRCTC system implements a robust seat locking mechanism to prevent double booking in concurrent scenarios. This is critical for handling multiple simultaneous booking requests for the same seats.

## Problem Statement
Without proper concurrency control:
```
Time    User A                  User B
T1      Check seat available    -
T2      -                       Check seat available
T3      Book seat               -
T4      -                       Book seat  ❌ DOUBLE BOOKING!
```

## Solution: Pessimistic Locking with Timeout

### Architecture Components

#### 1. **SeatLockManager (Singleton)**
Central lock manager that prevents race conditions:

```typescript
class SeatLockManager {
  private locks: Map<string, SeatLock>  // key: "seatId:date"
  private LOCK_TIMEOUT_MS = 10 * 60 * 1000  // 10 minutes
  
  tryLock(seatId, date, bookingId): boolean
  releaseLock(seatId, date, bookingId): boolean
  isLocked(seatId, date): boolean
}
```

**Key Features:**
- **Singleton Pattern**: Ensures single source of truth for all locks
- **Timeout Mechanism**: Automatically releases stale locks after 10 minutes
- **Atomic Operations**: Lock acquisition is atomic (check-and-set)
- **Cleanup Job**: Background process removes expired locks every minute

#### 2. **Enhanced Seat Model**
Seats now integrate with the lock manager:

```typescript
class Seat {
  tryLock(date, bookingId): boolean {
    // 1. Check if already booked
    // 2. Try to acquire lock via SeatLockManager
    return lockManager.tryLock(this.id, date, bookingId)
  }
  
  book(date, bookingId): boolean {
    // 1. Verify lock is held by this booking
    // 2. Book the seat
    // 3. Release the lock
  }
  
  isAvailableOn(date): boolean {
    // Returns false if booked OR locked
    return !booked && !locked
  }
}
```

#### 3. **Updated Allocation Strategies**
Both `BerthPreferenceStrategy` and `AutomaticAllocationStrategy` now:

1. **Lock Phase**: Acquire locks on all required seats
2. **Validation Phase**: Ensure all passengers can be accommodated
3. **Booking Phase**: Confirm bookings if all locks acquired
4. **Rollback**: Release all locks if any seat unavailable

```typescript
allocateSeats(train, passengers, coachType, date) {
  const lockedSeats = []
  const tempBookingId = `temp-${Date.now()}`
  
  try {
    // Phase 1: Try to lock all seats
    for (passenger of passengers) {
      if (seat.tryLock(dateKey, tempBookingId)) {
        lockedSeats.push({ seat, dateKey })
      } else {
        // Cannot lock, rollback everything
        releaseAllLocks(lockedSeats, tempBookingId)
        return { success: false }
      }
    }
    
    // Phase 2: All locks acquired, book them
    for ({ seat, dateKey } of lockedSeats) {
      seat.book(dateKey, tempBookingId)
    }
    
    return { success: true }
    
  } catch (error) {
    // On any error, release all locks
    releaseAllLocks(lockedSeats, tempBookingId)
    throw error
  }
}
```

## Concurrency Flow

### Scenario: Two Users Booking Same Seat Simultaneously

```
Time    User A (Booking-123)              User B (Booking-456)
───────────────────────────────────────────────────────────────────
T1      Check seat S1 available           -
        (Not booked, Not locked ✓)
        
T2      tryLock(S1, "2024-01-01", "123")  -
        ✓ Lock acquired
        
T3      -                                 Check seat S1 available
                                          (Not booked, But LOCKED ✗)
                                          
T4      -                                 tryLock(S1, "2024-01-01", "456")
                                          ✗ Lock held by Booking-123
                                          
T5      -                                 Find alternative seat S2
                                          tryLock(S2, "2024-01-01", "456")
                                          ✓ Lock acquired
                                          
T6      book(S1, "2024-01-01", "123")     -
        ✓ Booking confirmed
        Lock auto-released
        
T7      -                                 book(S2, "2024-01-01", "456")
                                          ✓ Booking confirmed
                                          Lock auto-released
```

**Result**: ✅ No double booking! User B gets different seat.

### Scenario: Lock Timeout (Abandoned Booking)

```
Time    User A (Booking-789)              System
───────────────────────────────────────────────────────────────────
T1      tryLock(S1, "2024-01-01", "789")  -
        ✓ Lock acquired
        expiresAt = T1 + 10 minutes
        
T2-T10  User abandons booking process     -
        (Never calls book())
        
T11     -                                 Cleanup job runs
        (10 minutes elapsed)              Lock expired, removed
                                          
T12     User B arrives                    -
        tryLock(S1, "2024-01-01", "999")
        ✓ Lock acquired (old lock gone)
```

**Result**: ✅ Seat becomes available again after timeout.

## Lock Lifecycle

```
┌─────────────┐
│   UNLOCKED  │ ◄─────────┐
└──────┬──────┘           │
       │                  │
       │ tryLock()        │ timeout (10 min)
       │                  │ OR releaseLock()
       ▼                  │
┌─────────────┐           │
│   LOCKED    │───────────┘
└──────┬──────┘
       │
       │ book()
       │
       ▼
┌─────────────┐
│   BOOKED    │ (permanent)
└─────────────┘
```

## Key Properties

### 1. **Atomicity**
Lock acquisition is atomic - either succeeds completely or fails:
```typescript
if (this.locks.has(lockKey)) {
  return false  // Already locked, operation fails atomically
}
this.locks.set(lockKey, lock)  // Atomic set operation
```

### 2. **Isolation**
Each booking process is isolated:
- Temporary booking IDs (`temp-${Date.now()}`)
- Locks tied to specific booking IDs
- Cannot release another booking's lock

### 3. **Consistency**
System maintains consistent state:
- Seat cannot be both available and locked
- Lock ownership verified before booking
- Automatic cleanup of expired locks

### 4. **Durability** (In-Memory Context)
While in-memory, locks are durable during system uptime:
- Singleton pattern ensures single lock registry
- Locks persist across multiple booking attempts
- Cleanup job maintains lock registry health

## Edge Cases Handled

### 1. Partial Allocation Failure
```typescript
// Booking 3 seats but only 2 available
tryLock(S1) ✓
tryLock(S2) ✓
tryLock(S3) ✗ (already locked)

// Rollback: Release S1 and S2
releaseAllLocks([S1, S2], bookingId)
```

### 2. System Error During Booking
```typescript
try {
  // Lock seats
  // Book seats
} catch (error) {
  // Automatic rollback in finally block
  releaseAllLocks(lockedSeats, bookingId)
  throw error
}
```

### 3. Lock Expiration Check
```typescript
isLocked(seatId, date): boolean {
  const lock = this.locks.get(key)
  
  if (lock && Date.now() > lock.expiresAt) {
    this.locks.delete(key)  // Auto-cleanup
    return false
  }
  
  return !!lock
}
```

### 4. Concurrent Lock Attempts
```typescript
// Map operations in JavaScript are atomic for single operations
// Two tryLock() calls will execute sequentially:

Thread A: this.locks.has(key) → false
Thread A: this.locks.set(key, lockA) → success ✓

Thread B: this.locks.has(key) → true
Thread B: returns false → lock denied ✗
```

## Performance Characteristics

### Time Complexity
- **Lock Acquisition**: O(1) - HashMap lookup and set
- **Lock Release**: O(1) - HashMap delete
- **Availability Check**: O(1) - HashMap lookup
- **Cleanup Job**: O(n) - where n = number of locks

### Space Complexity
- **Per Lock**: ~200 bytes (lockId, bookingId, timestamps)
- **10,000 concurrent locks**: ~2 MB memory
- **Cleanup**: Automatic removal of expired locks

### Throughput
- Single lock manager handles all operations
- No database round-trips (in-memory)
- Sub-millisecond lock operations
- Can handle thousands of concurrent bookings

## Monitoring & Observability

### Lock Statistics
```typescript
lockManager.getActiveLockCount()  // Current active locks
lockManager.getLockInfo(seatId, date)  // Lock details
```

### Logging
```
[LOCK] ✓ Acquired lock on seat S-123 for 2024-01-01 by booking temp-1234567890
[LOCK] ✗ Seat S-123 for 2024-01-01 is already locked by booking temp-0987654321
[LOCK] ✓ Released lock on seat S-123 for 2024-01-01
[LOCK] Cleaned up 15 expired locks
```

## Production Considerations

### For Real-World Deployment

1. **Distributed Locks**: Replace with Redis/DynamoDB for multi-server:
   ```typescript
   // Use Redis SETNX for distributed locking
   await redis.set(lockKey, bookingId, 'NX', 'EX', 600)
   ```

2. **Database Transactions**: Use pessimistic locking:
   ```sql
   SELECT * FROM seats 
   WHERE seat_id = ? AND date = ? 
   FOR UPDATE NOWAIT
   ```

3. **Optimistic Locking**: Version-based approach:
   ```typescript
   UPDATE bookings 
   SET seat_id = ?, version = version + 1 
   WHERE id = ? AND version = ?
   ```

4. **Queue-Based**: Serialize booking requests:
   ```
   User Request → Message Queue → Worker Pool → Process Sequentially
   ```

## Testing Concurrency

### Simulating Race Conditions
```typescript
// Test: 100 users booking same seat
const promises = []
for (let i = 0; i < 100; i++) {
  promises.push(bookingService.createBooking(/* same seat */))
}

const results = await Promise.all(promises)
const successful = results.filter(r => r.success)

expect(successful.length).toBe(1)  // Only 1 should succeed
```

## Summary

The seat locking mechanism ensures **no double booking** by:

1. ✅ **Atomic lock acquisition** - Check-and-set in single operation
2. ✅ **Lock verification** - Only lock holder can book
3. ✅ **Automatic rollback** - Failed allocations release all locks
4. ✅ **Timeout protection** - Stale locks don't block forever
5. ✅ **Isolation** - Each booking process is independent
6. ✅ **Cleanup** - Background job maintains system health

This provides **strong consistency** guarantees while maintaining high performance for concurrent booking scenarios.
