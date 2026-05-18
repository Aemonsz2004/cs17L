import { createInertiaApp, usePage } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import { ToastContainer } from './components/Toast';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

function AppWithToast({ children }) {
    const { flash } = usePage().props;
    return (
        <>
            {children}
            <ToastContainer flash={flash} />
        </>
    );
}

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.jsx`,
            import.meta.glob('./pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <AppWithToast>
                <App {...props} />
            </AppWithToast>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});
