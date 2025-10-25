import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, VideoOff, Mic, MicOff, Play, Square, X, ChevronLeft } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { AIAvatar } from './AIAvatar';
import { useTheme } from '../contexts/ThemeContext';

interface InterviewPanelProps {
  role: string;
  onBack: () => void;
}

export function InterviewPanel({ role, onBack }: InterviewPanelProps) {
  const { mode } = useTheme();
  const textColor = mode === 'dark' ? 'text-slate-100' : 'text-slate-800';
  const textSecondary = mode === 'dark' ? 'text-slate-400' : 'text-slate-500';

  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isAIListening, setIsAIListening] = useState(false);
  const [timer, setTimer] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  const roleName = role.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  // Cleanup effect for camera and timer on component unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleCamera = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setIsCameraOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraOn(true);
      } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Could not access the camera. Please check permissions and try again.");
      }
    }
  };

  const toggleMic = () => setIsMicOn(prev => !prev);

  // *** FINAL TIMER FIX ***
  // Logic is now self-contained in start/end functions for reliability.
  const startInterview = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); // Clear any old timers first
    setTimer(0);
    setIsInterviewStarted(true);
    timerIntervalRef.current = window.setInterval(() => {
      setTimer(prevTimer => prevTimer + 1);
    }, 1000);
    
    setIsAISpeaking(true);
    setTimeout(() => {
      setIsAISpeaking(false);
      setIsAIListening(true);
    }, 4000);
  };

  const endInterview = () => {
    setIsInterviewStarted(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
    setIsAISpeaking(false);
    setIsAIListening(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <GlassCard className="w-full max-w-6xl p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="grid grid-cols-3 items-center mb-6">
            <div className="justify-self-start">
              <motion.button
                onClick={onBack}
                className={`flex items-center gap-2 ${textSecondary} hover:${textColor} transition-colors`}
                whileHover={{ x: -4, transition: { type: 'spring', stiffness: 400 } }}
              >
                <ChevronLeft className="w-5 h-5" />
                Change Role
              </motion.button>
            </div>
            
            <div className="justify-self-center">
              <AnimatePresence>
                {isInterviewStarted && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`text-2xl font-mono font-bold px-4 py-2 rounded-lg ${mode === 'dark' ? 'bg-black/20' : 'bg-white/20'}`}
                  >
                    {formatTime(timer)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="justify-self-end"></div>
          </div>

          <div className="text-center mb-8">
            <h2 className={`text-3xl md:text-4xl font-bold mb-1 ${textColor}`}>
              {roleName} Interview
            </h2>
            <p className={`${textSecondary}`}>
              {isInterviewStarted ? "The interview is now in progress." : "Prepare yourself and start when you're ready."}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <GlassCard className="p-6 flex flex-col items-center justify-center">
              <h3 className={`text-lg font-semibold mb-4 ${textColor}`}>AI Interviewer</h3>
              <AIAvatar isListening={isAIListening} isSpeaking={isAISpeaking} />
              <div className="mt-4 h-8 flex items-center justify-center">
                 <AnimatePresence mode="wait">
                    <motion.div
                      key={isAISpeaking ? 'speaking' : isAIListening ? 'listening' : 'idle'}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium ${
                        isAISpeaking ? 'bg-green-500/20 text-green-300' :
                        isAIListening ? 'bg-blue-500/20 text-blue-300' :
                        'bg-slate-500/20 text-slate-400'
                      }`}
                    >
                      {isAISpeaking ? 'Speaking...' : isAIListening ? 'Listening...' : 'Idle'}
                    </motion.div>
                 </AnimatePresence>
              </div>
            </GlassCard>

            <GlassCard className="p-6 flex flex-col items-center justify-center">
              <h3 className={`text-lg font-semibold mb-4 ${textColor}`}>Your Camera</h3>
              <div className="relative w-full aspect-video bg-black/30 rounded-lg overflow-hidden flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-opacity ${isCameraOn ? 'opacity-100' : 'opacity-0'}`} />
                <AnimatePresence>
                {!isCameraOn && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500"
                  >
                    <VideoOff className="w-12 h-12" />
                    <span className="font-medium">Camera is off</span>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                {[
                  { Icon: isCameraOn ? Video : VideoOff, action: toggleCamera, active: isCameraOn, label: 'Camera' },
                  { Icon: isMicOn ? Mic : MicOff, action: toggleMic, active: isMicOn, label: 'Microphone' }
                ].map(({ Icon, action, active, label }) => (
                  <motion.button
                    key={label}
                    onClick={action}
                    className={`p-3 rounded-full border transition-colors ${active ? 'bg-blue-500 text-white border-transparent shadow-lg shadow-blue-500/50' : 'bg-white/5 border-white/10 text-slate-400'}`}
                    whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.button>
                ))}
              </div>
            </GlassCard>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <AnimatePresence mode="wait">
            {!isInterviewStarted ? (
              <motion.button
                key="start"
                onClick={startInterview}
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold text-lg shadow-lg flex items-center gap-2"
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)' }} whileTap={{ scale: 0.98 }}
              >
                <Play className="w-5 h-5" />
                Start Interview
              </motion.button>
            ) : (
              <motion.div key="controls" className="flex flex-wrap justify-center gap-4"
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              >
                <motion.button
                  onClick={endInterview}
                  className="px-8 py-3 rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold text-lg shadow-lg flex items-center gap-2"
                  whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)' }} whileTap={{ scale: 0.98 }}
                >
                  <Square className="w-5 h-5" />
                  End Interview
                </motion.button>
                <motion.button
                  onClick={onBack}
                  className={`px-8 py-3 rounded-full ${mode === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-900/5 hover:bg-slate-900/10'} ${textColor} font-semibold text-lg backdrop-blur-sm border ${mode === 'dark' ? 'border-white/20' : 'border-slate-900/20'} flex items-center gap-2`}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}
                >
                  <X className="w-5 h-5" />
                  Exit
                </motion.button>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </motion.div>
      </GlassCard>
    </div>
  );
}