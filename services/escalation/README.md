# Tracehold Escalation Lambda

This is the Step 8 SAM scaffold for the future escalation worker. It receives SQS batches and reports the message IDs it received. Ticket event publishing and escalation decisions are intentionally deferred to later steps.

## Build and invoke

```powershell
pnpm --filter @tracehold/escalation build
sam build --template-file template.yaml
sam local invoke EscalationFunction --event events/sample-sqs.json
```

The local queue is created by LocalStack when the Compose stack starts:

```powershell
docker compose up -d localstack
```
