// src/components/layout/MainLayout.jsx
import Sidebar from './Sidebar';
import Navbar from './Navbar';
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
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[var(--rtms-bg)] font-sans">
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
