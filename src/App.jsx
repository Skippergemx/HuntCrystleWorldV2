import React from 'react';
import { GameProvider } from './contexts/GameContext';
import { GameLayout } from './components/GameLayout';
import { LoadingScreen } from './components/LoadingScreen';
import { LoginView } from './components/LoginView';
import UnifiedAuthBanner from './components/UnifiedAuthBanner';
import { NetworkAlert } from './components/NetworkAlert';
import { useUnifiedAuth } from './hooks/useUnifiedAuth';
import { useAccount } from 'wagmi';

const App = () => {
  const { user, loading, isFarcaster, isTelegram, farcasterContext, telegramUserData, loginWithGoogle, loginAnonymously, logout } = useUnifiedAuth();
  const { address, isConnected } = useAccount();

  // Unified login gate: user session OR connected wallet address
  const isAuthenticated = !!user || (isConnected && !!address);
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingScreen />
        </div>
      ) : !isAuthenticated ? (
        <LoginView
          handleGoogleLogin={loginWithGoogle}
          handleFarcasterLogin={loginAnonymously}
          farcasterContext={farcasterContext}
          isTelegram={isTelegram}
          telegramUserData={telegramUserData}
        />
      ) : (
        <GameProvider user={user} farcasterContext={farcasterContext}>
          <NetworkAlert />
          <GameLayout onLogout={logout} />
        </GameProvider>
      )}
    </div>
  );
};

export default App;
