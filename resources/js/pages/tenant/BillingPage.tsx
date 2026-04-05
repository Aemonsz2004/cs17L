// src/pages/tenant/BillingPage.tsx
import { useState } from "react"
import { usePage } from "@inertiajs/react"
import Badge       from "../../components/Badge"
import Button      from "../../components/Button"
import Card        from "../../components/Card"
import InfoRow     from "../../components/InfoRow"
import Modal       from "../../components/Modal"
import ProgressBar from "../../components/ProgressBar"
import { formatDateDisplay } from "../../lib/date"

type Invoice = {
  id: number
  invoiceNo: string
  tenantId: number
  tenant: string
  unit: string
  period: string
  rent: number
  utilities: number
  penalty: number
  total: number
  dueDate: string
  paidDate: string | null
  method: "GCash" | "Bank Transfer" | "Cash" | null
  status: "paid" | "due" | "overdue"
}

const statusBadge = (s: string) => {
  if (s === "paid")    return <Badge variant="green">Paid</Badge>
  if (s === "due")     return <Badge variant="amber">Due</Badge>
  if (s === "overdue") return <Badge variant="red">Overdue</Badge>
  return null
}

const methodBadge = (m: string | null) => {
  if (!m) return <span className="text-[#5C6B88]">—</span>
  if (m === "GCash")         return <Badge variant="blue">GCash</Badge>
  if (m === "Bank Transfer") return <Badge variant="gray">Bank Transfer</Badge>
  return <Badge variant="gray">Cash</Badge>
}

// ─────────────────────────────────────────────────────────────────────────────

