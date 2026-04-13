import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    console.log('[AuthGuard] Checking authentication...');
    console.log('[AuthGuard] Token in localStorage:', localStorage.getItem('auth_token'));
    console.log('[AuthGuard] isAuthenticated():', authService.isAuthenticated());

    if (authService.isAuthenticated()) {
        console.log('[AuthGuard] User is authenticated, allowing access');
        return true;
    }

    console.log('[AuthGuard] User is NOT authenticated, redirecting to login');
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
};

export const permissionGuard = (requiredPermission: string): CanActivateFn => {
    return (route, state) => {
        const authService = inject(AuthService);
        const router = inject(Router);

        if (!authService.isAuthenticated()) {
            router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
            return false;
        }

        if (authService.hasPermission(requiredPermission) || authService.hasPermission('all')) {
            return true;
        }

        router.navigate(['/home']);
        return false;
    };
};
