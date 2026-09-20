"use client";

import Link from "next/link";
import { Activity, ArrowRight, CheckCircle2, Clock3, FileCheck2, History, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TicketStatus } from "@/components/ticket-status";
import { ApiError, apiFetch, type Ticket, type TicketEvent } from "@/lib/api";
import { AppShell } from "@/components/workspace/app-shell";

type DemoClock = { now: string };
type Evidence = { summary: string; timeline: unknown; relatedTickets: string[]; noticeDraft?: string | null; generatedAt: string };

const statCards = [
    ["Open issues", "OPEN", Activity, "text-primary"],
    ["Escalated issues", "ESCALATED", TriangleAlert, "text-signal"],
    ["Evidence ready", "EVIDENCE_READY", FileCheck2, "text-primary"],
] as const;

function formatDate(value: string) { return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)); }

export default function DashboardPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [clock, setClock] = useState<DemoClock | null>(null);
    const [events, setEvents] = useState<TicketEvent[]>([]);
    const [evidence, setEvidence] = useState<Evidence | null>(null);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [loading, setLoading] = useState(true);
    const [mutating, setMutating] = useState(false);

    async function loadDashboard() {
        setLoading(true);
        setError("");
        try {
            const ticketData = await apiFetch<Ticket[]>("/tickets");
            setTickets(ticketData);
            setClock(await apiFetch<DemoClock>("/demo/clock").catch(() => null));
            const selected = ticketData[0];
            if (selected) {
                const [eventData, evidenceData] = await Promise.all([
                    apiFetch<TicketEvent[]>(`/tickets/${selected.id}/events`),
                    apiFetch<Evidence>(`/tickets/${selected.id}/evidence`).catch(() => null),
                ]);
                setEvents(eventData);
                setEvidence(evidenceData);
            }
        } catch (requestError) {
            setError(requestError instanceof ApiError && requestError.status === 403 ? "Your account cannot access the dashboard records." : "The workspace could not load. Check the API and retry.");
        } finally { setLoading(false); }
    }

    useEffect(() => {
        const timer = window.setTimeout(() => { void loadDashboard(); }, 0);
        return () => window.clearTimeout(timer);
    }, []);

    async function advance(hours: number) {
        setMutating(true); setNotice("");
        try {
            const result = await apiFetch<{ now: string; queued: number }>("/demo/advance-time", { method: "POST", body: JSON.stringify({ hours }) });
            setNotice(`Demo clock advanced ${hours} hours. ${result.queued} escalation event${result.queued === 1 ? "" : "s"} queued.`);
            await loadDashboard();
        } catch (requestError) { setNotice(requestError instanceof ApiError && requestError.status === 403 ? "Cedar denied demo-clock access for this account." : "Demo time could not be advanced."); } finally { setMutating(false); }
    }

    async function evaluate() {
        setMutating(true); setNotice("");
        try { const result = await apiFetch<{ queued: number }>("/demo/escalations/evaluate", { method: "POST" }); setNotice(`${result.queued} due escalation${result.queued === 1 ? "" : "s"} evaluated.`); await loadDashboard(); } catch (requestError) { setNotice(requestError instanceof ApiError && requestError.status === 403 ? "Cedar denied escalation evaluation for this account." : "Escalations could not be evaluated."); } finally { setMutating(false); }
    }

    const selected = tickets[0];
    const count = (status: string) => tickets.filter((ticket) => ticket.status === status).length;
    return <AppShell><div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-10 lg:py-10"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Overview / Maintenance control room</p><h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">Keep the record moving.</h1><p className="mt-3 max-w-xl text-muted-foreground">A live view of unresolved complaints, escalation signals, recurring patterns, and evidence readiness.</p></div><Button asChild className="rounded-xl shadow-clay-sm"><Link href="/tickets/new">Create issue <ArrowRight size={16} /></Link></Button></div>
        {error && <div role="alert" className="mt-8 flex items-center justify-between rounded-2xl border border-signal/30 bg-signal-soft p-4 text-sm text-signal"><span>{error}</span><Button variant="ghost" size="sm" onClick={() => void loadDashboard()}><RefreshCw size={15} />Retry</Button></div>}
        <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{statCards.map(([label, status, Icon, tone]) => <Card key={status} className="border-border bg-card shadow-clay-sm"><CardContent className="flex items-start justify-between p-5"><div><p className="document-label">{label}</p><p className="mt-4 font-display text-4xl font-bold">{loading ? "—" : count(status)}</p><p className="mt-2 text-xs text-muted-foreground">Across visible records</p></div><span className={`grid size-11 place-items-center rounded-xl bg-primary-soft ${tone}`}><Icon size={20} /></span></CardContent></Card>)}<Card className="border-border bg-card shadow-clay-sm sm:col-span-2 xl:col-span-1"><CardContent className="flex items-start justify-between p-5"><div><p className="document-label">Recurring issues</p><p className="mt-4 font-display text-4xl font-bold">{selected ? "01" : "—"}</p><p className="mt-2 text-xs text-muted-foreground">Pattern signals found</p></div><span className="grid size-11 place-items-center rounded-xl bg-signal-soft text-signal"><History size={20} /></span></CardContent></Card></div>
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]"><Card className="border-border bg-card shadow-clay"><CardContent className="p-0"><div className="flex items-center justify-between border-b border-border p-5 sm:p-6"><div><p className="eyebrow">Recent ticket activity</p><h2 className="mt-2 font-display text-2xl font-bold">Maintenance records</h2></div><Link href="/tickets" className="text-sm font-semibold text-primary hover:underline">View all <ArrowRight className="ml-1 inline" size={15} /></Link></div>{loading && <div className="flex items-center gap-3 p-8 text-sm text-muted-foreground"><RefreshCw className="animate-spin" size={16} />Loading records...</div>}{!loading && !tickets.length && <div className="p-10 text-center"><ClipboardEmpty /><p className="mt-4 font-display text-xl font-bold">No maintenance records yet</p><p className="mt-2 text-sm text-muted-foreground">Create the first issue so every repair has a beginning.</p></div>}{!loading && tickets.length > 0 && <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead className="bg-surface"><tr>{["Ticket", "Unit", "Issue", "Severity", "Status", "Created"].map((heading) => <th key={heading} className="px-5 py-3 font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">{heading}</th>)}</tr></thead><tbody className="divide-y divide-border">{tickets.slice(0, 6).map((ticket) => <tr key={ticket.id} className="transition-colors hover:bg-surface"><td className="px-5 py-4"><Link className="font-mono text-xs font-semibold text-primary hover:underline" href={`/tickets/${ticket.id}`}>#{ticket.id.slice(-6).toUpperCase()}</Link></td><td className="px-5 py-4 text-sm">Unit {ticket.unit.unitNumber}</td><td className="max-w-[240px] px-5 py-4 text-sm font-medium">{ticket.description}</td><td className="px-5 py-4"><span className="font-mono text-[10px] font-semibold">{ticket.severity}</span></td><td className="px-5 py-4"><TicketStatus status={ticket.status} /></td><td className="whitespace-nowrap px-5 py-4 text-xs text-muted-foreground">{formatDate(ticket.createdAt)}</td></tr>)}</tbody></table></div>}</CardContent></Card>
            <Card className="border-border bg-ink text-mist shadow-ink"><CardContent className="p-6"><div className="flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.14em] text-forensic-light">Demo timeline</p><h2 className="mt-3 font-display text-2xl font-bold">Time is part of the record.</h2></div><Clock3 className="text-signal" size={22} /></div><p className="mt-5 font-mono text-sm text-mist/70">{clock ? new Date(clock.now).toLocaleString() : "Loading demo clock..."}</p><div className="mt-6 grid gap-2 sm:grid-cols-3 xl:grid-cols-1"><Button disabled={mutating} onClick={() => void advance(24)} className="justify-between bg-signal text-signal-foreground hover:bg-signal/90">Advance 24h <ArrowRight size={15} /></Button><Button disabled={mutating} onClick={() => void advance(48)} variant="outline" className="justify-between border-mist/20 bg-transparent text-mist hover:bg-mist/10 hover:text-mist">Advance 48h <ArrowRight size={15} /></Button><Button disabled={mutating} onClick={() => void evaluate()} variant="outline" className="justify-between border-mist/20 bg-transparent text-mist hover:bg-mist/10 hover:text-mist">Evaluate escalation <ShieldCheck size={15} /></Button></div>{notice && <p role="status" className="mt-5 rounded-xl bg-mist/10 p-3 text-xs leading-relaxed text-mist/75">{notice}</p>}<p className="mt-6 text-xs leading-relaxed text-mist/50">Deterministic demo controls advance the server clock. The API remains authoritative for status transitions.</p></CardContent></Card></div>
        <div className="mt-6 grid gap-6 lg:grid-cols-3"><Card className="border-signal/25 bg-signal-soft shadow-clay-sm"><CardContent className="p-6"><div className="flex items-center gap-3 text-signal"><TriangleAlert size={20} /><p className="eyebrow text-signal">Recurring issue detected</p></div><h2 className="mt-5 font-display text-2xl font-bold">Unit 304</h2><p className="mt-2 text-sm text-muted-foreground">4 water-related complaints over the last 6 months</p><Link href="/history" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-signal hover:underline">View unit history <ArrowRight size={15} /></Link></CardContent></Card><Card className="border-border bg-card shadow-clay-sm lg:col-span-2"><CardContent className="p-6"><div className="flex items-center justify-between gap-4"><div><p className="eyebrow">Ticket timeline</p><h2 className="mt-2 font-display text-2xl font-bold">{selected ? selected.description : "No ticket selected"}</h2></div>{selected && <TicketStatus status={selected.status} />}</div>{selected && events.length > 0 ? <ol className="mt-6 grid gap-4 sm:grid-cols-2">{events.slice(-4).map((event, index) => <li key={event.id} className="flex gap-3 rounded-xl border border-border bg-surface p-4"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft font-mono text-[10px] text-primary">0{index + 1}</span><div><p className="text-sm font-semibold">{event.type.replaceAll("_", " ")}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(event.createdAt)}</p></div></li>)}</ol> : <p className="mt-6 text-sm text-muted-foreground">Create a ticket to see its event timeline.</p>}</CardContent></Card></div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2"><Card className="border-border bg-card shadow-clay-sm"><CardContent className="p-6"><div className="flex items-center gap-3"><ShieldCheck className="text-primary" size={21} /><p className="eyebrow">Cedar decision panel</p></div><h2 className="mt-4 font-display text-2xl font-bold">Protected action: Close Ticket</h2><div className="mt-5 flex items-center justify-between rounded-xl bg-surface p-4"><span className="text-sm text-muted-foreground">Decision is evaluated by Cedar and enforced by the API.</span><span className="rounded-full bg-primary-soft px-3 py-1 font-mono text-[10px] uppercase text-primary">API enforced</span></div><p className="mt-4 text-xs leading-relaxed text-muted-foreground">The interface never overrides a Cedar decision. A denied action leaves the ticket and timeline unchanged.</p></CardContent></Card><Card className="border-primary/20 bg-primary text-primary-foreground shadow-clay-sm"><CardContent className="p-6"><div className="flex items-center gap-3"><FileCheck2 size={21} /><p className="eyebrow text-primary-foreground/70">Evidence panel</p></div><h2 className="mt-4 font-display text-2xl font-bold">Evidence Summary</h2>{evidence ? <><p className="mt-4 text-sm leading-relaxed opacity-80">{evidence.summary}</p><div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full bg-primary-foreground/15 px-3 py-1 font-mono text-[10px]">Timeline</span><span className="rounded-full bg-primary-foreground/15 px-3 py-1 font-mono text-[10px]">{evidence.relatedTickets.length} Related Complaints</span><span className="rounded-full bg-primary-foreground/15 px-3 py-1 font-mono text-[10px]">Notice Draft</span></div></> : <p className="mt-4 text-sm leading-relaxed opacity-75">Evidence will appear here after the ticket reaches the evidence-ready stage and generation is requested.</p>}<span className="mt-6 inline-flex rounded-full bg-primary-foreground/15 px-3 py-1 font-mono text-[10px] uppercase">AI-generated draft</span></CardContent></Card></div>
    </div></AppShell>;
}

function ClipboardEmpty() { return <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary"><CheckCircle2 size={22} /></span>; }
