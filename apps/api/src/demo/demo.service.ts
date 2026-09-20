import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import {
    DEMO_CLOCK_ID,
    ESCALATABLE_STATUSES,
    ESCALATION_SLA_MS,
    TicketEventType,
    type TraceholdQueueEvent,
} from '@tracehold/shared';
import { AuthUser } from '../auth/auth.types.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { EventPublisherService } from '../events/event-publisher.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SetDemoClockDto } from './dto/set-demo-clock.dto.js';

@Injectable()
export class DemoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly authorization: AuthorizationService,
        private readonly eventPublisher: EventPublisherService,
    ) { }

    async getClock(user: AuthUser) {
        this.authorization.authorize(user, 'SetDemoClock', this.authorization.systemResource());
        return this.readClock();
    }

    async setClock(dto: SetDemoClockDto, user: AuthUser) {
        this.authorization.authorize(user, 'SetDemoClock', this.authorization.systemResource());
        const now = new Date(dto.now);
        return this.prisma.demoClock.upsert({
            where: { id: DEMO_CLOCK_ID },
            update: { now },
            create: { id: DEMO_CLOCK_ID, now },
        });
    }

    async evaluateEscalations(user: AuthUser) {
        this.authorization.authorize(user, 'EvaluateEscalations', this.authorization.systemResource());
        const clock = await this.readClock();
        const cutoff = new Date(clock.now.getTime() - ESCALATION_SLA_MS);
        const tickets = await this.prisma.ticket.findMany({
            where: {
                status: { in: [...ESCALATABLE_STATUSES] },
                createdAt: { lte: cutoff },
            },
            select: { id: true },
        });

        const queued = [];
        for (const ticket of tickets) {
            const event: TraceholdQueueEvent = {
                eventId: randomUUID(),
                eventType: TicketEventType.ESCALATION_DUE,
                ticketId: ticket.id,
                occurredAt: clock.now.toISOString(),
            };
            await this.eventPublisher.publish(event);
            queued.push(event);
        }

        return {
            now: clock.now.toISOString(),
            queued: queued.length,
            ticketIds: queued.map((event) => event.ticketId),
        };
    }

    private async readClock() {
        await this.prisma.getDemoNow();
        return this.prisma.demoClock.findUniqueOrThrow({ where: { id: DEMO_CLOCK_ID } });
    }
}
