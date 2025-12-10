import { Offer } from '../models/Offer';
import { ChatMessage } from '../models/ChatMessage';
import { OfferRepository } from '../repositories/OfferRepository';
import { ChatThreadRepository } from '../repositories/ChatThreadRepository';
import { ChatMessageRepository } from '../repositories/ChatMessageRepository';
import { MessageType } from '../enums/MessageType';

export class OfferService {
  private offerRepo = new OfferRepository();
  private threadRepo = new ChatThreadRepository();
  private messageRepo = new ChatMessageRepository();

  public createOffer(
    threadId: string,
    listingId: string,
    offererId: string,
    amount: number,
    expiresAt?: Date
  ): Offer {
    const thread = this.threadRepo.findById(threadId);
    if (!thread) {
      throw new Error('Chat thread not found');
    }

    if (!thread.isParticipant(offererId)) {
      throw new Error('User is not a participant in this thread');
    }

    const offeredToId = thread.ownerId === offererId ? thread.seekerId : thread.ownerId;

    const offer = new Offer(threadId, listingId, offererId, offeredToId, amount, expiresAt || null);
    this.offerRepo.save(offer);

    // Create system message
    const message = new ChatMessage(
      threadId,
      offererId,
      `Offer made: ₹${amount}`,
      MessageType.OFFER_PROPOSAL
    );
    this.messageRepo.save(message);

    // Update thread activity
    thread.updateActivity();
    this.threadRepo.save(thread);

    return offer;
  }

  public acceptOffer(offerId: string, userId: string): void {
    const offer = this.offerRepo.findById(offerId);
    if (!offer) {
      throw new Error('Offer not found');
    }

    const thread = this.threadRepo.findById(offer.threadId);
    if (!thread || !thread.isParticipant(userId)) {
      throw new Error('User not authorized');
    }

    if (offer.offeredToId !== userId) {
      throw new Error('Only the recipient can accept this offer');
    }

    offer.accept();
    this.offerRepo.save(offer);

    // Create system message
    const message = new ChatMessage(
      offer.threadId,
      userId,
      `Offer accepted: ₹${offer.amount}`,
      MessageType.SYSTEM
    );
    this.messageRepo.save(message);
  }

  public rejectOffer(offerId: string, userId: string): void {
    const offer = this.offerRepo.findById(offerId);
    if (!offer) {
      throw new Error('Offer not found');
    }

    const thread = this.threadRepo.findById(offer.threadId);
    if (!thread || !thread.isParticipant(userId)) {
      throw new Error('User not authorized');
    }

    if (offer.offeredToId !== userId) {
      throw new Error('Only the recipient can reject this offer');
    }

    offer.reject();
    this.offerRepo.save(offer);

    // Create system message
    const message = new ChatMessage(
      offer.threadId,
      userId,
      'Offer rejected',
      MessageType.SYSTEM
    );
    this.messageRepo.save(message);
  }

  public counterOffer(offerId: string, userId: string, newAmount: number): Offer {
    const originalOffer = this.offerRepo.findById(offerId);
    if (!originalOffer) {
      throw new Error('Offer not found');
    }

    const thread = this.threadRepo.findById(originalOffer.threadId);
    if (!thread || !thread.isParticipant(userId)) {
      throw new Error('User not authorized');
    }

    if (originalOffer.offeredToId !== userId) {
      throw new Error('Only the recipient can counter this offer');
    }

    // Create counter offer
    const counterOffer = new Offer(
      originalOffer.threadId,
      originalOffer.listingId,
      userId,
      originalOffer.offeredById,
      newAmount,
      null
    );
    this.offerRepo.save(counterOffer);

    // Mark original offer as countered
    originalOffer.markCountered(counterOffer.id);
    this.offerRepo.save(originalOffer);

    // Create system message
    const message = new ChatMessage(
      originalOffer.threadId,
      userId,
      `Counter offer: ₹${newAmount}`,
      MessageType.OFFER_PROPOSAL
    );
    this.messageRepo.save(message);

    return counterOffer;
  }

  public getListingOffers(listingId: string): Offer[] {
    return this.offerRepo.findByListing(listingId);
  }

  public getThreadOffers(threadId: string): Offer[] {
    return this.offerRepo.findByThread(threadId);
  }

  public expireOldOffers(): void {
    const expiredOffers = this.offerRepo.findExpiredOffers();
    expiredOffers.forEach(offer => {
      offer.expire();
      this.offerRepo.save(offer);
    });
  }
}
