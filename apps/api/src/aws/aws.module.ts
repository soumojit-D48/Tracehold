import { Global, Module } from '@nestjs/common';
import { AwsService } from './aws.service.js';

@Global()
@Module({ providers: [AwsService], exports: [AwsService] })
export class AwsModule { }
