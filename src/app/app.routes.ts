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
import { authGuard } from './guards/auth.guard';

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
            { path: 'group', component: GroupComponent, data: { title: 'Mis Grupos', icon: 'pi pi-users', permission: 'group:view' } },
            { path: 'group-tickets/:groupId', component: GroupTicketsComponent, data: { title: 'Tickets del Grupo', icon: 'pi pi-ticket', hideFromSidebar: true } },
            { path: 'admin-group/:groupId', component: AdminGroupComponent, data: { title: 'Administración del Grupo', icon: 'pi pi-cog', hideFromSidebar: true } },
            { path: 'user', component: UserComponent, data: { title: 'Mi Perfil', icon: 'pi pi-user' } },
            { path: 'management', component: ManagementComponent, data: { title: 'Gestión de Usuarios', icon: 'pi pi-user-edit', permission: 'user:manage' } }
        ]
    },
    { path: '**', redirectTo: '' }
];
