import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="flex flex-col items-center gap-8 text-center max-w-2xl">
        {/* Brand mark */}
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-5xl font-bold tracking-tight text-foreground">
            Tracehold
          </h1>
          <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
            Maintenance issues that don&apos;t disappear into a chat.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Button asChild size="lg">
            <Link href="/tickets/new">Create Issue</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/tickets">View Tickets</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
