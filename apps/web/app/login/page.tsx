"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError, apiFetch, saveSession, type AuthResponse } from "@/lib/api";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("tenant@tracehold.local");
    const [password, setPassword] = useState("tracehold-demo-tenant");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setIsSubmitting(true);
        try {
            const session = await apiFetch<AuthResponse>("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });
            saveSession(session);
            router.push("/tickets");
        } catch (requestError) {
            setError(requestError instanceof ApiError ? requestError.message : "Unable to sign in.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="min-h-screen bg-[#f4f0e8] px-6 py-12 text-[#19332e]">
            <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl items-center justify-center">
                <div className="grid w-full overflow-hidden rounded-3xl bg-[#19332e] shadow-2xl shadow-[#19332e]/20 md:grid-cols-[1.1fr_0.9fr]">
                    <section className="hidden p-12 text-[#f4f0e8] md:block">
                        <Link href="/" className="text-sm font-semibold tracking-[0.2em] uppercase">Tracehold</Link>
                        <div className="mt-32 max-w-sm">
                            <p className="mb-4 text-sm font-semibold tracking-[0.18em] text-[#f0a66a] uppercase">Evidence, not noise</p>
                            <h1 className="font-heading text-5xl leading-[0.95]">Keep the repair record moving.</h1>
                            <p className="mt-6 text-lg leading-relaxed text-[#d3ddd7]">A clear trail from first complaint to final resolution.</p>
                        </div>
                    </section>
                    <Card className="rounded-none bg-[#fffdf8] py-8 shadow-none">
                        <CardHeader className="px-8">
                            <div className="mb-8 flex size-11 items-center justify-center rounded-2xl bg-[#f0a66a]/20 text-[#b65f31]"><ShieldCheck /></div>
                            <CardTitle className="font-heading text-3xl text-[#19332e]">Welcome back</CardTitle>
                            <CardDescription>Sign in to your maintenance workspace.</CardDescription>
                        </CardHeader>
                        <CardContent className="px-8">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <label className="block text-sm font-medium">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#d8d9d1] bg-white px-3 outline-none focus:border-[#b65f31]" /></label>
                                <label className="block text-sm font-medium">Password<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#d8d9d1] bg-white px-3 outline-none focus:border-[#b65f31]" /></label>
                                {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                                <Button disabled={isSubmitting} className="h-11 w-full justify-between rounded-xl bg-[#b65f31] px-4 text-white hover:bg-[#934a27]">{isSubmitting ? "Signing in..." : "Sign in"}<ArrowRight /></Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
}
