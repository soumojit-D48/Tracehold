import { GetQueueUrlCommand, SQSClient } from '@aws-sdk/client-sqs';
import { Injectable, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class AwsService implements OnModuleDestroy {
    private readonly client: SQSClient;
    private readonly queueName = process.env.SQS_QUEUE_NAME ?? 'tracehold-events';

    constructor() {
        this.client = new SQSClient({
            region: process.env.AWS_REGION ?? 'us-east-1',
            endpoint: process.env.AWS_ENDPOINT_URL || undefined,
            credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
        });
    }

    getEventsQueueUrl() {
        return this.client.send(new GetQueueUrlCommand({ QueueName: this.queueName }));
    }

    async onModuleDestroy() {
        this.client.destroy();
    }
}
