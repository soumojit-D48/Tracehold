import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SQSRecord } from 'aws-lambda';
import { TicketEventType } from '@tracehold/shared';
import { parseQueueEvent } from './handler.js';

function record(body: unknown): SQSRecord {
    return {
        messageId: 'msg-1',
        receiptHandle: 'receipt',
        body: typeof body === 'string' ? body : JSON.stringify(body),
        attributes: {
            ApproximateReceiveCount: '1',
            SentTimestamp: '0',
            SenderId: 'local',
            ApproximateFirstReceiveTimestamp: '0',
        },
        messageAttributes: {},
        md5OfBody: 'local',
        eventSource: 'aws:sqs',
        eventSourceARN: 'arn:aws:sqs:us-east-1:000000000000:tracehold-events',
        awsRegion: 'us-east-1',
    };
}

describe('parseQueueEvent', () => {
    it('accepts TicketCreated and EscalationDue payloads', () => {
        const created = parseQueueEvent(record({
            eventId: 'evt-1',
            eventType: TicketEventType.TICKET_CREATED,
            ticketId: 'ticket-1',
            occurredAt: '2026-09-20T00:00:00.000Z',
        }));
        const due = parseQueueEvent(record({
            eventId: 'evt-2',
            eventType: TicketEventType.ESCALATION_DUE,
            ticketId: 'ticket-1',
            occurredAt: '2026-09-21T00:00:00.000Z',
        }));
        assert.equal(created?.eventType, TicketEventType.TICKET_CREATED);
        assert.equal(due?.eventType, TicketEventType.ESCALATION_DUE);
    });

    it('rejects unknown or malformed payloads', () => {
        assert.equal(parseQueueEvent(record({ eventType: 'TicketClosed', ticketId: 'ticket-1' })), null);
        assert.equal(parseQueueEvent(record({ eventType: TicketEventType.ESCALATION_DUE })), null);
        assert.equal(parseQueueEvent(record('not-json')), null);
    });
});
