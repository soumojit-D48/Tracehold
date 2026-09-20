import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { SearchController } from './search.controller.js';
import { UnitHistoryController } from './unit-history.controller.js';
import { SearchService } from './search.service.js';

@Module({
    imports: [PrismaModule, AuthModule],
    controllers: [SearchController, UnitHistoryController],
    providers: [SearchService],
    exports: [SearchService],
})
export class SearchModule {}
