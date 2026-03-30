import React from 'react';
import { GameProvider } from './contexts/GameContext';
import { GameLayout } from './components/GameLayout';
import { LoadingScreen } from './components/LoadingScreen';
import { LoginView } from './components/LoginView';
import UnifiedAuthBanner from './components/UnifiedAuthBanner';
import { useUnifiedAuth } from './hooks/useUnifiedAuth';

const App = () => {
  const { user, loading, isFarcaster, farcasterContext, loginWithGoogle, loginAnonymously, logout } = useUnifiedAuth();
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingScreen />
        </div>
      ) : !user ? (
        <LoginView
          handleGoogleLogin={loginWithGoogle}
          handleFarcasterLogin={loginAnonymously}
          farcasterContext={farcasterContext}
        />
      ) : (
        <GameProvider user={user} farcasterContext={farcasterContext}>
          <GameLayout onLogout={logout} />
        </GameProvider>
      )}
    </div>
  );
};

export default App;
