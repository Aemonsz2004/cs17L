import { router, usePage } from "@inertiajs/react"
import { useEffect, useRef, useState } from "react"
import Avatar from "../../components/Avatar"
import Badge from "../../components/Badge"
import Button from "../../components/Button"
import Card from "../../components/Card"
import InfoRow from "../../components/InfoRow"
import { Input, Select, Textarea } from "../../components/Input"
import Modal from "../../components/Modal"
import Table from "../../components/Table"
import { formatDateDisplay } from "../../lib/date"

type Tenant = {
  id: number
  name: string
  initials: string
  contact: string
  phone: string
  email: string
  unit: string
  floor: "GF" | "1F" | "2F" | "3F"
  type: "Office" | "Retail" | "Medical"
  rent: number
  deposit: number
  leaseStart: string
  leaseEnd: string
  paymentMethod: "GCash" | "Bank Transfer" | "Cash"
  status: "active" | "expiring" | "overdue"
}

type UnitOption = {
  id: number
  number: string
  floor: "GF" | "1F" | "2F" | "3F"
  type: "Office" | "Retail" | "Medical"
  base_rent: number
  status: "occupied" | "vacant" | "expiring" | "overdue"
  tenant_id: number | null
}

const statusBadge = (s: string) => {
  if (s === "active") return <Badge variant="green">Active</Badge>
  if (s === "expiring") return <Badge variant="amber">Expiring</Badge>
  if (s === "overdue") return <Badge variant="red">Overdue</Badge>
  return null
}

const methodBadge = (m: string) =>
  m === "GCash" ? <Badge variant="blue">GCash</Badge>
  : m === "Bank Transfer" ? <Badge variant="gray">Bank</Badge>
  : <Badge variant="gray">Cash</Badge>

type TenantsPageProps = {
  openAddSignal?: number
}

