# Tracehold Escalation Lambda

Step 9 worker. It receives `TicketCreated` and `EscalationDue` SQS messages, re-reads the current ticket and demo clock from PostgreSQL, and escalates only if the ticket is still `OPEN` or `IN_PROGRESS` and 24 demo hours have elapsed.

Do not wait real wall-clock time. Advance `/demo/clock` as an admin, then call `/demo/escalations/evaluate`.

## Build and invoke

```powershell
pnpm --filter @tracehold/shared build
pnpm --filter @tracehold/escalation build
$env:DATABASE_URL="postgresql://tracehold:tracehold@localhost:35432/tracehold?schema=public"
sam build --template-file template.yaml
sam local invoke EscalationFunction --event events/sample-sqs.json
```

The local queue is created by LocalStack when the Compose stack starts:

```powershell
docker compose -f infrastructure/docker/docker-compose.yml up -d localstack
```
