// src/pages/admin/MaintenancePage.tsx
import { useEffect, useRef, useState } from "react"
import { router, usePage } from "@inertiajs/react"
import Badge       from "../../components/Badge"
import Button      from "../../components/Button"
import Card        from "../../components/Card"
import InfoRow     from "../../components/InfoRow"
import { Input, Select, Textarea } from "../../components/Input"
import MetricCard  from "../../components/MetricCard"
import Modal       from "../../components/Modal"
import Table       from "../../components/Table"
import { formatDateDisplay } from "../../lib/date"

type MaintenanceRequest = {
  id: number
  title: string
  unit: string
  tenant: string
  type: "Electrical" | "Plumbing" | "Air Conditioning" | "Structural" | "General"
  priority: "high" | "medium" | "low"
  status: "open" | "inprogress" | "resolved"
  submitted: string
  assignedTo: string | null
  resolvedDate: string | null
  notes: string
}

const TECHNICIANS = ["Juan (Electrical)", "Pedro (HVAC)", "Mario (General)", "Rico (Plumbing)"]

const priorityBadge = (p: string) => {
  if (p === "high")   return <Badge variant="red">High</Badge>
  if (p === "medium") return <Badge variant="amber">Medium</Badge>
  return <Badge variant="gray">Low</Badge>
}

const statusBadge = (s: string) => {
  if (s === "open")       return <Badge variant="red">Open</Badge>
  if (s === "inprogress") return <Badge variant="amber">In Progress</Badge>
  return <Badge variant="green">Resolved</Badge>
}

// ─────────────────────────────────────────────────────────────────────────────

type MaintenancePageProps = {
  openAddSignal?: number
}

