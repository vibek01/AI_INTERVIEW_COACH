// src/components/InterviewPanel.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Square, X, ChevronLeft, BrainCircuit, MessageSquare, Loader2, AlertTriangle, Play
} from "lucide-react";
import { GlassCard } from "./GlassCard";
import { AIAvatar } from "./AIAvatar";
import { useTheme } from "../contexts/ThemeContext";
import { useMicVolume } from "../hooks/useMicVolume";
import { ChatMessage, getAIResponse, speakText, unlockAudio } from "../services/aiService";
// Import our new custom hooks
import { useUserMedia } from "../hooks/useUserMedia";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

// --- (FeedbackDisplay Component remains the same) ---
const cleanTextForSpeech = (text: string): string => {
  let cleaned = text.replace(/[\*#_`]/g, "");
  cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, "");
  return cleaned.trim();
};

const FeedbackDisplay = ({ messages, feedback }: { messages: ChatMessage[]; feedback: string; }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
  	if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, feedback]);
  return (
  	<GlassCard className="p-4 h-full flex flex-col">
  	  <div className="flex items-center gap-2 mb-3 text-slate-300"><MessageSquare className="w-5 h-5" /><h3 className="font-semibold">Transcript & Feedback</h3></div>
  	  <div ref={scrollRef} className="flex-grow overflow-y-auto pr-2 text-sm text-slate-300 space-y-4">
  		{messages.slice(1).map((msg, index) => (
  		  <div key={index} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
  			<div className={`px-3 py-2 rounded-lg max-w-[85%] ${msg.role === "user" ? "bg-blue-600/50" : "bg-slate-700/50"}`}><p>{msg.content}</p></div>
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
// --- (Main InterviewPanel Component) ---
export function InterviewPanel({ role, onBack }: { role: string; onBack: () => void; }) {
  const { mode } = useTheme();
  const textColor = mode === "dark" ? "text-slate-100" : "text-slate-800";
  const textSecondary = mode === "dark" ? "text-slate-400" : "text-slate-500";
  
  const [interviewState, setInterviewState] = useState<"idle" | "running" | "ended">("idle");
  const [aiState, setAIState] = useState<"idle" | "speaking" | "listening" | "thinking">("idle");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [finalFeedback, setFinalFeedback] = useState("");
  const [timeLeft, setTimeLeft] = useState(300);
  const [isInitializing, setIsInitializing] = useState(false);
  
  // Use our clean, isolated hooks
  const { stream: micStream, error: mediaError, startMedia, stopMedia } = useUserMedia();
  const { transcript, startListening, isListening, error: speechError } = useSpeechRecognition();
  
  // This will now receive a stream with NO audio track. userVolume will be 0. This is correct.
  const userVolume = useMicVolume(micStream);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const interviewTimerRef = useRef<number | null>(null);

  const roleName = role.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  // Effect to handle new speech transcript
  useEffect(() => {
  	if (transcript) {
  	  setChatHistory(prev => [...prev, { role: "user", content: transcript }]);
  	}
  }, [transcript]);

  // Effect to handle AI response when chat history changes
  useEffect(() => {
  	const processAIResponse = async () => {
  	  if (chatHistory.length === 0 || chatHistory[chatHistory.length - 1].role !== "user") {
  		return;
  	  }
  	  setAIState("thinking");
  	  const aiText = await getAIResponse(chatHistory);
  	  const clean = cleanTextForSpeech(aiText);
  	  setChatHistory(p => [...p, { role: "assistant", content: aiText }]);
  	  try {
  		const audioUrl = await speakText(clean);
  		if (audioPlayerRef.current) {
  		  audioPlayerRef.current.src = audioUrl;
  		  audioPlayerRef.current.play();
  		  setAIState("speaking");
  		}
  	  } catch (err) {
  		console.error("Speech synthesis failed:", err);
  		setAIState("idle");
  	  }
  	};
  	processAIResponse();
  }, [chatHistory]);
  
  // Effect to manage camera feed
  useEffect(() => {
  	if (videoRef.current && micStream) {
  	  videoRef.current.srcObject = micStream;
  	}
  }, [micStream]);
  
  // ✨ FIX: This effect is now much simpler.
  // It only updates the 'aiState' and no longer tries to manage the mic track.
  useEffect(() => {
  	if (isListening) {
  	  setAIState("listening");
  	} else if (aiState === 'listening') {
  	  // If the hook stops listening, revert to idle
  	  setAIState('idle');
  	}
  }, [isListening, aiState]); // Removed micStream from dependencies


  // ✨ FIX: This function is now simpler.
  // We removed the mic-disabling logic because there is no conflict anymore.
  const handleAudioEnded = async () => {
  	try {
  		unlockAudio(); // re-activate audio context (important for mobile)
  		await new Promise(res => setTimeout(res, 300)); // wait before restarting mic
  		if (interviewState === "running") {
  		  startListening();
  		}
  	} catch (err) {
  		console.warn("Failed to restart mic:", err);
  	}
  };


  const startInterview = async () => {
  	unlockAudio();
  	setIsInitializing(true);
  	setChatHistory([]);
  	setFinalFeedback("");
  	setTimeLeft(300);

  	// This now only requests video, so no mic conflict.
  	const mediaStream = await startMedia();
  	if (!mediaStream) {
  	  setIsInitializing(false);
  	  return; // Stop if permissions are denied
  	}

  	setInterviewState("running");
  	interviewTimerRef.current = window.setInterval(() => setTimeLeft(t => t > 0 ? t - 1 : 0), 1000);

  	const prompt = `You are an expert HR interviewer for a ${roleName} role. Ask one question at a time, be concise and professional.`;
  	const intro = `Hello, and welcome. We're interviewing for the ${roleName} role. Could you tell me a bit about your relevant experience?`;
  	setChatHistory([{ role: "system", content: prompt }, { role: "assistant", content: intro }]);

  	try {
  		const audioUrl = await speakText(cleanTextForSpeech(intro));
  		if (audioPlayerRef.current) {
  		  audioPlayerRef.current.src = audioUrl;
  		  audioPlayerRef.current.play();
  		  setAIState("speaking");
  		}
  	} catch(err) {
  		console.error(err);
  	} finally {
  		setIsInitializing(false);
  	}
  };

  const endInterview = useCallback(async () => {
  	if (interviewState !== "running") return;
  	setInterviewState("ended");
  	setAIState("thinking");
  	if (interviewTimerRef.current) clearInterval(interviewTimerRef.current);
  	stopMedia();

  	const finalPrompt: ChatMessage = { role: "user", content: "The interview is over. Please provide detailed feedback, a score out of 10, and suggestions for improvement." };
  	const feedback = await getAIResponse([...chatHistory, finalPrompt]);
  	setFinalFeedback(feedback);
  	setAIState("idle");
  }, [chatHistory, interviewState, stopMedia]); // Removed micStream dependency

  const resetInterview = () => {
  	if (interviewTimerRef.current) clearInterval(interviewTimerRef.current);
  	stopMedia();
  	
  	setInterviewState("idle");
  	setAIState("idle");
  	setChatHistory([]);
  	setFinalFeedback("");
  	setTimeLeft(300);
  };

  const formatTime = (sec: number) => `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}`;

return (
  	<div className="flex items-center justify-center min-h-screen p-4">
  	  <audio ref={audioPlayerRef} onEnded={handleAudioEnded} />
  	  <GlassCard className="w-full max-w-6xl p-6 md:p-8">
  		{/* Header and Description */}
  		<div className="grid grid-cols-3 items-center mb-6"><div className="justify-self-start"><motion.button onClick={onBack} className={`flex items-center gap-2 ${textSecondary}`} whileHover={{ x: -4 }}><ChevronLeft className="w-5 h-5" /> Change Role</motion.button></div><div className="justify-self-center">{interviewState === "running" && (<div className={`text-2xl font-mono font-bold px-4 py-2 rounded-lg ${mode === "dark" ? "bg-black/20" : "bg-white/20"}`}>{formatTime(timeLeft)}</div>)}</div></div>
  		<div className="text-center mb-8"><h2 className={`text-3xl md:text-4xl font-bold mb-1 ${textColor}`}>{`${roleName} Interview`}</h2><p className={textSecondary}>{interviewState === "ended" ? "Interview complete. Here is your feedback." : "The AI will ask you questions and analyze your responses."}</p></div>
s
  		{/* Error Display */}
  		{(mediaError || speechError) && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/20 border border-red-500/30 text-red-300 p-4 rounded-lg mb-6 flex items-center gap-3"><AlertTriangle className="w-6 h-6" /><p>{mediaError || speechError}</p></motion.div>}
s 
  		{/* Body */}
  		<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
  		  <div className="lg:order-2"><FeedbackDisplay messages={chatHistory} feedback={finalFeedback} /></div>
  		  <div className="lg:order-1 flex flex-col gap-6">
  			<GlassCard className="p-6 flex flex-col items-center justify-center">
  			  <h3 className={`text-lg font-semibold mb-4 ${textColor}`}>AI Interviewer</h3>
  			  <AIAvatar isListening={aiState === "listening"} isSpeaking={aiState === "speaking"} isThinking={aiState === "thinking"} userVolume={userVolume} />
s 			  <div className="mt-4 h-8 flex items-center justify-center"><AnimatePresence mode="wait"><motion.div key={aiState} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-slate-500/20 text-slate-300">{aiState.charAt(0).toUpperCase() + aiState.slice(1)}{aiState !== 'idle' && '...'}</motion.div></AnimatePresence></div>
  			</GlassCard>
  			<GlassCard className="p-6 flex flex-col items-center justify-center">
  			  <h3 className={`text-lg font-semibold mb-4 ${textColor}`}>Your Camera</h3>
  			  <div className="relative w-full aspect-video bg-black/30 rounded-lg overflow-hidden"><video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" /></div>
  			</GlassCard>
  		  </div>
  		</div>

  		{/* Controls */}
  		<div className="flex flex-wrap justify-center gap-4">
  		  {interviewState !== "running" ? (
  			<motion.button onClick={interviewState === "idle" ? startInterview : resetInterview} disabled={isInitializing} className="px-8 py-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold text-lg shadow-lg flex items-center gap-2 disabled:opacity-50" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>{isInitializing ? <Loader2 className="w-5 h-5 animate-spin" /> : interviewState === "idle" ? <Play className="w-5 h-5" /> : <X className="w-5 h-5" />}{isInitializing ? "Starting..." : interviewState === "idle" ? "Start Interview" : "Start Over"}</motion.button>
  		  ) : (
  			<motion.button onClick={endInterview} className="px-8 py-3 rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold text-lg shadow-lg flex items-center gap-2" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}><Square className="w-5 h-5" /> End Interview</motion.button>
  		  )}
  		</div>
  	  </GlassCard>
  	</div>
  );
}