import { Component, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { TicketService } from '../../services/ticket.service';
import { AuthService } from '../../services/auth.service';
import { TicketStatus } from '../../models/ticket.model';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { Router } from '@angular/router';
import { TicketComponent } from '../../ticket/ticket';
import { DialogModule } from 'primeng/dialog';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ButtonModule, AvatarModule, CardModule, TagModule, TicketComponent, DialogModule, HasPermissionDirective, DragDropModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private ticketService = inject(TicketService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private apiService = inject(ApiService);

  private estadoNombreToId: Map<string, string> = new Map();

  get currentUserId() { return this.authService.currentUserId(); }
  get currentMember() {
    const u = this.authService.currentUser();
    return { id: u?.id || '', fullName: u?.nombre || 'Usuario', role: 'user' };
  }

  selectedTicket: any = null;
  ticketDialog: boolean = false;

  async ngOnInit() {
    try {
      const response = await this.apiService.getEstados();
      if (response.statusCode === 200 && Array.isArray(response.data)) {
        response.data.forEach((e: any) => {
          this.estadoNombreToId.set(e.nombre, e.id);
        });
      }
    } catch (error) {
      console.error('Error loading estados:', error);
    }
  }

  assignedTickets = computed(() => {
    return this.ticketService.tickets().filter(t => t.assignedTo === this.currentUserId);
  });

  kanbanColumns = [
    { label: 'Pendiente', value: 'Pendiente', color: 'blue' },
    { label: 'En Progreso', value: 'En Progreso', color: 'orange' },
    { label: 'Revisión', value: 'Revisión', color: 'purple' },
    { label: 'Hecho', value: 'Hecho', color: 'green' }
  ];

  ticketStats = computed(() => {
    const tickets = this.assignedTickets();
    return {
      total: tickets.length,
      pendiente: tickets.filter(t => t.status === 'Pendiente').length,
      enProgreso: tickets.filter(t => t.status === 'En Progreso').length,
      hecho: tickets.filter(t => t.status === 'Hecho').length,
      bloqueado: tickets.filter(t => t.status === 'Bloqueado').length
    };
  });

  stats = [
    { title: 'Usuarios Activos', value: '1,245', icon: 'pi-users', color: 'blue' },
    { title: 'Alertas Recientes', value: '12', icon: 'pi-bell', color: 'red' },
    { title: 'Sistemas Seguros', value: '48', icon: 'pi-shield', color: 'green' },
    { title: 'Actualizaciones', value: '3', icon: 'pi-sync', color: 'purple' }
  ];

  recentActivity = [
    { user: 'Admin', action: 'Actualizó configuración de cortafuegos', time: 'hace 2 horas' },
    { user: 'Sistema', action: 'Escaneo de vulnerabilidades completado', time: 'hace 5 horas' },
    { user: 'Juan Pérez', action: 'Inició sesión desde nueva IP', time: 'hace 1 día' }
  ];


  groupedTickets = computed(() => {
    const tickets = this.assignedTickets();
    const map = new Map<string, any[]>();
    tickets.forEach(t => {
      const list = map.get(t.status) || [];
      list.push(t);
      map.set(t.status, list);
    });
    return map;
  });

  emptyArray: any[] = [];
  getTicketsByStatus(status: string) {
    return this.groupedTickets().get(status) || this.emptyArray;
  }

  viewTicket(ticket: any) {
    this.selectedTicket = { ...ticket };
    this.ticketDialog = true;
  }

  async dropTicket(event: CdkDragDrop<string>, newStatus: string) {
    const ticket = event.item.data;
    const currentUser = this.authService.currentUser();
    const isAssigned = ticket.assignedTo === currentUser?.id;
    const isAdmin = this.authService.hasPermission('all');

    if (!isAssigned && !isAdmin) {
      return; // silently ignore
    }

    if (ticket.status !== newStatus) {
      this.ticketService.updateTicket(ticket.id, { status: newStatus as any });
      this.ticketService.addHistoryEntry(
        ticket.id,
        'Cambio de Estado',
        `Movido a ${newStatus} (arrastrado)`,
        this.currentUserId,
        this.currentMember.fullName
      );

      try {
        const estadoId = this.estadoNombreToId.get(newStatus) || newStatus;
        await this.apiService.changeTicketState(ticket.id, estadoId, currentUser?.id || '');
      } catch (error) {
        console.error('Error updating ticket status in backend:', error);
      }
    }
  }

  openNewTicket() {
    this.selectedTicket = {
      id: '',
      groupId: '1', // Default to group 1 or first available
      title: '',
      description: '',
      status: 'Pendiente',
      priority: 'Media',
      creatorId: this.currentUserId,
      creatorName: this.currentMember.fullName,
      createdAt: new Date(),
      assignedTo: this.currentUserId,
      assignedToName: this.currentMember.fullName,
      comments: [],
      history: []
    } as any;

    this.ticketDialog = true;
  }

  goToGroups() {
    this.router.navigate(['/home/group']);
  }
}