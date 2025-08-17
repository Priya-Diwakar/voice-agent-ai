# main.py

from fastapi import FastAPI, Form, Request, UploadFile, File, Path, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv
from utils.chat_history import chat_histories,convert_history_to_dicts
from utils.connection_manager import manager
from schemas.chat_schemas import AgentChatResponse,ChatHistoryResponse,ErrorResponse,ChatRequest
import logging
import os
import base64
import asyncio
import json


# Load environment variables from .env
load_dotenv()

# Services
from services import assemblyai_service, gemini_service, murf_service
from schemas.chat_schemas import ChatHistoryResponse, AgentChatResponse
from fastapi.middleware.cors import CORSMiddleware


# --- Logging Configuration ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# --- FastAPI App ---
app = FastAPI(title="SonixAI Bot AI Agent")

# --- Static Files & Templates ---
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# --- Ensure API keys exist ---
missing_keys = [
    key for key in ["ASSEMBLYAI_API_KEY", "GEMINI_API_KEY", "MURF_API_KEY"]
    if not os.getenv(key)
]
if missing_keys:
    raise RuntimeError(f"Missing API keys in .env: {', '.join(missing_keys)}")


# Allow local frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
        
        
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        # Client jo bhejega uska echo ya AI response yaha banao
        response_text = f"Bot: You said '{data}'"
        await websocket.send_json({"text": response_text})
        

# ---------------- Existing Routes ----------------
@app.get("/")
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# getting all the voices
@app.get("/voices", response_model=list)
async def get_voices():
    try:
        return murf_service.get_available_voices()
    except Exception as e:
        logger.error(f"Error fetching voices: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch voices")

@app.get("/agent/chat/{session_id}", response_model=ChatHistoryResponse)
async def get_chat_history(session_id: str):
    history = chat_histories.get(session_id, [])
    return ChatHistoryResponse(history=convert_history_to_dicts(history))

@app.delete("/agent/chat/{session_id}")
async def clear_chat_history(session_id: str):
    if session_id in chat_histories:
        del chat_histories[session_id]
        logger.info(f"Chat history cleared for session: {session_id}")
    return JSONResponse(content={"message": "Chat history cleared."})

# gives history and chats with audio url for that particular session
@app.post("/agent/chat/{session_id}",response_model=ChatHistoryResponse)
async def agent_chat(
    session_id,
    request:ChatRequest
):
    try:

        user_text = request.user_text

        # 1. Load old history or create new
        history = chat_histories.get(session_id, [])

        # 3. Get Gemini response
        assistant_text,updated_history = gemini_service.get_chat_response(history,user_text)

        # 4. Add assistant reply to history
        chat_histories[session_id] = updated_history

        # 5. Return both texts
        return ChatHistoryResponse(history=convert_history_to_dicts(updated_history))

    except Exception as e:
        logger.error(f"Error in agent_chat for {session_id}: {e}", exc_info=True)
        history_dicts = convert_history_to_dicts(chat_histories.get(session_id, []))
        return JSONResponse(
            status_code=500,
            content={
                "error": str(e),
                "history": history_dicts,
                "audio_url": None,
                "fallback_text": "I'm having trouble connecting. Please try again later."
            }
        )
