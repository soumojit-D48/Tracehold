import { TicketCategory, TicketSeverity, TicketStatus } from '../../generated/prisma/client.js';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateTicketDto {
    @IsOptional()
    @IsEnum(TicketCategory)
    category?: TicketCategory;

    @IsOptional()
    @IsString()
    @MinLength(10)
    description?: string;

    @IsOptional()
    @IsEnum(TicketSeverity)
    severity?: TicketSeverity;

    @IsOptional()
    @IsEnum(TicketStatus)
    status?: TicketStatus;
}