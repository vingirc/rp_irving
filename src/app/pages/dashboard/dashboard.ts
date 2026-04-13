import { Component, OnInit, inject, computed, signal, ChangeDetectorRef } from '@angular/core';
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
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ChartModule } from 'primeng/chart';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { TicketService } from '../../services/ticket.service';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
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
        ToastModule,
        ProgressSpinnerModule,
        ChartModule,
        HasPermissionDirective
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
    private cdr = inject(ChangeDetectorRef);

    groups: any[] = [];
    private _selectedGroupIdSignal = signal<string | null>(null);
    
    get selectedGroupId(): string | null {
        return this._selectedGroupIdSignal();
    }
    
    set selectedGroupId(value: string | null) {
        this._selectedGroupIdSignal.set(value);
    }
    
    loading = signal(true);
    
    estados: any[] = [];
    prioridades: any[] = [];
    private estadoMap: Map<string, string> = new Map();
    private prioridadMap: Map<string, string> = new Map();
    private estadoNombreToId: Map<string, string> = new Map();
    private prioridadNombreToId: Map<string, string> = new Map();

    tickets = computed(() => this.ticketService.tickets());
    
    groupTickets = computed(() => {
        const id = this._selectedGroupIdSignal();
        if (!id) return this.tickets();
        return this.tickets().filter(t => t.groupId === id);
    });

    kanbanColumns: { label: string; value: TicketStatus; color: string }[] = [];

    priorityOptions: { label: string; value: Priority }[] = [];

    estadoOptions: { label: string; value: TicketStatus }[] = [];

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

    // Chart data
    statusChartData: any = {};
    statusChartOptions: any = {};
    priorityChartData: any = {};
    priorityChartOptions: any = {};

    selectedTicket: Ticket | null = null;
    ticketDialog = false;
    newTicketDialog = false;
    
    newTicket = {
        title: '',
        description: '',
        priority: 'Media' as Priority,
        estado: 'Pendiente' as TicketStatus,
        assignedTo: ''
    };

    async ngOnInit() {
        this.loading.set(true);
        this.cdr.detectChanges();
        await Promise.all([
            this.loadEstados(),
            this.loadPrioridades(),
            this.loadGroups(),
            this.loadTickets()
        ]);
        this.buildMapsFromTickets();
        this.updateCharts();
        this.loading.set(false);
        this.cdr.detectChanges();
        
        // Re-render after a microtask to ensure all computed signals have propagated
        setTimeout(() => this.cdr.detectChanges(), 0);
    }

    updateCharts() {
        const s = this.stats();
        this.statusChartData = {
            labels: ['Pendiente', 'En Progreso', 'Revisión', 'Hecho', 'Bloqueado'],
            datasets: [{
                data: [s.pendiente, s.enProgreso, s.revision, s.hecho, s.bloqueado],
                backgroundColor: ['#3B82F6', '#F59E0B', '#8B5CF6', '#10B981', '#EF4444'],
                hoverBackgroundColor: ['#2563EB', '#D97706', '#7C3AED', '#059669', '#DC2626']
            }]
        };
        this.statusChartOptions = {
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#495057', font: { size: 13 } }
                }
            },
            responsive: true,
            maintainAspectRatio: false
        };

        // Priority chart
        const tks = this.groupTickets();
        const prioridadCounts: Record<string, number> = {};
        tks.forEach(t => {
            prioridadCounts[t.priority] = (prioridadCounts[t.priority] || 0) + 1;
        });

        this.priorityChartData = {
            labels: Object.keys(prioridadCounts),
            datasets: [{
                label: 'Tickets por Prioridad',
                data: Object.values(prioridadCounts),
                backgroundColor: ['#6366F1', '#3B82F6', '#06B6D4', '#F59E0B', '#F97316', '#EF4444', '#DC2626'],
                borderRadius: 6
            }]
        };
        this.priorityChartOptions = {
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    ticks: { color: '#495057' },
                    grid: { color: '#ebedef' }
                },
                y: {
                    ticks: { color: '#495057', stepSize: 1 },
                    grid: { color: '#ebedef' }
                }
            },
            responsive: true,
            maintainAspectRatio: false
        };
    }

    async loadEstados() {
        try {
            const response = await this.apiService.getEstados();
            if (response.statusCode === 200 && Array.isArray(response.data)) {
                this.estadoOptions = response.data.map((e: any) => ({
                    label: e.nombre,
                    value: e.nombre
                }));
                this.kanbanColumns = response.data.map((e: any) => ({
                    label: e.nombre,
                    value: e.nombre as TicketStatus,
                    color: e.color || 'blue'
                }));
                response.data.forEach((e: any) => {
                    this.estadoNombreToId.set(e.nombre, e.id);
                    this.estadoMap.set(e.id, e.nombre);
                });
                this.cdr.detectChanges();
            }
        } catch (error) {
            console.error('Error loading estados:', error);
        }
    }

    async loadPrioridades() {
        try {
            const response = await this.apiService.getPrioridades();
            if (response.statusCode === 200 && Array.isArray(response.data)) {
                const sortedData = [...response.data].sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0));
                this.priorityOptions = sortedData.map((p: any) => ({
                    label: p.nombre,
                    value: p.nombre
                }));
                sortedData.forEach((p: any) => {
                    this.prioridadNombreToId.set(p.nombre, p.id);
                    this.prioridadMap.set(p.id, p.nombre);
                });
                this.cdr.detectChanges();
            }
        } catch (error) {
            console.error('Error loading prioridades:', error);
        }
    }

    private buildMapsFromTickets() {
        const allTickets = this.ticketService.tickets();
        
        allTickets.forEach(t => {
            if (t.status && !this.estadoMap.get(t.status)) {
                this.estadoMap.set(t.status as string, t.status as string);
            }
            if (t.priority && !this.prioridadMap.get(t.priority)) {
                this.prioridadMap.set(t.priority as string, t.priority as string);
            }
        });
    }

    async loadGroups() {
        try {
            const response = await this.apiService.getMyGroups();

            if (response.statusCode === 200 && Array.isArray(response.data)) {
                this.groups = response.data.map((g: any) => ({
                    id: g.id || g.grupo_id,
                    nombre: g.nombre || g.grupos?.nombre || g.name || 'Grupo Sin Nombre'
                }));
                this.cdr.detectChanges();

                if (this.groups?.length > 0 && !this.selectedGroupId) {
                    this.selectedGroupId = this.groups[0].id;
                }
            }
        } catch (error) {
            console.error('Error loading groups:', error);
        } finally {
            this.cdr.detectChanges();
        }
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

                ticketsData.forEach((t: any) => {
                    if (t.estado_id && t.estado_nombre) {
                        this.estadoMap.set(t.estado_id, t.estado_nombre);
                        this.estadoNombreToId.set(t.estado_nombre, t.estado_id);
                    }
                    if (t.priority_id && t.prioridad_nombre) {
                        this.prioridadMap.set(t.priority_id, t.prioridad_nombre);
                        this.prioridadNombreToId.set(t.prioridad_nombre, t.priority_id);
                    }
                });

                const mappedTickets: Ticket[] = ticketsData.map((t: any) => {
                    const estadoNombre = t.estado_nombre || this.estadoMap.get(t.estado_id) || 'Pendiente';
                    const prioridadNombre = t.prioridad_nombre || this.prioridadMap.get(t.priority_id) || 'Media';
                    
                    return {
                        id: t.id,
                        groupId: t.grupo_id || t.groupId,
                        title: t.titulo || t.title,
                        description: t.descripcion || t.description,
                        status: estadoNombre as TicketStatus,
                        priority: prioridadNombre as Priority,
                        assignedTo: t.asignado_id || t.assignedTo,
                        assignedToName: t.asignado_nombre || t.assignedToName,
                        creatorId: t.autor_id || t.creatorId,
                        creatorName: t.autor_nombre || t.creatorName,
                        createdAt: new Date(t.creado_en || t.createdAt),
                        deadline: t.fecha_limite ? new Date(t.fecha_limite) : undefined,
                        comments: [],
                        history: []
                    };
                });

                this.ticketService.upsertTickets(mappedTickets);
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

    getStatusSeverity(status: TicketStatus): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
        const column = this.kanbanColumns.find(c => c.value === status);
        return this.getSeverity(column?.color || 'blue');
    }

    getStatusColor(status: TicketStatus): string {
        const column = this.kanbanColumns.find(c => c.value === status);
        return column?.color || 'blue';
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
            estado: 'Pendiente',
            assignedTo: ''
        };
        this.newTicketDialog = true;
    }

    async saveNewTicket() {
        if (!this.newTicket.title.trim()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'El título es requerido'
            });
            return;
        }

        if (!this.selectedGroupId) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'Debe seleccionar un grupo'
            });
            return;
        }

        const currentUser = this.authService.currentUser();
        
        const estadoId = this.estadoNombreToId.get(this.newTicket.estado) || this.newTicket.estado;
        const prioridadId = this.prioridadNombreToId.get(this.newTicket.priority) || this.newTicket.priority;
        
        try {
            const response = await this.apiService.createTicket({
                grupo_id: this.selectedGroupId,
                titulo: this.newTicket.title,
                descripcion: this.newTicket.description,
                autor_id: currentUser?.id || '',
                estado_id: estadoId,
                priority_id: prioridadId,
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
                this.updateCharts();
                this.cdr.detectChanges();
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
