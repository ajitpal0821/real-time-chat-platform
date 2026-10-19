import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface LeaveRoomDialogData {
  name: string;
  isPrivate?: boolean;
}

@Component({
  selector: 'app-leave-room-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './leave-room-dialog.component.html',
  styleUrl: './leave-room-dialog.component.scss'
})
export class LeaveRoomDialogComponent {
  readonly data: LeaveRoomDialogData = inject(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<LeaveRoomDialogComponent>);

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}
