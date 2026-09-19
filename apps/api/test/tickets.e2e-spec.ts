import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { AppModule } from '../src/app.module.js';
import request from 'supertest';

describe('Tickets API (e2e)', () => {
    let app: INestApplication;
    let unitId: string;
    let ticketId: string;
    let accessToken: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
        );
        await app.init();

        const prisma = app.get(PrismaService);
        const unit = await prisma.unit.findFirst({ where: { unitNumber: '304' } });
        if (!unit) throw new Error('Seeded Unit 304 is required for e2e tests.');
        unitId = unit.id;

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'tenant@tracehold.local', password: 'tracehold-demo-tenant' })
            .expect(201);
        accessToken = login.body.accessToken;
    });

    it('runs the ticket lifecycle and records events', async () => {
        const created = await request(app.getHttpServer())
            .post('/tickets')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                unitId,
                category: 'WATER_DAMAGE',
                description: `Bathroom ceiling leak test ${Date.now()}`,
                severity: 'HIGH',
            })
            .expect(201);

        ticketId = created.body.id;
        expect(created.body.status).toBe('OPEN');

        await request(app.getHttpServer())
            .get('/tickets')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ unitId })
            .expect(200);
        await request(app.getHttpServer())
            .get(`/tickets/${ticketId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200);

        await request(app.getHttpServer())
            .patch(`/tickets/${ticketId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ status: 'IN_PROGRESS', description: 'Contractor is inspecting the leak.' })
            .expect(200);

        await request(app.getHttpServer())
            .post(`/tickets/${ticketId}/close`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(201);

        const events = await request(app.getHttpServer())
            .get(`/tickets/${ticketId}/events`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200);
        expect(events.body.map((event: { type: string }) => event.type)).toEqual([
            'TicketCreated',
            'StatusChanged',
            'TicketClosed',
        ]);
    });

    it('rejects invalid ticket payloads and unknown IDs', async () => {
        await request(app.getHttpServer())
            .post('/tickets')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ unitId, category: 'INVALID', description: 'short', severity: 'HIGH' })
            .expect(400);

        await request(app.getHttpServer())
            .get('/tickets/does-not-exist')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(404);
        await request(app.getHttpServer())
            .get('/tickets/does-not-exist/events')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(404);
        await request(app.getHttpServer()).get('/tickets').expect(401);
    });

    afterAll(async () => {
        await app.close();
    });
});