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
import { TicketService } from '../../services/ticket.service';
import { inject, computed } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { HasPermissionDirective } from '../../directives/has-permission.directive';

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
    ToolbarModule,
    TagModule,
    HasPermissionDirective
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './user.html',
  styleUrl: './user.css',
})
export class UserComponent implements OnInit {
  profile: ProfileData = {
    id: 'user1',
    username: 'irving_dev',
    email: 'irving@example.com',
    fullName: 'Irving Developer',
    birthDate: '1995-05-15',
    phone: '555-0199',
    address: 'CDMX, México',
    role: 'admin',
    status: 'Activo'
  };

  private ticketService = inject(TicketService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  userTickets = computed(() => {
    return this.ticketService.tickets().filter(t => t.assignedTo === this.profile.id);
  });

  ticketSummary = computed(() => {
    const tickets = this.userTickets();
    return {
      open: tickets.filter(t => t.status === 'Pendiente' || t.status === 'Revisión' || t.status === 'Bloqueado').length,
      inProgress: tickets.filter(t => t.status === 'En Progreso').length,
      done: tickets.filter(t => t.status === 'Hecho').length
    };
  });

  profileDialog: boolean = false;
  submitted: boolean = false;

  constructor() { }

  ngOnInit() { }

  editProfile() {
    this.profileDialog = true;
  }

  deleteProfile() {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres eliminar permanentemente tu cuenta?',
      header: 'Eliminar Cuenta',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
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
      this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Tu perfil ha sido actualizado', life: 3000 });
      this.profileDialog = false;
    }
  }
}
