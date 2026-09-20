import { IsISO8601 } from 'class-validator';

export class SetDemoClockDto {
    @IsISO8601()
    now!: string;
}
