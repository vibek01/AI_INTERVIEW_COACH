import { motion } from 'framer-motion';
import { Code, Globe, Database, Briefcase, ChevronLeft, ArrowRight } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { useTheme } from '../contexts/ThemeContext';

interface RoleSelectorProps {
  onSelectRole: (role: string) => void;
  onBack: () => void;
}

const roles = [
  { id: 'ai-engineer', name: 'AI Engineer', icon: Code, color: 'from-blue-500 to-cyan-500', shadow: 'shadow-cyan-500/50' },
  { id: 'web-developer', name: 'Web Developer', icon: Globe, color: 'from-green-500 to-emerald-500', shadow: 'shadow-emerald-500/50' },
  { id: 'data-scientist', name: 'Data Scientist', icon: Database, color: 'from-purple-500 to-pink-500', shadow: 'shadow-pink-500/50' },
  { id: 'product-manager', name: 'Product Manager', icon: Briefcase, color: 'from-orange-500 to-red-500', shadow: 'shadow-red-500/50' },
];

export function RoleSelector({ onSelectRole, onBack }: RoleSelectorProps) {
  const { mode } = useTheme();
  const textColor = mode === 'dark' ? 'text-slate-100' : 'text-slate-800';
  const textSecondary = mode === 'dark' ? 'text-slate-400' : 'text-slate-500';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
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
    <div className="flex items-center justify-center min-h-screen p-4">
      <GlassCard className="max-w-4xl w-full p-8 md:p-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.button
            onClick={onBack}
            className={`flex items-center gap-2 mb-8 ${textSecondary} hover:${textColor} transition-colors`}
            whileHover={{ x: -4, transition: { type: 'spring', stiffness: 400 } }}
            variants={itemVariants}
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Home
          </motion.button>

          <motion.h2
            variants={itemVariants}
            className={`text-3xl md:text-5xl font-bold mb-3 ${textColor} text-center`}
          >
            Choose Your Role
          </motion.h2>

          <motion.p
            variants={itemVariants}
            className={`${textSecondary} text-md md:text-lg mb-10 text-center max-w-2xl mx-auto`}
          >
            Select the position you want to practice for. Our AI will tailor the interview questions accordingly.
          </motion.p>

          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {roles.map((role) => (
              <motion.div
                key={role.id}
                variants={itemVariants}
                whileHover={{ y: -8, transition: { type: 'spring', stiffness: 300 } }}
              >
                <GlassCard
                  className="h-full group overflow-hidden"
                  hover // Disable GlassCard's internal hover to use the parent's
                >
                  <button
                    onClick={() => onSelectRole(role.id)}
                    className="w-full p-6 text-left relative"
                  >
                    {/* Add a decorative glow element on hover */}
                    <motion.div
                      className={`absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br ${role.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-full blur-3xl`}
                    />
                    
                    <div className="flex items-center gap-5">
                      <motion.div
                        className={`p-3 rounded-xl bg-gradient-to-br ${role.color} shadow-lg ${role.shadow}`}
                      >
                        <role.icon className="w-8 h-8 text-white" />
                      </motion.div>
                      <div className="flex-1">
                        <h3 className={`text-xl font-semibold ${textColor}`}>
                          {role.name}
                        </h3>
                        <p className={`${textSecondary} text-sm`}>
                          Technical & behavioral questions.
                        </p>
                      </div>
                       <ArrowRight className="w-6 h-6 text-slate-500 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300" />
                    </div>
                  </button>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </GlassCard>
    </div>
  );
}