import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { EventsModule } from '../events/events.module.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';
import { TicketsController } from './tickets.controller.js';
import { TicketsService } from './tickets.service.js';

@Module({ imports: [AuthModule, AuthorizationModule, EventsModule], controllers: [TicketsController], providers: [TicketsService] })
export class TicketsModule { }
