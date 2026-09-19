import { PrismaPg } from '@prisma/adapter-pg';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
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

    async onModuleDestroy() {
        await this.$disconnect();
        await this.pool.end();
    }
}