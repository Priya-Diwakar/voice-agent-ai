# services/gemini_service.py

import os
import logging
import google.generativeai as genai
from typing import List, Dict

# Load Gemini API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    logging.warning("GEMINI_API_KEY not found. LLM will fail.")

def get_chat_response(session_history: List[Dict], user_query: str) -> (str, List[Dict]):
    """Get a response from Gemini LLM and updated history."""
    if not GEMINI_API_KEY:
        raise Exception("Gemini API key not configured.")

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        chat = model.start_chat(history=session_history)
        response = chat.send_message(user_query)
        return response.text, chat.history
    except Exception as e:
        logging.error(f"Error with Gemini API: {e}", exc_info=True)
        raise
