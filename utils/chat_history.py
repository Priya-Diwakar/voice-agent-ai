# --- In-memory Chat Store ---
chat_histories = {}

# --- Helper to Convert History ---
def convert_history_to_dicts(history) -> list[dict]:
    if not history:
        return []
    return [{"role": msg.role, "text": msg.parts[0].text} for msg in history]