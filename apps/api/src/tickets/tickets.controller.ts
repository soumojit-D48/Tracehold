import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TicketStatus } from '../generated/prisma/client.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { UpdateTicketDto } from './dto/update-ticket.dto.js';
import { TicketsService } from './tickets.service.js';

@Controller('tickets')
export class TicketsController {
    constructor(private readonly ticketsService: TicketsService) { }

    @Post()
    create(@Body() dto: CreateTicketDto) {
        return this.ticketsService.create(dto);
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