import { createInertiaApp } from '@inertiajs/react';
import axios from 'axios';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import './i18n';
import { initializeTheme } from './hooks/use-appearance';
import { configureEcho } from '@laravel/echo-react';

const reverbKey = import.meta.env.VITE_REVERB_APP_KEY || 'schoolday_reverb_key_918237';
const reverbHost = import.meta.env.VITE_REVERB_HOST;
const reverbPort = import.meta.env.VITE_REVERB_PORT;
const reverbScheme = import.meta.env.VITE_REVERB_SCHEME;

const isHttps =
    reverbScheme === 'https' ||
    (typeof window !== 'undefined' && window.location.protocol === 'https:');

const isLocalHost =
    !reverbHost ||
    reverbHost === 'localhost' ||
    reverbHost === '127.0.0.1';

const wsHost =
    typeof window !== 'undefined' && isLocalHost
        ? window.location.hostname
        : (reverbHost || 'localhost');

const defaultPort = isHttps ? 443 : 8080;
const resolvedPort = Number(reverbPort || defaultPort);

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
