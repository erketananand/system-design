import { Item } from '../models/Item';
import { ItemRepository } from '../repositories/ItemRepository';
import { Logger } from '../utils/Logger';

export class ItemService {
  constructor(private itemRepository: ItemRepository) {}

  public createItem(
    name: string,
    attributes?: Map<string, string>,
    tags?: string[]
  ): Item {
    const item = new Item(name, attributes, tags);
    this.itemRepository.save(item);
    Logger.success(`Item created: ${item.id} - ${item.name}`);
    return item;
  }

  public getItemById(id: string): Item | undefined {
    return this.itemRepository.findById(id);
  }

  public getAllItems(): Item[] {
    return this.itemRepository.findAll();
  }

  public addTagToItem(itemId: string, tag: string): void {
    const item = this.itemRepository.findById(itemId);
    if (!item) {
      throw new Error(`Item not found: ${itemId}`);
    }

    item.addTag(tag);
    this.itemRepository.save(item);
    Logger.success(`Tag added to item ${itemId}: ${tag}`);
  }

  public removeTagFromItem(itemId: string, tag: string): boolean {
    const item = this.itemRepository.findById(itemId);
    if (!item) {
      throw new Error(`Item not found: ${itemId}`);
    }

    const result = item.removeTag(tag);
    if (result) {
      this.itemRepository.save(item);
      Logger.success(`Tag removed from item ${itemId}: ${tag}`);
    }
    return result;
  }

  public updateItemAttributes(id: string, attributes: Map<string, string>): void {
    const item = this.itemRepository.findById(id);
    if (!item) {
      throw new Error(`Item not found: ${id}`);
    }

    item.updateAttributes(attributes);
    this.itemRepository.save(item);
    Logger.success(`Item attributes updated: ${id}`);
  }

  public deleteItem(id: string): boolean {
    const result = this.itemRepository.delete(id);
    if (result) {
      Logger.success(`Item deleted: ${id}`);
    } else {
      Logger.warn(`Item not found for deletion: ${id}`);
    }
    return result;
  }

  public findItemsByTag(tag: string): Item[] {
    return this.itemRepository.findByTag(tag);
  }

  public findItemsByAttribute(key: string, value: string): Item[] {
    return this.itemRepository.findByAttribute(key, value);
  }

  public getItemCount(): number {
    return this.itemRepository.count();
  }
}