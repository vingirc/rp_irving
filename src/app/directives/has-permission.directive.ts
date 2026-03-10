import { Directive, Input, TemplateRef, ViewContainerRef, effect, inject } from '@angular/core';
import { PermissionService } from '../services/permission.service';

@Directive({
    selector: '[hasPermission]',
    standalone: true
})
export class HasPermissionDirective {
    private permissionService = inject(PermissionService);
    private templateRef = inject(TemplateRef<any>);
    private viewContainer = inject(ViewContainerRef);

    private permissionsToCheck: string | string[] = [];

    @Input() set hasPermission(val: string | string[]) {
        this.permissionsToCheck = val;
        this.updateView();
    }

    constructor() {
        // Re-evaluate whenever permissions signal changes
        effect(() => {
            // Accessing the signal inside the effect to create a dependency
            this.permissionService.permissions();
            this.updateView();
        });
    }

    private updateView() {
        if (this.permissionService.hasPermission(this.permissionsToCheck)) {
            if (this.viewContainer.length === 0) {
                this.viewContainer.createEmbeddedView(this.templateRef);
            }
        } else {
            this.viewContainer.clear();
        }
    }
}
