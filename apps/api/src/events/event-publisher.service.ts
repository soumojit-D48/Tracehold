import { Injectable } from '@nestjs/common';
import { AwsService } from '../aws/aws.service.js';
import { TicketEventType, type TraceholdQueueEvent } from '@tracehold/shared';

export type TicketCreatedEvent = {
    eventId: string;
    eventType: TicketEventType.TICKET_CREATED;
    ticketId: string;
    occurredAt: string;
};

@Injectable()
export class EventPublisherService {
    constructor(private readonly aws: AwsService) { }

    publish(event: TraceholdQueueEvent) {
        return this.aws.publishEvent(event);
    }

    publishTicketCreated(event: TicketCreatedEvent) {
        return this.publish(event);
    }
}
