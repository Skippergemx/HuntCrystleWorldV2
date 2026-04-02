import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { base } from '@reown/appkit/networks';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// 1. Setup queryClient
const queryClient = new QueryClient();

// 2. Get projectId
const projectId = '61b0a0a65bcb71e672d99fc2204fc914';

// 3. Set up Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [base],
});

// 4. Create AppKit Instance
createAppKit({
  adapters: [wagmiAdapter],
  networks: [base],
  projectId,
  metadata: {
    name: 'Dungeons With Gems',
    description: 'Strategic Dungeon Crawler on Base',
    url: 'https://metaverse.dungeonswithgems.quest',
    icons: ['https://avatars.githubusercontent.com/u/37784886']
  },
  features: {
    analytics: true,
    email: true, // Enables email login (OTP based)
    socials: ['google', 'x', 'apple', 'discord', 'farcaster', 'github'], // Full list
    emailShowWallets: true, // Shows wallet options on the first screen
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#06b6d4',
    '--w3m-border-radius-master': '1px'
  }
});

export function Web3Provider({ children }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
