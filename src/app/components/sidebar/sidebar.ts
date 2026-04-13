import { Component, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule, ButtonModule, ConfirmDialogModule],
  providers: [ConfirmationService],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private router = inject(Router);
  private authService = inject(AuthService);
  private confirmationService = inject(ConfirmationService);

  menuItems: any[] = [];
  isCollapsed: boolean = true;

  constructor() {
    this.generateMenu();
  }

  generateMenu() {
    const homeRoute = this.router.config.find(r => r.path === 'home');
    if (homeRoute && homeRoute.children) {
      this.menuItems = homeRoute.children
        .filter(route => route.data && route.data['title'])
        .map(route => ({
          path: `/home${route.path ? '/' + route.path : ''}`,
          title: route.data!['title'],
          icon: route.data!['icon'],
          exact: route.path === ''
        }));
    }
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  logout() {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres cerrar sesión?',
      header: 'Cerrar Sesión',
      icon: 'pi pi-sign-out',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    });
  }
}
