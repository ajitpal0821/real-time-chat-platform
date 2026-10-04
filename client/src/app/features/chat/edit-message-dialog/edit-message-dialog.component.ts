import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface EditMessageDialogData {
  content: string;
}

@Component({
  selector: 'app-edit-message-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './edit-message-dialog.component.html',
  styleUrl: './edit-message-dialog.component.scss'
})
export class EditMessageDialogComponent {
  private readonly fb = inject(FormBuilder);

  readonly dialogRef = inject(MatDialogRef<EditMessageDialogComponent>);
  readonly data = inject<EditMessageDialogData>(MAT_DIALOG_DATA);

  readonly form = this.fb.nonNullable.group({
    content: [
      this.data?.content || '',
      [
        Validators.required,
        Validators.maxLength(5000)
      ]
    ]
  });

  save(): void {
    if (this.form.invalid) {
      return;
    }

    const content = this.form.controls.content.value.trim();
    if (!content) {
      return;
    }
    this.dialogRef.close(content);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
