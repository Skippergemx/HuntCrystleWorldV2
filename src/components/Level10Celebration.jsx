import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, X, Gem, ExternalLink } from 'lucide-react';

/**
 * Level10Celebration — modal portal for the Level 10 Emerald Gemx reward.
 *
 * States:
 *   - claiming: pulsing gem + "Transmitting..."
 *   - claimed: success card with TX link
 *   - error: warning with retry/skip buttons
 *   - exhausted: subtle toast (no modal takeover)
 *
 * The exhausted state is handled via a gentle log message instead of a modal
 * to avoid discouraging the player.
 */
const Level10Celebration = ({ reward, onDismiss, onRetry }) => {
  const { status, txHash, error, message } = reward;

  // Dismiss on Escape
  useEffect(() => {
    if (status === 'idle' || status === 'exhausted') return;
    const handler = (e) => {
      if (e.key === 'Escape' && (status === 'claimed' || status === 'error')) {
        onDismiss();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [status, onDismiss]);

  // Nothing to show for idle or exhausted (exhausted is logged, not modaled)
  if (status === 'idle' || status === 'exhausted') return null;

  const isClaiming = status === 'claiming';
  const isClaimed = status === 'claimed';
  const isError = status === 'error';
  const isReserved = status === 'reserved' || status === 'checking';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm mx-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Close button — only when dismissible */}
        {(isClaimed || isError) && (
          <button
            onClick={onDismiss}
            className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        )}

        {/* === CLAIMING STATE === */}
        {isClaiming && (
          <div className="flex flex-col items-center py-10 px-6 text-center">
            <div className="relative mb-6">
              <Gem className="text-emerald-400 text-5xl animate-pulse" />
              <div className="absolute inset-0 w-12 h-12 mx-auto mt-1 rounded-full bg-emerald-500/20 animate-ping" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Transmitting Gemx</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Quartermaster is sending a <span className="text-emerald-300 font-semibold">Trilith Emerald Gemx</span> to your wallet...
            </p>
            <div className="mt-6 flex gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {/* === RESERVED STATE (no wallet) === */}
        {isReserved && (
          <div className="flex flex-col items-center py-10 px-6 text-center">
            <div className="relative mb-6">
              <Gem className="text-emerald-400/60 text-5xl" />
              <div className="absolute inset-0 w-12 h-12 mx-auto mt-1 rounded-full bg-emerald-500/10 animate-ping" style={{ animationDuration: '3s' }} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Level 10 Milestone Reached!</h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-2">
              A <span className="text-emerald-300 font-semibold">Trilith Emerald Gemx</span> has been reserved for you, Hunter.
            </p>
            <p className="text-slate-500 text-xs leading-relaxed">
              Link your wallet to your profile to receive your reward. The Emerald will be transmitted automatically.
            </p>
          </div>
        )}

        {/* === CLAIMED STATE === */}
        {isClaimed && (
          <div className="flex flex-col items-center py-10 px-6 text-center">
            <div className="mb-6 text-emerald-400">
              <CheckCircle2 size={48} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Emerald Claimed!</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              The Quartermaster has transmitted a <span className="text-emerald-300 font-semibold">Trilith Emerald Gemx</span> to your wallet.
            </p>
            {txHash && (
              <a
                href={`https://basescan.org/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm transition-colors"
              >
                <ExternalLink size={12} />
                View on Basescan
              </a>
            )}
            <button
              onClick={onDismiss}
              className="mt-6 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Continue
            </button>
          </div>
        )}

        {/* === ERROR STATE === */}
        {isError && (
          <div className="flex flex-col items-center py-10 px-6 text-center">
            <div className="mb-6 text-amber-400">
              <AlertTriangle size={48} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Transmission Interrupted</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              {error || message || 'Something went wrong during the Emerald transfer.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={onDismiss}
                className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-colors text-sm"
              >
                Dismiss
              </button>
              <button
                onClick={onRetry}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Level10Celebration;
