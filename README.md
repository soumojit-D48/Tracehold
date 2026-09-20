# Tracehold

> Turn maintenance complaints into an auditable, event-driven record.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-12-EA2845?logo=nestjs)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Amazon SQS](https://img.shields.io/badge/Amazon%20SQS-event%20queue-FF9900?logo=amazonaws&logoColor=white)](https://aws.amazon.com/sqs/)
[![AWS Lambda](https://img.shields.io/badge/AWS%20Lambda-escalation-FF9900?logo=awslambda&logoColor=white)](https://aws.amazon.com/lambda/)
[![OpenSearch](https://img.shields.io/badge/OpenSearch-history-005EB8?logo=opensearch&logoColor=white)](https://opensearch.org/)
[![Python](https://img.shields.io/badge/Python-agent-3776AB?logo=python&logoColor=white)](https://www.python.org/)

![Tracehold evidence platform](apps/web/public/hero.png)

Tracehold is a maintenance complaint and evidence platform for tenants, contractors, landlords, and property administrators. It preserves the original complaint, records the events that follow, detects unresolved delays, finds related historical issues, and prepares evidence drafts grounded in the recorded data.

The primary product flow is:

```text
Complaint
  -> Ticket
  -> TicketCreated event
  -> SQS
  -> Lambda escalation worker
  -> Historical search
  -> Evidence summary and notice draft
```

## Features

### Product

- Tenant maintenance issue reporting
- Persistent ticket records backed by PostgreSQL
- Chronological ticket event timelines
- Deterministic demo clock for 24-hour and 72-hour workflows
- Automatic escalation for unresolved tickets
- Historical complaint search through OpenSearch
- Unit-level recurring issue detection
- Evidence summaries and formal notice drafts
- Tenant, contractor, landlord, and admin roles
- Cedar-backed authorization for protected operations

### Platform

- Next.js App Router frontend
- NestJS REST API
- Prisma with PostgreSQL
- LocalStack SQS integration
- AWS SAM Lambda template for escalation processing
- Python evidence agent with deterministic local output
- Optional Strands Agents runtime
- Shared TypeScript enums and queue contracts
- Vitest, Node test runner, and Python unit tests

## Architecture

```mermaid
graph TD
    subgraph Client[Client]
        WEB[Next.js web application]
    end

    subgraph Application[Application]
        API[NestJS REST API]
        AUTH[Cedar authorization]
        EVENTS[Event publisher]
        SEARCH[OpenSearch integration]
        EVIDENCE[Evidence service]
    end

    subgraph Async[Asynchronous processing]
        SQS[Amazon SQS / LocalStack]
        LAMBDA[AWS Lambda escalation worker]
    end

    subgraph Data[Authoritative data]
        POSTGRES[(PostgreSQL)]
    end

    subgraph Agent[Evidence agent]
        PYTHON[Python deterministic agent]
        STRANDS[Optional Strands runtime]
    end

    subgraph Shared[Shared contracts]
        TYPES["@tracehold/shared"]
    end

    WEB --> API
    WEB -. shared enums .-> TYPES
    API --> POSTGRES
    API --> AUTH
    API --> EVENTS
    API --> SEARCH
    API --> EVIDENCE
    EVENTS --> SQS
    SQS --> LAMBDA
    LAMBDA --> POSTGRES
    LAMBDA --> SQS
    EVIDENCE --> SEARCH
    EVIDENCE --> PYTHON
    PYTHON -. optional provider .-> STRANDS
    EVIDENCE --> POSTGRES
    API -. queue contracts .-> TYPES
    LAMBDA -. queue contracts .-> TYPES
```

### Source of truth boundaries

- PostgreSQL owns users, properties, units, tickets, ticket events, evidence, and the demo clock.
- Cedar owns authorization decisions.
- OpenSearch is a derived search/read model, not the transactional database.
- SQS carries minimal asynchronous event payloads.
- Lambda re-reads current ticket state before applying an escalation.
- The evidence agent produces drafts only; it cannot authorize or mutate ticket state.

Temporal is not used by the current repository. Asynchronous processing is implemented with SQS and Lambda.

## How It Works

### User flow

```mermaid
flowchart TD
    USER[User reports a maintenance issue]
    FORM[Next.js ticket form]
    CREATE[NestJS creates Ticket and TicketCreated event]
    RECORD[PostgreSQL stores the authoritative record]
    SEARCH[OpenSearch indexes the ticket]
    HISTORY[History search finds related unit complaints]
    EVIDENCE[Evidence service creates a grounded draft]
    USER --> FORM --> CREATE --> RECORD
    CREATE --> SEARCH
    RECORD --> HISTORY
    HISTORY --> EVIDENCE
    EVIDENCE --> USER
```

### Request and event flow

```mermaid
sequenceDiagram
    participant User
    participant Web as Next.js
    participant API as NestJS
    participant DB as PostgreSQL
    participant Queue as SQS
    participant Worker as Lambda

    User->>Web: Submit maintenance issue
    Web->>API: POST /tickets
    API->>DB: Create ticket and TicketCreated event
    API->>Queue: Publish minimal queue event
    API-->>Web: Return ticket
    Worker->>Queue: Receive event
    Worker->>DB: Re-read current ticket and demo clock
    Worker->>DB: Apply idempotent escalation transition
```

### Evidence flow

```mermaid
flowchart LR
    TICKET[Ticket]
    EVENTS[Ticket events]
    RELATED[Related historical tickets]
    AGENT[Python evidence agent]
    VALIDATE[NestJS safety validation]
    STORE[(PostgreSQL Evidence)]
    DRAFT[AI-generated draft]

    TICKET --> AGENT
    EVENTS --> AGENT
    RELATED --> AGENT
    AGENT --> VALIDATE --> STORE --> DRAFT
```

## Repository Structure

```text
.
├── apps/
│   ├── api/                 # NestJS REST API
│   ├── agent/               # Python evidence agent
│   └── web/                # Next.js application
├── cedar/
│   ├── policies/            # Cedar policies
│   └── schema/              # Cedar schema
├── docs/                    # Product, architecture, UI, and implementation docs
├── infrastructure/
│   ├── docker/              # Docker Compose environment
│   └── localstack/          # LocalStack queue initialization
├── packages/
│   └── shared/              # Shared TypeScript enums and queue contracts
├── prisma/                  # Prisma schema, migrations, and seed
├── services/
│   └── escalation/          # Lambda handler and escalation tests
├── package.json             # pnpm workspace scripts
└── pnpm-workspace.yaml      # Workspace package definitions
```

## Technology Stack

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | Next.js 16, TypeScript | Public landing page and authenticated workspace |
| UI | Tailwind CSS, shadcn-style components, Lucide | Theme, layout, controls, and icons |
| API | NestJS 12, TypeScript | REST API and application state orchestration |
| Database | PostgreSQL, Prisma 7 | Transactional source of truth |
| Authorization | Cedar WASM | Protected action decisions |
| AWS messaging | Amazon SQS | Durable asynchronous event delivery |
| AWS compute | AWS Lambda | Idempotent escalation processing |
| AWS SDK | `@aws-sdk/client-sqs` | NestJS SQS client |
| Local AWS runtime | LocalStack | Local SQS and Lambda-compatible environment |
| Lambda tooling | AWS SAM CLI | Build and invoke the escalation function locally |
| Search | OpenSearch | Historical complaint discovery |
| Agent | Python, optional Strands Agents | Evidence and notice drafts |
| Shared contracts | TypeScript package | Status, role, event, SLA, and queue types |
| Package manager | pnpm | Monorepo installation and scripts |

## Quick Start

### Prerequisites

- Node.js compatible with the workspace dependencies
- pnpm 10
- Python 3 for the evidence agent
- Docker and Docker Compose
- AWS SAM CLI if invoking the Lambda locally

### Install

```powershell
pnpm install
```

### Configure environment

The repository uses the root `.env` for Prisma and `apps/api/.env` for API configuration. Start from `.env.example` and `apps/api/.env.example`, then keep secrets out of source control.

The web app expects:

```text
apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Start infrastructure

```powershell
pnpm infra:up
```

This exposes PostgreSQL on port `35432`, OpenSearch on `9200`, and LocalStack on `4566`. LocalStack initializes the `tracehold-events` SQS queue through `infrastructure/localstack/init-aws.sh`.

### Apply schema and seed demo data

```powershell
pnpm prisma migrate deploy
pnpm prisma:seed
```

For a clean local reset:

```powershell
pnpm prisma migrate reset --force
```

The seed creates Maple Residency, Units 101/204/304/402, historical Unit 304 tickets, demo users, and the global demo clock.

### Start the API

```powershell
pnpm --filter api start:dev
```

API: `http://localhost:3001`

Health endpoint: `http://localhost:3001/health`

### Start the web app

```powershell
pnpm --filter web dev
```

Web app: `http://localhost:3000`

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Tenant | `tenant@tracehold.local` | `tracehold-demo-tenant` |
| Contractor | `contractor@tracehold.local` | `tracehold-demo-contractor` |
| Landlord | `landlord@tracehold.local` | `tracehold-demo-landlord` |
| Admin | `admin@tracehold.local` | `tracehold-demo-admin` |

## Development Commands

```powershell
pnpm dev
pnpm build
pnpm lint
pnpm test
pnpm prisma:generate
pnpm prisma:seed
```

Service-specific commands are documented in `apps/api/README.md`, `apps/web/README.md`, and `services/escalation/README.md`.

## Application Routes

| Route | Purpose |
|---|---|
| `/` | Public Tracehold landing page |
| `/login` | Authentication entry point |
| `/dashboard` | Authenticated overview and demo controls |
| `/tickets` | Ticket list |
| `/tickets/new` | Create a maintenance complaint |
| `/tickets/[id]` | Ticket details, events, and evidence |
| `/history` | Historical complaint search |
| `/evidence` | Evidence workspace |

## API Overview

The browser communicates with NestJS through REST. Important route groups include:

- `/auth`: login, registration, and current user
- `/tickets`: create, list, update, close, details, and events
- `/tickets/:id/evidence`: evidence generation and retrieval
- `/search/tickets`: historical search
- `/units/:id/history`: unit history and recurring issues
- `/demo`: demo clock and escalation evaluation

See `docs/FRONTEND-UI-UX.md`, `docs/ARCHITECTURE.md`, and `docs/PRD.md` for detailed contracts and product behavior.

## AWS and Local Event Infrastructure

Tracehold uses AWS-compatible event infrastructure for work that should not block the HTTP request.

| Component | Local implementation | Production role |
|---|---|---|
| Amazon SQS | LocalStack SQS on `localhost:4566` | Receives `TicketCreated` and `EscalationDue` messages |
| AWS Lambda | `services/escalation/src/handler.ts` | Re-reads ticket state and applies escalation transitions |
| AWS SDK for JavaScript | `@aws-sdk/client-sqs` in `apps/api` | Resolves the queue URL and publishes JSON messages |
| AWS SAM CLI | `services/escalation/template.yaml` | Builds and invokes the Lambda locally |
| LocalStack init | `infrastructure/localstack/init-aws.sh` | Creates `tracehold-events` on container startup |

The queue payload contains only the event ID, event type, ticket ID, and occurrence time. The worker never treats a stale queue payload as authoritative; it reads the current ticket and demo clock from PostgreSQL.

```mermaid
sequenceDiagram
    participant API as NestJS
    participant SDK as AWS SDK for JavaScript
    participant SQS as Amazon SQS / LocalStack
    participant Lambda as AWS Lambda
    participant DB as PostgreSQL

    API->>SDK: publishEvent(TicketCreated)
    SDK->>SQS: SendMessage
    SQS-->>Lambda: SQS event source mapping
    Lambda->>DB: Re-read ticket by ticketId
    Lambda->>DB: Check current status, SLA, and existing events
    Lambda->>DB: Write one idempotent transition
```

### Build and invoke the escalation worker

```powershell
pnpm --filter @tracehold/shared build
pnpm --filter @tracehold/escalation build
$env:DATABASE_URL="postgresql://tracehold:tracehold@localhost:35432/tracehold?schema=public"
sam build --template-file services/escalation/template.yaml
sam local invoke EscalationFunction --template-file .aws-sam/build/template.yaml --event services/escalation/events/sample-sqs.json
```

The SAM template uses `host.docker.internal` so the local Lambda container can reach PostgreSQL and OpenSearch running through Docker Compose. A deployed SQS event-source mapping is represented by the `TraceholdEvents` event in `services/escalation/template.yaml`.

## Domain Model and State Flow

```mermaid
stateDiagram-v2
    [*] --> OPEN
    OPEN --> IN_PROGRESS: repair begins
    IN_PROGRESS --> RESOLVED: repair completed
    OPEN --> ESCALATED: unresolved after 24 demo hours
    IN_PROGRESS --> ESCALATED: unresolved after 24 demo hours
    ESCALATED --> EVIDENCE_READY: unresolved after 72 demo hours
    RESOLVED --> CLOSED: permitted actor closes record
    EVIDENCE_READY --> CLOSED: permitted actor closes record
```

The transactional records are:

```text
User
  └── creates and acts on Ticket
Property
  └── contains Unit
Unit
  └── contains Ticket
Ticket
  ├── has TicketEvent timeline
  └── has Evidence drafts
DemoClock
  └── controls deterministic elapsed time
```

## Roles and Authorization

Tracehold has four seeded roles:

| Role | Primary capabilities |
|---|---|
| Tenant | Create and view maintenance complaints; view escalation history |
| Contractor | View assigned work and add repair updates; cannot close tickets |
| Landlord | View property complaints, update repair status, close permitted tickets |
| Admin | Manage the full demo workspace, evidence, history, and demo controls |

The frontend may hide an unavailable control for usability, but Cedar and the NestJS API make the final authorization decision. AI-generated content never authorizes an action.

## Evidence and Agent Boundary

The Python agent receives a structured document containing the ticket, its events, and related historical tickets. Its deterministic local mode produces source-grounded JSON with:

- `summary`
- `timeline`
- `recurringIssues`
- `relatedTickets`
- `noticeDraft`
- `modelMetadata`

The agent can optionally use Strands when `STRANDS_ENABLED=true` and a supported provider is configured. NestJS validates the output before storing it in PostgreSQL. Agent output is always a draft and must not invent timestamps, events, repairs, people, permissions, or legal conclusions.

## End-to-End Demo Walkthrough

```mermaid
flowchart TD
    A[Login as tenant]
    B[Create bathroom leak ticket]
    C[Open ticket and inspect TicketCreated]
    D[Login as admin]
    E[Advance demo clock 24h]
    F[Evaluate queued escalation]
    G[Lambda re-reads ticket]
    H[Ticket becomes ESCALATED]
    I[Advance another 48h]
    J[Evidence-ready transition]
    K[Search Unit 304 history]
    L[Generate evidence draft]
    M[Review summary and notice draft]

    A --> B --> C --> D --> E --> F --> G --> H --> I --> J --> K --> L --> M
```

The demo clock exists so the product can demonstrate delayed escalation without waiting 24 or 72 real hours. The API advances the clock and publishes due work; the Lambda worker performs the durable transition.

## Failure and Safety Model

- PostgreSQL is written before asynchronous processing begins.
- SQS messages carry identifiers, not an authoritative copy of ticket state.
- Lambda checks current status and prior escalation events before writing.
- Replayed messages do not duplicate escalation transitions.
- OpenSearch can fail independently because it is a derived read model.
- Evidence-agent failure leaves the ticket and timeline intact.
- Cedar failures fail protected operations closed.
- Validation rejects unknown request fields and invalid DTO values.

## Deployment Shape

The repository currently provides a local Docker Compose environment and an AWS SAM Lambda template. It does not contain a production cloud deployment pipeline or CI/CD workflow.

```mermaid
graph TD
    WEB[Next.js deployment]
    API[NestJS deployment]
    DB[(Managed PostgreSQL)]
    OPENSEARCH[OpenSearch]
    SQS[AWS SQS]
    LAMBDA[AWS Lambda]
    AGENT[Python evidence runtime]

    WEB --> API
    API --> DB
    API --> OPENSEARCH
    API --> SQS
    SQS --> LAMBDA
    LAMBDA --> DB
    API --> AGENT
```

For local development, the equivalent services are PostgreSQL, OpenSearch, and SQS through LocalStack. Production hosting choices for the web app, API, database, OpenSearch, and agent are not prescribed by the current repository.

## Testing

```powershell
pnpm test
pnpm --filter api test:e2e
python -m unittest test_agent.py
```

The API test suite covers auth, tickets, search, evidence, and demo-time behavior. The escalation service has idempotency tests. The Python agent has deterministic source-grounding tests.

## Documentation Map

| Goal | Read |
|---|---|
| Product requirements | `docs/PRD.md` |
| Implementation order | `docs/STEPS.md` |
| System boundaries | `docs/ARCHITECTURE.md` |
| UI behavior | `docs/FRONTEND-UI-UX.md` |
| Technology decisions | `docs/TECHSTACK.md` |
| API service | `apps/api/README.md` |
| Web application | `apps/web/README.md` |
| Lambda worker | `services/escalation/README.md` |
| Evidence agent | `apps/agent/README.md` |

## Security Boundaries

- JWT authentication protects API routes.
- Cedar is the authorization source of truth.
- The browser never accesses infrastructure services directly.
- PostgreSQL remains authoritative over ticket and evidence state.
- Evidence output is marked as a draft and validated before storage.
- Environment files and credentials must not be committed.

## License

Tracehold is licensed under the [MIT License](LICENSE).
