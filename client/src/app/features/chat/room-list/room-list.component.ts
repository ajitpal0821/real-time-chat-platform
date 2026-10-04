import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RoomService } from '../../../core/services/room.service';
import { Room } from '../../../core/models/room.model';
import { ChatStateServiceService } from '../../../core/services/chat-state-service.service';
import { CreateRoomDialogComponent } from '../create-room-dialog/create-room-dialog.component';
import { JoinRoomDialogComponent } from '../join-room-dialog/join-room-dialog.component';

@Component({
  selector: 'app-room-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    CreateRoomDialogComponent,
    JoinRoomDialogComponent
  ],
  templateUrl: './room-list.component.html',
  styleUrl: './room-list.component.scss'
})
export class RoomListComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly roomService = inject(RoomService);
  readonly chatState = inject(ChatStateServiceService);
  private readonly snackBar = inject(MatSnackBar);

  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadRooms();
  }

  loadRooms(selectRoomIdOnLoad?: string): void {
    this.loading = this.chatState.rooms().length === 0;

    this.roomService.getRooms().subscribe({
      next: (rooms) => {
        const roomList = rooms || [];
        this.chatState.setRooms(roomList);
        this.errorMessage = '';

        if (selectRoomIdOnLoad) {
          const target = roomList.find(
            (r) => r.roomId === selectRoomIdOnLoad || r._id === selectRoomIdOnLoad
          );
          if (target) {
            this.selectRoom(target);
          }
        }
      },
      error: (error) => {
        const msg =
          error?.error?.response?.message ||
          error?.error?.message ||
          'Unable to load channels';
        if (this.chatState.rooms().length === 0) {
          this.errorMessage = msg;
        } else {
          this.showErrorSnackBar(msg);
        }
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  selectRoom(room: Room): void {
    this.chatState.selectRoom(room);
  }

  isRoomSelected(room: Room): boolean {
    const selected = this.chatState.selectedRoom();
    if (!selected || !room) {
      return false;
    }
    if (selected._id && room._id) {
      return selected._id === room._id;
    }
    if (selected.roomId && room.roomId) {
      return selected.roomId === room.roomId;
    }
    return false;
  }

  openCreateRoomDialog(): void {
    const dialogRef = this.dialog.open(CreateRoomDialogComponent, {
      width: '450px'
    });

    dialogRef.afterClosed().subscribe((data) => {
      if (!data?.name) {
        return;
      }
      this.createRoom(data.name);
    });
  }

  openJoinRoomDialog(): void {
    const dialogRef = this.dialog.open(JoinRoomDialogComponent, {
      width: '450px'
    });

    dialogRef.afterClosed().subscribe((data) => {
      if (!data?.roomId) {
        return;
      }
      this.joinRoom(data.roomId);
    });
  }

  private createRoom(name: string): void {
    this.roomService.createRoom({ name }).subscribe({
      next: (room) => {
        this.showSuccessSnackBar(`Room "${room.name}" created successfully!`);
        this.chatState.addRoom(room);
        this.chatState.selectRoom(room);
      },
      error: (error) => {
        console.error('Failed to create room', error);
        const msg =
          error?.error?.response?.message ||
          error?.error?.message ||
          'Failed to create room';
        this.showErrorSnackBar(msg);
      }
    });
  }

  private joinRoom(roomId: string): void {
    this.roomService.joinRoom(roomId).subscribe({
      next: () => {
        this.showSuccessSnackBar('Joined channel successfully!');
        this.loadRooms(roomId);
      },
      error: (error) => {
        console.error('Failed to join room', error);
        const msg =
          error?.error?.response?.message ||
          error?.error?.message ||
          'Failed to join room. Please check the Room ID.';
        this.showErrorSnackBar(msg);
      }
    });
  }

  private showSuccessSnackBar(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 3500,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['mat-snack-bar-primary']
    });
  }

  private showErrorSnackBar(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 4000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['mat-snack-bar-error']
    });
  }
}
