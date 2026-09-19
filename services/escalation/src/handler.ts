import type { SQSEvent, SQSRecord } from 'aws-lambda';

export type EscalationResult = {
    processed: number;
    messageIds: string[];
};

export async function handler(event: SQSEvent): Promise<EscalationResult> {
    const records = event.Records ?? [];
    const messageIds = records.map((record: SQSRecord) => record.messageId);

    console.log(JSON.stringify({ event: 'EscalationBatchReceived', messageIds }));

    return {
        processed: records.length,
        messageIds,
    };
}
