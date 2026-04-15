import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { Group } from '../../models/ticket.model';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Router } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    ToastModule,
    ConfirmDialogModule,
    ToolbarModule,
    TagModule,
    HasPermissionDirective,
    ProgressSpinnerModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './group.html',
  styleUrl: './group.css',
})
export class GroupComponent implements OnInit {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  loading = signal(true);

  groups: Group[] = [];
  selectedGroup: Group | null = null;
  groupDialog: boolean = false;
  submitted: boolean = false;

  constructor() { }

  async ngOnInit() {
    this.loading.set(true);
    await this.loadGroups();
    this.loading.set(false);
    this.cdr.detectChanges();
    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  async loadGroups() {
    try {
      const response = await this.apiService.getMyGroups();

      if (response.statusCode === 200 && Array.isArray(response.data)) {
        const groupsData = response.data.map((g: any) => ({
          id: g.grupos?.id || g.id || g.grupo_id,
          name: g.grupos?.nombre || g.nombre || g.name || 'Grupo Sin Nombre',
          description: g.grupos?.descripcion || g.descripcion || g.description || '',
          creatorId: g.grupos?.creador_id || g.creador_id || g.creatorId || '',
          members: g.miembros || g.members || []
        }));

        await Promise.all(groupsData.map(async (group: any) => {
          if (group.id) {
            try {
              const mResp = await this.apiService.getGroupMembers(group.id);
              if (mResp.statusCode === 200 && Array.isArray(mResp.data)) {
                const firstItem = mResp.data[0];
                if (firstItem?.members && Array.isArray(firstItem.members)) {
                  group.members = firstItem.members;
                } else if (firstItem?.usuarios && Array.isArray(firstItem.usuarios)) {
                  group.members = firstItem.usuarios;
                } else {
                  group.members = mResp.data;
                }
              }
            } catch (e) {
              console.error(`Error loading members for ${group.id}:`, e);
            }
          }
        }));

        this.groups = groupsData;
      }
    } catch (error) {
      console.error('Error loading groups:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los grupos'
      });
    }
  }

  selectGroup(group: Group) {
    this.router.navigate(['/home/group-tickets', group.id]);
  }

  goToAdmin(group: Group) {
    this.router.navigate(['/home/admin-group', group.id]);
  }

  openNewGroup() {
    const currentUser = this.authService.currentUser();
    this.selectedGroup = { id: '', name: '', description: '', creatorId: currentUser?.id || '', members: [] };
    this.submitted = false;
    this.groupDialog = true;
  }

  editGroup(group: Group) {
    this.selectedGroup = { ...group };
    this.groupDialog = true;
  }

  deleteGroup(group: Group) {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres eliminar ' + group.name + '?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        const response = await this.apiService.deleteGroup(group.id);
        if (response.statusCode === 200) {
          this.groups = this.groups.filter(val => val.id !== group.id);
          this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Grupo Eliminado', life: 3000 });
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el grupo', life: 3000 });
        }
        this.cdr.detectChanges();
      }
    });
  }

  async saveGroup() {
    this.submitted = true;
    if (this.selectedGroup?.name.trim()) {
      const currentUser = this.authService.currentUser();
      if (this.selectedGroup.id) {
        // Update existing group
        const response = await this.apiService.updateGroup(this.selectedGroup.id, {
          nombre: this.selectedGroup.name,
          descripcion: this.selectedGroup.description
        });
        if (response.statusCode === 200) {
          const index = this.groups.findIndex(g => g.id === this.selectedGroup?.id);
          if (index !== -1) this.groups[index] = this.selectedGroup;
          this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Grupo Actualizado', life: 3000 });
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el grupo', life: 3000 });
        }
      } else {
        // Create new group — include creador_id
        const response = await this.apiService.createGroup({
          nombre: this.selectedGroup.name,
          descripcion: this.selectedGroup.description,
          creador_id: currentUser?.id || ''
        });
        if (response.statusCode === 201 || response.statusCode === 200) {
          await this.loadGroups();
          this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Grupo Creado', life: 3000 });
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el grupo', life: 3000 });
        }
      }
      this.groups = [...this.groups];
      this.groupDialog = false;
      this.cdr.detectChanges();
    }
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}