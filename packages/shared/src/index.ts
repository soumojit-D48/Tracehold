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
  ESCALATION_24_HOURS = 'Escalation24Hours',
  ESCALATION_72_HOURS = 'Escalation72Hours',
  EVIDENCE_GENERATED = 'EvidenceGenerated',
  TICKET_RESOLVED = 'TicketResolved',
  TICKET_CLOSED = 'TicketClosed',
  ESCALATION_DUE = 'EscalationDue',
}

export const DEMO_CLOCK_ID = 'global';
export const ESCALATION_SLA_HOURS = 24;
export const ESCALATION_SLA_MS = ESCALATION_SLA_HOURS * 60 * 60 * 1000;
export const EVIDENCE_SLA_HOURS = 72;
export const EVIDENCE_SLA_MS = EVIDENCE_SLA_HOURS * 60 * 60 * 1000;
export const ESCALATABLE_STATUSES = [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] as const;

export type QueueEventType = TicketEventType.TICKET_CREATED | TicketEventType.ESCALATION_DUE;

export type TraceholdQueueEvent = {
  eventId: string;
  eventType: QueueEventType;
  ticketId: string;
  occurredAt: string;
};

export function isEscalatableStatus(status: string): boolean {
  return (ESCALATABLE_STATUSES as readonly string[]).includes(status);
}

export function isSlaBreached(createdAt: Date, now: Date, slaMs = ESCALATION_SLA_MS): boolean {
  return now.getTime() - createdAt.getTime() >= slaMs;
}

export function shouldEscalateTicket(status: string, createdAt: Date, now: Date): boolean {
  return isEscalatableStatus(status) && isSlaBreached(createdAt, now);
}
