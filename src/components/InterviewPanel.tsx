import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Square,
  X,
  ChevronLeft,
  BrainCircuit,
  MessageSquare,
  Loader2,
  AlertTriangle,
  Play,
} from "lucide-react";
import { GlassCard } from "./GlassCard";
import { AIAvatar } from "./AIAvatar";
import { useTheme } from "../contexts/ThemeContext";
import { useMicVolume } from "../hooks/useMicVolume";
import { ChatMessage, getAIResponse, speakText, unlockAudio } from "../services/aiService";

const cleanTextForSpeech = (text: string): string => {
  let cleaned = text.replace(/[\*#_`]/g, "");
  cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, "");
  return cleaned.trim();
};

const FeedbackDisplay = ({
  messages,
  feedback,
}: {
  messages: ChatMessage[];
  feedback: string;
}) => {
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
      <div
        ref={scrollRef}
        className="flex-grow overflow-y-auto pr-2 text-sm text-slate-300 space-y-4"
      >
        {messages.slice(1).map((msg, index) => (
          <div
            key={index}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`px-3 py-2 rounded-lg max-w-[85%] ${
                msg.role === "user" ? "bg-blue-600/50" : "bg-slate-700/50"
              }`}
            >
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
        {feedback && (
          <div className="mt-4 p-3 bg-slate-800/60 rounded-lg border border-slate-600">
            <h4 className="font-bold text-slate-100 mb-2 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-cyan-400" />
              Final Feedback
            </h4>
            <p className="whitespace-pre-wrap">{feedback}</p>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export function InterviewPanel({
  role,
  onBack,
}: {
  role: string;
  onBack: () => void;
}) {
  const { mode } = useTheme();
  const textColor = mode === "dark" ? "text-slate-100" : "text-slate-800";
  const textSecondary = mode === "dark" ? "text-slate-400" : "text-slate-500";

  const [interviewState, setInterviewState] = useState<"idle" | "running" | "ended">("idle");
  const [aiState, setAIState] = useState<"idle" | "speaking" | "listening" | "thinking">("idle");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [finalFeedback, setFinalFeedback] = useState("");
  const [timeLeft, setTimeLeft] = useState(300);
  const [isInitializing, setIsInitializing] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const userVolume = useMicVolume(micStream);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const interviewTimerRef = useRef<number | null>(null);

  const roleName = role.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const cleanup = useCallback(() => {
    if (interviewTimerRef.current) clearInterval(interviewTimerRef.current);
    recognitionRef.current?.stop();
    micStream?.getTracks().forEach((t) => t.stop());
    setMicStream(null);
  }, [micStream]);

  const resetInterviewState = useCallback(() => {
    cleanup();
    setChatHistory([]);
    setFinalFeedback("");
    setTimeLeft(300);
    setAIState("idle");
    setInterviewState("idle");
    setPermissionError(null);
  }, [cleanup]);

  useEffect(() => {
    if (videoRef.current && micStream) {
      videoRef.current.srcObject = micStream;
    }
  }, [micStream]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && interviewState === "running") {
      try {
        setAIState("listening");
        recognitionRef.current.start();
      } catch (err) {
        console.warn("SpeechRecognition could not start.", err);
      }
    }
  }, [interviewState]);

  // This effect sets up the SpeechRecognition object once.
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setPermissionError("Speech Recognition API is not supported by this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const userText = event.results[0][0].transcript;
      // Use functional state update to ensure we have the latest chat history
      setChatHistory((prev) => [...prev, { role: "user", content: userText }]);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
    };

    // ✨ FIX #1: THE 'onend' HANDLER IS NOW PASSIVE.
    // It no longer tries to restart listening. This is the change that KILLS the "ding ding" loop.
    recognition.onend = () => {
      // We set the state to idle only if it was previously listening.
      // This prevents it from overriding the "thinking" or "speaking" states.
      setAIState((currentState) => (currentState === "listening" ? "idle" : currentState));
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  // This effect handles the AI's response logic.
  useEffect(() => {
    const processAIResponse = async () => {
      if (chatHistory.length === 0 || chatHistory[chatHistory.length - 1].role !== "user") {
        return;
      }

      setAIState("thinking");
      const aiText = await getAIResponse(chatHistory);
      const clean = cleanTextForSpeech(aiText);
      setChatHistory((p) => [...p, { role: "assistant", content: aiText }]);

      try {
        const audioUrl = await speakText(clean);
        if (audioPlayerRef.current) {
          audioPlayerRef.current.src = audioUrl;
          audioPlayerRef.current.play();
          setAIState("speaking");
        }
      } catch (err) {
        console.error("Speech synthesis failed:", err);
        // If speaking fails, go back to a neutral state.
        setAIState("idle");
      }
    };
    processAIResponse();
  }, [chatHistory]);

  // ✨ FIX #2: THIS IS NOW THE *ONLY* PLACE LISTENING IS TRIGGERED.
  // This function is called only when the AI's audio finishes playing.
  const handleAudioEnded = () => {
    if (interviewState === "running") {
      startListening();
    } else {
      setAIState("idle");
    }
  };

  const startInterview = async () => {
    unlockAudio(); // Crucial for mobile
    setIsInitializing(true);
    resetInterviewState();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      setMicStream(stream);
      setInterviewState("running");

      interviewTimerRef.current = window.setInterval(
        () => setTimeLeft((t) => (t > 0 ? t - 1 : 0)),
        1000
      );

      const prompt = `You are an expert HR interviewer for a ${roleName} role. Ask one question at a time, be concise and professional.`;
      const intro = `Hello, and welcome. We're interviewing for the ${roleName} role. Could you tell me a bit about your relevant experience?`;

      setChatHistory([
        { role: "system", content: prompt },
        { role: "assistant", content: intro },
      ]);

      const audioUrl = await speakText(cleanTextForSpeech(intro));
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = audioUrl;
        audioPlayerRef.current.play();
        setAIState("speaking");
      }
       // ✨ FIX #3: We DO NOT call startListening() here.
       // The loop will begin naturally when the intro audio finishes via `handleAudioEnded`.
    } catch (err: any) {
      console.error("Failed to start interview:", err);
      setPermissionError("Please allow camera and microphone permissions to start.");
      resetInterviewState();
    } finally {
      setIsInitializing(false);
    }
  };

  const endInterview = useCallback(async () => {
    if (interviewState !== "running") return;

    setInterviewState("ended");
    setAIState("thinking");
    cleanup();

    const finalPrompt: ChatMessage = {
      role: "user",
      content: "The interview is over. Please provide detailed feedback, a score out of 10, and suggestions for improvement.",
    };
    const feedback = await getAIResponse([...chatHistory, finalPrompt]);
    setFinalFeedback(feedback);
    setAIState("idle");
  }, [chatHistory, interviewState, cleanup]);
  
  useEffect(() => {
    if (timeLeft === 0 && interviewState === 'running') {
      endInterview();
    }
  }, [timeLeft, interviewState, endInterview]);

  const formatTime = (sec: number) =>
    `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <audio ref={audioPlayerRef} onEnded={handleAudioEnded} />
      <GlassCard className="w-full max-w-6xl p-6 md:p-8">
        {/* Header */}
        <div className="grid grid-cols-3 items-center mb-6">
          <div className="justify-self-start">
            <motion.button
              onClick={onBack}
              className={`flex items-center gap-2 ${textSecondary}`}
              whileHover={{ x: -4 }}
            >
              <ChevronLeft className="w-5 h-5" /> Change Role
            </motion.button>
          </div>
          <div className="justify-self-center">
            {interviewState === "running" && (
              <div
                className={`text-2xl font-mono font-bold px-4 py-2 rounded-lg ${
                  mode === "dark" ? "bg-black/20" : "bg-white/20"
                }`}
              >
                {formatTime(timeLeft)}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="text-center mb-8">
          <h2
            className={`text-3xl md:text-4xl font-bold mb-1 ${textColor}`}
          >{`${roleName} Interview`}</h2>
          <p className={textSecondary}>
            {interviewState === "ended"
              ? "Interview complete. Here is your feedback."
              : "The AI will ask you questions and analyze your responses."}
          </p>
        </div>

        {permissionError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-500/30 text-red-300 p-4 rounded-lg mb-6 flex items-center gap-3"
          >
            <AlertTriangle className="w-6 h-6" />
            <p>{permissionError}</p>
          </motion.div>
        )}

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="lg:order-2">
            <FeedbackDisplay messages={chatHistory} feedback={finalFeedback} />
          </div>

          <div className="lg:order-1 flex flex-col gap-6">
            {/* AI Avatar */}
            <GlassCard className="p-6 flex flex-col items-center justify-center">
              <h3 className={`text-lg font-semibold mb-4 ${textColor}`}>
                AI Interviewer
              </h3>
              <AIAvatar
                isListening={aiState === "listening"}
                isSpeaking={aiState === "speaking"}
                isThinking={aiState === "thinking"}
                userVolume={userVolume}
              />
              <div className="mt-4 h-8 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={aiState}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-slate-500/20 text-slate-300"
                  >
                    {aiState.charAt(0).toUpperCase() + aiState.slice(1)}
                    {aiState !== "idle" && "..."}
                  </motion.div>
                </AnimatePresence>
              </div>
            </GlassCard>

            {/* Camera */}
            <GlassCard className="p-6 flex flex-col items-center justify-center">
              <h3 className={`text-lg font-semibold mb-4 ${textColor}`}>
                Your Camera
              </h3>
              <div className="relative w-full aspect-video bg-black/30 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap justify-center gap-4">
          {interviewState !== "running" ? (
            <motion.button
              onClick={interviewState === "idle" ? startInterview : resetInterviewState}
              disabled={isInitializing}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold text-lg shadow-lg flex items-center gap-2 disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              {isInitializing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : interviewState === "idle" ? (
                <Play className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}
              {isInitializing ? "Starting..." : interviewState === "idle" ? "Start Interview" : "Start Over"}
            </motion.button>
          ) : (
            <motion.button
              onClick={endInterview}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold text-lg shadow-lg flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Square className="w-5 h-5" /> End Interview
            </motion.button>
          )}
        </div>
      </GlassCard>
    </div>
  );
}