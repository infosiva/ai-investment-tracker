from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import anthropic
import os

router = APIRouter()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

class AnalysisRequest(BaseModel):
    portfolio_data: dict
    question: str = "Analyze my portfolio and suggest optimizations"

@router.post("/ai-insights")
async def get_ai_insights(req: AnalysisRequest):
    prompt = f"""You are an expert financial analyst. Analyze this investment portfolio and provide actionable insights.

Portfolio Data:
{req.portfolio_data}

User Question: {req.question}

Provide:
1. Portfolio health assessment
2. Diversification analysis
3. Risk assessment
4. Top 3 actionable recommendations
5. Rebalancing suggestions if needed

Be specific, data-driven, and concise."""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
        system="You are a professional financial advisor with expertise in portfolio management. Always include disclaimers that this is not financial advice.",
        messages=[{"role": "user", "content": prompt}],
    )

    return {
        "insights": message.content[0].text,
        "tokens_used": message.usage.input_tokens + message.usage.output_tokens,
    }
