import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { FieldsetModule } from 'primeng/fieldset';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { MessageService, ConfirmationService } from 'primeng/api';

export interface ProfileData {
  id?: string;
  username: string;
  email: string;
  fullName: string;
  birthDate: string;
  phone: string;
  address: string;
  role: string;
  status: string;
}

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    AvatarModule,
    FieldsetModule,
    ToastModule,
    ConfirmDialogModule,
    ToolbarModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './user.html',
  styleUrl: './user.css',
})
export class User implements OnInit {
  profile: ProfileData = {
    id: '1',
    username: 'epena_nieto',
    email: 'enrique.pn@mexico.gob.mx',
    fullName: 'Enrique Peña Nieto',
    birthDate: '1966-07-20',
    phone: '5551234567',
    address: 'Residencia Oficial L.P., CDMX',
    role: 'Usuario Estandar',
    status: 'Activo'
  };

  profileDialog: boolean = false;
  submitted: boolean = false;

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit() {
    // Initial profile already set as mock data
  }

  editProfile() {
    this.profileDialog = true;
  }

  deleteProfile() {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres eliminar permanentemente tu cuenta?',
      header: 'Eliminar Cuenta',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // Here we would normally call a service to delete the account
        this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Cuenta Marcada para Eliminación', life: 3000 });
      }
    });
  }

  hideDialog() {
    this.profileDialog = false;
    this.submitted = false;
  }

  saveProfile() {
    this.submitted = true;

    if (this.profile.fullName.trim()) {
      // In a real app, we would call a service to save
      this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Tu perfil ha sido actualizado', life: 3000 });
      this.profileDialog = false;
    }
  }
}
