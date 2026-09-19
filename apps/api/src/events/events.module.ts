import { Module } from '@nestjs/common';
import { EventPublisherService } from './event-publisher.service.js';

@Module({ providers: [EventPublisherService], exports: [EventPublisherService] })
export class EventsModule { }
