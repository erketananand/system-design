import { Review } from '../models/Review';
import { ReviewRepository } from '../repositories/ReviewRepository';
import { UserRepository } from '../repositories/UserRepository';
import { PropertyRepository } from '../repositories/PropertyRepository';

export interface ReviewInput {
  reviewerId: string;
  rating: number;
  title: string;
  comment: string;
  revieweeUserId?: string;
  propertyId?: string;
}

export class ReviewService {
  private reviewRepo = new ReviewRepository();
  private userRepo = new UserRepository();
  private propertyRepo = new PropertyRepository();

  public createReview(input: ReviewInput): Review {
    // Verify reviewer exists
    if (!this.userRepo.exists(input.reviewerId)) {
      throw new Error('Reviewer not found');
    }

    // Verify reviewee or property exists
    if (input.revieweeUserId && !this.userRepo.exists(input.revieweeUserId)) {
      throw new Error('Reviewee user not found');
    }

    if (input.propertyId && !this.propertyRepo.exists(input.propertyId)) {
      throw new Error('Property not found');
    }

    const review = new Review(
      input.reviewerId,
      input.rating,
      input.title,
      input.comment,
      input.revieweeUserId || null,
      input.propertyId || null
    );

    return this.reviewRepo.save(review);
  }

  public flagReview(reviewId: string): void {
    const review = this.reviewRepo.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    review.flag();
    this.reviewRepo.save(review);
  }

  public unflagReview(reviewId: string): void {
    const review = this.reviewRepo.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    review.unflag();
    this.reviewRepo.save(review);
  }

  public getPropertyReviews(propertyId: string): Review[] {
    return this.reviewRepo.findByProperty(propertyId);
  }

  public getUserReviews(userId: string): Review[] {
    return this.reviewRepo.findByRevieweeUser(userId);
  }

  public getAveragePropertyRating(propertyId: string): number {
    return this.reviewRepo.getAverageRatingForProperty(propertyId);
  }

  public getAverageUserRating(userId: string): number {
    return this.reviewRepo.getAverageRatingForUser(userId);
  }

  public getFlaggedReviews(): Review[] {
    return this.reviewRepo.findFlaggedReviews();
  }
}
