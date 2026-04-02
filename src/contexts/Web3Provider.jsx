import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

import { farcasterFrame } from '@farcaster/frame-wagmi-connector';

const config = getDefaultConfig({
  appName: 'Dungeons With Gems',
  projectId: '61b0a0a65bcb71e672d99fc2204fc914', // Official WalletConnect integration
  chains: [base],
  connectors: [farcasterFrame()],
  ssr: false, 
});

const queryClient = new QueryClient();

export function Web3Provider({ children }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({
          accentColor: '#06b6d4', // Cyan 500 to match your UI
          accentColorTextColor: 'black',
          borderRadius: 'small',
        })}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
