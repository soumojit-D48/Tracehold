"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, CircleAlert, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketStatus } from "@/components/ticket-status";
import { ApiError, apiFetch, clearSession, type Ticket } from "@/lib/api";

export default function TicketDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!params.id) return;
        apiFetch<Ticket>(`/tickets/${params.id}`)
            .then(setTicket)
            .catch((requestError) => {
                const status = requestError instanceof ApiError ? requestError.status : 0;
                if (status === 401) router.push("/login");
                setError(status === 403 ? "You do not have permission to view this ticket." : status === 404 ? "This ticket no longer exists." : "The ticket service is unavailable.");
            })
            .finally(() => setIsLoading(false));
    }, [params.id, router]);

    return (
        <main className="min-h-screen bg-[#f4f0e8] text-[#19332e]">
            <header className="border-b border-[#d8d9d1] bg-[#fffdf8]/90 px-6 py-5 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between">
                    <Link href="/tickets" className="font-heading text-xl font-bold tracking-tight">Tracehold<span className="text-[#b65f31]">.</span></Link>
                    <Button variant="ghost" size="icon" title="Sign out" onClick={() => { clearSession(); router.push("/login"); }}><LogOut /></Button>
                </div>
            </header>
            <div className="mx-auto max-w-6xl px-6 py-10">
                <Link href="/tickets" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#60736c] hover:text-[#b65f31]"><ArrowLeft className="size-4" />Back to tickets</Link>
                {isLoading && <div className="flex items-center gap-3 py-16 text-[#60736c]"><RefreshCw className="animate-spin" />Loading ticket...</div>}
                {!isLoading && error && <Card className="bg-[#fffdf8]"><CardContent className="flex items-center gap-3 p-8 text-red-700"><CircleAlert />{error}</CardContent></Card>}
                {!isLoading && !error && ticket && <>
                    <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mb-3 text-sm font-semibold tracking-[0.16em] text-[#b65f31] uppercase">Unit {ticket.unit.unitNumber} · {ticket.unit.property.name}</p><h1 className="max-w-3xl font-heading text-4xl font-bold tracking-tight">{ticket.description}</h1><div className="mt-4 flex flex-wrap items-center gap-3"><TicketStatus status={ticket.status} /><span className="text-sm text-[#60736c]">{ticket.category.replaceAll("_", " ")} · {ticket.severity}</span></div></div><div className="text-sm text-[#60736c]">Created {new Date(ticket.createdAt).toLocaleString()}</div></div>
                    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                        <Card className="bg-[#fffdf8]"><CardHeader><CardTitle className="font-heading text-xl">Event timeline</CardTitle></CardHeader><CardContent>{ticket.events?.length ? <ol className="space-y-6">{ticket.events.map((event, index) => <li key={event.id} className="relative flex gap-4"><div className="flex flex-col items-center"><span className="mt-1 size-3 rounded-full bg-[#b65f31] ring-4 ring-[#f0a66a]/25" />{index < ticket.events!.length - 1 && <span className="mt-2 h-full w-px bg-[#d8d9d1]" />}</div><div className="pb-1"><p className="font-semibold">{event.type.replaceAll("_", " ")}</p><p className="mt-1 flex items-center gap-1 text-sm text-[#60736c]"><CalendarDays className="size-3.5" />{new Date(event.createdAt).toLocaleString()}</p></div></li>)}</ol> : <p className="text-sm text-[#60736c]">No events recorded yet.</p>}</CardContent></Card>
                        <Card className="h-fit bg-[#fffdf8]"><CardHeader><CardTitle className="font-heading text-xl">Record details</CardTitle></CardHeader><CardContent className="space-y-5 text-sm"><div><p className="text-[#60736c]">Reporter</p><p className="mt-1 font-medium">{ticket.createdBy.name} · {ticket.createdBy.email}</p></div><div><p className="text-[#60736c]">Unit</p><p className="mt-1 font-medium">{ticket.unit.property.name}, Unit {ticket.unit.unitNumber}</p></div><div><p className="text-[#60736c]">Current status</p><div className="mt-2"><TicketStatus status={ticket.status} /></div></div>{ticket.resolvedAt && <div><p className="text-[#60736c]">Resolved</p><p className="mt-1 font-medium">{new Date(ticket.resolvedAt).toLocaleString()}</p></div>}</CardContent></Card>
                    </div>
                </>}
            </div>
        </main>
    );
}
