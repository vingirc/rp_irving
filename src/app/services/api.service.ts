import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { User } from '../models/ticket.model';

export interface ApiResponse<T = any> {
    statusCode: number;
    intOpCode: string;
    data: T;
}

export interface BackendUser {
    id: string;
    email: string;
    username: string;
    nombre_completo: string;
    telefono?: string;
    direccion?: string;
    fecha_nacimiento?: string;
    fecha_inicio?: string;
    last_login?: string;
    estado: boolean;
    permisos_globales: string[];
    creado_en: string;
}

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private readonly API_URL = environment.apiUrl;
    private auth = inject(AuthService);

    mapBackendUserToUser(backendUser: BackendUser): User {
        return {
            id: backendUser.id,
            username: backendUser.username,
            email: backendUser.email,
            fullName: backendUser.nombre_completo || backendUser.username,
            permissions: backendUser.permisos_globales || [],
            avatar: undefined
        };
    }

    mapUserToBackend(user: User): Partial<BackendUser> {
        return {
            username: user.username,
            nombre_completo: user.fullName,
            permisos_globales: user.permissions
        };
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
        const token = this.auth.getToken();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string> || {})
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${this.API_URL}${endpoint}`, {
                ...options,
                headers
            });

            return await response.json();
        } catch (error) {
            console.error('API request error:', error);
            return {
                statusCode: 0,
                intOpCode: 'SxER092',
                data: { error: 'Error de conexión' } as T
            };
        }
    }

    // Groups
    async getGroups() {
        return this.request<any[]>('/groups');
    }

    async getGroup(id: string) {
        return this.request<any>(`/groups/${id}`);
    }

    async createGroup(data: { nombre: string; descripcion?: string }) {
        return this.request<any>('/groups', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateGroup(id: string, data: { nombre?: string; descripcion?: string }) {
        return this.request<any>(`/groups/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async deleteGroup(id: string) {
        return this.request<any>(`/groups/${id}`, {
            method: 'DELETE'
        });
    }

    async getGroupMembers(groupId: string) {
        return this.request<any[]>(`/groups/${groupId}/members`);
    }

    async addGroupMember(groupId: string, userId: string) {
        return this.request<any>('/groups/members', {
            method: 'POST',
            body: JSON.stringify({ grupo_id: groupId, usuario_id: userId })
        });
    }

    async removeGroupMember(groupId: string, userId: string) {
        return this.request<any>('/groups/members', {
            method: 'DELETE',
            body: JSON.stringify({ grupo_id: groupId, usuario_id: userId })
        });
    }

    // Users
    private cachedUsers: User[] | null = null;

    clearUsersCache() {
        this.cachedUsers = null;
    }

    async getUsers(): Promise<ApiResponse<BackendUser[]>> {
        return this.request<BackendUser[]>('/users');
    }

    async getUsersMapped(forceRefresh: boolean = false): Promise<User[]> {
        if (!forceRefresh && this.cachedUsers) {
            return this.cachedUsers;
        }
        const response = await this.getUsers();
        if (response.statusCode === 200 && Array.isArray(response.data)) {
            this.cachedUsers = response.data.map(u => this.mapBackendUserToUser(u));
            return this.cachedUsers;
        }
        return [];
    }

    async getUser(id: string): Promise<ApiResponse<BackendUser>> {
        return this.request<BackendUser>(`/users/${id}`);
    }

    async getUserMapped(id: string): Promise<User | null> {
        const response = await this.getUser(id);
        if (response.statusCode === 200 && response.data) {
            return this.mapBackendUserToUser(response.data);
        }
        return null;
    }

    async createUser(data: { email: string; username: string; nombre: string; permisos_globales?: string[] }) {
        return this.request<any>('/users', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateUser(id: string, data: { username?: string; nombre_completo?: string; permisos_globales?: string[]; estado?: boolean }) {
        return this.request<any>(`/users/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async deleteUser(id: string) {
        return this.request<any>(`/users/${id}`, {
            method: 'DELETE'
        });
    }

    // Permissions
    async getPermissions() {
        return this.request<any[]>('/permissions');
    }

    // Estados y Prioridades
    async getEstados() {
        return this.request<any[]>('/estados');
    }

    async getPrioridades() {
        return this.request<any[]>('/prioridades');
    }

    // Tickets (si se necesitan en el futuro)
    async getTickets() {
        return this.request<any[]>('/tickets');
    }

    async getTicket(id: string) {
        return this.request<any>(`/tickets/${id}`);
    }

    async getTicketsByGroup(groupId: string) {
        return this.request<any[]>(`/tickets/group/${groupId}`);
    }

    async createTicket(data: {
        grupo_id: string;
        titulo: string;
        descripcion?: string;
        autor_id: string;
        estado_id: string;
        priority_id: string;
        asignado_id?: string;
    }) {
        return this.request<any>('/tickets', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateTicket(id: string, data: any) {
        return this.request<any>(`/tickets/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async deleteTicket(id: string) {
        return this.request<any>(`/tickets/${id}`, {
            method: 'DELETE'
        });
    }

    async getTicketComments(ticketId: string) {
        return this.request<any[]>(`/tickets/${ticketId}/comments`);
    }

    async addTicketComment(ticketId: string, autorId: string, contenido: string) {
        return this.request<any>('/tickets/comments', {
            method: 'POST',
            body: JSON.stringify({ ticket_id: ticketId, autor_id: autorId, contenido })
        });
    }

    async changeTicketState(ticketId: string, estadoId: string, usuarioId: string) {
        return this.request<any>(`/tickets/${ticketId}/state`, {
            method: 'PATCH',
            body: JSON.stringify({ estado_id: estadoId, usuario_id: usuarioId })
        });
    }

    async getTicketHistory(ticketId: string) {
        return this.request<any[]>(`/tickets/${ticketId}/history`);
    }
}
