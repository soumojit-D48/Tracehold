"use client";

import Link from "next/link";
import { ArrowRight, FileCheck2, RefreshCw, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@tracehold/ui/button";
import { Card, CardContent } from "@tracehold/ui/card";
import { AppShell } from "@/components/workspace/app-shell";
import { ApiError, apiFetch, type Ticket } from "@/lib/api";

type Evidence = { id: string; ticketId: string; summary: string; timeline: unknown; relatedTickets: string[]; noticeDraft?: string | null; generatedAt: string };

export default function EvidencePage() {
    const [records, setRecords] = useState<Array<{ ticket: Ticket; evidence: Evidence }>>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [generating, setGenerating] = useState("");

    async function loadEvidence() {
        setLoading(true); setError("");
        try {
            const tickets = await apiFetch<Ticket[]>("/tickets");
            const pairs = await Promise.all(tickets.map(async (ticket) => {
                const evidence = await apiFetch<Evidence>(`/tickets/${ticket.id}/evidence`).catch(() => null);
                return evidence ? { ticket, evidence } : null;
            }));
            setRecords(pairs.filter((item): item is { ticket: Ticket; evidence: Evidence } => item !== null));
        } catch (requestError) {
            setError(requestError instanceof ApiError && requestError.status === 403 ? "You do not have permission to view evidence." : "The evidence workspace is unavailable right now.");
        } finally { setLoading(false); }
    }

    useEffect(() => {
        const timer = window.setTimeout(() => { void loadEvidence(); }, 0);
        return () => window.clearTimeout(timer);
    }, []);

    async function generate(ticketId: string) {
        setGenerating(ticketId); setError("");
        try { await apiFetch<Evidence>(`/tickets/${ticketId}/evidence`, { method: "POST" }); await loadEvidence(); } catch (requestError) { setError(requestError instanceof ApiError && requestError.status === 403 ? "Cedar denied evidence generation for this ticket." : "Evidence generation failed. The ticket record is unchanged."); } finally { setGenerating(""); }
    }

    return <AppShell><div className="mx-auto max-w-[1300px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Evidence workspace / Draft records</p><h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">Evidence you can inspect.</h1><p className="mt-3 max-w-2xl text-muted-foreground">Summaries, timelines, related complaints, and notice drafts stay connected to the recorded ticket events.</p></div><span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-2 font-mono text-[10px] uppercase text-primary"><ShieldAlert size={14} />AI drafts require review</span></div>{error && <div role="alert" className="mt-8 rounded-2xl bg-signal-soft p-4 text-sm text-signal">{error}</div>}{loading && <div className="mt-10 flex items-center gap-3 text-sm text-muted-foreground"><RefreshCw className="animate-spin" size={17} />Loading evidence records...</div>}{!loading && !records.length && !error && <Card className="mt-10 border-dashed border-border bg-card shadow-clay"><CardContent className="p-12 text-center"><FileCheck2 className="mx-auto text-primary" size={34} /><h2 className="mt-5 font-display text-2xl font-bold">No evidence records yet</h2><p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">Evidence appears after a permitted generation request. Start from a ticket when the record is ready.</p><Button asChild className="mt-6 rounded-xl"><Link href="/tickets">View tickets <ArrowRight size={16} /></Link></Button></CardContent></Card>}{!loading && records.length > 0 && <div className="mt-10 grid gap-6 lg:grid-cols-2">{records.map(({ ticket, evidence }) => <Card key={evidence.id} className="border-border bg-card shadow-clay"><CardContent className="p-6"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Evidence summary · Unit {ticket.unit.unitNumber}</p><h2 className="mt-2 font-display text-2xl font-bold">{ticket.description}</h2></div><span className="rounded-full bg-primary-soft px-3 py-1 font-mono text-[10px] uppercase text-primary">AI-generated draft</span></div><p className="mt-5 text-sm leading-relaxed text-muted-foreground">{evidence.summary}</p><div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-surface p-3"><p className="document-label">Timeline</p><p className="mt-2 text-sm font-semibold">Recorded events</p></div><div className="rounded-xl bg-surface p-3"><p className="document-label">Related complaints</p><p className="mt-2 text-sm font-semibold">{evidence.relatedTickets.length}</p></div><div className="rounded-xl bg-surface p-3"><p className="document-label">Generated</p><p className="mt-2 text-sm font-semibold">{new Date(evidence.generatedAt).toLocaleDateString()}</p></div></div>{evidence.noticeDraft && <div className="mt-5 rounded-xl border border-border bg-secondary p-4"><p className="document-label">Notice draft</p><p className="mt-2 text-sm leading-relaxed">{evidence.noticeDraft}</p></div>}<div className="mt-6 flex flex-wrap gap-3"><Button asChild variant="outline" className="rounded-xl"><Link href={`/tickets/${ticket.id}`}>Open ticket <ArrowRight size={15} /></Link></Button><Button disabled={generating === ticket.id} onClick={() => void generate(ticket.id)} variant="secondary" className="rounded-xl">{generating === ticket.id ? "Generating..." : "Regenerate draft"}</Button></div></CardContent></Card>)}</div>}</div></AppShell>;
}
