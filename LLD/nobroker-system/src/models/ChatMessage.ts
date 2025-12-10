import { IdGenerator } from '../utils/IdGenerator';
import { MessageType } from '../enums/MessageType';

export class ChatMessage {
  public readonly id: string;
  public threadId: string;
  public senderId: string;
  public content: string;
  public messageType: MessageType;
  public readonly createdAt: Date;

  constructor(
    threadId: string,
    senderId: string,
    content: string,
    messageType: MessageType = MessageType.TEXT,
    id?: string
  ) {
    this.id = id || IdGenerator.generateMessageId();
    this.threadId = threadId;
    this.senderId = senderId;
    this.content = content;
    this.messageType = messageType;
    this.createdAt = new Date();
  }

  public isSystemMessage(): boolean {
    return this.messageType === MessageType.SYSTEM;
  }

  public isTextMessage(): boolean {
    return this.messageType === MessageType.TEXT;
  }

  public isVisitProposal(): boolean {
    return this.messageType === MessageType.VISIT_PROPOSAL;
  }

  public isOfferProposal(): boolean {
    return this.messageType === MessageType.OFFER_PROPOSAL;
  }
}
