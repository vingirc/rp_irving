import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { TagModule } from 'primeng/tag';
import { Ticket, TicketStatus, Priority } from '../../models/ticket.model';

export interface KanbanColumn {
    label: string;
    value: TicketStatus | string;
    color: string;
}

@Component({
    selector: 'app-kanban-board',
    standalone: true,
    imports: [CommonModule, DragDropModule, TagModule],
    templateUrl: './kanban-board.html',
    styleUrl: './kanban-board.css'
})
export class KanbanBoardComponent {
    /** The reactive list of tickets to be distributed across columns */
    @Input() set tickets(value: Ticket[]) {
        this._tickets.set(value);
    }
    
    /** The column configuration detailing available statuses */
    @Input() columns: KanbanColumn[] = [];
    
    /** Emitted when a ticket is dropped on a column, carrying the ticket mapping to its new status */
    @Output() onTicketDrop = new EventEmitter<{ ticket: Ticket, newStatus: TicketStatus | string }>();
    
    /** Emitted when a ticket card is fully clicked */
    @Output() onTicketClick = new EventEmitter<Ticket>();

    private _tickets = signal<Ticket[]>([]);

    /** Reactively groups the tickets based on their specific status */
    groupedTickets = computed(() => {
        const map = new Map<string, Ticket[]>();
        this._tickets().forEach(ticket => {
            const list = map.get(ticket.status) || [];
            list.push(ticket);
            map.set(ticket.status, list);
        });
        return map;
    });

    /** Retrieves the tickets specific to a single kanban column */
    getTicketsByStatus(status: string): Ticket[] {
        return this.groupedTickets().get(status) || [];
    }

    /** Intercepts drop events and bubbles them up if there was a status shift */
    handleDrop(event: CdkDragDrop<any>, newStatus: string) {
        const ticket = event.item.data as Ticket;
        if (ticket.status !== newStatus) {
            this.onTicketDrop.emit({ ticket, newStatus });
        }
    }

    handleTicketClick(ticket: Ticket) {
        this.onTicketClick.emit(ticket);
    }

    /** Mappings for visual Tag indicators */
    getSeverity(color: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
        const map: Record<string, "success" | "info" | "warn" | "danger" | "secondary" | "contrast"> = {
            'blue': 'info',
            'orange': 'warn',
            'purple': 'secondary',
            'green': 'success',
            'red': 'danger'
        };
        return map[color] || 'info';
    }

    getPrioritySeverity(priority: Priority | string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
        const map: Record<string, "success" | "info" | "warn" | "danger" | "secondary" | "contrast"> = {
            'Muy Baja': 'secondary',
            'Baja': 'info',
            'Media': 'info',
            'Alta': 'warn',
            'Muy Alta': 'warn',
            'Urgente': 'danger',
            'Inmediato': 'danger'
        };
        return map[priority as string] || 'info';
    }
}
