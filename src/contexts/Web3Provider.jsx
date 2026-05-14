import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider, darkTheme, connectorsForWallets } from '@rainbow-me/rainbowkit';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { metaMaskWallet, rainbowWallet, walletConnectWallet, coinbaseWallet } from '@rainbow-me/rainbowkit/wallets';
import { base } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { farcasterFrame } from '@farcaster/frame-wagmi-connector';

const projectId = '61b0a0a65bcb71e672d99fc2204fc914';

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet, coinbaseWallet, rainbowWallet, walletConnectWallet],
    },
  ],
  {
    appName: 'Dungeons With Gems',
    projectId: projectId,
  }
);

// Hybrid config: RainbowKit EVM wallets + Farcaster Frame native connector
const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http()
  },
  connectors: [farcasterFrame(), ...connectors],
  ssr: false,
});

const queryClient = new QueryClient();

export function Web3Provider({ children }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({
          accentColor: '#06b6d4',
          accentColorForeground: 'black',
          borderRadius: 'small',
        })}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
