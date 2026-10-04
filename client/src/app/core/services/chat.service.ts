import { inject, Injectable } from '@angular/core';
import { SocketService } from './socket.service';
import { Observable } from 'rxjs';
import { Message } from '../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly socketService = inject(SocketService)
  constructor() { }

  joinRoom(roomId: string): Promise<any> {
    return this.socketService.emitWithAck('join_room', { roomId });
  }
  leaveRoom(roomId: string): Promise<any> {
    return this.socketService.emitWithAck('leave_room', { roomId })
  }

  onNewMessage(): Observable<Message> {
    return this.socketService.listen<Message>('new_message');
  }
  onMessageUpdated(): Observable<Message> {
    return this.socketService.listen<Message>('message_updated');
  }
  onMessageDeleted(): Observable<{ roomId: string; messageId: string }> {
    return this.socketService.listen<{ roomId: string; messageId: string }>('message_deleted');
  }
  sendMessage(roomId: string, content: string, messageType: string = 'text'): Promise<{ success: boolean; message: Message }> {
    return this.socketService.emitWithAck<{ success: boolean; message: Message }>('send_message', {
      roomId,
      content,
      messageType
    });
  }

  updateMessage(roomId: string, messageId: string, content: string): Promise<{ success: boolean; message: Message }> {
    return this.socketService.emitWithAck<{ success: boolean; message: Message }>('update_message', {
      roomId,
      messageId,
      content
    });
  }

  deleteMessage(roomId: string, messageId: string): Promise<{ success: boolean; messageId: string }> {
    return this.socketService.emitWithAck<{ success: boolean; messageId: string }>('delete_message', {
      roomId,
      messageId
    });
  }
  startTyping(roomId: string): void {
    this.socketService.emit('typing_start', { roomId });
  }

  stopTyping(roomId: string): void {
    this.socketService.emit('typing_stop', { roomId });
  }

  onUserTyping(): Observable<{ userId: string }> {
    return this.socketService.listen<{ userId: string }>('user_typing');
  }

  onUserStoppedTyping(): Observable<{ userId: string }> {
    return this.socketService.listen<{ userId: string }>('user_stopped_typing');
  }
  onUserStatusChanged(): Observable<{ userId: string; status: 'online' | 'offline' }> {
    return this.socketService.listen<{ userId: string; status: 'online' | 'offline' }>('user_status_changed');
  }

  getOnlineUsers(): Promise<{ success: boolean; onlineUserIds: string[] }> {
    return this.socketService.emitWithAck<{ success: boolean; onlineUserIds: string[] }>('get_online_users', {});
  }

}
