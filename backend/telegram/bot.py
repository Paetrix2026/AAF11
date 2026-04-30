import os

FAMILY_CHANNEL_ID = "-5249565816"


async def send_patient_alert(
    telegram_handle: str,
    drug: str,
    effectiveness: float,
    region: str,
) -> bool:
    """Send medication alert to patient via Telegram."""
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        return False
    try:
        from telegram import Bot
        bot = Bot(token=token)
        message = (
            f"\u26a0\ufe0f *Healynx Alert*\n\n"
            f"Your medication *{drug}* effectiveness in {region} has changed.\n\n"
            f"Current effectiveness: *{effectiveness:.0%}*\n"
            f"{'Consider visiting your doctor to review your prescription.' if effectiveness < 0.7 else 'No action needed at this time.'}\n\n"
            f"— Healynx Clinical AI"
        )
        await bot.send_message(
            chat_id=f"@{telegram_handle}",
            text=message,
            parse_mode="Markdown",
        )
        return True
    except Exception:
        return False


async def send_doctor_alert(
    telegram_handle: str,
    patient_name: str,
    risk_level: str,
    drug: str,
) -> bool:
    """Send critical alert to doctor via Telegram."""
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        return False
    try:
        from telegram import Bot
        bot = Bot(token=token)
        message = (
            f"\U0001f534 *Critical Alert — Healynx*\n\n"
            f"Patient: *{patient_name}*\n"
            f"Risk Level: *{risk_level.upper()}*\n"
            f"Recommended action: Review {drug} prescription immediately.\n\n"
            f"Open Healynx for full analysis."
        )
        await bot.send_message(
            chat_id=f"@{telegram_handle}",
            text=message,
            parse_mode="Markdown",
        )
        return True
    except Exception:
        return False


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
    """Send a family-friendly clinical update to the Healynx family channel."""
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        return False
    try:
        from telegram import Bot
        bot = Bot(token=token)

        # Build outcome emoji
        outcome_emoji = "✅" if predicted_outcome == "stable" else "⚠️" if predicted_outcome == "decline" else "🔴"
        risk_emoji = "🟢" if risk_level == "low" else "🟡" if risk_level == "moderate" else "🔴"

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

        await bot.send_message(
            chat_id=FAMILY_CHANNEL_ID,
            text=message,
            parse_mode="Markdown",
        )
        return True
    except Exception as e:
        import logging
        logging.getLogger("telegram.bot").warning(f"Family channel update failed: {e}")
        return False


async def answer_family_question(question: str, context: dict) -> str:
    """Use Groq LLM to answer a family member's question in simple language."""
    import os
    from groq import AsyncGroq
    token = os.getenv("GROQ_API_KEY")
    if not token:
        return "Sorry, the AI assistant is currently unavailable. Please contact your doctor directly."
    try:
        client = AsyncGroq(api_key=token)
        system = (
            "You are a compassionate family health assistant for Healynx. "
            "Your job is to explain complex medical information in simple, warm, non-technical language "
            "for family members and caregivers. Keep answers short (2-4 sentences max). "
            "Never diagnose or prescribe. Always recommend consulting the doctor for serious concerns. "
            f"Patient context: {context}"
        )
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": question},
            ],
            max_tokens=200,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return "I'm having trouble answering right now. Please ask your healthcare team directly."
