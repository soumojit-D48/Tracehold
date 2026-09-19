import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { AuthUser } from '../auth/auth.types.js';
import { TicketStatus } from '../generated/prisma/client.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { UpdateTicketDto } from './dto/update-ticket.dto.js';
import { TicketsService } from './tickets.service.js';

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
    constructor(private readonly ticketsService: TicketsService) { }

    @Post()
    create(@Body() dto: CreateTicketDto, @CurrentUser() user: AuthUser) {
        return this.ticketsService.create(dto, user);
    }

    @Get()
    findAll(@Query('status') status?: TicketStatus, @Query('unitId') unitId?: string) {
        return this.ticketsService.findAll({ status, unitId });
    }

    @Get(':id/events')
    findEvents(@Param('id') id: string) {
        return this.ticketsService.findEvents(id);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.ticketsService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
        return this.ticketsService.update(id, dto);
    }

    @Post(':id/close')
    close(@Param('id') id: string) {
        return this.ticketsService.close(id);
    }
}