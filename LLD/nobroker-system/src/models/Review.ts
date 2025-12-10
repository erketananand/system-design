import { IdGenerator } from '../utils/IdGenerator';

export class Review {
  public readonly id: string;
  public reviewerId: string;
  public revieweeUserId: string | null;
  public propertyId: string | null;
  public rating: number;
  public title: string;
  public comment: string;
  public flagged: boolean;
  public readonly createdAt: Date;

  constructor(
    reviewerId: string,
    rating: number,
    title: string,
    comment: string,
    revieweeUserId: string | null = null,
    propertyId: string | null = null,
    id?: string
  ) {
    if (revieweeUserId === null && propertyId === null) {
      throw new Error('Either revieweeUserId or propertyId must be provided');
    }

    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    this.id = id || IdGenerator.generateReviewId();
    this.reviewerId = reviewerId;
    this.revieweeUserId = revieweeUserId;
    this.propertyId = propertyId;
    this.rating = rating;
    this.title = title;
    this.comment = comment;
    this.flagged = false;
    this.createdAt = new Date();
  }

  public flag(): void {
    this.flagged = true;
  }

  public unflag(): void {
    this.flagged = false;
  }

  public isPropertyReview(): boolean {
    return this.propertyId !== null;
  }

  public isUserReview(): boolean {
    return this.revieweeUserId !== null;
  }
}
