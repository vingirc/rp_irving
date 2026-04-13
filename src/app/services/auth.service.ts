import { Injectable, signal, computed, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { PermissionService } from './permission.service';

export interface LoginResponse {
    statusCode: number;
    intOpCode: string;
    data: {
        token?: string;
        email?: string;
        username?: string;
        nombre?: string;
        permissions?: string[];
        error?: string;
    };
}

export interface RegisterResponse {
    statusCode: number;
    intOpCode: string;
    data: {
        message?: string;
        email?: string;
        username?: string;
        error?: string;
    };
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly API_URL = environment.apiUrl;
    private readonly TOKEN_COOKIE = 'auth_token';
    private readonly USER_KEY = 'auth_user';

    private permissionService = inject(PermissionService);

    private _isAuthenticated = signal<boolean>(this.hasToken());
    private _currentUser = signal<{ id: string; email: string; username: string; nombre: string; permissions: string[] } | null>(this.getStoredUser());

    isAuthenticated = this._isAuthenticated.asReadonly();
    currentUser = this._currentUser.asReadonly();
    permissions = computed(() => this._currentUser()?.permissions || []);
    currentUserId = computed(() => this._currentUser()?.id || '');

    constructor() {
        // Sync PermissionService with stored permissions on init
        const user = this._currentUser();
        if (user?.permissions) {
            this.permissionService.setPermissions(user.permissions);
        }
    }

    // --- Cookie helpers ---
    private setCookie(name: string, value: string, days: number = 7): void {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict`;
    }

    private getCookie(name: string): string | null {
        const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
        return match ? decodeURIComponent(match[1]) : null;
    }

    private deleteCookie(name: string): void {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict`;
    }

    private hasToken(): boolean {
        return !!this.getCookie(this.TOKEN_COOKIE);
    }

    private getStoredUser(): { id: string; email: string; username: string; nombre: string; permissions: string[] } | null {
        const stored = localStorage.getItem(this.USER_KEY);
        return stored ? JSON.parse(stored) : null;
    }

    async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
        try {
            console.log('[AuthService] Attempting login to:', `${this.API_URL}/auth/login`);
            
            const response = await fetch(`${this.API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            console.log('[AuthService] Response status:', response.status);
            const data = await response.json();
            console.log('[AuthService] Response data:', JSON.stringify(data));

            const loginData = Array.isArray(data.data) ? data.data[0] : data.data;
            console.log('[AuthService] Parsed loginData:', loginData);

            if (data.statusCode === 200 && loginData?.token) {
                console.log('[AuthService] Login successful, saving token to cookie');
                // Store token in cookie
                this.setCookie(this.TOKEN_COOKIE, loginData.token);
                const tokenPayload = this.decodeToken(loginData.token);
                const user = {
                    id: tokenPayload?.sub || '',
                    email: loginData.email || '',
                    username: loginData.username || '',
                    nombre: loginData.nombre || '',
                    permissions: loginData.permissions || []
                };
                // Store user data in localStorage (non-sensitive)
                localStorage.setItem(this.USER_KEY, JSON.stringify(user));
                this._currentUser.set(user);
                this._isAuthenticated.set(true);

                // Sync permissions to PermissionService
                this.permissionService.setPermissions(user.permissions);

                console.log('[AuthService] Token saved to cookie, isAuthenticated:', this._isAuthenticated());
                return { success: true };
            }

            const errorMsg = Array.isArray(data.data) ? data.data[0]?.error : data.data?.error;
            console.log('[AuthService] Login failed:', errorMsg);
            return { success: false, error: errorMsg || 'Error desconocido' };
        } catch (error) {
            console.error('[AuthService] Login error:', error);
            return { success: false, error: 'Error de conexión' };
        }
    }

    async register(email: string, password: string, username: string, nombre: string): Promise<{ success: boolean; error?: string }> {
        try {
            const response = await fetch(`${this.API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, username, nombre })
            });

            const data = await response.json();

            if (data.statusCode === 201) {
                return { success: true };
            }

            const errorMsg = Array.isArray(data.data) ? data.data[0]?.error : data.data?.error;
            return { success: false, error: errorMsg || 'Error desconocido' };
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, error: 'Error de conexión' };
        }
    }

    logout(): void {
        this.deleteCookie(this.TOKEN_COOKIE);
        localStorage.removeItem(this.USER_KEY);
        this._currentUser.set(null);
        this._isAuthenticated.set(false);
        // Clear permissions
        this.permissionService.setPermissions([]);
    }

    getToken(): string | null {
        return this.getCookie(this.TOKEN_COOKIE);
    }

    hasPermission(permission: string): boolean {
        const perms = this.permissions();
        return perms.includes('all') || perms.includes(permission);
    }

    private decodeToken(token: string): any {
        try {
            const payload = token.split('.')[1];
            return JSON.parse(atob(payload));
        } catch {
            return null;
        }
    }
}
