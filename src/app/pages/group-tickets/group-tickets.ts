import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { TicketService } from '../../services/ticket.service';
import { Ticket, TicketStatus, Priority } from '../../models/ticket.model';

@Component({
    selector: 'app-group-tickets',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        CardModule,
        ButtonModule,
        SelectModule,
        SelectButtonModule,
        TagModule,
        DialogModule,
        InputTextModule,
        ToastModule,
        ToolbarModule,
        ConfirmDialogModule,
        DragDropModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './group-tickets.html',
    styleUrl: './group-tickets.css'
})
export class GroupTicketsComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private authService = inject(AuthService);
    private apiService = inject(ApiService);
    private ticketService = inject(TicketService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    groupId: string | null = null;
    groupName: string = '';
    loading = signal(true);
    viewMode: 'kanban' | 'list' = 'kanban';

    viewModeOptions = [
        { label: 'Kanban', value: 'kanban' },
        { label: 'Lista', value: 'list' }
    ];

    statusOptions: { label: string; value: TicketStatus }[] = [
        { label: 'Pendiente', value: 'Pendiente' },
        { label: 'En Progreso', value: 'En Progreso' },
        { label: 'Revisión', value: 'Revisión' },
        { label: 'Hecho', value: 'Hecho' },
        { label: 'Bloqueado', value: 'Bloqueado' }
    ];

    priorityOptions: { label: string; value: Priority }[] = [
        { label: 'Muy Baja', value: 'Muy Baja' },
        { label: 'Baja', value: 'Baja' },
        { label: 'Media', value: 'Media' },
        { label: 'Alta', value: 'Alta' },
        { label: 'Muy Alta', value: 'Muy Alta' },
        { label: 'Urgente', value: 'Urgente' },
        { label: 'Inmediato', value: 'Inmediato' }
    ];

    kanbanColumns: { label: string; value: TicketStatus; color: string }[] = [
        { label: 'Pendiente', value: 'Pendiente', color: 'blue' },
        { label: 'En Progreso', value: 'En Progreso', color: 'orange' },
        { label: 'Revisión', value: 'Revisión', color: 'purple' },
        { label: 'Hecho', value: 'Hecho', color: 'green' },
        { label: 'Bloqueado', value: 'Bloqueado', color: 'red' }
    ];

    get connectedColumnIds(): string[] {
        return this.kanbanColumns.map(c => c.value);
    }

    tickets = computed(() => this.ticketService.tickets());
    
    groupTickets = computed(() => {
        if (!this.groupId) return this.tickets();
        return this.tickets().filter(t => t.groupId === this.groupId);
    });

    selectedTicket: Ticket | null = null;
    ticketDialog = false;
    newTicketDialog = false;
    editingTicket = false;
    
    newTicket = {
        title: '',
        description: '',
        priority: 'Media' as Priority,
        assignedTo: ''
    };

    globalFilter: string = '';
    statusFilter: TicketStatus | null = null;
    priorityFilter: Priority | null = null;

    async ngOnInit() {
        this.groupId = this.route.snapshot.paramMap.get('groupId');
        await this.loadGroupInfo();
        await this.loadTickets();
        this.loading.set(false);
    }

    async loadGroupInfo() {
        if (!this.groupId) return;
        
        const response = await this.apiService.getGroup(this.groupId);
        if (response.statusCode === 200) {
            const data = response.data;
            const group = Array.isArray(data) ? data[0]?.group || data[0] : data;
            this.groupName = group?.nombre || 'Grupo';
        }
    }

    async loadTickets() {
        if (!this.groupId) return;

        try {
            const response = await this.apiService.getTicketsByGroup(this.groupId);
            if (response.statusCode === 200 && Array.isArray(response.data)) {
                const firstItem = response.data[0];
                let ticketsData: any[] = [];
                
                if (firstItem?.tickets && Array.isArray(firstItem.tickets)) {
                    ticketsData = firstItem.tickets;
                } else {
                    ticketsData = response.data;
                }

                ticketsData.forEach((t: any) => {
                    const existing = this.ticketService.tickets().find(ex => ex.id === t.id);
                    if (!existing) {
                        this.ticketService.addTicket({
                            id: t.id,
                            groupId: t.grupo_id || this.groupId!,
                            title: t.titulo || t.title,
                            description: t.descripcion || t.description,
                            status: (t.estado_nombre || t.status) as TicketStatus,
                            priority: (t.prioridad_nombre || t.priority) as Priority,
                            assignedTo: t.asignado_id || t.assignedTo,
                            assignedToName: t.asignado_nombre || t.assignedToName,
                            creatorId: t.autor_id || t.creatorId,
                            creatorName: t.autor_nombre || t.creatorName,
                            createdAt: new Date(t.creado_en || t.createdAt),
                            deadline: t.fecha_limite ? new Date(t.fecha_limite) : undefined,
                            comments: [],
                            history: []
                        });
                    }
                });
            }
        } catch (error) {
            console.error('Error loading tickets:', error);
        }
    }

    getTicketsByStatus(status: TicketStatus) {
        return this.groupTickets().filter(t => t.status === status);
    }

    onDrop(event: CdkDragDrop<Ticket[]>, newStatus: TicketStatus) {
        const ticket = event.item.data as Ticket;
        
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else {
            transferArrayItem(
                event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                event.currentIndex
            );
            
            this.updateTicketStatus(ticket, newStatus);
        }
    }

    async updateTicketStatus(ticket: Ticket, newStatus: TicketStatus) {
        const currentUser = this.authService.currentUser();
        
        this.ticketService.updateTicket(ticket.id, { status: newStatus });
        
        this.ticketService.addHistoryEntry(
            ticket.id,
            'Cambio de Estado',
            `Estado cambiado a ${newStatus}`,
            currentUser?.username || '',
            currentUser?.nombre || ''
        );

        try {
            const estadoMap: Record<string, string> = {
                'Pendiente': '1',
                'En Progreso': '2',
                'Revisión': '3',
                'Hecho': '4',
                'Bloqueado': '5'
            };

            await this.apiService.changeTicketState(ticket.id, estadoMap[newStatus] || '1', currentUser?.username || '');
        } catch (error) {
            console.error('Error updating ticket status in backend:', error);
        }

        this.messageService.add({
            severity: 'success',
            summary: 'Actualizado',
            detail: `Ticket movido a ${newStatus}`
        });
    }

    openNewTicket() {
        this.newTicket = {
            title: '',
            description: '',
            priority: 'Media',
            assignedTo: ''
        };
        this.newTicketDialog = true;
    }

    async saveNewTicket() {
        if (!this.newTicket.title.trim() || !this.groupId) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'El título es requerido'
            });
            return;
        }

        const currentUser = this.authService.currentUser();
        
        try {
            const response = await this.apiService.createTicket({
                grupo_id: this.groupId,
                titulo: this.newTicket.title,
                descripcion: this.newTicket.description,
                autor_id: currentUser?.username || '',
                estado_id: '1',
                priority_id: '1',
                asignado_id: this.newTicket.assignedTo || undefined
            });

            if (response.statusCode === 201 || response.statusCode === 200) {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Ticket creado correctamente'
                });
                this.newTicketDialog = false;
                await this.loadTickets();
            } else {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo crear el ticket'
                });
            }
        } catch (error) {
            console.error('Error creating ticket:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Error de conexión'
            });
        }
    }

    viewTicket(ticket: Ticket) {
        this.selectedTicket = { ...ticket };
        this.editingTicket = false;
        this.ticketDialog = true;
    }

    editTicket(ticket: Ticket) {
        this.selectedTicket = { ...ticket };
        this.editingTicket = true;
        this.ticketDialog = true;
    }

    async saveTicket() {
        if (!this.selectedTicket) return;

        const currentUser = this.authService.currentUser();
        
        this.ticketService.updateTicket(this.selectedTicket.id, {
            title: this.selectedTicket.title,
            description: this.selectedTicket.description,
            priority: this.selectedTicket.priority,
            status: this.selectedTicket.status
        });

        try {
            await this.apiService.updateTicket(this.selectedTicket.id, {
                titulo: this.selectedTicket.title,
                descripcion: this.selectedTicket.description
            });
        } catch (error) {
            console.error('Error updating ticket:', error);
        }

        this.ticketService.addHistoryEntry(
            this.selectedTicket.id,
            'Ticket Editado',
            'Los detalles del ticket fueron actualizados',
            currentUser?.username || '',
            currentUser?.nombre || ''
        );

        this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Ticket actualizado'
        });
        
        this.ticketDialog = false;
    }

    async deleteTicket(ticket: Ticket) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de que quieres eliminar el ticket "${ticket.title}"?`,
            accept: async () => {
                try {
                    const response = await this.apiService.deleteTicket(ticket.id);
                    if (response.statusCode === 200) {
                        this.ticketService.removeTicket(ticket.id);
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Eliminado',
                            detail: 'Ticket eliminado correctamente'
                        });
                        this.ticketDialog = false;
                    }
                } catch (error) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo eliminar el ticket'
                    });
                }
            }
        });
    }

    getSeverity(color: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
        const map: Record<string, "success" | "info" | "warn" | "danger" | "secondary" | "contrast"> = {
            'blue': 'info',
            'orange': 'warn',
            'purple': 'secondary',
            'green': 'success',
            'red': 'danger'
        };
        return map[color] || 'info';
    }

    getPrioritySeverity(priority: Priority): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
        const map: Record<string, "success" | "info" | "warn" | "danger" | "secondary" | "contrast"> = {
            'Muy Baja': 'secondary',
            'Baja': 'info',
            'Media': 'info',
            'Alta': 'warn',
            'Muy Alta': 'warn',
            'Urgente': 'danger',
            'Inmediato': 'danger'
        };
        return map[priority] || 'info';
    }

    goBack() {
        this.router.navigate(['/home']);
    }

    getColumnColor(status: TicketStatus): string {
        const column = this.kanbanColumns.find(c => c.value === status);
        return column?.color || 'blue';
    }
}
