import os
from typing import Optional


def send_landslide_alert(
	message: str,
	recipient: Optional[str] = None,
) -> dict:
	"""Send an alert when Twilio is configured, otherwise return demo status."""
	account_sid = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
	auth_token = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
	sender = os.getenv("TWILIO_FROM_NUMBER", "").strip()
	destination = (recipient or os.getenv("AUTHORITY_PHONE_NUMBER", "")).strip()

	if not all((account_sid, auth_token, sender, destination)):
		return {
			"status": "demo",
			"message": "Alert queued in demo mode. Configure Twilio credentials to send a live SMS.",
			"recipient": destination or "local authority contact",
			"preview": message,
		}

	try:
		from twilio.rest import Client

		sms = Client(account_sid, auth_token).messages.create(
			body=message,
			from_=sender,
			to=destination,
		)
		return {"status": "sent", "message": "Alert SMS sent to the configured authority.", "sid": sms.sid}
	except ImportError:
		return {
			"status": "error",
			"message": "Twilio is configured but the twilio package is not installed.",
		}
	except Exception as error:
		return {"status": "error", "message": f"SMS provider error: {error}"}
