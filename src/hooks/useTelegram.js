/**
 * useTelegram — DEPRECATED
 * Telegram Mini App integration has been removed from Dungeons With Gems.
 * This file is kept as a stub to avoid import errors during transition.
 * The GameContext no longer imports or uses this hook.
 */
export const useTelegram = () => ({
  tg: null,
  isTelegram: false,
  user: null,
  triggerHaptic: () => {},
  setMainButton: () => {},
  platform: 'browser',
  version: '0.0'
});
