export const APP_NAME = 'Tracehold';

export enum UserRole {
  TENANT = 'TENANT',
  CONTRACTOR = 'CONTRACTOR',
  LANDLORD = 'LANDLORD',
  ADMIN = 'ADMIN',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  ESCALATED = 'ESCALATED',
  EVIDENCE_READY = 'EVIDENCE_READY',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum TicketSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum TicketEventType {
  TICKET_CREATED = 'TicketCreated',
  TICKET_UPDATED = 'TicketUpdated',
  STATUS_CHANGED = 'StatusChanged',
  TICKET_ESCALATED = 'TicketEscalated',
  EVIDENCE_GENERATED = 'EvidenceGenerated',
  TICKET_RESOLVED = 'TicketResolved',
  TICKET_CLOSED = 'TicketClosed',
}
