import { Injectable, signal, computed } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class PermissionService {
    // Signal to store the current user's permissions
    private currentPermissions = signal<string[]>([]);

    constructor() { }

    /**
     * Sets the current permissions (e.g., after login)
     */
    setPermissions(permissions: string[]) {
        this.currentPermissions.set(permissions);
    }

    /**
     * Checks if the user has a specific permission or set of permissions.
     * If an array is provided, it checks if the user has ALL of them.
     */
    hasPermission(permission: string | string[]): boolean {
        const userPerms = this.currentPermissions();
        if (Array.isArray(permission)) {
            return permission.every(p => userPerms.includes(p));
        }
        return userPerms.includes(permission);
    }

    /**
     * Expose the permissions as a read-only signal if needed for computed logic elsewhere
     */
    get permissions() {
        return this.currentPermissions.asReadonly();
    }
}
