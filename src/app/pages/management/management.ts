import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { User } from '../../models/ticket.model';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { MultiSelectModule } from 'primeng/multiselect';
import { PermissionService } from '../../services/permission.service';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-management',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        TagModule,
        DialogModule,
        InputTextModule,
        SelectModule,
        ToastModule,
        ConfirmDialogModule,
        HasPermissionDirective,
        MultiSelectModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './management.html',
    styleUrl: './management.css'
})
export class ManagementComponent implements OnInit {
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private permissionService = inject(PermissionService);
    private apiService = inject(ApiService);
    private cdr = inject(ChangeDetectorRef);

    availablePermissions: { id: string; nombre: string; descripcion: string }[] = [];
    permissionMap: Map<string, string> = new Map();

    allAvailablePermissions: { label: string; value: string }[] = [];

    users: User[] = [];

    userDialog: boolean = false;
    selectedUser: User | null = null;
    submitted: boolean = false;
    loading: boolean = false;

    async ngOnInit() {
        this.loading = true;
        this.cdr.detectChanges();
        try {
            await this.loadPermissions();
            await this.loadUsers();
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    async loadPermissions() {
        const response = await this.apiService.getPermissions();
        if (response.statusCode === 200 && Array.isArray(response.data)) {
            let perms: any[] = [];
            
            const firstItem = response.data[0];
            if (firstItem?.permissions && Array.isArray(firstItem.permissions)) {
                perms = firstItem.permissions;
            } else {
                perms = response.data;
            }
            
            this.availablePermissions = perms.map(p => ({
                id: p.id,
                nombre: p.nombre,
                descripcion: p.descripcion
            }));
            
            this.availablePermissions.forEach(p => {
                this.permissionMap.set(p.id, p.nombre);
            });
            
            this.allAvailablePermissions = this.availablePermissions.map(p => ({
                label: p.descripcion || p.nombre,
                value: p.nombre
            }));
            
            if (!this.allAvailablePermissions.find(p => p.value === 'all')) {
                this.allAvailablePermissions.unshift({ label: 'Acceso Total', value: 'all' });
            }
        }
    }

    async loadUsers() {
        try {
            this.users = await this.apiService.getUsersMapped();
        } catch (error) {
            console.error('Error loading users:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudieron cargar los usuarios'
            });
        }
    }

    editUser(user: User) {
        this.selectedUser = { ...user };
        this.userDialog = true;
        this.submitted = false;
    }

    async deleteUser(user: User) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de que quieres eliminar a ${user.fullName}?`,
            accept: async () => {
                const response = await this.apiService.deleteUser(user.id);
                if (response.statusCode === 200) {
                    this.apiService.clearUsersCache();
                    this.users = this.users.filter(u => u.id !== user.id);
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Usuario eliminado',
                        detail: 'El usuario ha sido removido del sistema.'
                    });
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo eliminar el usuario'
                    });
                }
                this.cdr.detectChanges();
            }
        });
    }

    async saveUser() {
        this.submitted = true;
        if (this.selectedUser?.fullName?.trim()) {
            const response = await this.apiService.updateUser(this.selectedUser.id, {
                nombre_completo: this.selectedUser.fullName,
                permisos_globales: this.selectedUser.permissions
            });
            if (response.statusCode === 200) {
                this.apiService.clearUsersCache();
                const index = this.users.findIndex(u => u.id === this.selectedUser?.id);
                if (index !== -1 && this.selectedUser) {
                    this.users[index] = { ...this.selectedUser };
                }
                this.messageService.add({
                    severity: 'success',
                    summary: 'Usuario actualizado',
                    detail: 'Los cambios han sido guardados.'
                });
                this.userDialog = false;
            } else {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron guardar los cambios'
                });
            }
            this.cdr.detectChanges();
        }
    }

    getPermissionLabel(value: string): string {
        if (value === 'all') return 'Acceso Total';
        const permission = this.allAvailablePermissions.find(p => p.value === value);
        if (permission) return permission.label;
        const mapped = this.permissionMap.get(value);
        return mapped || value;
    }

    get assignablePermissions() {
        const userPerms = this.permissionService.permissions();
        if (userPerms.includes('all')) {
            return this.allAvailablePermissions;
        }
        return this.allAvailablePermissions.filter(p => userPerms.includes(p.value));
    }
}
