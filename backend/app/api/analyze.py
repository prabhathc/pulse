from fastapi import APIRouter
from app.schemas.chat_message import ChatMessage
from app.models.sentiment import analyze_sentiment

router = APIRouter()  # This should define the router

@router.post("/api/analyze")
async def analyze_message(message: ChatMessage):
    # Run the message content through the sentiment analysis model
    result = analyze_sentiment(message.content)
    print(result)
    return {"sentiment": result}
