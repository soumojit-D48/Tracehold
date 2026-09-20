import { EventPublisherService } from './event-publisher.service.js';
import { TicketEventType } from '@tracehold/shared';

describe('EventPublisherService', () => {
    it('publishes only the minimal TicketCreated event payload', async () => {
        const publishEvent = vi.fn().mockResolvedValue({ MessageId: 'message-1' });
        const publisher = new EventPublisherService({ publishEvent } as never);
        const event = {
            eventId: 'evt-1',
            eventType: TicketEventType.TICKET_CREATED,
            ticketId: 'ticket-1',
            occurredAt: '2026-09-20T00:00:00.000Z',
        };

        await publisher.publishTicketCreated(event);

        expect(publishEvent).toHaveBeenCalledTimes(1);
        expect(publishEvent).toHaveBeenCalledWith(event);
        expect(Object.keys(publishEvent.mock.calls[0][0])).toEqual([
            'eventId',
            'eventType',
            'ticketId',
            'occurredAt',
        ]);
    });
});
