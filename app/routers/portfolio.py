from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import yfinance as yf
from typing import List

router = APIRouter()

class PortfolioItem(BaseModel):
    ticker: str
    shares: float
    buy_price: float

class PortfolioRequest(BaseModel):
    holdings: List[PortfolioItem]

@router.post("/analyze")
async def analyze_portfolio(req: PortfolioRequest):
    results = []
    for item in req.holdings:
        try:
            ticker = yf.Ticker(item.ticker.upper())
            info = ticker.fast_info
            current_price = info.last_price
            value = current_price * item.shares
            gain_pct = ((current_price - item.buy_price) / item.buy_price) * 100
            results.append({
                "ticker": item.ticker.upper(),
                "shares": item.shares,
                "buy_price": item.buy_price,
                "current_price": round(current_price, 2),
                "current_value": round(value, 2),
                "gain_loss_pct": round(gain_pct, 2),
            })
        except Exception as e:
            results.append({"ticker": item.ticker, "error": str(e)})

    total_value = sum(r.get("current_value", 0) for r in results)
    total_cost = sum(r.get("buy_price", 0) * r.get("shares", 0) for r in results if "current_value" in r)

    return {
        "holdings": results,
        "total_value": round(total_value, 2),
        "total_cost": round(total_cost, 2),
        "total_gain_loss_pct": round(((total_value - total_cost) / total_cost) * 100, 2) if total_cost else 0,
    }
