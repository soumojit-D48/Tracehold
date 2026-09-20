import { Injectable, NotFoundException } from '@nestjs/common';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SearchService, type TicketSearchDocument } from '../search/search.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { AuthorizationService } from '../authorization/authorization.service.js';

type AgentEvent = {
    eventId: string;
    type: string;
    createdAt: string;
    metadata: unknown;
};

type AgentInput = {
    ticket: {
        ticketId: string;
        description: string;
        category: string;
        severity: string;
        status: string;
        createdAt: string;
        unitNumber: string;
        propertyName: string;
    };
    events: AgentEvent[];
    relatedHistoricalTickets: TicketSearchDocument[];
};

type AgentOutput = {
    summary: string;
    timeline: AgentEvent[];
    recurringIssues: Array<Record<string, unknown>>;
    relatedTickets: string[];
    noticeDraft: string;
    modelMetadata: Record<string, unknown>;
};

type EvidenceTicket = Prisma.TicketGetPayload<{
    include: {
        unit: { include: { property: true } };
        events: { include: { actor: true } };
    };
}>;

@Injectable()
export class EvidenceService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly search: SearchService,
        private readonly authorization: AuthorizationService,
    ) {}

    async generateEvidence(ticketId: string, user?: AuthUser) {
        const ticket = await this.prisma.ticket.findUnique({
            where: { id: ticketId },
            include: {
                unit: { include: { property: true } },
                events: { include: { actor: true }, orderBy: { createdAt: 'asc' } },
            },
        });
        if (!ticket) throw new NotFoundException(`Ticket ${ticketId} was not found.`);
        if (user) this.authorization.authorize(user, 'GenerateEvidence', this.authorization.ticketResource(ticket));

        const history = await this.search.getUnitHistory(ticket.unitId);
        const relatedTickets = history.tickets.filter((item) => item.ticketId !== ticket.id);
        const input = this.toAgentInput(ticket, relatedTickets);
        const output = await this.runAgent(input);
        const safeOutput = this.validateOutput(output, input, relatedTickets);

        return this.prisma.evidence.create({
            data: {
                ticketId: ticket.id,
                summary: safeOutput.summary,
                timeline: JSON.parse(JSON.stringify(safeOutput.timeline)),
                relatedTickets: safeOutput.relatedTickets,
                noticeDraft: safeOutput.noticeDraft,
                generatedAt: new Date(),
                modelMetadata: {
                    ...safeOutput.modelMetadata,
                    sourceEventIds: input.events.map((event) => event.eventId),
                    sourceTicketId: ticket.id,
                    draft: true,
                },
            },
        });
    }

    async getEvidence(ticketId: string, user: AuthUser) {
        const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
        if (!ticket) throw new NotFoundException(`Ticket ${ticketId} was not found.`);
        this.authorization.authorize(user, 'GenerateEvidence', this.authorization.ticketResource(ticket));

        const evidence = await this.prisma.evidence.findFirst({
            where: { ticketId },
            orderBy: { generatedAt: 'desc' },
        });
        if (!evidence) throw new NotFoundException(`Evidence for ticket ${ticketId} was not found.`);

        const relatedTickets = evidence.relatedTickets.length === 0
            ? []
            : await this.prisma.ticket.findMany({
                where: { id: { in: evidence.relatedTickets } },
                include: { unit: { include: { property: true } } },
                orderBy: { createdAt: 'desc' },
            });
        return {
            ...evidence,
            relatedTicketIds: evidence.relatedTickets,
            relatedTickets,
        };
    }

    private toAgentInput(ticket: EvidenceTicket, relatedTickets: TicketSearchDocument[]): AgentInput {
        return {
            ticket: {
                ticketId: ticket.id,
                description: ticket.description,
                category: ticket.category,
                severity: ticket.severity,
                status: ticket.status,
                createdAt: ticket.createdAt.toISOString(),
                unitNumber: ticket.unit.unitNumber,
                propertyName: ticket.unit.property.name,
            },
            events: ticket.events.map((event) => ({
                eventId: event.id,
                type: event.type,
                createdAt: event.createdAt.toISOString(),
                metadata: event.metadata,
            })),
            relatedHistoricalTickets: relatedTickets,
        };
    }

    private validateOutput(output: AgentOutput, input: AgentInput, relatedTickets: TicketSearchDocument[]): AgentOutput {
        if (!output || typeof output.summary !== 'string' || !output.summary.trim()) {
            throw new Error('Evidence agent returned an invalid summary.');
        }
        if (!Array.isArray(output.timeline) || !Array.isArray(output.relatedTickets) || typeof output.noticeDraft !== 'string') {
            throw new Error('Evidence agent returned an invalid structured result.');
        }

        const validEventIds = new Set(input.events.map((event) => event.eventId));
        if (output.timeline.some((event) => !validEventIds.has(event.eventId))) {
            throw new Error('Evidence agent returned an event outside the supplied timeline.');
        }
        const validTicketIds = new Set(relatedTickets.map((ticket) => ticket.ticketId));
        if (output.relatedTickets.some((ticketId) => !validTicketIds.has(ticketId))) {
            throw new Error('Evidence agent returned a historical ticket outside the supplied history.');
        }
        if (!output.noticeDraft.includes('AI-generated draft')) {
            throw new Error('Evidence agent output must be marked as a draft.');
        }

        return {
            ...output,
            timeline: input.events,
            relatedTickets: output.relatedTickets,
        };
    }

    private runAgent(input: AgentInput): Promise<AgentOutput> {
        const scriptCandidates = [
            resolve(process.cwd(), 'apps/agent/agent.py'),
            resolve(process.cwd(), '../../apps/agent/agent.py'),
        ];
        const script = scriptCandidates.find((candidate) => existsSync(candidate));
        if (!script) throw new Error('Evidence agent script was not found.');

        const python = process.env.PYTHON_BIN ?? (process.platform === 'win32' ? 'python' : 'python3');
        return new Promise((resolveResult, reject) => {
            const child = spawn(python, [script], { stdio: ['pipe', 'pipe', 'pipe'] });
            let stdout = '';
            let stderr = '';
            let failedToStart = false;
            const timeout = setTimeout(() => child.kill(), 15_000);
            child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
            child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
            child.on('error', (error) => {
                failedToStart = true;
                reject(new Error(`Evidence agent failed: ${error.message}`));
            });
            child.on('close', (code) => {
                clearTimeout(timeout);
                if (failedToStart) return;
                if (code !== 0) {
                    reject(new Error(`Evidence agent failed: ${stderr || `exit code ${code}`}`));
                    return;
                }
                try {
                    resolveResult(JSON.parse(stdout) as AgentOutput);
                } catch {
                    reject(new Error('Evidence agent returned invalid JSON.'));
                }
            });
            child.stdin.end(JSON.stringify(input));
        });
    }
}
