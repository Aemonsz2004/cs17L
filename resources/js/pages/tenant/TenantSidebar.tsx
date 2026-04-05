// src/components/layout/TenantSidebar.tsx
import { router } from "@inertiajs/react"
import Icon from "../../components/Icon"

const NAV = [
  {
    section: "My Space",
    items: [
      { id: "my-unit",   label: "My Unit"   },
      { id: "lease",     label: "Lease"     },
    ],
  },
  {
    section: "Transactions",
    items: [
      { id: "billing",   label: "Billing"   },
      { id: "pay-rent",  label: "Pay Rent"  },
    ],
  },
  {
    section: "Support",
    items: [
      { id: "maintenance",   label: "Maintenance"   },
      { id: "messages",      label: "Messages" },
      { id: "notifications", label: "Notifications" },
    ],
  },
]

const navIcon: Record<string, string> = {
  "my-unit": "home",
  "lease": "file-text",
  "billing": "credit-card",
  "pay-rent": "dollar-sign",
  "maintenance": "wrench",
  "messages": "message-square",
  "notifications": "bell",
}

interface TenantSidebarProps {
  activeId:   string
  onNavigate: (id: string) => void
  user:       { name: string; initials: string; unit?: string | null }
  notifCount?: number
  messageCount?: number
}

export default function TenantSidebar({
  activeId,
  onNavigate,
  user,
  notifCount = 0,
  messageCount = 0,
}: TenantSidebarProps) {
  return (
    <aside className="w-[210px] flex-shrink-0 flex flex-col h-full bg-[var(--rtms-navy)]">

      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-white/[0.08] flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[var(--rtms-accent)] flex items-center justify-center text-sm font-bold text-white flex-shrink-0 select-none">
          P
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-white/90 tracking-wide leading-tight truncate">
            Pandarawan RTMS
          </p>
          <p className="text-[10px] text-white/40 leading-tight">Tenant Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {NAV.map(group => (
          <div key={group.section} className="mb-1">
            <p className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-white/25 select-none">
              {group.section}
            </p>
            {group.items.map(item => {
              const isActive = item.id === activeId
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={[
                    "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg",
                    "text-sm font-medium transition-all duration-150 select-none",
                    isActive
                      ? "bg-[var(--rtms-accent)]/20 text-[var(--rtms-accent-soft)]"
                      : "text-white/55 hover:bg-white/[0.07] hover:text-white/90",
                  ].join(" ")}
                >
                  <Icon
                    name={navIcon[item.id] ?? "grid"}
                    size={15}
                    className="w-[15px] h-[15px] flex-shrink-0"
                  />
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {((item.id === "notifications" ? notifCount : item.id === "messages" ? messageCount : item.badge) ?? 0) > 0 && (
                    <span className="ml-auto flex-shrink-0 bg-red-400/90 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {item.id === "notifications" ? notifCount : item.id === "messages" ? messageCount : item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="flex-shrink-0 border-t border-white/[0.08] px-3 py-3">
        <div className="flex items-center gap-2.5 px-1">
          <div className="w-8 h-8 rounded-full bg-[var(--rtms-deep-brown)] flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 select-none">
            {user.initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white/80 truncate">{user.name}</p>
            <p className="text-[10px] text-white/35 truncate">Unit {user.unit ?? "-"} · Tenant</p>
          </div>
          <button
            className="text-white/30 hover:text-white/70 transition-colors flex-shrink-0 p-1"
            onClick={() => router.post("/logout")}
            type="button"
          >
            <Icon name="log-out" size={16} className="block" />
          </button>
        </div>
      </div>

    </aside>
  )
}