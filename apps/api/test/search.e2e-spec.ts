import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

describe('Historical search API (e2e)', () => {
    let app: INestApplication;
    let accessToken: string;
    let unitId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
        await app.init();

        accessToken = (await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin@tracehold.local', password: 'tracehold-demo-admin' })
            .expect(201)).body.accessToken;
        const tickets = await request(app.getHttpServer())
            .get('/tickets')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200);
        unitId = tickets.body.find((ticket: { unit: { unitNumber: string } }) => ticket.unit.unitNumber === '304').unit.id;
    }, 30000);

    it('searches historical water complaints', async () => {
        const response = await request(app.getHttpServer())
            .get('/search/tickets')
            .query({ q: 'water leak' })
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200);

        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body.some((ticket: { unitNumber: string }) => ticket.unitNumber === '304')).toBe(true);
    });

    it('returns Unit 304 history and recurring issue detection', async () => {
        const response = await request(app.getHttpServer())
            .get(`/units/${unitId}/history`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200);

        expect(response.body.tickets.length).toBeGreaterThanOrEqual(4);
        expect(response.body.recurringIssues).toEqual(expect.arrayContaining([
            expect.objectContaining({ category: 'WATER_RELATED' }),
        ]));
    });

    afterAll(async () => {
        await app.close();
    }, 30000);
});
