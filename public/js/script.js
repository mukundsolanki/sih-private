
function toggleSidebar() {
    const sidebar = document.querySelector(".chat-sidebar");
    sidebar.classList.toggle("collapsed");

    if (sidebar.classList.contains("collapsed")) {
        sidebar.style.backgroundColor = "transparent";
    } else {
        sidebar.style.backgroundColor = "";
    }
}

function closeWindow() {
    window.close();
}

function sendMessageHandler() {
    // This will call the sendMessage function from main.js
    if (typeof sendMessage === "function") {
        sendMessage();
    } else {
        console.error("sendMessage function is not defined");
    }
}

// AudioWorklet processor code as a string
const workletCode = `
      class AudioProcessor extends AudioWorkletProcessor {
          constructor() {
              super();
              this.bufferSize = 8192;
              this.buffer = new Float32Array(this.bufferSize);
              this.bufferedSamples = 0;
          }

          process(inputs, outputs, parameters) {
              const input = inputs[0][0];
              if (!input) return true;

              // Add incoming samples to buffer
              for (let i = 0; i < input.length; i++) {
                  this.buffer[this.bufferedSamples] = input[i];
                  this.bufferedSamples++;

                  // When buffer is full, send it to main thread
                  if (this.bufferedSamples >= this.bufferSize) {
                      const int16Data = new Int16Array(this.bufferSize);
                      for (let j = 0; j < this.bufferSize; j++) {
                          int16Data[j] = Math.max(-32768, Math.min(32767, this.buffer[j] * 32768));
                      }
                      this.port.postMessage(int16Data.buffer, [int16Data.buffer]);
                      
                      // Reset buffer
                      this.buffer = new Float32Array(this.bufferSize);
                      this.bufferedSamples = 0;
                  }
              }
              return true;
          }
      }
      registerProcessor('audio-processor', AudioProcessor);
  `;

let websocket;
let audioContext;
let workletNode;
const outputDiv = document.getElementById("output");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const languageSelect = document.getElementById("language");

async function initAudioWorklet() {
    const blob = new Blob([workletCode], {
        type: "application/javascript",
    });
    const workletUrl = URL.createObjectURL(blob);
    await audioContext.audioWorklet.addModule(workletUrl);
    URL.revokeObjectURL(workletUrl);
}

startBtn.onclick = async () => {
    try {
        // Connect to WebSocket server
        websocket = new WebSocket("ws://localhost:8765");

        websocket.onopen = () => {
            websocket.send(
                JSON.stringify({
                    language: languageSelect.value,
                })
            );
        };

        websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "final") {
                // Only send to peers, don't display locally
                const transcriptionData = {
                    text: data.text,
                    sender: socket.id,
                    type: "transcription",
                };

                // Emit transcription to peers
                socket.emit("transcription", transcriptionData);
            }
        };

        // Get audio stream
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
        });

        // Initialize audio context and worklet
        audioContext = new AudioContext({
            sampleRate: 8000, // Match Vosk's expected sample rate
            latencyHint: "interactive",
        });

        await initAudioWorklet();

        const source = audioContext.createMediaStreamSource(stream);
        workletNode = new AudioWorkletNode(audioContext, "audio-processor");

        workletNode.port.onmessage = (e) => {
            if (websocket.readyState === WebSocket.OPEN) {
                websocket.send(e.data);
            }
        };

        source.connect(workletNode);
        workletNode.connect(audioContext.destination);

        startBtn.disabled = true;
        stopBtn.disabled = false;
    } catch (error) {
        console.error("Error:", error);
        alert("Error starting recording: " + error.message);
    }
};

stopBtn.onclick = () => {
    if (websocket) {
        websocket.close();
    }
    if (workletNode) {
        workletNode.disconnect();
        workletNode = null;
    }
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    startBtn.disabled = false;
    stopBtn.disabled = true;
};