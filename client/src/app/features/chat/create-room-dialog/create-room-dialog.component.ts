import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-create-room-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule
  ],
  templateUrl: './create-room-dialog.component.html',
  styleUrl: './create-room-dialog.component.scss'
})
export class CreateRoomDialogComponent {
  private readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(
    MatDialogRef<CreateRoomDialogComponent>
  );
  roomForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(20)]],
    isPrivate: [false]
  });

  cancel(): void {
    this.dialogRef.close();
  }
  create(): void {
    if (this.roomForm.invalid) {
      this.roomForm.markAllAsTouched();
      return;
    }

    const { name, isPrivate } = this.roomForm.getRawValue();
    this.dialogRef.close({ name, isPrivate });
  }
}
