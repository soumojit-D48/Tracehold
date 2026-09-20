import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { PropertiesModule } from './properties/properties.module.js';
import { UnitsModule } from './units/units.module.js';
import { TicketsModule } from './tickets/tickets.module.js';
import { EventsModule } from './events/events.module.js';
import { AuthorizationModule } from './authorization/authorization.module.js';
import { SearchModule } from './search/search.module.js';
import { EvidenceModule } from './evidence/evidence.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AwsModule } from './aws/aws.module.js';
import { DemoModule } from './demo/demo.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env', '.env'] }),
    PrismaModule,
    AwsModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    UnitsModule,
    TicketsModule,
    EventsModule,
    AuthorizationModule,
    SearchModule,
    EvidenceModule,
    DemoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
