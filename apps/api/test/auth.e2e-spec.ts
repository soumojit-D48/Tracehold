import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

describe('Auth API (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
        );
        await app.init();
    });

    it('registers, logs in, and resolves the authenticated user', async () => {
        const email = `step5-${Date.now()}@tracehold.local`;
        const registered = await request(app.getHttpServer())
            .post('/auth/register')
            .send({ name: 'Step Five User', email, password: 'step-five-password' })
            .expect(201);

        expect(registered.body.accessToken).toEqual(expect.any(String));
        expect(registered.body.user.role).toBe('TENANT');

        const loggedIn = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email, password: 'step-five-password' })
            .expect(201);

        const me = await request(app.getHttpServer())
            .get('/auth/me')
            .set('Authorization', `Bearer ${loggedIn.body.accessToken}`)
            .expect(200);
        expect(me.body.email).toBe(email);
        expect(me.body.role).toBe('TENANT');
    });

    it('rejects invalid credentials and missing JWTs', async () => {
        await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'tenant@tracehold.local', password: 'wrong-password' })
            .expect(401);
        await request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    afterAll(async () => {
        await app.close();
    });
});