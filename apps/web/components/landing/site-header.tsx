"use client";

import { ArrowRight, Building2, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "./theme-switcher";

const links = [["Product", "#workflow"], ["How it works", "#story"], ["Evidence", "#evidence"], ["Architecture", "#architecture"]];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6"><div className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-border/70 bg-nav/95 px-4 py-3 shadow-clay-sm backdrop-blur-xl"><a href="#top" className="flex items-center gap-3" aria-label="Tracehold home"><span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-clay"><Building2 size={19} /></span><span className="font-display text-xl font-bold">Tracehold</span><span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-primary/70 sm:block">Evidence platform</span></a><nav className="hidden items-center gap-1 lg:flex">{links.map(([label, href]) => <a key={label} href={href} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">{label}</a>)}</nav><div className="hidden items-center gap-2 sm:flex"><ThemeSwitcher /><Button onClick={() => document.querySelector("#final")?.scrollIntoView({ behavior: "smooth" })}>Explore <ArrowRight size={15} /></Button></div><Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setOpen((value) => !value)} aria-label={open ? "Close menu" : "Open menu"}>{open ? <X size={18} /> : <Menu size={18} />}</Button></div>{open && <div className="mx-auto mt-2 max-w-7xl rounded-2xl border border-border bg-card p-3 shadow-clay sm:hidden"><nav className="grid gap-1">{links.map(([label, href]) => <a key={label} href={href} onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-secondary">{label}</a>)}</nav><div className="mt-3 border-t border-border pt-3"><ThemeSwitcher /></div></div>}</header>;
}
