import { SearchService, TICKETS_INDEX, type TicketSearchDocument } from './search.service.js';

describe('SearchService', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('indexes the required derived ticket document', async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);
        const service = new SearchService({} as never);
        const ticket = {
            id: 'ticket-1',
            unitId: 'unit-304',
            category: 'WATER_DAMAGE',
            description: 'Bathroom ceiling leak',
            severity: 'HIGH',
            status: 'OPEN',
            createdAt: new Date('2026-09-01T00:00:00.000Z'),
            unit: { propertyId: 'property-1', unitNumber: '304' },
        };

        await service.indexTicket(ticket as never);

        expect(fetchMock).toHaveBeenCalledWith(
            `http://localhost:9200/${TICKETS_INDEX}/_doc/ticket-1?refresh=wait_for`,
            expect.objectContaining({ method: 'PUT' }),
        );
        const options = fetchMock.mock.calls[0][1] as RequestInit;
        expect(JSON.parse(options.body as string)).toEqual({
            ticketId: 'ticket-1',
            propertyId: 'property-1',
            unitId: 'unit-304',
            unitNumber: '304',
            category: 'WATER_DAMAGE',
            description: 'Bathroom ceiling leak',
            severity: 'HIGH',
            status: 'OPEN',
            createdAt: '2026-09-01T00:00:00.000Z',
        });
    });

    it('returns search results and recurring issue groups from OpenSearch', async () => {
        const tickets: TicketSearchDocument[] = [
            {
                ticketId: 'ticket-1', propertyId: 'property-1', unitId: 'unit-304', unitNumber: '304',
                category: 'WATER_DAMAGE', description: 'Bathroom ceiling leaking', severity: 'HIGH', status: 'OPEN', createdAt: '2026-09-01T00:00:00.000Z',
            },
            {
                ticketId: 'ticket-2', propertyId: 'property-1', unitId: 'unit-304', unitNumber: '304',
                category: 'WATER_DAMAGE', description: 'Water damage near bathroom', severity: 'HIGH', status: 'CLOSED', createdAt: '2026-08-01T00:00:00.000Z',
            },
        ];
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(new Response(JSON.stringify({ hits: { hits: tickets.map((_source) => ({ _source })) } }), { status: 200 }))
            .mockResolvedValueOnce(new Response(JSON.stringify({ hits: { hits: tickets.map((_source) => ({ _source })) } }), { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);
        const service = new SearchService({} as never);

        await expect(service.searchTickets('water leak')).resolves.toEqual(tickets);
        const history = await service.getUnitHistory('unit-304');
        expect(history).toMatchObject({ unitId: 'unit-304', tickets });
        expect(history.recurringIssues).toEqual(expect.arrayContaining([
            { category: 'WATER_DAMAGE', count: 2, ticketIds: ['ticket-1', 'ticket-2'] },
        ]));
    });
});
