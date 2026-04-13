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
            { path: '', component: DashboardComponent, data: { title: 'Dashboard', icon: 'pi pi-home' } },
            { path: 'group', component: GroupComponent, data: { title: 'Grupos', icon: 'pi pi-users' } },
            { path: 'group-tickets/:groupId', component: GroupTicketsComponent, data: { title: 'Tickets', icon: 'pi pi-ticket' } },
            { path: 'admin-group/:groupId', component: AdminGroupComponent, data: { title: 'Admin Grupo', icon: 'pi pi-cog' } },
            { path: 'user', component: UserComponent, data: { title: 'Perfil', icon: 'pi pi-user' } },
            { path: 'management', component: ManagementComponent, data: { title: 'Gestión de usuarios', icon: 'pi pi-cog' } }
        ]
    },
    { path: '**', redirectTo: '' }
];
