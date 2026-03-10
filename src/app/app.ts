import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PermissionService } from './services/permission.service';

export const PERMISSIONS = {
  GROUPS: ['groups_view', 'group_view', 'groups_edit', 'groups_delete', 'group_delete', 'groups_add', 'group_add'],
  USERS: ['user_view', 'users_view', 'users_edit', 'user_edit', 'user_delete', 'user_add'],
  TICKETS: ['ticket_view', 'tickets_view', 'tickets_edit', 'ticket_edit', 'ticket_delete', 'ticket_add', 'tickets_add']
};

export const INITIAL_USERS = [
  { id: 1, name: 'Admin', permissions: [...PERMISSIONS.GROUPS, ...PERMISSIONS.USERS, ...PERMISSIONS.TICKETS] },
  { id: 2, name: 'Editor', permissions: ['user_view', 'ticket_view', 'ticket_edit'] },
  { id: 3, name: 'Viewer', permissions: ['user_view', 'ticket_view'] }
];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private permissionService = inject(PermissionService);

  constructor() {
    // Initializing with default user (Admin)
    this.permissionService.setPermissions(INITIAL_USERS[0].permissions);
    console.log('App initialized with Admin permissions');
  }
}
