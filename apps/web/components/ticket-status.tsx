import type { TicketStatus } from "@/lib/api";

const statusStyles: Record<TicketStatus, string> = {
    OPEN: "bg-[#e8f0ec] text-[#28614f]",
    IN_PROGRESS: "bg-[#e8eef4] text-[#315b7d]",
    ESCALATED: "bg-[#fff0dc] text-[#9b5a16]",
    RESOLVED: "bg-[#e7f3e7] text-[#3c6e3d]",
    CLOSED: "bg-[#ecece8] text-[#60645f]",
    EVIDENCE_READY: "bg-[#f5e7f2] text-[#854a76]",
};

export function TicketStatus({ status }: { status: TicketStatus }) {
    return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide ${statusStyles[status]}`}>{status.replaceAll("_", " ")}</span>;
}
