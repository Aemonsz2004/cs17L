// src/components/layout/TenantNavbar.tsx
import Icon from "../../components/Icon"

interface TenantNavbarProps {
  pageTitle:     string
  action?:       React.ReactNode
  user:          { name: string; initials: string; unit?: string | null }
  notifCount?:   number
  onNotifClick?: () => void
}

export default function TenantNavbar({
  pageTitle,
  action,
  user,
  notifCount   = 0,
  onNotifClick,
}: TenantNavbarProps) {
  return (
    <header className="h-14 flex-shrink-0 bg-white border-b border-[var(--rtms-navy)]/10 flex items-center px-6 gap-4">

      <h1 className="text-[15px] font-semibold text-[var(--rtms-navy)]">{pageTitle}</h1>

      <div className="flex-1" />

      {action && <div className="flex items-center gap-2">{action}</div>}

      {/* Bell */}
      <button
        onClick={onNotifClick}
        className="relative text-[var(--rtms-muted)] hover:text-[var(--rtms-navy)] transition-colors p-2 rounded-lg hover:bg-[var(--rtms-sand)] flex-shrink-0"
      >
        <Icon name="bell" size={16} className="block" />
        {notifCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full border-2 border-white" />
        )}
      </button>

      <div className="w-px h-6 bg-[var(--rtms-navy)]/10 flex-shrink-0" />

      {/* User chip */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-[var(--rtms-deep-brown)] flex items-center justify-center text-[11px] font-bold text-white select-none flex-shrink-0">
          {user.initials}
        </div>
        <div>
          <p className="text-xs font-semibold text-[var(--rtms-navy)] leading-tight">{user.name}</p>
          <p className="text-[10px] text-[var(--rtms-muted)] leading-tight">Unit {user.unit ?? "-"}</p>
        </div>
        <Icon name="chevron-down" size={12} className="text-[var(--rtms-muted)]" />
      </div>

    </header>
  )
}