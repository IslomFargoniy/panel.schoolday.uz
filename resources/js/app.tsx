import { createInertiaApp } from '@inertiajs/react';
import axios from 'axios';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import './i18n';
import { initializeTheme } from './hooks/use-appearance';
import { configureEcho } from '@laravel/echo-react';

const reverbCfg = (typeof window !== 'undefined' && window.__REVERB__) || {};

const isHttps =
    reverbCfg.scheme === 'https' ||
    (typeof window !== 'undefined' && window.location.protocol === 'https:') ||
    import.meta.env.VITE_REVERB_SCHEME === 'https';

const isProductionDomain =
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1';

const reverbKey =
    reverbCfg.key ||
    import.meta.env.VITE_REVERB_APP_KEY ||
    'schoolday-key';

const wsHost = isProductionDomain
    ? window.location.hostname
    : (reverbCfg.host || import.meta.env.VITE_REVERB_HOST || 'localhost');

const resolvedPort = (isProductionDomain || isHttps)
    ? 443
    : Number(reverbCfg.port || import.meta.env.VITE_REVERB_PORT || 8080);

configureEcho({
    broadcaster: 'reverb',
    key: reverbKey,
    wsHost: wsHost,
    wsPort: resolvedPort,
    wssPort: resolvedPort,
    forceTLS: isHttps,
    enabledTransports: ['ws', 'wss'],
});

// ── Axios global defaults ────────────────────────────────────────────────────
// Laravel web routes require the XSRF-TOKEN cookie on every non-GET request.
// axios reads the XSRF-TOKEN cookie and attaches it as X-XSRF-TOKEN header.
axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = true;
axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
// ────────────────────────────────────────────────────────────────────────────

const appName = import.meta.env.VITE_APP_NAME || 'SchoolDay';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <App {...props} />
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
