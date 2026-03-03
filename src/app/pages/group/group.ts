import { Component, OnInit } from '@angular/core';
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
import { MessageService, ConfirmationService } from 'primeng/api';

export interface GroupData {
  id?: string;
  nivel: string;
  autor: string;
  nombre: string;
  integrantes: number;
  tickets: string;
  descripcion: string;
}

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
    ToolbarModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './group.html',
  styleUrl: './group.css',
})
export class Group implements OnInit {
  groups: GroupData[] = [];
  group: GroupData = {} as GroupData;
  selectedGroups: GroupData[] | null = null;
  groupDialog: boolean = false;
  submitted: boolean = false;

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit() {
    this.groups = [
      { id: '1', nivel: 'Administrador', autor: 'Irving', nombre: 'Desarrollo Core', integrantes: 5, tickets: 'TIC-102', descripcion: 'Mantenimiento del motor principal' },
      { id: '2', nivel: 'Editor', autor: 'Ana', nombre: 'QA Team', integrantes: 3, tickets: 'TIC-045', descripcion: 'Pruebas de regresión' },
      { id: '3', nivel: 'Lector', autor: 'Luis', nombre: 'Soporte', integrantes: 8, tickets: 'TIC-889', descripcion: 'Atención a usuarios finales' }
    ];
  }

  openNew() {
    this.group = {} as GroupData;
    this.submitted = false;
    this.groupDialog = true;
  }

  deleteSelectedGroups() {
    // Implement mass deletion logic if needed
  }

  editGroup(group: GroupData) {
    this.group = { ...group };
    this.groupDialog = true;
  }

  deleteGroup(group: GroupData) {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres eliminar ' + group.nombre + '?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.groups = this.groups.filter(val => val.id !== group.id);
        this.group = {} as GroupData;
        this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Grupo Eliminado', life: 3000 });
      }
    });
  }

  hideDialog() {
    this.groupDialog = false;
    this.submitted = false;
  }

  saveGroup() {
    this.submitted = true;

    if (this.group.nombre.trim()) {
      if (this.group.id) {
        this.groups[this.findIndexById(this.group.id)] = this.group;
        this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Grupo Actualizado', life: 3000 });
      } else {
        this.group.id = this.createId();
        this.groups.push(this.group);
        this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Grupo Creado', life: 3000 });
      }

      this.groups = [...this.groups];
      this.groupDialog = false;
      this.group = {} as GroupData;
    }
  }

  findIndexById(id: string): number {
    let index = -1;
    for (let i = 0; i < this.groups.length; i++) {
      if (this.groups[i].id === id) {
        index = i;
        break;
      }
    }
    return index;
  }

  createId(): string {
    let id = '';
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < 5; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }
}
