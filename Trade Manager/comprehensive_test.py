import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000"
WEBHOOK_URL = f"{BASE_URL}/webhook"
API_URL = f"{BASE_URL}/api/strategies"

def log_test(name, success, response=None):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"[{status}] {name}")
    if response:
        try:
            print(f"    Response: {json.dumps(response.json(), indent=2)}")
        except:
            print(f"    Response: {response.text}")

def test_get_strategies():
    print("\n--- Testing Get All Strategies ---")
    resp = requests.get(API_URL)
    log_test("GET /api/strategies", resp.status_code == 200, resp)
    return resp.json()

def test_create_strategy(strat_id):
    print(f"\n--- Testing Create Strategy: {strat_id} ---")
    payload = {
        "id": strat_id,
        "name": f"Test Strategy {strat_id}",
        "type": "Paper",
        "telegram_bot_token": "",
        "telegram_chat_id": "",
        "quantman_webhook_url": "http://example.com/webhook"
    }
    resp = requests.post(API_URL, json=payload)
    log_test(f"POST /api/strategies ({strat_id})", resp.status_code == 200, resp)

def test_toggle_strategy(strat_id):
    print(f"\n--- Testing Toggle Strategy: {strat_id} ---")
    resp = requests.post(f"{API_URL}/{strat_id}/toggle")
    log_test(f"POST /api/strategies/{strat_id}/toggle", resp.status_code == 200, resp)

def test_automated_signal(strat_id, symbol, action, price):
    print(f"\n--- Testing Automated Webhook Signal: {action} {symbol} ---")
    payload = {
        "strategy": strat_id,
        "symbol": symbol,
        "action": action,
        "price": str(price),
        "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    resp = requests.post(WEBHOOK_URL, json=payload)
    log_test(f"POST /webhook ({action} {symbol})", resp.status_code == 200, resp)

def test_manual_signal(strat_id, symbol, action, price):
    print(f"\n--- Testing Manual Signal: {action} {symbol} ---")
    payload = {
        "symbol": symbol,
        "action": action,
        "price": str(price),
        "strategy": strat_id
    }
    resp = requests.post(f"{API_URL}/{strat_id}/manual", json=payload)
    log_test(f"POST /api/strategies/{strat_id}/manual", resp.status_code == 200, resp)

def main():
    test_id = f"test_{int(time.time())}"
    
    # 1. Get initial strategies
    test_get_strategies()
    
    # 2. Create a new test strategy
    test_create_strategy(test_id)
    
    # 3. Toggle it off and back on
    test_toggle_strategy(test_id) # Deactivate
    test_toggle_strategy(test_id) # Activate
    
    # 4. Send Automated BUY signal
    test_automated_signal(test_id, "TEST_SYM", "BUY", 100.50)
    
    # 5. Send Automated CLOSE signal (should calculate PnL)
    test_automated_signal(test_id, "TEST_SYM", "CLOSE", 105.75)
    
    # 6. Send Manual BUY signal
    test_manual_signal(test_id, "MANUAL_SYM", "BUY", 500.00)
    
    # 7. Final check
    final_stats = test_get_strategies()
    if test_id in final_stats:
        print(f"\nFinal State for {test_id}:")
        print(f"  PnL: {final_stats[test_id].get('pnl')}")
        print(f"  Last Signal: {final_stats[test_id].get('last_signal')}")
        print(f"  Completed Trans: {len(final_stats[test_id].get('completed_transactions', []))}")

if __name__ == "__main__":
    main()
