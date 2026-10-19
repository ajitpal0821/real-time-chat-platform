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
import { LeaveRoomDialogComponent } from '../leave-room-dialog/leave-room-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
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
  private readonly snackBar = inject(MatSnackBar);
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
    const dialogRef = this.dialog.open(LeaveRoomDialogComponent, {
      width: '440px',
      data: {
        name: room.name,
        isPrivate: room.isPrivate
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) {
        return;
      }

      this.roomService.leaveRoom(room._id).subscribe({
        next: () => {
          this.snackBar.open(`You left "${room.name}"`, 'Dismiss', {
            duration: 3000,
            panelClass: ['mat-snack-bar-primary']
          });
          this.chatState.removeRoom(room._id);
        },
        error: (err) => {
          console.error(err);
          const msg =
            err?.error?.response?.message ||
            err?.error?.message ||
            'Failed to leave room';
          this.snackBar.open(msg, 'Dismiss', {
            duration: 4000,
            panelClass: ['mat-snack-bar-error']
          });
        }
      });
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
