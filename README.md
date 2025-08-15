# SonixAI Bot – AI Voice Agent

**SonixAI Bot** is a web-based AI voice assistant that allows users to interact using voice. The bot can understand spoken queries, generate AI responses using Gemini LLM, and convert the response to natural-sounding speech using Murf AI.

---

## 🚀 Features
- Real-time **Speech-to-Text** transcription using AssemblyAI  
- AI-powered responses with **Gemini API (Google’s LLM)**  
- **Text-to-Speech** conversion using Murf AI  
- Multiple AI voices to choose from  
- Session-based chat history with clear functionality  
- Interactive web interface built with **FastAPI + Jinja2**  
- Logging for monitoring queries and responses  

---

## 🛠️ Technologies Used
- **Backend:** Python, FastAPI  
- **Frontend:** HTML, CSS, JavaScript  
- **APIs & AI Services:**  
  - Murf AI – Text-to-Speech  
  - Gemini API – Large Language Model  
  - AssemblyAI – Speech-to-Text  
- **Environment Management:** dotenv  
- **Logging:** Python logging module  

---

## 📂 Project Structure
voice-agent/
├── main.py # FastAPI backend entrypoint
├── services/
│ ├── murf_service.py # Murf TTS functions
│ ├── gemini_service.py # Gemini chat functions
│ └── assemblyai_service.py # Audio transcription functions
├── templates/
│ └── index.html # Frontend template
├── static/
│ ├── index.js
│ └── styles.css
├── .env # Environment variables (API keys)
├── requirements.txt # Python dependencies
└── README.md

yaml
Copy
Edit

---

## ⚡ Setup & Run Instructions

### 1. Clone the repository
```bash
git clone https://github.com/<Priya-Diwakar>/voice-agent-ai.git
cd voice-agent-ai

2. Install dependencies
bash
Copy
Edit
pip install -r requirements.txt

3. Create a .env file in the root directory
ini
Copy
Edit
ASSEMBLYAI_API_KEY=your_assemblyai_key
GEMINI_API_KEY=your_gemini_key
MURF_API_KEY=your_murf_key

4. Run the FastAPI backend
bash
Copy
Edit
uvicorn main:app --reload

5. Open the app in browser
Go to: http://127.0.0.1:8000

📝 How to Use
Open the web interface in your browser.

Speak your query into the microphone.

SonixAI Bot responds in the selected AI voice.

You can clear the chat history for a session using the Clear Chat button.