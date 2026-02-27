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
            { path: '', component: Home },
            { path: 'group', component: Group },
            { path: 'user', component: User }
        ]
    },
    { path: '**', redirectTo: '' }
];
