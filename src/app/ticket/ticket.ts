import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Ticket, TicketStatus, Priority, User } from '../models/ticket.model';
import { TicketService } from '../services/ticket.service';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { HasPermissionDirective } from '../directives/has-permission.directive';
import { UserSelectorComponent } from '../components/user-selector/user-selector';

@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    DatePickerModule,
    ButtonModule,
    DividerModule,
    HasPermissionDirective,
    UserSelectorComponent
  ],
  templateUrl: './ticket.html',
  styleUrl: './ticket.css',
})
export class TicketComponent implements OnInit {
  @Input() ticket!: Ticket;
  @Input() currentUserRole: 'user' | 'admin' | 'superAdmin' = 'user';
  @Input() currentUserId: string = '';
  @Input() groupMembers: User[] = [];
  @Output() onSave = new EventEmitter<Ticket>();
  @Output() onClose = new EventEmitter<void>();

  private ticketService = inject(TicketService);

  newComment: string = '';

  memberOptions: { label: string, value: string }[] = [];

  statuses: TicketStatus[] = ['Pendiente', 'En Progreso', 'Revisión', 'Hecho', 'Bloqueado'];

  get selectedAssignee(): User | null {
    return this.groupMembers.find(m => m.id === this.ticket.assignedTo) || null;
  }

  onAssigneeChange(user: User | null) {
    if (user) {
      this.ticket.assignedTo = user.id;
      this.ticket.assignedToName = user.fullName;
    } else {
      this.ticket.assignedTo = '';
      this.ticket.assignedToName = '';
    }
  }

  ngOnInit() {
  }

  priorities: { label: string, value: Priority }[] = [
    { label: 'Muy Baja', value: 'Muy Baja' },
    { label: 'Baja', value: 'Baja' },
    { label: 'Media', value: 'Media' },
    { label: 'Alta', value: 'Alta' },
    { label: 'Muy Alta', value: 'Muy Alta' },
    { label: 'Urgente', value: 'Urgente' },
    { label: 'Inmediato', value: 'Inmediato' }
  ];

  get isCreator(): boolean {
    return this.ticket.creatorId === this.currentUserId;
  }

  get isAssigned(): boolean {
    return this.ticket.assignedTo === this.currentUserId;
  }

  get canEditFull(): boolean {
    return this.isCreator || this.currentUserRole === 'admin' || this.currentUserRole === 'superAdmin';
  }

  get canEditStatus(): boolean {
    return this.canEditFull || this.isAssigned;
  }

  save() {
    if (this.ticket.id) {
      this.ticketService.updateTicket(this.ticket.id, this.ticket);
    } else {
      const newTicket = this.ticketService.addTicket(this.ticket);
      this.ticket.id = newTicket.id; // Sync local object with generated ID
    }
    this.onSave.emit(this.ticket);
  }

  addComment() {
    if (this.newComment.trim()) {
      this.ticketService.addComment(
        this.ticket.id,
        this.newComment,
        this.currentUserId,
        'Usuario Actual' // Should come from a User Service ideally
      );
      this.ticketService.addHistoryEntry(
        this.ticket.id,
        'Comentario',
        `Agregó un comentario: ${this.newComment}`,
        this.currentUserId,
        'Usuario Actual'
      );
      this.newComment = '';
    }
  }

  onStatusChange(newStatus: TicketStatus) {
    // Explicitly update status in service to trigger signal update
    this.ticketService.updateTicket(this.ticket.id, { status: newStatus });

    this.ticketService.addHistoryEntry(
      this.ticket.id,
      'Cambio de Estado',
      `Cambió el estado a ${newStatus}`,
      this.currentUserId,
      'Usuario Actual'
    );
  }
}
