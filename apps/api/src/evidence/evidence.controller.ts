import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { AuthUser } from '../auth/auth.types.js';
import { EvidenceService } from './evidence.service.js';

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class EvidenceController {
    constructor(private readonly evidenceService: EvidenceService) {}

    @Post(':id/evidence')
    generate(@Param('id') ticketId: string, @CurrentUser() user: AuthUser) {
        return this.evidenceService.generateEvidence(ticketId, user);
    }

    @Get(':id/evidence')
    get(@Param('id') ticketId: string, @CurrentUser() user: AuthUser) {
        return this.evidenceService.getEvidence(ticketId, user);
    }
}
