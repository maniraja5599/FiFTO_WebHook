import httpx
import logging

logger = logging.getLogger(__name__)

async def send_quantman_signal(webhook_url: str, payload: dict):
    async with httpx.AsyncClient() as client:
        try:
            # We forward the same payload received from TradingView or a modified version
            response = await client.post(webhook_url, json=payload)
            response.raise_for_status()
            logger.info(f"Quantman signal sent successfully")
            return response.json()
        except Exception as e:
            logger.error(f"Error sending Quantman signal: {e}")
            return None
