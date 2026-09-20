"use client";

import { Building2, ClipboardList, FileSearch, LayoutDashboard, LogOut, Menu, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { clearSession } from "@/lib/api";
import { ThemeSwitcher } from "@/components/landing/theme-switcher";

const navigation = [
    ["Overview", "/dashboard", LayoutDashboard],
    ["Tickets", "/tickets", ClipboardList],
    ["History", "/history", Search],
    ["Evidence", "/evidence", FileSearch],
] as const;

export function AppShell({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [user, setUser] = useState<{ name: string; role: string } | null>(null);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            const stored = localStorage.getItem("tracehold_user");
            if (stored) setUser(JSON.parse(stored));
        }, 0);
        return () => window.clearTimeout(timer);
    }, []);

    function signOut() {
        clearSession();
        setUser(null);
        router.push("/login");
    }

    return <div className="min-h-screen bg-background text-foreground"><aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-border bg-nav lg:flex lg:flex-col"><div className="flex h-20 items-center gap-3 border-b border-border px-7"><span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-clay-sm"><Building2 size={20} /></span><div><p className="font-display text-lg font-bold">Tracehold</p><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-primary">Evidence platform</p></div></div><nav className="flex-1 space-y-1 px-4 py-7">{navigation.map(([label, href, Icon]) => <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${pathname === href ? "bg-primary text-primary-foreground shadow-clay-sm" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}><Icon size={18} />{label}</Link>)}</nav><div className="border-t border-border p-4"><Button asChild className="mb-4 w-full justify-center gap-2 rounded-xl"><Link href="/tickets/new"><Plus size={16} />Create issue</Link></Button><div className="flex items-center gap-3 rounded-xl bg-secondary/70 p-3"><span className="grid size-9 place-items-center rounded-lg bg-primary-soft font-display font-bold text-primary">{user?.name?.slice(0, 1).toUpperCase() ?? "U"}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{user?.name ?? "Tracehold user"}</p><p className="font-mono text-[9px] uppercase text-muted-foreground">{user?.role ?? "Authenticated"}</p></div><button type="button" onClick={signOut} aria-label="Sign out" className="text-muted-foreground hover:text-signal"><LogOut size={16} /></button></div></div></aside><div className="lg:pl-72"><header className="sticky top-0 z-30 border-b border-border bg-nav/95 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-10"><div className="flex items-center justify-between"><button type="button" onClick={() => setMobileOpen((value) => !value)} className="rounded-xl p-2 hover:bg-secondary lg:hidden" aria-label={mobileOpen ? "Close navigation" : "Open navigation"}>{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button><div className="hidden items-center gap-3 lg:flex"><span className="size-2 rounded-full bg-signal" /><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Live maintenance record</span></div><div className="ml-auto flex items-center gap-3"><ThemeSwitcher /><span className="hidden text-sm text-muted-foreground sm:block">{user?.name ?? "Tracehold user"}</span><Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out"><LogOut size={17} /></Button></div></div>{mobileOpen && <nav className="mt-3 grid gap-1 border-t border-border pt-3 lg:hidden">{navigation.map(([label, href, Icon]) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${pathname === href ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}><Icon size={17} />{label}</Link>)}<Link href="/tickets/new" onClick={() => setMobileOpen(false)} className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><Plus size={16} />Create issue</Link></nav>}</header><main>{children}</main></div></div>;
}
