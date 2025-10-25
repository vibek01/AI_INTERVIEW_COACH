import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

interface AnimatedBlobProps {
  position: 'top-left' | 'bottom-right';
  size?: string;
}

export function AnimatedBlob({ position, size = '600px' }: AnimatedBlobProps) {
  const { mode } = useTheme();

  const gradient = position === 'top-left'
    ? mode === 'dark'
      ? 'from-blue-600 via-cyan-600 to-blue-700'
      : 'from-blue-400 via-cyan-400 to-blue-500'
    : mode === 'dark'
      ? 'from-violet-600 via-purple-600 to-indigo-700'
      : 'from-violet-400 via-purple-400 to-indigo-500';

  const positionClasses = position === 'top-left'
    ? '-top-48 -left-48'
    : '-bottom-48 -right-48';

  return (
    <motion.div
      className={`absolute ${positionClasses} rounded-full bg-gradient-to-br ${gradient} opacity-40 blur-3xl will-change-transform`}
      style={{ width: size, height: size }}
      animate={{
        scale: [1, 1.2, 1],
        x: [0, 30, 0],
        y: [0, -30, 0],
        rotate: [0, 90, 0],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}
