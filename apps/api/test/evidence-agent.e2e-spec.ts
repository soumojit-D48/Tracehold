import { Test, TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module.js';
import { EvidenceService } from '../src/evidence/evidence.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Evidence agent (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let evidence: EvidenceService;
    let unitId: string;
    let tenantId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
        prisma = app.get(PrismaService);
        evidence = app.get(EvidenceService);
        unitId = (await prisma.unit.findFirstOrThrow({ where: { unitNumber: '304' } })).id;
        tenantId = (await prisma.user.findUniqueOrThrow({ where: { email: 'tenant@tracehold.local' } })).id;
    }, 30000);

    it('generates source-grounded draft evidence and stores it', async () => {
        const ticket = await prisma.ticket.create({
            data: {
                unitId,
                createdById: tenantId,
                category: 'WATER_DAMAGE',
                description: 'Evidence test: bathroom ceiling is leaking.',
                severity: 'HIGH',
                createdAt: new Date('2026-09-19T15:30:00.000Z'),
            },
        });
        const event = await prisma.ticketEvent.create({
            data: {
                ticketId: ticket.id,
                type: 'TicketCreated',
                actorId: tenantId,
                createdAt: new Date('2026-09-19T15:30:00.000Z'),
            },
        });

        const stored = await evidence.generateEvidence(ticket.id);

        expect(stored.summary).toContain('Evidence test: bathroom ceiling is leaking.');
        expect(stored.noticeDraft).toContain('AI-generated draft');
        expect(stored.timeline).toEqual([
            expect.objectContaining({ eventId: event.id, type: 'TicketCreated', createdAt: event.createdAt.toISOString() }),
        ]);
        expect(stored.relatedTickets.length).toBeGreaterThan(0);
        expect(stored.modelMetadata).toMatchObject({ draft: true, sourceTicketId: ticket.id });
        expect(await prisma.ticket.findUnique({ where: { id: ticket.id } })).toMatchObject({ id: ticket.id, status: 'OPEN' });
    });

    it('leaves ticket data intact when the agent fails', async () => {
        const ticket = await prisma.ticket.create({
            data: {
                unitId,
                createdById: tenantId,
                category: 'PLUMBING',
                description: 'Evidence failure test: pipe leak.',
                severity: 'MEDIUM',
            },
        });
        const previousPython = process.env.PYTHON_BIN;
        process.env.PYTHON_BIN = 'tracehold-python-does-not-exist';
        try {
            await expect(evidence.generateEvidence(ticket.id)).rejects.toThrow('Evidence agent failed');
        } finally {
            if (previousPython === undefined) delete process.env.PYTHON_BIN;
            else process.env.PYTHON_BIN = previousPython;
        }

        expect(await prisma.ticket.findUnique({ where: { id: ticket.id } })).toMatchObject({ id: ticket.id, status: 'OPEN' });
        expect(await prisma.evidence.count({ where: { ticketId: ticket.id } })).toBe(0);
    });

    afterAll(async () => {
        await app.close();
    });
});
