import { useState } from 'react';

import { LoginScreen } from './LoginScreen';
import { SignUpScreen } from './SignUpScreen';

interface AuthFlowProps {
  onAuthenticated: (username: string) => void;
}

export function AuthFlow({ onAuthenticated }: AuthFlowProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  if (mode === 'signup') {
    return (
      <SignUpScreen onRegistered={onAuthenticated} onNavigateToLogin={() => setMode('login')} />
    );
  }

  return <LoginScreen onAuthenticated={onAuthenticated} onNavigateToSignUp={() => setMode('signup')} />;
}
