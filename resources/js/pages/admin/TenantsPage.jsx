import { router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import Avatar from '../../components/Avatar';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Card from '../../components/Card';
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
    if (s === 'expiring') return <Badge variant="amber">Expiring</Badge>;
    if (s === 'overdue') return <Badge variant="red">Overdue</Badge>;
    return null;
};

const leaseStatusBadge = (status) => {
    if (status === 'active') return <Badge variant="green">Active</Badge>;
    if (status === 'expiring') return <Badge variant="amber">Expiring</Badge>;
    if (status === 'overdue') return <Badge variant="red">Overdue</Badge>;
    if (status === 'ended') return <Badge variant="gray">Ended</Badge>;
    if (status === 'terminated') return <Badge variant="red">Terminated</Badge>;
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
    const mappedTenants = (tenantRows ?? []).map((tenant) => ({
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
        leases: (tenant.leases ?? []).map((lease) => ({
            id: lease.id,
            startDate: lease.start_date,
            endDate: lease.end_date,
            rent: lease.rent,
            deposit: lease.deposit,
            paymentMethod: lease.payment_method,
            status: lease.status,
            endedAt: lease.ended_at,
            terms: lease.terms,
        })),
    }));
    const mappedArchivedTenants = (archivedTenantRows ?? []).map((tenant) => ({
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
        leases: (tenant.leases ?? []).map((lease) => ({
            id: lease.id,
            startDate: lease.start_date,
            endDate: lease.end_date,
            rent: lease.rent,
            deposit: lease.deposit,
            paymentMethod: lease.payment_method,
            status: lease.status,
            endedAt: lease.ended_at,
            terms: lease.terms,
        })),
    }));
    const availableUnits = (unitRows ?? []).filter(
        (unit) => unit.status === 'vacant' && unit.tenant_id === null,
    );
    const defaultUnit = availableUnits[0];
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
    const [addForm, setAddForm] = useState({
        name: '',
        contact: '',
        phone: '',
        email: '',
        unit: defaultUnit?.number ?? '',
        floor: defaultUnit?.floor ?? 'GF',
        type: defaultUnit?.type ?? 'Office',
        rent: String(defaultUnit?.base_rent ?? ''),
        paymentMethod: 'GCash',
        leaseStart: '',
        leaseEnd: '',
        notes: '',
    });
    const [editForm, setEditForm] = useState({});
    const [renewForm, setRenewForm] = useState({
        leaseStart: '',
        leaseEnd: '',
        rent: '',
        deposit: '',
        paymentMethod: 'GCash',
        terms: '',
    });
    const [renewErrors, setRenewErrors] = useState({});
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
        }
    }, [viewMode]);
    useEffect(() => {
        const current = availableUnits.find(
            (unit) => unit.number === addForm.unit,
        );
        if (current) {
            return;
        }
        const first = availableUnits[0];
        setAddForm((prev) => ({
            ...prev,
            unit: first?.number ?? '',
            floor: first?.floor ?? 'GF',
            type: first?.type ?? 'Office',
            rent: String(first?.base_rent ?? ''),
        }));
    }, [unitRows, availableUnits, addForm.unit]);
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
            String(t.unit ?? '')
                .toLowerCase()
                .includes(search.toLowerCase());
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
    const transferUnitOptions = selected
        ? (unitRows ?? []).filter(
              (unit) =>
                  unit.number === selected.unit ||
                  (unit.status === 'vacant' && unit.tenant_id === null),
          )
        : [];
    const restoreTenant = (tenantId) => {
        if (!window.confirm('Restore this tenant?')) {
            return;
        }
        router.post(`/admin/tenants/${tenantId}/restore`);
    };
    const archiveTenant = (tenantId) => {
        if (!window.confirm('Archive this tenant?')) {
            return;
        }
        router.delete(`/admin/tenants/${tenantId}`);
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
    const expiring = tenants.filter((t) => t.status === 'expiring').length;
    const overdue = tenants.filter((t) => t.status === 'overdue').length;
    const saveTenant = () => {
        if (
            !addForm.name ||
            !addForm.contact ||
            !addForm.email ||
            !addForm.unit ||
            !addForm.leaseStart ||
            !addForm.leaseEnd
        ) {
            return;
        }
        if (!window.confirm('Add this tenant profile?')) {
            return;
        }
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
            unit: addForm.unit,
            floor: addForm.floor,
            type: addForm.type,
            rent: Number(addForm.rent || 0),
            deposit: Number(addForm.rent || 0) * 2,
            lease_start: addForm.leaseStart,
            lease_end: addForm.leaseEnd,
            payment_method: addForm.paymentMethod,
            status: 'active',
        });
    };
    const startEdit = () => {
        if (!selected) return;
        setEditForm({
            ...selected,
            unit: selected.unit,
        });
        setEditOpen(true);
    };
    const saveEdit = () => {
        if (!selected) return;
        if (!window.confirm('Save changes to this tenant?')) {
            return;
        }
        router.patch(`/admin/tenants/${selected.id}`, {
            contact: editForm.contact,
            phone: editForm.phone,
            email: editForm.email,
            unit: editForm.unit,
            payment_method: editForm.paymentMethod,
            status: editForm.status,
        });
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
            paymentMethod:
                latestLease?.paymentMethod ?? selected.paymentMethod ?? 'GCash',
            terms: String(latestLease?.terms ?? ''),
        });
        setRenewOpen(true);
    };
    const saveRenew = () => {
        if (!selected) return;

        const nextErrors = {};

        if (!renewForm.leaseStart) {
            nextErrors.leaseStart = 'Lease start date is required.';
        }
        if (!renewForm.leaseEnd) {
            nextErrors.leaseEnd = 'Lease end date is required.';
        }
        if (!renewForm.rent) {
            nextErrors.rent = 'Monthly rent is required.';
        } else if (Number(renewForm.rent) <= 0) {
            nextErrors.rent = 'Monthly rent must be greater than 0.';
        }
        if (!renewForm.deposit) {
            nextErrors.deposit = 'Security deposit is required.';
        } else if (Number(renewForm.deposit) < 0) {
            nextErrors.deposit = 'Security deposit cannot be negative.';
        }

        const latestLeaseEnd = toDateInputValue(
            selectedLeases[0]?.endDate ?? selected.leaseEnd,
        );

        if (
            latestLeaseEnd &&
            renewForm.leaseStart &&
            renewForm.leaseStart <= latestLeaseEnd
        ) {
            nextErrors.leaseStart =
                'Renewal start date must be after the current lease end date.';
        }

        if (
            renewForm.leaseStart &&
            renewForm.leaseEnd &&
            renewForm.leaseEnd < renewForm.leaseStart
        ) {
            nextErrors.leaseEnd =
                'Lease end date must be on or after lease start date.';
        }

        if (Object.keys(nextErrors).length > 0) {
            setRenewErrors(nextErrors);
            return;
        }

        if (!window.confirm('Create a new lease term for this tenant?')) {
            return;
        }

        setRenewErrors({});

        router.post(`/admin/tenants/${selected.id}/renew`, {
            lease_start: renewForm.leaseStart,
            lease_end: renewForm.leaseEnd,
            rent: Number(renewForm.rent || 0),
            deposit: Number(renewForm.deposit || 0),
            payment_method: renewForm.paymentMethod,
            terms: renewForm.terms || null,
        }, {
            onError: (errors) => {
                setRenewErrors({
                    leaseStart: errors.lease_start,
                    leaseEnd: errors.lease_end,
                    rent: errors.rent,
                    deposit: errors.deposit,
                    paymentMethod: errors.payment_method,
                    terms: errors.terms,
                    general: errors.unit,
                });
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
                        label: 'Expiring',
                        count: expiring,
                        color: 'text-amber-600',
                    },
                    { label: 'Overdue', count: overdue, color: 'text-red-500' },
                ].map((s) => (
                    <div
                        key={s.label}
                        className="flex items-center gap-3 rounded-xl border border-[#1B2B4B]/10 bg-white px-5 py-3 shadow-sm"
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
                        <option value="expiring">Expiring</option>
                        <option value="overdue">Overdue</option>
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
                    size="lg"
                    footer={
                        <>
                            <Button
                                variant="ghost"
                                onClick={() => setDetailOpen(false)}
                            >
                                Close
                            </Button>
                            <Button variant="secondary" onClick={openRenew}>
                                Renew Lease
                            </Button>
                            <Button variant="primary" onClick={startEdit}>
                                Edit Tenant
                            </Button>
                            <Button
                                variant="danger"
                                onClick={() => archiveTenant(selected.id)}
                            >
                                Archive Tenant
                            </Button>
                        </>
                    }
                >
                    <div className="mb-5 flex items-center gap-4 border-b border-[#1B2B4B]/8 pb-5">
                        <Avatar
                            initials={selected.initials}
                            name={selected.name}
                            size="lg"
                        />
                        <div className="flex-1">
                            <h3 className="text-base font-semibold text-[#1B2B4B]">
                                {selected.name}
                            </h3>
                            <p className="text-sm text-[#5C6B88]">
                                Unit {selected.unit} · {selected.floor} ·{' '}
                                {selected.type}
                            </p>
                        </div>
                        {statusBadge(selected.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="mb-2 text-[11px] font-bold tracking-wider text-[#5C6B88] uppercase">
                                Lease Details
                            </p>
                            <InfoRow label="Contact" value={selected.contact} />
                            <InfoRow
                                label="Occupied Unit"
                                value={`Unit ${selected.unit} (${selected.floor})`}
                            />
                            <InfoRow label="Phone" value={selected.phone} />
                            <InfoRow label="Email" value={selected.email} />
                            <InfoRow
                                label="Lease Start"
                                value={formatDateDisplay(selected.leaseStart)}
                            />
                            <InfoRow
                                label="Lease End"
                                value={formatDateDisplay(selected.leaseEnd)}
                            />
                            <InfoRow
                                label="Monthly Rent"
                                value={
                                    <span className="font-bold">
                                        P{selected.rent.toLocaleString()}
                                    </span>
                                }
                            />
                            <InfoRow
                                label="Security Deposit"
                                value={`P${selected.deposit.toLocaleString()}`}
                            />
                            <InfoRow
                                label="Payment Method"
                                value={methodBadge(selected.paymentMethod)}
                                border={false}
                            />
                        </div>

                        <div>
                            <p className="mb-2 text-[11px] font-bold tracking-wider text-[#5C6B88] uppercase">
                                Payment History
                            </p>
                            {tenantInvoices.length === 0 ? (
                                <p className="text-sm text-[#5C6B88]">
                                    No invoices found.
                                </p>
                            ) : (
                                tenantInvoices.map((inv) => (
                                    <div
                                        key={inv.id}
                                        className="flex items-center justify-between border-b border-[#1B2B4B]/5 py-2.5 last:border-0"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-[#1B2B4B]">
                                                {inv.period}
                                            </p>
                                            <p className="text-xs text-[#5C6B88]">
                                                {inv.invoiceNo}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold">
                                                P{inv.total.toLocaleString()}
                                            </span>
                                            {statusBadge(inv.status)}
                                        </div>
                                    </div>
                                ))
                            )}

                            <p className="mt-5 mb-2 text-[11px] font-bold tracking-wider text-[#5C6B88] uppercase">
                                Lease History
                            </p>
                            {selectedLeases.length === 0 ? (
                                <p className="text-sm text-[#5C6B88]">
                                    No lease records found.
                                </p>
                            ) : (
                                selectedLeases.map((lease) => (
                                    <div
                                        key={lease.id}
                                        className="border-b border-[#1B2B4B]/5 py-2.5 last:border-0"
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-[#1B2B4B]">
                                                {formatDateDisplay(
                                                    lease.startDate,
                                                )}{' '}
                                                -{' '}
                                                {formatDateDisplay(lease.endDate)}
                                            </p>
                                            {leaseStatusBadge(lease.status)}
                                        </div>
                                        <p className="mt-1 text-xs text-[#5C6B88]">
                                            Rent: P
                                            {Number(lease.rent).toLocaleString()}{' '}
                                            · Deposit: P
                                            {Number(lease.deposit).toLocaleString()}{' '}
                                            · {lease.paymentMethod}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
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
                        <Select
                            label="Payment Method"
                            value={renewForm.paymentMethod}
                            onChange={(e) =>
                                setRenewForm((f) => {
                                    setRenewErrors((prev) => ({
                                        ...prev,
                                        paymentMethod: undefined,
                                    }));
                                    return {
                                        ...f,
                                        paymentMethod: e.target.value,
                                    };
                                })
                            }
                            error={renewErrors.paymentMethod}
                            full
                        >
                            <option value="GCash">GCash</option>
                            <option value="Cash">Cash</option>
                        </Select>
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
                onClose={() => setAddOpen(false)}
                title="Add New Tenant"
                size="lg"
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
                            onClick={saveTenant}
                            disabled={availableUnits.length === 0}
                        >
                            Save Tenant
                        </Button>
                    </>
                }
            >
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Business Name"
                        placeholder="e.g. ABC Corp"
                        value={addForm.name}
                        onChange={(e) =>
                            setAddForm((f) => ({ ...f, name: e.target.value }))
                        }
                        full
                    />
                    <Input
                        label="Contact Person"
                        placeholder="Full name"
                        value={addForm.contact}
                        onChange={(e) =>
                            setAddForm((f) => ({
                                ...f,
                                contact: e.target.value,
                            }))
                        }
                        full
                    />
                    <Input
                        label="Phone"
                        placeholder="09XX XXX XXXX"
                        value={addForm.phone}
                        onChange={(e) =>
                            setAddForm((f) => ({ ...f, phone: e.target.value }))
                        }
                        full
                    />
                    <Input
                        label="Email"
                        placeholder="email@domain.com"
                        type="email"
                        value={addForm.email}
                        onChange={(e) =>
                            setAddForm((f) => ({ ...f, email: e.target.value }))
                        }
                        full
                    />
                    <Select
                        label="Unit (Available Only)"
                        value={addForm.unit}
                        onChange={(e) => {
                            const nextUnit = availableUnits.find(
                                (unit) => unit.number === e.target.value,
                            );
                            setAddForm((f) => ({
                                ...f,
                                unit: e.target.value,
                                floor: nextUnit?.floor ?? f.floor,
                                type: nextUnit?.type ?? f.type,
                                rent: String(nextUnit?.base_rent ?? f.rent),
                            }));
                        }}
                        full
                    >
                        {availableUnits.length === 0 && (
                            <option value="">No available units</option>
                        )}
                        {availableUnits.map((unit) => (
                            <option key={unit.id} value={unit.number}>
                                {unit.number} · {unit.floor} · {unit.type}
                            </option>
                        ))}
                    </Select>
                    <Input label="Floor" value={addForm.floor} readOnly full />
                    <Input
                        label="Unit Type"
                        value={addForm.type}
                        readOnly
                        full
                    />
                    <Input
                        label="Monthly Rent"
                        placeholder="0.00"
                        type="number"
                        value={addForm.rent}
                        onChange={(e) =>
                            setAddForm((f) => ({ ...f, rent: e.target.value }))
                        }
                        full
                    />
                    <Select
                        label="Payment Method"
                        value={addForm.paymentMethod}
                        onChange={(e) =>
                            setAddForm((f) => ({
                                ...f,
                                paymentMethod: e.target.value,
                            }))
                        }
                        full
                    >
                        <option value="GCash">GCash</option>
                        <option value="Cash">Cash</option>
                    </Select>
                    <Input
                        label="Lease Start"
                        type="date"
                        value={addForm.leaseStart}
                        onChange={(e) =>
                            setAddForm((f) => ({
                                ...f,
                                leaseStart: e.target.value,
                            }))
                        }
                        full
                    />
                    <Input
                        label="Lease End"
                        type="date"
                        value={addForm.leaseEnd}
                        onChange={(e) =>
                            setAddForm((f) => ({
                                ...f,
                                leaseEnd: e.target.value,
                            }))
                        }
                        full
                    />
                    <div className="col-span-2">
                        <Textarea
                            label="Notes"
                            placeholder="Optional notes"
                            value={addForm.notes}
                            onChange={(e) =>
                                setAddForm((f) => ({
                                    ...f,
                                    notes: e.target.value,
                                }))
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
                            value={String(editForm.unit ?? '')}
                            onChange={(e) =>
                                setEditForm((f) => ({
                                    ...f,
                                    unit: e.target.value,
                                }))
                            }
                            full
                        >
                            {transferUnitOptions.map((unit) => (
                                <option key={unit.id} value={unit.number}>
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
                            <option value="expiring">Expiring</option>
                            <option value="overdue">Overdue</option>
                        </Select>
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
        </div>
    );
}
