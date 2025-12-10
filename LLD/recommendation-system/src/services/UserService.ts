import { User } from '../models/User';
import { UserRepository } from '../repositories/UserRepository';
import { Logger } from '../utils/Logger';

export class UserService {
  constructor(private userRepository: UserRepository) {}

  public createUser(name: string, attributes?: Map<string, string>): User {
    const user = new User(name, attributes);
    this.userRepository.save(user);
    Logger.success(`User created: ${user.id} - ${user.name}`);
    return user;
  }

  public getUserById(id: string): User | undefined {
    return this.userRepository.findById(id);
  }

  public getAllUsers(): User[] {
    return this.userRepository.findAll();
  }

  public updateUserAttributes(id: string, attributes: Map<string, string>): void {
    const user = this.userRepository.findById(id);
    if (!user) {
      throw new Error(`User not found: ${id}`);
    }

    user.updateAttributes(attributes);
    this.userRepository.save(user);
    Logger.success(`User attributes updated: ${id}`);
  }

  public deleteUser(id: string): boolean {
    const result = this.userRepository.delete(id);
    if (result) {
      Logger.success(`User deleted: ${id}`);
    } else {
      Logger.warn(`User not found for deletion: ${id}`);
    }
    return result;
  }

  public findUsersByAttribute(key: string, value: string): User[] {
    return this.userRepository.findByAttribute(key, value);
  }

  public getUserCount(): number {
    return this.userRepository.count();
  }
}