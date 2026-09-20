import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { SearchModule } from '../search/search.module.js';
import { EvidenceService } from './evidence.service.js';

@Module({
    imports: [PrismaModule, SearchModule],
    providers: [EvidenceService],
    exports: [EvidenceService],
})
export class EvidenceModule {}
