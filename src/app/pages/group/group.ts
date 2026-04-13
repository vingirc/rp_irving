import { Component, OnInit, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { TicketComponent } from '../../ticket/ticket';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TicketService } from '../../services/ticket.service';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { Ticket, TicketStatus, Group, User } from '../../models/ticket.model';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    ToastModule,
    ConfirmDialogModule,
    ToolbarModule,
    SelectButtonModule,
    TagModule,
    AvatarModule,
    TicketComponent,
    HasPermissionDirective,
    DragDropModule,
    ProgressSpinnerModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './group.html',
  styleUrl: './group.css',
})
export class GroupComponent implements OnInit {
  private ticketService = inject(TicketService);
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private cdr = inject(ChangeDetectorRef);

  view: 'list' | 'detail' = 'list';
  displayMode: 'kanban' | 'list' = 'kanban';
  loading = signal(true);

  groups: Group[] = [];
  selectedGroup: Group | null = null;
  groupDialog: boolean = false;
  submitted: boolean = false;

  // Member management
  newMemberEmail: string = '';
  groupMembers: User[] = [];

  // Ticket detail
  selectedTicket: Ticket | null = null;
  ticketDialog: boolean = false;

  displayModes = [
    { label: 'Kanban', value: 'kanban', icon: 'pi pi-th-large' },
    { label: 'Lista', value: 'list', icon: 'pi pi-list' }
  ];

  groupTickets = computed(() => {
    if (!this.selectedGroup) return [];
    return this.ticketService.getTicketsByGroup(this.selectedGroup.id);
  });

  kanbanColumns = [
    { label: 'Pendiente', value: 'Pendiente', color: 'blue' },
    { label: 'En Progreso', value: 'En Progreso', color: 'orange' },
    { label: 'Revisión', value: 'Revisión', color: 'purple' },
    { label: 'Hecho', value: 'Hecho', color: 'green' },
    { label: 'Bloqueado', value: 'Bloqueado', color: 'red' }
  ];

  constructor() { }

  async ngOnInit() {
    this.loading.set(true);
    await this.loadGroups();
    this.loading.set(false);
    this.cdr.detectChanges();
    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  async loadGroups() {
    try {
      const currentUser = this.authService.currentUser();
      let response: any;

      // Try to get groups for the current user first
      if (currentUser?.id) {
        response = await this.apiService.getGroupsByUser(currentUser.id);
      }

      // Fall back to all groups if user-specific fails
      if (!response || response.statusCode !== 200) {
        response = await this.apiService.getGroups();
      }

      if (response.statusCode === 200 && Array.isArray(response.data)) {
        // getUserGroups returns [{grupo_id, grupos: {id, nombre, descripcion}}, ...]
        this.groups = response.data.map((g: any) => {
          const nested = g.grupos || g;
          return {
            id: nested.id || g.grupo_id || g.id,
            name: nested.nombre || g.nombre || g.name || 'Grupo Sin Nombre',
            description: nested.descripcion || g.descripcion || g.description || '',
            creatorId: nested.creador_id || g.creador_id || g.creatorId || '',
            members: g.miembros || g.members || []
          };
        });
      }
    } catch (error) {
      console.error('Error loading groups:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los grupos'
      });
    }
  }

  selectGroup(group: Group) {
    this.selectedGroup = group;
    this.view = 'detail';
    this.loadGroupMembers(group.id);
  }

