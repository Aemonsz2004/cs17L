import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import '../css/app.css';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Main browser entry point for the Inertia app.
createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    // We now load .jsx pages since the frontend is JavaScript-only.
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.jsx`,
            import.meta.glob('./pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        // Render the current Inertia page component in the root element.
        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
