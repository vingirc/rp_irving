import { Routes } from '@angular/router';
import { LandingPage } from './pages/landing-page/landing-page';
import { Login } from './pages/auth/login/login';
import { Register } from './pages/auth/register/register';
import { MainLayout } from './layouts/main-layout/main-layout';
import { Home } from './pages/home/home';
import { GroupComponent } from './pages/group/group';
import { UserComponent } from './pages/user/user';
import { ManagementComponent } from './pages/management/management';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { GroupTicketsComponent } from './pages/group-tickets/group-tickets';
import { AdminGroupComponent } from './pages/admin-group/admin-group';
import { authGuard, permissionGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: '', component: LandingPage },
    { path: 'login', component: Login },
    { path: 'register', component: Register },
    {
        path: 'home',
        component: MainLayout,
        canActivate: [authGuard],
        children: [
            { path: '', component: DashboardComponent, data: { title: 'Panel Principal', icon: 'pi pi-home' } },
            { path: 'group', component: GroupComponent, data: { title: 'Mis Grupos', icon: 'pi pi-users', permission: 'group:view' }, canActivate: [permissionGuard('group:view')] },
            { path: 'group-tickets', component: GroupTicketsComponent, data: { title: 'Tickets de Grupo', icon: 'pi pi-ticket', permission: 'ticket:view' }, canActivate: [permissionGuard('ticket:view')] },
            { path: 'group-tickets/:groupId', component: GroupTicketsComponent, data: { hideFromSidebar: true, permission: 'ticket:view' }, canActivate: [permissionGuard('ticket:view')] },
            { path: 'admin-group', component: AdminGroupComponent, data: { title: 'Admin. de Grupo', icon: 'pi pi-cog', permission: 'group:manage' }, canActivate: [permissionGuard('group:manage')] },
            { path: 'admin-group/:groupId', component: AdminGroupComponent, data: { hideFromSidebar: true, permission: 'group:manage' }, canActivate: [permissionGuard('group:manage')] },
            { path: 'user', component: UserComponent, data: { title: 'Mi Perfil', icon: 'pi pi-user' } },
            { path: 'management', component: ManagementComponent, data: { title: 'Gestión de Usuarios', icon: 'pi pi-user-edit', permission: 'user:manage' }, canActivate: [permissionGuard('user:manage')] }
        ]
    },
    { path: '**', redirectTo: '' }
];
