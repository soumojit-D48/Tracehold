import type { PoolClient } from 'pg';
import {
    DEMO_CLOCK_ID,
    ESCALATION_SLA_HOURS,
    TicketEventType,
    TicketStatus,
    shouldEscalateTicket,
} from '@tracehold/shared';

export type EscalationOutcome =
    | { ticketId: string; action: 'escalated'; previousStatus: string }
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

        if (!shouldEscalateTicket(ticket.status, ticket.createdAt, now)) {
            await client.query('COMMIT');
            return {
                ticketId,
                action: 'skipped',
                reason: ticket.status === TicketStatus.ESCALATED ? 'already_escalated' : 'sla_not_breached_or_terminal',
            };
        }

        const update = await client.query(
            `UPDATE "Ticket"
             SET status = $2, "updatedAt" = $3
             WHERE id = $1 AND status IN ('OPEN', 'IN_PROGRESS')`,
            [ticketId, TicketStatus.ESCALATED, now],
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
                TicketEventType.TICKET_ESCALATED,
                JSON.stringify({
                    from: ticket.status,
                    to: TicketStatus.ESCALATED,
                    slaHours: ESCALATION_SLA_HOURS,
                    demoNow: now.toISOString(),
                    ticketCreatedAt: ticket.createdAt.toISOString(),
                }),
                now,
            ],
        );
        await client.query('COMMIT');
        return { ticketId, action: 'escalated', previousStatus: ticket.status };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
}
