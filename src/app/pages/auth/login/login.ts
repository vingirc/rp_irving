import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    RouterModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginForm: FormGroup;

  // ─── Credenciales hardcodeadas ───
  private readonly VALID_EMAIL = 'admin@correo.com';
  private readonly VALID_PASSWORD = 'Admin@12345';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private messageService: MessageService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  onLogin(): void {
    // Marcar todos como tocados para mostrar errores
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos incompletos',
        detail: 'Por favor completa todos los campos correctamente.',
        life: 4000
      });
      return;
    }

    const { email, password } = this.loginForm.value;

    if (email === this.VALID_EMAIL && password === this.VALID_PASSWORD) {
      this.messageService.add({
        severity: 'success',
        summary: '¡Bienvenido!',
        detail: 'Inicio de sesión exitoso. Redirigiendo...',
        life: 2500
      });
      setTimeout(() => this.router.navigate(['/']), 1500);
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error de autenticación',
        detail: 'Credenciales incorrectas. Intenta de nuevo.',
        life: 4000
      });
    }
  }
}
