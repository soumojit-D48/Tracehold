"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, CircleAlert, FileCheck2, RefreshCw } from "lucide-react";
import { Button } from "@tracehold/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@tracehold/ui/card";
import { TicketStatus } from "@/components/ticket-status";
import { ApiError, apiFetch, type Ticket, type TicketEvent } from "@/lib/api";
import { AppShell } from "@/components/workspace/app-shell";

type Evidence = { summary: string; relatedTickets: string[]; noticeDraft?: string | null; generatedAt: string };

export default function TicketDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [events, setEvents] = useState<TicketEvent[]>([]);
    const [evidence, setEvidence] = useState<Evidence | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    const loadTicket = useCallback(async () => {
        if (!params.id) return;
        setLoading(true); setError("");
        try { const [ticketData, eventData] = await Promise.all([apiFetch<Ticket>(`/tickets/${params.id}`), apiFetch<TicketEvent[]>(`/tickets/${params.id}/events`)]); setTicket(ticketData); setEvents(eventData); setEvidence(await apiFetch<Evidence>(`/tickets/${params.id}/evidence`).catch(() => null)); }
        catch (requestError) { const status = requestError instanceof ApiError ? requestError.status : 0; if (status === 401) router.push("/login"); setError(status === 403 ? "You do not have permission to view this ticket." : status === 404 ? "This ticket no longer exists." : "The ticket service is unavailable."); }
        finally { setLoading(false); }
    }, [params.id, router]);

    useEffect(() => { const timer = window.setTimeout(() => { void loadTicket(); }, 0); return () => window.clearTimeout(timer); }, [loadTicket]);

    async function generateEvidence() { if (!params.id) return; setGenerating(true); setError(""); try { setEvidence(await apiFetch<Evidence>(`/tickets/${params.id}/evidence`, { method: "POST" })); } catch (requestError) { setError(requestError instanceof ApiError && requestError.status === 403 ? "Cedar denied evidence generation for this ticket." : "Evidence generation failed. The ticket record is unchanged."); } finally { setGenerating(false); } }

    return <AppShell><div className="mx-auto max-w-[1300px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12"><Link href="/tickets" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"><ArrowLeft size={16} />Back to tickets</Link>{loading && <div className="mt-12 flex items-center gap-3 text-sm text-muted-foreground"><RefreshCw className="animate-spin" size={16} />Loading ticket...</div>}{!loading && error && <Card className="mt-8 border-border bg-card"><CardContent className="flex items-center gap-3 p-8 text-sm text-signal"><CircleAlert size={18} />{error}<Button variant="ghost" size="sm" onClick={() => void loadTicket()}>Retry</Button></CardContent></Card>}{!loading && !error && ticket && <><div className="mt-9 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="eyebrow">Unit {ticket.unit.unitNumber} · {ticket.unit.property.name}</p><h1 className="mt-3 max-w-3xl font-display text-4xl font-bold tracking-tight">{ticket.description}</h1><div className="mt-4 flex flex-wrap items-center gap-3"><TicketStatus status={ticket.status} /><span className="font-mono text-xs uppercase text-muted-foreground">{ticket.category.replaceAll("_", " ")} · {ticket.severity}</span></div></div><p className="text-sm text-muted-foreground">Created {new Date(ticket.createdAt).toLocaleString()}</p></div><div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><Card className="border-border bg-card shadow-clay"><CardHeader className="border-b border-border"><CardTitle className="font-display text-2xl">Event timeline</CardTitle></CardHeader><CardContent className="p-6">{events.length ? <ol className="space-y-6">{events.map((event, index) => <li key={event.id} className="flex gap-4"><div className="flex flex-col items-center"><span className="mt-1 grid size-4 place-items-center rounded-full bg-signal ring-4 ring-signal-soft"><span className="size-1.5 rounded-full bg-signal-foreground" /></span>{index < events.length - 1 && <span className="mt-2 h-full w-px bg-timeline" />}</div><div className="pb-1"><p className="font-semibold">{event.type.replaceAll("_", " ")}</p><p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><CalendarDays size={14} />{new Date(event.createdAt).toLocaleString()}</p></div></li>)}</ol> : <p className="text-sm text-muted-foreground">No events recorded yet.</p>}</CardContent></Card><Card className="h-fit border-border bg-card shadow-clay"><CardHeader className="border-b border-border"><CardTitle className="font-display text-2xl">Record details</CardTitle></CardHeader><CardContent className="space-y-5 p-6 text-sm"><div><p className="document-label">Reporter</p><p className="mt-2 font-medium">{ticket.createdBy.name} · {ticket.createdBy.email}</p></div><div><p className="document-label">Unit</p><p className="mt-2 font-medium">{ticket.unit.property.name}, Unit {ticket.unit.unitNumber}</p></div><div><p className="document-label">Current status</p><div className="mt-2"><TicketStatus status={ticket.status} /></div></div>{ticket.resolvedAt && <div><p className="document-label">Resolved</p><p className="mt-2 font-medium">{new Date(ticket.resolvedAt).toLocaleString()}</p></div>}</CardContent></Card></div><Card className="mt-6 border-border bg-card shadow-clay"><CardContent className="p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="eyebrow">Evidence workspace</p><h2 className="mt-2 font-display text-2xl font-bold">Evidence summary / related complaints / notice draft</h2></div><Button disabled={generating} onClick={() => void generateEvidence()} className="rounded-xl">{generating ? "Generating..." : "Generate evidence"}<FileCheck2 size={16} /></Button></div>{evidence ? <div className="mt-6 grid gap-5 lg:grid-cols-3"><div className="rounded-xl bg-primary-soft p-4 lg:col-span-2"><p className="document-label">AI-generated draft</p><p className="mt-3 text-sm leading-relaxed">{evidence.summary}</p></div><div className="rounded-xl bg-surface p-4"><p className="document-label">Related complaints</p><p className="mt-3 font-display text-3xl font-bold">{evidence.relatedTickets.length}</p><p className="mt-1 text-xs text-muted-foreground">Generated {new Date(evidence.generatedAt).toLocaleDateString()}</p></div>{evidence.noticeDraft && <div className="rounded-xl border border-border bg-secondary p-4 lg:col-span-3"><p className="document-label">Notice draft</p><p className="mt-3 text-sm leading-relaxed">{evidence.noticeDraft}</p></div>}</div> : <p className="mt-6 text-sm text-muted-foreground">No evidence draft exists yet. Generate one when the record is ready.</p>}</CardContent></Card></>}</div></AppShell>;
}
