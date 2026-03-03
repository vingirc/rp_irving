import { Routes } from '@angular/router';
import { LandingPage } from './pages/landing-page/landing-page';
import { Login } from './pages/auth/login/login';
import { Register } from './pages/auth/register/register';
import { MainLayout } from './layouts/main-layout/main-layout';
import { Home } from './pages/home/home';
import { Group } from './pages/group/group';
import { User } from './pages/user/user';

export const routes: Routes = [
    { path: '', component: LandingPage },
    { path: 'login', component: Login },
    { path: 'register', component: Register },
    {
        path: 'home',
        component: MainLayout,
        children: [
            { path: '', component: Home, data: { title: 'Inicio', icon: 'pi pi-home' } },
            { path: 'group', component: Group, data: { title: 'Grupos', icon: 'pi pi-users' } },
            { path: 'user', component: User, data: { title: 'Perfil', icon: 'pi pi-user' } }
        ]
    },
    { path: '**', redirectTo: '' }
];
