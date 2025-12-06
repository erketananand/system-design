/**
 * SeatLockManager.ts
 * Manages seat locks to prevent double booking in concurrent scenarios
 * Singleton pattern ensures centralized lock management
 */

interface SeatLock {
  seatId: string;
  bookingId: string;
  date: string;
  lockedAt: Date;
  expiresAt: Date;
}

export class SeatLockManager {
  private static instance: SeatLockManager;
  private locks: Map<string, SeatLock> = new Map(); // key: seatId-date
  private readonly LOCK_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

  private constructor() {
    // Start cleanup job to remove expired locks
    this.startCleanupJob();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SeatLockManager {
    if (!SeatLockManager.instance) {
      SeatLockManager.instance = new SeatLockManager();
    }
    return SeatLockManager.instance;
  }

  /**
   * Try to acquire lock on a seat for booking
   * Returns true if lock acquired, false if already locked
   */
  public tryLock(seatId: string, date: string, bookingId: string): boolean {
    const lockKey = this.getLockKey(seatId, date);
    
    // Check if already locked
    const existingLock = this.locks.get(lockKey);
    
    if (existingLock) {
      // Check if lock has expired
      if (new Date() > existingLock.expiresAt) {
        // Lock expired, remove it and proceed
        this.locks.delete(lockKey);
      } else {
        // Lock is still valid and held by another booking
        console.log(`[LOCK] Seat ${seatId} for ${date} is already locked by booking ${existingLock.bookingId}`);
        return false;
      }
    }

    // Acquire lock
    const now = new Date();
    const lock: SeatLock = {
      seatId,
      bookingId,
      date,
      lockedAt: now,
      expiresAt: new Date(now.getTime() + this.LOCK_TIMEOUT_MS)
    };

    this.locks.set(lockKey, lock);
    console.log(`[LOCK] ✓ Acquired lock on seat ${seatId} for ${date} by booking ${bookingId}`);
    return true;
  }

  /**
   * Release lock on a seat
   */
  public releaseLock(seatId: string, date: string, bookingId: string): boolean {
    const lockKey = this.getLockKey(seatId, date);
    const existingLock = this.locks.get(lockKey);

    if (!existingLock) {
      console.log(`[LOCK] No lock found for seat ${seatId} on ${date}`);
      return false;
    }

    // Verify the booking ID matches
    if (existingLock.bookingId !== bookingId) {
      console.log(`[LOCK] ✗ Cannot release lock: booking ID mismatch`);
      return false;
    }

    this.locks.delete(lockKey);
    console.log(`[LOCK] ✓ Released lock on seat ${seatId} for ${date}`);
    return true;
  }

  /**
   * Check if a seat is locked
   */
  public isLocked(seatId: string, date: string): boolean {
    const lockKey = this.getLockKey(seatId, date);
    const lock = this.locks.get(lockKey);

    if (!lock) {
      return false;
    }

    // Check if lock has expired
    if (new Date() > lock.expiresAt) {
      this.locks.delete(lockKey);
      return false;
    }

    return true;
  }

  /**
   * Get lock information
   */
  public getLockInfo(seatId: string, date: string): SeatLock | null {
    const lockKey = this.getLockKey(seatId, date);
    return this.locks.get(lockKey) || null;
  }

  /**
   * Extend lock expiration time
   */
  public extendLock(seatId: string, date: string, bookingId: string): boolean {
    const lockKey = this.getLockKey(seatId, date);
    const lock = this.locks.get(lockKey);

    if (!lock || lock.bookingId !== bookingId) {
      return false;
    }

    lock.expiresAt = new Date(Date.now() + this.LOCK_TIMEOUT_MS);
    console.log(`[LOCK] ✓ Extended lock on seat ${seatId} for ${date}`);
    return true;
  }

  /**
   * Release all locks for a booking
   */
  public releaseAllLocksForBooking(bookingId: string): number {
    let releasedCount = 0;
    
    for (const [key, lock] of this.locks.entries()) {
      if (lock.bookingId === bookingId) {
        this.locks.delete(key);
        releasedCount++;
      }
    }

    if (releasedCount > 0) {
      console.log(`[LOCK] ✓ Released ${releasedCount} locks for booking ${bookingId}`);
    }

    return releasedCount;
  }

  /**
   * Clean up expired locks
   */
  private cleanupExpiredLocks(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [key, lock] of this.locks.entries()) {
      if (now > lock.expiresAt) {
        this.locks.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[LOCK] Cleaned up ${cleanedCount} expired locks`);
    }
  }

  /**
   * Start periodic cleanup job
   */
  private startCleanupJob(): void {
    setInterval(() => {
      this.cleanupExpiredLocks();
    }, 60000); // Run every minute
  }

  /**
   * Get lock key from seat ID and date
   */
  private getLockKey(seatId: string, date: string): string {
    return `${seatId}:${date}`;
  }

  /**
   * Get total active locks
   */
  public getActiveLockCount(): number {
    this.cleanupExpiredLocks();
    return this.locks.size;
  }

  /**
   * Clear all locks (for testing)
   */
  public clearAllLocks(): void {
    this.locks.clear();
    console.log('[LOCK] All locks cleared');
  }
}
