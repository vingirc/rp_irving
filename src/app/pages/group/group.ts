import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
import { Ticket, TicketStatus, Group, User } from '../../models/ticket.model';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';

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
    DragDropModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './group.html',
  styleUrl: './group.css',
})
export class GroupComponent implements OnInit {
  private ticketService = inject(TicketService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  view: 'list' | 'detail' = 'list';
  displayMode: 'kanban' | 'list' = 'kanban';

  groups: Group[] = [];
  selectedGroup: Group | null = null;
  groupDialog: boolean = false;
  submitted: boolean = false;

  // Member management
  newMemberEmail: string = '';
  groupMembers: User[] = [
    { id: 'user1', username: 'irving', email: 'irving@example.com', fullName: 'Irving', role: 'admin', permissions: [] },
    { id: 'user2', username: 'ana', email: 'ana@example.com', fullName: 'Ana', role: 'user', permissions: [] },
    { id: 'user3', username: 'luis', email: 'luis@example.com', fullName: 'Luis', role: 'user', permissions: [] }
  ];

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

  ngOnInit() {
    this.groups = [
      { id: '1', name: 'Desarrollo Core', description: 'Mantenimiento del motor principal', creatorId: 'user1', members: ['user1', 'user2'] },
      { id: '2', name: 'QA Team', description: 'Pruebas de regresión y automatización', creatorId: 'user1', members: ['user1', 'user2', 'user3'] },
      { id: '3', name: 'Soporte', description: 'Atención a usuarios finales y tickets N1', creatorId: 'user2', members: ['user2', 'user3'] }
    ];
  }

  selectGroup(group: Group) {
    this.selectedGroup = group;
    this.view = 'detail';
  }

  backToGroups() {
    this.selectedGroup = null;
    this.view = 'list';
  }

  openNewGroup() {
    this.selectedGroup = { id: '', name: '', description: '', creatorId: 'user1', members: [] };
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
      accept: () => {
        this.groups = this.groups.filter(val => val.id !== group.id);
        this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Grupo Eliminado', life: 3000 });
      }
    });
  }

  saveGroup() {
    this.submitted = true;
    if (this.selectedGroup?.name.trim()) {
      if (this.selectedGroup.id) {
        const index = this.groups.findIndex(g => g.id === this.selectedGroup?.id);
        this.groups[index] = this.selectedGroup;
        this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Grupo Actualizado', life: 3000 });
      } else {
        this.selectedGroup.id = Math.random().toString(36).substr(2, 5);
        this.groups.push(this.selectedGroup);
        this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Grupo Creado', life: 3000 });
      }
      this.groups = [...this.groups];
      this.groupDialog = false;
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
    if (ticket.status !== newStatus) {
      this.ticketService.updateTicket(ticket.id, { status: newStatus as TicketStatus });
      this.ticketService.addHistoryEntry(
        ticket.id,
        'Cambio de Estado',
        `Movido a ${newStatus} (arrastrado)`,
        'user1',
        'Irving'
      );
      this.messageService.add({ severity: 'info', summary: 'Estado actualizado', detail: `"${ticket.title}" movido a ${newStatus}` });
    }
  }

  openNewTicket() {
    if (!this.selectedGroup) return;

    this.selectedTicket = {
      id: '',
      groupId: this.selectedGroup.id,
      title: '',
      description: '',
      status: 'Pendiente',
      priority: 'Media',
      creatorId: 'user1',
      creatorName: 'Irving',
      createdAt: new Date(),
      comments: [],
      history: []
    } as any;

    this.ticketDialog = true;
  }

  addMember() {
    if (this.newMemberEmail.trim()) {
      this.messageService.add({ severity: 'success', summary: 'Miembro añadido', detail: `${this.newMemberEmail} ha sido invitado al grupo.` });
      this.newMemberEmail = '';
    }
  }

  removeMember(memberId: string) {
    this.confirmationService.confirm({
      message: '¿Estás seguro de eliminar a este miembro?',
      accept: () => {
        this.messageService.add({ severity: 'info', summary: 'Miembro eliminado', detail: 'El usuario ha sido removido del grupo.' });
      }
    });
  }
}
