"use client";

import Link from "next/link";
import { ArrowRight, History as HistoryIcon, Search, TriangleAlert } from "lucide-react";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppShell } from "@/components/workspace/app-shell";
import { ApiError, apiFetch } from "@/lib/api";

type SearchResult = { ticketId: string; unitId: string; unitNumber: string; category: string; description: string; severity: string; status: string; createdAt: string };
type UnitHistory = { tickets: SearchResult[]; recurringIssues: Array<{ category: string; count: number }> };

export default function HistoryPage() {
    const [query, setQuery] = useState("water leak bathroom");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [history, setHistory] = useState<UnitHistory | null>(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState("");

    async function search(event?: FormEvent) {
        event?.preventDefault();
        if (query.trim().length < 2) { setError("Enter at least two characters to search."); return; }
        setLoading(true); setError(""); setSearched(true); setHistory(null);
        try {
            const items = await apiFetch<SearchResult[]>(`/search/tickets?q=${encodeURIComponent(query.trim())}`);
            setResults(items);
            if (items[0]) setHistory(await apiFetch<UnitHistory>(`/units/${items[0].unitId}/history`));
        } catch (requestError) {
            setError(requestError instanceof ApiError && requestError.status === 403 ? "You are not allowed to search maintenance history." : "Historical search is unavailable right now.");
            setResults([]);
        } finally { setLoading(false); }
    }

    return <AppShell><div className="mx-auto max-w-[1300px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12"><div><p className="eyebrow">Historical context / Derived search</p><h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">Find the pattern behind the complaint.</h1><p className="mt-3 max-w-2xl text-muted-foreground">Search related maintenance records without replacing PostgreSQL as the source of truth.</p></div><Card className="mt-9 border-border bg-card shadow-clay"><CardContent className="p-5 sm:p-7"><form onSubmit={search} className="flex flex-col gap-3 sm:flex-row"><label className="sr-only" htmlFor="history-query">Search maintenance history</label><div className="flex flex-1 items-center gap-3 rounded-xl border border-input bg-secondary px-4"><Search size={18} className="text-primary" /><input id="history-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search complaints, units, or issue categories" className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none" /></div><Button type="submit" disabled={loading} className="h-12 rounded-xl px-6">{loading ? "Searching..." : "Search history"}<ArrowRight size={16} /></Button></form>{error && <p role="alert" className="mt-4 rounded-xl bg-signal-soft p-3 text-sm text-signal">{error}</p>}</CardContent></Card><div className="mt-8 grid gap-6 lg:grid-cols-[1fr_.38fr]"><Card className="border-border bg-card shadow-clay"><CardContent className="p-0"><div className="flex items-center justify-between border-b border-border p-5"><div><p className="eyebrow">Related results</p><h2 className="mt-2 font-display text-2xl font-bold">Maintenance records</h2></div><span className="font-mono text-xs text-muted-foreground">{results.length} matches</span></div>{!searched && <div className="p-12 text-center"><HistoryIcon className="mx-auto text-primary" size={30} /><p className="mt-4 font-display text-xl font-bold">Search the maintenance record</p><p className="mt-2 text-sm text-muted-foreground">Results remain linked to their original ticket and unit.</p></div>}{searched && !loading && !results.length && <div className="p-12 text-center"><p className="font-display text-xl font-bold">No related complaints found</p><p className="mt-2 text-sm text-muted-foreground">Try a broader phrase such as “water” or “bathroom”.</p></div>}{loading && <div className="p-12 text-center text-sm text-muted-foreground">Searching the historical index...</div>}{results.map((result) => <Link key={result.ticketId} href={`/tickets/${result.ticketId}`} className="block border-b border-border p-5 transition-colors last:border-0 hover:bg-surface"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase text-primary">Unit {result.unitNumber} · {result.category.replaceAll("_", " ")}</p><h3 className="mt-2 font-semibold">{result.description}</h3></div><span className="rounded-full bg-secondary px-3 py-1 font-mono text-[10px] uppercase">{result.status}</span></div><p className="mt-3 text-xs text-muted-foreground">#{result.ticketId.slice(-6).toUpperCase()} · {result.severity} · {new Date(result.createdAt).toLocaleDateString()}</p></Link>)}</CardContent></Card><Card className="h-fit border-signal/25 bg-signal-soft shadow-clay-sm"><CardContent className="p-6"><div className="flex items-center gap-3 text-signal"><TriangleAlert size={19} /><p className="eyebrow text-signal">Recurring issue panel</p></div>{history?.recurringIssues.length ? <>{history.recurringIssues.map((issue) => <div key={issue.category} className="mt-6 border-t border-signal/20 pt-5"><p className="font-display text-2xl font-bold">Unit {results[0]?.unitNumber}</p><p className="mt-2 text-sm text-muted-foreground">{issue.count} {issue.category.replaceAll("_", " ").toLowerCase()} complaints</p></div>)}</> : <p className="mt-6 text-sm leading-relaxed text-muted-foreground">Run a search to see whether repeated issues exist in the same unit.</p>}</CardContent></Card></div></div></AppShell>;
}
