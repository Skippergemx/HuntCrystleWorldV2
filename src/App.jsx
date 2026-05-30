import React from 'react';
import { GameProvider } from './contexts/GameContext';
import { GameEntry } from './components/GameEntry';
import { LoadingScreen } from './components/LoadingScreen';
import { LoginView } from './components/LoginView';
import { NetworkAlert } from './components/NetworkAlert';
import { useUnifiedAuth } from './hooks/useUnifiedAuth';

// Dedicated component to isolate Ad lifecycle and prevent DOM sync errors
const AdContainer = React.memo(({ loading }) => {
  if (loading) return null;
  
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const publisher = "0xdfde5b79d5f53e9d13948e1bb7e1cb3e89fc8786";
  const appId = "f87d7e04-7be5-4fff-a5f5-ad1e5976574b";

  return (
    <div id="ad-bridge-container">
      <link 
        rel="stylesheet" 
        href={`https://api.openads.world/api/v1/serve/dynamic-css?publisher=${publisher}&parent_url=${encodeURIComponent(origin)}`} 
      />
      <iframe 
        key="ad-float"
        className="openads-floating" 
        src={`https://api.openads.world/serve?publisher=${publisher}&placement=64x64-${publisher}&position=floating&parent_url=${encodeURIComponent(origin)}&app_id=${appId}`} 
        title="Advertisement" 
        width="64" height="64" 
        style={{display:'none', position:'fixed', top:'20px', right:'20px', width:'64px', height:'64px', border:'none', borderRadius:'50%', zIndex:999999}} 
        frameBorder="0" scrolling="no" 
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" 
        allow="clipboard-write"
      />
      <iframe 
        key="ad-top"
        className="openads-top-banner" 
        src={`https://api.openads.world/serve?publisher=${publisher}&placement=320x50_top-${publisher}&position=top&parent_url=${encodeURIComponent(origin)}&app_id=${appId}`} 
        title="Advertisement" 
        width="320" height="50" 
        style={{display:'none', border:'none', margin:'0 auto'}} 
        frameBorder="0" scrolling="no" 
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" 
        allow="clipboard-write"
      />
      <iframe 
        key="ad-bottom"
        className="openads-banner" 
        src={`https://api.openads.world/serve?publisher=${publisher}&placement=320x50-${publisher}&position=bottom&parent_url=${encodeURIComponent(origin)}&app_id=${appId}`} 
        title="Advertisement" 
        width="320" height="50" 
        style={{display:'none', border:'none', margin:'0 auto'}} 
        frameBorder="0" scrolling="no" 
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" 
        allow="clipboard-write"
      />
    </div>
  );
});

export const App = () => {
  const { user, loading, loginWithGoogle, loginDev, logout } = useUnifiedAuth();

  // Google Auth is the single auth gate for the web version.
  const isAuthenticated = !!user;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingScreen />
        </div>
      ) : !isAuthenticated ? (
        <LoginView handleGoogleLogin={loginWithGoogle} handleDevLogin={loginDev} />
      ) : (
        <GameProvider user={user}>
          <NetworkAlert />
          <GameEntry onLogout={logout} />
        </GameProvider>
      )}

      <AdContainer loading={loading} />
    </div>
  );
};
