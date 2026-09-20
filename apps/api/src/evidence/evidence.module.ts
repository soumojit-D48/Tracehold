import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { SearchModule } from '../search/search.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';
import { EvidenceController } from './evidence.controller.js';
import { EvidenceService } from './evidence.service.js';

@Module({
    imports: [PrismaModule, SearchModule, AuthModule, AuthorizationModule],
    controllers: [EvidenceController],
    providers: [EvidenceService],
    exports: [EvidenceService],
})
export class EvidenceModule {}
