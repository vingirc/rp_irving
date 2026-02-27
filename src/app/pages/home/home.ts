import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ButtonModule, AvatarModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  stats = [
    { title: 'Usuarios Activos', value: '1,245', icon: 'pi-users', color: 'blue' },
    { title: 'Alertas Recientes', value: '12', icon: 'pi-bell', color: 'red' },
    { title: 'Sistemas Seguros', value: '48', icon: 'pi-shield', color: 'green' },
    { title: 'Actualizaciones', value: '3', icon: 'pi-sync', color: 'purple' }
  ];

  recentActivity = [
    { user: 'Admin', action: 'Actualizó configuración de cortafuegos', time: 'hace 2 horas' },
    { user: 'Sistema', action: 'Escaneo de vulnerabilidades completado', time: 'hace 5 horas' },
    { user: 'Juan Pérez', action: 'Inició sesión desde nueva IP', time: 'hace 1 día' }
  ];
}
