import { ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { isAuthorized, type AuthorizationCall, type EntityJson } from '@cedar-policy/cedar-wasm/nodejs';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { AuthUser } from '../auth/auth.types.js';

const policyPath = resolve(process.cwd(), '../../cedar/policies/tracehold.cedar');
const policyText = readFileSync(policyPath, 'utf8');

@Injectable()
export class AuthorizationService {
    authorize(user: AuthUser, action: string, resource: EntityJson, extraEntities: EntityJson[] = []) {
        const principal = { type: 'User', id: user.id };
        const referencedEntities = ['createdBy', 'assignedTo']
            .map((attribute) => resource.attrs[attribute])
            .filter((value): value is { __entity: { type: string; id: string } } =>
                typeof value === 'object' && value !== null && '__entity' in value,
            )
            .map((value) => value.__entity)
            .filter((entity, index, entities) =>
                entity.id !== user.id && entities.findIndex((candidate) => candidate.id === entity.id) === index,
            )
            .map((entity) => ({ uid: entity, attrs: {}, parents: [] }));
        const entities: EntityJson[] = [
            { uid: principal, attrs: { role: user.role }, parents: [] },
            resource,
            ...referencedEntities,
            ...extraEntities,
        ];
        const call: AuthorizationCall = {
            principal,
            action: { type: 'Action', id: action },
            resource: resource.uid,
            context: {},
            policies: { staticPolicies: policyText },
            entities,
            validateRequest: false,
        };
        const result = isAuthorized(call);
        if (result.type === 'failure') {
            throw new InternalServerErrorException('Cedar authorization evaluation failed.');
        }
        if (result.response.decision !== 'allow') {
            throw new ForbiddenException('Cedar denied this action.');
        }
    }

    ticketResource(ticket: { id: string; createdById: string; assignedToId?: string | null }): EntityJson {
        const attrs: EntityJson['attrs'] = {
            createdBy: { __entity: { type: 'User', id: ticket.createdById } },
        };
        if (ticket.assignedToId) {
            attrs.assignedTo = { __entity: { type: 'User', id: ticket.assignedToId } };
        }
        return {
            uid: { type: 'Ticket', id: ticket.id },
            attrs,
            parents: [],
        };
    }
}