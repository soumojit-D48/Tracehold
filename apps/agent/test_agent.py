import unittest

from agent import build_draft


class EvidenceAgentTests(unittest.TestCase):
    def test_output_only_reuses_supplied_facts(self):
        document = {
            "ticket": {
                "description": "Bathroom ceiling is leaking.",
                "category": "WATER_DAMAGE",
                "severity": "HIGH",
                "status": "OPEN",
                "createdAt": "2026-09-19T15:30:00Z",
                "unitNumber": "304",
            },
            "events": [
                {
                    "eventId": "event-1",
                    "type": "TicketCreated",
                    "createdAt": "2026-09-19T15:30:00Z",
                    "metadata": None,
                }
            ],
            "relatedHistoricalTickets": [
                {
                    "ticketId": "ticket-old",
                    "category": "WATER_DAMAGE",
                    "description": "Water damage near bathroom.",
                    "createdAt": "2026-08-01T15:30:00Z",
                }
            ],
        }

        result = build_draft(document)

        self.assertEqual(result["timeline"][0]["createdAt"], "2026-09-19T15:30:00Z")
        self.assertEqual(result["relatedTickets"], ["ticket-old"])
        self.assertIn("AI-generated draft", result["noticeDraft"])
        self.assertNotIn("repair completed", result["noticeDraft"].lower())


if __name__ == "__main__":
    unittest.main()
