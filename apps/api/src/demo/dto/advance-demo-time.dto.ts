import { IsInt, Max, Min } from 'class-validator';

export class AdvanceDemoTimeDto {
    @IsInt()
    @Min(1)
    @Max(24 * 30)
    hours!: number;
}
