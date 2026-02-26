import httpx
import asyncio
import json

async def test_signal():
    url = "http://localhost:8000/webhook"
    payload = {
        "strategy": "STKOPT_RELIANCE_V1",
        "symbol": "RELIANCE",
        "action": "BUY",
        "price": "2500.50",
        "time": "2026-02-22 09:30:00"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload)
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.json()}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_signal())
