import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma, TicketStatus } from '../generated/prisma/client.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { UpdateTicketDto } from './dto/update-ticket.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthUser } from '../auth/auth.types.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { EventPublisherService } from '../events/event-publisher.service.js';

const ticketInclude = {
    unit: { include: { property: true } },
    createdBy: true,
} satisfies Prisma.TicketInclude;

@Injectable()
export class TicketsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly authorization: AuthorizationService,
        private readonly eventPublisher: EventPublisherService,
    ) { }

    async create(dto: CreateTicketDto, user: AuthUser) {
        this.authorization.authorize(user, 'CreateTicket', {
            uid: { type: 'Unit', id: dto.unitId }, attrs: {}, parents: [],
        });
        const { ticket, event } = await this.prisma.$transaction(async (transaction) => {
            const ticket = await transaction.ticket.create({
                data: {
                    unitId: dto.unitId,
                    category: dto.category,
                    description: dto.description,
                    severity: dto.severity,
                    createdById: user.id,
                },
                include: ticketInclude,
            });
            const event = await transaction.ticketEvent.create({
                data: { ticketId: ticket.id, actorId: user.id, type: 'TicketCreated' },
            });
            return { ticket, event };
        });
        await this.eventPublisher.publishTicketCreated({
            eventId: event.id,
            eventType: 'TicketCreated',
            ticketId: ticket.id,
            occurredAt: event.createdAt.toISOString(),
        });
        return ticket;
    }

    async findAll(filters: { status?: TicketStatus; unitId?: string }, user: AuthUser) {
        const tickets = await this.prisma.ticket.findMany({
            where: { status: filters.status, unitId: filters.unitId },
            include: ticketInclude,
            orderBy: { createdAt: 'desc' },
        });
        return tickets.filter((ticket) => {
            try {
                this.authorization.authorize(user, 'ViewTicket', this.authorization.ticketResource(ticket));
                return true;
            } catch { return false; }
        });
    }

    async findOne(id: string, user: AuthUser) {
        const ticket = await this.prisma.ticket.findUnique({
            where: { id },
            include: { ...ticketInclude, events: { orderBy: { createdAt: 'asc' } } },
        });
        if (!ticket) throw new NotFoundException(`Ticket ${id} was not found.`);
        this.authorization.authorize(user, 'ViewTicket', this.authorization.ticketResource(ticket));
        return ticket;
    }

    async update(id: string, dto: UpdateTicketDto, user: AuthUser) {
        const existing = await this.getExisting(id);
        this.authorization.authorize(user, 'UpdateTicket', this.authorization.ticketResource(existing));
        if (existing.status === TicketStatus.CLOSED) {
            throw new ConflictException('Closed tickets cannot be updated.');
        }

        return this.prisma.$transaction(async (transaction) => {
            const ticket = await transaction.ticket.update({
                where: { id },
                data: {
                    category: dto.category,
                    description: dto.description,
                    severity: dto.severity,
                    status: dto.status,
                    resolvedAt: dto.status === TicketStatus.RESOLVED ? new Date() : undefined,
                },
                include: ticketInclude,
            });
            await transaction.ticketEvent.create({
                data: {
                    ticketId: id,
                    type: dto.status && dto.status !== existing.status ? 'StatusChanged' : 'TicketUpdated',
                    metadata: {
                        changes: {
                            category: dto.category,
                            description: dto.description,
                            severity: dto.severity,
                            status: dto.status,
                        },
                    },
                },
            });
            return ticket;
        });
    }

    async close(id: string, user: AuthUser) {
        const existing = await this.getExisting(id);
        this.authorization.authorize(user, 'CloseTicket', this.authorization.ticketResource(existing));
        if (existing.status === TicketStatus.CLOSED) {
            throw new ConflictException('Ticket is already closed.');
        }

        return this.prisma.$transaction(async (transaction) => {
            const ticket = await transaction.ticket.update({
                where: { id },
                data: { status: TicketStatus.CLOSED, resolvedAt: existing.resolvedAt ?? new Date() },
                include: ticketInclude,
            });
            await transaction.ticketEvent.create({
                data: {
                    ticketId: id,
                    type: 'TicketClosed',
                    metadata: { from: existing.status, to: TicketStatus.CLOSED },
                },
            });
            return ticket;
        });
    }

    async findEvents(id: string, user: AuthUser) {
        const ticket = await this.getExisting(id);
        this.authorization.authorize(user, 'ViewTicket', this.authorization.ticketResource(ticket));
        return this.prisma.ticketEvent.findMany({
            where: { ticketId: id },
            orderBy: { createdAt: 'asc' },
        });
    }

    private async getExisting(id: string) {
        const ticket = await this.prisma.ticket.findUnique({ where: { id } });
        if (!ticket) throw new NotFoundException(`Ticket ${id} was not found.`);
        return ticket;
    }
}