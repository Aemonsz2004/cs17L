import { router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Card from '../../components/Card';
import InfoRow from '../../components/InfoRow';
import { Input, Select } from '../../components/Input';
import MetricCard from '../../components/MetricCard';
import Modal from '../../components/Modal';
import Table from '../../components/Table';
import { formatDateDisplay } from '../../lib/date';
const statusBadge = (s) => {
    if (s === 'paid') {
        return <Badge variant="green">Paid</Badge>;
    }
    if (s === 'due') {
        return <Badge variant="amber">Due</Badge>;
    }
    if (s === 'overdue') {
        return <Badge variant="red">Overdue</Badge>;
    }
    return null;
};
const methodBadge = (m) => {
    if (!m) {
        return <span className="text-[#5C6B88]">-</span>;
    }
    if (m === 'GCash') {
        return <Badge variant="blue">GCash</Badge>;
    }
    if (m === 'Bank Transfer') {
        return <Badge variant="gray">Bank</Badge>;
    }
    return <Badge variant="gray">Cash</Badge>;
};
export default function BillingPage({ openAddSignal = 0 }) {
    const {
        invoices: invoiceRows,
        archivedInvoices: archivedInvoiceRows,
        tenants: tenantRows,
    } = usePage().props;
    const invoices = useMemo(
        () =>
            (invoiceRows ?? []).map((invoice) => ({
                id: invoice.id,
                invoiceNo: invoice.invoice_no,
                tenantId: invoice.tenant_id,
                tenant: invoice.tenant?.name ?? `Tenant #${invoice.tenant_id}`,
                unit: (invoice.tenant?.units ?? []).map((u) => u.number).join(', ') || '-',
                period: invoice.period,
                rent: invoice.rent,
                utilities: invoice.utilities,
                penalty: invoice.penalty,
                total: invoice.total,
                dueDate: invoice.due_date,
                paidDate: invoice.paid_date,
                method: invoice.method,
                reference: invoice.reference,
                status: invoice.status,
            })),
        [invoiceRows],
    );
    const archivedInvoices = useMemo(
        () =>
            (archivedInvoiceRows ?? []).map((invoice) => ({
                id: invoice.id,
                invoiceNo: invoice.invoice_no,
                tenantId: invoice.tenant_id,
                tenant: invoice.tenant?.name ?? `Tenant #${invoice.tenant_id}`,
                unit: (invoice.tenant?.units ?? []).map((u) => u.number).join(', ') || '-',
                period: invoice.period,
                rent: invoice.rent,
                utilities: invoice.utilities,
                penalty: invoice.penalty,
                total: invoice.total,
                dueDate: invoice.due_date,
                paidDate: invoice.paid_date,
                method: invoice.method,
                reference: invoice.reference,
                status: invoice.status,
            })),
        [archivedInvoiceRows],
    );
    const [filterStatus, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [addOpen, setAddOpen] = useState(false);
    const [viewMode, setViewMode] = useState('active');
    const lastHandledSignal = useRef(openAddSignal);
    const [form, setForm] = useState({
        tenantId: String(tenantRows?.[0]?.id ?? 1),
        period: '',
        dueDate: '',
        rent: '',
        utilities: '',
        penalty: '',
        method: 'GCash',
    });
    useEffect(() => {
        if (openAddSignal !== lastHandledSignal.current) {
            setAddOpen(true);
            lastHandledSignal.current = openAddSignal;
        }
    }, [openAddSignal]);
    useEffect(() => {
        if (viewMode !== 'active') {
            setDetailOpen(false);
            setSelected(null);
        }
    }, [viewMode]);
    const visibleInvoices = viewMode === 'active' ? invoices : archivedInvoices;
    const totals = useMemo(() => {
        const collected = visibleInvoices
            .filter((i) => i.status === 'paid')
            .reduce((s, i) => s + i.total, 0);
        const pending = visibleInvoices
            .filter((i) => i.status === 'due')
            .reduce((s, i) => s + i.total, 0);
        const overdueAmt = visibleInvoices
            .filter((i) => i.status === 'overdue')
            .reduce((s, i) => s + i.total, 0);
        const totalBilled = visibleInvoices.reduce((s, i) => s + i.total, 0);
        return { collected, pending, overdueAmt, totalBilled };
    }, [visibleInvoices]);
    const filtered = visibleInvoices.filter((i) => {
        const matchSearch =
            i.tenant.toLowerCase().includes(search.toLowerCase()) ||
            i.invoiceNo.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' || i.status === filterStatus;
        return matchSearch && matchStatus;
    });
    const markAsPaid = () => {
        if (!selected) return;
        if (!window.confirm('Mark this invoice as paid?')) {
            return;
        }
        router.patch(`/admin/billing/${selected.id}/mark-paid`);
    };

    const markAsOverdue = () => {
        if (!selected) return;
        if (!window.confirm('Mark this invoice as overdue?')) {
            return;
        }
        router.patch(`/admin/billing/${selected.id}/mark-overdue`);
    };

    const confirmBankTransfer = () => {
        if (!selected) return;
        if (!window.confirm(`Confirm Bank Transfer for Invoice ${selected.invoiceNo}?`)) {
            return;
        }
        router.patch(`/admin/billing/${selected.id}/confirm-bank`);
    };
    const archiveInvoice = () => {
        if (!selected) return;
        if (!window.confirm('Archive this invoice?')) {
            return;
        }
        router.delete(`/admin/billing/${selected.id}`);
    };
    const restoreInvoice = (invoiceId) => {
        if (!window.confirm('Restore this invoice?')) {
            return;
        }
        router.post(`/admin/billing/${invoiceId}/restore`);
    };
    const createInvoice = () => {
        const tenant = (tenantRows ?? []).find(
            (t) => String(t.id) === form.tenantId,
        );
        if (!tenant || !form.period || !form.dueDate || !form.rent) {
            return;
        }
        if (!window.confirm('Generate this invoice?')) {
            return;
        }
        router.post('/admin/billing', {
            tenant_id: Number(form.tenantId),
            period: form.period,
            due_date: form.dueDate,
            rent: Number(form.rent || 0),
            utilities: Number(form.utilities || 0),
            penalty: Number(form.penalty || 0),
            method: form.method,
            status: 'due',
        });
    };
    const pendingBankTransfers = invoices.filter(
        (i) => i.method === 'Bank Transfer' && i.status === 'due',
    );
    const pendingCashPayments = invoices.filter(
        (i) => i.method === 'Cash' && i.status === 'due',
    );

    const columns = [
        {
            key: 'invoiceNo',
            label: 'Invoice',
            width: 110,
            render: (v) => (
                <span className="font-mono text-xs text-[#5C6B88]">{v}</span>
            ),
        },
        {
            key: 'tenant',
            label: 'Tenant',
            render: (_, row) => (
                <span className="font-medium text-[#1B2B4B]">{row.tenant}</span>
            ),
        },
        { key: 'unit', label: 'Unit', width: 70 },
        { key: 'period', label: 'Period' },
        {
            key: 'total',
            label: 'Total',
            align: 'right',
            render: (v) => (
                <span className="font-semibold">P{v.toLocaleString()}</span>
            ),
        },
        {
            key: 'dueDate',
            label: 'Due Date',
            render: (v) => formatDateDisplay(v),
        },
        {
            key: 'method',
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
                            restoreInvoice(row.id);
                        }}
                    >
                        Restore
                    </Button>
                )
            ),
        },
    ];
    return (
        <div className="space-y-5">
            <div className="grid grid-cols-4 gap-4">
                <MetricCard
                    label="Total Billed"
                    value={`P${totals.totalBilled.toLocaleString()}`}
                    sub="Current dataset"
                />
                <MetricCard
                    label="Collected"
                    value={`P${totals.collected.toLocaleString()}`}
                    sub={`${invoices.filter((i) => i.status === 'paid').length} invoices`}
                    trend="up"
                />
                <MetricCard
                    label="Pending"
                    value={`P${totals.pending.toLocaleString()}`}
                    sub={`${invoices.filter((i) => i.status === 'due').length} invoices`}
                    trend="down"
                    iconBg="bg-amber-50 text-amber-500"
                />
                <MetricCard
                    label="Overdue"
                    value={`P${totals.overdueAmt.toLocaleString()}`}
                    sub={`${invoices.filter((i) => i.status === 'overdue').length} invoices`}
                    trend="down"
                    iconBg="bg-red-50 text-red-400"
                />
            </div>

            {viewMode === 'active' && pendingBankTransfers.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="mb-2 text-sm font-semibold text-amber-700">
                        {pendingBankTransfers.length} Bank Transfer{pendingBankTransfers.length !== 1 ? 's' : ''} Awaiting Confirmation
                    </p>
                    <div className="space-y-2">
                        {pendingBankTransfers.map((inv) => (
                            <div key={inv.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm">
                                <div>
                                    <p className="font-semibold text-amber-900">
                                        {inv.invoiceNo} · {inv.tenant}
                                    </p>
                                    <p className="text-xs text-amber-700">
                                        Ref: {inv.reference}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    onClick={() => {
                                        setSelected(inv);
                                        setDetailOpen(true);
                                    }}
                                >
                                    Review
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {viewMode === 'active' && pendingCashPayments.length > 0 && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="mb-2 text-sm font-semibold text-emerald-700">
                        {pendingCashPayments.length} Cash Payment{pendingCashPayments.length !== 1 ? 's' : ''} Awaiting Confirmation
                    </p>
                    <div className="space-y-2">
                        {pendingCashPayments.map((inv) => (
                            <div key={inv.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm">
                                <div>
                                    <p className="font-semibold text-emerald-900">
                                        {inv.invoiceNo} · {inv.tenant}
                                    </p>
                                    <p className="text-xs text-emerald-700">
                                        P{inv.total.toLocaleString()} · {inv.period}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    onClick={() => {
                                        setSelected(inv);
                                        setDetailOpen(true);
                                    }}
                                >
                                    Review
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Card>
                <Card.Header
                    title={viewMode === 'active' ? 'Invoices' : 'Archived Invoices'}
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
                            <Input
                                placeholder="Search tenant or invoice..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-56"
                            />
                            <Select
                                value={filterStatus}
                                onChange={(e) => setFilter(e.target.value)}
                                className="w-36"
                            >
                                <option value="all">All Status</option>
                                <option value="paid">Paid</option>
                                <option value="due">Due</option>
                                <option value="overdue">Overdue</option>
                            </Select>
                            {viewMode === 'active' && (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => setAddOpen(true)}
                                >
                                    + New Invoice
                                </Button>
                            )}
                        </div>
                    }
                />

                <Table
                    columns={columns}
                    data={filtered}
                    keyField={'id'}
                    emptyText="No invoices match your search."
                    onRowClick={(row) => {
                        setSelected(row);
                        setDetailOpen(true);
                    }}
                />
                <Card.Footer>
                    Showing {filtered.length} of {visibleInvoices.length} invoices
                </Card.Footer>
            </Card>

            {selected && (
                <Modal
                    open={detailOpen}
                    onClose={() => setDetailOpen(false)}
                    title="Invoice Detail"
                    size="md"
                    footer={
                        <>
                            <Button
                                variant="ghost"
                                onClick={() => setDetailOpen(false)}
                            >
                                Close
                            </Button>
                            {viewMode === 'active' ? (
                                <>
                                    {selected.method === 'Bank Transfer' &&
                                        selected.status !== 'paid' &&
                                        selected.reference && (
                                            <Button
                                                variant="primary"
                                                onClick={confirmBankTransfer}
                                            >
                                                Confirm Bank Transfer
                                            </Button>
                                        )}
                                    {selected.status === 'due' && (
                                        <Button
                                            variant="outline"
                                            onClick={markAsOverdue}
                                        >
                                            Mark as Overdue
                                        </Button>
                                    )}
                                    {selected.status !== 'paid' &&
                                        selected.method !== 'Bank Transfer' && (
                                            <Button
                                                variant="primary"
                                                onClick={markAsPaid}
                                            >
                                                Mark as Paid
                                            </Button>
                                        )}
                                    <Button
                                        variant="danger"
                                        onClick={archiveInvoice}
                                    >
                                        Archive Invoice
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    variant="primary"
                                    onClick={() => restoreInvoice(selected.id)}
                                >
                                    Restore Invoice
                                </Button>
                            )}
                        </>
                    }
                >
                    <div className="mb-4 flex items-start justify-between border-b border-[#1B2B4B]/8 pb-4">
                        <div>
                            <p className="mb-1 text-xs text-[#5C6B88]">
                                Invoice Number
                            </p>
                            <p className="font-mono text-lg font-bold text-[#1B2B4B]">
                                {selected.invoiceNo}
                            </p>
                        </div>
                        {statusBadge(selected.status)}
                    </div>

                    <InfoRow label="Tenant" value={selected.tenant} />
                    <InfoRow label="Unit" value={selected.unit} />
                    <InfoRow label="Period" value={selected.period} />
                    <InfoRow
                        label="Due Date"
                        value={formatDateDisplay(selected.dueDate)}
                    />
                    {selected.paidDate && (
                        <InfoRow
                            label="Paid Date"
                            value={formatDateDisplay(selected.paidDate)}
                        />
                    )}
                    {selected.method && (
                        <InfoRow
                            label="Method"
                            value={methodBadge(selected.method)}
                        />
                    )}
                    {selected.method === 'Bank Transfer' && selected.reference && (
                        <InfoRow
                            label="Bank Reference"
                            value={
                                <span className="font-mono text-sm text-[#5C6B88]">
                                    {selected.reference}
                                </span>
                            }
                        />
                    )}

                    <div className="mt-4 space-y-0 border-t border-[#1B2B4B]/8 pt-4">
                        <InfoRow
                            label="Base Rent"
                            value={`P${selected.rent.toLocaleString()}`}
                        />
                        <InfoRow
                            label="Utilities"
                            value={`P${selected.utilities.toLocaleString()}`}
                        />
                        {selected.penalty > 0 && (
                            <InfoRow
                                label="Late Penalty"
                                value={
                                    <span className="font-semibold text-red-500">
                                        P{selected.penalty.toLocaleString()}
                                    </span>
                                }
                            />
                        )}
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-[#1B2B4B]/8 pt-3">
                        <span className="text-sm font-bold text-[#1B2B4B]">
                            Total Due
                        </span>
                        <span className="text-xl font-bold text-[#1B2B4B]">
                            P{selected.total.toLocaleString()}
                        </span>
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
                        <Button
                            variant="ghost"
                            onClick={() => setAddOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={createInvoice}>
                            Generate Invoice
                        </Button>
                    </>
                }
            >
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <Select
                            label="Tenant"
                            value={form.tenantId}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    tenantId: e.target.value,
                                }))
                            }
                            full
                        >
                            {(tenantRows ?? []).map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name} - Unit {(t.units ?? []).map((u) => u.number).join(', ') || '-'}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <Input
                        label="Billing Period"
                        placeholder="e.g. April 2026"
                        value={form.period}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, period: e.target.value }))
                        }
                        full
                    />
                    <Input
                        label="Due Date"
                        type="date"
                        value={form.dueDate}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, dueDate: e.target.value }))
                        }
                        full
                    />
                    <Input
                        label="Rent Amount"
                        placeholder="0.00"
                        type="number"
                        value={form.rent}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, rent: e.target.value }))
                        }
                        full
                    />
                    <Input
                        label="Utilities"
                        placeholder="0.00"
                        type="number"
                        value={form.utilities}
                        onChange={(e) =>
                            setForm((f) => ({
                                ...f,
                                utilities: e.target.value,
                            }))
                        }
                        full
                    />
                    <Input
                        label="Penalty"
                        placeholder="0.00"
                        type="number"
                        value={form.penalty}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, penalty: e.target.value }))
                        }
                        full
                    />
                    <Select
                        label="Preferred Method"
                        value={form.method}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, method: e.target.value }))
                        }
                        full
                    >
                        <option value="GCash">GCash</option>
                        <option value="Cash">Cash</option>
                    </Select>
                </div>
            </Modal>
        </div>
    );
}
