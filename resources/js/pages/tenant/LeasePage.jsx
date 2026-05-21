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

    const unitDisplay = (tenant.units ?? []).map((u) => u.number).join(', ');
    const downloadDate = new Date().toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <>
            <style>{`
                @media print {
                    @page {
                        margin: 16mm 18mm;
                    }

                    body {
                        print-color-adjust: exact !important;
                        -webkit-print-color-adjust: exact !important;
                    }

                    nav, aside, .no-print {
                        display: none !important;
                    }

                    .print-only {
                        display: block !important;
                    }

                    .print-only-flex {
                        display: flex !important;
                    }

                    .print-page {
                        background: #fff !important;
                        color: #1B2B4B !important;
                        font-family: 'Instrument Sans', Arial, sans-serif !important;
                        font-size: 11pt !important;
                        line-height: 1.6 !important;
                    }

                    .print-page h1 {
                        font-size: 20pt !important;
                        font-weight: 700 !important;
                        margin-bottom: 4pt !important;
                        color: #1B2B4B !important;
                    }

                    .print-page h2 {
                        font-size: 14pt !important;
                        font-weight: 600 !important;
                        margin-top: 18pt !important;
                        margin-bottom: 8pt !important;
                        border-bottom: 2px solid #1B2B4B !important;
                        padding-bottom: 4pt !important;
                    }

                    .print-page h3 {
                        font-size: 12pt !important;
                        font-weight: 600 !important;
                        margin-top: 14pt !important;
                        margin-bottom: 6pt !important;
                    }

                    .print-page .meta {
                        color: #5C6B88 !important;
                        font-size: 10pt !important;
                        margin-bottom: 14pt !important;
                    }

                    .print-table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        margin-top: 8pt !important;
                        margin-bottom: 12pt !important;
                    }

                    .print-table td,
                    .print-table th {
                        padding: 5pt 8pt !important;
                        border-bottom: 1px solid #e0e0e0 !important;
                        text-align: left !important;
                        font-size: 10pt !important;
                    }

                    .print-table th {
                        font-weight: 600 !important;
                        color: #1B2B4B !important;
                        border-bottom: 2px solid #1B2B4B !important;
                    }

                    .print-table td:first-child {
                        color: #5C6B88 !important;
                        width: 32% !important;
                    }

                    .print-table td:last-child {
                        font-weight: 500 !important;
                    }

                    .print-signature {
                        margin-top: 28pt !important;
                        page-break-inside: avoid !important;
                    }

                    .print-signature-line {
                        border-top: 1px solid #1B2B4B !important;
                        width: 200pt !important;
                        margin-top: 4pt !important;
                    }

                    .print-terms-list {
                        margin-top: 6pt !important;
                    }

                    .print-terms-list dt {
                        font-weight: 600 !important;
                        margin-top: 6pt !important;
                        font-size: 10.5pt !important;
                    }

                    .print-terms-list dd {
                        margin-left: 0 !important;
                        font-size: 10pt !important;
                        color: #444 !important;
                    }

                    .print-history-item {
                        display: flex !important;
                        gap: 12pt !important;
                        padding: 6pt 0 !important;
                        border-bottom: 1px solid #e0e0e0 !important;
                    }

                    .print-history-item:last-child {
                        border-bottom: none !important;
                    }

                    .print-footer {
                        margin-top: 24pt !important;
                        padding-top: 10pt !important;
                        border-top: 1px solid #ccc !important;
                        font-size: 8.5pt !important;
                        color: #999 !important;
                        text-align: center !important;
                    }

                    .print-progress-track {
                        background: #EDE5D8 !important;
                        border-radius: 999px !important;
                        height: 8pt !important;
                        overflow: hidden !important;
                        margin: 6pt 0 !important;
                    }

                    .print-progress-fill {
                        background: #24A18F !important;
                        border-radius: 999px !important;
                        height: 100% !important;
                    }

                    .card-print-break {
                        page-break-inside: avoid !important;
                    }
                }

                .print-only {
                    display: none;
                }

                .print-only-flex {
                    display: none;
                }
            `}</style>

            <div className="space-y-5 print-page">
                {/* ── Hero card ── */}
                <Card>
                    <Card.Body>
                        <div className="no-print mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
                                onClick={() => window.print()}
                            >
                                Download PDF
                            </Button>
                        </div>

                        {/* Active leases cards */}
                        {activeLeases.length > 0 ? (
                            <div className="space-y-4">
                                {activeLeases.map((lease) => {
                                    const pct = leaseProgressPct(
                                        lease.start_date,
                                        lease.end_date,
                                    );
                                    return (
                                        <div
                                            key={lease.id}
                                            className="rounded-xl border border-[#1B2B4B]/8 bg-[#FAF8F4] p-4 card-print-break"
                                        >
                                            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold text-[#1B2B4B]">
                                                        Unit{' '}
                                                        {lease.unit?.number ??
                                                            '-'}{' '}
                                                        · {tenant.type}
                                                    </p>
                                                    <p className="text-xs text-[#5C6B88]">
                                                        P
                                                        {Number(
                                                            lease.rent,
                                                        ).toLocaleString()}
                                                        /mo ·{' '}
                                                        {lease.payment_method}
                                                    </p>
                                                </div>
                                                <Badge variant="green">
                                                    Active
                                                </Badge>
                                            </div>
                                            <div className="mb-2 flex justify-between text-xs text-[#5C6B88]">
                                                <span className="font-medium text-[#1B2B4B]">
                                                    {formatDateDisplay(
                                                        lease.start_date,
                                                    )}
                                                </span>
                                                <span>{pct}% elapsed</span>
                                                <span className="font-medium text-[#1B2B4B]">
                                                    {formatDateDisplay(
                                                        lease.end_date,
                                                    )}
                                                </span>
                                            </div>
                                            <div className="relative h-3 overflow-visible rounded-full bg-[#EDE5D8]">
                                                <div
                                                    className="h-full rounded-full bg-[#24A18F] transition-all duration-500"
                                                    style={{
                                                        width: `${pct}%`,
                                                    }}
                                                />
                                                <div
                                                    className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#24A18F] bg-white shadow"
                                                    style={{
                                                        left: `${pct}%`,
                                                    }}
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

                {/* ── Two-col: Lease details + Financials (responsive) ── */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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

                {/* ── Key terms (responsive) ── */}
                <Card>
                    <Card.Header title="Key Terms & Conditions" />
                    <Card.Body>
                        <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
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
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-[#1B2B4B]">
                                        Unit {h.unitNumber}
                                    </p>
                                    <p className="text-xs text-[#5C6B88]">
                                        {formatDateDisplay(h.startDate)} –{' '}
                                        {formatDateDisplay(h.endDate)} · ₱
                                        {h.rent.toLocaleString()}/mo
                                    </p>
                                </div>
                                <Badge
                                    variant={
                                        h.status === 'active'
                                            ? 'green'
                                            : 'gray'
                                    }
                                >
                                    {h.status === 'active'
                                        ? 'Current'
                                        : h.status === 'ended'
                                          ? 'Ended'
                                          : h.status === 'expired'
                                            ? 'Expired'
                                            : h.status}
                                </Badge>
                            </div>
                        ))}
                    </Card.Body>
                </Card>

                {/* ── Print-only: signature section ── */}
                <div className="print-only card-print-break">
                    <h2>Signatures</h2>
                    <p className="meta">
                        This Lease Agreement is entered into by and between the
                        Landlord and the Tenant on {downloadDate}.
                    </p>

                    <table className="print-table">
                        <thead>
                            <tr>
                                <th>Landlord / Administrator</th>
                                <th>Tenant</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ height: '60pt' }}></td>
                                <td style={{ height: '60pt' }}></td>
                            </tr>
                            <tr>
                                <td>
                                    <strong>[Admin Name]</strong>
                                </td>
                                <td>
                                    <strong>{tenant.name}</strong>
                                </td>
                            </tr>
                            <tr>
                                <td>Authorized Representative</td>
                                <td>Tenant</td>
                            </tr>
                        </tbody>
                    </table>

                    <p className="meta" style={{ marginTop: '16pt' }}>
                        Printed on {downloadDate}. This document serves as an
                        official record of the lease agreement between the
                        parties.
                    </p>

                    <div className="print-footer">
                        Lease Agreement — {tenant.name} · {unitDisplay} — Page
                        1 of 1
                    </div>
                </div>

                {/* ── Expiring banner ── */}
                <div className="no-print">
                    {activeLeases.some((l) => {
                        const end = new Date(l.end_date);
                        const diff = Math.ceil(
                            (end - new Date()) / (1000 * 60 * 60 * 24),
                        );
                        return diff > 0 && diff <= 30;
                    }) && (
                        <div className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100">
                                <span className="text-lg font-bold text-amber-500">
                                    !
                                </span>
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
                                onClick={() =>
                                    router.visit('/tenant/messages')
                                }
                            >
                                Request Renewal
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
