import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  registerForm: FormGroup = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]]
  });

  loading = false;
  errorMessage = '';
  successMessage = '';
  hidePassword = true;

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  get passwordStrength(): { label: string; score: number; color: string } {
    const pwd = this.registerForm.get('password')?.value || '';
    if (!pwd) return { label: '', score: 0, color: '#334155' };
    if (pwd.length < 6) return { label: 'Too short', score: 1, color: '#ef4444' };
    if (pwd.length < 10) return { label: 'Medium', score: 2, color: '#f59e0b' };
    return { label: 'Strong', score: 3, color: '#10b981' };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { name, email, password } = this.registerForm.getRawValue();

    this.authService.register({ name, email, password }).subscribe({
      next: () => {
        this.successMessage = 'Account created successfully! Redirecting to login...';
        this.snackBar.open('Account created successfully! Welcome aboard.', 'Dismiss', {
          duration: 3500,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['mat-snack-bar-primary']
        });
        this.registerForm.reset();
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1200);
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.response?.message ||
          error?.error?.message ||
          'Registration failed. Please check your details and try again.';
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
