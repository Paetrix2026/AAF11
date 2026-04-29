import os


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
