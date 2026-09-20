import { PrismaPg } from '@prisma/adapter-pg';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { DEMO_CLOCK_ID } from '@tracehold/shared';
import { PrismaClient } from '../generated/prisma/client.js';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
    private readonly pool: Pool;

    constructor() {
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        super({ adapter: new PrismaPg(pool) });
        this.pool = pool;
    }

    async getDemoNow(): Promise<Date> {
        const existing = await this.demoClock.findUnique({ where: { id: DEMO_CLOCK_ID } });
        if (existing) return existing.now;
        const created = await this.demoClock.create({
            data: { id: DEMO_CLOCK_ID, now: new Date() },
        });
        return created.now;
    }

    async onModuleDestroy() {
        await this.$disconnect();
        await this.pool.end();
    }
}