import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { DatePickerModule } from 'primeng/datepicker';
import { InputMaskModule } from 'primeng/inputmask';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    RouterModule,
    ToastModule,
    DatePickerModule,
    InputMaskModule,
  ],
  providers: [MessageService],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  registerForm: FormGroup;
  maxDate: Date;
  private auth = inject(AuthService);

  readonly specialSymbols = '!@#$%^&*(),.?":{}|<>';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private messageService: MessageService
  ) {
    const today = new Date();
    this.maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());

    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(10),
        this.specialCharValidator
      ]],
      confirmPassword: ['', [Validators.required]],
      fullName: ['', [Validators.required]],
      birthDate: [null, [Validators.required, this.adultValidator]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      address: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  get f() {
    return this.registerForm.controls;
  }

  private specialCharValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    const hasSpecial = /[!@#$%^&*()\,.?":{}|<>]/.test(value);
    return hasSpecial ? null : { noSpecialChar: true };
  }

  private adultValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    const birthDate = new Date(value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 18 ? null : { underAge: true };
  }

  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    if (!confirmPassword) return null;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  async onRegister(): Promise<void> {
    this.registerForm.markAllAsTouched();

    if (this.registerForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario incompleto',
        detail: 'Corrige los errores en el formulario antes de continuar.',
        life: 4000
      });
      return;
    }

    const { username, email, password, fullName } = this.registerForm.value;

    const result = await this.auth.register(email, password, username, fullName);

    if (result.success) {
      this.messageService.add({
        severity: 'success',
        summary: '¡Registro exitoso!',
        detail: 'Tu cuenta ha sido creada. Redirigiendo al inicio de sesión...',
        life: 3000
      });

      setTimeout(() => this.router.navigate(['/login']), 2000);
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error de registro',
        detail: result.error || 'No se pudo crear la cuenta. Intenta de nuevo.',
        life: 4000
      });
    }
  }
}
