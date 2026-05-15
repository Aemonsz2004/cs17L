// src/pages/tenant/BillingPage.jsx
import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Card from '../../components/Card';
import InfoRow from '../../components/InfoRow';
import Modal from '../../components/Modal';
import ProgressBar from '../../components/ProgressBar';
import { formatDateDisplay } from '../../lib/date';
const statusBadge = (s) => {
    if (s === 'paid') return <Badge variant="green">Paid</Badge>;
    if (s === 'due') return <Badge variant="amber">Due</Badge>;
    if (s === 'overdue') return <Badge variant="red">Overdue</Badge>;
    return null;
};
const methodBadge = (m) => {
    if (!m) return <span className="text-[#5C6B88]">—</span>;
    if (m === 'GCash') return <Badge variant="blue">GCash</Badge>;
    if (m === 'Bank Transfer')
        return <Badge variant="gray">Bank Transfer</Badge>;
    return <Badge variant="gray">Cash</Badge>;
};
// ─────────────────────────────────────────────────────────────────────────────
export default function TenantBillingPage({ onPayRent }) {
    const { invoices, archivedInvoices } = usePage().props;
    const mappedInvoices = (invoices ?? []).map((invoice) => ({
        id: invoice.id,
        invoiceNo: invoice.invoice_no,
        tenantId: invoice.tenant_id,
        tenant: 'Current Tenant',
        unit: '-',
        period: invoice.period,
        rent: invoice.rent,
        utilities: invoice.utilities,
        penalty: invoice.penalty,
        total: invoice.total,
        dueDate: invoice.due_date,
        paidDate: invoice.paid_date,
        method: invoice.method,
        status: invoice.status,
    }));
    const mappedArchivedInvoices = (archivedInvoices ?? []).map((invoice) => ({
        id: invoice.id,
        invoiceNo: invoice.invoice_no,
        tenantId: invoice.tenant_id,
        tenant: 'Current Tenant',
        unit: '-',
        period: invoice.period,
        rent: invoice.rent,
        utilities: invoice.utilities,
        penalty: invoice.penalty,
        total: invoice.total,
        dueDate: invoice.due_date,
        paidDate: invoice.paid_date,
        method: invoice.method,
        status: invoice.status,
    }));
    const [viewMode, setViewMode] = useState('active');
    const history = viewMode === 'active' ? mappedInvoices : mappedArchivedInvoices;
    const nextInvoice = viewMode === 'active'
        ? history.find((invoice) => invoice.status !== 'paid')
        : null;
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const totalPaid = history
        .filter((i) => i.status === 'paid')
        .reduce((s, i) => s + i.total, 0);
    const totalOutstanding = history
        .filter((i) => i.status !== 'paid')
        .reduce((s, i) => s + i.total, 0);
    const paidCount = history.filter((i) => i.status === 'paid').length;
    const q = search.trim().toLowerCase();
    const visibleHistory = q
        ? history.filter((invoice) => {
              const due = formatDateDisplay(invoice.dueDate, '').toLowerCase();
              const paid = formatDateDisplay(
                  invoice.paidDate,
                  '',
              ).toLowerCase();
              return [
                  invoice.invoiceNo,
                  invoice.period,
                  invoice.status,
                  invoice.method ?? '',
                  due,
                  paid,
              ]
                  .join(' ')
                  .toLowerCase()
                  .includes(q);
          })
        : history;
    const openInvoice = (inv) => {
        setSelected(inv);
        setModalOpen(true);
    };
    const archiveInvoice = () => {
        if (!selected) return;
        if (!window.confirm('Archive this invoice?')) {
            return;
        }
        router.delete(`/tenant/billing/${selected.id}`);
    };
    const restoreInvoice = () => {
        if (!selected) return;
        if (!window.confirm('Restore this invoice?')) {
            return;
        }
        router.post(`/tenant/billing/${selected.id}/restore`);
    };
    return (
        <div className="max-w-4xl space-y-5">
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
            {history.length === 0 && (
                <Card>
                    <Card.Body>
                        <div className="py-8 text-center">
                            <p className="text-lg font-bold text-[#1B2B4B]">
                                No invoices yet
                            </p>
                            <p className="mt-1 text-sm text-[#5C6B88]">
                                Your billing history will appear once admin
                                creates your first invoice.
                            </p>
                        </div>
                    </Card.Body>
                </Card>
            )}

            {/* ── Summary row ── */}
            {viewMode === 'active' && nextInvoice && (
                <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-xl border border-[#1B2B4B]/10 bg-white p-5 shadow-sm">
                        <p className="mb-1 text-[10px] font-bold tracking-widest text-[#5C6B88] uppercase">
                            Total Paid (YTD)
                        </p>
                        <p className="text-2xl font-bold text-[#1D7B6E]">
                            ₱{totalPaid.toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs text-[#5C6B88]">
                            {paidCount} invoices settled
                        </p>
                    </div>

                    <div
                        className={[
                            'rounded-xl border p-5 shadow-sm',
                            totalOutstanding > 0
                                ? 'border-red-200 bg-red-50'
                                : 'border-[#1B2B4B]/10 bg-white',
                        ].join(' ')}
                    >
                        <p
                            className={`mb-1 text-[10px] font-bold tracking-widest uppercase ${totalOutstanding > 0 ? 'text-red-400' : 'text-[#5C6B88]'}`}
                        >
                            Outstanding
                        </p>
                        <p
                            className={`text-2xl font-bold ${totalOutstanding > 0 ? 'text-red-600' : 'text-[#1B2B4B]'}`}
                        >
                            ₱{totalOutstanding.toLocaleString()}
                        </p>
                        <p
                            className={`mt-1 text-xs ${totalOutstanding > 0 ? 'text-red-400' : 'text-[#5C6B88]'}`}
                        >
                            {history.filter((i) => i.status !== 'paid').length}{' '}
                            unpaid
                        </p>
                    </div>

                    <div className="rounded-xl border border-[#1B2B4B]/10 bg-white p-5 shadow-sm">
                        <p className="mb-1 text-[10px] font-bold tracking-widest text-[#5C6B88] uppercase">
                            Next Due
                        </p>
                        <p className="text-2xl font-bold text-[#1B2B4B]">
                            ₱{nextInvoice.total.toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs text-[#5C6B88]">
                            {formatDateDisplay(nextInvoice.dueDate)} · unpaid
                        </p>
                        <Button
                            variant="primary"
                            size="xs"
                            className="mt-2"
                            onClick={onPayRent}
                        >
                            Pay Now
                        </Button>
                    </div>
                </div>
            )}

            {/* ── Upcoming invoice ── */}
            {viewMode === 'active' && nextInvoice && (
                <Card>
                    <Card.Header
                        title={`Upcoming — ${nextInvoice.period}`}
                        action={<Badge variant="amber">Unpaid</Badge>}
                    />
                    <Card.Body>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <InfoRow
                                    label="Invoice"
                                    value={nextInvoice.invoiceNo}
                                />
                                <InfoRow
                                    label="Base Rent"
                                    value={`₱${nextInvoice.rent.toLocaleString()}`}
                                />
                                <InfoRow
                                    label="Utilities"
                                    value={`₱${nextInvoice.utilities.toLocaleString()}`}
                                />
                                <InfoRow
                                    label="Penalty"
                                    value={
                                        nextInvoice.penalty > 0
                                            ? `₱${nextInvoice.penalty.toLocaleString()}`
                                            : 'None'
                                    }
                                    border={false}
                                />
                            </div>
                            <div className="flex flex-col items-end justify-between">
                                <div className="text-right">
                                    <p className="text-[10px] tracking-wider text-[#5C6B88] uppercase">
                                        Total Due
                                    </p>
                                    <p className="text-3xl font-bold text-[#1B2B4B]">
                                        ₱{nextInvoice.total.toLocaleString()}
                                    </p>
                                    <p className="mt-1 text-xs text-[#5C6B88]">
                                        Due{' '}
                                        {formatDateDisplay(nextInvoice.dueDate)}
                                    </p>
                                </div>
                                <div className="mt-4 w-full">
                                    <ProgressBar
                                        value={
                                            nextInvoice.status === 'overdue'
                                                ? 0
                                                : 10
                                        }
                                        max={30}
                                        variant="amber"
                                        size="sm"
                                        label={
                                            nextInvoice.status === 'overdue'
                                                ? 'Overdue'
                                                : 'Payment pending'
                                        }
                                    />
                                </div>
                                <Button
                                    variant="primary"
                                    size="md"
                                    full
                                    className="mt-4"
                                    onClick={onPayRent}
                                >
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
                            className="h-9 w-64 rounded-lg border border-[#1B2B4B]/15 bg-white px-3 text-sm text-[#1B2B4B] transition outline-none focus:border-[#1B2B4B]/35"
                        />
                    }
                />
                <Card.Body flush>
                    {visibleHistory.length === 0 ? (
                        <div className="py-10 text-center text-sm text-[#5C6B88]">
                            No matching invoices found.
                        </div>
                    ) : (
                        visibleHistory.map((inv) => (
                            <button
                                key={inv.id}
                                onClick={() => openInvoice(inv)}
                                className="flex w-full items-center gap-4 border-b border-[#1B2B4B]/5 px-5 py-4 text-left transition-colors last:border-0 hover:bg-[#FAF8F4]"
                            >
                                {/* Status stripe */}
                                <div
                                    className={[
                                        'h-10 w-1 flex-shrink-0 rounded-full',
                                        inv.status === 'paid'
                                            ? 'bg-[#24A18F]'
                                            : inv.status === 'due'
                                              ? 'bg-amber-400'
                                              : 'bg-red-400',
                                    ].join(' ')}
                                />

                                <div className="min-w-0 flex-1">
                                    <div className="mb-0.5 flex items-center gap-2">
                                        <p className="text-sm font-semibold text-[#1B2B4B]">
                                            {inv.period}
                                        </p>
                                        <span className="font-mono text-xs text-[#5C6B88]">
                                            {inv.invoiceNo}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#5C6B88]">
                                        Due {formatDateDisplay(inv.dueDate)}
                                        {inv.paidDate && (
                                            <span className="text-[#24A18F]">
                                                {' '}
                                                · Paid{' '}
                                                {formatDateDisplay(
                                                    inv.paidDate,
                                                )}
                                            </span>
                                        )}
                                        {inv.penalty > 0 && (
                                            <span className="text-red-400">
                                                {' '}
                                                · +₱
                                                {inv.penalty.toLocaleString()}{' '}
                                                penalty
                                            </span>
                                        )}
                                    </p>
                                </div>

                                <div className="flex flex-shrink-0 items-center gap-3">
                                    {methodBadge(inv.method)}
                                    <div className="min-w-[80px] text-right">
                                        <p className="text-sm font-bold text-[#1B2B4B]">
                                            ₱{inv.total.toLocaleString()}
                                        </p>
                                        <div className="mt-1">
                                            {statusBadge(inv.status)}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </Card.Body>
                <Card.Footer>
                    {visibleHistory.length} of {history.length} invoices · ₱
                    {totalPaid.toLocaleString()} paid total
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
                        <div className="flex w-full items-center justify-between">
                            <Button
                                variant="ghost"
                                onClick={() => setModalOpen(false)}
                            >
                                Close
                            </Button>
                            <div className="flex items-center gap-2">
                                {viewMode === 'active' &&
                                    selected.status !== 'paid' && (
                                        <Button
                                            variant="primary"
                                            onClick={() => {
                                                setModalOpen(false);
                                                onPayRent();
                                            }}
                                        >
                                            Pay Now
                                        </Button>
                                    )}
                                {viewMode === 'active' ? (
                                    <Button
                                        variant="danger"
                                        onClick={archiveInvoice}
                                    >
                                        Archive
                                    </Button>
                                ) : (
                                    <Button
                                        variant="primary"
                                        onClick={restoreInvoice}
                                    >
                                        Restore
                                    </Button>
                                )}
                            </div>
                        </div>
                    }
                >
                    {/* Status banner */}
                    <div
                        className={[
                            'mb-5 flex items-center justify-between rounded-xl p-4',
                            selected.status === 'paid'
                                ? 'border border-[#1D7B6E]/20 bg-[#1D7B6E]/8'
                                : selected.status === 'due'
                                  ? 'border border-amber-200 bg-amber-50'
                                  : 'border border-red-200 bg-red-50',
                        ].join(' ')}
                    >
                        <div>
                            <p className="mb-0.5 text-xs text-[#5C6B88]">
                                {selected.invoiceNo}
                            </p>
                            <p className="text-xl font-bold text-[#1B2B4B]">
                                ₱{selected.total.toLocaleString()}
                            </p>
                        </div>
                        {statusBadge(selected.status)}
                    </div>

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

                    <div className="mt-4 border-t border-[#1B2B4B]/8 pt-4">
                        <InfoRow
                            label="Base Rent"
                            value={`₱${selected.rent.toLocaleString()}`}
                        />
                        <InfoRow
                            label="Utilities"
                            value={`₱${selected.utilities.toLocaleString()}`}
                        />
                        {selected.penalty > 0 && (
                            <InfoRow
                                label="Late Penalty"
                                value={
                                    <span className="font-semibold text-red-500">
                                        +₱{selected.penalty.toLocaleString()}
                                    </span>
                                }
                            />
                        )}
                        <div className="mt-3 flex items-center justify-between border-t border-[#1B2B4B]/8 pt-3">
                            <span className="text-sm font-bold text-[#1B2B4B]">
                                Total
                            </span>
                            <span className="text-lg font-bold text-[#1B2B4B]">
                                ₱{selected.total.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
