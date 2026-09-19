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
    findAll(@Query('status') status: TicketStatus | undefined, @Query('unitId') unitId: string | undefined, @CurrentUser() user: AuthUser) {
        return this.ticketsService.findAll({ status, unitId }, user);
    }

    @Get(':id/events')
    findEvents(@Param('id') id: string, @CurrentUser() user: AuthUser) {
        return this.ticketsService.findEvents(id, user);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
        return this.ticketsService.findOne(id, user);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateTicketDto, @CurrentUser() user: AuthUser) {
        return this.ticketsService.update(id, dto, user);
    }

    @Post(':id/close')
    close(@Param('id') id: string, @CurrentUser() user: AuthUser) {
        return this.ticketsService.close(id, user);
    }
}