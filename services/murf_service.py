# murf_service.py
import os
from dotenv import load_dotenv
from murf import Murf

# Load .env variables
load_dotenv()
MURF_API_KEY = os.getenv("MURF_API_KEY")

if not MURF_API_KEY:
    raise EnvironmentError(
        "❌ MURF_API_KEY not found. Add it to your .env file:\nMURF_API_KEY=your_api_key_here"
    )

# Initialize Murf client
client = Murf(api_key=MURF_API_KEY)


def get_available_voices():
    """
    Fetch available voices from Murf API using SDK
    """
    try:
        voices = client.text_to_speech.get_voices()
        print(voices)
        return voices
    
    except Exception as e:
        print(f"❌ Error fetching voices: {e}")
        return []


def generate_speech(text, voice_id="en-US-1", style="Conversational", format_type="MP3"):
    """
    Generate speech from text using Murf AI SDK
    """
    try:
        # Generate audio
        audio_data = client.text_to_speech.synthesize(
            voice_id=voice_id,
            style=style,
            format=format_type,
            text=text
        )
        return audio_data
    except Exception as e:
        print(f"❌ Error generating speech: {e}")
        return None


if __name__ == "__main__":
    # Get voices
    voices = get_available_voices()
    print("✅ Available Voices:", voices)

    # Generate speech
    text_input = "Hello Priya, your Murf AI integration is now correct."
    audio_content = generate_speech(text_input)

    if audio_content:
        with open("output.mp3", "wb") as f:
            f.write(audio_content)
        print("✅ Audio saved as output.mp3")
    else:
        print("⚠️ No audio generated.")