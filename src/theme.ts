export const theme = {
  light: {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    accent: '#06B6D4',
    background: '#F8FAFC',
    blobGradient1: 'from-blue-400 via-cyan-400 to-blue-500',
    blobGradient2: 'from-violet-400 via-purple-400 to-indigo-500',
    glass: 'rgba(255, 255, 255, 0.1)',
    glassBorder: 'rgba(255, 255, 255, 0.2)',
    text: '#1E293B',
    textSecondary: '#475569',
    glowColor: 'rgba(59, 130, 246, 0.3)',
  },
  dark: {
    primary: '#60A5FA',
    secondary: '#A78BFA',
    accent: '#22D3EE',
    background: '#0F172A',
    blobGradient1: 'from-blue-600 via-cyan-600 to-blue-700',
    blobGradient2: 'from-violet-600 via-purple-600 to-indigo-700',
    glass: 'rgba(15, 23, 42, 0.4)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
    glowColor: 'rgba(96, 165, 250, 0.2)',
  },
};

export type Theme = typeof theme.light;
