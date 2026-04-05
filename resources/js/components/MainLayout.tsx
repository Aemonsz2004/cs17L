// src/components/layout/MainLayout.tsx
import Sidebar from "./Sidebar"
import Navbar  from "./Navbar"

interface NavItem {
  id:     string
  label:  string
  badge?: number
}

interface NavSection {
  section: string
  items:   NavItem[]
}

interface MainLayoutProps {
  navSections:   NavSection[]
  activeId:      string
  onNavigate:    (id: string) => void
  user:          { name: string; role: string; initials: string }
  pageTitle:     string
  navbarAction?: React.ReactNode
  notifCount?:   number
  onNotifClick?: () => void
  children:      React.ReactNode
}

export default function MainLayout({
  navSections,
  activeId,
  onNavigate,
  user,
  pageTitle,
  navbarAction,
  notifCount   = 0,
  onNotifClick,
  children,
}: MainLayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--rtms-bg)] font-sans">

      {/* Sidebar */}
      <Sidebar
        navSections={navSections}
        activeId={activeId}
        onNavigate={onNavigate}
        user={user}
      />

      {/* Right column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

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
          <div className="p-6">
            {children}
          </div>
        </main>

      </div>
    </div>
  )
}