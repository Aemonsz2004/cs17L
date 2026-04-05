// src/pages/tenant/LeasePage.tsx
import Card        from "../../components/Card"
import Badge       from "../../components/Badge"
import Button      from "../../components/Button"
import InfoRow     from "../../components/InfoRow"
import ProgressBar from "../../components/ProgressBar"
import { formatDateDisplay } from "../../lib/date"
import { useMemo } from "react"

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
  period: string
  rent?: number
  status: "paid" | "due" | "overdue"
}

function leaseProgressPct(start: string, end: string): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const now = new Date()
  const total = Math.max(1, endDate.getTime() - startDate.getTime())
  const elapsed = Math.max(0, Math.min(total, now.getTime() - startDate.getTime()))
  return Math.min(100, Math.round((elapsed / total) * 100))
}

const TERMS = (unitType: string) => [
  { label: "Late Payment Penalty",  value: "2% of rent per week overdue"          },
  { label: "Notice Period",         value: "30 days written notice required"       },
  { label: "Permitted Use",         value: unitType + " purposes only"  },
  { label: "Sub-letting",           value: "Strictly not allowed"                  },
  { label: "Renewal Option",        value: "Yes — notify 60 days before expiry"   },
  { label: "Alterations",          value: "Require written admin approval"         },
  { label: "Utilities",             value: "Included in monthly rent"              },
  { label: "Business Hours Access", value: "24/7 with building access card"       },
]

