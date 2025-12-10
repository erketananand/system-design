import { IRepository } from './IRepository';
import { Interaction } from '../models/Interaction';
import { InteractionType } from '../enums/InteractionType';
import { InMemoryDatabase } from '../database/InMemoryDatabase';

export class InteractionRepository implements IRepository<Interaction> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): Interaction | undefined {
    return this.db.interactions.get(id);
  }

  public findAll(): Interaction[] {
    return Array.from(this.db.interactions.values());
  }

  public save(interaction: Interaction): Interaction {
    this.db.interactions.set(interaction.id, interaction);
    return interaction;
  }

  public delete(id: string): boolean {
    return this.db.interactions.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.interactions.has(id);
  }

  public count(): number {
    return this.db.interactions.size;
  }

  public clear(): void {
    this.db.interactions.clear();
  }

  // Custom query methods
  public findByUserId(userId: string): Interaction[] {
    return Array.from(this.db.interactions.values()).filter(
      interaction => interaction.userId === userId
    );
  }

  public findByItemId(itemId: string): Interaction[] {
    return Array.from(this.db.interactions.values()).filter(
      interaction => interaction.itemId === itemId
    );
  }

  public findByUserAndItem(userId: string, itemId: string): Interaction[] {
    return Array.from(this.db.interactions.values()).filter(
      interaction => interaction.userId === userId && interaction.itemId === itemId
    );
  }

  public findByType(type: InteractionType): Interaction[] {
    return Array.from(this.db.interactions.values()).filter(
      interaction => interaction.type === type
    );
  }

  public findByUserIdAndType(userId: string, type: InteractionType): Interaction[] {
    return Array.from(this.db.interactions.values()).filter(
      interaction => interaction.userId === userId && interaction.type === type
    );
  }

  public findPositiveInteractions(userId: string): Interaction[] {
    return Array.from(this.db.interactions.values()).filter(
      interaction => interaction.userId === userId && interaction.isPositive()
    );
  }

  public findNegativeInteractions(userId: string): Interaction[] {
    return Array.from(this.db.interactions.values()).filter(
      interaction => interaction.userId === userId && interaction.isNegative()
    );
  }

  public getUniqueUserIds(): string[] {
    const userIds = new Set<string>();
    this.db.interactions.forEach(interaction => {
      userIds.add(interaction.userId);
    });
    return Array.from(userIds);
  }

  public getUniqueItemIds(): string[] {
    const itemIds = new Set<string>();
    this.db.interactions.forEach(interaction => {
      itemIds.add(interaction.itemId);
    });
    return Array.from(itemIds);
  }
}