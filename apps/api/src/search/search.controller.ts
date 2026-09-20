import { Controller, Get, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { SearchService } from './search.service.js';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
    constructor(private readonly searchService: SearchService) {}

    @Get('tickets')
    searchTickets(@Query('q') query?: string) {
        if (!query?.trim()) throw new BadRequestException('Query parameter q is required.');
        return this.searchService.searchTickets(query.trim());
    }
}
