"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Building2, ShieldCheck } from "lucide-react";
import { Button } from "@tracehold/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@tracehold/ui/card";
import { ThemeSwitcher } from "@/components/landing/theme-switcher";
import { ApiError, apiFetch, saveSession, type AuthResponse } from "@/lib/api";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("tenant@tracehold.local");
    const [password, setPassword] = useState("tracehold-demo-tenant");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault(); setError(""); setIsSubmitting(true);
        try { const session = await apiFetch<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }); saveSession(session); router.push("/dashboard"); }
        catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "Unable to sign in."); }
        finally { setIsSubmitting(false); }
    }

    return <main className="min-h-screen bg-background px-4 py-5 text-foreground sm:px-6 sm:py-8"><div className="mx-auto flex max-w-6xl justify-end"><ThemeSwitcher /></div><div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-6xl items-center justify-center"><div className="grid w-full overflow-hidden rounded-[32px] border border-border bg-ink shadow-ink md:grid-cols-[1.05fr_.95fr]"><section className="hidden p-10 text-mist md:flex md:flex-col md:justify-between lg:p-14"><Link href="/" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-signal text-signal-foreground"><Building2 size={19} /></span><span className="font-display text-xl font-bold">Tracehold</span></Link><div className="max-w-sm"><p className="eyebrow text-forensic-light">Evidence, not noise</p><h1 className="mt-5 font-display text-5xl leading-[1.02]">Keep the repair record moving.</h1><p className="mt-6 text-lg leading-relaxed text-mist/65">A clear trail from first complaint to final resolution.</p></div><p className="font-mono text-[10px] uppercase tracking-[.14em] text-mist/40">Event-driven maintenance records</p></section><Card className="rounded-none border-0 bg-card py-8 shadow-none sm:py-12"><CardHeader className="px-7 sm:px-10"><div className="mb-8 grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary"><ShieldCheck /></div><CardTitle className="font-display text-3xl">Welcome back</CardTitle><CardDescription>Sign in to your maintenance workspace.</CardDescription></CardHeader><CardContent className="px-7 sm:px-10"><form onSubmit={handleSubmit} className="space-y-5"><label className="block text-sm font-medium">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-input bg-secondary px-3 outline-none transition focus:ring-2 focus:ring-ring" /></label><label className="block text-sm font-medium">Password<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-input bg-secondary px-3 outline-none transition focus:ring-2 focus:ring-ring" /></label>{error && <p role="alert" className="rounded-xl bg-signal-soft px-3 py-2 text-sm text-signal">{error}</p>}<Button disabled={isSubmitting} className="h-12 w-full justify-between rounded-xl">{isSubmitting ? "Signing in..." : "Sign in"}<ArrowRight size={17} /></Button></form><p className="mt-6 text-xs leading-relaxed text-muted-foreground">Demo tenant: `tenant@tracehold.local` / `tracehold-demo-tenant`</p></CardContent></Card></div></div></main>;
}
