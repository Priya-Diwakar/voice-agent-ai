document.addEventListener("DOMContentLoaded", () => {
  // --- Element Selectors ---
  const agentVoiceSelect = document.getElementById("agent-voice-select");
  const aetherRecordBtn = document.getElementById("aether-record-btn");
  const agentStatus = document.getElementById("agent-status");
  const agentClearBtn = document.getElementById("agent-clear-btn");
  const chatHistoryContainer = document.getElementById(
    "chat-history-container"
  );
  const emptyChatMessage = document.getElementById("empty-chat-message");
  const agentErrorBox = document.getElementById("agent-error-box");
  const agentErrorText = document.getElementById("agent-error-text");
  const audioPlaybackContainer = document.getElementById(
    "audio-playback-container"
  );

  // --- State Variables ---
  let recognition;
  let agentAudioChunks = [];
  let isAgentRecording = false;
  let sessionId = null;

  // --- SVG Icons ---
  const micIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>`;
  const stopIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><rect width="8" height="8" x="8" y="8" rx="1"/></svg>`;

  // --- Helper Functions ---
  const showAgentError = (message) => {
    agentErrorText.textContent = message;
    agentErrorBox.classList.remove("hidden");
  };

  const hideAgentError = () => agentErrorBox.classList.add("hidden");

  const fetchVoices = async () => {
    try {
      const response = await fetch("/voices");
      if (!response.ok) throw new Error("Failed to fetch voices.");
      const voices = await response.json();
      console.log("🎤 All Voices:", voices);

      agentVoiceSelect.innerHTML = "";
      const defaultVoice_id = "en-US-katie";

      voices.forEach((voice) => {
        if (!voice.display_name.includes("child")) {
          const option = document.createElement("option");
          option.value = voice.voice_id;
          option.textContent = `${voice.display_name} (${voice.gender})`;
          if (voice.voice_id === defaultVoice_id) option.selected = true;
          agentVoiceSelect.appendChild(option);
        }
      });
    } catch (error) {
      console.error("Error fetching voices:", error);
      showAgentError(`Could not load voices.`);
    }
  };

  // --- WebSocket Setup ---
  const ws = new WebSocket("ws://127.0.0.1:8000/ws");

  ws.onopen = () => console.log("WebSocket connected");

  ws.onerror = (err) => console.error("WebSocket error:", err);
  ws.onclose = () => console.log("WebSocket disconnected");

  // Send message
  function sendMessage(msg) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }

  // --- Chat Rendering ---
  const addChatMessage = (role, text) => {
    if (emptyChatMessage) emptyChatMessage.style.display = "none";
    const turnContainer = document.createElement("div");
    turnContainer.innerHTML = `<p><span class="font-bold ${
      role === "Dhwani Bot" ? "text-purple-400" : "text-gray-300"
    }">${role}:</span> <span class="text-gray-200">${text}</span></p>`;
    chatHistoryContainer.appendChild(turnContainer);
    chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
  };

  const renderChatHistory = (history) => {
    chatHistoryContainer.innerHTML = "";
    if (!history || history.length === 0) {
      emptyChatMessage.classList.remove("hidden");
      return;
    }
    emptyChatMessage.classList.add("hidden");
    history.forEach((message) =>
      addChatMessage(
        message.role === "model" ? "Dhwani Bot" : "You",
        message.text
      )
    );
  };

  // --- Session Initialization ---
  const initSession = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    sessionId = urlParams.get("session_id");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      window.history.replaceState(
        { path: `/?session_id=${sessionId}` },
        "",
        `/?session_id=${sessionId}`
      );
      renderChatHistory([]);
    } else {
      try {
        const response = await fetch(`/agent/chat/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          renderChatHistory(data.history);
        }
      } catch (error) {
        showAgentError("Could not load history.");
        console.error(error);
      }
    }
  };

  // --- Session Updation ---
  const updateSession = async (userText) => {
    const urlParams = new URLSearchParams(window.location.search);
    sessionId = urlParams.get("session_id");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      window.history.replaceState(
        { path: `/?session_id=${sessionId}` },
        "",
        `/?session_id=${sessionId}`
      );
      renderChatHistory([]);
    } else {
      try {
        const response = await fetch(`/agent/chat/${sessionId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_text: userText,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          renderChatHistory(data.history);
        }
      } catch (error) {
        showAgentError("Could not load history.");
        console.error(error);
      }
    }
  };

  // --- Clear Chat ---
  const clearAgentChat = async () => {
    if (!sessionId) return;
    try {
      await fetch(`/agent/chat/${sessionId}`, { method: "DELETE" });
      renderChatHistory([]);
      agentStatus.textContent = "Ready";
      hideAgentError();
      sessionId = crypto.randomUUID();
      window.history.replaceState(
        { path: `/?session_id=${sessionId}` },
        "",
        `/?session_id=${sessionId}`
      );
    } catch (error) {
      showAgentError("Error clearing chat.");
    }
  };

  // --- Recording Functions ---
  const startAgentRecording = async () => {
    if (isAgentRecording) return;
    hideAgentError();
    isAgentRecording = true;
    try {
      // Different browsers ke liye support
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();

      recognition.lang = "en-US"; // Language set karo
      recognition.interimResults = true; // Live text chahiye
      recognition.continuous = true; // Bar-bar trigger ki zarurat nahi
      // recognition.maxAlternatives = 1;

      recognition.start();
      aetherRecordBtn.classList.add("is-recording");

      recognition.onstart = () => {
        agentStatus.textContent = "Listening...";
        aetherRecordBtn.innerHTML = stopIcon;
      };

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        console.log("📝 User said:", transcript);
        agentStatus.textContent = "Sending...";
        updateSession(transcript);
      };

      recognition.onend = () => {
        aetherRecordBtn.innerHTML = micIcon;
        recognition = null;
        isAgentRecording = false;
        aetherRecordBtn.classList.remove("is-recording");
      };
    } catch (error) {
      showAgentError(
        "Microphone access denied. Please allow microphone permissions."
      );
      agentStatus.textContent = "Mic Error";
      console.error(error);
    }
  };

  const stopAgentRecording = () => {
    if (recognition) {
      recognition.stop();
    }
  };

  // --- Event Listeners ---
  aetherRecordBtn.addEventListener("click", () => {
    if (isAgentRecording) stopAgentRecording();
    else startAgentRecording();
  });
  agentClearBtn.addEventListener("click", clearAgentChat);

  // --- Init ---
  fetchVoices();
  initSession();
  updateSession("hi bro!");
  aetherRecordBtn.innerHTML = micIcon;
});
