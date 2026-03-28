import React, { useState, useEffect } from 'react';
import { auth, db, appId } from './firebase';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, signInAnonymously } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { GameProvider } from './contexts/GameContext';
import { GameLayout } from './components/GameLayout';
import { LoadingScreen } from './components/LoadingScreen';
import { LoginView } from './components/LoginView';
import { sdk } from "@farcaster/frame-sdk";

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState(null);

  useEffect(() => {
    const initFarcaster = async () => {
       try {
          const ctx = await sdk.context;
          setContext(ctx);
          if (ctx) {
             console.log("Farcaster Frame Context Loaded:", ctx);
          } else {
             console.log("Standard Browser Detected: Running outside Farcaster environment.");
          }
       } catch (e) {
          console.log("Farcaster SDK Error / No Context", e);
       }
    };
    initFarcaster();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      // Once auth is checked and loading is false, tell Farcaster we are ready
      try {
        sdk.actions.ready();
      } catch (e) {
        console.error("SDK ready call failed:", e);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("Google login error:", e);
      setLoading(false);
    }
  };

  const handleFarcasterLogin = async () => {
    try {
      setLoading(true);
      await signInAnonymously(auth);
    } catch (e) {
      console.error("Farcaster login error:", e);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  if (loading) return <LoadingScreen />;

  if (!user) {
    return (
      <LoginView 
        handleGoogleLogin={handleGoogleLogin} 
        handleFarcasterLogin={handleFarcasterLogin}
        farcasterContext={context}
      />
    );
  }

  return (
    <GameProvider user={user} farcasterContext={context}>
      <GameLayout onLogout={handleLogout} />
    </GameProvider>
  );
};

export default App;
