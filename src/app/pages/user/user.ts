import { Component, OnInit, inject, computed, signal, ChangeDetectorRef } from '@angular/core';
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
import { AuthService } from '../../services/auth.service';
import { ApiService, BackendUser } from '../../services/api.service';
import { TagModule } from 'primeng/tag';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { Router } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

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
    HasPermissionDirective,
    ProgressSpinnerModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './user.html',
  styleUrl: './user.css',
})
export class UserComponent implements OnInit {
  profile: ProfileData = {
    id: '',
    username: '',
    email: '',
    fullName: '',
    birthDate: '',
    phone: '',
    address: '',
    role: '',
    status: 'Activo'
  };

  loading = signal(true);

  private ticketService = inject(TicketService);
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

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

  async ngOnInit() {
    this.loading.set(true);
    await this.loadProfile();
    this.loading.set(false);
    this.cdr.detectChanges();
  }

  async loadProfile() {
    const currentUser = this.authService.currentUser();
    if (!currentUser?.id) {
      // Fallback to basic info from the auth token
      this.profile = {
        id: currentUser?.id || '',
        username: currentUser?.username || '',
        email: currentUser?.email || '',
        fullName: currentUser?.nombre || '',
        birthDate: '',
        phone: '',
        address: '',
        role: currentUser?.permissions?.includes('all') ? 'Admin' : 'Usuario',
        status: 'Activo'
      };
      return;
    }

    try {
      const response = await this.apiService.getProfile(currentUser.id);
      if (response.statusCode === 200 && response.data) {
        const userData = Array.isArray(response.data) ? (response.data as any)[0] : response.data;
        this.profile = {
          id: userData.id,
          username: userData.username || '',
          email: userData.email || '',
          fullName: userData.nombre_completo || '',
          birthDate: userData.fecha_nacimiento || '',
          phone: userData.telefono || '',
          address: userData.direccion || '',
          role: (userData.permisos_globales || []).includes('all') ? 'Admin' : 'Usuario',
          status: userData.estado ? 'Activo' : 'Inactivo'
        };
      } else {
        // Fallback
        this.profile = {
          id: currentUser.id,
          username: currentUser.username,
          email: currentUser.email,
          fullName: currentUser.nombre,
          birthDate: '',
          phone: '',
          address: '',
          role: currentUser.permissions?.includes('all') ? 'Admin' : 'Usuario',
          status: 'Activo'
        };
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      this.profile = {
        id: currentUser.id,
        username: currentUser.username,
        email: currentUser.email,
        fullName: currentUser.nombre,
        birthDate: '',
        phone: '',
        address: '',
        role: 'Usuario',
        status: 'Activo'
      };
    }
  }

  getInitials(): string {
    if (!this.profile.fullName) return '?';
    const parts = this.profile.fullName.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return this.profile.fullName.substring(0, 2).toUpperCase();
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
        this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Cuenta Marcada para Eliminación', life: 3000 });
      }
    });
  }

  hideDialog() {
    this.profileDialog = false;
    this.submitted = false;
  }

  async saveProfile() {
    this.submitted = true;
    if (this.profile.fullName.trim() && this.profile.id) {
      try {
        const response = await this.apiService.updateUser(this.profile.id, {
          nombre_completo: this.profile.fullName,
          username: this.profile.username
        });

        if (response.statusCode === 200) {
          this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Tu perfil ha sido actualizado', life: 3000 });
          this.profileDialog = false;
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el perfil', life: 3000 });
        }
      } catch (error) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error de conexión', life: 3000 });
      }
      this.cdr.detectChanges();
    }
  }

  logout() {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres cerrar sesión?',
      header: 'Cerrar Sesión',
      icon: 'pi pi-sign-out',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    });
  }
}
