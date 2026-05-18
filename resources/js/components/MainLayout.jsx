// src/components/layout/MainLayout.jsx
import { usePage } from '@inertiajs/react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import FlashMessage from './FlashMessage';
export default function MainLayout({
    navSections,
    activeId,
    onNavigate,
    user,
    pageTitle,
    navbarAction,
    notifCount = 0,
    onNotifClick,
    children,
}) {
    const { props } = usePage();
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[var(--rtms-bg)] font-sans">
            <FlashMessage message={props.success} type="success" />
            <FlashMessage message={props.error} type="error" />
            {/* Sidebar */}
            <Sidebar
                navSections={navSections}
                activeId={activeId}
                onNavigate={onNavigate}
                user={user}
                notifCount={notifCount}
            />

            {/* Right column */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                {/* Navbar */}
                <Navbar
                    pageTitle={pageTitle}
                    action={navbarAction}
                    user={user}
                    notifCount={notifCount}
                    onNotifClick={onNotifClick}
                />

                {/* Page content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="p-6">{children}</div>
                </main>
            </div>
        </div>
    );
}
