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
        HasPermissionDirective
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './management.html',
    styleUrl: './management.css'
})
export class ManagementComponent implements OnInit {
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    users: User[] = [
        { id: 'user1', username: 'irving', email: 'irving@example.com', fullName: 'Irving Developer', role: 'admin', permissions: ['all'] },
        { id: 'user2', username: 'ana', email: 'ana@example.com', fullName: 'Ana Quality', role: 'user', permissions: ['read', 'comment'] },
        { id: 'user3', username: 'luis', email: 'luis@example.com', fullName: 'Luis Support', role: 'user', permissions: ['read'] },
        { id: 'user4', username: 'super', email: 'super@example.com', fullName: 'Super Admin', role: 'superAdmin', permissions: ['all'] }
    ];

    roles = [
        { label: 'Super Admin', value: 'superAdmin' },
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' }
    ];

    userDialog: boolean = false;
    selectedUser: User | null = null;
    submitted: boolean = false;

    constructor() { }

    ngOnInit() { }

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
                this.users[index] = this.selectedUser;
                this.messageService.add({ severity: 'success', summary: 'Usuario actualizado', detail: 'Los cambios han sido guardados.' });
            }
            this.userDialog = false;
        }
    }

    getRoleSeverity(role: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | null | undefined {
        switch (role) {
            case 'superAdmin': return 'danger';
            case 'admin': return 'warn';
            default: return 'info';
        }
    }
}
