// src/pages/tenant/MaintenancePage.tsx
import { useState } from "react"
import { router } from "@inertiajs/react"
import Badge    from "../../components/Badge"
import Button   from "../../components/Button"
import Card     from "../../components/Card"
import { Input, Select, Textarea } from "../../components/Input"
import Modal    from "../../components/Modal"
import { usePage } from "@inertiajs/react"
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

const typeIcon: Record<string, string> = {
  Electrical:        "⚡",
  Plumbing:          "🔧",
  "Air Conditioning": "❄️",
  Structural:        "🏗️",
  General:           "🔨",
}

type MaintenanceRecord = {
  id: number
  title: string
  unit: string
  tenant: string
  type: MaintenanceRequest["type"]
  priority: MaintenanceRequest["priority"]
  status: MaintenanceRequest["status"]
  notes: string
  assigned_to?: string | null
  resolved_date?: string | null
  created_at?: string
}

export default function TenantMaintenancePage({ maintenance }: { maintenance?: MaintenanceRecord[] }) {
  const { auth } = usePage<{ auth?: { user?: { name?: string } } }>().props

  const [selected,   setSelected]   = useState<MaintenanceRequest | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [addOpen,    setAddOpen]    = useState(false)
  const [search,     setSearch]     = useState("")
  const [filter,     setFilter]     = useState("all")

  const [form, setForm] = useState({
    title: "",
    type: "General" as MaintenanceRequest["type"],
    priority: "medium" as MaintenanceRequest["priority"],
    notes: "",
  })

  const requests: MaintenanceRequest[] = (maintenance ?? []).map((request) => ({
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

  const q = search.trim().toLowerCase()
  const filtered = requests.filter((request) => {
    const matchStatus = filter === "all" || request.status === filter
    const matchSearch = !q || [
      request.title,
      request.type,
      request.priority,
      request.status,
      request.notes,
      request.submitted,
      request.assignedTo ?? "",
      request.resolvedDate ?? "",
    ].join(" ").toLowerCase().includes(q)

    return matchStatus && matchSearch
  })

  const open       = requests.filter(m => m.status === "open").length
  const inProgress = requests.filter(m => m.status === "inprogress").length
  const resolved   = requests.filter(m => m.status === "resolved").length

  const submitRequest = () => {
    if (!form.title.trim() || !form.notes.trim()) {
      return
    }

    router.post("/tenant/maintenance", {
      title: form.title.trim(),
      type: form.type,
      priority: form.priority,
      notes: form.notes.trim(),
    })
  }

  return (
    <div className="space-y-5 max-w-4xl">

      {/* ── Summary ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Open",       count: open,       color: "text-red-500",    bg: "bg-red-50 border-red-200"                  },
          { label: "In Progress",count: inProgress, color: "text-amber-600",  bg: "bg-amber-50 border-amber-200"              },
          { label: "Resolved",   count: resolved,   color: "text-[#1D7B6E]",  bg: "bg-white border-[#1B2B4B]/10"             },
        ].map(s => (
          <div key={s.label} className={`border rounded-xl p-5 shadow-sm ${s.bg}`}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#5C6B88] mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-[#5C6B88] mt-0.5">request{s.count !== 1 ? "s" : ""}</p>
          </div>
        ))}
      </div>

      {/* ── Request list ── */}
      <Card>
        <Card.Header
          title="My Requests"
          action={
            <div className="flex items-center gap-2">
              {/* Filter tabs */}
              <div className="flex gap-0.5 bg-[#F5F0E8] rounded-lg p-0.5">
                {[
                  { id: "all",        label: "All"         },
                  { id: "open",       label: "Open"        },
                  { id: "inprogress", label: "In Progress" },
                  { id: "resolved",   label: "Resolved"    },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={[
                      "px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                      filter === f.id
                        ? "bg-white text-[#1B2B4B] shadow-sm"
                        : "text-[#5C6B88] hover:text-[#1B2B4B]",
                    ].join(" ")}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search requests..."
                className="h-9 w-56 rounded-lg border border-[#1B2B4B]/15 bg-white px-3 text-sm text-[#1B2B4B] outline-none transition focus:border-[#1B2B4B]/35"
              />
              <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
                + New Request
              </Button>
            </div>
          }
        />

        <Card.Body flush>
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-[#5C6B88]">No requests in this category.</p>
            </div>
          ) : (
            filtered.map(req => (
              <button
                key={req.id}
                onClick={() => { setSelected(req); setDetailOpen(true) }}
                className="w-full flex items-start gap-4 px-5 py-4 border-b border-[#1B2B4B]/5 last:border-0 hover:bg-[#FAF8F4] transition-colors text-left"
              >
                {/* Type icon */}
                <div className="w-10 h-10 rounded-xl bg-[#F5F0E8] flex items-center justify-center text-lg flex-shrink-0 mt-0.5">
                  {typeIcon[req.type] ?? "🔨"}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1B2B4B] truncate">{req.title}</p>
                      <p className="text-xs text-[#5C6B88] mt-0.5">{req.type} · Submitted {req.submitted}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {priorityBadge(req.priority)}
                      {statusBadge(req.status)}
                    </div>
                  </div>

                  <p className="text-xs text-[#5C6B88] mt-2 line-clamp-2 bg-[#FAF8F4] rounded-lg px-3 py-1.5">
                    {req.notes}
                  </p>

                  {req.assignedTo && (
                    <p className="text-xs text-[#5C6B88] mt-1.5">
                      Assigned to <span className="font-medium text-[#1B2B4B]">{req.assignedTo}</span>
                      {req.resolvedDate && <span className="text-[#24A18F]"> · Resolved {req.resolvedDate}</span>}
                    </p>
                  )}
                  {!req.assignedTo && req.status === "open" && (
                    <p className="text-xs text-amber-500 mt-1.5 italic">Pending assignment…</p>
                  )}
                </div>
              </button>
            ))
          )}
        </Card.Body>
        <Card.Footer>{filtered.length} request{filtered.length !== 1 ? "s" : ""}</Card.Footer>
      </Card>

      {/* ── Detail Modal ── */}
      {selected && (
        <Modal
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          title="Request Detail"
          size="md"
          footer={
            <Button variant="ghost" onClick={() => setDetailOpen(false)}>Close</Button>
          }
        >
          {/* Header */}
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[#1B2B4B]/8">
            <div className="w-12 h-12 rounded-xl bg-[#F5F0E8] flex items-center justify-center text-2xl flex-shrink-0">
              {typeIcon[selected.type] ?? "🔨"}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-[#1B2B4B]">{selected.title}</h3>
              <p className="text-xs text-[#5C6B88]">{selected.type} · Unit {selected.unit}</p>
            </div>
            <div className="flex gap-1.5">
              {priorityBadge(selected.priority)}
              {statusBadge(selected.status)}
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-3 mb-5">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#1B2B4B]/30 mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-[#1B2B4B]">Submitted</p>
                <p className="text-xs text-[#5C6B88]">{selected.submitted}</p>
              </div>
            </div>
            {selected.assignedTo && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-[#1B2B4B]">Assigned to {selected.assignedTo}</p>
                  <p className="text-xs text-[#5C6B88]">Technician dispatched</p>
                </div>
              </div>
            )}
            {selected.resolvedDate && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#24A18F] mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-[#1D7B6E]">Resolved</p>
                  <p className="text-xs text-[#5C6B88]">{selected.resolvedDate}</p>
                </div>
              </div>
            )}
            {!selected.assignedTo && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-300 mt-1.5 flex-shrink-0 animate-pulse" />
                <div>
                  <p className="text-xs font-semibold text-amber-600">Awaiting assignment</p>
                  <p className="text-xs text-[#5C6B88]">Admin will assign a technician shortly</p>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-[#FAF8F4] rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B88] mb-2">Description</p>
            <p className="text-sm text-[#1B2B4B]">{selected.notes}</p>
          </div>
        </Modal>
      )}

      {/* ── New Request Modal ── */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Submit Maintenance Request"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={submitRequest}>Submit Request</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-[#F5F0E8] rounded-xl px-4 py-3 flex items-center gap-3 text-sm">
            <span className="text-[#5C6B88]">Unit</span>
            <span className="font-semibold text-[#1B2B4B]">{requests[0]?.unit ?? "-"}</span>
            <span className="text-[#5C6B88]">·</span>
            <span className="text-[#5C6B88]">{auth?.user?.name ?? requests[0]?.tenant ?? "Tenant"}</span>
          </div>

          <Input
            label="Issue Title"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="e.g. Leaking sink near pantry"
            full
          />

          <Select
            label="Issue Type"
            value={form.type}
            onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as MaintenanceRequest["type"] }))}
            full
          >
            <option value="Electrical">Electrical</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Air Conditioning">Air Conditioning</option>
            <option value="Structural">Structural</option>
            <option value="General">General</option>
          </Select>

          <Select
            label="Urgency"
            value={form.priority}
            onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value as MaintenanceRequest["priority"] }))}
            full
          >
            <option value="low">Low — Not urgent, anytime is fine</option>
            <option value="medium">Medium — Within 3 days</option>
            <option value="high">High — As soon as possible</option>
          </Select>

          <Input label="Preferred Schedule" type="date" full />

          <Textarea
            label="Describe the Issue"
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            placeholder="Please describe the problem in as much detail as possible…"
            rows={4}
            full
          />
        </div>
      </Modal>

    </div>
  )
}