"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, ClipboardList, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TicketStatus } from "@/components/ticket-status";
import { ApiError, apiFetch, type Ticket } from "@/lib/api";
import { AppShell } from "@/components/workspace/app-shell";

export default function TicketsPage() {
    const router = useRouter();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const loadTickets = useCallback(async () => {
        setIsLoading(true); setError("");
        try { setTickets(await apiFetch<Ticket[]>("/tickets")); }
        catch (requestError) { const status = requestError instanceof ApiError ? requestError.status : 0; if (status === 401) router.push("/login"); setError(status === 403 ? "You do not have permission to view these tickets." : "The ticket service is unavailable."); }
        finally { setIsLoading(false); }
    }, [router]);

    useEffect(() => { const timer = window.setTimeout(() => { void loadTickets(); }, 0); return () => window.clearTimeout(timer); }, [loadTickets]);

    return <AppShell><div className="mx-auto max-w-[1300px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Maintenance record / All tickets</p><h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">Every issue, kept visible.</h1><p className="mt-3 text-muted-foreground">Track the complaint, the delay, and the action that follows.</p></div><Button asChild className="rounded-xl"><Link href="/tickets/new"><Plus size={16} />Create issue</Link></Button></div>{error && <div role="alert" className="mt-8 flex items-center justify-between rounded-2xl bg-signal-soft p-4 text-sm text-signal"><span>{error}</span><Button variant="ghost" size="sm" onClick={() => void loadTickets()}><RefreshCw size={15} />Retry</Button></div>}{isLoading && <div className="mt-12 flex items-center gap-3 text-sm text-muted-foreground"><RefreshCw className="animate-spin" size={16} />Loading tickets...</div>}{!isLoading && !error && tickets.length === 0 && <Card className="mt-10 border-dashed bg-card shadow-clay"><CardContent className="p-16 text-center"><ClipboardList className="mx-auto text-primary" size={38} /><h2 className="mt-5 font-display text-2xl font-bold">No tickets yet</h2><p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Create the first record so every repair has a beginning.</p><Button asChild className="mt-6 rounded-xl"><Link href="/tickets/new">Create issue</Link></Button></CardContent></Card>}{!isLoading && !error && tickets.length > 0 && <Card className="mt-10 overflow-hidden border-border bg-card shadow-clay"><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-surface"><tr>{["Ticket", "Unit", "Issue", "Severity", "Status", "Created", ""].map((heading) => <th key={heading} className="px-5 py-4 font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">{heading}</th>)}</tr></thead><tbody className="divide-y divide-border">{tickets.map((ticket) => <tr key={ticket.id} tabIndex={0} role="link" onClick={() => router.push(`/tickets/${ticket.id}`)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); router.push(`/tickets/${ticket.id}`); } }} className="cursor-pointer transition-colors hover:bg-surface focus:bg-surface focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring"><td className="px-5 py-5"><Link href={`/tickets/${ticket.id}`} onClick={(event) => event.stopPropagation()} className="font-mono text-xs font-semibold text-primary hover:underline">#{ticket.id.slice(-6).toUpperCase()}</Link></td><td className="px-5 py-5 text-sm">Unit {ticket.unit.unitNumber}</td><td className="max-w-[280px] px-5 py-5 text-sm font-medium">{ticket.description}</td><td className="px-5 py-5 font-mono text-[10px] font-semibold">{ticket.severity}</td><td className="px-5 py-5"><TicketStatus status={ticket.status} /></td><td className="whitespace-nowrap px-5 py-5 text-xs text-muted-foreground">{new Date(ticket.createdAt).toLocaleDateString()}</td><td className="px-5 py-5"><ArrowRight className="text-primary" size={17} /></td></tr>)}</tbody></table></div></CardContent></Card>}</div></AppShell>;
}
