import { useEffect } from 'react';

// Ensure TypeScript recognizes window.Telegram and window.eruda
declare global {
    interface Window {
        Telegram?: {
            WebApp: any;
        };
        eruda?: any;
    }
}

export function TelegramAuthDebug() {
    useEffect(() => {
        const isDev = import.meta.env.MODE === 'development';

        // Initialize Eruda for console debugging only in dev mode
        if (isDev && window.eruda) {
            window.eruda.init();
        }

        // Always initialize and configure Telegram WebApp natively
        const tg = window.Telegram?.WebApp;

        if (tg) {
            tg.ready();
            tg.expand();

            // Emit structured debug info to the console invisibly
            if (isDev) {
                const rawInitData = tg.initData;
                const initDataUnsafe = tg.initDataUnsafe;


                const userData = initDataUnsafe?.user;
                if (userData) {
                }
            }
        } else {
            if (isDev) {
            }
        }

        return () => {
            if (isDev && window.eruda) {
                window.eruda.destroy();
            }
        };
    }, []);

    // Completely hidden from the visual UI flow
    return null;
}
