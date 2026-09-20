"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@tracehold/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@tracehold/ui/card";
import { ApiError, apiFetch, type Ticket } from "@/lib/api";
import { AppShell } from "@/components/workspace/app-shell";

export default function NewTicketPage() {
    const router = useRouter();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [unitId, setUnitId] = useState("");
    const [category, setCategory] = useState("WATER_DAMAGE");
    const [severity, setSeverity] = useState("MEDIUM");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => { const timer = window.setTimeout(() => { void apiFetch<Ticket[]>("/tickets").then((items) => { setTickets(items); setUnitId(items[0]?.unit.id ?? ""); }).catch((requestError) => { setError(requestError instanceof ApiError && requestError.status === 401 ? "Please sign in before creating a ticket." : "Unable to load units."); }).finally(() => setIsLoading(false)); }, 0); return () => window.clearTimeout(timer); }, []);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (description.trim().length < 10) { setError("Describe the issue in at least 10 characters."); return; }
        if (!unitId) { setError("Choose a unit."); return; }
        setIsSubmitting(true); setError("");
        try { await apiFetch<Ticket>("/tickets", { method: "POST", body: JSON.stringify({ unitId, category, description, severity }) }); router.push("/tickets"); }
        catch (requestError) { setError(requestError instanceof ApiError && requestError.status === 403 ? "You are not allowed to create tickets." : requestError instanceof ApiError ? requestError.message : "Unable to create ticket."); }
        finally { setIsSubmitting(false); }
    }

    const units = Array.from(new Map(tickets.map((ticket) => [ticket.unit.id, ticket.unit])).values());
    return <AppShell><div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-12"><Link href="/tickets" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"><ArrowLeft size={16} />Back to tickets</Link><div className="mt-9"><p className="eyebrow">New record / Permanent timeline</p><h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">Report an issue.</h1><p className="mt-3 text-muted-foreground">Describe what needs attention. The details become part of the permanent timeline.</p></div><Card className="mt-9 border-border bg-card shadow-clay"><CardHeader className="border-b border-border"><CardTitle className="font-display text-2xl">Issue details</CardTitle></CardHeader><CardContent className="p-6 sm:p-8"><form onSubmit={handleSubmit} className="space-y-6"><label className="block text-sm font-medium">Unit<select disabled={isLoading} value={unitId} onChange={(event) => setUnitId(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-input bg-secondary px-3 outline-none focus:ring-2 focus:ring-ring"><option value="">{isLoading ? "Loading units..." : "Select a unit"}</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.property.name} · Unit {unit.unitNumber}</option>)}</select></label><div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-medium">Category<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-input bg-secondary px-3 outline-none focus:ring-2 focus:ring-ring">{["WATER_DAMAGE", "PLUMBING", "ELECTRICAL", "HVAC", "STRUCTURAL", "OTHER"].map((value) => <option key={value}>{value.replaceAll("_", " ")}</option>)}</select></label><label className="block text-sm font-medium">Severity<select value={severity} onChange={(event) => setSeverity(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-input bg-secondary px-3 outline-none focus:ring-2 focus:ring-ring">{["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((value) => <option key={value}>{value}</option>)}</select></label></div><label className="block text-sm font-medium">Description<textarea required minLength={10} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Water is leaking from the bathroom ceiling..." className="mt-2 min-h-36 w-full resize-y rounded-xl border border-input bg-secondary p-3 text-sm outline-none focus:ring-2 focus:ring-ring" /><span className="mt-2 block text-xs text-muted-foreground">Include where the issue is, what happened, and what needs attention.</span></label>{error && <p role="alert" className="rounded-xl bg-signal-soft p-3 text-sm text-signal">{error}</p>}<div className="flex justify-end border-t border-border pt-6"><Button disabled={isSubmitting || isLoading} type="submit" className="rounded-xl">{isSubmitting ? "Creating record..." : "Submit issue"}<Send size={16} /></Button></div></form></CardContent></Card></div></AppShell>;
}
