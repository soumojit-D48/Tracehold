import { Test, TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { EvidenceService } from '../src/evidence/evidence.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Evidence agent (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let evidence: EvidenceService;
    let unitId: string;
    let tenantId: string;
    let tenantToken: string;
    let landlordToken: string;
    let contractorToken: string;
    let generatedTicketId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
        prisma = app.get(PrismaService);
        evidence = app.get(EvidenceService);
        unitId = (await prisma.unit.findFirstOrThrow({ where: { unitNumber: '304' } })).id;
        tenantId = (await prisma.user.findUniqueOrThrow({ where: { email: 'tenant@tracehold.local' } })).id;
        tenantToken = (await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'tenant@tracehold.local', password: 'tracehold-demo-tenant' })
            .expect(201)).body.accessToken;
        landlordToken = (await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'landlord@tracehold.local', password: 'tracehold-demo-landlord' })
            .expect(201)).body.accessToken;
        contractorToken = (await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'contractor@tracehold.local', password: 'tracehold-demo-contractor' })
            .expect(201)).body.accessToken;
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
        generatedTicketId = ticket.id;
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

    it('protects evidence actions with Cedar and returns timeline and related tickets', async () => {
        await request(app.getHttpServer())
            .post(`/tickets/${generatedTicketId}/evidence`)
            .set('Authorization', `Bearer ${tenantToken}`)
            .expect(403);

        const generated = await request(app.getHttpServer())
            .post(`/tickets/${generatedTicketId}/evidence`)
            .set('Authorization', `Bearer ${landlordToken}`)
            .expect(201);
        expect(generated.body.noticeDraft).toContain('AI-generated draft');

        const timeline = await request(app.getHttpServer())
            .get(`/tickets/${generatedTicketId}/events`)
            .set('Authorization', `Bearer ${tenantToken}`)
            .expect(200);
        expect(timeline.body).toEqual([
            expect.objectContaining({ type: 'TicketCreated' }),
        ]);
        expect(new Date(timeline.body[0].createdAt).getTime()).not.toBeNaN();

        const retrieved = await request(app.getHttpServer())
            .get(`/tickets/${generatedTicketId}/evidence`)
            .set('Authorization', `Bearer ${landlordToken}`)
            .expect(200);
        expect(retrieved.body.relatedTicketIds.length).toBeGreaterThan(0);
        expect(retrieved.body.relatedTickets.length).toBe(retrieved.body.relatedTicketIds.length);
        expect(retrieved.body.timeline).toEqual([expect.objectContaining({ eventId: timeline.body[0].id })]);

        await request(app.getHttpServer())
            .get(`/tickets/${generatedTicketId}/evidence`)
            .set('Authorization', `Bearer ${contractorToken}`)
            .expect(403);
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
