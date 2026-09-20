import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Pool } from 'pg';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { EventPublisherService } from '../src/events/event-publisher.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { processTicketEscalation } from '../../../services/escalation/src/escalate-ticket.js';
import { TicketEventType, DEMO_CLOCK_ID } from '@tracehold/shared';

describe('Demo clock and escalation (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let adminToken: string;
    let tenantToken: string;
    let unitId: string;
    const published: Array<{ eventType: string; ticketId: string }> = [];

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(EventPublisherService)
            .useValue({
                publish: vi.fn(async (event: { eventType: string; ticketId: string }) => {
                    published.push(event);
                }),
                publishTicketCreated: vi.fn(),
            })
            .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
        );
        await app.init();
        prisma = app.get(PrismaService);

        const unit = await prisma.unit.findFirst({ where: { unitNumber: '304' } });
        if (!unit) throw new Error('Seeded Unit 304 is required for e2e tests.');
        unitId = unit.id;

        tenantToken = (await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'tenant@tracehold.local', password: 'tracehold-demo-tenant' })
            .expect(201)).body.accessToken;
        adminToken = (await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin@tracehold.local', password: 'tracehold-demo-admin' })
            .expect(201)).body.accessToken;
    });

    it('lets only admins advance demo time and queue overdue tickets', async () => {
        await request(app.getHttpServer())
            .post('/demo/clock')
            .set('Authorization', `Bearer ${tenantToken}`)
            .send({ now: '2026-09-22T00:00:00.000Z' })
            .expect(403);

        await request(app.getHttpServer())
            .post('/demo/escalations/evaluate')
            .set('Authorization', `Bearer ${tenantToken}`)
            .expect(403);

        await request(app.getHttpServer())
            .post('/demo/clock')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ now: '2026-09-20T00:00:00.000Z' })
            .expect(201);

        const created = await request(app.getHttpServer())
            .post('/tickets')
            .set('Authorization', `Bearer ${tenantToken}`)
            .send({
                unitId,
                category: 'WATER_DAMAGE',
                description: `Demo-time leak ${Date.now()}`,
                severity: 'HIGH',
            })
            .expect(201);

        expect(created.body.createdAt).toBe('2026-09-20T00:00:00.000Z');

        await request(app.getHttpServer())
            .get('/demo/clock')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        await request(app.getHttpServer())
            .post('/demo/clock')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ now: '2026-09-21T01:00:00.000Z' })
            .expect(201);

        published.length = 0;
        const evaluated = await request(app.getHttpServer())
            .post('/demo/escalations/evaluate')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(201);

        expect(evaluated.body.ticketIds).toContain(created.body.id);
        expect(published.some((event) => event.ticketId === created.body.id && event.eventType === TicketEventType.ESCALATION_DUE)).toBe(true);
    });

    it('escalates from current database state and ignores a second delivery', async () => {
        const ticket = await prisma.ticket.create({
            data: {
                unitId,
                createdById: (await prisma.user.findUniqueOrThrow({ where: { email: 'tenant@tracehold.local' } })).id,
                category: 'PLUMBING',
                description: 'Worker idempotency leak behind the bathroom wall.',
                severity: 'HIGH',
                createdAt: new Date('2026-09-01T00:00:00.000Z'),
            },
        });
        await prisma.demoClock.upsert({
            where: { id: DEMO_CLOCK_ID },
            update: { now: new Date('2026-09-03T00:00:00.000Z') },
            create: { id: DEMO_CLOCK_ID, now: new Date('2026-09-03T00:00:00.000Z') },
        });

        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        const client = await pool.connect();
        try {
            const first = await processTicketEscalation(client, ticket.id);
            const second = await processTicketEscalation(client, ticket.id);
            expect(first).toEqual({ ticketId: ticket.id, action: 'escalated', previousStatus: 'OPEN' });
            expect(second.action).toBe('skipped');
        } finally {
            client.release();
            await pool.end();
        }

        const stored = await prisma.ticket.findUniqueOrThrow({ where: { id: ticket.id } });
        expect(stored.status).toBe('ESCALATED');
        const events = await prisma.ticketEvent.findMany({ where: { ticketId: ticket.id } });
        expect(events.map((event) => event.type)).toEqual(['TicketEscalated']);
    });

    afterAll(async () => {
        await app.close();
    });
});
