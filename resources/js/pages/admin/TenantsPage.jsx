import { router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import Avatar from '../../components/Avatar';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ConfirmModal from '../../components/ConfirmModal';
import InfoRow from '../../components/InfoRow';
import { Input, Select, Textarea } from '../../components/Input';
import Modal from '../../components/Modal';
import Table from '../../components/Table';
import { formatDateDisplay } from '../../lib/date';

const toDateInputValue = (value) => {
    if (!value) return '';
    const text = String(value).trim();
    return text.length >= 10 ? text.slice(0, 10) : '';
};

const addDaysToDateInput = (value, days) => {
    const dateInput = toDateInputValue(value);
    if (!dateInput) return '';
    const parsed = new Date(`${dateInput}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return '';
    parsed.setDate(parsed.getDate() + days);
    return parsed.toISOString().slice(0, 10);
};

const statusBadge = (s) => {
    if (s === 'active') return <Badge variant="green">Active</Badge>;
    if (s === 'pending_payment') return <Badge variant="amber">Pending Payment</Badge>;
    if (s === 'moved_out') return <Badge variant="gray">Moved Out</Badge>;
    if (s === 'terminated') return <Badge variant="red">Terminated</Badge>;
    return null;
};

const leaseStatusBadge = (status) => {
    if (status === 'active') return <Badge variant="green">Active</Badge>;
    if (status === 'terminated') return <Badge variant="red">Terminated</Badge>;
    if (status === 'expired') return <Badge variant="red">Expired</Badge>;
    if (status === 'pending') return <Badge variant="amber">Pending</Badge>;
    if (status === 'renewed') return <Badge variant="blue">Renewed</Badge>;
    return <Badge variant="gray">{status ?? 'Unknown'}</Badge>;
};

const methodBadge = (m) =>
    m === 'GCash' ? (
        <Badge variant="blue">GCash</Badge>
    ) : m === 'Bank Transfer' ? (
        <Badge variant="gray">Bank</Badge>
    ) : (
        <Badge variant="gray">Cash</Badge>
    );
export default function TenantsPage({ openAddSignal = 0 }) {
    const {
        tenants: tenantRows,
        archivedTenants: archivedTenantRows,
        invoices: invoiceRows,
        units: unitRows,
        flash,
    } = usePage().props;
    const mapTenant = (tenant) => {
        const mappedUnits = (tenant.units ?? []).map((u) => ({
            id: u.id,
            number: u.number,
            floor: u.floor,
            type: u.type,
            baseRent: u.base_rent,
            status: u.status,
        }));
        return {
        id: tenant.id,
        name: tenant.name,
        initials: tenant.initials,
        contact: tenant.contact,
        phone: tenant.phone,
        email: tenant.email,
        unit: mappedUnits.map((u) => u.number).join(', '),
        floor: tenant.floor,
        type: tenant.type,
        rent: tenant.rent,
        deposit: tenant.deposit,
        leaseStart: tenant.lease_start,
        leaseEnd: tenant.lease_end,
        paymentMethod: tenant.payment_method,
        status: tenant.status,
        units: mappedUnits,
        leases: (tenant.leases ?? []).map((lease) => ({
            id: lease.id,
            unitId: lease.unit_id,
            startDate: lease.start_date,
            endDate: lease.end_date,
            rent: lease.rent,
            deposit: lease.deposit,
            paymentMethod: lease.payment_method,
            status: lease.status,
            endedAt: lease.ended_at,
            terms: lease.terms,
        })),
    }};
    const mappedTenants = (tenantRows ?? []).map(mapTenant);
    const mappedArchivedTenants = (archivedTenantRows ?? []).map(mapTenant);
    const availableUnits = (unitRows ?? []).filter(
        (unit) => unit.status === 'vacant' && unit.tenant_id === null,
    );
    const defaultUnit = availableUnits[0];
    const [isSaving, setIsSaving] = useState(false);
    const [addErrors, setAddErrors] = useState({});
    const [editErrors, setEditErrors] = useState({});
    const createDefaultAddForm = () => ({
        name: '',
        contact: '',
        phone: '',
        email: '',
        unit_id: defaultUnit?.id ?? '',
        occupation: '',
        monthlyIncome: '',
        emergencyContact: '',
        moveInDate: '',
        leaseDuration: '6',
        notes: '',
    });
    const [tenants, setTenants] = useState(mappedTenants);
    const [archivedTenants, setArchivedTenants] = useState(
        mappedArchivedTenants,
    );
    const [viewMode, setViewMode] = useState('active');
    const [search, setSearch] = useState('');
    const [filterStatus, setFilter] = useState('all');
    const [selected, setSelected] = useState(null);
    const [addOpen, setAddOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [renewOpen, setRenewOpen] = useState(false);
    const [addForm, setAddForm] = useState(createDefaultAddForm());
    const [editForm, setEditForm] = useState({});
    const [renewForm, setRenewForm] = useState({
        leaseStart: '',
        leaseEnd: '',
        rent: '',
        deposit: '',
        terms: '',
    });
    const [renewErrors, setRenewErrors] = useState({});
    const [moveOutOpen, setMoveOutOpen] = useState(false);
    const [moveOutForm, setMoveOutForm] = useState({
        reason: '',
        notes: '',
        damages: '',
        balanceDue: '0',
    });
    const [moveOutErrors, setMoveOutErrors] = useState({});
    const [confirmAction, setConfirmAction] = useState(null);
    const [detailTab, setDetailTab] = useState('Overview');

    useEffect(() => {
        if (detailOpen) {
            setDetailTab('Overview');
        }
    }, [detailOpen]);
    const lastHandledSignal = useRef(openAddSignal);
    const credentials = flash?.tenant_credentials ?? null;
    const currentCredentialKey = credentials
        ? `${credentials.email}:${credentials.temp_password}`
        : null;
    const [dismissedCredentialKey, setDismissedCredentialKey] = useState(null);
    const credentialsOpen =
        Boolean(credentials) && dismissedCredentialKey !== currentCredentialKey;
    const credentialMessage = credentials
        ? `Hi! Your Pandarawan RTMS account is ready. Email: ${credentials.email} / Temp password: ${credentials.temp_password} - please log in and change your password.`
        : '';
    const copyText = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            window.alert('Copied to clipboard.');
        } catch {
            window.prompt('Copy this text:', text);
        }
    };
    useEffect(() => {
        setTenants(mappedTenants);
    }, [tenantRows]);
    useEffect(() => {
        setArchivedTenants(mappedArchivedTenants);
    }, [archivedTenantRows]);
    useEffect(() => {
        if (viewMode !== 'active') {
            setSelected(null);
            setDetailOpen(false);
            setEditOpen(false);
            setRenewOpen(false);
            setMoveOutOpen(false);
        }
    }, [viewMode]);
    useEffect(() => {
        const current = availableUnits.find(
            (unit) => String(unit.id) === String(addForm.unit_id),
        );
        if (current) {
            return;
        }
        const first = availableUnits[0];
        setAddForm((prev) => ({
            ...prev,
            unit_id: first?.id ?? '',
        }));
    }, [unitRows, availableUnits, addForm.unit_id]);
    useEffect(() => {
        if (openAddSignal !== lastHandledSignal.current) {
            setAddOpen(true);
            lastHandledSignal.current = openAddSignal;
        }
    }, [openAddSignal]);
    const visibleTenants = viewMode === 'active' ? tenants : archivedTenants;
    const filtered = visibleTenants.filter((t) => {
        const matchSearch =
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            (t.units ?? []).some((u) =>
                u.number.toLowerCase().includes(search.toLowerCase()),
            );
        const matchStatus = filterStatus === 'all' || t.status === filterStatus;
        return matchSearch && matchStatus;
    });
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
        : [];
    const selectedLeases = selected
        ? [...(selected.leases ?? [])].sort((a, b) => {
              const left = Date.parse(
                  `${toDateInputValue(a.startDate)}T00:00:00`,
              );
              const right = Date.parse(
                  `${toDateInputValue(b.startDate)}T00:00:00`,
              );

              if (Number.isNaN(left) || Number.isNaN(right)) {
                  return b.id - a.id;
              }

              return right - left;
          })
        : [];
    const currentUnitIds = new Set(
        (selected?.units ?? []).map((u) => u.id),
    );
    const transferUnitOptions = selected
        ? (unitRows ?? []).filter(
              (unit) =>
                  currentUnitIds.has(unit.id) ||
                  (unit.status === 'vacant' && unit.tenant_id === null),
          )
        : [];
    const restoreTenant = (tenantId) => {
        setConfirmAction({ type: 'restore', tenantId });
    };
    const confirmRestore = () => {
        if (!confirmAction) return;
        setConfirmAction(null);
        router.post(`/admin/tenants/${confirmAction.tenantId}/restore`);
    };
    const archiveTenant = (tenantId) => {
        setConfirmAction({ type: 'archive', tenantId, name: selected?.name });
    };
    const confirmArchive = () => {
        if (!confirmAction) return;
        setConfirmAction(null);
        router.delete(`/admin/tenants/${confirmAction.tenantId}`, {
            onSuccess: () => {
                setDetailOpen(false);
                setSelected(null);
            },
        });
    };
    const columns = [
        {
            key: 'name',
            label: 'Tenant',
            render: (_, row) => (
                <div className="flex items-center gap-2.5">
                    <Avatar initials={row.initials} name={row.name} size="sm" />
                    <div>
                        <p className="font-medium text-[#1B2B4B]">{row.name}</p>
                        <p className="text-xs text-[#5C6B88]">{row.contact}</p>
                    </div>
                </div>
            ),
        },
        { key: 'unit', label: 'Unit', width: 70 },
        { key: 'type', label: 'Type' },
        {
            key: 'leaseEnd',
            label: 'Lease End',
            render: (v) => formatDateDisplay(v),
        },
        {
            key: 'rent',
            label: 'Monthly Rent',
            align: 'right',
            render: (v) => (
                <span className="font-semibold">P{v.toLocaleString()}</span>
            ),
        },
        {
            key: 'paymentMethod',
            label: 'Method',
            render: (v) => methodBadge(v),
        },
        {
            key: 'status',
            label: 'Status',
            align: 'center',
            render: (v) => statusBadge(v),
        },
        {
            key: 'id',
            label: '',
            width: 80,
            align: 'right',
            render: (_, row) => (
                viewMode === 'active' ? (
                    <Button
                        variant="ghost"
                        size="xs"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelected(row);
                            setDetailOpen(true);
                        }}
                    >
                        View
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        size="xs"
                        onClick={(e) => {
                            e.stopPropagation();
                            restoreTenant(row.id);
                        }}
                    >
                        Restore
                    </Button>
                )
            ),
        },
    ];
    const active = tenants.filter((t) => t.status === 'active').length;
    const pendingPayment = tenants.filter((t) => t.status === 'pending_payment').length;
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
    const saveTenant = () => {
        setAddErrors({});
        setIsSaving(true);
        const initials =
            addForm.name
                .split(' ')
                .filter(Boolean)
                .map((s) => s[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'NT';
        router.post('/admin/tenants', {
            name: addForm.name,
            initials,
            contact: addForm.contact,
            phone: addForm.phone || 'N/A',
            email: addForm.email,
            unit_id: Number(addForm.unit_id),
            lease_start: addForm.moveInDate,
            occupation: addForm.occupation,
            monthly_income: addForm.monthlyIncome ? Number(addForm.monthlyIncome) : undefined,
            emergency_contact: addForm.emergencyContact,
            lease_duration: Number(addForm.leaseDuration),
            status: 'active',
        }, {
            onSuccess: () => {
                setIsSaving(false);
                setAddOpen(false);
                setAddForm(createDefaultAddForm());
                setAddErrors({});
            },
            onError: (errors) => {
                setIsSaving(false);
                setAddErrors(errors || {});
                scrollToFirstError(errors);
            },
        });
    };
    const startEdit = () => {
        if (!selected) return;
        setEditForm({
            ...selected,
            unit_id: selected.units?.[0]?.id ?? '',
        });
        setEditOpen(true);
    };
    const saveEdit = () => {
        if (!selected) return;
        setConfirmAction({ type: 'edit' });
    };

    const confirmEdit = () => {
        if (!selected) return;
        setConfirmAction(null);
        setEditErrors({});
        router.patch(`/admin/tenants/${selected.id}`, {
            contact: editForm.contact,
            phone: editForm.phone,
            email: editForm.email,
            unit_id: editForm.unit_id ? Number(editForm.unit_id) : undefined,
            payment_method: editForm.paymentMethod,
            status: editForm.status,
        }, {
            onSuccess: () => {
                setEditOpen(false);
                setDetailOpen(false);
                setSelected(null);
            },
            onError: (errors) => {
                setEditErrors(errors || {});
                scrollToFirstError(errors);
            },
        });
    };
    const closeMoveOut = () => {
        setMoveOutOpen(false);
        setMoveOutForm({ reason: '', notes: '', damages: '', balanceDue: '0' });
        setMoveOutErrors({});
    };

    const openRenew = () => {
        if (!selected) return;
        const latestLease = selectedLeases[0] ?? null;
        setRenewErrors({});
        setRenewForm({
            leaseStart: addDaysToDateInput(
                latestLease?.endDate ?? selected.leaseEnd,
                1,
            ),
            leaseEnd: '',
            rent: String(latestLease?.rent ?? selected.rent ?? ''),
            deposit: String(latestLease?.deposit ?? selected.deposit ?? ''),
            terms: String(latestLease?.terms ?? ''),
        });
        setRenewOpen(true);
    };

    const saveMoveOut = () => {
        if (!selected) return;
        setConfirmAction({ type: 'moveOut', name: selected.name });
    };

    const confirmMoveOut = () => {
        if (!selected) return;
        setConfirmAction(null);
        setMoveOutErrors({});

        router.post(`/admin/tenants/${selected.id}/move-out`, {
            reason: moveOutForm.reason.trim(),
            notes: moveOutForm.notes.trim() || null,
            damages: moveOutForm.damages.trim() || null,
            balance_due: Number(moveOutForm.balanceDue || 0),
        }, {
            onError: (errors) => {
                setMoveOutErrors({
                    reason: errors.reason,
                    notes: errors.notes,
                    damages: errors.damages,
                    balanceDue: errors.balance_due,
                    general: Object.values(errors).join(', '),
                });
                scrollToFirstError(errors);
            },
            onSuccess: () => {
                setMoveOutOpen(false);
                setMoveOutForm({ reason: '', notes: '', damages: '', balanceDue: '0' });
            },
        });
    };

    const saveRenew = () => {
        if (!selected) return;
        setConfirmAction({ type: 'renew' });
    };

    const confirmRenew = () => {
        if (!selected) return;
        setConfirmAction(null);
        setRenewErrors({});

        router.post(`/admin/tenants/${selected.id}/renew`, {
            lease_start: renewForm.leaseStart,
            lease_end: renewForm.leaseEnd,
            rent: Number(renewForm.rent || 0),
            deposit: Number(renewForm.deposit || 0),
            terms: renewForm.terms || null,
        }, {
                onError: (errors) => {
                    setRenewErrors({
                        leaseStart: errors.lease_start,
                        leaseEnd: errors.lease_end,
                        rent: errors.rent,
                        deposit: errors.deposit,
                        terms: errors.terms,
                        general: errors.unit,
                    });
                    scrollToFirstError(errors);
                },
                onSuccess: () => {
                    setRenewOpen(false);
                    setDetailOpen(false);
                    setSelected(null);
                },
            });
    };
    return (
        <div className="space-y-5">
            <div className="flex gap-3">
                {[
                    {
                        label: 'Total',
                        count: tenants.length,
                        color: 'text-[#1B2B4B]',
                    },
                    { label: 'Active', count: active, color: 'text-[#1D7B6E]' },
                    {
                        label: 'Pending',
                        count: pendingPayment,
                        color: 'text-amber-600',
                    },
                ].map((s) => (
                    <div
                        key={s.label}
                        className="flex items-center gap-3 rounded-xl border border-[#1B2B4B]/10 bg-white px-5 py-3 shadow-sm transition-colors hover:bg-gray-50"
                    >
                        <span className={`text-2xl font-bold ${s.color}`}>
                            {s.count}
                        </span>
                        <span className="text-sm text-[#5C6B88]">
                            {s.label}
                        </span>
                    </div>
                ))}
            </div>

            <Card>
                <Card.Header
                    title={
                        viewMode === 'active'
                            ? 'All Tenants'
                            : 'Archived Tenants'
                    }
                    action={
                        <div className="flex items-center gap-2">
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
                            {viewMode === 'active' && (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => setAddOpen(true)}
                                >
                                    + Add Tenant
                                </Button>
                            )}
                        </div>
                    }
                />

                <div className="flex items-center gap-3 border-b border-[#1B2B4B]/8 px-5 py-3">
                    <Input
                        placeholder="Search tenant or unit..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-60"
                    />
                    <Select
                        value={filterStatus}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-36"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="pending_payment">Pending Payment</option>
                    </Select>
                </div>

                <Table
                    columns={columns}
                    data={filtered}
                    keyField={'id'}
                    emptyText="No tenants match your search."
                    onRowClick={(row) => {
                        if (viewMode !== 'active') {
                            return;
                        }
                        setSelected(row);
                        setDetailOpen(true);
                    }}
                />
                <Card.Footer>
                    Showing {filtered.length} of {visibleTenants.length} tenants
                </Card.Footer>
            </Card>

            {selected && (
                <Modal
                    open={detailOpen}
                    onClose={() => setDetailOpen(false)}
                    title="Tenant Profile"
                    size="2xl"
                    footer={
                        <div className="flex w-full items-center justify-between gap-2">

                            <div className='flex gap-3'>
                                <Button
                                    variant="danger"
                                    onClick={() => setMoveOutOpen(true)}
                                >
                                    Move Out
                                </Button>
                                
                                <Button
                                    variant="danger"
                                    onClick={() => archiveTenant(selected.id)}
                                >
                                    Archive
                                </Button>
                            </div>

                            <div className='flex gap-3'>
                                <Button variant="primary" onClick={startEdit}>
                                    Edit Tenant
                                </Button>
                                <Button variant="secondary" onClick={openRenew}>
                                    Renew Lease
                                </Button>

                            </div>
 
                        </div>
                    }
                >
                    <div className="space-y-6">
                        {/* ── Sticky Header ── */}
                        <div className="">
                            <div className="flex items-center gap-4">
                                <Avatar
                                    initials={selected.initials}
                                    name={selected.name}
                                    size="lg"
                                />
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-lg font-bold text-[#1B2B4B]">
                                        {selected.name}
                                    </h2>
                                    <p className="text-sm text-[#5C6B88]">
                                        {selected.units && selected.units.length > 0
                                            ? selected.units.map((u) => `Unit ${u.number} (${u.floor} - ${u.type})`).join(', ')
                                            : `Unit ${selected.unit} · ${selected.floor} · ${selected.type}`}
                                    </p>
                                </div>
                                {statusBadge(selected.status)}
                            </div>
                        </div>

                        {/* ── Tabs ── */}
                        <div className="flex gap-1 border-b border-[#1B2B4B]/8 pb-px">
                            {['Overview', 'Payments', 'Lease Records', 'Maintenance'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setDetailTab(tab)}
                                    className={[
                                        'rounded-t-lg px-4 py-2 text-xs font-semibold transition-all',
                                        detailTab === tab
                                            ? 'bg-[#1B2B4B]/5 text-[#1B2B4B]'
                                            : 'text-[#5C6B88] hover:text-[#1B2B4B]',
                                    ].join(' ')}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* ── Overview Tab ── */}
                        {detailTab === 'Overview' && (
                            <div className="space-y-5">
                                <div className="grid gap-5 md:grid-cols-2">
                                    {/* A. Personal Information */}
                                    <div className="rounded-xl border border-[#1B2B4B]/10 bg-white p-5 shadow-sm">
                                        <p className="mb-4 text-[11px] font-bold tracking-wider text-[#5C6B88] uppercase">
                                            Personal Information
                                        </p>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs text-[#5C6B88]">Contact</p>
                                                <p className="text-sm font-semibold text-[#1B2B4B]">{selected.contact}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-[#5C6B88]">Phone</p>
                                                <p className="text-sm font-semibold text-[#1B2B4B]">{selected.phone}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-[#5C6B88]">Email</p>
                                                <p className="text-sm font-semibold text-[#1B2B4B]">{selected.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* B. Lease Information */}
                                    <div className="rounded-xl border border-[#1B2B4B]/10 bg-white p-5 shadow-sm">
                                        <p className="mb-4 text-[11px] font-bold tracking-wider text-[#5C6B88] uppercase">
                                            Lease Information
                                        </p>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs text-[#5C6B88]">Occupied Unit</p>
                                                <p className="text-sm font-semibold text-[#1B2B4B]">
                                                    {selected.units && selected.units.length > 0
                                                        ? selected.units.map((u) => `Unit ${u.number} (${u.floor} - ${u.type})`).join(', ')
                                                        : `Unit ${selected.unit} · ${selected.floor} · ${selected.type}`}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-[#5C6B88]">Lease Start</p>
                                                <p className="text-sm font-semibold text-[#1B2B4B]">{formatDateDisplay(selected.leaseStart)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-[#5C6B88]">Lease End</p>
                                                <p className="text-sm font-semibold text-[#1B2B4B]">{formatDateDisplay(selected.leaseEnd)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-[#5C6B88]">Monthly Rent</p>
                                                <p className="text-sm font-bold text-[#1B2B4B]">P{selected.rent.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-[#5C6B88]">Security Deposit</p>
                                                <p className="text-sm font-semibold text-[#1B2B4B]">P{selected.deposit.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-[#5C6B88]">Payment Method</p>
                                                <div className="mt-1">{methodBadge(selected.paymentMethod)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* C. Payment History */}
                                    <div className="rounded-xl border border-[#1B2B4B]/10 bg-white p-5 shadow-sm">
                                        <p className="mb-4 text-[11px] font-bold tracking-wider text-[#5C6B88] uppercase">
                                            Payment History
                                        </p>
                                        {tenantInvoices.length === 0 ? (
                                            <p className="text-sm text-[#5C6B88]">No invoices found.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {tenantInvoices.map((inv) => (
                                                    <div key={inv.id} className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm font-medium text-[#1B2B4B]">{inv.period}</p>
                                                            <p className="text-xs text-[#5C6B88]">{inv.invoiceNo}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-semibold">P{inv.total.toLocaleString()}</span>
                                                            {statusBadge(inv.status)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* D. Lease History */}
                                    <div className="rounded-xl border border-[#1B2B4B]/10 bg-white p-5 shadow-sm">
                                        <p className="mb-4 text-[11px] font-bold tracking-wider text-[#5C6B88] uppercase">
                                            Lease History
                                        </p>
                                        {selectedLeases.length === 0 ? (
                                            <p className="text-sm text-[#5C6B88]">No lease records found.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {selectedLeases.map((lease) => (
                                                    <div key={lease.id}>
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-medium text-[#1B2B4B]">
                                                                {formatDateDisplay(lease.startDate)} - {formatDateDisplay(lease.endDate)}
                                                            </p>
                                                            {leaseStatusBadge(lease.status)}
                                                        </div>
                                                        <p className="mt-0.5 text-xs text-[#5C6B88]">
                                                            Rent: P{Number(lease.rent).toLocaleString()} · Deposit: P{Number(lease.deposit).toLocaleString()} · {lease.paymentMethod}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Payments Tab ── */}
                        {detailTab === 'Payments' && (
                            <div className="space-y-4">
                                {tenantInvoices.length === 0 ? (
                                    <p className="text-sm text-[#5C6B88]">No payment records found.</p>
                                ) : (
                                    tenantInvoices.map((inv) => (
                                        <div key={inv.id} className="flex items-center justify-between rounded-xl border border-[#1B2B4B]/10 bg-white p-4 shadow-sm">
                                            <div>
                                                <p className="text-sm font-semibold text-[#1B2B4B]">{inv.period}</p>
                                                <p className="text-xs text-[#5C6B88]">{inv.invoiceNo}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-bold">P{inv.total.toLocaleString()}</span>
                                                {statusBadge(inv.status)}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* ── Lease Records Tab ── */}
                        {detailTab === 'Lease Records' && (
                            <div className="space-y-4">
                                {selectedLeases.length === 0 ? (
                                    <p className="text-sm text-[#5C6B88]">No lease records found.</p>
                                ) : (
                                    selectedLeases.map((lease) => (
                                        <div key={lease.id} className="rounded-xl border border-[#1B2B4B]/10 bg-white p-5 shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold text-[#1B2B4B]">
                                                    {formatDateDisplay(lease.startDate)} - {formatDateDisplay(lease.endDate)}
                                                </p>
                                                {leaseStatusBadge(lease.status)}
                                            </div>
                                            <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <p className="text-xs text-[#5C6B88]">Rent</p>
                                                    <p className="font-semibold text-[#1B2B4B]">P{Number(lease.rent).toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-[#5C6B88]">Deposit</p>
                                                    <p className="font-semibold text-[#1B2B4B]">P{Number(lease.deposit).toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-[#5C6B88]">Method</p>
                                                    <div className="mt-0.5">{methodBadge(lease.paymentMethod)}</div>
                                                </div>
                                            </div>
                                            {lease.terms && (
                                                <div className="mt-3 border-t border-[#1B2B4B]/8 pt-3">
                                                    <p className="text-xs text-[#5C6B88]">Terms</p>
                                                    <p className="mt-1 whitespace-pre-wrap text-sm text-[#1B2B4B]">{lease.terms}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* ── Maintenance Tab ── */}
                        {detailTab === 'Maintenance' && (
                            <p className="text-sm text-[#5C6B88]">Maintenance requests coming soon.</p>
                        )}
                    </div>
                </Modal>
            )}

            {selected && (
                <Modal
                    open={renewOpen}
                    onClose={() => setRenewOpen(false)}
                    title="Renew Lease"
                    size="md"
                    footer={
                        <>
                            <Button
                                variant="ghost"
                                onClick={() => setRenewOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={saveRenew}>
                                Create Renewal
                            </Button>
                        </>
                    }
                >
                    <div className="mb-4 rounded-xl border border-[#1B2B4B]/12 bg-[#F7FAFF] px-4 py-3">
                        <p className="text-xs font-semibold tracking-wider text-[#5C6B88] uppercase">
                            Renewal Guide
                        </p>
                        <p className="mt-1 text-sm text-[#1B2B4B]">
                            Start the new lease after the current term ends to avoid date overlap.
                        </p>
                        <p className="mt-1 text-xs text-[#5C6B88]">
                            Current lease end:{' '}
                            {formatDateDisplay(
                                selectedLeases[0]?.endDate ?? selected.leaseEnd,
                            )}
                        </p>
                    </div>

                    {renewErrors.general && (
                        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {renewErrors.general}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Lease Start"
                            type="date"
                            value={renewForm.leaseStart}
                            onChange={(e) =>
                                setRenewForm((f) => {
                                    setRenewErrors((prev) => ({
                                        ...prev,
                                        leaseStart: undefined,
                                        general: undefined,
                                    }));
                                    return {
                                        ...f,
                                        leaseStart: e.target.value,
                                    };
                                })
                            }
                            error={renewErrors.leaseStart}
                            helper="Tip: start date should be after the current lease end date."
                            full
                        />
                        <Input
                            label="Lease End"
                            type="date"
                            value={renewForm.leaseEnd}
                            onChange={(e) =>
                                setRenewForm((f) => {
                                    setRenewErrors((prev) => ({
                                        ...prev,
                                        leaseEnd: undefined,
                                    }));
                                    return {
                                        ...f,
                                        leaseEnd: e.target.value,
                                    };
                                })
                            }
                            error={renewErrors.leaseEnd}
                            helper="End date can be the same day or later than start date."
                            full
                        />
                        <Input
                            label="Monthly Rent"
                            type="number"
                            value={renewForm.rent}
                            onChange={(e) =>
                                setRenewForm((f) => {
                                    setRenewErrors((prev) => ({
                                        ...prev,
                                        rent: undefined,
                                    }));
                                    return {
                                        ...f,
                                        rent: e.target.value,
                                    };
                                })
                            }
                            error={renewErrors.rent}
                            full
                        />
                        <Input
                            label="Security Deposit"
                            type="number"
                            value={renewForm.deposit}
                            onChange={(e) =>
                                setRenewForm((f) => {
                                    setRenewErrors((prev) => ({
                                        ...prev,
                                        deposit: undefined,
                                    }));
                                    return {
                                        ...f,
                                        deposit: e.target.value,
                                    };
                                })
                            }
                            error={renewErrors.deposit}
                            full
                        />
                        <div className="col-span-2">
                            <Textarea
                                label="Lease Terms"
                                placeholder="Optional lease terms..."
                                value={renewForm.terms}
                                onChange={(e) =>
                                    setRenewForm((f) => {
                                        setRenewErrors((prev) => ({
                                            ...prev,
                                            terms: undefined,
                                        }));
                                        return {
                                            ...f,
                                            terms: e.target.value,
                                        };
                                    })
                                }
                                error={renewErrors.terms}
                                full
                            />
                        </div>
                    </div>
                </Modal>
            )}

            <Modal
                open={addOpen}
                onClose={() => {
                    if (!isSaving) {
                        setAddOpen(false);
                        setAddErrors({});
                    }
                }}
                title="Add New Tenant"
                size="lg"
                footer={
                    <>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                if (!isSaving) {
                                    setAddOpen(false);
                                    setAddErrors({});
                                }
                            }}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={saveTenant}
                            disabled={availableUnits.length === 0 || isSaving}
                            loading={isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save Tenant'}
                        </Button>
                    </>
                }
            >
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Input
                            label="Business Name"
                            placeholder="e.g. ABC Corp"
                            value={addForm.name}
                            onChange={(e) => {
                                setAddForm((f) => ({ ...f, name: e.target.value }));
                                if (addErrors.name) {
                                    setAddErrors((e) => ({ ...e, name: undefined }));
                                }
                            }}
                            full
                            required
                        />
                        {addErrors.name && (
                            <p className="mt-1 text-xs text-red-600">{addErrors.name}</p>
                        )}
                    </div>
                    <div>
                        <Input
                            label="Contact Person"
                            placeholder="Full name"
                            value={addForm.contact}
                            onChange={(e) => {
                                setAddForm((f) => ({ ...f, contact: e.target.value }));
                                if (addErrors.contact) {
                                    setAddErrors((e) => ({ ...e, contact: undefined }));
                                }
                            }}
                            full
                            required
                        />
                        {addErrors.contact && (
                            <p className="mt-1 text-xs text-red-600">{addErrors.contact}</p>
                        )}
                    </div>
                    <div>
                        <Input
                            label="Phone"
                            placeholder="09XX XXX XXXX"
                            value={addForm.phone}
                            onChange={(e) => {
                                setAddForm((f) => ({ ...f, phone: e.target.value }));
                                if (addErrors.phone) {
                                    setAddErrors((e) => ({ ...e, phone: undefined }));
                                }
                            }}
                            full
                        />
                        {addErrors.phone && (
                            <p className="mt-1 text-xs text-red-600">{addErrors.phone}</p>
                        )}
                    </div>
                    <div>
                        <Input
                            label="Email"
                            placeholder="email@domain.com"
                            type="email"
                            value={addForm.email}
                            onChange={(e) => {
                                setAddForm((f) => ({ ...f, email: e.target.value }));
                                if (addErrors.email) {
                                    setAddErrors((e) => ({ ...e, email: undefined }));
                                }
                            }}
                            full
                            required
                        />
                        {addErrors.email && (
                            <p className="mt-1 text-xs text-red-600">{addErrors.email}</p>
                        )}
                    </div>
                    <div>
                        <Select
                            label="Unit (Available Only)"
                            value={String(addForm.unit_id)}
                            onChange={(e) => {
                                setAddForm((f) => ({ ...f, unit_id: e.target.value }));
                                if (addErrors.unit_id) {
                                    setAddErrors((e) => ({ ...e, unit_id: undefined }));
                                }
                            }}
                            full
                        >
                            <option value="">Select a unit</option>
                            {availableUnits.length === 0 && (
                                <option value="" disabled>No available units</option>
                            )}
                            {availableUnits.map((unit) => (
                                <option key={unit.id} value={String(unit.id)}>
                                    {unit.number} · {unit.floor} · {unit.type}
                                </option>
                            ))}
                        </Select>
                        {addErrors.unit_id && (
                            <p className="mt-1 text-xs text-red-600">{addErrors.unit_id}</p>
                        )}
                    </div>
                    <div>
                        <Input
                            label="Occupation"
                            placeholder="e.g. Business Owner"
                            value={addForm.occupation}
                            onChange={(e) => {
                                setAddForm((f) => ({ ...f, occupation: e.target.value }));
                                if (addErrors.occupation) {
                                    setAddErrors((e) => ({ ...e, occupation: undefined }));
                                }
                            }}
                            full
                        />
                        {addErrors.occupation && (
                            <p className="mt-1 text-xs text-red-600">{addErrors.occupation}</p>
                        )}
                    </div>
                    <div>
                        <Input
                            label="Monthly Income"
                            type="number"
                            min="0"
                            placeholder="e.g. 50000"
                            value={addForm.monthlyIncome}
                            onChange={(e) => {
                                setAddForm((f) => ({ ...f, monthlyIncome: e.target.value }));
                                if (addErrors.monthlyIncome) {
                                    setAddErrors((e) => ({ ...e, monthlyIncome: undefined }));
                                }
                            }}
                            full
                        />
                        {addErrors.monthlyIncome && (
                            <p className="mt-1 text-xs text-red-600">{addErrors.monthlyIncome}</p>
                        )}
                    </div>
                    <div className="col-span-2">
                        <Input
                            label="Emergency Contact"
                            placeholder="Full name and contact number"
                            value={addForm.emergencyContact}
                            onChange={(e) => {
                                setAddForm((f) => ({ ...f, emergencyContact: e.target.value }));
                                if (addErrors.emergencyContact) {
                                    setAddErrors((e) => ({ ...e, emergencyContact: undefined }));
                                }
                            }}
                            full
                        />
                        {addErrors.emergencyContact && (
                            <p className="mt-1 text-xs text-red-600">{addErrors.emergencyContact}</p>
                        )}
                    </div>
                    <div>
                        <Input
                            label="Move-In Date"
                            type="date"
                            value={addForm.moveInDate}
                            onChange={(e) => {
                                setAddForm((f) => ({ ...f, moveInDate: e.target.value }));
                                if (addErrors.lease_start) {
                                    setAddErrors((e) => ({ ...e, lease_start: undefined }));
                                }
                            }}
                            full
                            required
                        />
                        {addErrors.lease_start && (
                            <p className="mt-1 text-xs text-red-600">{addErrors.lease_start}</p>
                        )}
                    </div>
                    <div>
                        <Select
                            label="Lease Duration"
                            value={addForm.leaseDuration}
                            onChange={(e) =>
                                setAddForm((f) => ({ ...f, leaseDuration: e.target.value }))
                            }
                            full
                            required
                        >
                            <option value="3">3 months</option>
                            <option value="6">6 months</option>
                            <option value="12">12 months</option>
                        </Select>
                    </div>
                    <div className="col-span-2">
                        <Textarea
                            label="Notes"
                            placeholder="Optional notes"
                            value={addForm.notes}
                            onChange={(e) =>
                                setAddForm((f) => ({ ...f, notes: e.target.value }))
                            }
                            full
                        />
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
                            <Button
                                variant="ghost"
                                onClick={() => setEditOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={saveEdit}>
                                Save Changes
                            </Button>
                        </>
                    }
                >
                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Unit"
                            value={String(editForm.unit_id ?? '')}
                            onChange={(e) =>
                                setEditForm((f) => ({
                                    ...f,
                                    unit_id: e.target.value,
                                }))
                            }
                            full
                        >
                            {transferUnitOptions.map((unit) => (
                                <option key={unit.id} value={String(unit.id)}>
                                    {unit.number} · {unit.floor} · {unit.type}
                                </option>
                            ))}
                        </Select>
                        <Input
                            label="Contact"
                            value={String(editForm.contact ?? '')}
                            onChange={(e) =>
                                setEditForm((f) => ({
                                    ...f,
                                    contact: e.target.value,
                                }))
                            }
                            full
                        />
                        <Input
                            label="Phone"
                            value={String(editForm.phone ?? '')}
                            onChange={(e) =>
                                setEditForm((f) => ({
                                    ...f,
                                    phone: e.target.value,
                                }))
                            }
                            full
                        />
                        <Input
                            label="Email"
                            type="email"
                            value={String(editForm.email ?? '')}
                            onChange={(e) =>
                                setEditForm((f) => ({
                                    ...f,
                                    email: e.target.value,
                                }))
                            }
                            full
                        />
                        <Select
                            label="Method"
                            value={String(editForm.paymentMethod ?? 'GCash')}
                            onChange={(e) =>
                                setEditForm((f) => ({
                                    ...f,
                                    paymentMethod: e.target.value,
                                }))
                            }
                            full
                        >
                            <option value="GCash">GCash</option>
                            <option value="Cash">Cash</option>
                        </Select>
                        <Select
                            label="Status"
                            value={String(editForm.status ?? 'active')}
                            onChange={(e) =>
                                setEditForm((f) => ({
                                    ...f,
                                    status: e.target.value,
                                }))
                            }
                            full
                        >
                            <option value="active">Active</option>
                            <option value="pending_payment">Pending Payment</option>
                            <option value="moved_out">Moved Out</option>
                            <option value="terminated">Terminated</option>
                        </Select>
                    </div>
                </Modal>
            )}

            {selected && (
                <Modal
                    open={moveOutOpen}
                    onClose={() => setMoveOutOpen(false)}
                    title="Move Out Tenant"
                    size="md"
                    footer={
                        <>
                            <Button
                                variant="ghost"
                                onClick={closeMoveOut}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                onClick={saveMoveOut}
                            >
                                Confirm Move Out
                            </Button>
                        </>
                    }
                >
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                        <p className="text-sm font-semibold text-red-700">
                            Moving out {selected.name}
                        </p>
                        <p className="mt-1 text-xs text-red-600">
                            This will end all active leases, free all assigned units, create move-out records, and soft-delete the tenant. This action cannot be undone.
                        </p>
                    </div>

                    {moveOutErrors.general && (
                        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {moveOutErrors.general}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                        <Input
                            label="Reason *"
                            placeholder="e.g. Lease ended, eviction, voluntary move-out"
                            value={moveOutForm.reason}
                            onChange={(e) => {
                                setMoveOutForm((f) => ({ ...f, reason: e.target.value }));
                                setMoveOutErrors((prev) => ({ ...prev, reason: undefined }));
                            }}
                            error={moveOutErrors.reason}
                            full
                        />
                        <Input
                            label="Notes"
                            placeholder="Additional notes about the move-out"
                            value={moveOutForm.notes}
                            onChange={(e) =>
                                setMoveOutForm((f) => ({ ...f, notes: e.target.value }))
                            }
                            full
                        />
                        <Input
                            label="Damages"
                            placeholder="Describe any damages to the unit"
                            value={moveOutForm.damages}
                            onChange={(e) =>
                                setMoveOutForm((f) => ({ ...f, damages: e.target.value }))
                            }
                            full
                        />
                        <Input
                            label="Balance Due (₱)"
                            type="number"
                            placeholder="0"
                            value={moveOutForm.balanceDue}
                            onChange={(e) =>
                                setMoveOutForm((f) => ({ ...f, balanceDue: e.target.value }))
                            }
                            full
                        />
                    </div>
                </Modal>
            )}

            {credentials && (
                <Modal
                    open={credentialsOpen}
                    onClose={() =>
                        setDismissedCredentialKey(currentCredentialKey)
                    }
                    title="Tenant Account Created"
                    size="md"
                    footer={
                        <Button
                            variant="primary"
                            onClick={() =>
                                setDismissedCredentialKey(currentCredentialKey)
                            }
                        >
                            Done
                        </Button>
                    }
                >
                    <div className="space-y-4">
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                            <p className="text-sm text-emerald-900">
                                Account credentials are ready for{' '}
                                <span className="font-semibold">
                                    {credentials.name}
                                </span>
                                . Share these manually with the tenant.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="rounded-xl border border-[#1B2B4B]/12 bg-[#F7FAFF] p-3">
                                <p className="text-xs font-semibold tracking-wider text-[#5C6B88] uppercase">
                                    Email
                                </p>
                                <p className="mt-1 text-sm font-medium break-all text-[#1B2B4B]">
                                    {credentials.email}
                                </p>
                                <Button
                                    className="mt-2"
                                    variant="ghost"
                                    size="xs"
                                    onClick={() => copyText(credentials.email)}
                                >
                                    Copy Email
                                </Button>
                            </div>

                            <div className="rounded-xl border border-[#1B2B4B]/12 bg-[#F7FAFF] p-3">
                                <p className="text-xs font-semibold tracking-wider text-[#5C6B88] uppercase">
                                    Temporary Password
                                </p>
                                <p className="mt-1 text-sm font-medium tracking-wide text-[#1B2B4B]">
                                    {credentials.temp_password}
                                </p>
                                <Button
                                    className="mt-2"
                                    variant="ghost"
                                    size="xs"
                                    onClick={() =>
                                        copyText(credentials.temp_password)
                                    }
                                >
                                    Copy Password
                                </Button>
                            </div>
                        </div>

                        <div>
                            <p className="mb-2 text-xs font-semibold tracking-wider text-[#5C6B88] uppercase">
                                Message Template
                            </p>
                            <textarea
                                aria-label="Message template"
                                value={credentialMessage}
                                readOnly
                                className="h-24 w-full rounded-lg border border-[#1B2B4B]/20 bg-white px-3 py-2 text-sm text-[#1B2B4B]"
                            />
                            <Button
                                className="mt-2"
                                variant="primary"
                                size="sm"
                                onClick={() => copyText(credentialMessage)}
                            >
                                Copy Message
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {confirmAction && (
                <ConfirmModal
                    open
                    onClose={() => setConfirmAction(null)}
                    onConfirm={() => {
                        if (confirmAction.type === 'archive') confirmArchive();
                        if (confirmAction.type === 'restore') confirmRestore();
                        if (confirmAction.type === 'edit') confirmEdit();
                        if (confirmAction.type === 'moveOut') confirmMoveOut();
                        if (confirmAction.type === 'renew') confirmRenew();
                    }}
                    title={
                        confirmAction.type === 'archive' ? 'Archive Tenant' :
                        confirmAction.type === 'restore' ? 'Restore Tenant' :
                        confirmAction.type === 'edit' ? 'Save Changes' :
                        confirmAction.type === 'moveOut' ? 'Confirm Move-Out' :
                        'Renew Lease'
                    }
                    message={
                        confirmAction.type === 'moveOut'
                            ? `Confirm move-out for ${confirmAction.name}? This will end all leases and free all units.`
                            : confirmAction.type === 'archive' ? 'Archive this tenant?' :
                              confirmAction.type === 'restore' ? 'Restore this tenant?' :
                              confirmAction.type === 'edit' ? 'Save changes to this tenant?' :
                              'Create a new lease term for this tenant?'
                    }
                    variant={
                        confirmAction.type === 'archive' || confirmAction.type === 'moveOut'
                            ? 'danger' : 'primary'
                    }
                    confirmLabel={
                        confirmAction.type === 'moveOut' ? 'Confirm Move-Out' :
                        confirmAction.type === 'archive' ? 'Archive' :
                        confirmAction.type === 'restore' ? 'Restore' :
                        confirmAction.type === 'edit' ? 'Save Changes' :
                        'Create Lease'
                    }
                />
            )}
        </div>
    );
}
