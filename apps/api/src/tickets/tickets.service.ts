import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma, TicketStatus } from '../generated/prisma/client.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { UpdateTicketDto } from './dto/update-ticket.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

const ticketInclude = {
    unit: { include: { property: true } },
    createdBy: true,
} satisfies Prisma.TicketInclude;

@Injectable()
export class TicketsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateTicketDto) {
        const tenant = await this.prisma.user.findUnique({
            where: { email: 'tenant@tracehold.local' },
        });
        if (!tenant) {
            throw new BadRequestException('Seed a demo tenant before creating tickets.');
        }

        return this.prisma.$transaction(async (transaction) => {
            const ticket = await transaction.ticket.create({
                data: {
                    unitId: dto.unitId,
                    category: dto.category,
                    description: dto.description,
                    severity: dto.severity,
                    createdById: tenant.id,
                },
                include: ticketInclude,
            });
            await transaction.ticketEvent.create({
                data: { ticketId: ticket.id, actorId: tenant.id, type: 'TicketCreated' },
            });
            return ticket;
        });
    }

    findAll(filters: { status?: TicketStatus; unitId?: string }) {
        return this.prisma.ticket.findMany({
            where: { status: filters.status, unitId: filters.unitId },
            include: ticketInclude,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const ticket = await this.prisma.ticket.findUnique({
            where: { id },
            include: { ...ticketInclude, events: { orderBy: { createdAt: 'asc' } } },
        });
        if (!ticket) throw new NotFoundException(`Ticket ${id} was not found.`);
        return ticket;
    }

    async update(id: string, dto: UpdateTicketDto) {
        const existing = await this.getExisting(id);
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

    async close(id: string) {
        const existing = await this.getExisting(id);
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

    async findEvents(id: string) {
        await this.getExisting(id);
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