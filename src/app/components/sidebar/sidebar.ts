import { Component, inject, effect, signal } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';
import { PermissionService } from '../../services/permission.service';

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
  private permissionService = inject(PermissionService);
  private confirmationService = inject(ConfirmationService);

  menuItems = signal<any[]>([]);
  isCollapsed: boolean = true;

  constructor() {
    // Reactively regenerate menu whenever permissions change
    effect(() => {
      // Read the permissions signal to create a dependency
      const perms = this.permissionService.permissions();
      console.log('[Sidebar] Permissions changed, regenerating menu. Active permissions:', perms);
      this.generateMenu();
    });
  }

  generateMenu() {
    const homeRoute = this.router.config.find(r => r.path === 'home');
    if (homeRoute && homeRoute.children) {
      const items = homeRoute.children
        .filter(route => route.data && route.data['title'] && !route.data['hideFromSidebar'])
        .filter(route => {
          const requiredPerm = route.data!['permission'];
          if (!requiredPerm) return true; // No permission required, always show
          const hasPerm = this.authService.hasPermission(requiredPerm);
          console.log(`[Sidebar] Route "${route.data!['title']}" requires "${requiredPerm}" => ${hasPerm}`);
          return hasPerm;
        })
        .map(route => ({
          path: `/home${route.path ? '/' + route.path : ''}`,
          title: route.data!['title'],
          icon: route.data!['icon'],
          exact: route.path === ''
        }));
      console.log('[Sidebar] Generated menu items:', items.map(i => i.title));
      this.menuItems.set(items);
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
