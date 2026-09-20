import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { TicketStatus, shouldEscalateTicket } from '@tracehold/shared';

describe('shouldEscalateTicket', () => {
    const createdAt = new Date('2026-09-01T00:00:00.000Z');

    it('escalates open tickets after 24 demo hours', () => {
        const now = new Date('2026-09-02T00:00:00.000Z');
        assert.equal(shouldEscalateTicket(TicketStatus.OPEN, createdAt, now), true);
    });

    it('does not escalate before the SLA window', () => {
        const now = new Date('2026-09-01T23:59:59.000Z');
        assert.equal(shouldEscalateTicket(TicketStatus.OPEN, createdAt, now), false);
    });

    it('does not escalate resolved or closed tickets', () => {
        const now = new Date('2026-09-04T00:00:00.000Z');
        assert.equal(shouldEscalateTicket(TicketStatus.RESOLVED, createdAt, now), false);
        assert.equal(shouldEscalateTicket(TicketStatus.CLOSED, createdAt, now), false);
        assert.equal(shouldEscalateTicket(TicketStatus.ESCALATED, createdAt, now), false);
    });
});
