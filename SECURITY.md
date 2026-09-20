# Security Policy

## Supported Versions

Tracehold is currently under active development. Security fixes are applied to the current default branch. There are no separately maintained release branches at this time.

## Reporting a Vulnerability

Please do not disclose suspected vulnerabilities in a public issue.

When GitHub private vulnerability reporting is available for this repository, use the repository's **Security** tab to submit a private report. Otherwise, contact the repository maintainer privately through the contact method associated with the GitHub repository.

Include:

- affected component or path;
- a concise description of the issue;
- reproduction steps or a proof of concept;
- impact assessment;
- any suggested mitigation.

Do not include real credentials, API keys, JWT secrets, AWS credentials, or production data in a report.

## Security Boundaries

- PostgreSQL is the source of truth for application state.
- Cedar is the authorization source of truth for protected actions.
- The browser does not access PostgreSQL, SQS, Lambda, OpenSearch, or the evidence agent directly.
- JWT secrets, database credentials, AWS credentials, and model credentials must be supplied through environment variables.
- Evidence output is a draft and is validated before storage.
- The evidence agent must not authorize actions, change permissions, close tickets, or invent events and timestamps.
- SQS/Lambda processing re-reads current ticket state and must remain idempotent.

## Local Development

Local demo credentials are defined by `prisma/seed.ts` and are not production credentials. Never reuse them in a deployed environment.

Keep these files out of commits:

```text
.env
apps/api/.env
apps/web/.env.local
```

Use `.env.example` and `apps/api/.env.example` as templates only.

## Dependency and Code Review Expectations

- Keep dependencies current where practical.
- Review changes to authentication, authorization, database access, event publishing, and evidence generation carefully.
- Do not commit secrets or generated credentials.
- Add regression coverage for security-sensitive behavior.
