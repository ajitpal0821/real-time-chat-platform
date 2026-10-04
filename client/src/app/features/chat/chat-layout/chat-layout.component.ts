import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatWindowComponent } from '../chat-window/chat-window.component';
import { RoomListComponent } from '../room-list/room-list.component';
import { ChatStateServiceService } from '../../../core/services/chat-state-service.service';
import { ChatService } from '../../../core/services/chat.service';

@Component({
  selector: 'app-chat-layout',
  standalone: true,
  imports: [RouterOutlet, ChatWindowComponent, RoomListComponent],
  templateUrl: './chat-layout.component.html',
  styleUrl: './chat-layout.component.scss'
})
export class ChatLayoutComponent {
  private readonly chatState = inject(ChatStateServiceService);
  private readonly chatService = inject(ChatService);

  private previousRoomId: string | null = null;


  private readonly roomSyncEffect = effect(() => {
    const room = this.chatState.selectedRoom();
    if (!room) {
      return;
    }

    const currentRoomId = room ? (room._id || room.roomId) : null;

    if (this.previousRoomId && this.previousRoomId !== currentRoomId) {
      this.chatService.leaveRoom(this.previousRoomId).then(() => console.log("Left socket room: ", this.previousRoomId)).catch(err => {
        console.error("Failed to leave old room", err);
      })
    }

    if (currentRoomId && currentRoomId !== this.previousRoomId) {
      this.chatService.joinRoom(currentRoomId)
        .then(() => console.log('Joined socket room:', currentRoomId))
        .catch((err) => console.error('Failed to join room:', err));
    }
    this.previousRoomId = currentRoomId;

  });

  ngOnInit() {
    this.chatService.getOnlineUsers().then(res => {
      if (res?.onlineUserIds) {
        this.chatState.setOnlineUsers(res.onlineUserIds);
      }
    }).catch(err => console.warn('Could not fetch online users'));


    this.chatService.onUserStatusChanged().subscribe(({ userId, status }) => {
      if (status === 'online') {
        this.chatState.setUserOnline(userId);
      }
      else {
        this.chatState.setUserOffline(userId);
      }
    })
  }

  ngOnDestroy(): void {
    // Clean up when navigating away from chat
    if (this.previousRoomId) {
      this.chatService.leaveRoom(this.previousRoomId).catch(() => { });
    }
    this.roomSyncEffect.destroy();
  }
}
