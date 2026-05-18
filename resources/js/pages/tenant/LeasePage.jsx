// src/pages/tenant/LeasePage.jsx
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import InfoRow from '../../components/InfoRow';
import { formatDateDisplay } from '../../lib/date';
import { useMemo } from 'react';
import { router } from '@inertiajs/react';
function leaseProgressPct(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const now = new Date();
    const total = Math.max(1, endDate.getTime() - startDate.getTime());
    const elapsed = Math.max(
        0,
        Math.min(total, now.getTime() - startDate.getTime()),
    );
    return Math.min(100, Math.round((elapsed / total) * 100));
}
const TERMS = (unitType) => [
    { label: 'Late Payment Penalty', value: '2% of rent per week overdue' },
    { label: 'Notice Period', value: '30 days written notice required' },
    { label: 'Permitted Use', value: unitType + ' purposes only' },
    { label: 'Sub-letting', value: 'Strictly not allowed' },
    { label: 'Renewal Option', value: 'Yes — notify 60 days before expiry' },
    { label: 'Alterations', value: 'Require written admin approval' },
    { label: 'Utilities', value: 'Included in monthly rent' },
    { label: 'Business Hours Access', value: '24/7 with building access card' },
];
export default function LeasePage({ tenant, leases = [], invoices = [] }) {
    const activeLeases = useMemo(
        () => (leases ?? []).filter((l) => l.status === 'active'),
        [leases],
    );
    const history = useMemo(
        () =>
            (leases ?? [])
                .slice()
                .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
                .map((lease) => ({
                    id: lease.id,
                    unitNumber: lease.unit?.number ?? '-',
                    startDate: lease.start_date,
                    endDate: lease.end_date,
                    rent: lease.rent ?? 0,
                    deposit: lease.deposit ?? 0,
                    status: lease.status,
                    paymentMethod: lease.payment_method,
                })),
        [leases],
    );
    const billingHistory = useMemo(
        () =>
            invoices.map((invoice) => ({
                period: invoice.period,
                rent: invoice.rent ?? 0,
                status: invoice.status === 'paid' ? 'completed' : 'active',
            })),
        [invoices],
    );
    if (!tenant) {
        return (
            <Card>
                <Card.Body>
                    <p className="text-sm text-[#5C6B88]">
                        Lease details are unavailable.
                    </p>
                </Card.Body>
            </Card>
        );
    }
    const downloadLeasePdf = () => {
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) return;
        printWindow.document.write(`
      <html>
        <head>
          <title>Lease Agreement - ${tenant.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #2f261f; }
            h1 { margin-bottom: 8px; }
            .meta { color: #6f6258; margin-bottom: 18px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            td { padding: 8px 10px; border-bottom: 1px solid #e8ddcf; }
            td:first-child { color: #6f6258; width: 35%; }
          </style>
        </head>
        <body>
          <h1>Lease Agreement</h1>
          <div class="meta">${tenant.name} · ${(tenant.units ?? []).map((u) => u.number).join(', ')}</div>
          <table>
            <tr><td>Lease Start</td><td>${formatDateDisplay(tenant.lease_start)}</td></tr>
            <tr><td>Lease End</td><td>${formatDateDisplay(tenant.lease_end)}</td></tr>
            <tr><td>Monthly Rent</td><td>P${tenant.rent.toLocaleString()}</td></tr>
            <tr><td>Deposit</td><td>P${tenant.deposit.toLocaleString()}</td></tr>
            <tr><td>Payment Method</td><td>${tenant.payment_method}</td></tr>
          </table>
        </body>
      </html>
    `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };
    const unitDisplay = (tenant.units ?? []).map((u) => u.number).join(', ');
    return (
        <div className="max-w-4xl space-y-5">
            {/* ── Hero card ── */}
            <Card>
                <Card.Body>
                    <div className="mb-6 flex items-start justify-between">
                        <div>
                            <div className="mb-1 flex items-center gap-2">
                                <h2 className="text-lg font-bold text-[#1B2B4B]">
                                    Lease Agreement
                                </h2>
                                {tenant.status === 'active' && (
                                    <Badge variant="green">Active</Badge>
                                )}
                            </div>
                            <p className="text-sm text-[#5C6B88]">
                                {tenant.name} · {unitDisplay} · {tenant.type}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={downloadLeasePdf}
                        >
                            Download PDF
                        </Button>
                    </div>

                    {/* Active leases cards */}
                    {activeLeases.length > 0 ? (
                        <div className="space-y-4">
                            {activeLeases.map((lease) => {
                                const pct = leaseProgressPct(lease.start_date, lease.end_date);
                                return (
                                    <div key={lease.id} className="rounded-xl border border-[#1B2B4B]/8 bg-[#FAF8F4] p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-[#1B2B4B]">
                                                    Unit {lease.unit?.number ?? '-'} · {tenant.type}
                                                </p>
                                                <p className="text-xs text-[#5C6B88]">
                                                    P{Number(lease.rent).toLocaleString()}/mo · {lease.payment_method}
                                                </p>
                                            </div>
                                            <Badge variant="green">Active</Badge>
                                        </div>
                                        <div className="mb-2 flex justify-between text-xs text-[#5C6B88]">
                                            <span className="font-medium text-[#1B2B4B]">
                                                {formatDateDisplay(lease.start_date)}
                                            </span>
                                            <span>{pct}% elapsed</span>
                                            <span className="font-medium text-[#1B2B4B]">
                                                {formatDateDisplay(lease.end_date)}
                                            </span>
                                        </div>
                                        <div className="relative h-3 overflow-visible rounded-full bg-[#EDE5D8]">
                                            <div
                                                className="h-full rounded-full bg-[#24A18F] transition-all duration-500"
                                                style={{ width: `${pct}%` }}
                                            />
                                            <div
                                                className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#24A18F] bg-white shadow"
                                                style={{ left: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-xl bg-[#FAF8F4] p-4 text-center text-sm text-[#5C6B88]">
                            No active leases found.
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* ── Two-col: Lease details + Financials ── */}
            <div className="grid grid-cols-2 gap-5">
                <Card>
                    <Card.Header title="Lease Details" />
                    <Card.Body>
                        <InfoRow label="Tenant" value={tenant.name} />
                        <InfoRow label="Units" value={unitDisplay} />
                        <InfoRow label="Floor" value={tenant.floor} />
                        <InfoRow label="Unit Type" value={tenant.type} />
                        <InfoRow
                            label="Lease Start"
                            value={formatDateDisplay(tenant.lease_start)}
                        />
                        <InfoRow
                            label="Lease End"
                            value={formatDateDisplay(tenant.lease_end)}
                        />
                        <InfoRow
                            label="Contract Length"
                            value="Per lease term"
                            border={false}
                        />
                    </Card.Body>
                </Card>

                <Card>
                    <Card.Header title="Financial Terms" />
                    <Card.Body>
                        <InfoRow
                            label="Monthly Rent"
                            value={
                                <span className="font-bold text-[#1B2B4B]">
                                    ₱{tenant.rent.toLocaleString()}/mo
                                </span>
                            }
                        />
                        <InfoRow
                            label="Security Deposit"
                            value={`₱${tenant.deposit.toLocaleString()}`}
                        />
                        <InfoRow
                            label="Payment Method"
                            value={tenant.payment_method}
                        />
                        <InfoRow
                            label="Payment Due"
                            value="10th of every month"
                        />
                        <InfoRow label="Utilities" value="Included" />
                        <InfoRow label="Late Penalty" value="2% per week" />
                        <InfoRow
                            label="Annual Escalation"
                            value="Up to 5% per renewal"
                            border={false}
                        />
                    </Card.Body>
                </Card>
            </div>

            {/* ── Key terms ── */}
            <Card>
                <Card.Header title="Key Terms & Conditions" />
                <Card.Body>
                    <div className="grid grid-cols-2 gap-x-8">
                        {TERMS(tenant.type).map((t, i) => (
                            <InfoRow
                                key={t.label}
                                label={t.label}
                                value={t.value}
                                border={i < TERMS.length - 2}
                            />
                        ))}
                    </div>
                </Card.Body>
            </Card>

            {/* ── Lease history ── */}
            <Card>
                <Card.Header title="Lease & Renewal History" />
                <Card.Body flush>
                    {history.length === 0 && (
                        <div className="px-5 py-4 text-sm text-[#5C6B88]">
                            No lease records found.
                        </div>
                    )}
                    {history.map((h, i) => (
                        <div
                            key={h.id}
                            className="flex items-center gap-4 border-b border-[#1B2B4B]/5 px-5 py-4 last:border-0"
                        >
                            <div className="flex flex-col items-center gap-1">
                                <div
                                    className={[
                                        'h-3 w-3 rounded-full border-2',
                                        h.status === 'active'
                                            ? 'border-[#24A18F] bg-[#24A18F]'
                                            : 'border-[#1B2B4B]/20 bg-white',
                                    ].join(' ')}
                                />
                                {i < history.length - 1 && (
                                    <div className="h-6 w-px bg-[#1B2B4B]/10" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-[#1B2B4B]">
                                    Unit {h.unitNumber}
                                </p>
                                <p className="text-xs text-[#5C6B88]">
                                    {formatDateDisplay(h.startDate)} – {formatDateDisplay(h.endDate)} · ₱{h.rent.toLocaleString()}/mo
                                </p>
                            </div>
                            <Badge variant={h.status === 'active' ? 'green' : 'gray'}>
                                {h.status === 'active' ? 'Current' : h.status === 'ended' ? 'Ended' : h.status === 'expired' ? 'Expired' : h.status}
                            </Badge>
                        </div>
                    ))}
                </Card.Body>
            </Card>

            {/* ── Expiring banner (computed) ── */}
            {activeLeases.some((l) => {
                const end = new Date(l.end_date);
                const diff = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
                return diff > 0 && diff <= 30;
            }) && (
                <div className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100">
                        <span className="text-lg font-bold text-amber-500">!</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-amber-700">
                            A lease is expiring soon
                        </p>
                        <p className="mt-0.5 text-xs text-amber-600">
                            Contact the admin to discuss renewal terms.
                        </p>
                    </div>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => router.visit('/tenant/messages')}
                    >
                        Request Renewal
                    </Button>
                </div>
            )}
        </div>
    );
}
