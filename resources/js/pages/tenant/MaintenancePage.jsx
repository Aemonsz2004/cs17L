// src/pages/tenant/MaintenancePage.jsx
import { useState } from 'react';
import { router } from '@inertiajs/react';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ConfirmModal from '../../components/ConfirmModal';
import { Input, Select, Textarea } from '../../components/Input';
import Modal from '../../components/Modal';
import { usePage } from '@inertiajs/react';
import { formatDateDisplay } from '../../lib/date';
const priorityBadge = (p) => {
    if (p === 'high') return <Badge variant="red">High</Badge>;
    if (p === 'medium') return <Badge variant="amber">Medium</Badge>;
    return <Badge variant="gray">Low</Badge>;
};
const statusBadge = (s) => {
    if (s === 'open') return <Badge variant="red">Open</Badge>;
    if (s === 'inprogress') return <Badge variant="amber">In Progress</Badge>;
    return <Badge variant="green">Resolved</Badge>;
};
const typeIcon = {
    Electrical: '⚡',
    Plumbing: '🔧',
    'Air Conditioning': '❄️',
    Structural: '🏗️',
    General: '🔨',
};
export default function TenantMaintenancePage({ maintenance }) {
    const { archivedMaintenance, auth, tenantUnit } = usePage().props;
    const [selected, setSelected] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [addOpen, setAddOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [viewMode, setViewMode] = useState('active');
    const [addErrors, setAddErrors] = useState({});
    const [addSaving, setAddSaving] = useState(false);
    const [form, setForm] = useState({
        title: '',
        type: 'General',
        priority: 'medium',
        notes: '',
    });
    const activeRequests = (maintenance ?? []).map((request) => ({
        id: request.id,
        title: request.title,
        unit: request.unit,
        tenant: request.tenant,
        type: request.type,
        priority: request.priority,
        status: request.status,
        submitted: formatDateDisplay(request.created_at, '-'),
        assignedTo: request.assigned_to ?? null,
        resolvedDate: request.resolved_date
            ? formatDateDisplay(request.resolved_date, '-')
            : null,
        notes: request.notes,
    }));
    const archivedRequests = (archivedMaintenance ?? []).map((request) => ({
        id: request.id,
        title: request.title,
        unit: request.unit,
        tenant: request.tenant,
        type: request.type,
        priority: request.priority,
        status: request.status,
        submitted: formatDateDisplay(request.created_at, '-'),
        assignedTo: request.assigned_to ?? null,
        resolvedDate: request.resolved_date
            ? formatDateDisplay(request.resolved_date, '-')
            : null,
        notes: request.notes,
    }));
    const requests = viewMode === 'active' ? activeRequests : archivedRequests;
    const q = search.trim().toLowerCase();
    const filtered = requests.filter((request) => {
        const matchStatus = filter === 'all' || request.status === filter;
        const matchSearch =
            !q ||
            [
                request.title,
                request.type,
                request.priority,
                request.status,
                request.notes,
                request.submitted,
                request.assignedTo ?? '',
                request.resolvedDate ?? '',
            ]
                .join(' ')
                .toLowerCase()
                .includes(q);
        return matchStatus && matchSearch;
    });
    const [confirmAction, setConfirmAction] = useState(null);
    const scrollToFirstError = (errors) => {
        if (!errors) return;
        const keys = Object.keys(errors);
        if (keys.length === 0) return;
        const firstKey = keys[0];
        const el = document.getElementById(firstKey);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus({ preventScroll: true });
        }
    };
    const open = requests.filter((m) => m.status === 'open').length;
    const inProgress = requests.filter((m) => m.status === 'inprogress').length;
    const resolved = requests.filter((m) => m.status === 'resolved').length;
    const submitRequest = () => {
        if (viewMode !== 'active') return;
        setAddErrors({});
        setAddSaving(true);
        router.post(
            '/tenant/maintenance',
            {
                title: form.title.trim(),
                type: form.type,
                priority: form.priority,
                notes: form.notes.trim(),
            },
            {
                onSuccess: () => {
                    setAddSaving(false);
                    setAddOpen(false);
                    setForm({
                        title: '',
                        type: 'General',
                        priority: 'medium',
                        notes: '',
                    });
                    setAddErrors({});
                },
                onError: (errors) => {
                    setAddSaving(false);
                    setAddErrors(errors || {});
                    scrollToFirstError(errors);
                },
            },
        );
    };
    const markDone = () => {
        if (!selected) return;
        setConfirmAction({ type: 'markDone' });
    };
    const confirmMarkDone = () => {
        if (!selected) return;
        setConfirmAction(null);
        router.post(
            `/tenant/maintenance/${selected.id}/mark-done`,
            {},
            {
                onSuccess: () => {
                    setDetailOpen(false);
                    setSelected(null);
                },
            },
        );
    };
    const archiveRequest = () => {
        if (!selected) return;
        setConfirmAction({ type: 'archive' });
    };
    const confirmArchive = () => {
        if (!selected) return;
        setConfirmAction(null);
        router.delete(`/tenant/maintenance/${selected.id}`, {
            onSuccess: () => {
                setDetailOpen(false);
                setSelected(null);
            },
        });
    };
    const restoreRequest = () => {
        if (!selected) return;
        setConfirmAction({ type: 'restore' });
    };
    const confirmRestore = () => {
        if (!selected) return;
        setConfirmAction(null);
        router.post(
            `/tenant/maintenance/${selected.id}/restore`,
            {},
            {
                onSuccess: () => {
                    setDetailOpen(false);
                    setSelected(null);
                },
            },
        );
    };
    return (
        <div className="space-y-5">
            <div className="flex items-center justify-end">
                <div className="flex gap-0.5 rounded-lg bg-[#F5F0E8] p-0.5">
                    {['active', 'archived'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setViewMode(tab)}
                            className={[
                                'rounded-md px-3 py-1 text-xs font-medium capitalize transition-all',
                                viewMode === tab
                                    ? 'bg-white text-[#1B2B4B] shadow-sm'
                                    : 'text-[#5C6B88] hover:text-[#1B2B4B]',
                            ].join(' ')}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>
            {/* ── Summary ── */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    {
                        label: 'Open',
                        count: open,
                        color: 'text-red-500',
                        bg: 'bg-red-50 border-red-200',
                    },
                    {
                        label: 'In Progress',
                        count: inProgress,
                        color: 'text-amber-600',
                        bg: 'bg-amber-50 border-amber-200',
                    },
                    {
                        label: 'Resolved',
                        count: resolved,
                        color: 'text-[#1D7B6E]',
                        bg: 'bg-white border-[#1B2B4B]/10',
                    },
                ].map((s) => (
                    <div
                        key={s.label}
                        className={`rounded-xl border p-5 shadow-sm ${s.bg}`}
                    >
                        <p className="mb-1 text-[10px] font-bold tracking-widest text-[#5C6B88] uppercase">
                            {s.label}
                        </p>
                        <p className={`text-3xl font-bold ${s.color}`}>
                            {s.count}
                        </p>
                        <p className="mt-0.5 text-xs text-[#5C6B88]">
                            request{s.count !== 1 ? 's' : ''}
                        </p>
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
                            <div className="flex gap-0.5 rounded-lg bg-[#F5F0E8] p-0.5">
                                {[
                                    { id: 'all', label: 'All' },
                                    { id: 'open', label: 'Open' },
                                    { id: 'inprogress', label: 'In Progress' },
                                    { id: 'resolved', label: 'Resolved' },
                                ].map((f) => (
                                    <button
                                        key={f.id}
                                        onClick={() => setFilter(f.id)}
                                        className={[
                                            'rounded-md px-3 py-1 text-xs font-medium whitespace-nowrap transition-all',
                                            filter === f.id
                                                ? 'bg-white text-[#1B2B4B] shadow-sm'
                                                : 'text-[#5C6B88] hover:text-[#1B2B4B]',
                                        ].join(' ')}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                            <input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search requests..."
                                className="h-9 w-56 rounded-lg border border-[#1B2B4B]/15 bg-white px-3 text-sm text-[#1B2B4B] transition outline-none focus:border-[#1B2B4B]/35"
                            />
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => setAddOpen(true)}
                                disabled={viewMode !== 'active'}
                            >
                                + New Request
                            </Button>
                        </div>
                    }
                />

                <Card.Body flush>
                    {filtered.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className="text-sm text-[#5C6B88]">
                                No requests in this category.
                            </p>
                        </div>
                    ) : (
                        filtered.map((req) => (
                            <button
                                key={req.id}
                                onClick={() => {
                                    setSelected(req);
                                    setDetailOpen(true);
                                }}
                                className="flex w-full items-start gap-4 border-b border-[#1B2B4B]/5 px-5 py-4 text-left transition-colors last:border-0 hover:bg-[#FAF8F4]"
                            >
                                {/* Type icon */}
                                <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#F5F0E8] text-lg">
                                    {typeIcon[req.type] ?? '🔨'}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-[#1B2B4B]">
                                                {req.title}
                                            </p>
                                            <p className="mt-0.5 text-xs text-[#5C6B88]">
                                                {req.type} · Submitted{' '}
                                                {req.submitted}
                                            </p>
                                        </div>
                                        <div className="flex flex-shrink-0 gap-1.5">
                                            {priorityBadge(req.priority)}
                                            {statusBadge(req.status)}
                                        </div>
                                    </div>

                                    <p className="mt-2 line-clamp-2 rounded-lg bg-[#FAF8F4] px-3 py-1.5 text-xs text-[#5C6B88]">
                                        {req.notes}
                                    </p>

                                    {req.assignedTo && (
                                        <p className="mt-1.5 text-xs text-[#5C6B88]">
                                            Assigned to{' '}
                                            <span className="font-medium text-[#1B2B4B]">
                                                {req.assignedTo}
                                            </span>
                                            {req.resolvedDate && (
                                                <span className="text-[#24A18F]">
                                                    {' '}
                                                    · Resolved{' '}
                                                    {req.resolvedDate}
                                                </span>
                                            )}
                                        </p>
                                    )}
                                    {!req.assignedTo &&
                                        req.status === 'open' && (
                                            <p className="mt-1.5 text-xs text-amber-500 italic">
                                                Pending assignment…
                                            </p>
                                        )}
                                </div>
                            </button>
                        ))
                    )}
                </Card.Body>
                <Card.Footer>
                    {filtered.length} request{filtered.length !== 1 ? 's' : ''}
                </Card.Footer>
            </Card>

            {/* ── Detail Modal ── */}
            {selected && (
                <Modal
                    open={detailOpen}
                    onClose={() => setDetailOpen(false)}
                    title="Request Detail"
                    size="md"
                    footer={
                        <div className="flex w-full items-center justify-between">
                            <Button
                                variant="ghost"
                                onClick={() => setDetailOpen(false)}
                            >
                                Close
                            </Button>
                            <div className="flex gap-2">
                                {viewMode === 'active' ? (
                                    <>
                                        {selected.status !== 'resolved' && (
                                            <Button
                                                variant="primary"
                                                onClick={markDone}
                                            >
                                                Mark as Done
                                            </Button>
                                        )}
                                        <Button
                                            variant="danger"
                                            onClick={archiveRequest}
                                        >
                                            Archive
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        variant="primary"
                                        onClick={restoreRequest}
                                    >
                                        Restore
                                    </Button>
                                )}
                            </div>
                        </div>
                    }
                >
                    {/* Header */}
                    <div className="mb-4 flex items-center gap-3 border-b border-[#1B2B4B]/8 pb-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#F5F0E8] text-2xl">
                            {typeIcon[selected.type] ?? '🔨'}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-base font-bold text-[#1B2B4B]">
                                {selected.title}
                            </h3>
                            <p className="text-xs text-[#5C6B88]">
                                {selected.type} · Unit {selected.unit}
                            </p>
                        </div>
                        <div className="flex gap-1.5">
                            {priorityBadge(selected.priority)}
                            {statusBadge(selected.status)}
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="mb-5 space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#1B2B4B]/30" />
                            <div>
                                <p className="text-xs font-semibold text-[#1B2B4B]">
                                    Submitted
                                </p>
                                <p className="text-xs text-[#5C6B88]">
                                    {selected.submitted}
                                </p>
                            </div>
                        </div>
                        {selected.assignedTo && (
                            <div className="flex items-start gap-3">
                                <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-amber-400" />
                                <div>
                                    <p className="text-xs font-semibold text-[#1B2B4B]">
                                        Assigned to {selected.assignedTo}
                                    </p>
                                    <p className="text-xs text-[#5C6B88]">
                                        Technician dispatched
                                    </p>
                                </div>
                            </div>
                        )}
                        {selected.resolvedDate && (
                            <div className="flex items-start gap-3">
                                <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#24A18F]" />
                                <div>
                                    <p className="text-xs font-semibold text-[#1D7B6E]">
                                        Resolved
                                    </p>
                                    <p className="text-xs text-[#5C6B88]">
                                        {selected.resolvedDate}
                                    </p>
                                </div>
                            </div>
                        )}
                        {!selected.assignedTo && (
                            <div className="flex items-start gap-3">
                                <div className="mt-1.5 h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-amber-300" />
                                <div>
                                    <p className="text-xs font-semibold text-amber-600">
                                        Awaiting assignment
                                    </p>
                                    <p className="text-xs text-[#5C6B88]">
                                        Admin will assign a technician shortly
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="rounded-xl bg-[#FAF8F4] p-4">
                        <p className="mb-2 text-[10px] font-bold tracking-wider text-[#5C6B88] uppercase">
                            Description
                        </p>
                        <p className="text-sm text-[#1B2B4B]">
                            {selected.notes}
                        </p>
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
                        <Button
                            variant="ghost"
                            onClick={() => setAddOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={submitRequest}
                            loading={addSaving}
                        >
                            {addSaving ? 'Submitting...' : 'Submit Request'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 rounded-xl bg-[#F5F0E8] px-4 py-3 text-sm">
                        <span className="text-[#5C6B88]">Unit</span>
                        <span className="font-semibold text-[#1B2B4B]">
                            {tenantUnit ?? '-'}
                        </span>
                        <span className="text-[#5C6B88]">·</span>
                        <span className="text-[#5C6B88]">
                            {auth?.user?.name ??
                                requests[0]?.tenant ??
                                'Tenant'}
                        </span>
                    </div>

                    <Input
                        label="Issue Title"
                        id="title"
                        value={form.title}
                        onChange={(event) => {
                            setForm((prev) => ({
                                ...prev,
                                title: event.target.value,
                            }));
                            if (addErrors.title)
                                setAddErrors((e) => ({
                                    ...e,
                                    title: undefined,
                                }));
                        }}
                        placeholder="e.g. Leaking sink near pantry"
                        error={addErrors.title}
                        full
                    />

                    <Select
                        label="Issue Type"
                        id="type"
                        value={form.type}
                        onChange={(event) => {
                            setForm((prev) => ({
                                ...prev,
                                type: event.target.value,
                            }));
                            if (addErrors.type)
                                setAddErrors((e) => ({
                                    ...e,
                                    type: undefined,
                                }));
                        }}
                        error={addErrors.type}
                        full
                    >
                        <option value="Electrical">Electrical</option>
                        <option value="Plumbing">Plumbing</option>
                        <option value="Air Conditioning">
                            Air Conditioning
                        </option>
                        <option value="Structural">Structural</option>
                        <option value="General">General</option>
                    </Select>

                    <Select
                        label="Urgency"
                        id="priority"
                        value={form.priority}
                        onChange={(event) => {
                            setForm((prev) => ({
                                ...prev,
                                priority: event.target.value,
                            }));
                            if (addErrors.priority)
                                setAddErrors((e) => ({
                                    ...e,
                                    priority: undefined,
                                }));
                        }}
                        error={addErrors.priority}
                        full
                    >
                        <option value="low">
                            Low — Not urgent, anytime is fine
                        </option>
                        <option value="medium">Medium — Within 3 days</option>
                        <option value="high">High — As soon as possible</option>
                    </Select>

                    <Textarea
                        label="Describe the Issue"
                        id="notes"
                        value={form.notes}
                        onChange={(event) => {
                            setForm((prev) => ({
                                ...prev,
                                notes: event.target.value,
                            }));
                            if (addErrors.notes)
                                setAddErrors((e) => ({
                                    ...e,
                                    notes: undefined,
                                }));
                        }}
                        placeholder="Please describe the problem in as much detail as possible…"
                        rows={4}
                        error={addErrors.notes}
                        full
                    />
                </div>
            </Modal>

            {confirmAction && (
                <ConfirmModal
                    open
                    onClose={() => setConfirmAction(null)}
                    onConfirm={() => {
                        if (confirmAction.type === 'markDone')
                            confirmMarkDone();
                        if (confirmAction.type === 'archive') confirmArchive();
                        if (confirmAction.type === 'restore') confirmRestore();
                    }}
                    title={
                        confirmAction.type === 'markDone'
                            ? 'Mark as Done'
                            : confirmAction.type === 'archive'
                              ? 'Archive Request'
                              : 'Restore Request'
                    }
                    message={
                        confirmAction.type === 'markDone'
                            ? 'Mark this request as done?'
                            : confirmAction.type === 'archive'
                              ? 'Archive this request?'
                              : 'Restore this request?'
                    }
                    variant={
                        confirmAction.type === 'archive' ? 'danger' : 'primary'
                    }
                    confirmLabel={
                        confirmAction.type === 'markDone'
                            ? 'Mark as Done'
                            : confirmAction.type === 'archive'
                              ? 'Archive'
                              : 'Restore'
                    }
                />
            )}
        </div>
    );
}
