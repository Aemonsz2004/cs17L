// src/pages/tenant/MyUnitPage.jsx
import { router } from '@inertiajs/react';
import Avatar from '../../components/Avatar';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Icon from '../../components/Icon';
import InfoRow from '../../components/InfoRow';
import ProgressBar from '../../components/ProgressBar';
import { formatDateDisplay } from '../../lib/date';
import { useMemo } from 'react';
// ── Lease progress helper ─────────────────────────────────────────────────────
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
// ─────────────────────────────────────────────────────────────────────────────
export default function MyUnitPage({
    onNavigate,
    tenant,
    invoices = [],
    maintenance = [],
    isMovedOut = false,
    availableUnits = [],
}) {
    const paidThisMonth = useMemo(
        () => invoices.find((invoice) => invoice.status === 'paid'),
        [invoices],
    );
    const hasOverdue = invoices.some((invoice) => invoice.status === 'overdue');
    const openRequests = maintenance.filter(
        (m) => m.status === 'open' || m.status === 'inprogress',
    );
    const nextInvoice = invoices.find((invoice) => invoice.status !== 'paid');
    const leasePct = leaseProgressPct(
        tenant?.lease_start ?? new Date().toISOString(),
        tenant?.lease_end ?? new Date().toISOString(),
    );
    if (isMovedOut) {
        return (
            <div className="space-y-5">
                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-6 py-5">
                    <h2 className="text-lg font-bold text-[#15233d]">You have moved out</h2>
                    <p className="mt-1 text-sm text-[#42506b]">
                        Browse available units below and apply for a new one.
                    </p>
                </div>
                {availableUnits.length === 0 ? (
                    <Card>
                        <Card.Body>
                            <p className="text-sm text-[#5C6B88]">No units are currently available.</p>
                        </Card.Body>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {availableUnits.map((unit) => (
                            <article key={unit.id} className="rounded-2xl border border-[#15233d]/10 bg-white p-4 shadow-sm">
                                <img
                                    src={unit.gallery?.[0]}
                                    alt={`Unit ${unit.number}`}
                                    className="h-36 w-full rounded-xl object-cover"
                                />
                                <h3 className="mt-3 text-lg font-bold">Unit {unit.number}</h3>
                                <p className="text-sm text-[#42506b]">
                                    {unit.floor} · {unit.type} · {unit.area} sqm
                                </p>
                                <p className="mt-2 text-xl font-black text-[#1d7b6e]">
                                    P{Number(unit.base_rent).toLocaleString()}/month
                                </p>
                                <div className="mt-3 flex gap-2">
                                    <a
                                        href={`/units/${unit.id}`}
                                        className="rounded-lg border border-[#15233d]/20 px-3 py-2 text-sm font-medium hover:bg-[#f8fafc]"
                                    >
                                        View Details
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => router.visit(`/tenant/reapply/${unit.id}`)}
                                        className="rounded-lg bg-[#15233d] px-3 py-2 text-sm font-medium text-white hover:bg-[#0f1a2d]"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        );
    }
    if (!tenant) {
        return (
            <Card>
                <Card.Body>
                    <p className="text-sm text-[#5C6B88]">
                        Tenant profile not found.
                    </p>
                </Card.Body>
            </Card>
        );
    }
    return (
        <div className="space-y-5">
            {/* ── Welcome banner ── */}
            <div className="flex items-center justify-between rounded-2xl bg-[#1B2B4B] px-7 py-5">
                <div className="flex items-center gap-4">
                    <Avatar
                        initials={tenant.initials}
                        name={tenant.name}
                        size="lg"
                    />
                    <div>
                        <p className="mb-1 text-xs text-white/50">
                            Welcome back
                        </p>
                        <h2 className="text-xl leading-tight font-bold text-white">
                            {tenant.name}
                        </h2>
                        <p className="mt-0.5 text-sm text-white/50">
                            {(tenant.units ?? []).map((u) => u.number).join(', ')} · {tenant.floor} · {tenant.type}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="mb-1 text-xs text-white/40">
                        Next payment due
                    </p>
                    <p className="text-3xl font-bold text-[#5ECFC2]">
                        ₱{(nextInvoice?.total ?? 0).toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-white/40">
                        {formatDateDisplay(nextInvoice?.due_date)}
                    </p>
                    <Button
                        variant="primary"
                        size="sm"
                        className="mt-3"
                        onClick={() => onNavigate('pay-rent')}
                    >
                        Pay Now
                    </Button>
                </div>
            </div>

            {/* ── Status cards row ── */}
            <div className="grid grid-cols-3 gap-4">
                {/* Payment status */}
                <Card padding>
                    <p className="mb-3 text-[10px] font-bold tracking-widest text-[#5C6B88] uppercase">
                        March Payment
                    </p>
                    {paidThisMonth ? (
                        <>
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-sm text-[#5C6B88]">
                                    Status
                                </span>
                                <Badge variant="green">Paid</Badge>
                            </div>
                            <div className="mb-3 flex items-center justify-between">
                                <span className="text-sm text-[#5C6B88]">
                                    Amount
                                </span>
                                <span className="text-sm font-bold text-[#1B2B4B]">
                                    ₱{paidThisMonth.total.toLocaleString()}
                                </span>
                            </div>
                            <ProgressBar value={100} variant="teal" size="sm" />
                            <p className="mt-2 text-[11px] text-[#5C6B88]">
                                Paid via {paidThisMonth.method} ·{' '}
                                {formatDateDisplay(paidThisMonth.paid_date)}
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="mb-3 flex items-center justify-between">
                                <span className="text-sm text-[#5C6B88]">
                                    Status
                                </span>
                                <Badge variant={hasOverdue ? 'red' : 'amber'}>
                                    {hasOverdue ? 'Overdue' : 'Due'}
                                </Badge>
                            </div>
                            <ProgressBar value={0} variant="amber" size="sm" />
                            <p className="mt-2 text-[11px] text-[#5C6B88]">
                                Payment pending
                            </p>
                        </>
                    )}
                </Card>

                {/* Lease status */}
                <Card padding>
                    <p className="mb-3 text-[10px] font-bold tracking-widest text-[#5C6B88] uppercase">
                        Lease Progress
                    </p>
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm text-[#5C6B88]">Status</span>
                        <Badge variant="green">Active</Badge>
                    </div>
                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm text-[#5C6B88]">Expires</span>
                        <span className="text-sm font-semibold text-[#1B2B4B]">
                            {formatDateDisplay(tenant.lease_end)}
                        </span>
                    </div>
                    <ProgressBar
                        value={leasePct}
                        variant="navy"
                        size="sm"
                        showValue
                    />
                </Card>

                {/* Maintenance */}
                <Card padding>
                    <p className="mb-3 text-[10px] font-bold tracking-widest text-[#5C6B88] uppercase">
                        Maintenance
                    </p>
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm text-[#5C6B88]">
                            Open tickets
                        </span>
                        <span
                            className={`text-xl font-bold ${openRequests.length > 0 ? 'text-amber-500' : 'text-[#1D7B6E]'}`}
                        >
                            {openRequests.length}
                        </span>
                    </div>
                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm text-[#5C6B88]">Resolved</span>
                        <span className="text-sm font-semibold text-[#1B2B4B]">
                            {
                                maintenance.filter(
                                    (m) => m.status === 'resolved',
                                ).length
                            }
                        </span>
                    </div>
                    <Button
                        variant="outline"
                        size="xs"
                        full
                        onClick={() => onNavigate('maintenance')}
                    >
                        View Requests
                    </Button>
                </Card>
            </div>

            {/* ── Two-col: Unit details + Recent activity ── */}
            <div className="grid grid-cols-2 gap-5">
                {/* Unit details */}
                <Card>
                    <Card.Header
                        title="Unit Details"
                        action={
                            <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => onNavigate('lease')}
                            >
                                View Lease →
                            </Button>
                        }
                    />
                    <Card.Body>
                        <InfoRow
                            label="Unit Number"
                            value={(tenant.units ?? []).map((u) => u.number).join(', ')}
                        />
                        <InfoRow label="Floor" value={tenant.floor} />
                        <InfoRow label="Unit Type" value={tenant.type} />
                        <InfoRow label="Area (sqm)" value={tenant.units?.[0]?.area?.toLocaleString() ?? '-'} />
                        <InfoRow
                            label="Monthly Rent"
                            value={
                                <span className="font-bold text-[#1B2B4B]">
                                    ₱{tenant.rent.toLocaleString()}
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
                            border={false}
                        />
                    </Card.Body>
                </Card>

                {/* Recent activity */}
                <Card>
                    <Card.Header title="Recent Activity" />
                    <Card.Body flush>
                        {[
                            ...invoices.slice(0, 3).map((inv) => ({
                                type: 'payment',
                                title: `${inv.period} rent`,
                                sub: inv.paid_date
                                    ? `Paid · ${formatDateDisplay(inv.paid_date)}`
                                    : `Due ${formatDateDisplay(inv.due_date)}`,
                                amount: `₱${inv.total.toLocaleString()}`,
                                status: inv.status,
                            })),
                            ...maintenance.slice(0, 2).map((m) => ({
                                type: 'maintenance',
                                title: m.title,
                                sub: `${formatDateDisplay(m.created_at)}`,
                                amount: null,
                                status: m.status,
                            })),
                        ]
                            .slice(0, 5)
                            .map((item, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3 border-b border-[#1B2B4B]/5 px-5 py-3.5 last:border-0"
                                >
                                    {/* Type dot */}
                                    <div
                                        className={[
                                            'h-2 w-2 flex-shrink-0 rounded-full',
                                            item.type === 'payment'
                                                ? item.status === 'paid'
                                                    ? 'bg-[#24A18F]'
                                                    : 'bg-amber-400'
                                                : item.status === 'resolved'
                                                  ? 'bg-[#24A18F]'
                                                  : 'bg-amber-400',
                                        ].join(' ')}
                                    />

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-[#1B2B4B]">
                                            {item.title}
                                        </p>
                                        <p className="text-xs text-[#5C6B88]">
                                            {item.sub}
                                        </p>
                                    </div>

                                    <div className="flex-shrink-0 text-right">
                                        {item.amount && (
                                            <p className="text-sm font-semibold text-[#1B2B4B]">
                                                {item.amount}
                                            </p>
                                        )}
                                        <div className="mt-0.5">
                                            {item.status === 'paid' && (
                                                <Badge variant="green">
                                                    Paid
                                                </Badge>
                                            )}
                                            {item.status === 'due' && (
                                                <Badge variant="amber">
                                                    Due
                                                </Badge>
                                            )}
                                            {item.status === 'overdue' && (
                                                <Badge variant="red">
                                                    Overdue
                                                </Badge>
                                            )}
                                            {item.status === 'resolved' && (
                                                <Badge variant="green">
                                                    Resolved
                                                </Badge>
                                            )}
                                            {item.status === 'open' && (
                                                <Badge variant="red">
                                                    Open
                                                </Badge>
                                            )}
                                            {item.status === 'inprogress' && (
                                                <Badge variant="amber">
                                                    In Progress
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </Card.Body>
                </Card>
            </div>

            {/* ── Quick actions ── */}
            <Card>
                <Card.Header title="Quick Actions" />
                <Card.Body>
                    <div className="grid grid-cols-4 gap-3">
                        {[
                            {
                                label: 'Pay Rent',
                                sub: `₱${(nextInvoice?.total ?? 0).toLocaleString()} due ${formatDateDisplay(nextInvoice?.due_date)}`,
                                id: 'pay-rent',
                                accent: 'bg-[#24A18F]/10 border-[#24A18F]/20 hover:bg-[#24A18F]/15',
                            },
                            {
                                label: 'View Billing',
                                sub: 'Invoices & history',
                                id: 'billing',
                                accent: 'bg-[#1B2B4B]/5  border-[#1B2B4B]/10 hover:bg-[#1B2B4B]/8',
                            },
                            {
                                label: 'Report Issue',
                                sub: 'Maintenance request',
                                id: 'maintenance',
                                accent: 'bg-[#1B2B4B]/5  border-[#1B2B4B]/10 hover:bg-[#1B2B4B]/8',
                            },
                            {
                                label: 'Message Admin',
                                sub: 'Send a message',
                                id: 'messages',
                                accent: 'bg-[#1B2B4B]/5  border-[#1B2B4B]/10 hover:bg-[#1B2B4B]/8',
                            },
                        ].map((a) => (
                            <button
                                key={a.id}
                                onClick={() => onNavigate(a.id)}
                                className={[
                                    'rounded-xl border px-4 py-4 text-left transition-all',
                                    a.accent,
                                ].join(' ')}
                            >
                                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/60">
                                    <Icon
                                        name={
                                            a.id === 'pay-rent'
                                                ? 'dollar-sign'
                                                : a.id === 'billing'
                                                  ? 'credit-card'
                                                  : a.id === 'maintenance'
                                                    ? 'wrench'
                                                    : 'message-square'
                                        }
                                        size={14}
                                        className="text-[var(--rtms-navy)]"
                                    />
                                </div>
                                <p className="text-sm font-semibold text-[#1B2B4B]">
                                    {a.label}
                                </p>
                                <p className="mt-0.5 text-xs text-[#5C6B88]">
                                    {a.sub}
                                </p>
                            </button>
                        ))}
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
}
