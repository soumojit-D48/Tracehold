import type { PoolClient } from 'pg';
import {
    DEMO_CLOCK_ID,
    EVIDENCE_SLA_HOURS,
    EVIDENCE_SLA_MS,
    ESCALATION_SLA_HOURS,
    ESCALATION_SLA_MS,
    TicketEventType,
    TicketStatus,
} from '@tracehold/shared';

export type EscalationOutcome =
    | { ticketId: string; action: 'escalated' | 'evidence_ready'; previousStatus: string; eventType: string }
    | { ticketId: string; action: 'skipped'; reason: string };

type TicketRow = {
    id: string;
    status: string;
    createdAt: Date;
};

export async function processTicketEscalation(
    client: PoolClient,
    ticketId: string,
): Promise<EscalationOutcome> {
    await client.query('BEGIN');
    try {
        const ticketResult = await client.query<TicketRow>(
            `SELECT id, status, "createdAt" FROM "Ticket" WHERE id = $1 FOR UPDATE`,
            [ticketId],
        );
        const ticket = ticketResult.rows[0];
        if (!ticket) {
            await client.query('COMMIT');
            return { ticketId, action: 'skipped', reason: 'ticket_not_found' };
        }

        const clockResult = await client.query<{ now: Date }>(
            `SELECT now FROM "DemoClock" WHERE id = $1`,
            [DEMO_CLOCK_ID],
        );
        const now = clockResult.rows[0]?.now ?? new Date();
        const elapsed = now.getTime() - ticket.createdAt.getTime();

        const transition = getTransition(ticket.status, elapsed);
        if (!transition) {
            await client.query('COMMIT');
            return {
                ticketId,
                action: 'skipped',
                reason: ticket.status === TicketStatus.ESCALATED
                    ? 'already_escalated'
                    : ticket.status === TicketStatus.EVIDENCE_READY
                        ? 'already_evidence_ready'
                        : 'sla_not_breached_or_terminal',
            };
        }

        const existingEvent = await client.query<{ id: string }>(
            `SELECT id FROM "TicketEvent" WHERE "ticketId" = $1 AND type = $2 LIMIT 1`,
            [ticketId, transition.eventType],
        );
        if (existingEvent.rows.length > 0) {
            await client.query('COMMIT');
            return {
                ticketId,
                action: 'skipped',
                reason: transition.eventType === TicketEventType.ESCALATION_72_HOURS
                    ? 'already_evidence_ready'
                    : 'already_escalated',
            };
        }

        const update = await client.query(
            `UPDATE "Ticket"
             SET status = $2, "updatedAt" = $3
             WHERE id = $1 AND status = $4`,
            [ticketId, transition.status, now, ticket.status],
        );
        if (update.rowCount !== 1) {
            await client.query('COMMIT');
            return { ticketId, action: 'skipped', reason: 'state_changed' };
        }

        await client.query(
            `INSERT INTO "TicketEvent" (id, "ticketId", type, metadata, "createdAt")
             VALUES ($1, $2, $3, $4::jsonb, $5)`,
            [
                crypto.randomUUID(),
                ticketId,
                transition.eventType,
                JSON.stringify({
                    from: ticket.status,
                    to: transition.status,
                    thresholdHours: transition.thresholdHours,
                    demoNow: now.toISOString(),
                    ticketCreatedAt: ticket.createdAt.toISOString(),
                }),
                now,
            ],
        );
        await client.query('COMMIT');
        return {
            ticketId,
            action: transition.action,
            previousStatus: ticket.status,
            eventType: transition.eventType,
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
}

function getTransition(status: string, elapsedMs: number) {
    if (status === TicketStatus.ESCALATED && elapsedMs >= EVIDENCE_SLA_MS) {
        return {
            action: 'evidence_ready' as const,
            status: TicketStatus.EVIDENCE_READY,
            eventType: TicketEventType.ESCALATION_72_HOURS,
            thresholdHours: EVIDENCE_SLA_HOURS,
        };
    }

    if ((status === TicketStatus.OPEN || status === TicketStatus.IN_PROGRESS) && elapsedMs >= EVIDENCE_SLA_MS) {
        return {
            action: 'evidence_ready' as const,
            status: TicketStatus.EVIDENCE_READY,
            eventType: TicketEventType.ESCALATION_72_HOURS,
            thresholdHours: EVIDENCE_SLA_HOURS,
        };
    }

    if ((status === TicketStatus.OPEN || status === TicketStatus.IN_PROGRESS) && elapsedMs >= ESCALATION_SLA_MS) {
        return {
            action: 'escalated' as const,
            status: TicketStatus.ESCALATED,
            eventType: TicketEventType.ESCALATION_24_HOURS,
            thresholdHours: ESCALATION_SLA_HOURS,
        };
    }

    return null;
}
