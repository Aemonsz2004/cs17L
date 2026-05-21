import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import { ToastContainer } from './components/Toast';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

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
            <App {...props}>
                {({ Component, props: pageProps, key }) => {
                    const child = createElement(Component, { key, ...pageProps });
                    let content;
                    if (typeof Component.layout === 'function') {
                        content = Component.layout(child);
                    } else if (Array.isArray(Component.layout)) {
                        content = Component.layout.concat(child).reverse().reduce(
                            (children, Layout) => createElement(Layout, { children, ...pageProps }),
                        );
                    } else {
                        content = child;
                    }
                    return (
                        <>
                            {content}
                            <ToastContainer flash={pageProps.flash} />
                        </>
                    );
                }}
            </App>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});
