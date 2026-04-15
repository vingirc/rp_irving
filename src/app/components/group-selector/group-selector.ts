import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';

export interface DropdownGroup {
    id: string;
    nombre: string;
}

@Component({
    selector: 'app-group-selector',
    standalone: true,
    imports: [CommonModule, FormsModule, SelectModule],
    template: `
        <div class="group-selector flex align-items-center">
            <span class="mr-2 text-700 font-medium" *ngIf="showLabel">{{ label }}</span>
            <p-select 
                *ngIf="groups && groups.length > 0; else noGroups"
                [options]="groups" 
                [ngModel]="selectedGroupId" 
                (ngModelChange)="onSelectionChange($event)"
                optionLabel="nombre" 
                optionValue="id"
                [placeholder]="placeholder"
                [style]="{'min-width': minWidth}">
            </p-select>
            <ng-template #noGroups>
                <p-select 
                    [options]="[{nombre: emptyMessage, id: ''}]"
                    [disabled]="true"
                    [style]="{'min-width': minWidth}">
                </p-select>
            </ng-template>
        </div>
    `
})
export class GroupSelectorComponent {
    @Input() groups: DropdownGroup[] = [];
    @Input() selectedGroupId: string | null = null;
    @Input() label: string = 'Grupo:';
    @Input() showLabel: boolean = true;
    @Input() placeholder: string = 'Seleccionar Grupo';
    @Input() emptyMessage: string = 'No hay grupos disponibles';
    @Input() minWidth: string = '200px';

    @Output() selectedGroupIdChange = new EventEmitter<string>();

    onSelectionChange(newVal: string) {
        this.selectedGroupIdChange.emit(newVal);
    }
}
