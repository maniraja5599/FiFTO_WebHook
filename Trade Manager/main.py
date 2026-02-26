from fastapi import FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import json
import os
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from services.telegram_service import send_telegram_message
from services.quantman_service import send_quantman_signal

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="TradingView to Telegram & Quantman Bridge")

STRATEGIES_FILE = "strategies.json"

def load_strategies():
    if not os.path.exists(STRATEGIES_FILE):
        return {}
    with open(STRATEGIES_FILE, "r") as f:
        return json.load(f)

def save_strategies(strategies):
    with open(STRATEGIES_FILE, "w") as f:
        json.dump(strategies, f, indent=4)

class SignalRequest(BaseModel):
    strategy: str
    symbol: str
    action: str
    price: Optional[str] = "N/A"
    time: Optional[str] = None

class CreateStrategyRequest(BaseModel):
    id: str
    name: str
    type: str = "Automatic"
    telegram_bot_token: Optional[str] = ""
    telegram_chat_id: Optional[str] = ""
    quantman_webhook_url: Optional[str] = ""

@app.post("/webhook")
async def handle_webhook(request: Request):
    try:
        payload = await request.json()
    except Exception as e:
        logger.error(f"Invalid JSON payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    logger.info(f"Received webhook: {payload}")
    return await process_signal(payload)

@app.post("/webhook/{strategy_id}/{action}")
async def handle_action_webhook(strategy_id: str, action: str, request: Request):
    try:
        # Try to parse JSON body if provided, otherwise use empty dict
        try:
            payload = await request.json()
        except:
            payload = {}
        
        # Mapping granular actions to core actions
        action_map = {
            "BUY_ENTRY": "BUY",
            "BUY_EXIT": "CLOSE",
            "SELL_ENTRY": "SELL",
            "SELL_EXIT": "CLOSE"
        }
        raw_action = action.upper()
        payload["action"] = action_map.get(raw_action, raw_action)
        
        if not payload.get("time"):
            payload["time"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
        logger.info(f"Received action-specific webhook: {strategy_id} - {action}")
        return await process_signal(payload)
    except Exception as e:
        logger.error(f"Error processing action webhook: {e}")
        raise HTTPException(status_code=400, detail=str(e))

async def process_signal(payload: Dict[str, Any], is_manual: bool = False):
    strategy_id = payload.get("strategy")
    if not strategy_id:
        logger.warning("Strategy ID missing in payload")
        raise HTTPException(status_code=400, detail="Strategy ID missing in payload")

    strategies = load_strategies()
    strategy_config = strategies.get(strategy_id)

    if not strategy_config:
        logger.error(f"Strategy '{strategy_id}' not found in configuration")
        raise HTTPException(status_code=404, detail=f"Strategy '{strategy_id}' not found")

    # Check if strategy is active
    if not strategy_config.get("is_active", True) and not is_manual:
        logger.info(f"Strategy {strategy_id} is paused. Ignoring signal.")
        return {"status": "ignored", "message": "Strategy is paused"}

    # Signal Filtering (Flip Entry)
    action = payload.get("action", "").upper()
    last_signal = strategy_config.get("last_signal")

    if not is_manual:
        if action == last_signal and action != "CLOSE":
            logger.info(f"Duplicate {action} signal for {strategy_id}. Ignoring.")
            return {"status": "ignored", "message": f"Duplicate signal {action}"}
        
    # Transaction Logic
    symbol = payload.get("symbol", "Unknown")
    price_str = payload.get("price", "0")
    try:
        price = float(price_str.replace(",", ""))
    except ValueError:
        price = 0.0
        
    msg_time = payload.get("time") or datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    open_positions = strategy_config.get("open_positions", {})
    
    # Simple logic: 
    # - If action matches "CLOSE" or is opposite of existing position for symbol -> Close it.
    # - Else -> Open new leg.
    
    if symbol in open_positions:
        entry_leg = open_positions[symbol]
        entry_price = entry_leg["entry_price"]
        entry_action = entry_leg["action"]
        
        # Calculate PnL
        pnl = 0.0
        if entry_action == "BUY":
            pnl = (price - entry_price) # Simplified: (Exit - Entry)
        elif entry_action == "SELL":
            pnl = (entry_price - price) # Simplified: (Entry - Exit)
            
        # Move to completed
        completed_leg = {
            "symbol": symbol,
            "qty": payload.get("qty", 1),
            "entry_action": entry_action,
            "entry_price": entry_price,
            "entry_time": entry_leg["time"],
            "exit_action": action,
            "exit_price": price,
            "exit_time": msg_time,
            "pnl": round(pnl, 2)
        }
        
        if "completed_transactions" not in strategy_config:
            strategy_config["completed_transactions"] = []
            
        strategy_config["completed_transactions"].insert(0, completed_leg)
        strategy_config["pnl"] = round(strategy_config.get("pnl", 0.0) + pnl, 2)
        del open_positions[symbol]
    else:
        # Open new position (Leg)
        if action != "CLOSE":
            open_positions[symbol] = {
                "action": action,
                "entry_price": price,
                "time": msg_time
            }

    # Update strategy state
    strategy_config["last_signal"] = action
    strategy_config["last_signal_time"] = msg_time
    strategy_config["open_positions"] = open_positions
    save_strategies(strategies)

    # Construct Telegram message
    manual_tag = " [MANUAL]" if is_manual else ""
    message = f"🚀 *{strategy_config.get('name', strategy_id)}*{manual_tag}\n\n" \
              f"Symbol: {symbol}\n" \
              f"Action: {action}\n" \
              f"Price: {price}\n" \
              f"Time: {msg_time}"

    # Forward to Telegram
    await send_telegram_message(
        strategy_config["telegram_bot_token"],
        strategy_config["telegram_chat_id"],
        message
    )

    # Forward to Quantman
    await send_quantman_signal(
        strategy_config["quantman_webhook_url"],
        payload
    )

    return {"status": "success", "message": f"Signal processed for {strategy_id}"}

# --- Dashboard API ---

@app.get("/api/strategies")
async def get_strategies():
    return load_strategies()

@app.post("/api/strategies")
async def create_strategy(request: CreateStrategyRequest):
    strategies = load_strategies()
    if request.id in strategies:
        raise HTTPException(status_code=400, detail="Strategy ID already exists")
    
    new_strategy = {
        "name": request.name,
        "type": request.type,
        "telegram_bot_token": request.telegram_bot_token,
        "telegram_chat_id": request.telegram_chat_id,
        "quantman_webhook_url": request.quantman_webhook_url,
        "is_active": True,
        "last_signal": None,
        "pnl": 0.0,
        "open_positions": {},
        "completed_transactions": []
    }
    
    strategies[request.id] = new_strategy
    save_strategies(strategies)
    return {"status": "success", "strategy_id": request.id}

@app.put("/api/strategies/{strategy_id}")
async def update_strategy(strategy_id: str, request: CreateStrategyRequest):
    strategies = load_strategies()
    if strategy_id not in strategies:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    # Update core fields
    strategies[strategy_id]["name"] = request.name
    strategies[strategy_id]["type"] = request.type
    strategies[strategy_id]["telegram_bot_token"] = request.telegram_bot_token
    strategies[strategy_id]["telegram_chat_id"] = request.telegram_chat_id
    strategies[strategy_id]["quantman_webhook_url"] = request.quantman_webhook_url
    
    save_strategies(strategies)
    return {"status": "success", "strategy_id": strategy_id}

@app.delete("/api/strategies/{strategy_id}")
async def delete_strategy(strategy_id: str):
    strategies = load_strategies()
    if strategy_id not in strategies:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    del strategies[strategy_id]
    save_strategies(strategies)
    return {"status": "success", "message": f"Strategy {strategy_id} deleted"}

@app.post("/api/strategies/{strategy_id}/toggle")
async def toggle_strategy(strategy_id: str):
    strategies = load_strategies()
    if strategy_id not in strategies:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    strategies[strategy_id]["is_active"] = not strategies[strategy_id].get("is_active", True)
    save_strategies(strategies)
    return {"status": "success", "is_active": strategies[strategy_id]["is_active"]}

@app.post("/api/strategies/{strategy_id}/manual")
async def manual_signal(strategy_id: str, request: SignalRequest):
    payload = request.dict()
    payload["strategy"] = strategy_id
    if not payload.get("time"):
        payload["time"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    return await process_signal(payload, is_manual=True)

# Serve static files
if os.path.exists("static"):
    app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
