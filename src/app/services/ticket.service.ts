import { Injectable, signal } from '@angular/core';
import { Ticket, TicketStatus, Priority, TicketComment, HistoryEntry } from '../models/ticket.model';

@Injectable({
    providedIn: 'root'
})
export class TicketService {
    private readonly STORAGE_KEY = 'rp_tickets_data';
    private _tickets = signal<Ticket[]>([]);
    tickets = this._tickets.asReadonly();

    constructor() {
        this.loadInitialData();
    }

    private loadInitialData() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Convert date strings back to Date objects
                const ticketsWithDates = parsed.map((t: any) => ({
                    ...t,
                    createdAt: new Date(t.createdAt),
                    deadline: t.deadline ? new Date(t.deadline) : undefined,
                    comments: t.comments.map((c: any) => ({ ...c, createdAt: new Date(c.createdAt) })),
                    history: t.history.map((h: any) => ({ ...h, timestamp: new Date(h.timestamp) }))
                }));
                this._tickets.set(ticketsWithDates);
                return;
            } catch (e) {
                console.error('Error parsing stored tickets', e);
            }
        }

        const initialTickets: Ticket[] = [
            {
                id: 'TIC-001',
                groupId: '1',
                title: 'Corregir error en el motor core',
                description: 'Se ha detectado un bug en el procesamiento de colas del motor principal.',
                status: 'Pendiente',
                priority: 'Urgente',
                creatorId: 'user1',
                creatorName: 'Irving',
                createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
                deadline: new Date(Date.now() + 86400000 * 3), // 3 days from now
                comments: [],
                history: [
                    {
                        id: 'H-001',
                        userId: 'user1',
                        userName: 'Irving',
                        action: 'Creado',
                        details: 'Ticket creado inicialmente',
                        timestamp: new Date(Date.now() - 86400000 * 2)
                    }
                ]
            },
            {
                id: 'TIC-002',
                groupId: '1',
                title: 'Actualizar documentación API',
                description: 'La documentación de los endpoints de seguridad está desactualizada.',
                status: 'En Progreso',
                priority: 'Media',
                assignedTo: 'user2',
                assignedToName: 'Ana',
                creatorId: 'user1',
                creatorName: 'Irving',
                createdAt: new Date(Date.now() - 86400000 * 5),
                comments: [
                    {
                        id: 'C-001',
                        userId: 'user2',
                        userName: 'Ana',
                        text: 'He empezado con los endpoints de auth.',
                        createdAt: new Date(Date.now() - 86400000)
                    }
                ],
                history: []
            },
            {
                id: 'TIC-003',
                groupId: '1',
                title: 'Review de seguridad trimestral',
                description: 'Realizar scan de vulnerabilidades en todos los grupos.',
                status: 'Hecho',
                priority: 'Muy Alta',
                assignedTo: 'user1',
                assignedToName: 'Irving',
                creatorId: 'user3',
                creatorName: 'Luis',
                createdAt: new Date(Date.now() - 86400000 * 10),
                comments: [],
                history: []
            },
            {
                id: 'TIC-004',
                groupId: '2',
                title: 'Test de carga QA',
                description: 'Verificar estabilidad bajo carga de 10k usuarios concurrentes.',
                status: 'Bloqueado',
                priority: 'Alta',
                creatorId: 'user2',
                creatorName: 'Ana',
                createdAt: new Date(Date.now() - 86400000),
                comments: [],
                history: []
            }
        ];
        this._tickets.set(initialTickets);
        this.saveToStorage();
    }

    private saveToStorage() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.tickets()));
    }

    getTicketsByGroup(groupId: string) {
        return this.tickets().filter(t => t.groupId === groupId);
    }

    getTicketById(id: string) {
        return this.tickets().find(t => t.id === id);
    }

    addTicket(ticket: Partial<Ticket>) {
        const newTicket: Ticket = {
            id: `TIC-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
            createdAt: new Date(),
            comments: [],
            history: [],
            ...ticket
        } as Ticket;

        this._tickets.update(current => [...current, newTicket]);
        this.saveToStorage();
        return newTicket;
    }

    updateTicket(id: string, updates: Partial<Ticket>) {
        this._tickets.update(current =>
            current.map(t => t.id === id ? { ...t, ...updates } : t)
        );
        this.saveToStorage();
    }

    addComment(ticketId: string, comment: string, userId: string, userName: string) {
        const newComment: TicketComment = {
            id: Math.random().toString(36).substr(2, 9),
            userId,
            userName,
            text: comment,
            createdAt: new Date()
        };

        this.updateTicket(ticketId, {
            comments: [...(this.getTicketById(ticketId)?.comments || []), newComment]
        });
    }

    addHistoryEntry(ticketId: string, action: string, details: string, userId: string, userName: string) {
        const entry: HistoryEntry = {
            id: Math.random().toString(36).substr(2, 9),
            userId,
            userName,
            action,
            details,
            timestamp: new Date()
        };

        this.updateTicket(ticketId, {
            history: [...(this.getTicketById(ticketId)?.history || []), entry]
        });
    }
}
