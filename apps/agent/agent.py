"""Tracehold evidence agent.

The default local path is deterministic and source-grounded so a missing model
provider cannot corrupt ticket data. Strands can be enabled explicitly once a
model provider is configured; its output must still pass the same boundary in
the NestJS service before it is stored.
"""

from __future__ import annotations

import json
import os
import sys
from typing import Any

try:
    from strands import Agent as StrandsAgent
except ImportError:
    StrandsAgent = None


def build_draft(document: dict[str, Any]) -> dict[str, Any]:
    ticket = document["ticket"]
    events = document.get("events", [])
    history = document.get("relatedHistoricalTickets", [])
    unit = ticket.get("unitNumber", "unknown unit")

    timeline = [
        {
            "eventId": event["eventId"],
            "type": event["type"],
            "createdAt": event["createdAt"],
            "metadata": event.get("metadata"),
        }
        for event in events
    ]
    related_ids = [item["ticketId"] for item in history]
    summary = (
        f"Reported issue: {ticket['description']} "
        f"for Unit {unit}. Category: {ticket['category']}. "
        f"Severity: {ticket['severity']}. Current recorded status: {ticket['status']}."
    )
    if history:
        summary += f" Related historical tickets found: {len(history)}."
    else:
        summary += " No related historical tickets were supplied."

    notice = "\n".join(
        [
            "AI-generated draft",
            "Maintenance issue notice",
            f"Unit: {unit}",
            f"Issue: {ticket['description']}",
            f"Reported at: {ticket['createdAt']}",
            f"Recorded status: {ticket['status']}",
            "This draft contains only facts present in the supplied ticket and event record.",
        ]
    )
    return {
        "summary": summary,
        "timeline": timeline,
        "recurringIssues": [
            {
                "ticketId": item["ticketId"],
                "category": item["category"],
                "description": item["description"],
                "createdAt": item["createdAt"],
            }
            for item in history
        ],
        "relatedTickets": related_ids,
        "noticeDraft": notice,
        "modelMetadata": {
            "provider": "deterministic-local-agent",
            "draft": True,
            "strandsEnabled": os.getenv("STRANDS_ENABLED", "false").lower() == "true",
        },
    }


def build_with_strands(document: dict[str, Any]) -> dict[str, Any]:
    if StrandsAgent is None:
        raise RuntimeError("Strands Agents is not installed.")
    agent = StrandsAgent(
        system_prompt=(
            "Return JSON with summary, timeline, recurringIssues, relatedTickets, "
            "noticeDraft, and modelMetadata. Use only facts in the supplied JSON. "
            "Never invent timestamps, events, repairs, people, legal conclusions, "
            "permissions, or ticket status. Mark noticeDraft as AI-generated draft."
        )
    )
    result = agent(json.dumps(document))
    raw = getattr(result, "message", result)
    if isinstance(raw, dict):
        raw = raw.get("content", raw)
    if isinstance(raw, list):
        raw = "".join(str(item.get("text", item)) if isinstance(item, dict) else str(item) for item in raw)
    if not isinstance(raw, str):
        raise RuntimeError("Strands returned an unsupported result shape.")
    return json.loads(raw)


def main() -> None:
    document = json.load(sys.stdin)
    use_strands = os.getenv("STRANDS_ENABLED", "false").lower() == "true"
    json.dump(build_with_strands(document) if use_strands else build_draft(document), sys.stdout)


if __name__ == "__main__":
    main()
