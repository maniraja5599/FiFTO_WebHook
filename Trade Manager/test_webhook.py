import requests
import json
import time

URL = "http://localhost:8000/webhook"

payload = {
    "strategy": "example_strategy",
    "symbol": "NSE:RELIANCE",
    "action": "BUY",
    "price": "2500.50",
    "time": time.strftime("%Y-%m-%d %H:%M:%S")
}

def test_webhook():
    print(f"Sending test payload: {payload}")
    try:
        response = requests.post(URL, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_webhook()
