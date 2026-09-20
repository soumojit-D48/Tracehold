import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { AuthUser } from '../auth/auth.types.js';
import { DemoService } from './demo.service.js';
import { SetDemoClockDto } from './dto/set-demo-clock.dto.js';
import { AdvanceDemoTimeDto } from './dto/advance-demo-time.dto.js';

@Controller('demo')
@UseGuards(JwtAuthGuard)
export class DemoController {
    constructor(private readonly demoService: DemoService) { }

    @Get('clock')
    getClock(@CurrentUser() user: AuthUser) {
        return this.demoService.getClock(user);
    }

    @Post('clock')
    setClock(@Body() dto: SetDemoClockDto, @CurrentUser() user: AuthUser) {
        return this.demoService.setClock(dto, user);
    }

    @Post('advance-time')
    advanceTime(@Body() dto: AdvanceDemoTimeDto, @CurrentUser() user: AuthUser) {
        return this.demoService.advanceTime(dto, user);
    }

    @Post('escalations/evaluate')
    evaluateEscalations(@CurrentUser() user: AuthUser) {
        return this.demoService.evaluateEscalations(user);
    }
}
