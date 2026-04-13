import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AvatarModule } from 'primeng/avatar';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/ticket.model';

@Component({
    selector: 'app-admin-group',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        CardModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        TagModule,
        ToastModule,
        ConfirmDialogModule,
        AvatarModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './admin-group.html',
    styleUrl: './admin-group.css'
})
export class AdminGroupComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private authService = inject(AuthService);
    private apiService = inject(ApiService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    groupId: string | null = null;
    groupName: string = '';
    groupDescription: string = '';
    loading = signal(true);
    
    members: User[] = [];
    allUsers: User[] = [];
    availableUsers: User[] = [];
    
    editGroupDialog = false;
    addMemberDialog = false;
    newGroupName: string = '';
    newGroupDescription: string = '';
    selectedUserToAdd: User | null = null;
    
    globalFilter: string = '';

    async ngOnInit() {
        this.groupId = this.route.snapshot.paramMap.get('groupId');
        await this.loadGroupInfo();
        await this.loadMembers();
        await this.loadAllUsers();
        this.loading.set(false);
    }

    async loadGroupInfo() {
        if (!this.groupId) return;
        
        const response = await this.apiService.getGroup(this.groupId);
        if (response.statusCode === 200) {
            const data = response.data;
            const group = Array.isArray(data) ? data[0]?.group || data[0] : data;
            this.groupName = group?.nombre || 'Grupo';
            this.groupDescription = group?.descripcion || '';
            this.newGroupName = this.groupName;
            this.newGroupDescription = this.groupDescription;
        }
    }

    async loadMembers() {
        if (!this.groupId) return;

        try {
            const response = await this.apiService.getGroupMembers(this.groupId);
            if (response.statusCode === 200 && Array.isArray(response.data)) {
                const firstItem = response.data[0];
                let membersData: any[] = [];
                
                if (firstItem?.members && Array.isArray(firstItem.members)) {
                    membersData = firstItem.members;
                } else if (firstItem?.usuarios && Array.isArray(firstItem.usuarios)) {
                    membersData = firstItem.usuarios;
                } else {
                    membersData = response.data;
                }

                this.members = membersData.map((m: any) => ({
                    id: m.usuario_id || m.id,
                    username: m.username || m.usuario_username || '',
                    email: m.email || m.usuario_email || '',
                    fullName: m.nombre_completo || m.usuario_nombre || m.username || '',
                    permissions: m.permisos_globales || [],
                    avatar: undefined
                }));
            }
        } catch (error) {
            console.error('Error loading members:', error);
        }
    }

    async loadAllUsers() {
        try {
            this.allUsers = await this.apiService.getUsersMapped();
            this.updateAvailableUsers();
        } catch (error) {
            console.error('Error loading all users:', error);
        }
    }

    updateAvailableUsers() {
        const memberIds = this.members.map(m => m.id);
        this.availableUsers = this.allUsers.filter(u => !memberIds.includes(u.id));
    }

    openEditGroupDialog() {
        this.newGroupName = this.groupName;
        this.newGroupDescription = this.groupDescription;
        this.editGroupDialog = true;
    }

    async saveGroup() {
        if (!this.groupId || !this.newGroupName.trim()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'El nombre del grupo es requerido'
            });
            return;
        }

        try {
            const response = await this.apiService.updateGroup(this.groupId, {
                nombre: this.newGroupName,
                descripcion: this.newGroupDescription
            });

            if (response.statusCode === 200) {
                this.groupName = this.newGroupName;
                this.groupDescription = this.newGroupDescription;
                this.editGroupDialog = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Grupo actualizado correctamente'
                });
            } else {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo actualizar el grupo'
                });
            }
        } catch (error) {
            console.error('Error updating group:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Error de conexión'
            });
        }
    }

    openAddMemberDialog() {
        this.selectedUserToAdd = null;
        this.updateAvailableUsers();
        this.addMemberDialog = true;
    }

    async addMember() {
        if (!this.groupId || !this.selectedUserToAdd) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'Seleccione un usuario'
            });
            return;
        }

        try {
            const response = await this.apiService.addGroupMember(this.groupId, this.selectedUserToAdd.id);

            if (response.statusCode === 201 || response.statusCode === 200) {
                this.members = [...this.members, this.selectedUserToAdd];
                this.updateAvailableUsers();
                this.addMemberDialog = false;
                this.selectedUserToAdd = null;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Miembro agregado correctamente'
                });
            } else {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo agregar el miembro'
                });
            }
        } catch (error) {
            console.error('Error adding member:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Error de conexión'
            });
        }
    }

    removeMember(member: User) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de que quieres remover a ${member.fullName} del grupo?`,
            accept: async () => {
                if (!this.groupId) return;

                try {
                    const response = await this.apiService.removeGroupMember(this.groupId, member.id);

                    if (response.statusCode === 200) {
                        this.members = this.members.filter(m => m.id !== member.id);
                        this.updateAvailableUsers();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'Miembro removido del grupo'
                        });
                    }
                } catch (error) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo remover el miembro'
                    });
                }
            }
        });
    }

    deleteGroup() {
        this.confirmationService.confirm({
            message: `¿Estás seguro de que quieres eliminar el grupo "${this.groupName}"? Esta acción no se puede deshacer.`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: async () => {
                if (!this.groupId) return;

                try {
                    const response = await this.apiService.deleteGroup(this.groupId);

                    if (response.statusCode === 200) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'Grupo eliminado correctamente'
                        });
                        this.router.navigate(['/home']);
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'No se pudo eliminar el grupo'
                        });
                    }
                } catch (error) {
                    console.error('Error deleting group:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error de conexión'
                    });
                }
            }
        });
    }

    goBack() {
        this.router.navigate(['/home']);
    }

    goToGroupTickets() {
        if (this.groupId) {
            this.router.navigate(['/home/group-tickets', this.groupId]);
        }
    }

    getInitials(name: string): string {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    getMemberPermissions(member: User): string[] {
        return member.permissions || [];
    }

    hasPermission(permission: string): boolean {
        return this.authService.hasPermission(permission);
    }
}
