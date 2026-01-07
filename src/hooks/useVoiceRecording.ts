import { useState, useRef, useCallback } from 'react';

interface UseVoiceRecordingOptions {
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
}

// SpeechRecognition type definition
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface ISpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

interface ISpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

export function useVoiceRecording({ onTranscript, onError }: UseVoiceRecordingOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const transcriptRef = useRef<string>('');

  const startRecording = useCallback(() => {
    const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognitionConstructor) {
      onError?.('Speech recognition is not supported in this browser');
      return;
    }

    // Clean up any existing instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore abort errors
      }
      recognitionRef.current = null;
    }

    transcriptRef.current = '';
    
    recognitionRef.current = new SpeechRecognitionConstructor() as ISpeechRecognition;
    
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => {
      setIsRecording(true);
      setIsProcessing(false);
    };

    recognitionRef.current.onresult = (event: ISpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = 0; i < Object.keys(event.results).length; i++) {
        const result = event.results[i];
        if (result && result[0]) {
          const transcript = result[0].transcript;
          // Check if this result is final (has isFinal property at the result level)
          const isFinal = (result as any).isFinal;
          if (isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
      }
      
      // Store the combined transcript
      if (finalTranscript) {
        transcriptRef.current = finalTranscript;
      }
    };

    recognitionRef.current.onerror = (event: ISpeechRecognitionErrorEvent) => {
      // Don't treat "aborted" as an error - it's expected when stopping
      if (event.error === 'aborted') {
        return;
      }
      
      setIsRecording(false);
      setIsProcessing(false);
      
      if (event.error === 'not-allowed') {
        onError?.('Microphone access denied. Please allow microphone access to use voice input.');
      } else if (event.error === 'no-speech') {
        onError?.('No speech detected. Please try again.');
      } else {
        onError?.(`Speech recognition error: ${event.error}`);
      }
    };

    recognitionRef.current.onend = () => {
      setIsRecording(false);
      
      // Submit any collected transcript when recognition ends
      if (transcriptRef.current.trim()) {
        setIsProcessing(true);
        onTranscript(transcriptRef.current.trim());
        transcriptRef.current = '';
        setIsProcessing(false);
      }
    };

    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      onError?.('Failed to start voice recording. Please try again.');
    }
  }, [onTranscript, onError]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors
      }
      setIsRecording(false);
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}