export default function TenantBillingPage({
  onPayRent,
}: {
  onPayRent: () => void
}) {
  const { invoices } = usePage<{ invoices?: Array<{
    id: number
    invoice_no: string
    period: string
    rent: number
    utilities: number
    penalty: number
    total: number
    due_date: string
    paid_date: string | null
    method: "GCash" | "Bank Transfer" | "Cash" | null
    status: "paid" | "due" | "overdue"
    tenant_id: number
  }> }>().props

  const mappedInvoices: Invoice[] = (invoices ?? []).map((invoice) => ({
    id: invoice.id,
    invoiceNo: invoice.invoice_no,
    tenantId: invoice.tenant_id,
    tenant: "Current Tenant",
    unit: "-",
    period: invoice.period,
    rent: invoice.rent,
    utilities: invoice.utilities,
    penalty: invoice.penalty,
    total: invoice.total,
    dueDate: invoice.due_date,
    paidDate: invoice.paid_date,
    method: invoice.method,
    status: invoice.status,
  }))

  const history = mappedInvoices
  const nextInvoice = history.find((invoice) => invoice.status !== "paid")

  const [search, setSearch] = useState("")
  const [selected, setSelected]   = useState<Invoice | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const totalPaid       = history.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0)
  const totalOutstanding = history.filter(i => i.status !== "paid").reduce((s, i) => s + i.total, 0)
  const paidCount       = history.filter(i => i.status === "paid").length

  const q = search.trim().toLowerCase()
  const visibleHistory = q
    ? history.filter((invoice) => {
      const due = formatDateDisplay(invoice.dueDate, "").toLowerCase()
      const paid = formatDateDisplay(invoice.paidDate, "").toLowerCase()
      return [
        invoice.invoiceNo,
        invoice.period,
        invoice.status,
        invoice.method ?? "",
        due,
        paid,
      ].join(" ").toLowerCase().includes(q)
    })
    : history

  const openInvoice = (inv: Invoice) => {
    setSelected(inv)
    setModalOpen(true)
  }

  return (
    <div className="space-y-5 max-w-4xl">

      {history.length === 0 && (
        <Card>
          <Card.Body>
            <div className="text-center py-8">
              <p className="text-lg font-bold text-[#1B2B4B]">No invoices yet</p>
              <p className="text-sm text-[#5C6B88] mt-1">Your billing history will appear once admin creates your first invoice.</p>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* ── Summary row ── */}
      {nextInvoice && (
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-[#1B2B4B]/10 rounded-xl p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5C6B88] mb-1">Total Paid (YTD)</p>
          <p className="text-2xl font-bold text-[#1D7B6E]">₱{totalPaid.toLocaleString()}</p>
          <p className="text-xs text-[#5C6B88] mt-1">{paidCount} invoices settled</p>
        </div>

        <div className={[
          "border rounded-xl p-5 shadow-sm",
          totalOutstanding > 0 ? "bg-red-50 border-red-200" : "bg-white border-[#1B2B4B]/10",
        ].join(" ")}>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${totalOutstanding > 0 ? "text-red-400" : "text-[#5C6B88]"}`}>
            Outstanding
          </p>
          <p className={`text-2xl font-bold ${totalOutstanding > 0 ? "text-red-600" : "text-[#1B2B4B]"}`}>
            ₱{totalOutstanding.toLocaleString()}
          </p>
          <p className={`text-xs mt-1 ${totalOutstanding > 0 ? "text-red-400" : "text-[#5C6B88]"}`}>
            {history.filter(i => i.status !== "paid").length} unpaid
          </p>
        </div>

        <div className="bg-white border border-[#1B2B4B]/10 rounded-xl p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5C6B88] mb-1">Next Due</p>
          <p className="text-2xl font-bold text-[#1B2B4B]">₱{nextInvoice.total.toLocaleString()}</p>
          <p className="text-xs text-[#5C6B88] mt-1">{formatDateDisplay(nextInvoice.dueDate)} · unpaid</p>
          <Button variant="primary" size="xs" className="mt-2" onClick={onPayRent}>Pay Now</Button>
        </div>
      </div>
      )}

      {/* ── Upcoming invoice ── */}
      {nextInvoice && (
      <Card>
        <Card.Header title={`Upcoming — ${nextInvoice.period}`} action={<Badge variant="amber">Unpaid</Badge>} />
        <Card.Body>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <InfoRow label="Invoice"      value={nextInvoice.invoiceNo}                                />
              <InfoRow label="Base Rent"    value={`₱${nextInvoice.rent.toLocaleString()}`}             />
              <InfoRow label="Utilities"    value={`₱${nextInvoice.utilities.toLocaleString()}`}        />
              <InfoRow label="Penalty"      value={nextInvoice.penalty > 0 ? `₱${nextInvoice.penalty.toLocaleString()}` : "None"} border={false} />
            </div>
            <div className="flex flex-col items-end justify-between">
              <div className="text-right">
                <p className="text-[10px] text-[#5C6B88] uppercase tracking-wider">Total Due</p>
                <p className="text-3xl font-bold text-[#1B2B4B]">₱{nextInvoice.total.toLocaleString()}</p>
                <p className="text-xs text-[#5C6B88] mt-1">Due {formatDateDisplay(nextInvoice.dueDate)}</p>
              </div>
              <div className="w-full mt-4">
                <ProgressBar
                  value={nextInvoice.status === "overdue" ? 0 : 10}
                  max={30}
                  variant="amber"
                  size="sm"
                  label={nextInvoice.status === "overdue" ? "Overdue" : "Payment pending"}
                />
              </div>
              <Button variant="primary" size="md" full className="mt-4" onClick={onPayRent}>
                Pay ₱{nextInvoice.total.toLocaleString()}
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>
      )}

      {/* ── Invoice history ── */}
      <Card>
        <Card.Header
          title="Invoice History"
          action={
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search invoice, period, status..."
              className="h-9 w-64 rounded-lg border border-[#1B2B4B]/15 bg-white px-3 text-sm text-[#1B2B4B] outline-none transition focus:border-[#1B2B4B]/35"
            />
          }
        />
        <Card.Body flush>
          {visibleHistory.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#5C6B88]">No matching invoices found.</div>
          ) : (
            visibleHistory.map(inv => (
            <button
              key={inv.id}
              onClick={() => openInvoice(inv)}
              className="w-full flex items-center gap-4 px-5 py-4 border-b border-[#1B2B4B]/5 last:border-0 hover:bg-[#FAF8F4] transition-colors text-left"
            >
              {/* Status stripe */}
              <div className={[
                "w-1 h-10 rounded-full flex-shrink-0",
                inv.status === "paid"    ? "bg-[#24A18F]" :
                inv.status === "due"     ? "bg-amber-400"  :
                                           "bg-red-400",
              ].join(" ")} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-[#1B2B4B]">{inv.period}</p>
                  <span className="text-xs text-[#5C6B88] font-mono">{inv.invoiceNo}</span>
                </div>
                <p className="text-xs text-[#5C6B88]">
                  Due {formatDateDisplay(inv.dueDate)}
                  {inv.paidDate && <span className="text-[#24A18F]"> · Paid {formatDateDisplay(inv.paidDate)}</span>}
                  {inv.penalty > 0 && <span className="text-red-400"> · +₱{inv.penalty.toLocaleString()} penalty</span>}
                </p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {methodBadge(inv.method)}
                <div className="text-right min-w-[80px]">
                  <p className="text-sm font-bold text-[#1B2B4B]">₱{inv.total.toLocaleString()}</p>
                  <div className="mt-1">{statusBadge(inv.status)}</div>
                </div>
              </div>
            </button>
            ))
          )}
        </Card.Body>
        <Card.Footer>
          {visibleHistory.length} of {history.length} invoices · ₱{totalPaid.toLocaleString()} paid total
        </Card.Footer>
      </Card>

      {/* ── Invoice Detail Modal ── */}
      {selected && (
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Invoice Detail"
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Close</Button>
              {selected.status !== "paid" && (
                <Button variant="primary" onClick={() => { setModalOpen(false); onPayRent() }}>
                  Pay Now
                </Button>
              )}
            </>
          }
        >
          {/* Status banner */}
          <div className={[
            "rounded-xl p-4 mb-5 flex items-center justify-between",
            selected.status === "paid"    ? "bg-[#1D7B6E]/8 border border-[#1D7B6E]/20" :
            selected.status === "due"     ? "bg-amber-50 border border-amber-200" :
                                            "bg-red-50 border border-red-200",
          ].join(" ")}>
            <div>
              <p className="text-xs text-[#5C6B88] mb-0.5">{selected.invoiceNo}</p>
              <p className="text-xl font-bold text-[#1B2B4B]">₱{selected.total.toLocaleString()}</p>
            </div>
            {statusBadge(selected.status)}
          </div>

          <InfoRow label="Period"     value={selected.period}   />
          <InfoRow label="Due Date"   value={formatDateDisplay(selected.dueDate)}  />
          {selected.paidDate && <InfoRow label="Paid Date" value={formatDateDisplay(selected.paidDate)} />}
          {selected.method   && <InfoRow label="Method"    value={methodBadge(selected.method)} />}

          <div className="mt-4 pt-4 border-t border-[#1B2B4B]/8">
            <InfoRow label="Base Rent"  value={`₱${selected.rent.toLocaleString()}`}      />
            <InfoRow label="Utilities"  value={`₱${selected.utilities.toLocaleString()}`} />
            {selected.penalty > 0 && (
              <InfoRow label="Late Penalty" value={<span className="text-red-500 font-semibold">+₱{selected.penalty.toLocaleString()}</span>} />
            )}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1B2B4B]/8">
              <span className="text-sm font-bold text-[#1B2B4B]">Total</span>
              <span className="text-lg font-bold text-[#1B2B4B]">₱{selected.total.toLocaleString()}</span>
            </div>
          </div>
        </Modal>
      )}

    </div>
  )
}