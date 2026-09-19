"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError, apiFetch, type Ticket } from "@/lib/api";

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

    useEffect(() => {
        apiFetch<Ticket[]>("/tickets").then((items) => { setTickets(items); setUnitId(items[0]?.unit.id ?? ""); }).catch((requestError) => {
            setError(requestError instanceof ApiError && requestError.status === 401 ? "Please sign in before creating a ticket." : "Unable to load units.");
        }).finally(() => setIsLoading(false));
    }, []);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (description.trim().length < 10) { setError("Describe the issue in at least 10 characters."); return; }
        if (!unitId) { setError("Choose a unit."); return; }
        setIsSubmitting(true); setError("");
        try {
            await apiFetch<Ticket>("/tickets", { method: "POST", body: JSON.stringify({ unitId, category, description, severity }) });
            router.push("/tickets");
        } catch (requestError) {
            setError(requestError instanceof ApiError && requestError.status === 403 ? "You are not allowed to create tickets." : requestError instanceof ApiError ? requestError.message : "Unable to create ticket.");
        } finally { setIsSubmitting(false); }
    }

    const units = Array.from(new Map(tickets.map((ticket) => [ticket.unit.id, ticket.unit])).values());
    return <main className="min-h-screen bg-[#f4f0e8] px-6 py-8 text-[#19332e]"><div className="mx-auto max-w-3xl"><Link href="/tickets" className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-[#60736c] hover:text-[#b65f31]"><ArrowLeft className="size-4" />Back to tickets</Link><div className="mb-8"><p className="mb-2 text-sm font-semibold tracking-[0.16em] text-[#b65f31] uppercase">New record</p><h1 className="font-heading text-4xl font-bold">Report an issue</h1><p className="mt-2 text-[#60736c]">Describe what needs attention. The details become part of the permanent timeline.</p></div><Card className="bg-[#fffdf8]"><CardHeader><CardTitle className="font-heading text-xl">Issue details</CardTitle></CardHeader><CardContent><form onSubmit={handleSubmit} className="space-y-6"><label className="block text-sm font-medium">Unit<select disabled={isLoading} value={unitId} onChange={(event) => setUnitId(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#d8d9d1] bg-white px-3"><option value="">{isLoading ? "Loading units..." : "Select a unit"}</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.property.name} · Unit {unit.unitNumber}</option>)}</select></label><div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-medium">Category<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#d8d9d1] bg-white px-3">{["WATER_DAMAGE", "PLUMBING", "ELECTRICAL", "HVAC", "STRUCTURAL", "OTHER"].map((value) => <option key={value}>{value.replaceAll("_", " ")}</option>)}</select></label><label className="block text-sm font-medium">Severity<select value={severity} onChange={(event) => setSeverity(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#d8d9d1] bg-white px-3">{["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((value) => <option key={value}>{value}</option>)}</select></label></div><label className="block text-sm font-medium">Description<textarea required minLength={10} value={description} onChange={(event) => setDescription(event.target.value)} rows={6} placeholder="What happened, where, and when did you first notice it?" className="mt-2 w-full resize-y rounded-xl border border-[#d8d9d1] bg-white p-3 outline-none focus:border-[#b65f31]" /></label>{error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<Button disabled={isSubmitting || isLoading} className="h-11 rounded-xl bg-[#b65f31] px-5 text-white hover:bg-[#934a27]">{isSubmitting ? "Saving..." : "Create ticket"}<Send /></Button></form></CardContent></Card></div></main>;
}
