"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, ClipboardList, LogOut, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TicketStatus } from "@/components/ticket-status";
import { ApiError, apiFetch, clearSession, type Ticket } from "@/lib/api";

export default function TicketsPage() {
    const router = useRouter();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    async function loadTickets() {
        setIsLoading(true);
        setError("");
        try {
            setTickets(await apiFetch<Ticket[]>("/tickets"));
        } catch (requestError) {
            const status = requestError instanceof ApiError ? requestError.status : 0;
            if (status === 401) router.push("/login");
            setError(status === 403 ? "You do not have permission to view these tickets." : "The ticket service is unavailable.");
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        let active = true;
        apiFetch<Ticket[]>("/tickets")
            .then((items) => { if (active) setTickets(items); })
            .catch((requestError) => {
                if (!active) return;
                const status = requestError instanceof ApiError ? requestError.status : 0;
                if (status === 401) router.push("/login");
                setError(status === 403 ? "You do not have permission to view these tickets." : "The ticket service is unavailable.");
            })
            .finally(() => { if (active) setIsLoading(false); });
        return () => { active = false; };
    }, [router]);

    return (
        <main className="min-h-screen bg-[#f4f0e8] text-[#19332e]">
            <header className="border-b border-[#d8d9d1] bg-[#fffdf8]/90 px-6 py-5 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between">
                    <Link href="/" className="font-heading text-xl font-bold tracking-tight">Tracehold<span className="text-[#b65f31]">.</span></Link>
                    <div className="flex items-center gap-2"><Button variant="ghost" size="icon" title="Sign out" onClick={() => { clearSession(); router.push("/login"); }}><LogOut /></Button></div>
                </div>
            </header>
            <div className="mx-auto max-w-6xl px-6 py-12">
                <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                    <div><p className="mb-2 text-sm font-semibold tracking-[0.16em] text-[#b65f31] uppercase">Maintenance record</p><h1 className="font-heading text-4xl font-bold tracking-tight">Your tickets</h1><p className="mt-2 text-[#60736c]">Every issue, update, and resolution in one place.</p></div>
                    <Button asChild className="rounded-xl bg-[#19332e] text-white hover:bg-[#2d5148]"><Link href="/tickets/new"><Plus />Create issue</Link></Button>
                </div>
                {error && <div role="alert" className="mb-6 flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><span>{error}</span><Button variant="ghost" size="sm" onClick={() => void loadTickets()}><RefreshCw />Retry</Button></div>}
                {isLoading && <div className="flex items-center gap-3 py-16 text-[#60736c]"><RefreshCw className="animate-spin" />Loading tickets...</div>}
                {!isLoading && !error && tickets.length === 0 && <Card className="border-dashed bg-[#fffdf8] py-16 text-center"><CardContent><ClipboardList className="mx-auto mb-4 size-10 text-[#b65f31]" /><h2 className="font-heading text-2xl font-semibold">No tickets yet</h2><p className="mx-auto mt-2 max-w-sm text-[#60736c]">Create the first record so every repair has a beginning.</p><Button asChild className="mt-6 rounded-xl bg-[#b65f31] text-white"><Link href="/tickets/new">Create issue</Link></Button></CardContent></Card>}
                {!isLoading && !error && tickets.length > 0 && <div className="grid gap-4">{tickets.map((ticket) => <Link key={ticket.id} href={`/tickets/${ticket.id}`}><Card className="bg-[#fffdf8] transition-transform hover:-translate-y-0.5 hover:ring-[#b65f31]/40"><CardContent className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="mb-2 flex flex-wrap items-center gap-3"><span className="text-xs font-semibold tracking-wide text-[#60736c]">UNIT {ticket.unit.unitNumber}</span><TicketStatus status={ticket.status} /></div><h2 className="font-heading text-lg font-semibold">{ticket.description}</h2><p className="mt-1 text-sm text-[#60736c]">{ticket.category.replaceAll("_", " ")} · {ticket.severity} · {new Date(ticket.createdAt).toLocaleDateString()}</p></div><ArrowRight className="hidden text-[#b65f31] sm:block" /></CardContent></Card></Link>)}</div>}
            </div>
        </main>
    );
}
