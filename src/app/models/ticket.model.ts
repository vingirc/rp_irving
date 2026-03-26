export type TicketStatus = 'Pendiente' | 'En Progreso' | 'Revisión' | 'Hecho' | 'Bloqueado';

export type Priority = 'Muy Baja' | 'Baja' | 'Media' | 'Alta' | 'Muy Alta' | 'Urgente' | 'Inmediato';

export interface TicketComment {
    id: string;
    userId: string;
    userName: string;
    text: string;
    createdAt: Date;
}

export interface HistoryEntry {
    id: string;
    userId: string;
    userName: string;
    action: string;
    details: string;
    timestamp: Date;
}

export interface Ticket {
    id: string;
    groupId: string;
    title: string;
    description: string;
    status: TicketStatus;
    priority: Priority;
    assignedTo?: string; // User ID
    assignedToName?: string;
    creatorId: string;
    creatorName: string;
    createdAt: Date;
    deadline?: Date;
    comments: TicketComment[];
    history: HistoryEntry[];
}

export interface User {
    id: string;
    username: string;
    email: string;
    fullName: string;
    permissions: string[];
    avatar?: string;
}

export interface Group {
    id: string;
    name: string;
    description: string;
    creatorId: string;
    members: string[]; // User IDs
}

export interface GroupMember extends User {
    joinedAt: Date;
}
