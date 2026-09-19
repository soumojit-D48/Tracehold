import { TicketCategory, TicketSeverity } from '../../generated/prisma/client.js';
import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateTicketDto {
    @IsString()
    @IsNotEmpty()
    unitId!: string;

    @IsEnum(TicketCategory)
    category!: TicketCategory;

    @IsString()
    @MinLength(10)
    description!: string;

    @IsEnum(TicketSeverity)
    severity!: TicketSeverity;
}