import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Mic, Play, Square, X, ChevronLeft, BrainCircuit, MessageSquare, Loader2 } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { AIAvatar } from './AIAvatar';
import { useTheme } from '../contexts/ThemeContext';
import { useMicVolume } from '../hooks/useMicVolume';
import { ChatMessage, getAIResponse, speakText } from '../services/aiService';

const FeedbackDisplay = ({ messages, feedback }: { messages: ChatMessage[], feedback: string }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, feedback]);

  return (
    <GlassCard className="p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3 text-slate-300">
        <MessageSquare className="w-5 h-5" />
        <h3 className="font-semibold">Transcript & Feedback</h3>
      </div>
      <div ref={scrollRef} className="flex-grow overflow-y-auto pr-2 text-sm text-slate-300 space-y-4">
        {messages.slice(1).map((msg, index) => (
          <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`px-3 py-2 rounded-lg max-w-[85%] ${msg.role === 'user' ? 'bg-blue-600/50' : 'bg-slate-700/50'}`}>
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
        {feedback && (
          <div className="mt-4 p-3 bg-slate-800/60 rounded-lg border border-slate-600">
            <h4 className="font-bold text-slate-100 mb-2 flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-cyan-400" />Final Feedback</h4>
            <p className="whitespace-pre-wrap">{feedback}</p>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export function InterviewPanel({ role, onBack }: { role: string; onBack: () => void; }) {
  const { mode } = useTheme();
  const textColor = mode === 'dark' ? 'text-slate-100' : 'text-slate-800';
  const textSecondary = mode === 'dark' ? 'text-slate-400' : 'text-slate-500';

  const [interviewState, setInterviewState] = useState<'idle' | 'running' | 'ended'>('idle');
  const [aiState, setAIState] = useState<'idle' | 'speaking' | 'listening' | 'thinking'>('idle');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [finalFeedback, setFinalFeedback] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [isInitializing, setIsInitializing] = useState(false);

  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const userVolume = useMicVolume(micStream);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const speechRecognitionRef = useRef<any>(null);
  const interviewTimerRef = useRef<number | null>(null);
  const isAISpeakingRef = useRef(false);

  const roleName = role.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  const resetInterviewState = useCallback(() => {
    if (interviewTimerRef.current) clearInterval(interviewTimerRef.current);
    speechRecognitionRef.current?.stop();
    setMicStream(null); 
    setChatHistory([]);
    setFinalFeedback('');
    setTimeLeft(60);
    setAIState('idle');
    setInterviewState('idle');
  }, []);

  useEffect(() => {
    const stream = micStream;
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [micStream]);

  const startListening = useCallback(() => {
    isAISpeakingRef.current = false;
    if (interviewState === 'running') {
      setAIState('listening');
      try {
        speechRecognitionRef.current.start();
      } catch (e) {
        // Safe to ignore
      }
    }
  }, [interviewState]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event: any) => {
      const userText = event.results[0][0].transcript;
      if (userText.trim()) {
        setAIState('thinking');
        setChatHistory(prev => [...prev, { role: 'user', content: userText }]);
      }
    };
    
    recognition.onerror = (event: any) => console.error("Speech recognition error:", event.error);
    recognition.onend = () => {
      if (interviewState === 'running' && !isAISpeakingRef.current && aiState === 'listening') {
        startListening();
      }
    };

    speechRecognitionRef.current = recognition;
  }, [interviewState, aiState, startListening]);

  useEffect(() => {
    if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'user') {
      const processAIResponse = async () => {
        const aiText = await getAIResponse(chatHistory);
        setChatHistory(prev => [...prev, { role: 'assistant', content: aiText }]);
        try {
          const audioUrl = await speakText(aiText);
          if (audioPlayerRef.current) {
            isAISpeakingRef.current = true;
            audioPlayerRef.current.src = audioUrl;
            audioPlayerRef.current.play();
            setAIState('speaking');
          }
        } catch (error) {
          console.error(error);
          startListening();
        }
      };
      processAIResponse();
    }
  }, [chatHistory, startListening]);

  const startInterview = async () => {
    setIsInitializing(true);
    resetInterviewState();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      setMicStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;

      const systemPrompt = `You are an expert HR interviewer...`;
      const firstQuestion = `Hello, thanks for coming in...`;
      const initialHistory: ChatMessage[] = [{ role: 'system', content: systemPrompt }, { role: 'assistant', content: firstQuestion }];
      setChatHistory(initialHistory);

      interviewTimerRef.current = window.setInterval(() => setTimeLeft(t => t > 0 ? t - 1 : 0), 1000);
      setInterviewState('running');
      
      setAIState('thinking');
      const audioUrl = await speakText(firstQuestion);
      if (audioPlayerRef.current) {
        isAISpeakingRef.current = true;
        audioPlayerRef.current.src = audioUrl;
        audioPlayerRef.current.play();
        setAIState('speaking');
      }
    } catch (err) {
      alert("Could not access camera/microphone. Please grant permissions and use an HTTPS connection.");
      resetInterviewState();
    } finally {
      setIsInitializing(false);
    }
  };

  const endInterview = useCallback(async () => {
    if (interviewState !== 'running') return;
    
    setInterviewState('ended');
    setAIState('thinking');
    if (interviewTimerRef.current) clearInterval(interviewTimerRef.current);
    speechRecognitionRef.current?.stop();
    setMicStream(null);

    const finalPrompt: ChatMessage[] = [
      ...chatHistory,
      { role: 'user', content: `The interview is over...` }
    ];
    const feedback = await getAIResponse(finalPrompt);
    setFinalFeedback(feedback);
    setAIState('idle');
  }, [interviewState, chatHistory]);
  
  const toggleMic = () => {
    if(micStream) {
        micStream.getAudioTracks().forEach(track => track.enabled = !isMicOn);
        setIsMicOn(!isMicOn);
    }
  };

  const toggleCamera = () => {
    if(micStream) {
        micStream.getVideoTracks().forEach(track => track.enabled = !isCameraOn);
        setIsCameraOn(!isCameraOn);
    }
  };
  
  useEffect(() => {
    if (timeLeft === 0 && interviewState === 'running') {
      endInterview();
    }
  }, [timeLeft, interviewState, endInterview]);
  
  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <audio ref={audioPlayerRef} onEnded={startListening} />
      <GlassCard className="w-full max-w-6xl p-6 md:p-8">
        <div className="grid grid-cols-3 items-center mb-6">
          <div className="justify-self-start">
            <motion.button onClick={onBack} className={`flex items-center gap-2 ${textSecondary} hover:${textColor} transition-colors`} whileHover={{ x: -4 }}>
              <ChevronLeft className="w-5 h-5" /> Change Role
            </motion.button>
          </div>
          <div className="justify-self-center">
            {interviewState === 'running' && <div className={`text-2xl font-mono font-bold px-4 py-2 rounded-lg ${mode === 'dark' ? 'bg-black/20' : 'bg-white/20'}`}>{formatTime(timeLeft)}</div>}
          </div>
          <div className="justify-self-end"></div>
        </div>

        <div className="text-center mb-8">
          <h2 className={`text-3xl md:text-4xl font-bold mb-1 ${textColor}`}>{roleName} Interview</h2>
          <p className={`${textSecondary}`}>
            {interviewState === 'ended' ? "Interview complete. Here is your feedback." : "The AI will ask you questions and analyze your responses."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="lg:order-2">
            <FeedbackDisplay messages={chatHistory} feedback={finalFeedback} />
          </div>
          <div className="lg:order-1 flex flex-col gap-6">
            <GlassCard className="p-6 flex flex-col items-center justify-center">
              <h3 className={`text-lg font-semibold mb-4 ${textColor}`}>AI Interviewer</h3>
              <AIAvatar isListening={aiState === 'listening'} isSpeaking={aiState === 'speaking'} isThinking={aiState === 'thinking'} userVolume={userVolume} />
              <div className="mt-4 h-8 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div key={aiState} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-slate-500/20 text-slate-300`}>
                    {aiState.charAt(0).toUpperCase() + aiState.slice(1)}...
                  </motion.div>
                </AnimatePresence>
              </div>
            </GlassCard>
            <GlassCard className="p-6 flex flex-col items-center justify-center">
              <h3 className={`text-lg font-semibold mb-4 ${textColor}`}>Your Camera</h3>
              <div className="relative w-full aspect-video bg-black/30 rounded-lg overflow-hidden">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              </div>
              {interviewState === 'running' && (
                <div className="flex justify-center gap-4 mt-4">
                  <button onClick={toggleMic} className={`p-3 rounded-full transition-colors ${isMicOn ? 'bg-white/20' : 'bg-red-500/50'}`}>
                    <Mic className={`w-6 h-6 ${textColor}`} />
                  </button>
                  <button onClick={toggleCamera} className={`p-3 rounded-full transition-colors ${isCameraOn ? 'bg-white/20' : 'bg-red-500/50'}`}>
                    <Video className={`w-6 h-6 ${textColor}`} />
                  </button>
                </div>
              )}
            </GlassCard>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4">
          {interviewState !== 'running' ? (
            <motion.button 
              onClick={interviewState === 'idle' ? startInterview : resetInterviewState}
              disabled={isInitializing}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold text-lg shadow-lg flex items-center gap-2 disabled:opacity-50" 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}
            >
              {isInitializing ? <Loader2 className="w-5 h-5 animate-spin" /> : interviewState === 'idle' ? <Play className="w-5 h-5" /> : <X className="w-5 h-5" />}
              {isInitializing ? 'Starting...' : interviewState === 'idle' ? 'Start Interview' : 'Start Over'}
            </motion.button>
          ) : (
            <motion.button onClick={endInterview} className="px-8 py-3 rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold text-lg shadow-lg flex items-center gap-2" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Square className="w-5 h-5" /> End Interview
            </motion.button>
          )}
        </div>
      </GlassCard>
    </div>
  );
}