export default function MaintenancePage({ openAddSignal = 0 }: MaintenancePageProps) {
  const { maintenance: maintenanceRows } = usePage<{
    maintenance?: Array<{
      id: number
      title: string
      unit: string
      tenant: string
      type: MaintenanceRequest["type"]
      priority: MaintenanceRequest["priority"]
      status: MaintenanceRequest["status"]
      assigned_to?: string | null
      resolved_date?: string | null
      notes: string
      created_at?: string
    }>
  }>().props

  const mappedRequests: MaintenanceRequest[] = (maintenanceRows ?? []).map((request) => ({
    id: request.id,
    title: request.title,
    unit: request.unit,
    tenant: request.tenant,
    type: request.type,
    priority: request.priority,
    status: request.status,
    submitted: formatDateDisplay(request.created_at, "-"),
    assignedTo: request.assigned_to ?? null,
    resolvedDate: request.resolved_date ? formatDateDisplay(request.resolved_date, "-") : null,
    notes: request.notes,
  }))

  const [filterStatus, setFilter]    = useState("all")
  const [search, setSearch] = useState("")
  const [requests, setRequests]       = useState<MaintenanceRequest[]>(mappedRequests)
  const [selected,     setSelected]  = useState<MaintenanceRequest | null>(null)
  const [detailOpen,   setDetailOpen]= useState(false)
  const [addOpen,      setAddOpen]   = useState(false)
  const lastHandledSignal = useRef(openAddSignal)
  const [assignTo, setAssignTo] = useState("")
  const [newRequest, setNewRequest] = useState({
    unit: "",
    tenant: "",
    type: "General" as MaintenanceRequest["type"],
    priority: "Medium",
    assignedTo: "",
    scheduledDate: "",
    description: "",
  })

  const open       = requests.filter(m => m.status === "open").length
  const inprogress = requests.filter(m => m.status === "inprogress").length
  const resolved   = requests.filter(m => m.status === "resolved").length

  const filtered = requests.filter((request) => {
    const matchStatus = filterStatus === "all" || request.status === filterStatus
    const keyword = search.toLowerCase().trim()
    const matchSearch = !keyword || [
      request.title,
      request.unit,
      request.tenant,
      request.type,
      request.notes,
    ].some((field) => field.toLowerCase().includes(keyword))

    return matchStatus && matchSearch
  })

  useEffect(() => {
    setRequests(mappedRequests)

    if (openAddSignal !== lastHandledSignal.current) {
      setAddOpen(true)
      lastHandledSignal.current = openAddSignal
    }
  }, [openAddSignal, maintenanceRows])

  const updateRequest = (id: number, updater: (current: MaintenanceRequest) => MaintenanceRequest) => {
    setRequests((prev) => prev.map((request) => (request.id === id ? updater(request) : request)))
    setSelected((prev) => (prev && prev.id === id ? updater(prev) : prev))
  }

  const handleProgressAction = () => {
    if (!selected) return

    const actionLabel = selected.status === "open" ? "assign and start" : "mark as resolved"
    if (!window.confirm(`Confirm ${actionLabel} for this request?`)) {
      return
    }

    if (selected.status === "open") {
      router.patch(`/admin/maintenance/${selected.id}`, {
        status: "inprogress",
        assigned_to: assignTo || selected.assignedTo || TECHNICIANS[0],
      })
      return
    }

    router.patch(`/admin/maintenance/${selected.id}`, {
      status: "resolved",
      resolved_date: new Date().toISOString().slice(0, 10),
      assigned_to: assignTo || selected.assignedTo,
    })
  }

  const createRequest = () => {
    if (!newRequest.unit || !newRequest.tenant || !newRequest.description) {
      return
    }

    if (!window.confirm("Submit this maintenance request?")) {
      return
    }

    router.post("/admin/maintenance", {
      title: `${newRequest.type} issue`,
      unit: newRequest.unit,
      tenant: newRequest.tenant,
      type: newRequest.type,
      priority: newRequest.priority.toLowerCase(),
      status: newRequest.assignedTo ? "inprogress" : "open",
      assigned_to: newRequest.assignedTo || null,
      resolved_date: null,
      notes: newRequest.description,
    })
  }

  const columns = [
    {
      key: "title", label: "Issue",
      render: (_: unknown, row: MaintenanceRequest) => (
        <div>
          <p className="font-medium text-[#1B2B4B]">{row.title}</p>
          <p className="text-xs text-[#5C6B88]">{row.type}</p>
        </div>
      ),
    },
    { key: "unit",   label: "Unit",   width: 80 },
    { key: "tenant", label: "Tenant" },
    {
      key: "priority", label: "Priority", align: "center" as const,
      render: (v: unknown) => priorityBadge(v as string),
    },
    {
      key: "status", label: "Status", align: "center" as const,
      render: (v: unknown) => statusBadge(v as string),
    },
    { key: "submitted",  label: "Submitted" },
    {
      key: "assignedTo", label: "Assigned To",
      render: (v: unknown) => v
        ? <span className="text-[#1B2B4B]">{v as string}</span>
        : <span className="text-[#5C6B88] italic">Unassigned</span>,
    },
    {
      key: "id", label: "", width: 80, align: "right" as const,
      render: (_: unknown, row: MaintenanceRequest) => (
        <Button variant="ghost" size="xs" onClick={e => { e.stopPropagation(); setSelected(row); setDetailOpen(true) }}>
          View
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-5">

      {/* ── Metrics ── */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total Requests" value={requests.length} sub="All time" />
        <MetricCard label="Open"           value={open}       sub="Needs attention"      trend="down" iconBg="bg-red-50 text-red-400" />
        <MetricCard label="In Progress"    value={inprogress} sub="Being worked on"      iconBg="bg-amber-50 text-amber-500" />
        <MetricCard label="Resolved"       value={resolved}   sub="Completed"            trend="up" />
      </div>

      {/* ── Table ── */}
      <Card>
        <Card.Header
          title="Maintenance Requests"
          action={
            <div className="flex gap-2">
              <Input
                placeholder="Search request, tenant, unit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56"
              />
              {/* Status filter tabs */}
              <div className="flex gap-0.5 bg-[#F5F0E8] rounded-lg p-0.5">
                {["all", "open", "inprogress", "resolved"].map(s => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={[
                      "px-3 py-1 rounded-md text-xs font-medium transition-all capitalize",
                      filterStatus === s
                        ? "bg-white text-[#1B2B4B] shadow-sm"
                        : "text-[#5C6B88] hover:text-[#1B2B4B]",
                    ].join(" ")}
                  >
                    {s === "inprogress" ? "In Progress" : s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
              <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
                + New Request
              </Button>
            </div>
          }
        />

        <Table
          columns={columns as never}
          data={filtered as never}
          keyField={"id" as never}
          emptyText="No requests found."
          onRowClick={(row: any) => { setSelected(row as MaintenanceRequest); setDetailOpen(true) }}
        />
        <Card.Footer>Showing {filtered.length} requests</Card.Footer>
      </Card>

      {/* ── Detail Modal ── */}
      {selected && (
        <Modal
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          title="Request Detail"
          size="md"
          footer={
            <>
              <Button variant="ghost" onClick={() => setDetailOpen(false)}>Close</Button>
              {selected.status !== "resolved" && (
                <Button variant="primary" onClick={handleProgressAction}>
                  {selected.status === "open" ? "Assign & Start" : "Mark Resolved"}
                </Button>
              )}
            </>
          }
        >
          <div className="flex items-start justify-between pb-4 mb-4 border-b border-[#1B2B4B]/8">
            <div>
              <p className="text-base font-semibold text-[#1B2B4B]">{selected.title}</p>
              <p className="text-sm text-[#5C6B88]">{selected.type}</p>
            </div>
            <div className="flex gap-2">
              {priorityBadge(selected.priority)}
              {statusBadge(selected.status)}
            </div>
          </div>

          <InfoRow label="Unit"        value={selected.unit}      />
          <InfoRow label="Tenant"      value={selected.tenant}    />
          <InfoRow label="Submitted"   value={selected.submitted} />
          <InfoRow
            label="Assigned To"
            value={selected.assignedTo ?? <span className="text-[#5C6B88] italic">Unassigned</span>}
          />
          {selected.resolvedDate && (
            <InfoRow label="Resolved"  value={selected.resolvedDate} />
          )}

          <div className="mt-4 pt-4 border-t border-[#1B2B4B]/8">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#5C6B88] mb-2">Notes</p>
            <p className="text-sm text-[#1B2B4B]">{selected.notes}</p>
          </div>

          {selected.status !== "resolved" && (
            <div className="mt-4">
              <Select label="Reassign To" value={assignTo} onChange={(e) => setAssignTo(e.target.value)} full>
                <option value="">— Select technician —</option>
                {TECHNICIANS.map(t => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </div>
          )}
        </Modal>
      )}

      {/* ── New Request Modal ── */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="New Maintenance Request"
        size="md"
        footer={
          <>
            <Button variant="ghost"   onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={createRequest}>Submit Request</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Unit / Area"
            placeholder="e.g. Unit 205"
            value={newRequest.unit}
            onChange={(e) => setNewRequest((prev) => ({ ...prev, unit: e.target.value }))}
            full
          />
          <Input
            label="Tenant"
            placeholder="Tenant name"
            value={newRequest.tenant}
            onChange={(e) => setNewRequest((prev) => ({ ...prev, tenant: e.target.value }))}
            full
          />
          <Select
            label="Issue Type"
            value={newRequest.type}
            onChange={(e) => setNewRequest((prev) => ({ ...prev, type: e.target.value as MaintenanceRequest["type"] }))}
            full
          >
            <option value="Electrical">Electrical</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Air Conditioning">Air Conditioning</option>
            <option value="Structural">Structural</option>
            <option value="General">General</option>
          </Select>
          <Select
            label="Priority"
            value={newRequest.priority}
            onChange={(e) => setNewRequest((prev) => ({ ...prev, priority: e.target.value }))}
            full
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </Select>
          <Select
            label="Assign To"
            value={newRequest.assignedTo}
            onChange={(e) => setNewRequest((prev) => ({ ...prev, assignedTo: e.target.value }))}
            full
          >
            <option value="">Unassigned</option>
            {TECHNICIANS.map(t => <option key={t}>{t}</option>)}
          </Select>
          <Input
            label="Scheduled Date"
            type="date"
            value={newRequest.scheduledDate}
            onChange={(e) => setNewRequest((prev) => ({ ...prev, scheduledDate: e.target.value }))}
            full
          />
          <div className="col-span-2">
            <Textarea
              label="Description"
              placeholder="Describe the issue..."
              value={newRequest.description}
              onChange={(e) => setNewRequest((prev) => ({ ...prev, description: e.target.value }))}
              full
            />
          </div>
        </div>
      </Modal>

    </div>
  )
}