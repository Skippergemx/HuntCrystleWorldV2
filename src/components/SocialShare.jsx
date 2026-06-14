import { Twitter } from 'lucide-react';

/**
 * Reusable social sharing buttons for Farcaster (Warpcast) and X (Twitter).
 * Uses the DWG comic-style button aesthetic from HuntTown's LevelUpModal.
 *
 * Props:
 *   shareText     — plain text (not encoded) to prefill in the compose box
 *   variant       — 'vertical' (divider + buttons) | 'inline' (compact row only)
 *   dividerText   — label for the divider line (default: "Share Your Achievement")
 *   className     — optional wrapper class
 *   hashtags      — optional comma-separated hashtags for X (ignored by Farcaster)
 */

const FarcasterIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M5.83 2h12.34L22 7.45v2.33l-6.17 6.17h-2.33L7.32 9.77V7.45L5.83 2Z"/>
    <path d="M2 7.45h3.33v9.23H2V7.45Z"/>
  </svg>
);

export default function SocialShare({
  shareText,
  variant = 'vertical',
  dividerText = 'Share Your Achievement',
  className = '',
  hashtags = 'DungeonsWithGems,Base,Web3Gaming',
}) {
  if (!shareText) return null;

  const encodedText = encodeURIComponent(shareText);
  const farcasterUrl = `https://warpcast.com/~/compose?text=${encodedText}`;
  const xUrl = `https://x.com/intent/tweet?text=${encodedText}${hashtags ? `&hashtags=${hashtags}` : ''}`;

  const openShare = (url) => window.open(url, '_blank', 'noopener,noreferrer');

  const buttons = (
    <div className="flex items-center gap-3">
      {/* Farcaster */}
      <a
        href={farcasterUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => { e.preventDefault(); openShare(farcasterUrl); }}
        className="flex items-center gap-2 bg-[#8a63d2] hover:bg-[#9b74e3] text-white px-4 py-2.5 rounded-xl font-black uppercase italic text-[10px] md:text-xs border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
        title="Share on Farcaster"
      >
        <FarcasterIcon size={16} className="text-white" />
        Warpcast
      </a>

      {/* X / Twitter */}
      <a
        href={xUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => { e.preventDefault(); openShare(xUrl); }}
        className="flex items-center gap-2 bg-black hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-black uppercase italic text-[10px] md:text-xs border-[3px] border-slate-600 shadow-[3px_3px_0_rgba(255,255,255,0.15)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
        title="Share on X"
      >
        <Twitter size={16} />
        X
      </a>
    </div>
  );

  if (variant === 'inline') {
    return <div className={className}>{buttons}</div>;
  }

  // vertical: divider + buttons
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1 h-px bg-purple-500/30"></div>
        <span className="text-[8px] font-black text-purple-400 uppercase tracking-[0.3em] italic whitespace-nowrap">
          {dividerText}
        </span>
        <div className="flex-1 h-px bg-purple-500/30"></div>
      </div>
      {buttons}
    </div>
  );
}
