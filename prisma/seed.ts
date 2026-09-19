import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import { PrismaClient, TicketCategory, TicketSeverity, TicketStatus, UserRole } from '../apps/api/src/generated/prisma/client.js';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const demoUsers = [
        { name: 'Demo Tenant', email: 'tenant@tracehold.local', role: UserRole.TENANT },
        { name: 'Demo Contractor', email: 'contractor@tracehold.local', role: UserRole.CONTRACTOR },
        { name: 'Demo Landlord', email: 'landlord@tracehold.local', role: UserRole.LANDLORD },
        { name: 'Demo Admin', email: 'admin@tracehold.local', role: UserRole.ADMIN },
    ];
    const users = await Promise.all(
        demoUsers.map(async (demoUser) =>
            prisma.user.upsert({
                where: { email: demoUser.email },
                update: { name: demoUser.name, role: demoUser.role },
                create: {
                    ...demoUser,
                    passwordHash: await hash(`tracehold-demo-${demoUser.role.toLowerCase()}`, 12),
                },
            }),
        ),
    );
    const tenant = users.find((user) => user.role === UserRole.TENANT);
    const contractor = users.find((user) => user.role === UserRole.CONTRACTOR);
    if (!tenant || !contractor) throw new Error('Demo tenant and contractor were not created');

    const property = await prisma.property.upsert({
        where: { id: 'maple-residency' },
        update: { name: 'Maple Residency', address: '14 Maple Street' },
        create: {
            id: 'maple-residency',
            name: 'Maple Residency',
            address: '14 Maple Street',
        },
    });

    const unitNumbers = ['101', '204', '304', '402'];
    const units = await Promise.all(
        unitNumbers.map((unitNumber) =>
            prisma.unit.upsert({
                where: { propertyId_unitNumber: { propertyId: property.id, unitNumber } },
                update: {},
                create: { propertyId: property.id, unitNumber },
            }),
        ),
    );
    const unit304 = units.find((unit) => unit.unitNumber === '304');
    if (!unit304) throw new Error('Unit 304 was not created');

    const historicalTickets = [
        {
            id: 'ticket-unit-304-ceiling-leak',
            description: 'Bathroom ceiling is leaking after rainfall.',
            category: TicketCategory.WATER_DAMAGE,
            severity: TicketSeverity.HIGH,
            status: TicketStatus.RESOLVED,
        },
        {
            id: 'ticket-unit-304-water-damage',
            description: 'Water damage is spreading near the bathroom light fixture.',
            category: TicketCategory.WATER_DAMAGE,
            severity: TicketSeverity.HIGH,
            status: TicketStatus.CLOSED,
        },
        {
            id: 'ticket-unit-304-moisture',
            description: 'Recurring ceiling moisture and paint bubbling in the bathroom.',
            category: TicketCategory.STRUCTURAL,
            severity: TicketSeverity.MEDIUM,
            status: TicketStatus.RESOLVED,
        },
        {
            id: 'ticket-unit-304-pipe-leak',
            description: 'Pipe leak suspected behind the bathroom wall.',
            category: TicketCategory.PLUMBING,
            severity: TicketSeverity.HIGH,
            status: TicketStatus.OPEN,
        },
    ];

    for (const ticket of historicalTickets) {
        await prisma.ticket.upsert({
            where: { id: ticket.id },
            update: {
                ...ticket,
                assignedToId: ticket.id === 'ticket-unit-304-pipe-leak' ? contractor.id : undefined,
            },
            create: {
                ...ticket,
                unitId: unit304.id,
                createdById: tenant.id,
                assignedToId: ticket.id === 'ticket-unit-304-pipe-leak' ? contractor.id : undefined,
            },
        });
    }

    console.log(`Seeded ${historicalTickets.length} tickets for Maple Residency Unit 304.`);
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });