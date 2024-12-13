# import sounddevice as sd
# import queue
# import vosk
# import json

# # Define paths to your Vosk models for English and Hindi
# model_path_en = "C:/Users/mukun/Downloads/vosk-model-en-in-0.5"
# model_path_hi = "C:/Users/mukun/Downloads/vosk-model-hi-0.22"

# # Load the models
# model_en = vosk.Model(model_path_en)
# model_hi = vosk.Model(model_path_hi)

# # Queue to store audio data
# q = queue.Queue()

# # Callback function for audio input
# def audio_callback(indata, frames, time, status):
#     if status:
#         print(status)
#     q.put(bytes(indata))

# # Function to perform speech-to-text with a selected model
# def recognize_speech(model):
#     rec = vosk.KaldiRecognizer(model, 16000)
#     print("Listening... Speak now!")
#     while True:
#         data = q.get()
#         if rec.AcceptWaveform(data):
#             result = json.loads(rec.Result())  # Final result
#             print(f"{result['text']}")
#         else:
#             partial_result = json.loads(rec.PartialResult())  # Partial result
#             print(f"{partial_result['partial']}", end='\r')

# # Main program to choose language and start recognition
# def main():
#     print("Choose the language for speech recognition:")
#     print("1. English")
#     print("2. Hindi")
#     lang_choice = input("Enter your choice (1/2): ")

#     if lang_choice == '1':
#         selected_model = model_en
#     elif lang_choice == '2':
#         selected_model = model_hi
#     else:
#         print("Invalid choice! Defaulting to English.")
#         selected_model = model_en

#     with sd.RawInputStream(samplerate=16000, blocksize=8000, dtype='int16',
#                            channels=1, callback=audio_callback):
#         recognize_speech(selected_model)

# if __name__ == "__main__":
#     main()

# server.py
import asyncio
import websockets
import json
import vosk
import numpy as np

class SpeechToTextServer:
    def __init__(self):
        # Initialize models
        self.model_en = vosk.Model("C:/Users/mukun/Downloads/vosk-model-en-in-0.5")
        self.model_hi = vosk.Model("C:/Users/mukun/Downloads/vosk-model-hi-0.22")
        self.recognizers = {}

    async def process_audio(self, websocket, path):
        try:
            # First message should be the language selection
            lang_msg = await websocket.recv()
            lang_data = json.loads(lang_msg)
            language = lang_data.get('language', 'en')

            # Create recognizer based on language
            model = self.model_en if language == 'en' else self.model_hi
            recognizer = vosk.KaldiRecognizer(model, 16000)
            
            print(f"Client connected. Language: {language}")

            while True:
                # Receive audio data
                audio_data = await websocket.recv()
                
                # Convert audio data to numpy array
                audio_np = np.frombuffer(audio_data, dtype=np.int16)
                
                # Process audio with Vosk
                if recognizer.AcceptWaveform(audio_np.tobytes()):
                    result = json.loads(recognizer.Result())
                    await websocket.send(json.dumps({
                        'type': 'final',
                        'text': result['text']
                    }))
                else:
                    partial = json.loads(recognizer.PartialResult())
                    await websocket.send(json.dumps({
                        'type': 'partial',
                        'text': partial['partial']
                    }))

        except websockets.exceptions.ConnectionClosed:
            print("Client disconnected")
        except Exception as e:
            print(f"Error: {str(e)}")

    async def start_server(self, host='localhost', port=8765):
        async with websockets.serve(self.process_audio, host, port):
            print(f"Server started on ws://{host}:{port}")
            await asyncio.Future()  # run forever

if __name__ == "__main__":
    server = SpeechToTextServer()
    asyncio.run(server.start_server())