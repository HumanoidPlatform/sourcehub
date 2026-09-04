export type SpeechRecognitionService = {
  isAvailable: () => Promise<boolean>;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
};

export const speechRecognitionService: SpeechRecognitionService = {
  async isAvailable() {
    return false;
  },
  async startListening() {
    throw new Error('Worker voice input requires a future STT provider such as Whisper and is not enabled in Cosaarthi Mobile.');
  },
  async stopListening() {
    return undefined;
  },
};
