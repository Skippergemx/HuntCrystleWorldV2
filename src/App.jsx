import React from 'react';
import { GameProvider } from './contexts/GameContext';
import { GameLayout } from './components/GameLayout';
import { LoadingScreen } from './components/LoadingScreen';
import { LoginView } from './components/LoginView';
import UnifiedAuthBanner from './components/UnifiedAuthBanner';
import { NetworkAlert } from './components/NetworkAlert';
import { useAppKit, useAppKitAccount, useDisconnect } from '@reown/appkit/react';
import { useUnifiedAuth } from './hooks/useUnifiedAuth';

const App = () => {
  const { user, loading, farcasterContext, loginWithGoogle, loginAnonymously, logout } = useUnifiedAuth();
  const { address, isConnected } = useAppKitAccount();
  const { disconnect } = useDisconnect();

  // Unified login gate: user session OR connected wallet address
  const isAuthenticated = !!user || (isConnected && address);

  const handleLogout = async () => {
    if (isConnected) {
      await disconnect();
    }
    await logout();
  };

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
        />
      ) : (
        <GameProvider user={user} farcasterContext={farcasterContext}>
          <NetworkAlert />
          <GameLayout onLogout={handleLogout} />
        </GameProvider>
      )}
    </div>
  );
};

export default App;
