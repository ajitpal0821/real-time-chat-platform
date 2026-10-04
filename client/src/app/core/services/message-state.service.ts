import { Injectable, signal } from '@angular/core';
import { Message } from '../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class MessageStateService {

  constructor() { }

  private readonly messageState = signal<Message[]>([]);
  readonly message = this.messageState.asReadonly();

  setMessages(messages: Message[]): void {
    this.messageState.set(messages)
  };
  prependMessages(messages: Message[]): void {
    this.messageState.update(current => [
      ...messages,
      ...current
    ]);
  }

  addMessage(message: Message): void {
    this.messageState.update((m) => [...m, message])
  };

  updateMessage(message: Message): void {
    this.messageState.update((m) => m.map((msg) => msg._id === message._id ? message : msg))
  };

  removeMessage(messageId: string): void {
    this.messageState.update((m) => m.filter((msg) => msg._id !== messageId))
  };

  clearMessage(): void {
    this.messageState.set([])
  };
}
