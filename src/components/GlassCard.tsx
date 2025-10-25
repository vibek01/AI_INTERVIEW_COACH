import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className = '', hover = false }: GlassCardProps) {
  const { mode } = useTheme();

  // Enhanced glassmorphism values
  const bgColor = mode === 'dark'
    ? 'bg-black/20' // More transparency
    : 'bg-white/30';

  const borderColor = mode === 'dark'
    ? 'border-white/10'
    : 'border-white/20';

  return (
    <motion.div
      // Increased blur, added subtle shadow
      className={`backdrop-blur-2xl rounded-2xl border ${borderColor} shadow-lg ${bgColor} ${className}`}
      whileHover={hover ? { scale: 1.03, y: -5 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}