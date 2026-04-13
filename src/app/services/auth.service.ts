import { Injectable, signal, computed } from '@angular/core';
import { environment } from '../../environments/environment';

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
    private readonly TOKEN_KEY = 'auth_token';
    private readonly USER_KEY = 'auth_user';

    private _isAuthenticated = signal<boolean>(this.hasToken());
    private _currentUser = signal<{ id: string; email: string; username: string; nombre: string; permissions: string[] } | null>(this.getStoredUser());

    isAuthenticated = this._isAuthenticated.asReadonly();
    currentUser = this._currentUser.asReadonly();
    permissions = computed(() => this._currentUser()?.permissions || []);
    currentUserId = computed(() => this._currentUser()?.id || '');

    private hasToken(): boolean {
        return !!localStorage.getItem(this.TOKEN_KEY);
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
                console.log('[AuthService] Login successful, saving token');
                localStorage.setItem(this.TOKEN_KEY, loginData.token);
                const tokenPayload = this.decodeToken(loginData.token);
                const user = {
                    id: tokenPayload?.sub || '',
                    email: loginData.email || '',
                    username: loginData.username || '',
                    nombre: loginData.nombre || '',
                    permissions: loginData.permissions || []
                };
                localStorage.setItem(this.USER_KEY, JSON.stringify(user));
                this._currentUser.set(user);
                this._isAuthenticated.set(true);
                console.log('[AuthService] Token saved, isAuthenticated:', this._isAuthenticated());
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
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        this._currentUser.set(null);
        this._isAuthenticated.set(false);
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
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
