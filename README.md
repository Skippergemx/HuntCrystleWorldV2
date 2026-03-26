# Dungeons With Gems 💎

An immersive Web3 Idle Game built for busy people who are gamers by heart. Deploy your warrior, engage in automated tactical combat, and secure legendary loot while the terminal runs.

## 🚀 System Architecture

### Core Tech Stack
- **Frontend**: [React 19](https://react.dev/) (Hooks-driven architecture)
- **Bundler**: [Vite](https://vitejs.dev/) (High-performance HMR)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Utility-first with custom glassmorphism)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend-as-a-Service**: [Firebase](https://firebase.google.com/) (Auth, Firestore)
- **Web3 Layer**: [Base Mainnet](https://base.org) (EVM Connectivity, Genesis NFT Verification)

### Gameplay Mechanics
- **Combat Engine**: Deterministic calculation core.
- **Reward Scaling**: 15% exponential XP/GX increase per floor descent.
- **Syndicate Warfare**: Global raid synchronization for World Boss encounters.
- **Economic Loop**: Dual-currency (GX/Crystle Shards) with player-run marketplace.

## 🛠️ Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/[username]/DungeonsWithGems.git
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env` file and populate your Firebase credentials.

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

## 📜 Key Features
- **Hands-Free Auto-Play**: Battle logic executes while the terminal is active.
- **Decentralized Profiles**: Progress is synced via Google OAuth and Firestore.
- **Complex Progression**: Forge, Lab, Tavern, and Dragon systems for deep tactical optimization.
- **Metaverse Visuals**: High-contrast, comic-style UI with interactive dashboards.

## 📱 Farcaster Mini-App (Frames v2) Integration

Dungeons With Gems is ready to be launched as a **Farcaster Mini-App** (Warpcast Frame v2).

### Prerequisites
1. **Install SDK**:
   ```bash
   npm install @farcaster/frame-sdk
   ```
2. **Setup Domain**:
   Host the app on a public domain with HTTPS.
3. **Manifest**: 
   Ensure `public/.well-known/farcaster.json` is accessible.

### Warpcast Ready
The included `index.html` contains the required `fc:frame` meta tags. When shared in a cast, it will display a "Play Idle" launch button.

---
*DUNGEONS_WITH_GEMS // PROTOCOL_V2.1 // DECENTRALIZED_ADVENTURE_INITIATED*
