from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.gemini import HEALYNX_SYSTEM, _call_gemini
from pydantic import BaseModel

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    context: str = ""

@router.post("/ask")
async def ask_chatbot(request: ChatRequest):
    """
    General chatbot endpoint using Gemini.
    """
    try:
        response = await _call_gemini(request.message, HEALYNX_SYSTEM + "\n" + request.context)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
