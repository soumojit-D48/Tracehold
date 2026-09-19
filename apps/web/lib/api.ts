export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type TicketStatus =
    | "OPEN"
    | "IN_PROGRESS"
    | "ESCALATED"
    | "RESOLVED"
    | "CLOSED"
    | "EVIDENCE_READY";

export type Ticket = {
    id: string;
    description: string;
    category: string;
    severity: string;
    status: TicketStatus;
    createdAt: string;
    resolvedAt?: string | null;
    unit: { id: string; unitNumber: string; property: { name: string } };
    createdBy: { id: string; name: string; email: string; role: string };
    events?: TicketEvent[];
};

export type TicketEvent = {
    id: string;
    type: string;
    metadata?: Record<string, unknown> | null;
    createdAt: string;
};

export type AuthResponse = {
    accessToken: string;
    user: { id: string; name: string; email: string; role: string };
};

export class ApiError extends Error {
    constructor(
        message: string,
        public readonly status: number,
    ) {
        super(message);
    }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = typeof window === "undefined" ? null : localStorage.getItem("tracehold_token");
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new ApiError(body?.message ?? "The API request failed.", response.status);
    }
    return response.json() as Promise<T>;
}

export function saveSession(session: AuthResponse) {
    localStorage.setItem("tracehold_token", session.accessToken);
    localStorage.setItem("tracehold_user", JSON.stringify(session.user));
}

export function clearSession() {
    localStorage.removeItem("tracehold_token");
    localStorage.removeItem("tracehold_user");
}
