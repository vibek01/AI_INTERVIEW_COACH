import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, getAIResponse, speakText } from '../services/aiService';

// Helper function to prevent AI from speaking markdown
const cleanTextForSpeech = (text: string): string => {
  let cleaned = text.replace(/[\*#_`]/g, '');
  cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, '');
  return cleaned.trim();
};

interface InterviewManagerProps {
  role: string;
}

export function useInterviewManager({ role }: InterviewManagerProps) {
  const [interviewState, setInterviewState] = useState<'idle' | 'running' | 'ended'>('idle');
  const [aiState, setAIState] = useState<'idle' | 'speaking' | 'listening' | 'thinking'>('idle');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [finalFeedback, setFinalFeedback] = useState('');
  const [timeLeft, setTimeLeft] = useState(300);
  const [isInitializing, setIsInitializing] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);

  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const interviewTimerRef = useRef<number | null>(null);
  const isAISpeakingRef = useRef(false);
  const roleName = role.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  const cleanup = useCallback(() => {
    if (interviewTimerRef.current) clearInterval(interviewTimerRef.current);
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }
    micStream?.getTracks().forEach(track => track.stop());
    setMicStream(null);
  }, [micStream]);

  const startListening = useCallback(() => {
    if (isAISpeakingRef.current || interviewState !== 'running' || !speechRecognitionRef.current) return;
    setAIState('listening');
    try {
      speechRecognitionRef.current.start();
    } catch (e) {
      console.warn("Speech recognition already active.", e);
    }
  }, [interviewState]);

  const handleUserSpeech = useCallback(async (userText: string) => {
    if (!userText.trim()) return;

    const newHistory = [...chatHistory, { role: 'user', content: userText }];
    setChatHistory(newHistory);
    setAIState('thinking');

    try {
      const aiText = await getAIResponse(newHistory);
      const cleanText = cleanTextForSpeech(aiText);
      setChatHistory(prev => [...prev, { role: 'assistant', content: aiText }]);
      
      const audioUrl = await speakText(cleanText);
      if (audioPlayerRef.current) {
        isAISpeakingRef.current = true;
        audioPlayerRef.current.src = audioUrl;
        audioPlayerRef.current.play();
        setAIState('speaking');
      }
    } catch (error) {
      console.error("Error in AI response chain:", error);
      isAISpeakingRef.current = false;
      startListening();
    }
  }, [chatHistory, startListening]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setPermissionError("Speech Recognition API is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    speechRecognitionRef.current = recognition;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      handleUserSpeech(event.results[0][0].transcript);
    };
    
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
    };
    
    recognition.onend = () => {
      if (interviewState === 'running' && !isAISpeakingRef.current) {
        startListening();
      }
    };
  }, [interviewState, handleUserSpeech, startListening]);

  const startInterview = useCallback(async () => {
    setIsInitializing(true);
    setPermissionError(null);
    setChatHistory([]);
    setFinalFeedback('');
    setTimeLeft(300);
    setAIState('idle');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      setMicStream(stream);
      setInterviewState('running');
      interviewTimerRef.current = window.setInterval(() => setTimeLeft(t => t > 0 ? t - 1 : 0), 1000);
      
      const systemPrompt = `You are an expert HR interviewer for a ${roleName} position. Ask relevant questions one at a time and keep responses concise.`;
      const firstQuestion = `Hello, and welcome. We're interviewing for the ${roleName} role today. To start, could you tell me about your relevant experience?`;
      
      const initialHistory: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'assistant', content: firstQuestion }
      ];
      setChatHistory(initialHistory);
      
      const audioUrl = await speakText(cleanTextForSpeech(firstQuestion));
      if (audioPlayerRef.current) {
        isAISpeakingRef.current = true;
        audioPlayerRef.current.src = audioUrl;
        audioPlayerRef.current.play();
        setAIState('speaking');
      }
    } catch (err: any) {
      console.error("Error initializing interview:", err);
      setPermissionError("Could not access camera/microphone. Please grant permission and refresh.");
      cleanup();
      setInterviewState('idle');
    } finally {
      setIsInitializing(false);
    }
  }, [roleName, cleanup]);

  const endInterview = useCallback(async () => {
    if (interviewState !== 'running') return;
    
    setInterviewState('ended');
    setAIState('thinking');
    cleanup();

    const finalPrompt: ChatMessage = { role: 'user', content: `The interview is over. Please provide comprehensive feedback on my performance.` };
    const finalHistory = [...chatHistory, finalPrompt];
    const feedback = await getAIResponse(finalHistory);
    
    setFinalFeedback(feedback);
    setAIState('idle');
  }, [interviewState, chatHistory, cleanup]);

  const handleAudioEnded = () => {
    isAISpeakingRef.current = false;
    startListening();
  };

  useEffect(() => {
    if (timeLeft === 0 && interviewState === 'running') {
      endInterview();
    }
  }, [timeLeft, interviewState, endInterview]);

  return {
    state: { interviewState, aiState, chatHistory, finalFeedback, timeLeft, isInitializing, permissionError, micStream },
    actions: { startInterview, endInterview },
    refs: { audioPlayerRef },
    handlers: { handleAudioEnded },
  };
}