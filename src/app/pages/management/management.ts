import { Component, OnInit, inject } from '@angular/core';
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

    allAvailablePermissions = [
        { label: 'Acceso Total', value: 'all' },
        { label: 'Ver Usuarios', value: 'users_view' },
        { label: 'Editar Usuarios', value: 'user_edit' },
        { label: 'Eliminar Usuarios', value: 'user_delete' },
        { label: 'Agregar Usuarios', value: 'user_add' },
        { label: 'Ver Tickets', value: 'ticket_view' },
        { label: 'Crear Tickets', value: 'ticket_add' },
        { label: 'Editar Tickets', value: 'ticket_edit' },
        { label: 'Eliminar Tickets', value: 'ticket_delete' },
        { label: 'Ver Grupos', value: 'groups_view' },
        { label: 'Crear Grupos', value: 'group_add' },
        { label: 'Eliminar Grupos', value: 'group_delete' }
    ];

    users: User[] = [
        { id: 'user1', username: 'irving', email: 'irving@example.com', fullName: 'Irving Developer', permissions: ['all'] },
        { id: 'user2', username: 'ana', email: 'ana@example.com', fullName: 'Ana Quality', permissions: ['ticket_view', 'groups_view'] },
        { id: 'user3', username: 'luis', email: 'luis@example.com', fullName: 'Luis Support', permissions: ['ticket_view', 'ticket_edit'] },
        { id: 'user4', username: 'super', email: 'super@example.com', fullName: 'Super Admin', permissions: ['all'] }
    ];

    userDialog: boolean = false;
    selectedUser: User | null = null;
    submitted: boolean = false;

    constructor() { }

    ngOnInit() {
        // No loading required for mock data
    }

    loadUsers() {
        // Data is already local
    }

    editUser(user: User) {
        this.selectedUser = { ...user };
        this.userDialog = true;
    }

    deleteUser(user: User) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de que quieres eliminar a ${user.fullName}?`,
            accept: () => {
                this.users = this.users.filter(u => u.id !== user.id);
                this.messageService.add({ severity: 'success', summary: 'Usuario eliminado', detail: 'El usuario ha sido removido del sistema.' });
            }
        });
    }

    saveUser() {
        this.submitted = true;
        if (this.selectedUser?.fullName.trim()) {
            const index = this.users.findIndex(u => u.id === this.selectedUser?.id);
            if (index !== -1) {
                this.users[index] = { ...this.selectedUser };
                this.messageService.add({ severity: 'success', summary: 'Usuario actualizado', detail: 'Los cambios han sido guardados.' });
            }
            this.userDialog = false;
        }
    }

    getPermissionLabel(value: string): string {
        const permission = this.allAvailablePermissions.find(p => p.value === value);
        return permission ? permission.label : value;
    }

    get assignablePermissions() {
        const userPerms = this.permissionService.permissions();
        // Super admins can assign anything
        if (userPerms.includes('all')) {
            return this.allAvailablePermissions;
        }
        // Others can only assign permissions they already have
        return this.allAvailablePermissions.filter(p => userPerms.includes(p.value));
    }
}
