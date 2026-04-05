// src/components/layout/TenantLayout.tsx
import TenantSidebar from "../../pages/tenant/TenantSidebar"
import TenantNavbar from "../../pages/tenant/TenantNavbar"

interface TenantLayoutProps {
  activeId:     string
  onNavigate:   (id: string) => void
  user:         { name: string; initials: string; unit?: string | null }
  messageCount?: number
  pageTitle:    string
  navbarAction?: React.ReactNode
  notifCount?:  number
  onNotifClick?: () => void
  children:     React.ReactNode
}

export default function TenantLayout({
  activeId,
  onNavigate,
  user,
  messageCount = 0,
  pageTitle,
  navbarAction,
  notifCount   = 0,
  onNotifClick,
  children,
}: TenantLayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--rtms-bg)] font-sans">
      <TenantSidebar
        activeId={activeId}
        onNavigate={onNavigate}
        user={user}
        notifCount={notifCount}
        messageCount={messageCount}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
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
  )
}