import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { processTicketEscalation } from './escalate-ticket.js';

describe('processTicketEscalation', () => {
    it('skips missing tickets without writing events', async () => {
        const queries: string[] = [];
        const client = {
            query: async (sql: string) => {
                queries.push(sql);
                if (sql.startsWith('SELECT id, status')) return { rows: [] };
                return { rows: [], rowCount: 0 };
            },
        };

        const result = await processTicketEscalation(client as never, 'missing');
        assert.deepEqual(result, { ticketId: 'missing', action: 'skipped', reason: 'ticket_not_found' });
        assert.equal(queries.some((sql) => sql.startsWith('INSERT')), false);
    });

    it('updates only from the current open state', async () => {
        const now = new Date('2026-09-02T00:00:00.000Z');
        const client = {
            query: async (sql: string) => {
                if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return { rows: [] };
                if (sql.includes('FROM "Ticket"')) {
                    return { rows: [{ id: 'ticket-1', status: 'OPEN', createdAt: new Date('2026-09-01T00:00:00.000Z') }] };
                }
                if (sql.includes('FROM "DemoClock"')) return { rows: [{ now }] };
                if (sql.startsWith('UPDATE')) return { rowCount: 1 };
                if (sql.startsWith('INSERT')) return { rowCount: 1 };
                return { rows: [], rowCount: 0 };
            },
        };

        const result = await processTicketEscalation(client as never, 'ticket-1');
        assert.deepEqual(result, { ticketId: 'ticket-1', action: 'escalated', previousStatus: 'OPEN' });
    });

    it('skips resolved tickets even after the SLA window', async () => {
        const client = {
            query: async (sql: string) => {
                if (sql === 'BEGIN' || sql === 'COMMIT') return { rows: [] };
                if (sql.includes('FROM "Ticket"')) {
                    return { rows: [{ id: 'ticket-1', status: 'RESOLVED', createdAt: new Date('2026-09-01T00:00:00.000Z') }] };
                }
                if (sql.includes('FROM "DemoClock"')) {
                    return { rows: [{ now: new Date('2026-09-04T00:00:00.000Z') }] };
                }
                throw new Error(`unexpected query: ${sql}`);
            },
        };

        const result = await processTicketEscalation(client as never, 'ticket-1');
        assert.equal(result.action, 'skipped');
        assert.equal(result.reason, 'sla_not_breached_or_terminal');
    });

    it('is idempotent when the ticket is already escalated', async () => {
        const client = {
            query: async (sql: string) => {
                if (sql === 'BEGIN' || sql === 'COMMIT') return { rows: [] };
                if (sql.includes('FROM "Ticket"')) {
                    return { rows: [{ id: 'ticket-1', status: 'ESCALATED', createdAt: new Date('2026-09-01T00:00:00.000Z') }] };
                }
                if (sql.includes('FROM "DemoClock"')) {
                    return { rows: [{ now: new Date('2026-09-03T00:00:00.000Z') }] };
                }
                throw new Error(`unexpected query: ${sql}`);
            },
        };

        const result = await processTicketEscalation(client as never, 'ticket-1');
        assert.equal(result.action, 'skipped');
        assert.equal(result.reason, 'already_escalated');
    });
});
