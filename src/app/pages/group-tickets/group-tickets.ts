import { Component, OnInit, inject, computed, signal, ChangeDetectorRef } from '@angular/core';
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
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { TicketService } from '../../services/ticket.service';
import { PermissionService } from '../../services/permission.service';
import { Ticket, TicketStatus, Priority } from '../../models/ticket.model';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { KanbanBoardComponent } from '../../components/kanban-board/kanban-board';
import { GroupSelectorComponent } from '../../components/group-selector/group-selector';

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
        DragDropModule,
        HasPermissionDirective,
        KanbanBoardComponent,
        GroupSelectorComponent
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
    private cdr = inject(ChangeDetectorRef);
    private permissionService = inject(PermissionService);

    groups: any[] = [];
    private _groupIdSignal = signal<string | null>(null);

    get groupId(): string | null {
        return this._groupIdSignal();
    }

    set groupId(value: string | null) {
        if (this._groupIdSignal() !== value) {
            this._groupIdSignal.set(value);
            this.onGroupChange();
        }
    }

    groupName: string = '';
    loading = signal(true);
    viewMode: 'kanban' | 'list' = 'kanban';

    viewModeOptions = [
        { label: 'Kanban', value: 'kanban' },
        { label: 'Lista', value: 'list' }
    ];

    statusOptions: { label: string; value: TicketStatus }[] = [];
    priorityOptions: { label: string; value: Priority }[] = [];

    kanbanColumns: { label: string; value: TicketStatus; color: string }[] = [];

    private estadoNombreToId: Map<string, string> = new Map();
    private prioridadNombreToId: Map<string, string> = new Map();
    private estadoMap: Map<string, string> = new Map();
    private prioridadMap: Map<string, string> = new Map();

    tickets = computed(() => this.ticketService.tickets());

    groupTickets = computed(() => {
        const id = this._groupIdSignal();
        if (!id) return [];
        return this.tickets().filter(t => t.groupId === id);
    });

    groupedTickets = computed(() => {
        const tickets = this.groupTickets();
        const map = new Map<string, Ticket[]>();
        tickets.forEach(ticket => {
            const list = map.get(ticket.status) || [];
            list.push(ticket);
            map.set(ticket.status, list);
        });
        return map;
    });

    selectedTicket: Ticket | null = null;
    ticketDialog = false;
    newTicketDialog = false;
    editingTicket = false;

    newTicket = {
        title: '',
        description: '',
        priority: 'Media' as Priority,
        estado: 'Pendiente' as TicketStatus,
        assignedTo: ''
    };

    globalFilter: string = '';
    statusFilter: TicketStatus | null = null;
    priorityFilter: Priority | null = null;

    async ngOnInit() {
        await Promise.all([
            this.loadEstados(),
            this.loadPrioridades(),
        ]);
        
        await this.loadGroups();

        this.route.paramMap.subscribe(async (params) => {
            const routeId = params.get('groupId');
            
            if (routeId && routeId !== 'null' && routeId !== 'undefined') {
                this.groupId = routeId; // triggers setter and onGroupChange systematically
            } else if (this.groups.length > 0) {
                this.router.navigate(['/home/group-tickets', this.groups[0].id]);
            } else {
                this.loading.set(false);
                this.cdr.detectChanges();
            }
        });
    }

    async loadGroups() {
        try {
            const response = await this.apiService.getMyGroups();

            if (response.statusCode === 200 && Array.isArray(response.data)) {
                this.groups = response.data.map((g: any) => ({
                    id: String(g.id || g.grupo_id || ''),
                    nombre: g.nombre || g.grupos?.nombre || g.name || 'Grupo Sin Nombre'
                }));
            }
        } catch (error) {
            console.error('Error loading groups:', error);
        } finally {
            this.cdr.detectChanges();
        }
    }

    async onGroupChange() {
        if (!this.groupId) return;
        this.loading.set(true);
        // Ensure UI updates before doing heavy loading
        this.cdr.detectChanges();

        // Refresh group-scoped permissions for the current user
        const currentUser = this.authService.currentUser();
        
        // Wait for permissions first before fetching data that relies on them
        if (currentUser?.id) {
            await this.loadGroupPermissions(this.groupId, currentUser.id);
        }
        
        await Promise.all([
            this.loadGroupInfo(),
            this.loadTickets()
        ]);
        
        this.loading.set(false);
        this.cdr.detectChanges();
    }

    /**
     * Fetches group-scoped permissions from the API and sets them in PermissionService.
     */
    private async loadGroupPermissions(groupId: string, userId: string): Promise<void> {
        try {
            const response = await this.apiService.getGroupUserPermissions(groupId, userId);
            if (response.statusCode === 200 && Array.isArray(response.data)) {
                const dataArray = response.data as any[];
                let permsStr: string[] = [];
                if (dataArray.length > 0 && dataArray[0]?.permissions && Array.isArray(dataArray[0].permissions)) {
                    permsStr = dataArray[0].permissions.map((p: any) => p.nombre || p);
                } else if (dataArray.length > 0 && typeof dataArray[0] === 'string') {
                    permsStr = dataArray;
                } else if (dataArray.length > 0 && dataArray[0]?.nombre) {
                    permsStr = dataArray.map((p: any) => p.nombre);
                }
                
                this.permissionService.setGroupPermissions(groupId, permsStr);
            } else {
                console.warn('[GroupTickets] Could not load group permissions, using globals only.');
                this.permissionService.setGroupPermissions(groupId, []);
            }
        } catch (error) {
            console.error('[GroupTickets] Error fetching group permissions:', error);
            this.permissionService.setGroupPermissions(groupId, []);
        }
    }

    async loadEstados() {
        try {
            const response = await this.apiService.getEstados();
            if (response.statusCode === 200 && Array.isArray(response.data)) {
                this.statusOptions = response.data.map((e: any) => ({
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
                this.priorityOptions = response.data.map((p: any) => ({
                    label: p.nombre,
                    value: p.nombre
                }));
                response.data.forEach((p: any) => {
                    this.prioridadNombreToId.set(p.nombre, p.id);
                    this.prioridadMap.set(p.id, p.nombre);
                });
                this.cdr.detectChanges();
            }
        } catch (error) {
            console.error('Error loading prioridades:', error);
        }
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

                const mappedTickets: Ticket[] = [];

                ticketsData.forEach((t: any) => {
                    if (t.estado_id && t.estado_nombre) {
                        this.estadoNombreToId.set(t.estado_nombre, t.estado_id);
                        this.estadoMap.set(t.estado_id, t.estado_nombre);
                    }
                    if (t.priority_id && t.prioridad_nombre) {
                        this.prioridadNombreToId.set(t.prioridad_nombre, t.priority_id);
                        this.prioridadMap.set(t.priority_id, t.prioridad_nombre);
                    }

                    const estadoNombre = t.estado_nombre || this.estadoMap.get(t.estado_id) || t.status || 'Pendiente';
                    const prioridadNombre = t.prioridad_nombre || this.prioridadMap.get(t.priority_id) || t.priority || 'Media';

                    mappedTickets.push({
                        id: t.id,
                        groupId: t.grupo_id || this.groupId!,
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
                    });
                });

                this.ticketService.upsertTickets(mappedTickets);
            }
        } catch (error) {
            console.error('Error loading tickets:', error);
        }
    }

    emptyArray: Ticket[] = [];
    getTicketsByStatus(status: string): Ticket[] {
        return this.groupedTickets().get(status) || this.emptyArray;
    }

    onDrop(event: { ticket: Ticket, newStatus: string | TicketStatus }) {
        const ticket = event.ticket;
        const newStatus = event.newStatus as TicketStatus;
        if (ticket.status === newStatus) return;
        this.updateTicketStatus(ticket, newStatus);
    }

    async updateTicketStatus(ticket: Ticket, newStatus: TicketStatus) {
        const currentUser = this.authService.currentUser();

        // Kanban D&D validation using group-scoped permissions
        const isOwnerOrAssigned = ticket.assignedTo === currentUser?.id || ticket.creatorId === currentUser?.id;
        const isAdmin = this.permissionService.hasPermission('all') || this.permissionService.hasPermission('ticket:manage') || this.permissionService.hasPermission('group:manage');
        const hasMovePerm = this.permissionService.hasPermission('tickets:move')
            || this.permissionService.hasPermission('ticket:edit')
            || this.permissionService.hasPermission('ticket:edit:state');

        if (!isOwnerOrAssigned && !isAdmin) {
            this.messageService.add({ severity: 'warn', summary: 'No permitido', detail: 'Solo puedes mover tickets asignados a ti o creados por ti.' });
            return;
        }

        if (!hasMovePerm && !isAdmin) {
            this.messageService.add({ severity: 'warn', summary: 'Sin permiso', detail: 'No tienes permiso para cambiar el estado de tickets en este grupo.' });
            return;
        }

        this.ticketService.updateTicket(ticket.id, { status: newStatus });
        this.cdr.detectChanges();

        this.ticketService.addHistoryEntry(
            ticket.id,
            'Cambio de Estado',
            `Estado cambiado a ${newStatus}`,
            currentUser?.username || '',
            currentUser?.nombre || ''
        );

        try {
            const estadoId = this.estadoNombreToId.get(newStatus) || newStatus;
            await this.apiService.changeTicketState(ticket.id, estadoId, currentUser?.id || '');
        } catch (error) {
            console.error('Error updating ticket status in backend:', error);
        }

        this.messageService.add({
            severity: 'success',
            summary: 'Actualizado',
            detail: `Ticket movido a ${newStatus}`
        });
        this.cdr.detectChanges();
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

        if (!this.groupId) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'No se ha detectado el identificador del grupo'
            });
            return;
        }

        const currentUser = this.authService.currentUser();
        const estadoId = this.estadoNombreToId.get(this.newTicket.estado) || this.newTicket.estado;
        const prioridadId = this.prioridadNombreToId.get(this.newTicket.priority) || this.newTicket.priority;

        try {
            const response = await this.apiService.createTicket({
                grupo_id: this.groupId,
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
        // Restore global-only permissions when leaving the group view
        this.permissionService.restoreGlobalPermissions();
        this.router.navigate(['/home']);
    }

    getColumnColor(status: TicketStatus): string {
        const column = this.kanbanColumns.find(c => c.value === status);
        return column?.color || 'blue';
    }

    onGroupSelected(newId: string) {
        if (newId && newId !== this.groupId) {
            this.router.navigate(['/home/group-tickets', newId]);
        }
    }
}