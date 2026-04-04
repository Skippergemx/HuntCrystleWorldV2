import { useEffect, useState, useMemo } from 'react';

/**
 * Hook for Telegram Mini App (TMA) integration.
 * Enables haptics, theme sync, and native button control.
 */
export const useTelegram = () => {
    const [tg, setTg] = useState(null);
    const [isTelegram, setIsTelegram] = useState(false);

    useEffect(() => {
        // Safe access to window.Telegram (loaded from index.html)
        // CRITICAL: Also check initData — the SDK sets window.Telegram.WebApp in ALL
        // browsers after the script loads, but initData is ONLY non-empty when the app
        // is genuinely launched from inside Telegram. Empty string = regular browser.
        const webApp = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
        const isRealTMA = !!webApp && typeof webApp.initData === 'string' && webApp.initData.length > 0;

        if (isRealTMA) {
            // Critical: Initialize the WebApp 
            webApp.ready();
            webApp.expand(); // Fullscreen experience
            
            setTg(webApp);
            setIsTelegram(true);
            
            console.log('🔗 [TELEGRAM_UPLINK] System Synced:', webApp.initDataUnsafe?.user?.username || 'GUEST');
        } else {
            console.log('ℹ️ [TELEGRAM_UPLINK] SDK present but not running inside TMA — skipping Telegram mode.');
        }
    }, []);

    const user = useMemo(() => tg?.initDataUnsafe?.user, [tg]);

    /**
     * Triggers hardware haptic feedback.
     * types: 'light', 'medium', 'heavy', 'rigid', 'soft'
     */
    const triggerHaptic = (type = 'light') => {
        if (tg?.HapticFeedback) {
            tg.HapticFeedback.impactOccurred(type);
        }
    };

    /**
     * Native main button control (The big blue button at bottom)
     */
    const setMainButton = (text, onClick, isVisible = true) => {
        if (tg?.MainButton) {
            tg.MainButton.setText(text);
            tg.MainButton.onClick(onClick);
            if (isVisible) tg.MainButton.show();
            else tg.MainButton.hide();
        }
    };

    return {
        tg,
        isTelegram,
        user,
        triggerHaptic,
        setMainButton,
        platform: tg?.platform || 'ios',
        version: tg?.version || '0.0'
    };
};
