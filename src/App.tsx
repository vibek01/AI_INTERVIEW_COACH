import { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AnimatedBlob } from './components/AnimatedBlob';
import { ThemeToggle } from './components/ThemeToggle';
import { LandingPage } from './components/LandingPage';
import { RoleSelector } from './components/RoleSelector';
import { InterviewPanel } from './components/InterviewPanel';

type View = 'landing' | 'role-selector' | 'interview';

function App() {
  const [currentView, setCurrentView] = useState<View>('landing');
  const [selectedRole, setSelectedRole] = useState<string>('');

  const handleStartInterview = () => {
    setCurrentView('role-selector');
  };

  const handleSelectRole = (role: string) => {
    setSelectedRole(role);
    setCurrentView('interview');
  };

  const handleBackToRoleSelector = () => {
    setCurrentView('role-selector');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    setSelectedRole('');
  };

  return (
    <ThemeProvider>
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-500">
        <AnimatedBlob position="top-left" />
        <AnimatedBlob position="bottom-right" />

        <ThemeToggle />

        <div className="relative z-10">
          {currentView === 'landing' && (
            <LandingPage onStartInterview={handleStartInterview} />
          )}
          {currentView === 'role-selector' && (
            <RoleSelector
              onSelectRole={handleSelectRole}
              onBack={handleBackToLanding}
            />
          )}
          {currentView === 'interview' && (
            <InterviewPanel
              role={selectedRole}
              onBack={handleBackToRoleSelector}
            />
          )}
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
