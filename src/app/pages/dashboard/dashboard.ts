import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { TicketService } from '../../services/ticket.service';
import { Group, Ticket, TicketStatus, Priority } from '../../models/ticket.model';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        ButtonModule,
        SelectModule,
        SelectButtonModule,
        TagModule,
        TableModule,
        DialogModule,
        InputTextModule,
        ToastModule
    ],
    providers: [MessageService],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
    private authService = inject(AuthService);
    private apiService = inject(ApiService);
    private ticketService = inject(TicketService);
    private messageService = inject(MessageService);
    private router = inject(Router);

    groups: any[] = [];
    selectedGroupId: string | null = null;
    loading = signal(true);

    tickets = computed(() => this.ticketService.tickets());
    
    groupTickets = computed(() => {
        if (!this.selectedGroupId) return this.tickets();
        return this.tickets().filter(t => t.groupId === this.selectedGroupId);
    });

    kanbanColumns: { label: string; value: TicketStatus; color: string }[] = [
        { label: 'Pendiente', value: 'Pendiente', color: 'blue' },
        { label: 'En Progreso', value: 'En Progreso', color: 'orange' },
        { label: 'Revisión', value: 'Revisión', color: 'purple' },
        { label: 'Hecho', value: 'Hecho', color: 'green' },
        { label: 'Bloqueado', value: 'Bloqueado', color: 'red' }
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

    stats = computed(() => {
        const tks = this.groupTickets();
        return {
            total: tks.length,
            pendiente: tks.filter(t => t.status === 'Pendiente').length,
            enProgreso: tks.filter(t => t.status === 'En Progreso').length,
            revision: tks.filter(t => t.status === 'Revisión').length,
            hecho: tks.filter(t => t.status === 'Hecho').length,
            bloqueado: tks.filter(t => t.status === 'Bloqueado').length
        };
    });

    selectedTicket: Ticket | null = null;
    ticketDialog = false;
    newTicketDialog = false;
    
    newTicket = {
        title: '',
        description: '',
        priority: 'Media' as Priority,
        assignedTo: ''
    };

    async ngOnInit() {
        await this.loadGroups();
        await this.loadTickets();
    }

    async loadGroups() {
        const response = await this.apiService.getGroups();
        if (response.statusCode === 200 && Array.isArray(response.data)) {
            const firstItem = response.data[0];
            if (firstItem?.groups && Array.isArray(firstItem.groups)) {
                this.groups = firstItem.groups;
            } else {
                this.groups = response.data;
            }
            if (this.groups.length > 0 && !this.selectedGroupId) {
                this.selectedGroupId = this.groups[0].id;
            }
        }
        this.loading.set(false);
    }

    async loadTickets() {
        try {
            const response = await this.apiService.getTickets();
            if (response.statusCode === 200 && Array.isArray(response.data)) {
                const firstItem = response.data[0];
                let ticketsData: any[] = [];
                
                if (firstItem?.tickets && Array.isArray(firstItem.tickets)) {
                    ticketsData = firstItem.tickets;
                } else {
                    ticketsData = response.data;
                }

                const mappedTickets: Ticket[] = ticketsData.map((t: any) => ({
                    id: t.id,
                    groupId: t.grupo_id || t.groupId,
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
                }));

                mappedTickets.forEach(t => {
                    const existing = this.ticketService.tickets().find(existing => existing.id === t.id);
                    if (!existing) {
                        this.ticketService.addTicket(t);
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
        if (!this.newTicket.title.trim() || !this.selectedGroupId) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'El título es requerido y debe seleccionar un grupo'
            });
            return;
        }

        const currentUser = this.authService.currentUser();
        
        try {
            const response = await this.apiService.createTicket({
                grupo_id: this.selectedGroupId,
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
        this.ticketDialog = true;
    }

    goToGroupTickets() {
        if (this.selectedGroupId) {
            this.router.navigate(['/home/group-tickets', this.selectedGroupId]);
        }
    }

    goToAdminGroup() {
        if (this.selectedGroupId) {
            this.router.navigate(['/home/admin-group', this.selectedGroupId]);
        }
    }
}