export default function TenantsPage({ openAddSignal = 0 }: TenantsPageProps) {
  const { tenants: tenantRows, invoices: invoiceRows, units: unitRows, flash } = usePage<{
    tenants?: Array<{
      id: number
      name: string
      initials: string
      contact: string
      phone: string
      email: string
      unit: string
      floor: "GF" | "1F" | "2F" | "3F"
      type: "Office" | "Retail" | "Medical"
      rent: number
      deposit: number
      lease_start: string
      lease_end: string
      payment_method: "GCash" | "Bank Transfer" | "Cash"
      status: "active" | "expiring" | "overdue"
    }>
    invoices?: Array<{
      id: number
      invoice_no: string
      tenant_id: number
      period: string
      total: number
      status: "paid" | "due" | "overdue"
    }>
    units?: UnitOption[]
    flash?: {
      success?: string | null
      error?: string | null
      tenant_credentials?: {
        name: string
        email: string
        temp_password: string
      } | null
    }
  }>().props

  const mappedTenants: Tenant[] = (tenantRows ?? []).map((tenant) => ({
    id: tenant.id,
    name: tenant.name,
    initials: tenant.initials,
    contact: tenant.contact,
    phone: tenant.phone,
    email: tenant.email,
    unit: tenant.unit,
    floor: tenant.floor,
    type: tenant.type,
    rent: tenant.rent,
    deposit: tenant.deposit,
    leaseStart: tenant.lease_start,
    leaseEnd: tenant.lease_end,
    paymentMethod: tenant.payment_method,
    status: tenant.status,
  }))

  const availableUnits = (unitRows ?? []).filter((unit) => unit.status === "vacant" && unit.tenant_id === null)
  const defaultUnit = availableUnits[0]

  const [tenants, setTenants] = useState<Tenant[]>(mappedTenants)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilter] = useState("all")
  const [selected, setSelected] = useState<Tenant | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const [addForm, setAddForm] = useState({
    name: "",
    contact: "",
    phone: "",
    email: "",
    unit: defaultUnit?.number ?? "",
    floor: (defaultUnit?.floor ?? "GF") as Tenant["floor"],
    type: (defaultUnit?.type ?? "Office") as Tenant["type"],
    rent: String(defaultUnit?.base_rent ?? ""),
    paymentMethod: "GCash" as Tenant["paymentMethod"],
    leaseStart: "",
    leaseEnd: "",
    notes: "",
  })

  const [editForm, setEditForm] = useState<Partial<Tenant>>({})
  const lastHandledSignal = useRef(openAddSignal)
  const credentials = flash?.tenant_credentials ?? null
  const currentCredentialKey = credentials
    ? `${credentials.email}:${credentials.temp_password}`
    : null
  const [dismissedCredentialKey, setDismissedCredentialKey] = useState<string | null>(null)
  const credentialsOpen = Boolean(credentials) && dismissedCredentialKey !== currentCredentialKey

  const credentialMessage = credentials
    ? `Hi! Your Pandarawan RTMS account is ready. Email: ${credentials.email} / Temp password: ${credentials.temp_password} - please log in and change your password.`
    : ""

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      window.alert("Copied to clipboard.")
    } catch {
      window.prompt("Copy this text:", text)
    }
  }

  useEffect(() => {
    setTenants(mappedTenants)
  }, [tenantRows])

  useEffect(() => {
    const current = availableUnits.find((unit) => unit.number === addForm.unit)

    if (current) {
      return
    }

    const first = availableUnits[0]

    setAddForm((prev) => ({
      ...prev,
      unit: first?.number ?? "",
      floor: (first?.floor ?? "GF") as Tenant["floor"],
      type: (first?.type ?? "Office") as Tenant["type"],
      rent: String(first?.base_rent ?? ""),
    }))
  }, [unitRows, availableUnits, addForm.unit])

  useEffect(() => {
    if (openAddSignal !== lastHandledSignal.current) {
      setAddOpen(true)
      lastHandledSignal.current = openAddSignal
    }
  }, [openAddSignal])

  const filtered = tenants.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.unit.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "all" || t.status === filterStatus
    return matchSearch && matchStatus
  })

  const tenantInvoices = selected
    ? (invoiceRows ?? [])
      .filter((invoice) => invoice.tenant_id === selected.id)
      .slice(0, 4)
      .map((invoice) => ({
        id: invoice.id,
        invoiceNo: invoice.invoice_no,
        period: invoice.period,
        total: invoice.total,
        status: invoice.status,
      }))
    : []

  const columns = [
    {
      key: "name", label: "Tenant",
      render: (_: unknown, row: Tenant) => (
        <div className="flex items-center gap-2.5">
          <Avatar initials={row.initials} name={row.name} size="sm" />
          <div>
            <p className="font-medium text-[#1B2B4B]">{row.name}</p>
            <p className="text-xs text-[#5C6B88]">{row.contact}</p>
          </div>
        </div>
      ),
    },
    { key: "unit", label: "Unit", width: 70 },
    { key: "type", label: "Type" },
    {
      key: "leaseEnd", label: "Lease End",
      render: (v: unknown) => formatDateDisplay(v as string),
    },
    {
      key: "rent", label: "Monthly Rent", align: "right" as const,
      render: (v: unknown) => <span className="font-semibold">P{(v as number).toLocaleString()}</span>,
    },
    {
      key: "paymentMethod", label: "Method",
      render: (v: unknown) => methodBadge(v as string),
    },
    {
      key: "status", label: "Status", align: "center" as const,
      render: (v: unknown) => statusBadge(v as string),
    },
    {
      key: "id", label: "", width: 80, align: "right" as const,
      render: (_: unknown, row: Tenant) => (
        <Button variant="ghost" size="xs" onClick={(e) => { e.stopPropagation(); setSelected(row); setDetailOpen(true) }}>
          View
        </Button>
      ),
    },
  ]

  const active = tenants.filter((t) => t.status === "active").length
  const expiring = tenants.filter((t) => t.status === "expiring").length
  const overdue = tenants.filter((t) => t.status === "overdue").length

  const saveTenant = () => {
    if (!addForm.name || !addForm.contact || !addForm.email || !addForm.unit || !addForm.leaseStart || !addForm.leaseEnd) {
      return
    }

    if (!window.confirm("Add this tenant profile?")) {
      return
    }

    const initials = addForm.name.split(" ").filter(Boolean).map((s) => s[0]).join("").slice(0, 2).toUpperCase() || "NT"

    router.post("/admin/tenants", {
      name: addForm.name,
      initials,
      contact: addForm.contact,
      phone: addForm.phone || "N/A",
      email: addForm.email,
      unit: addForm.unit,
      floor: addForm.floor,
      type: addForm.type,
      rent: Number(addForm.rent || 0),
      deposit: Number(addForm.rent || 0) * 2,
      lease_start: addForm.leaseStart,
      lease_end: addForm.leaseEnd,
      payment_method: addForm.paymentMethod,
      status: "active",
    })
  }

  const startEdit = () => {
    if (!selected) return
    setEditForm(selected)
    setEditOpen(true)
  }

  const saveEdit = () => {
    if (!selected) return

    if (!window.confirm("Save changes to this tenant?")) {
      return
    }

    router.patch(`/admin/tenants/${selected.id}`, {
      contact: editForm.contact,
      phone: editForm.phone,
      email: editForm.email,
      payment_method: editForm.paymentMethod,
      status: editForm.status,
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-3">
        {[
          { label: "Total", count: tenants.length, color: "text-[#1B2B4B]" },
          { label: "Active", count: active, color: "text-[#1D7B6E]" },
          { label: "Expiring", count: expiring, color: "text-amber-600" },
          { label: "Overdue", count: overdue, color: "text-red-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#1B2B4B]/10 rounded-xl px-5 py-3 flex items-center gap-3 shadow-sm">
            <span className={`text-2xl font-bold ${s.color}`}>{s.count}</span>
            <span className="text-sm text-[#5C6B88]">{s.label}</span>
          </div>
        ))}
      </div>

      <Card>
        <Card.Header
          title="All Tenants"
          action={<Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>+ Add Tenant</Button>}
        />

        <div className="flex items-center gap-3 px-5 py-3 border-b border-[#1B2B4B]/8">
          <Input
            placeholder="Search tenant or unit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-60"
          />
          <Select value={filterStatus} onChange={(e) => setFilter(e.target.value)} className="w-36">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expiring">Expiring</option>
            <option value="overdue">Overdue</option>
          </Select>
        </div>

        <Table
          columns={columns as never}
          data={filtered as never}
          keyField={"id" as never}
          emptyText="No tenants match your search."
          onRowClick={(row: any) => { setSelected(row as Tenant); setDetailOpen(true) }}
        />
        <Card.Footer>Showing {filtered.length} of {tenants.length} tenants</Card.Footer>
      </Card>

      {selected && (
        <Modal
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          title="Tenant Profile"
          size="lg"
          footer={
            <>
              <Button variant="ghost" onClick={() => setDetailOpen(false)}>Close</Button>
              <Button variant="primary" onClick={startEdit}>Edit Tenant</Button>
            </>
          }
        >
          <div className="flex items-center gap-4 pb-5 mb-5 border-b border-[#1B2B4B]/8">
            <Avatar initials={selected.initials} name={selected.name} size="lg" />
            <div className="flex-1">
              <h3 className="text-base font-semibold text-[#1B2B4B]">{selected.name}</h3>
              <p className="text-sm text-[#5C6B88]">Unit {selected.unit} · {selected.floor} · {selected.type}</p>
            </div>
            {statusBadge(selected.status)}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#5C6B88] mb-2">Lease Details</p>
              <InfoRow label="Contact" value={selected.contact} />
              <InfoRow label="Occupied Unit" value={`Unit ${selected.unit} (${selected.floor})`} />
              <InfoRow label="Phone" value={selected.phone} />
              <InfoRow label="Email" value={selected.email} />
              <InfoRow label="Lease Start" value={formatDateDisplay(selected.leaseStart)} />
              <InfoRow label="Lease End" value={formatDateDisplay(selected.leaseEnd)} />
              <InfoRow label="Monthly Rent" value={<span className="font-bold">P{selected.rent.toLocaleString()}</span>} />
              <InfoRow label="Security Deposit" value={`P${selected.deposit.toLocaleString()}`} />
              <InfoRow label="Payment Method" value={methodBadge(selected.paymentMethod)} border={false} />
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#5C6B88] mb-2">Payment History</p>
              {tenantInvoices.length === 0 ? (
                <p className="text-sm text-[#5C6B88]">No invoices found.</p>
              ) : (
                tenantInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between py-2.5 border-b border-[#1B2B4B]/5 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-[#1B2B4B]">{inv.period}</p>
                      <p className="text-xs text-[#5C6B88]">{inv.invoiceNo}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">P{inv.total.toLocaleString()}</span>
                      {statusBadge(inv.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add New Tenant"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveTenant} disabled={availableUnits.length === 0}>Save Tenant</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Input label="Business Name" placeholder="e.g. ABC Corp" value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} full />
          <Input label="Contact Person" placeholder="Full name" value={addForm.contact} onChange={(e) => setAddForm((f) => ({ ...f, contact: e.target.value }))} full />
          <Input label="Phone" placeholder="09XX XXX XXXX" value={addForm.phone} onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))} full />
          <Input label="Email" placeholder="email@domain.com" type="email" value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} full />
          <Select
            label="Unit (Available Only)"
            value={addForm.unit}
            onChange={(e) => {
              const nextUnit = availableUnits.find((unit) => unit.number === e.target.value)

              setAddForm((f) => ({
                ...f,
                unit: e.target.value,
                floor: (nextUnit?.floor ?? f.floor) as Tenant["floor"],
                type: (nextUnit?.type ?? f.type) as Tenant["type"],
                rent: String(nextUnit?.base_rent ?? f.rent),
              }))
            }}
            full
          >
            {availableUnits.length === 0 && <option value="">No available units</option>}
            {availableUnits.map((unit) => (
              <option key={unit.id} value={unit.number}>
                {unit.number} · {unit.floor} · {unit.type}
              </option>
            ))}
          </Select>
          <Input label="Floor" value={addForm.floor} readOnly full />
          <Input label="Unit Type" value={addForm.type} readOnly full />
          <Input label="Monthly Rent" placeholder="0.00" type="number" value={addForm.rent} onChange={(e) => setAddForm((f) => ({ ...f, rent: e.target.value }))} full />
          <Select label="Payment Method" value={addForm.paymentMethod} onChange={(e) => setAddForm((f) => ({ ...f, paymentMethod: e.target.value as Tenant["paymentMethod"] }))} full>
            <option value="GCash">GCash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cash">Cash</option>
          </Select>
          <Input label="Lease Start" type="date" value={addForm.leaseStart} onChange={(e) => setAddForm((f) => ({ ...f, leaseStart: e.target.value }))} full />
          <Input label="Lease End" type="date" value={addForm.leaseEnd} onChange={(e) => setAddForm((f) => ({ ...f, leaseEnd: e.target.value }))} full />
          <div className="col-span-2">
            <Textarea label="Notes" placeholder="Optional notes" value={addForm.notes} onChange={(e) => setAddForm((f) => ({ ...f, notes: e.target.value }))} full />
          </div>
        </div>
      </Modal>

      {selected && (
        <Modal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          title="Edit Tenant"
          size="md"
          footer={
            <>
              <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={saveEdit}>Save Changes</Button>
            </>
          }
        >
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact" value={String(editForm.contact ?? "")} onChange={(e) => setEditForm((f) => ({ ...f, contact: e.target.value }))} full />
            <Input label="Phone" value={String(editForm.phone ?? "")} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} full />
            <Input label="Email" type="email" value={String(editForm.email ?? "")} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} full />
            <Select label="Method" value={String(editForm.paymentMethod ?? "GCash")} onChange={(e) => setEditForm((f) => ({ ...f, paymentMethod: e.target.value as Tenant["paymentMethod"] }))} full>
              <option value="GCash">GCash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
            </Select>
            <Select label="Status" value={String(editForm.status ?? "active")} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as Tenant["status"] }))} full>
              <option value="active">Active</option>
              <option value="expiring">Expiring</option>
              <option value="overdue">Overdue</option>
            </Select>
          </div>
        </Modal>
      )}

      {credentials && (
        <Modal
          open={credentialsOpen}
          onClose={() => setDismissedCredentialKey(currentCredentialKey)}
          title="Tenant Account Created"
          size="md"
          footer={<Button variant="primary" onClick={() => setDismissedCredentialKey(currentCredentialKey)}>Done</Button>}
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-sm text-emerald-900">
                Account credentials are ready for <span className="font-semibold">{credentials.name}</span>. Share these manually with the tenant.
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-[#1B2B4B]/12 bg-[#F7FAFF] p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#5C6B88]">Email</p>
                <p className="mt-1 text-sm font-medium text-[#1B2B4B] break-all">{credentials.email}</p>
                <Button className="mt-2" variant="ghost" size="xs" onClick={() => copyText(credentials.email)}>Copy Email</Button>
              </div>

              <div className="rounded-xl border border-[#1B2B4B]/12 bg-[#F7FAFF] p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#5C6B88]">Temporary Password</p>
                <p className="mt-1 text-sm font-medium text-[#1B2B4B] tracking-wide">{credentials.temp_password}</p>
                <Button className="mt-2" variant="ghost" size="xs" onClick={() => copyText(credentials.temp_password)}>Copy Password</Button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5C6B88] mb-2">Message Template</p>
              <textarea
                aria-label="Message template"
                value={credentialMessage}
                readOnly
                className="w-full h-24 rounded-lg border border-[#1B2B4B]/20 px-3 py-2 text-sm text-[#1B2B4B] bg-white"
              />
              <Button className="mt-2" variant="primary" size="sm" onClick={() => copyText(credentialMessage)}>
                Copy Message
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
