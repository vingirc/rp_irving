import { Injectable, signal, computed } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class PermissionService {
    // Global permissions set at login
    private globalPermissions = signal<string[]>([]);

    // Group-scoped permissions loaded when entering a group view
    private groupPermissions = signal<string[]>([]);

    // The currently active group context (null = no group context)
    private activeGroupId = signal<string | null>(null);

    /**
     * Active permissions: merges global + group-scoped.
     * When a group context is active, group permissions are added on top of globals.
     */
    private activePermissions = computed(() => {
        const global = this.globalPermissions();
        const group = this.groupPermissions();
        if (group.length === 0) return global;
        // Merge without duplicates
        return [...new Set([...global, ...group])];
    });

    constructor() { }

    /**
     * Sets the global permissions (e.g., after login).
     * Clears any group context.
     */
    setPermissions(permissions: string[]) {
        this.globalPermissions.set(permissions);
        // Reset group context when global perms are set (login/logout)
        this.groupPermissions.set([]);
        this.activeGroupId.set(null);
    }

    /**
     * Sets group-scoped permissions for a specific group.
     * The caller (component) is responsible for fetching them from the API.
     */
    setGroupPermissions(groupId: string, permissions: string[]): void {
        this.groupPermissions.set(permissions);
        this.activeGroupId.set(groupId);
    }

    /**
     * Clears the group context and restores to global-only permissions.
     * Call this when navigating away from a group view.
     */
    restoreGlobalPermissions(): void {
        this.groupPermissions.set([]);
        this.activeGroupId.set(null);
    }

    /**
     * Returns the current active group ID (or null if no group context).
     */
    getActiveGroupId(): string | null {
        return this.activeGroupId();
    }

    /**
     * Checks if the user has a specific permission or set of permissions,
     * considering both global and group-scoped permissions.
     * If an array is provided, it checks if the user has ALL of them.
     */
    hasPermission(permission: string | string[]): boolean {
        const userPerms = this.activePermissions();
        if (userPerms.includes('all')) {
            return true;
        }
        if (Array.isArray(permission)) {
            return permission.every(p => userPerms.includes(p));
        }
        return userPerms.includes(permission);
    }

    /**
     * Expose the active permissions as a read-only signal for reactive UI (e.g., HasPermissionDirective).
     */
    get permissions() {
        return this.activePermissions;
    }
}