  async loadGroupMembers(groupId: string) {
    try {
      const response = await this.apiService.getGroupMembers(groupId);
      if (response.statusCode === 200 && Array.isArray(response.data)) {
        const firstItem = response.data[0];
        let membersData: any[] = [];

        if (firstItem?.members && Array.isArray(firstItem.members)) {
          membersData = firstItem.members;
        } else if (firstItem?.usuarios && Array.isArray(firstItem.usuarios)) {
          membersData = firstItem.usuarios;
        } else {
          membersData = response.data;
        }

        this.groupMembers = membersData.map((m: any) => ({
          id: m.usuario_id || m.id,
          username: m.username || m.usuario_username || '',
          email: m.email || m.usuario_email || '',
          fullName: m.nombre_completo || m.usuario_nombre || m.username || '',
          permissions: m.permisos_globales || [],
          avatar: undefined
        }));
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error('Error loading members:', error);
    }
  }

  backToGroups() {
    this.selectedGroup = null;
    this.view = 'list';
  }

  openNewGroup() {
    const currentUser = this.authService.currentUser();
    this.selectedGroup = { id: '', name: '', description: '', creatorId: currentUser?.id || '', members: [] };
    this.submitted = false;
    this.groupDialog = true;
  }

  editGroup(group: Group) {
    this.selectedGroup = { ...group };
    this.groupDialog = true;
  }

  deleteGroup(group: Group) {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres eliminar ' + group.name + '?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        const response = await this.apiService.deleteGroup(group.id);
        if (response.statusCode === 200) {
          this.groups = this.groups.filter(val => val.id !== group.id);
          this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Grupo Eliminado', life: 3000 });
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el grupo', life: 3000 });
        }
        this.cdr.detectChanges();
      }
    });
  }

  async saveGroup() {
    this.submitted = true;
    if (this.selectedGroup?.name.trim()) {
      const currentUser = this.authService.currentUser();
      if (this.selectedGroup.id) {
        // Update existing group
        const response = await this.apiService.updateGroup(this.selectedGroup.id, {
          nombre: this.selectedGroup.name,
          descripcion: this.selectedGroup.description
        });
        if (response.statusCode === 200) {
          const index = this.groups.findIndex(g => g.id === this.selectedGroup?.id);
          if (index !== -1) this.groups[index] = this.selectedGroup;
          this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Grupo Actualizado', life: 3000 });
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el grupo', life: 3000 });
        }
      } else {
        // Create new group — include creador_id
        const response = await this.apiService.createGroup({
          nombre: this.selectedGroup.name,
          descripcion: this.selectedGroup.description,
          creador_id: currentUser?.id || ''
        });
        if (response.statusCode === 201 || response.statusCode === 200) {
          await this.loadGroups();
          this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Grupo Creado', life: 3000 });
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el grupo', life: 3000 });
        }
      }
      this.groups = [...this.groups];
      this.groupDialog = false;
      this.cdr.detectChanges();
    }
  }

  getTicketsByStatus(status: string) {
    return this.groupTickets().filter(t => t.status === status);
  }

  viewTicket(ticket: Ticket) {
    this.selectedTicket = { ...ticket };
    this.ticketDialog = true;
  }

  dropTicket(event: CdkDragDrop<string>, newStatus: string) {
    const ticket = event.item.data as Ticket;
    const currentUser = this.authService.currentUser();

    // Kanban D&D validation: only move if assigned to user or user is admin
    const isAssigned = ticket.assignedTo === currentUser?.id;
    const isAdmin = this.authService.hasPermission('all');
    const hasMovePerm = this.authService.hasPermission('ticket:edit') || this.authService.hasPermission('ticket:edit:state');

    if (!isAssigned && !isAdmin) {
      this.messageService.add({ severity: 'warn', summary: 'No permitido', detail: 'Solo puedes mover tickets asignados a ti.' });
      return;
    }

    if (!hasMovePerm && !isAdmin) {
      this.messageService.add({ severity: 'warn', summary: 'Sin permiso', detail: 'No tienes permiso para cambiar el estado de tickets.' });
      return;
    }

    if (ticket.status !== newStatus) {
      this.ticketService.updateTicket(ticket.id, { status: newStatus as TicketStatus });
      this.ticketService.addHistoryEntry(
        ticket.id,
        'Cambio de Estado',
        `Movido a ${newStatus} (arrastrado)`,
        currentUser?.id || '',
        currentUser?.nombre || ''
      );
      this.messageService.add({ severity: 'info', summary: 'Estado actualizado', detail: `"${ticket.title}" movido a ${newStatus}` });
    }
  }

  openNewTicket() {
    if (!this.selectedGroup) return;
    const currentUser = this.authService.currentUser();

    this.selectedTicket = {
      id: '',
      groupId: this.selectedGroup.id,
      title: '',
      description: '',
      status: 'Pendiente',
      priority: 'Media',
      creatorId: currentUser?.id || '',
      creatorName: currentUser?.nombre || '',
      createdAt: new Date(),
      comments: [],
      history: []
    } as any;

    this.ticketDialog = true;
  }

  addMember() {
    if (this.newMemberEmail.trim() && this.selectedGroup) {
      this.messageService.add({ severity: 'success', summary: 'Miembro añadido', detail: `${this.newMemberEmail} ha sido invitado al grupo.` });
      this.newMemberEmail = '';
    }
  }

  removeMember(memberId: string) {
    this.confirmationService.confirm({
      message: '¿Estás seguro de eliminar a este miembro?',
      accept: async () => {
        if (!this.selectedGroup) return;
        const response = await this.apiService.removeGroupMember(this.selectedGroup.id, memberId);
        if (response.statusCode === 200) {
          this.groupMembers = this.groupMembers.filter(m => m.id !== memberId);
          this.messageService.add({ severity: 'info', summary: 'Miembro eliminado', detail: 'El usuario ha sido removido del grupo.' });
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo remover el miembro.' });
        }
        this.cdr.detectChanges();
      }
    });
  }
}
