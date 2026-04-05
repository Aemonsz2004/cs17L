// src/pages/tenant/MyUnitPage.tsx
import Avatar      from "../../components/Avatar"
import Badge       from "../../components/Badge"
import Button      from "../../components/Button"
import Card        from "../../components/Card"
import Icon        from "../../components/Icon"
import InfoRow     from "../../components/InfoRow"
import ProgressBar from "../../components/ProgressBar"
import { formatDateDisplay } from "../../lib/date"
import { useMemo } from "react"

// ── Lease progress helper ─────────────────────────────────────────────────────

function leaseProgressPct(start: string, end: string): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const now = new Date()
  const total = Math.max(1, endDate.getTime() - startDate.getTime())
  const elapsed = Math.max(0, Math.min(total, now.getTime() - startDate.getTime()))
  return Math.min(100, Math.round((elapsed / total) * 100))
}

type TenantProfile = {
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

type TenantInvoice = {
  id: number
  period: string
  total: number
  due_date: string
  paid_date: string | null
  method: "GCash" | "Bank Transfer" | "Cash" | null
  status: "paid" | "due" | "overdue"
}

type TenantMaintenance = {
  id: number
  title: string
  status: "open" | "inprogress" | "resolved"
  created_at?: string
}

// ─────────────────────────────────────────────────────────────────────────────

export default function MyUnitPage({
  onNavigate,
  tenant,
  invoices = [],
  maintenance = [],
}: {
  onNavigate: (id: string) => void
  tenant?: TenantProfile
  invoices?: TenantInvoice[]
  maintenance?: TenantMaintenance[]
}) {
  const paidThisMonth = useMemo(() => invoices.find((invoice) => invoice.status === "paid"), [invoices])
  const hasOverdue = invoices.some((invoice) => invoice.status === "overdue")
  const openRequests = maintenance.filter(
    m => m.status === "open" || m.status === "inprogress"
  )
  const nextInvoice = invoices.find((invoice) => invoice.status !== "paid")
  const leasePct = leaseProgressPct(tenant?.lease_start ?? new Date().toISOString(), tenant?.lease_end ?? new Date().toISOString())

  if (!tenant) {
    return (
      <Card>
        <Card.Body>
          <p className="text-sm text-[#5C6B88]">Tenant profile not found.</p>
        </Card.Body>
      </Card>
    )
  }

  return (
    <div className="space-y-5 max-w-5xl">

      {/* ── Welcome banner ── */}
      <div className="bg-[#1B2B4B] rounded-2xl px-7 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar initials={tenant.initials} name={tenant.name} size="lg" />
          <div>
            <p className="text-white/50 text-xs mb-1">Welcome back</p>
            <h2 className="text-white text-xl font-bold leading-tight">{tenant.name}</h2>
            <p className="text-white/50 text-sm mt-0.5">
              Unit {tenant.unit} · {tenant.floor} · {tenant.type}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white/40 text-xs mb-1">Next payment due</p>
          <p className="text-[#5ECFC2] text-3xl font-bold">₱{(nextInvoice?.total ?? 0).toLocaleString()}</p>
          <p className="text-white/40 text-xs mt-1">{formatDateDisplay(nextInvoice?.due_date)}</p>
          <Button
            variant="primary"
            size="sm"
            className="mt-3"
            onClick={() => onNavigate("pay-rent")}
          >
            Pay Now
          </Button>
        </div>
      </div>

      {/* ── Status cards row ── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Payment status */}
        <Card padding>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5C6B88] mb-3">March Payment</p>
          {paidThisMonth ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#5C6B88]">Status</span>
                <Badge variant="green">Paid</Badge>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-[#5C6B88]">Amount</span>
                <span className="text-sm font-bold text-[#1B2B4B]">₱{paidThisMonth.total.toLocaleString()}</span>
              </div>
              <ProgressBar value={100} variant="teal" size="sm" />
              <p className="text-[11px] text-[#5C6B88] mt-2">
                Paid via {paidThisMonth.method} · {formatDateDisplay(paidThisMonth.paid_date)}
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-[#5C6B88]">Status</span>
                <Badge variant={hasOverdue ? "red" : "amber"}>{hasOverdue ? "Overdue" : "Due"}</Badge>
              </div>
              <ProgressBar value={0} variant="amber" size="sm" />
              <p className="text-[11px] text-[#5C6B88] mt-2">Payment pending</p>
            </>
          )}
        </Card>

        {/* Lease status */}
        <Card padding>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5C6B88] mb-3">Lease Progress</p>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#5C6B88]">Status</span>
            {tenant.status === "active"   && <Badge variant="green">Active</Badge>}
            {tenant.status === "expiring" && <Badge variant="amber">Expiring</Badge>}
            {tenant.status === "overdue"  && <Badge variant="red">Overdue</Badge>}
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#5C6B88]">Expires</span>
            <span className="text-sm font-semibold text-[#1B2B4B]">{formatDateDisplay(tenant.lease_end)}</span>
          </div>
          <ProgressBar value={leasePct} variant="navy" size="sm" showValue />
        </Card>

        {/* Maintenance */}
        <Card padding>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5C6B88] mb-3">Maintenance</p>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#5C6B88]">Open tickets</span>
            <span className={`text-xl font-bold ${openRequests.length > 0 ? "text-amber-500" : "text-[#1D7B6E]"}`}>
              {openRequests.length}
            </span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#5C6B88]">Resolved</span>
            <span className="text-sm font-semibold text-[#1B2B4B]">
              {maintenance.filter((m) => m.status === "resolved").length}
            </span>
          </div>
          <Button
            variant="outline"
            size="xs"
            full
            onClick={() => onNavigate("maintenance")}
          >
            View Requests
          </Button>
        </Card>

      </div>

      {/* ── Two-col: Unit details + Recent activity ── */}
      <div className="grid grid-cols-2 gap-5">

        {/* Unit details */}
        <Card>
          <Card.Header
            title="Unit Details"
            action={
              <Button variant="ghost" size="xs" onClick={() => onNavigate("lease")}>
                View Lease →
              </Button>
            }
          />
          <Card.Body>
            <InfoRow label="Unit Number"      value={`Unit ${tenant.unit}`}         />
            <InfoRow label="Floor"            value={tenant.floor}                  />
            <InfoRow label="Unit Type"        value={tenant.type}                   />
            <InfoRow label="Area"             value="-" />
            <InfoRow label="Monthly Rent"     value={<span className="font-bold text-[#1B2B4B]">₱{tenant.rent.toLocaleString()}</span>} />
            <InfoRow label="Security Deposit" value={`₱${tenant.deposit.toLocaleString()}`} />
            <InfoRow label="Payment Method"   value={tenant.payment_method} border={false} />
          </Card.Body>
        </Card>

        {/* Recent activity */}
        <Card>
          <Card.Header title="Recent Activity" />
          <Card.Body flush>
            {[
              ...invoices.slice(0, 3).map(inv => ({
                type:    "payment" as const,
                title:   `${inv.period} rent`,
                sub:     inv.paid_date ? `Paid · ${formatDateDisplay(inv.paid_date)}` : `Due ${formatDateDisplay(inv.due_date)}`,
                amount:  `₱${inv.total.toLocaleString()}`,
                status:  inv.status,
              })),
              ...maintenance.slice(0, 2).map(m => ({
                type:    "maintenance" as const,
                title:   m.title,
                sub:     `${formatDateDisplay(m.created_at)}`,
                amount:  null,
                status:  m.status,
              })),
            ]
            .slice(0, 5)
            .map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-5 py-3.5 border-b border-[#1B2B4B]/5 last:border-0"
              >
                {/* Type dot */}
                <div className={[
                  "w-2 h-2 rounded-full flex-shrink-0",
                  item.type === "payment"
                    ? item.status === "paid" ? "bg-[#24A18F]" : "bg-amber-400"
                    : item.status === "resolved" ? "bg-[#24A18F]" : "bg-amber-400",
                ].join(" ")} />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1B2B4B] truncate">{item.title}</p>
                  <p className="text-xs text-[#5C6B88]">{item.sub}</p>
                </div>

                <div className="text-right flex-shrink-0">
                  {item.amount && (
                    <p className="text-sm font-semibold text-[#1B2B4B]">{item.amount}</p>
                  )}
                  <div className="mt-0.5">
                    {item.status === "paid"       && <Badge variant="green">Paid</Badge>}
                    {item.status === "due"        && <Badge variant="amber">Due</Badge>}
                    {item.status === "overdue"    && <Badge variant="red">Overdue</Badge>}
                    {item.status === "resolved"   && <Badge variant="green">Resolved</Badge>}
                    {item.status === "open"       && <Badge variant="red">Open</Badge>}
                    {item.status === "inprogress" && <Badge variant="amber">In Progress</Badge>}
                  </div>
                </div>
              </div>
            ))}
          </Card.Body>
        </Card>

      </div>

      {/* ── Quick actions ── */}
      <Card>
        <Card.Header title="Quick Actions" />
        <Card.Body>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Pay Rent",           sub: `₱${(nextInvoice?.total ?? 0).toLocaleString()} due ${formatDateDisplay(nextInvoice?.due_date)}`, id: "pay-rent",      accent: "bg-[#24A18F]/10 border-[#24A18F]/20 hover:bg-[#24A18F]/15" },
              { label: "View Billing",       sub: "Invoices & history",                                                   id: "billing",       accent: "bg-[#1B2B4B]/5  border-[#1B2B4B]/10 hover:bg-[#1B2B4B]/8"  },
              { label: "Report Issue",       sub: "Maintenance request",                                                  id: "maintenance",   accent: "bg-[#1B2B4B]/5  border-[#1B2B4B]/10 hover:bg-[#1B2B4B]/8"  },
              { label: "Message Admin",      sub: "Send a message",                                                       id: "messages",      accent: "bg-[#1B2B4B]/5  border-[#1B2B4B]/10 hover:bg-[#1B2B4B]/8"  },
            ].map(a => (
              <button
                key={a.id}
                onClick={() => onNavigate(a.id)}
                className={[
                  "rounded-xl border px-4 py-4 text-left transition-all",
                  a.accent,
                ].join(" ")}
              >
                <div className="w-8 h-8 rounded-lg bg-white/60 mb-3 flex items-center justify-center">
                  <Icon
                    name={
                      a.id === "pay-rent" ? "dollar-sign"
                        : a.id === "billing" ? "credit-card"
                        : a.id === "maintenance" ? "wrench"
                        : "message-square"
                    }
                    size={14}
                    className="text-[var(--rtms-navy)]"
                  />
                </div>
                <p className="text-sm font-semibold text-[#1B2B4B]">{a.label}</p>
                <p className="text-xs text-[#5C6B88] mt-0.5">{a.sub}</p>
              </button>
            ))}
          </div>
        </Card.Body>
      </Card>

    </div>
  )
}