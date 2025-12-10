import { Interaction } from '../models/Interaction';
import { InteractionType } from '../enums/InteractionType';
import { InteractionRepository } from '../repositories/InteractionRepository';
import { InteractionFactory } from '../factories/InteractionFactory';
import { IInteractionObserver } from '../observers/IInteractionObserver';
import { Logger } from '../utils/Logger';

export class InteractionService {
  private observers: IInteractionObserver[] = [];

  constructor(private interactionRepository: InteractionRepository) {}

  public recordInteraction(
    userId: string,
    itemId: string,
    type: InteractionType,
    weight?: number,
    metadata?: Map<string, string>
  ): Interaction {
    const interaction = InteractionFactory.create(userId, itemId, type, weight, metadata);
    this.interactionRepository.save(interaction);

    Logger.success(
      `Interaction recorded: ${type} by user ${userId} on item ${itemId}`
    );

    // Notify observers
    this.notifyObservers(interaction);

    return interaction;
  }

  public getInteractionsByUser(userId: string): Interaction[] {
    return this.interactionRepository.findByUserId(userId);
  }

  public getInteractionsByItem(itemId: string): Interaction[] {
    return this.interactionRepository.findByItemId(itemId);
  }

  public getInteractionsByUserAndItem(userId: string, itemId: string): Interaction[] {
    return this.interactionRepository.findByUserAndItem(userId, itemId);
  }

  public getPositiveInteractions(userId: string): Interaction[] {
    return this.interactionRepository.findPositiveInteractions(userId);
  }

  public getNegativeInteractions(userId: string): Interaction[] {
    return this.interactionRepository.findNegativeInteractions(userId);
  }

  public getInteractionCount(): number {
    return this.interactionRepository.count();
  }

  // Observer pattern methods
  public addObserver(observer: IInteractionObserver): void {
    this.observers.push(observer);
    Logger.debug(`Observer added: ${observer.constructor.name}`);
  }

  public removeObserver(observer: IInteractionObserver): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
      Logger.debug(`Observer removed: ${observer.constructor.name}`);
    }
  }

  private notifyObservers(interaction: Interaction): void {
    this.observers.forEach(observer => {
      observer.onInteractionRecorded(interaction);
    });
  }
}