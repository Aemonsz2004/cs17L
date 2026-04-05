import { router, usePage } from "@inertiajs/react"
import { useEffect, useMemo, useRef, useState } from "react"
import Badge from "../../components/Badge"
import Button from "../../components/Button"
import Card from "../../components/Card"
import InfoRow from "../../components/InfoRow"
import { Input, Select } from "../../components/Input"
import MetricCard from "../../components/MetricCard"
import Modal from "../../components/Modal"
import Table from "../../components/Table"
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
  if (s === "paid") {
    return <Badge variant="green">Paid</Badge>
  }

  if (s === "due") {
    return <Badge variant="amber">Due</Badge>
  }

  if (s === "overdue") {
    return <Badge variant="red">Overdue</Badge>
  }

  return null
}

const methodBadge = (m: string | null) => {
  if (!m) {
    return <span className="text-[#5C6B88]">-</span>
  }

  if (m === "GCash") {
    return <Badge variant="blue">GCash</Badge>
  }

  if (m === "Bank Transfer") {
    return <Badge variant="gray">Bank</Badge>
  }

  return <Badge variant="gray">Cash</Badge>
}

type BillingPageProps = {
  openAddSignal?: number
}

export default function BillingPage({ openAddSignal = 0 }: BillingPageProps) {
  const { invoices: invoiceRows, tenants: tenantRows } = usePage<{
    invoices?: Array<{
      id: number
      invoice_no: string
      tenant_id: number
      period: string
      rent: number
      utilities: number
      penalty: number
      total: number
      due_date: string
      paid_date: string | null
      method: "GCash" | "Bank Transfer" | "Cash" | null
      status: "paid" | "due" | "overdue"
      tenant?: { id: number; name: string; unit: string } | null
    }>
    tenants?: Array<{ id: number; name: string; unit: string }>
  }>().props

  const invoices = useMemo<Invoice[]>(
    () => (invoiceRows ?? []).map((invoice) => ({
      id: invoice.id,
      invoiceNo: invoice.invoice_no,
      tenantId: invoice.tenant_id,
      tenant: invoice.tenant?.name ?? `Tenant #${invoice.tenant_id}`,
      unit: invoice.tenant?.unit ?? "-",
      period: invoice.period,
      rent: invoice.rent,
      utilities: invoice.utilities,
      penalty: invoice.penalty,
      total: invoice.total,
      dueDate: invoice.due_date,
      paidDate: invoice.paid_date,
      method: invoice.method,
      status: invoice.status,
    })),
    [invoiceRows]
  )
  const [filterStatus, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Invoice | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const lastHandledSignal = useRef(openAddSignal)

  const [form, setForm] = useState({
    tenantId: String(tenantRows?.[0]?.id ?? 1),
    period: "",
    dueDate: "",
    rent: "",
    utilities: "",
    penalty: "",
    method: "GCash" as "GCash" | "Bank Transfer" | "Cash",
  })

  useEffect(() => {
    if (openAddSignal !== lastHandledSignal.current) {
      setAddOpen(true)
      lastHandledSignal.current = openAddSignal
    }
  }, [openAddSignal])

  const totals = useMemo(() => {
    const collected = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0)
    const pending = invoices.filter((i) => i.status === "due").reduce((s, i) => s + i.total, 0)
    const overdueAmt = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.total, 0)
    const totalBilled = invoices.reduce((s, i) => s + i.total, 0)
    return { collected, pending, overdueAmt, totalBilled }
  }, [invoices])

  const filtered = invoices.filter((i) => {
    const matchSearch = i.tenant.toLowerCase().includes(search.toLowerCase()) ||
      i.invoiceNo.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "all" || i.status === filterStatus
    return matchSearch && matchStatus
  })

  const markAsPaid = () => {
    if (!selected) return

    if (!window.confirm("Mark this invoice as paid?")) {
      return
    }

    router.patch(`/admin/billing/${selected.id}/mark-paid`)
  }

  const createInvoice = () => {
    const tenant = (tenantRows ?? []).find((t) => String(t.id) === form.tenantId)
    if (!tenant || !form.period || !form.dueDate || !form.rent) {
      return
    }

    if (!window.confirm("Generate this invoice?")) {
      return
    }

    router.post("/admin/billing", {
      tenant_id: Number(form.tenantId),
      period: form.period,
      due_date: form.dueDate,
      rent: Number(form.rent || 0),
      utilities: Number(form.utilities || 0),
      penalty: Number(form.penalty || 0),
      method: form.method,
      status: "due",
    })
  }

  const columns = [
    {
      key: "invoiceNo", label: "Invoice", width: 110,
      render: (v: unknown) => <span className="font-mono text-xs text-[#5C6B88]">{v as string}</span>,
    },
    {
      key: "tenant", label: "Tenant",
      render: (_: unknown, row: Invoice) => <span className="font-medium text-[#1B2B4B]">{row.tenant}</span>,
    },
    { key: "unit", label: "Unit", width: 70 },
    { key: "period", label: "Period" },
    {
      key: "total", label: "Total", align: "right" as const,
      render: (v: unknown) => <span className="font-semibold">P{(v as number).toLocaleString()}</span>,
    },
    {
      key: "dueDate", label: "Due Date",
      render: (v: unknown) => formatDateDisplay(v as string),
    },
    {
      key: "method", label: "Method",
      render: (v: unknown) => methodBadge(v as string | null),
    },
    {
      key: "status", label: "Status", align: "center" as const,
      render: (v: unknown) => statusBadge(v as string),
    },
    {
      key: "id", label: "", width: 80, align: "right" as const,
      render: (_: unknown, row: Invoice) => (
        <Button variant="ghost" size="xs" onClick={(e) => { e.stopPropagation(); setSelected(row); setDetailOpen(true) }}>
          View
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total Billed" value={`P${totals.totalBilled.toLocaleString()}`} sub="Current dataset" />
        <MetricCard label="Collected" value={`P${totals.collected.toLocaleString()}`} sub={`${invoices.filter((i) => i.status === "paid").length} invoices`} trend="up" />
        <MetricCard label="Pending" value={`P${totals.pending.toLocaleString()}`} sub={`${invoices.filter((i) => i.status === "due").length} invoices`} trend="down" iconBg="bg-amber-50 text-amber-500" />
        <MetricCard label="Overdue" value={`P${totals.overdueAmt.toLocaleString()}`} sub={`${invoices.filter((i) => i.status === "overdue").length} invoices`} trend="down" iconBg="bg-red-50 text-red-400" />
      </div>

      <Card>
        <Card.Header
          title="Invoices"
          action={
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search tenant or invoice..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56"
              />
              <Select value={filterStatus} onChange={(e) => setFilter(e.target.value)} className="w-36">
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="due">Due</option>
                <option value="overdue">Overdue</option>
              </Select>
              <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>+ New Invoice</Button>
            </div>
          }
        />

        <Table
          columns={columns as never}
          data={filtered as never}
          keyField={"id" as never}
          emptyText="No invoices match your search."
          onRowClick={(row: any) => { setSelected(row as Invoice); setDetailOpen(true) }}
        />
        <Card.Footer>Showing {filtered.length} of {invoices.length} invoices</Card.Footer>
      </Card>

      {selected && (
        <Modal
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          title="Invoice Detail"
          size="md"
          footer={
            <>
              <Button variant="ghost" onClick={() => setDetailOpen(false)}>Close</Button>
              {selected.status !== "paid" && <Button variant="primary" onClick={markAsPaid}>Mark as Paid</Button>}
            </>
          }
        >
          <div className="flex items-start justify-between pb-4 mb-4 border-b border-[#1B2B4B]/8">
            <div>
              <p className="text-xs text-[#5C6B88] mb-1">Invoice Number</p>
              <p className="text-lg font-bold text-[#1B2B4B] font-mono">{selected.invoiceNo}</p>
            </div>
            {statusBadge(selected.status)}
          </div>

          <InfoRow label="Tenant" value={selected.tenant} />
          <InfoRow label="Unit" value={selected.unit} />
          <InfoRow label="Period" value={selected.period} />
          <InfoRow label="Due Date" value={formatDateDisplay(selected.dueDate)} />
          {selected.paidDate && <InfoRow label="Paid Date" value={formatDateDisplay(selected.paidDate)} />}
          {selected.method && <InfoRow label="Method" value={methodBadge(selected.method)} />}

          <div className="mt-4 pt-4 border-t border-[#1B2B4B]/8 space-y-0">
            <InfoRow label="Base Rent" value={`P${selected.rent.toLocaleString()}`} />
            <InfoRow label="Utilities" value={`P${selected.utilities.toLocaleString()}`} />
            {selected.penalty > 0 && (
              <InfoRow label="Late Penalty" value={<span className="text-red-500 font-semibold">P{selected.penalty.toLocaleString()}</span>} />
            )}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1B2B4B]/8">
            <span className="text-sm font-bold text-[#1B2B4B]">Total Due</span>
            <span className="text-xl font-bold text-[#1B2B4B]">P{selected.total.toLocaleString()}</span>
          </div>
        </Modal>
      )}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Create New Invoice"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={createInvoice}>Generate Invoice</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Select label="Tenant" value={form.tenantId} onChange={(e) => setForm((f) => ({ ...f, tenantId: e.target.value }))} full>
              {(tenantRows ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} - Unit {t.unit}
                </option>
              ))}
            </Select>
          </div>
          <Input label="Billing Period" placeholder="e.g. April 2026" value={form.period} onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))} full />
          <Input label="Due Date" type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} full />
          <Input label="Rent Amount" placeholder="0.00" type="number" value={form.rent} onChange={(e) => setForm((f) => ({ ...f, rent: e.target.value }))} full />
          <Input label="Utilities" placeholder="0.00" type="number" value={form.utilities} onChange={(e) => setForm((f) => ({ ...f, utilities: e.target.value }))} full />
          <Input label="Penalty" placeholder="0.00" type="number" value={form.penalty} onChange={(e) => setForm((f) => ({ ...f, penalty: e.target.value }))} full />
          <Select label="Preferred Method" value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value as "GCash" | "Bank Transfer" | "Cash" }))} full>
            <option value="GCash">GCash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cash">Cash</option>
          </Select>
        </div>
      </Modal>
    </div>
  )
}
