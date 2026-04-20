import React from 'react';
import { GameProvider } from './contexts/GameContext';
import { GameLayout } from './components/GameLayout';
import { LoadingScreen } from './components/LoadingScreen';
import { LoginView } from './components/LoginView';
import { NetworkAlert } from './components/NetworkAlert';
import { useUnifiedAuth } from './hooks/useUnifiedAuth';

export const App = () => {
  const { user, loading, loginWithGoogle, logout } = useUnifiedAuth();

  // Google Auth is the single auth gate for the web version.
  const isAuthenticated = !!user;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingScreen />
        </div>
      ) : !isAuthenticated ? (
        <LoginView handleGoogleLogin={loginWithGoogle} />
      ) : (
        <GameProvider user={user}>
          <NetworkAlert />
          <GameLayout onLogout={logout} />
        </GameProvider>
      )}
    </div>
  );
};
