import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';
import { EventsModule } from '../events/events.module.js';
import { DemoController } from './demo.controller.js';
import { DemoService } from './demo.service.js';

@Module({
    imports: [AuthModule, AuthorizationModule, EventsModule],
    controllers: [DemoController],
    providers: [DemoService],
})
export class DemoModule { }