export default function LeasePage({ tenant, invoices = [] }: { tenant?: TenantProfile; invoices?: TenantInvoice[] }) {
  const pct = leaseProgressPct(tenant?.lease_start ?? new Date().toISOString(), tenant?.lease_end ?? new Date().toISOString())
  const history = useMemo(() => invoices.map((invoice) => ({
    period: invoice.period,
    rent: invoice.rent ?? 0,
    status: invoice.status === "paid" ? "completed" : "active",
  })), [invoices])

  if (!tenant) {
    return (
      <Card>
        <Card.Body>
          <p className="text-sm text-[#5C6B88]">Lease details are unavailable.</p>
        </Card.Body>
      </Card>
    )
  }

  const downloadLeasePdf = () => {
    const printWindow = window.open("", "_blank", "width=900,height=700")
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Lease Agreement - ${tenant.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #2f261f; }
            h1 { margin-bottom: 8px; }
            .meta { color: #6f6258; margin-bottom: 18px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            td { padding: 8px 10px; border-bottom: 1px solid #e8ddcf; }
            td:first-child { color: #6f6258; width: 35%; }
          </style>
        </head>
        <body>
          <h1>Lease Agreement</h1>
          <div class="meta">${tenant.name} · Unit ${tenant.unit}</div>
          <table>
            <tr><td>Lease Start</td><td>${formatDateDisplay(tenant.lease_start)}</td></tr>
            <tr><td>Lease End</td><td>${formatDateDisplay(tenant.lease_end)}</td></tr>
            <tr><td>Monthly Rent</td><td>P${tenant.rent.toLocaleString()}</td></tr>
            <tr><td>Deposit</td><td>P${tenant.deposit.toLocaleString()}</td></tr>
            <tr><td>Payment Method</td><td>${tenant.payment_method}</td></tr>
          </table>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <div className="space-y-5 max-w-4xl">

      {/* ── Hero card ── */}
      <Card>
        <Card.Body>
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-[#1B2B4B]">Lease Agreement</h2>
                {tenant.status === "active"   && <Badge variant="green">Active</Badge>}
                {tenant.status === "expiring" && <Badge variant="amber">Expiring Soon</Badge>}
                {tenant.status === "overdue"  && <Badge variant="red">Overdue</Badge>}
              </div>
              <p className="text-sm text-[#5C6B88]">
                {tenant.name} · Unit {tenant.unit} · {tenant.type}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={downloadLeasePdf}>Download PDF</Button>
          </div>

          {/* Timeline */}
          <div className="mb-2">
            <div className="flex justify-between text-xs text-[#5C6B88] mb-2">
              <span className="font-medium text-[#1B2B4B]">{formatDateDisplay(tenant.lease_start)}</span>
              <span>{pct}% of lease elapsed</span>
              <span className="font-medium text-[#1B2B4B]">{formatDateDisplay(tenant.lease_end)}</span>
            </div>
            <div className="relative h-3 bg-[#EDE5D8] rounded-full overflow-visible">
              <div
                className="h-full bg-[#24A18F] rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-[#24A18F] rounded-full shadow"
                style={{ left: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#5C6B88] mt-1.5">
              <span>Lease start</span>
              <span className="text-[#24A18F] font-semibold">Today — Mar 2026</span>
              <span>Lease end</span>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* ── Two-col: Lease details + Financials ── */}
      <div className="grid grid-cols-2 gap-5">

        <Card>
          <Card.Header title="Lease Details" />
          <Card.Body>
            <InfoRow label="Tenant"           value={tenant.name}      />
            <InfoRow label="Unit Number"      value={`Unit ${tenant.unit}`} />
            <InfoRow label="Floor"            value={tenant.floor}     />
            <InfoRow label="Unit Type"        value={tenant.type}      />
            <InfoRow label="Lease Start"      value={formatDateDisplay(tenant.lease_start)} />
            <InfoRow
              label="Lease End"
              value={
                <span className={tenant.status === "expiring" ? "text-amber-600 font-semibold" : ""}>
                  {formatDateDisplay(tenant.lease_end)}
                </span>
              }
            />
            <InfoRow label="Contract Length"  value="4 years 11 months"  border={false} />
          </Card.Body>
        </Card>

        <Card>
          <Card.Header title="Financial Terms" />
          <Card.Body>
            <InfoRow label="Monthly Rent"     value={<span className="font-bold text-[#1B2B4B]">₱{tenant.rent.toLocaleString()}/mo</span>} />
            <InfoRow label="Security Deposit" value={`₱${tenant.deposit.toLocaleString()}`} />
            <InfoRow label="Payment Method"   value={tenant.payment_method} />
            <InfoRow label="Payment Due"      value="10th of every month"  />
            <InfoRow label="Utilities"        value="Included"             />
            <InfoRow label="Late Penalty"     value="2% per week"          />
            <InfoRow label="Annual Escalation"value="Up to 5% per renewal" border={false} />
          </Card.Body>
        </Card>

      </div>

      {/* ── Key terms ── */}
      <Card>
        <Card.Header title="Key Terms & Conditions" />
        <Card.Body>
          <div className="grid grid-cols-2 gap-x-8">
            {TERMS(tenant.type).map((t, i) => (
              <InfoRow
                key={t.label}
                label={t.label}
                value={t.value}
                border={i < TERMS.length - 2}
              />
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* ── Lease history ── */}
      <Card>
        <Card.Header title="Lease & Renewal History" />
        <Card.Body flush>
          {history.map((h, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-5 py-4 border-b border-[#1B2B4B]/5 last:border-0"
            >
              {/* Timeline dot */}
              <div className="flex flex-col items-center gap-1">
                <div className={[
                  "w-3 h-3 rounded-full border-2",
                  h.status === "active"
                    ? "bg-[#24A18F] border-[#24A18F]"
                    : "bg-white border-[#1B2B4B]/20",
                ].join(" ")} />
                {i < history.length - 1 && (
                  <div className="w-px h-6 bg-[#1B2B4B]/10" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#1B2B4B]">{h.period}</p>
                <p className="text-xs text-[#5C6B88]">₱{h.rent.toLocaleString()}/mo</p>
              </div>
              {h.status === "active"    && <Badge variant="green">Current</Badge>}
              {h.status === "completed" && <Badge variant="gray">Completed</Badge>}
            </div>
          ))}
        </Card.Body>
      </Card>

      {/* ── Expiring banner ── */}
      {tenant.status === "expiring" && (
        <div className="flex items-center gap-4 p-5 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            {/* warning icon slot */}
            <span className="text-amber-500 font-bold text-lg">!</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-700">Your lease is expiring soon</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Your current lease ends on {formatDateDisplay(tenant.lease_end)}. Contact the admin to discuss renewal terms.
            </p>
          </div>
          <Button variant="primary" size="sm">Request Renewal</Button>
        </div>
      )}

    </div>
  )
}