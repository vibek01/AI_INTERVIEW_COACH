import { motion } from 'framer-motion';
import { Sparkles, Target, Brain, MoveUpRight } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { useTheme } from '../contexts/ThemeContext';

interface LandingPageProps {
  onStartInterview: () => void;
}

// A new component for a subtle glowing orb in the background
const GlowOrb = ({ className }: { className: string }) => {
  return (
    <motion.div
      className={`absolute rounded-full ${className}`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: [1, 1.2, 1, 1.5, 1],
        opacity: [0.1, 0.2, 0.1, 0.3, 0.1],
      }}
      transition={{
        duration: 15,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
};

export function LandingPage({ onStartInterview }: LandingPageProps) {
  const { mode } = useTheme();
  const textColor = mode === 'dark' ? 'text-slate-100' : 'text-slate-800';
  const textSecondary = mode === 'dark' ? 'text-slate-400' : 'text-slate-500';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 },
    },
  };

  return (
    // Flex container to center the card perfectly
    <div className="flex items-center justify-center min-h-screen p-4">
      
      {/* Added some decorative glowing orbs for more visual appeal */}
      <GlowOrb className="w-96 h-96 bg-cyan-500 -top-20 -left-20" />
      <GlowOrb className="w-[500px] h-[500px] bg-purple-500 -bottom-40 -right-20" />

      <GlassCard className="w-full max-w-5xl p-8 md:p-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          <motion.div
            variants={itemVariants}
            className="flex justify-center mb-4"
          >
            <div className="relative p-3 bg-cyan-400/20 rounded-full">
              <motion.div
                className="absolute inset-0 bg-cyan-400/50 rounded-full"
                animate={{
                  scale: [1, 1.3, 1],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <Brain className={`w-12 h-12 ${mode === 'dark' ? 'text-cyan-300' : 'text-blue-600'} relative`} />
            </div>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className={`text-4xl md:text-6xl font-bold mb-4 ${textColor}`}
          >
            AI Interview Coach
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className={`text-lg md:text-xl mb-8 ${textSecondary} max-w-3xl mx-auto`}
          >
            Practice real interviews with an AI that listens, speaks, and scores you. 
            Master your next interview with intelligent, personalized coaching.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-wrap justify-center gap-4 mb-12"
          >
            <motion.button
              onClick={onStartInterview}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold text-base shadow-lg flex items-center gap-2"
              whileHover={{ scale: 1.05, boxShadow: '0px 0px 20px rgba(59, 130, 246, 0.5)' }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="w-5 h-5" />
              Start Interview
            </motion.button>
            <motion.button
              className={`px-6 py-3 rounded-full ${mode === 'dark' ? 'bg-white/5' : 'bg-slate-900/5'} ${textColor} font-semibold text-base flex items-center gap-2`}
              whileHover={{ scale: 1.05, backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)'}}
              whileTap={{ scale: 0.95 }}
            >
              View Dashboard
            </motion.button>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              { icon: Brain, title: 'AI-Powered', desc: 'Advanced models simulate real HR interviews.' },
              { icon: Target, title: 'Targeted Practice', desc: 'Choose your role and get relevant questions.' },
              { icon: Sparkles, title: 'Instant Feedback', desc: 'Get scored and receive actionable insights.' },
            ].map((feature) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
              >
                <GlassCard hover className="p-6 h-full group">
                  <div className="flex justify-between items-start">
                    <feature.icon className={`w-8 h-8 mb-4 ${mode === 'dark' ? 'text-cyan-400' : 'text-blue-600'}`} />
                    <MoveUpRight className="w-5 h-5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 ${textColor}`}>{feature.title}</h3>
                  <p className={`${textSecondary} text-sm`}>{feature.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </GlassCard>
    </div>
  );
}