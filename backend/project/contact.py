"""Contact + AI agent chat proxy endpoints.

- ``POST /api/v2/contact/`` accepts a JSON body ``{name, email, subject?,
  message}``, saves a ``ContactSubmission`` row, and emails the site
  owner. Returns ``{ok: true, id: <int>}``.
- ``POST /api/v2/agent/`` accepts ``{message, history?, session_id?}``,
  forwards it to the ``AGENT_URL`` service (or returns a mock reply if
  the URL isn't configured) and forwards the JSON response.

Both endpoints are CSRF-exempt because they're same-origin JSON APIs
called by the Next.js frontend, not classic form POSTs. If you decide
to hit them from another origin later, revisit CORS instead.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

import requests
from django.conf import settings
from django.core.mail import send_mail
from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

logger = logging.getLogger(__name__)

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_AGENT_TIMEOUT = 10  # seconds


def _json_body(request: HttpRequest) -> dict[str, Any]:
    """Parse a JSON body and return a dict (or raise ValueError)."""
    if not request.body:
        return {}
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError("Body is not valid JSON.") from exc
    if not isinstance(payload, dict):
        raise ValueError("Body must be a JSON object.")
    return payload


@csrf_exempt
@require_POST
def contact_submit_view(request: HttpRequest) -> JsonResponse:
    """Save a contact submission and notify the site owner."""
    from models.snippets.contact_submission import ContactSubmission

    try:
        data = _json_body(request)
    except ValueError as exc:
        return JsonResponse({"ok": False, "detail": str(exc)}, status=400)

    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip()
    subject = str(data.get("subject", "")).strip()
    message = str(data.get("message", "")).strip()

    errors: dict[str, str] = {}
    if not name:
        errors["name"] = "Please tell me your name."
    if not email or not _EMAIL_RE.match(email):
        errors["email"] = "That doesn't look like a valid email address."
    if not message:
        errors["message"] = "Please include a message."
    if errors:
        return JsonResponse({"ok": False, "errors": errors}, status=400)

    submission = ContactSubmission.objects.create(
        name=name[:200],
        email=email[:254],
        subject=subject[:280],
        message=message,
    )

    try:
        send_mail(
            subject=f"[Contact] {subject or 'New message'} - from {name}",
            message=(
                f"From: {name} <{email}>\n"
                f"Subject: {subject or '(none)'}\n"
                f"\n"
                f"{message}\n"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.CONTACT_TO_EMAIL],
            fail_silently=True,
        )
    except Exception:  # pragma: no cover - defensive; console backend never throws
        logger.exception("Failed to send contact notification email")

    return JsonResponse({"ok": True, "id": submission.id}, status=201)


@csrf_exempt
@require_POST
def agent_chat_view(request: HttpRequest) -> JsonResponse:
    """Proxy a chat message to the configured AI agent.

    If ``AGENT_URL`` is unset we return a mock reply so the frontend
    integration can be built and demoed before the agent exists. The
    mock is deterministic enough for e2e tests but explicit enough
    that no one mistakes it for a real reply.
    """
    try:
        data = _json_body(request)
    except ValueError as exc:
        return JsonResponse({"ok": False, "detail": str(exc)}, status=400)

    message = str(data.get("message", "")).strip()
    if not message:
        return JsonResponse(
            {"ok": False, "detail": "Message is required."}, status=400
        )

    history = data.get("history") or []
    session_id = data.get("session_id")

    if not settings.AGENT_URL:
        return JsonResponse(
            {
                "ok": True,
                "reply": (
                    "the agent isn't wired up yet - this is a mock reply. "
                    f"You said: \"{message}\"."
                ),
                "session_id": session_id or "mock",
                "mock": True,
            }
        )

    headers = {"Content-Type": "application/json"}
    if settings.AGENT_API_KEY:
        headers["Authorization"] = f"Bearer {settings.AGENT_API_KEY}"

    try:
        upstream = requests.post(
            settings.AGENT_URL,
            headers=headers,
            json={"message": message, "history": history, "session_id": session_id},
            timeout=_AGENT_TIMEOUT,
        )
    except requests.RequestException as exc:
        logger.warning("agent upstream error: %s", exc)
        return JsonResponse(
            {"ok": False, "detail": "the agent is unreachable right now."},
            status=502,
        )

    try:
        body = upstream.json()
    except ValueError:
        body = {"reply": upstream.text}

    if not upstream.ok:
        return JsonResponse(
            {"ok": False, "detail": body.get("detail", "the agent returned an error.")},
            status=upstream.status_code,
        )

    return JsonResponse({"ok": True, **body})
