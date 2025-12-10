import { IRepository } from './IRepository';
import { Review } from '../models/Review';
import { InMemoryDatabase } from '../database/InMemoryDatabase';

export class ReviewRepository implements IRepository<Review> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): Review | undefined {
    return this.db.reviews.get(id);
  }

  public findAll(): Review[] {
    return Array.from(this.db.reviews.values());
  }

  public save(entity: Review): Review {
    this.db.reviews.set(entity.id, entity);
    return entity;
  }

  public delete(id: string): boolean {
    return this.db.reviews.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.reviews.has(id);
  }

  public count(): number {
    return this.db.reviews.size;
  }

  public clear(): void {
    this.db.reviews.clear();
  }

  // Custom query methods
  public findByProperty(propertyId: string): Review[] {
    return Array.from(this.db.reviews.values()).filter(r => r.propertyId === propertyId);
  }

  public findByReviewer(reviewerId: string): Review[] {
    return Array.from(this.db.reviews.values()).filter(r => r.reviewerId === reviewerId);
  }

  public findByRevieweeUser(userId: string): Review[] {
    return Array.from(this.db.reviews.values()).filter(r => r.revieweeUserId === userId);
  }

  public findFlaggedReviews(): Review[] {
    return Array.from(this.db.reviews.values()).filter(r => r.flagged);
  }

  public findPropertyReviews(): Review[] {
    return Array.from(this.db.reviews.values()).filter(r => r.propertyId !== null);
  }

  public findUserReviews(): Review[] {
    return Array.from(this.db.reviews.values()).filter(r => r.revieweeUserId !== null);
  }

  public getAverageRatingForProperty(propertyId: string): number {
    const reviews = this.findByProperty(propertyId);
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / reviews.length;
  }

  public getAverageRatingForUser(userId: string): number {
    const reviews = this.findByRevieweeUser(userId);
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / reviews.length;
  }
}
