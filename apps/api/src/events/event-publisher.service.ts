import { Injectable } from '@nestjs/common';
import { AwsService } from '../aws/aws.service.js';

export type TicketCreatedEvent = {
    eventId: string;
    eventType: 'TicketCreated';
    ticketId: string;
    occurredAt: string;
};

@Injectable()
export class EventPublisherService {
    constructor(private readonly aws: AwsService) { }

    publishTicketCreated(event: TicketCreatedEvent) {
        return this.aws.publishEvent(event);
    }
}