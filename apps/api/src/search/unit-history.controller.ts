import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { SearchService } from './search.service.js';

@Controller('units')
@UseGuards(JwtAuthGuard)
export class UnitHistoryController {
    constructor(private readonly searchService: SearchService) {}

    @Get(':id/history')
    getHistory(@Param('id') unitId: string) {
        return this.searchService.getUnitHistory(unitId);
    }
}
