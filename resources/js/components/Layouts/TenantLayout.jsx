// src/components/layout/TenantLayout.jsx
import TenantSidebar from '../../pages/tenant/TenantSidebar';
import TenantNavbar from '../../pages/tenant/TenantNavbar';
export default function TenantLayout({
    activeId,
    onNavigate,
    user,
    messageCount = 0,
    pageTitle,
    navbarAction,
    notifCount = 0,
    onNotifClick,
    children,
}) {
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[var(--rtms-bg)] font-sans">
            <TenantSidebar
                activeId={activeId}
                onNavigate={onNavigate}
                user={user}
                notifCount={notifCount}
                messageCount={messageCount}
            />
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <TenantNavbar
                    pageTitle={pageTitle}
                    action={navbarAction}
                    user={user}
                    notifCount={notifCount}
                    onNotifClick={onNotifClick}
                />
                <main className="flex-1 overflow-y-auto">
                    <div className="p-6">{children}</div>
                </main>
            </div>
        </div>
    );
}
