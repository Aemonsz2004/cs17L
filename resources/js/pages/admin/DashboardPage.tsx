import { useMemo } from "react"
import { usePage } from "@inertiajs/react"
import Badge from "../../components/Badge"
import Button from "../../components/Button"
import Card from "../../components/Card"
import MetricCard from "../../components/MetricCard"
import Table from "../../components/Table"
import { formatDateDisplay } from "../../lib/date"

type TenantRow = {
  id: number
  name: string
  unit: string
  lease_end: string
  status: "active" | "expiring" | "overdue"
}

type InvoiceRow = {
  id: number
  invoice_no: string
  period: string
  total: number
  method: "GCash" | "Bank Transfer" | "Cash" | null
  status: "paid" | "due" | "overdue"
  tenant?: { name: string; unit: string } | null
}

type MaintenanceRow = {
  id: number
  title: string
  unit: string
  tenant: string
  priority: "high" | "medium" | "low"
  status: "open" | "inprogress" | "resolved"
  created_at?: string
}

type DashboardPageProps = {
  onNavigate?: (page: "tenants" | "billing" | "maintenance") => void
}

const statusBadge = (status: InvoiceRow["status"]) => {
  if (status === "paid") return <Badge variant="green">Paid</Badge>
  if (status === "due") return <Badge variant="amber">Due</Badge>
  return <Badge variant="red">Overdue</Badge>
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { tenants = [], invoices = [], maintenance = [], units_count = 0 } = usePage<{
    tenants?: TenantRow[]
    invoices?: InvoiceRow[]
    maintenance?: MaintenanceRow[]
    units_count?: number
  }>().props

  const metrics = useMemo(() => {
    const totalUnits = Math.max(1, units_count)
    const occupied = tenants.length
    const occupancyPct = Math.round((occupied / totalUnits) * 100)
    const collected = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.total, 0)
    const pending = invoices.filter((i) => i.status !== "paid").reduce((sum, i) => sum + i.total, 0)
    const openRequests = maintenance.filter((m) => m.status !== "resolved").length

    return { totalUnits, occupied, occupancyPct, collected, pending, openRequests }
  }, [tenants, invoices, maintenance, units_count])

  const invoiceColumns = [
    { key: "invoice_no", label: "Invoice" },
    { key: "period", label: "Period" },
    {
      key: "tenant",
      label: "Tenant",
      render: (_: unknown, row: InvoiceRow) => row.tenant?.name ?? "-",
    },
    {
      key: "total",
      label: "Amount",
      align: "right" as const,
      render: (value: unknown) => `P${Number(value).toLocaleString()}`,
    },
    {
      key: "status",
      label: "Status",
      align: "center" as const,
      render: (value: unknown) => statusBadge(value as InvoiceRow["status"]),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Occupancy Rate" value={`${metrics.occupancyPct}%`} sub={`${metrics.occupied} of ${metrics.totalUnits} units`} />
        <MetricCard label="Collected" value={`P${metrics.collected.toLocaleString()}`} sub="Paid invoices" trend="up" />
        <MetricCard label="Pending" value={`P${metrics.pending.toLocaleString()}`} sub="Due and overdue invoices" trend="down" iconBg="bg-amber-50 text-amber-500" />
        <MetricCard label="Open Requests" value={metrics.openRequests} sub="Maintenance requests" iconBg="bg-[#1B2B4B]/8 text-[#5C6B88]" />
      </div>

      <Card>
        <Card.Header title="Recent Invoices" action={<Button variant="outline" size="sm" onClick={() => onNavigate?.("billing")}>View Billing</Button>} />
        <Table columns={invoiceColumns as never} data={invoices.slice(0, 6) as never} keyField={"id" as never} emptyText="No invoices yet." />
      </Card>

      <Card>
        <Card.Header title="Maintenance Requests" action={<Button variant="outline" size="sm" onClick={() => onNavigate?.("maintenance")}>View Maintenance</Button>} />
        <Card.Body flush>
          {maintenance.length === 0 ? (
            <div className="p-5 text-sm text-[#5C6B88]">No maintenance requests yet.</div>
          ) : (
            maintenance.slice(0, 6).map((request) => (
              <div key={request.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-[#1B2B4B]/5 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1B2B4B]">{request.title}</p>
                  <p className="text-xs text-[#5C6B88]">Unit {request.unit} · {request.tenant} · {formatDateDisplay(request.created_at, "-")}</p>
                </div>
                <Badge variant={request.priority === "high" ? "red" : request.priority === "medium" ? "amber" : "gray"}>{request.priority}</Badge>
                <Badge variant={request.status === "resolved" ? "green" : request.status === "inprogress" ? "amber" : "red"}>{request.status}</Badge>
              </div>
            ))
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Header title="Expiring Leases" action={<Button variant="outline" size="sm" onClick={() => onNavigate?.("tenants")}>View Tenants</Button>} />
        <Card.Body flush>
          {tenants.filter((tenant) => tenant.status === "expiring").length === 0 ? (
            <div className="p-5 text-sm text-[#5C6B88]">No expiring leases right now.</div>
          ) : (
            tenants
              .filter((tenant) => tenant.status === "expiring")
              .map((tenant) => (
                <div key={tenant.id} className="flex items-center justify-between px-5 py-3.5 border-b border-[#1B2B4B]/5 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-[#1B2B4B]">{tenant.name}</p>
                    <p className="text-xs text-[#5C6B88]">Unit {tenant.unit} · Ends {formatDateDisplay(tenant.lease_end)}</p>
                  </div>
                  <Badge variant="amber">Expiring</Badge>
                </div>
              ))
          )}
        </Card.Body>
      </Card>
    </div>
  )
}
