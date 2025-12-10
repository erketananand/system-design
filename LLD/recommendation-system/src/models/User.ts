import { IdGenerator } from '../utils/IdGenerator';

export class User {
  public readonly id: string;
  public name: string;
  public attributes: Map<string, string>;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(name: string, attributes?: Map<string, string>, id?: string) {
    this.id = id || IdGenerator.generateUUID();
    this.name = name;
    this.attributes = attributes || new Map<string, string>();
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  public updateAttributes(attributes: Map<string, string>): void {
    attributes.forEach((value, key) => {
      this.attributes.set(key, value);
    });
    this.update();
  }

  public getAttribute(key: string): string | undefined {
    return this.attributes.get(key);
  }

  public setAttribute(key: string, value: string): void {
    this.attributes.set(key, value);
    this.update();
  }

  public removeAttribute(key: string): boolean {
    const result = this.attributes.delete(key);
    if (result) {
      this.update();
    }
    return result;
  }

  public update(): void {
    this.updatedAt = new Date();
  }

  public isValid(): boolean {
    return this.name !== null && this.name.trim().length > 0;
  }

  public getAttributeCount(): number {
    return this.attributes.size;
  }
}