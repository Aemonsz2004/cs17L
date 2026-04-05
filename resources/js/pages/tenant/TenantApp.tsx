// src/TenantApp.tsx
// Root of the tenant portal.
// Swap this with App.tsx (or add a route/toggle) when switching between admin and tenant views.

import { useState } from "react"
import { router, usePage } from "@inertiajs/react"
import TenantLayout       from "../../components/Layouts/TenantLayout"
import TenantBillingPage  from "./BillingPage"
import LeasePage          from "./LeasePage"
import TenantMaintenancePage from "./MaintenancePage"
import MessagesPage       from "./MessagesPage"
import MyUnitPage         from "./MyunitPage"
import TenantNotificationsPage from "./NotificationPage"
import PayRentPage        from "./PayrentPage"

type PageId =
  | "my-unit"
  | "lease"
  | "billing"
  | "pay-rent"
  | "maintenance"
  | "messages"
  | "notifications"

const PAGE_TITLES: Record<PageId, string> = {
  "my-unit":       "My Unit",
  "lease":         "Lease Agreement",
  "billing":       "Billing & Payments",
  "pay-rent":      "Pay Rent",
  "maintenance":   "Maintenance Requests",
  "messages":      "Messages",
  "notifications": "Notifications",
}

type TenantAppProps = {
  initialPage?: PageId
  tenant?: {
    id: number
    name: string
    initials: string
    unit: string
    floor: "GF" | "1F" | "2F" | "3F"
    type: "Office" | "Retail" | "Medical"
    rent: number
    deposit: number
    lease_start: string
    lease_end: string
    payment_method: "GCash" | "Bank Transfer" | "Cash"
    status: "active" | "expiring" | "overdue"
  }
  invoices?: Array<{
    id: number
    period: string
    total: number
    due_date: string
    paid_date: string | null
    method: "GCash" | "Bank Transfer" | "Cash" | null
    status: "paid" | "due" | "overdue"
  }>
  maintenance?: Array<{
    id: number
    title: string
    unit: string
    tenant: string
    type: "Electrical" | "Plumbing" | "Air Conditioning" | "Structural" | "General"
    priority: "high" | "medium" | "low"
    status: "open" | "inprogress" | "resolved"
    notes: string
    assigned_to?: string | null
    resolved_date?: string | null
    created_at?: string
  }>
  notifications?: Array<{
    id: number
    variant: "red" | "amber" | "teal" | "gray"
    message: string
    timestamp?: string
    unread: boolean
    category: "payment" | "lease" | "maintenance" | "system"
    created_at?: string
  }>
  messages?: Array<{
    id: number
    from: "admin" | "tenant"
    text: string
    created_at?: string
  }>
}

const TENANT_ROUTE_MAP: Record<PageId, string> = {
  "my-unit": "/tenant/home",
  "lease": "/tenant/lease",
  "billing": "/tenant/billing",
  "pay-rent": "/tenant/pay-rent",
  "maintenance": "/tenant/maintenance",
  "messages": "/tenant/messages",
  "notifications": "/tenant/notifications",
}

export default function TenantApp({ initialPage = "my-unit", tenant, invoices, maintenance, notifications, messages }: TenantAppProps) {
  const [page] = useState<PageId>(initialPage)
  const { auth, unread_count } = usePage<{
    auth?: { user?: { name?: string; tenant_id?: number | null } }
    unread_count?: number
  }>().props

  const userName = auth?.user?.name ?? "Tenant"
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const unreadCount = unread_count ?? (notifications ?? []).filter((n) => n.unread).length
  const messageCount = (messages ?? []).filter((message) => message.from === "admin").length

  const navigate = (id: string) => {
    const target = id as PageId
    const route = TENANT_ROUTE_MAP[target]
    if (route) {
      router.visit(route)
    }
  }

  const renderPage = () => {
    switch (page) {
      case "my-unit":       return <MyUnitPage         onNavigate={navigate} tenant={tenant} invoices={invoices} maintenance={maintenance} />
      case "lease":         return <LeasePage tenant={tenant} invoices={invoices} />
      case "billing":       return <TenantBillingPage  onPayRent={() => navigate("pay-rent")} />
      case "pay-rent":      return <PayRentPage        />
      case "maintenance":   return <TenantMaintenancePage maintenance={maintenance} />
      case "messages":      return <MessagesPage       messages={messages} />
      case "notifications": return <TenantNotificationsPage notifications={notifications} />
    }
  }

  return (
    <TenantLayout
      activeId={page}
      onNavigate={navigate}
      user={{
        name: userName,
        initials,
      }}
      messageCount={messageCount}
      pageTitle={PAGE_TITLES[page]}
      notifCount={unreadCount}
      onNotifClick={() => navigate("notifications")}
    >
      {renderPage()}
    </TenantLayout>
  )
}