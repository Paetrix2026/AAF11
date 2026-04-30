"""
Healynx Telegram notification module.
Uses the Telegram Bot API via httpx directly to avoid naming conflicts
with the local `telegram/` package folder.
"""
import os
import logging
import httpx

logger = logging.getLogger("telegram.bot")

# Read from env; fallback to the hardcoded group ID
FAMILY_CHANNEL_ID = os.getenv("TELEGRAM_FAMILY_CHANNEL_ID", "-5249565816")

_TIMEOUT = 10  # seconds


async def _send_message(chat_id: str, text: str) -> bool:
    """Low-level helper: POST to Telegram sendMessage API."""
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        logger.warning("TELEGRAM_BOT_TOKEN not set — skipping notification")
        return False
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {"chat_id": chat_id, "text": text, "parse_mode": "Markdown"}
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            r = await client.post(url, json=payload)
            if r.status_code == 200:
                return True
            logger.warning(f"Telegram API error {r.status_code}: {r.text[:200]}")
            return False
    except Exception as e:
        logger.warning(f"Telegram request failed: {e}")
        return False


async def send_patient_alert(
    telegram_handle: str,
    drug: str,
    effectiveness: float,
    region: str,
) -> bool:
    """Send medication alert to a patient via their Telegram handle."""
    action = (
        "Consider visiting your doctor to review your prescription."
        if effectiveness < 0.7
        else "No action needed at this time."
    )
    message = (
        f"⚠️ *Healynx Alert*\n\n"
        f"Your medication *{drug}* effectiveness in {region} has changed.\n\n"
        f"Current effectiveness: *{effectiveness:.0%}*\n"
        f"{action}\n\n"
        f"— Healynx Clinical AI"
    )
    return await _send_message(f"@{telegram_handle}", message)


async def send_doctor_alert(
    telegram_handle: str,
    patient_name: str,
    risk_level: str,
    drug: str,
) -> bool:
    """Send a critical clinical alert to a doctor via their Telegram handle."""
    message = (
        f"🔴 *Critical Alert — Healynx*\n\n"
        f"Patient: *{patient_name}*\n"
        f"Risk Level: *{risk_level.upper()}*\n"
        f"Recommended action: Review *{drug}* prescription immediately.\n\n"
        f"Open Healynx for full analysis."
    )
    return await _send_message(f"@{telegram_handle}", message)


async def send_family_channel_update(
    patient_name: str,
    primary_drug: str,
    predicted_outcome: str,
    time_to_failure: str,
    risk_level: str,
    patient_summary: str,
    action_required: str,
    pathogen: str,
) -> bool:
    """Post a family-friendly clinical update to the Healynx family channel."""
    outcome_emoji = (
        "✅" if predicted_outcome == "stable"
        else "⚠️" if predicted_outcome == "decline"
        else "🔴"
    )
    risk_emoji = (
        "🟢" if risk_level in ("low",)
        else "🟡" if risk_level == "moderate"
        else "🔴"
    )
    message = (
        f"🏥 *Healynx Family Update*\n\n"
        f"👤 *Patient:* {patient_name}\n"
        f"🦠 *Condition:* {pathogen}\n\n"
        f"💊 *Treatment:* {primary_drug}\n"
        f"{outcome_emoji} *Expected Outcome:* {predicted_outcome.title()}\n"
        f"⏳ *Duration:* {time_to_failure}\n"
        f"{risk_emoji} *Risk Level:* {risk_level.title()}\n\n"
        f"📋 *What this means for you:*\n{patient_summary}\n\n"
        f"✅ *Recommended Action:* {action_required}\n\n"
        f"_Powered by Healynx Clinical AI — for family & caregivers_"
    )
    return await _send_message(FAMILY_CHANNEL_ID, message)


async def answer_family_question(question: str, context: dict) -> str:
    """Use Groq to answer a family member's health question in simple language."""
    from groq import AsyncGroq
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return "The AI assistant is currently unavailable. Please contact your doctor directly."
    try:
        client = AsyncGroq(api_key=api_key)
        system = (
            "You are a compassionate family health assistant for Healynx. "
            "Explain complex medical information in simple, warm, non-technical language "
            "for family members and caregivers. Keep answers to 2-4 sentences. "
            "Never diagnose or prescribe. Recommend consulting the doctor for serious concerns. "
            f"Patient context: {context}"
        )
        resp = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": question},
            ],
            max_tokens=200,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        logger.warning(f"Groq family Q&A failed: {e}")
        return "I'm having trouble answering right now. Please ask your healthcare team directly."
