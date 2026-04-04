import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { useEffect, useState } from 'react';

import { farcasterFrame } from '@farcaster/frame-wagmi-connector';

const config = getDefaultConfig({
  appName: 'Dungeons With Gems',
  projectId: '61b0a0a65bcb71e672d99fc2204fc914',
  chains: [base],
  connectors: [farcasterFrame()],
  ssr: false, 
});

const queryClient = new QueryClient();

const TON_MANIFEST = "https://metaverse.dungeonswithgems.quest/tonconnect-manifest.json";

/**
 * Detects if we are TRULY inside the Telegram Mini App.
 * The SDK populates initData only when launched inside Telegram.
 * In a regular browser, it's always an empty string.
 */
function useIsRealTMA() {
  const [isRealTMA, setIsRealTMA] = useState(false);
  useEffect(() => {
    const webApp = window?.Telegram?.WebApp;
    if (webApp && typeof webApp.initData === 'string' && webApp.initData.length > 0) {
      setIsRealTMA(true);
    }
  }, []);
  return isRealTMA;
}

/**
 * Conditionally mounts TonConnectUIProvider ONLY inside Telegram Mini App.
 * This prevents the provider from polling bridge servers on regular web / Farcaster.
 */
function ConditionalTonProvider({ children }) {
  const isRealTMA = useIsRealTMA();

  if (!isRealTMA) {
    // Not in TMA — render children without any TON provider (no bridge polling)
    return <>{children}</>;
  }

  return (
    <TonConnectUIProvider manifestUrl={TON_MANIFEST}>
      {children}
    </TonConnectUIProvider>
  );
}

export function Web3Provider({ children }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConditionalTonProvider>
          <RainbowKitProvider theme={darkTheme({
            accentColor: '#06b6d4', 
            accentColorForeground: 'black',
            borderRadius: 'small',
          })}>
            {children}
          </RainbowKitProvider>
        </ConditionalTonProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
