import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

export const TICKETS_INDEX = 'tracehold-tickets';

export type TicketSearchDocument = {
    ticketId: string;
    propertyId: string;
    unitId: string;
    unitNumber: string;
    category: string;
    description: string;
    severity: string;
    status: string;
    createdAt: string;
};

type IndexedTicket = Prisma.TicketGetPayload<{
    include: { unit: true };
}>;

type SearchHit = { _id: string; _source: TicketSearchDocument };

@Injectable()
export class SearchService implements OnModuleInit {
    private readonly logger = new Logger(SearchService.name);
    private readonly baseUrl = (process.env.OPENSEARCH_URL ?? 'http://localhost:9200').replace(/\/$/, '');

    constructor(private readonly prisma: PrismaService) {}

    async onModuleInit() {
        try {
            await this.ensureIndex();
            const tickets = await this.prisma.ticket.findMany({ include: { unit: true } });
            await this.indexTickets(tickets);
            this.logger.log(`Indexed ${tickets.length} tickets into ${TICKETS_INDEX}.`);
        } catch (error) {
            this.logger.warn(`OpenSearch initialization skipped: ${this.errorMessage(error)}`);
        }
    }

    async ensureIndex() {
        const response = await this.request(`/${TICKETS_INDEX}`, {
            method: 'PUT',
            body: JSON.stringify({
                mappings: {
                    properties: {
                        ticketId: { type: 'keyword' },
                        propertyId: { type: 'keyword' },
                        unitId: { type: 'keyword' },
                        unitNumber: { type: 'keyword' },
                        category: { type: 'keyword' },
                        description: { type: 'text' },
                        severity: { type: 'keyword' },
                        status: { type: 'keyword' },
                        createdAt: { type: 'date' },
                    },
                },
            }),
        });
        if (!response.ok && response.status !== 400) {
            throw new Error(`index creation failed with HTTP ${response.status}`);
        }
    }

    async indexTicket(ticket: IndexedTicket) {
        const document = this.toDocument(ticket);
        const response = await this.request(`/${TICKETS_INDEX}/_doc/${encodeURIComponent(ticket.id)}?refresh=wait_for`, {
            method: 'PUT',
            body: JSON.stringify(document),
        });
        if (!response.ok) throw new Error(`ticket indexing failed with HTTP ${response.status}`);
    }

    private async indexTickets(tickets: IndexedTicket[]) {
        if (tickets.length === 0) return;
        const body = tickets.flatMap((ticket) => [
            JSON.stringify({ index: { _index: TICKETS_INDEX, _id: ticket.id } }),
            JSON.stringify(this.toDocument(ticket)),
        ]).join('\n') + '\n';
        const response = await this.request(`/_bulk?refresh=wait_for`, {
            method: 'POST',
            body,
        }, 'application/x-ndjson');
        if (!response.ok) throw new Error(`bulk ticket indexing failed with HTTP ${response.status}`);
        const result = await response.json() as { errors?: boolean };
        if (result.errors) throw new Error('bulk ticket indexing returned item errors');
    }

    async searchTickets(query: string) {
        const response = await this.request(`/${TICKETS_INDEX}/_search`, {
            method: 'POST',
            body: JSON.stringify({
                size: 100,
                query: {
                    multi_match: {
                        query,
                        fields: ['description^3', 'category', 'unitNumber'],
                        fuzziness: 'AUTO',
                    },
                },
                sort: [{ createdAt: 'desc' }],
            }),
        });
        if (!response.ok) throw new Error(`ticket search failed with HTTP ${response.status}`);
        const body = await response.json() as { hits?: { hits?: SearchHit[] } };
        return (body.hits?.hits ?? []).map((hit) => hit._source);
    }

    async getUnitHistory(unitId: string) {
        const response = await this.request(`/${TICKETS_INDEX}/_search`, {
            method: 'POST',
            body: JSON.stringify({
                size: 100,
                query: { term: { unitId } },
                sort: [{ createdAt: 'desc' }],
            }),
        });
        if (!response.ok) throw new Error(`unit history lookup failed with HTTP ${response.status}`);
        const body = await response.json() as { hits?: { hits?: SearchHit[] } };
        const tickets = (body.hits?.hits ?? []).map((hit) => hit._source);
        return {
            unitId,
            tickets,
            recurringIssues: this.findRecurringIssues(tickets),
        };
    }

    private findRecurringIssues(tickets: TicketSearchDocument[]) {
        const groups = new Map<string, TicketSearchDocument[]>();
        for (const ticket of tickets) {
            const key = ticket.category;
            groups.set(key, [...(groups.get(key) ?? []), ticket]);
        }

        const categoryIssues = [...groups.entries()]
            .filter(([, matches]) => matches.length >= 2)
            .map(([category, matches]) => ({
                category,
                count: matches.length,
                ticketIds: matches.map((ticket) => ticket.ticketId),
            }));

        const waterPattern = /water|leak|moisture|pipe|ceiling|bathroom/i;
        const waterTickets = tickets.filter((ticket) => waterPattern.test(`${ticket.category} ${ticket.description}`));
        if (waterTickets.length >= 2 && !categoryIssues.some((issue) => issue.category === 'WATER_RELATED')) {
            categoryIssues.push({
                category: 'WATER_RELATED',
                count: waterTickets.length,
                ticketIds: waterTickets.map((ticket) => ticket.ticketId),
            });
        }
        return categoryIssues;
    }

    private toDocument(ticket: IndexedTicket): TicketSearchDocument {
        return {
            ticketId: ticket.id,
            propertyId: ticket.unit.propertyId,
            unitId: ticket.unitId,
            unitNumber: ticket.unit.unitNumber,
            category: ticket.category,
            description: ticket.description,
            severity: ticket.severity,
            status: ticket.status,
            createdAt: ticket.createdAt.toISOString(),
        };
    }

    private async request(path: string, init: RequestInit = {}, contentType = 'application/json') {
        return fetch(`${this.baseUrl}${path}`, {
            ...init,
            headers: { 'content-type': contentType },
        });
    }

    private errorMessage(error: unknown) {
        return error instanceof Error ? error.message : String(error);
    }
}
