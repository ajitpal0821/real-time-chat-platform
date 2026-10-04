import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MessageInputComponent } from '../message-input/message-input.component';
import { MessageListComponent } from '../message-list/message-list.component';
import { ChatStateServiceService } from '../../../core/services/chat-state-service.service';
import { RoomService } from '../../../core/services/room.service';
import { Room } from '../../../core/models/room.model';
import { MatDialog } from '@angular/material/dialog';
import { RoomMembersDialogComponent } from '../room-members-dialog/room-members-dialog.component';
import { TokenService } from '../../../core/services/token.service';
import { ChatService } from '../../../core/services/chat.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MessageInputComponent,
    MessageListComponent
  ],
  templateUrl: './chat-window.component.html',
  styleUrl: './chat-window.component.scss'
})
export class ChatWindowComponent {
  readonly chatState = inject(ChatStateServiceService);
  readonly roomService = inject(RoomService);
  private readonly dialog = inject(MatDialog);
  private readonly tokenService = inject(TokenService);
  private readonly chatService = inject(ChatService);
  private subs = new Subscription();

  ngOnInit(): void {
    const myId = this.tokenService.getUser()?._id || this.tokenService.getUser()?.id;
    this.subs.add(this.chatService.onUserTyping().subscribe(({ userId }) => {
      if (userId !== myId) this.chatState.addTypingUser(userId);
    }));
    this.subs.add(this.chatService.onUserStoppedTyping().subscribe(({ userId }) => {
      this.chatState.removeTypingUser(userId);
    }));
  }


  leaveRoom(room: Room): void {
    const confirmed = confirm(`Are you sure you want to leave ${room.name}`)
    if (!confirmed) {
      return;
    }
    this.roomService.leaveRoom(room._id).subscribe({
      next: () => {
        this.chatState.removeRoom(room._id);
      },
      error: (err) => {
        console.error(err);
        window.alert(
          err?.error?.response?.message ||
          err?.error?.message ||
          'Failed to leave room'
        );
      }
    });
  }

  showMembers(room: Room): void {

    this.dialog.open(
      RoomMembersDialogComponent,
      {
        width: '450px',
        data: room._id
      }
    );
  }
  ngOnDestroy(): void { this.subs.unsubscribe(); }
}
