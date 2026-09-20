# Tracehold Evidence Agent

This isolated Python package receives a structured ticket, event timeline, and
related historical tickets on stdin and emits structured JSON on stdout.

The default implementation is deterministic and source-grounded for local
development. Set `STRANDS_ENABLED=true` to use the optional Strands Agents
runtime. Its output still passes the safety checks in NestJS before storage.

Run locally:

```powershell
python agent.py < input.json
python -m unittest test_agent.py
```
