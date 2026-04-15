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

    // Default permission map provided from known static backend IDs, 
    // ensuring synchronous evaluations during app initialization don't fail.
    private permissionMap = new Map<string, string>([
        ["group:add", "43c950d0-59e5-489d-a288-4a580358075e"],
        ["group:delete", "1779ceb5-62c1-40e1-9f18-4b7c6f3bdef7"],
        ["group:edit", "b5687416-8520-458d-a6cb-1e897d1cff42"],
        ["group:manage", "b8c40e4a-67cd-433b-b711-4ff1d0216bbe"],
        ["group:view", "a58720ec-d112-4eb7-87d7-ea48b74ff5a4"],
        ["ticket:add", "2ebf3e04-5ffb-4e6b-bd5c-6887dc58cdd4"],
        ["ticket:delete", "5a2b04dd-12f2-476f-bf16-85fdedc0abb4"],
        ["ticket:edit", "c3928d10-2a22-42c1-ad71-0d893bad23cd"],
        ["ticket:edit:comment", "d154444f-4fe1-4d8c-8329-348852289416"],
        ["ticket:edit:state", "8ea54a88-33aa-4e57-837b-ac4e4768f553"],
        ["ticket:manage", "3b7c9860-5346-41a0-abf1-4d5f1a278813"],
        ["ticket:view", "d7ea6eeb-52b8-402c-80f6-2a133864e735"],
        ["user:add", "3f9af9b5-a0f0-4cb7-b5ed-dbe99158aca0"],
        ["user:delete", "e1df15c9-7377-459b-92af-7dd017bbf663"],
        ["user:edit", "2b17dc3d-dc7c-4e6d-bf71-da9dac945192"],
        ["user:edit:profile", "bef25359-15f9-4e77-81a0-b8c4602c78c4"],
        ["user:manage", "84b6031e-30e6-446f-a3ac-471c86dd7b90"],
        ["user:view", "eced0b49-19b3-4ac9-a55c-384b52b7cb20"]
    ]);

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
     * Replaces the static permission dictionary with fresh definitions from the backend.
     * Call this after login or on application start if a token exists.
     */
    syncPermissionMap(definitions: {id: string, nombre: string}[]) {
        definitions.forEach(p => {
             this.permissionMap.set(p.nombre, p.id);
             this.permissionMap.set(p.id, p.id);
        });
    }

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

        const checkSingle = (p: string) => {
            // Map nominal request to corresponding UUID, or fallback if passing direct UUID
            const targetUuid = this.permissionMap.get(p) || p;
            return userPerms.includes(targetUuid) || userPerms.includes(p);
        };

        if (Array.isArray(permission)) {
            return permission.every(p => checkSingle(p));
        }
        return checkSingle(permission);
    }

    /**
     * Expose the active permissions as a read-only signal for reactive UI (e.g., HasPermissionDirective).
     */
    get permissions() {
        return this.activePermissions;
    }
}
