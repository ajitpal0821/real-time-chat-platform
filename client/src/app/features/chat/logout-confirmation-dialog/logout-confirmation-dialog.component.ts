import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-logout-confirmation-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './logout-confirmation-dialog.component.html',
  styleUrl: './logout-confirmation-dialog.component.scss'
})
export class LogoutConfirmationDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<LogoutConfirmationDialogComponent>);

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
