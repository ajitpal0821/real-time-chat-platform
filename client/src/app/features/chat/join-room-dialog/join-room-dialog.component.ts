import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-join-room-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './join-room-dialog.component.html',
  styleUrl: './join-room-dialog.component.scss'
})
export class JoinRoomDialogComponent {
  private readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(MatDialogRef<JoinRoomDialogComponent>);

  joinForm = this.fb.nonNullable.group({
    roomId: ['', [Validators.required, Validators.minLength(1)]]
  });

  cancel(): void {
    this.dialogRef.close();
  }

  join(): void {
    if (this.joinForm.invalid) {
      this.joinForm.markAllAsTouched();
      return;
    }

    this.dialogRef.close({
      roomId: this.joinForm.getRawValue().roomId.trim()
    });
  }
}
