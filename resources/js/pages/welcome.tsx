// src/App.tsx
import { useState } from "react"
import { router, usePage } from "@inertiajs/react"

import MainLayout         from "../components/MainLayout"
import BillingPage        from "./admin/BillingPage"
import DashboardPage      from "./admin/DashboardPage"
import MaintenancePage    from "./admin/MaintenancePage"
import MessagesPage       from "./admin/MessagesPage"
import NotificationsPage  from "./admin/NotificationsPage"
import ReportsPage        from "./admin/ReportsPage"
import TenantsPage        from "./admin/TenantsPage"
import UnitsPage          from "./admin/UnitsPage"

type Notification = {
  id: number
  variant: "red" | "amber" | "teal" | "gray"
  message: string
  timestamp?: string
  unread: boolean
  category: "payment" | "lease" | "maintenance" | "system"
}


// ── Nav definition ────────────────────────────────────────────────────────────

const BASE_NAV_SECTIONS = [
  {
    section: "Main",
    items: [
      { id: "dashboard",  label: "Dashboard" },
      { id: "tenants",    label: "Tenants"   },
      { id: "units",      label: "Units"     },
    ],
  },
  {
    section: "Operations",
    items: [
      { id: "billing",       label: "Billing",        badge: 0 },
      { id: "maintenance",   label: "Maintenance",    badge: 0 },
      { id: "messages",      label: "Messages",       badge: 0 },
      { id: "notifications", label: "Notifications",  badge: 0 },
      { id: "reports",       label: "Reports"         },
    ],
  },
]

type PageId = "dashboard" | "tenants" | "units" | "billing" | "maintenance" | "messages" | "notifications" | "reports"

const PAGE_TITLES: Record<PageId, string> = {
  dashboard:     "Dashboard",
  tenants:       "Tenants",
  units:         "Units",
  billing:       "Billing & Payments",
  maintenance:   "Maintenance",
  messages:      "Tenant Messages",
  notifications: "Notifications",
  reports:       "Reports & Analytics",
}

const PAGE_ROUTES: Record<PageId, string> = {
  dashboard: "/admin/dashboard",
  tenants: "/admin/tenants",
  units: "/admin/units",
  billing: "/admin/billing",
  maintenance: "/admin/maintenance",
  messages: "/admin/messages",
  notifications: "/admin/notifications",
  reports: "/admin/reports",
}

const ADMIN_USER = {
  name:     "DM Rashid F.",
  role:     "Administrator",
  initials: "DM",
}

// ── Root App ──────────────────────────────────────────────────────────────────

export default function App({ initialPage = "dashboard" as PageId }) {
  const page = initialPage
  const { notifications: propNotifications, messages: propMessages } = usePage<{
    notifications?: Notification[]
    messages?: Array<{ id: number; read: boolean; from: "admin" | "tenant" }>
  }>().props

  const [notifications, setNotifications] = useState<Notification[]>(propNotifications ?? [])

  const unreadCount = notifications.filter((n) => n.unread).length
  const unreadMessageCount = (propMessages ?? []).filter((message) => message.from === "tenant" && !message.read).length

  const navSections = BASE_NAV_SECTIONS.map((section) => {
    if (section.section !== "Operations") {
      return section
    }

    return {
      ...section,
      items: section.items.map((item) => (
        item.id === "notifications"
          ? { ...item, badge: unreadCount }
          : item.id === "messages"
            ? { ...item, badge: unreadMessageCount }
            : item
      )),
    }
  })

  const navigate = (target: PageId) => {
    router.visit(PAGE_ROUTES[target])
  }

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <DashboardPage onNavigate={(next) => navigate(next)} />
      case "tenants":
        return <TenantsPage openAddSignal={0} />
      case "units":
        return <UnitsPage openAddSignal={0} />
      case "billing":
        return <BillingPage openAddSignal={0} />
      case "maintenance":
        return <MaintenancePage openAddSignal={0} />
      case "messages":
        return <MessagesPage messages={propMessages as any[]} />
      case "notifications":
        return (
          <NotificationsPage
            notifications={notifications}
            onChangeNotifications={setNotifications}
            onNavigate={(next) => navigate(next)}
          />
        )
      case "reports":       return <ReportsPage />
    }
  }

  return (
    <MainLayout
      navSections={navSections}
      activeId={page}
      onNavigate={(id) => navigate(id as PageId)}
      user={ADMIN_USER}
      pageTitle={PAGE_TITLES[page]}
      notifCount={unreadCount}
      onNotifClick={() => navigate("notifications")}
    >
      {renderPage()}
    </MainLayout>
  )
}