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

      {/* OpenAds Network (Zero-JS Integration) */}
      <link rel="stylesheet" href="https://api.openads.world/api/v1/serve/dynamic-css?publisher=0xdfde5b79d5f53e9d13948e1bb7e1cb3e89fc8786" />
      <iframe className="openads-floating" src="https://api.openads.world/serve?publisher=0xdfde5b79d5f53e9d13948e1bb7e1cb3e89fc8786&placement=64x64-0xdfde5b79d5f53e9d13948e1bb7e1cb3e89fc8786&position=floating&parent_url=https%3A%2F%2Fmetaverse.dungeonswithgems.quest%2F&app_id=f87d7e04-7be5-4fff-a5f5-ad1e5976574b" title="Advertisement" width="64" height="64" style={{position:'fixed', top:'20px', right:'20px', width:'64px', height:'64px', border:'none', borderRadius:'50%', zIndex:999999}} frameBorder="0" scrolling="no" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" allow="clipboard-write"></iframe>
      <iframe className="openads-top-banner" src="https://api.openads.world/serve?publisher=0xdfde5b79d5f53e9d13948e1bb7e1cb3e89fc8786&placement=320x50_top-0xdfde5b79d5f53e9d13948e1bb7e1cb3e89fc8786&position=top&parent_url=https%3A%2F%2Fmetaverse.dungeonswithgems.quest%2F&app_id=f87d7e04-7be5-4fff-a5f5-ad1e5976574b" title="Advertisement" width="320" height="50" style={{border:'none'}} frameBorder="0" scrolling="no" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" allow="clipboard-write"></iframe>
      <iframe className="openads-banner" src="https://api.openads.world/serve?publisher=0xdfde5b79d5f53e9d13948e1bb7e1cb3e89fc8786&placement=320x50-0xdfde5b79d5f53e9d13948e1bb7e1cb3e89fc8786&position=bottom&parent_url=https%3A%2F%2Fmetaverse.dungeonswithgems.quest%2F&app_id=f87d7e04-7be5-4fff-a5f5-ad1e5976574b" title="Advertisement" width="320" height="50" style={{border:'none'}} frameBorder="0" scrolling="no" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" allow="clipboard-write"></iframe>
    </div>
  );
};
