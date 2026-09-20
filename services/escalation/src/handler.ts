import type { SQSEvent, SQSRecord } from 'aws-lambda';
import { Pool } from 'pg';
import { TicketEventType, type TraceholdQueueEvent } from '@tracehold/shared';
import { processTicketEscalation, type EscalationOutcome } from './escalate-ticket.js';

export type EscalationBatchResult = {
    processed: number;
    results: EscalationOutcome[];
};

export function parseQueueEvent(record: SQSRecord): TraceholdQueueEvent | null {
    try {
        const body = JSON.parse(record.body) as Partial<TraceholdQueueEvent> & { type?: string };
        const eventType = body.eventType ?? body.type;
        const ticketId = body.ticketId;
        if (!ticketId || typeof ticketId !== 'string') return null;
        if (eventType !== TicketEventType.TICKET_CREATED && eventType !== TicketEventType.ESCALATION_DUE) {
            return null;
        }
        return {
            eventId: body.eventId ?? record.messageId,
            eventType,
            ticketId,
            occurredAt: body.occurredAt ?? new Date().toISOString(),
        };
    } catch {
        return null;
    }
}

export async function handler(event: SQSEvent): Promise<EscalationBatchResult> {
    const records = event.Records ?? [];
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const results: EscalationOutcome[] = [];

    try {
        for (const record of records) {
            const payload = parseQueueEvent(record);
            if (!payload) {
                results.push({
                    ticketId: record.messageId,
                    action: 'skipped',
                    reason: 'unrecognized_payload',
                });
                continue;
            }

            const client = await pool.connect();
            try {
                const result = await processTicketEscalation(client, payload.ticketId);
                results.push(result);
                console.log(JSON.stringify({ event: 'EscalationProcessed', ...result, queueEventId: payload.eventId }));
            } finally {
                client.release();
            }
        }
    } finally {
        await pool.end();
    }

    return { processed: results.length, results };
}
