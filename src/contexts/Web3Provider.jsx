import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { metaMaskWallet, rainbowWallet, walletConnectWallet, coinbaseWallet } from '@rainbow-me/rainbowkit/wallets';
import { base } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

// Web-only config: Base Mainnet via RainbowKit (EVM wallets — MetaMask, Coinbase, etc.)
// Farcaster frame connector and TonConnect have been removed.
const config = getDefaultConfig({
  appName: 'Dungeons With Gems',
  projectId: '61b0a0a65bcb71e672d99fc2204fc914',
  chains: [base],
  wallets: [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet, coinbaseWallet, rainbowWallet, walletConnectWallet],
    },
  ],
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
