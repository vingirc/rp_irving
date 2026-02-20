import { Component } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [InputTextModule, PasswordModule, ButtonModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {

}
