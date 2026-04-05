// src/pages/admin/NotificationsPage.tsx
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react"
import Badge from "../../components/Badge"
import Button from "../../components/Button"
import Card from "../../components/Card"
import { Input } from "../../components/Input"
import MetricCard from "../../components/MetricCard"
import Modal from "../../components/Modal"
import NotifItem from "../../components/NotifItem"
import { formatDateDisplay } from "../../lib/date"

type Notification = {
  id: number
  variant: "red" | "amber" | "teal" | "gray"
  message: string
  timestamp?: string
  unread: boolean
  category: "payment" | "lease" | "maintenance" | "system"
}

type Category = "all" | "payment" | "lease" | "maintenance" | "system"

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "all",         label: "All"         },
  { key: "payment",     label: "Payments"    },
  { key: "lease",       label: "Leases"      },
  { key: "maintenance", label: "Maintenance" },
  { key: "system",      label: "System"      },
]

type PageId = "dashboard" | "tenants" | "units" | "billing" | "maintenance" | "messages" | "notifications" | "reports"

type NotificationsPageProps = {
  notifications: Notification[]
  onChangeNotifications: Dispatch<SetStateAction<Notification[]>>
  onNavigate: (page: PageId) => void
}

const getDestination = (category: Notification["category"]): PageId => {
  if (category === "payment") return "billing"
  if (category === "lease") return "tenants"
  if (category === "maintenance") return "maintenance"
  return "reports"
}

const categoryLabel = (category: Notification["category"]) => {
  if (category === "payment") return "Payment"
  if (category === "lease") return "Lease"
  if (category === "maintenance") return "Maintenance"
  return "System"
}

export default function NotificationsPage({ notifications, onChangeNotifications, onNavigate }: NotificationsPageProps) {
  const [category, setCategory] = useState<Category>("all")
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Notification | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const pageSize = 8

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [notifications],
  )

  const filtered = useMemo(
    () => notifications.filter((n) => {
      const matchCat = category === "all" || n.category === category
      const matchUnread = !showUnreadOnly || n.unread
      const keyword = search.toLowerCase().trim()
      const matchSearch = !keyword || n.message.toLowerCase().includes(keyword)
      return matchCat && matchUnread && matchSearch
    }),
    [notifications, category, showUnreadOnly, search],
  )

  useEffect(() => {
    setPage(1)
  }, [category, showUnreadOnly, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedNotifications = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const markAsRead = (id: number) => {
    onChangeNotifications((prev) => prev.map((notification) => (
      notification.id === id ? { ...notification, unread: false } : notification
    )))
  }

  const markAllRead = () => {
    if (!window.confirm("Mark all notifications as read?")) {
      return
    }

    onChangeNotifications((prev) => prev.map((notification) => ({ ...notification, unread: false })))
  }

  const openDetails = (notification: Notification) => {
    markAsRead(notification.id)
    onNavigate(getDestination(notification.category))
  }

  const openNotification = (notification: Notification) => {
    setSelected(notification)
    setDetailOpen(true)
    markAsRead(notification.id)
  }

  return (
    <div className="space-y-5">

      {/* ── Metrics ── */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total"       value={notifications.length} sub="All notifications"   />
        <MetricCard label="Unread"      value={unreadCount}           sub="Need attention"       trend="down" iconBg="bg-red-50 text-red-400" />
        <MetricCard label="Payments"    value={notifications.filter(n=>n.category==="payment").length}     sub="Payment alerts"    />
        <MetricCard label="Maintenance" value={notifications.filter(n=>n.category==="maintenance").length} sub="Repair alerts"     />
      </div>

      <Card>
        <Card.Header
          title="Notifications"
          action={
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search notifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56"
              />
              {/* Unread toggle */}
              <button
                onClick={() => setShowUnreadOnly((value) => !value)}
                className={[
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  showUnreadOnly
                    ? "bg-[#1B2B4B] text-white border-[#1B2B4B]"
                    : "bg-white text-[#5C6B88] border-[#1B2B4B]/15 hover:bg-[#F5F0E8]",
                ].join(" ")}
              >
                {showUnreadOnly ? "Showing Unread" : "Show Unread Only"}
                {unreadCount > 0 && (
                  <span className="ml-1.5 bg-red-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
              <Button variant="ghost" size="sm" onClick={markAllRead}>Mark All Read</Button>
            </div>
          }
        />

        {/* Category tabs */}
        <div className="flex gap-1 px-5 py-3 border-b border-[#1B2B4B]/8 overflow-x-auto">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={[
                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5",
                category === c.key
                  ? "bg-[#1B2B4B] text-white"
                  : "text-[#5C6B88] hover:bg-[#F5F0E8] hover:text-[#1B2B4B]",
              ].join(" ")}
            >
              {c.label}
              <span className={[
                "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                category === c.key ? "bg-white/20 text-white" : "bg-[#F5F0E8] text-[#5C6B88]",
              ].join(" ")}>
                {c.key === "all"
                  ? notifications.length
                  : notifications.filter(n => n.category === c.key).length}
              </span>
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#5C6B88]">
            No notifications in this category.
          </div>
        ) : (
          pagedNotifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => openNotification(notification)}
              title="Open notification details"
              aria-label={`Open notification: ${notification.message}`}
              className="w-full text-left"
            >
              <NotifItem
                variant={notification.variant}
                message={notification.message}
                timestamp={formatDateDisplay(notification.timestamp, "-")}
                unread={notification.unread}
                className="transition-colors hover:bg-[#F5F0E8]"
              />
            </button>
          ))
        )}

        <Card.Footer>
          <div className="w-full flex items-center justify-between gap-3">
            <span>
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              -{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
              {showUnreadOnly && " (unread only)"}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="xs"
                disabled={currentPage <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Prev
              </Button>
              <span className="text-xs text-[#5C6B88]">Page {currentPage} / {totalPages}</span>
              <Button
                variant="outline"
                size="xs"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </Card.Footer>
      </Card>

      {selected && (
        <Modal
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          title="Notification Detail"
          size="md"
          footer={
            <div className="w-full flex items-center justify-end gap-2">
              {selected.unread && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (window.confirm("Mark this notification as read?")) {
                      markAsRead(selected.id)
                      setSelected((prev) => (prev ? { ...prev, unread: false } : prev))
                    }
                  }}
                >
                  Mark as Read
                </Button>
              )}
              <Button
                variant="primary"
                onClick={() => {
                  if (window.confirm("Open related page for this notification?")) {
                    openDetails(selected)
                    setDetailOpen(false)
                  }
                }}
              >
                View More
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={selected.unread ? "red" : "gray"}>
                {selected.unread ? "Unread" : "Read"}
              </Badge>
              <Badge variant="blue">{categoryLabel(selected.category)}</Badge>
            </div>
            <p className="text-base font-semibold text-[#1B2B4B] leading-snug">
              {selected.message}
            </p>
            <p className="text-xs text-[#5C6B88]">{formatDateDisplay(selected.timestamp, "-")}</p>
          </div>
        </Modal>
      )}

    </div>
  )
}