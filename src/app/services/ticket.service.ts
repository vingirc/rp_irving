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
        // Cargar datos desde localStorage o iniciar vacío
        this.loadFromStorage();
    }

    private loadFromStorage() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                const ticketsWithDates = parsed.map((t: any) => ({
                    ...t,
                    createdAt: new Date(t.createdAt),
                    deadline: t.deadline ? new Date(t.deadline) : undefined,
                    comments: t.comments.map((c: any) => ({ ...c, createdAt: new Date(c.createdAt) })),
                    history: t.history.map((h: any) => ({ ...h, timestamp: new Date(h.timestamp) }))
                }));
                this._tickets.set(ticketsWithDates);
            } catch (e) {
                console.error('Error parsing stored tickets', e);
                this._tickets.set([]);
            }
        }
    }

    setTickets(tickets: Ticket[]) {
        this._tickets.set(tickets);
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

    removeTicket(id: string) {
        this._tickets.update(current => current.filter(t => t.id !== id));
        this.saveToStorage();
    }
}
