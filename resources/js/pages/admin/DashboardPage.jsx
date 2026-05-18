import { useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Card from '../../components/Card';
import MetricCard from '../../components/MetricCard';
import Table from '../../components/Table';
import { formatDateDisplay } from '../../lib/date';
const EXPIRING_SOON_DAYS = 30;
const statusBadge = (status) => {
    if (status === 'paid') return <Badge variant="green">Paid</Badge>;
    if (status === 'due') return <Badge variant="amber">Due</Badge>;
    return <Badge variant="red">Overdue</Badge>;
};
export default function DashboardPage({ onNavigate }) {
    const {
        tenants = [],
        invoices = [],
        maintenance = [],
        units_count = 0,
    } = usePage().props;
    const metrics = useMemo(() => {
        const totalUnits = Math.max(1, units_count);
        const occupied = tenants.length;
        const occupancyPct = Math.round((occupied / totalUnits) * 100);
        const collected = invoices
            .filter((i) => i.status === 'paid')
            .reduce((sum, i) => sum + i.total, 0);
        const pending = invoices
            .filter((i) => i.status !== 'paid')
            .reduce((sum, i) => sum + i.total, 0);
        const openRequests = maintenance.filter(
            (m) => m.status !== 'resolved',
        ).length;
        return {
            totalUnits,
            occupied,
            occupancyPct,
            collected,
            pending,
            openRequests,
        };
    }, [tenants, invoices, maintenance, units_count]);
    const invoiceColumns = [
        { key: 'invoice_no', label: 'Invoice' },
        { key: 'period', label: 'Period' },
        {
            key: 'tenant',
            label: 'Tenant',
            render: (_, row) => row.tenant?.name ?? '-',
        },
        {
            key: 'total',
            label: 'Amount',
            align: 'right',
            render: (value) => `P${Number(value).toLocaleString()}`,
        },
        {
            key: 'status',
            label: 'Status',
            align: 'center',
            render: (value) => statusBadge(value),
        },
    ];
    return (
        <div className="space-y-5">
            <div className="grid grid-cols-4 gap-4">
                <MetricCard
                    label="Occupancy Rate"
                    value={`${metrics.occupancyPct}%`}
                    sub={`${metrics.occupied} of ${metrics.totalUnits} units`}
                    onClick={() => onNavigate?.('units')}
                />
                <MetricCard
                    label="Collected"
                    value={`P${metrics.collected.toLocaleString()}`}
                    sub="Paid invoices"
                    trend="up"
                    onClick={() => onNavigate?.('billing')}
                />
                <MetricCard
                    label="Pending"
                    value={`P${metrics.pending.toLocaleString()}`}
                    sub="Due and overdue invoices"
                    trend="down"
                    iconBg="bg-amber-50 text-amber-500"
                    onClick={() => onNavigate?.('billing')}
                />
                <MetricCard
                    label="Open Requests"
                    value={metrics.openRequests}
                    sub="Maintenance requests"
                    iconBg="bg-[#1B2B4B]/8 text-[#5C6B88]"
                    onClick={() => onNavigate?.('maintenance')}
                />
            </div>

            <Card>
                <Card.Header
                    title="Recent Invoices"
                    action={
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onNavigate?.('billing')}
                        >
                            View Billing
                        </Button>
                    }
                />
                <Table
                    columns={invoiceColumns}
                    data={invoices.slice(0, 6)}
                    keyField={'id'}
                    emptyText="No invoices yet."
                />
            </Card>

            <Card>
                <Card.Header
                    title="Maintenance Requests"
                    action={
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onNavigate?.('maintenance')}
                        >
                            View Maintenance
                        </Button>
                    }
                />
                <Card.Body flush>
                    {maintenance.length === 0 ? (
                        <div className="p-5 text-sm text-[#5C6B88]">
                            No maintenance requests yet.
                        </div>
                    ) : (
                        maintenance.slice(0, 6).map((request) => (
                            <div
                                key={request.id}
                                className="flex items-center gap-4 border-b border-[#1B2B4B]/5 px-5 py-3.5 last:border-0"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-[#1B2B4B]">
                                        {request.title}
                                    </p>
                                    <p className="text-xs text-[#5C6B88]">
                                        Unit {request.unit} · {request.tenant} ·{' '}
                                        {formatDateDisplay(
                                            request.created_at,
                                            '-',
                                        )}
                                    </p>
                                </div>
                                <Badge
                                    variant={
                                        request.priority === 'high'
                                            ? 'red'
                                            : request.priority === 'medium'
                                              ? 'amber'
                                              : 'gray'
                                    }
                                >
                                    {request.priority}
                                </Badge>
                                <Badge
                                    variant={
                                        request.status === 'resolved'
                                            ? 'green'
                                            : request.status === 'inprogress'
                                              ? 'amber'
                                              : 'red'
                                    }
                                >
                                    {request.status}
                                </Badge>
                            </div>
                        ))
                    )}
                </Card.Body>
            </Card>

            <Card>
                <Card.Header
                    title="Expiring Leases"
                    action={
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onNavigate?.('tenants')}
                        >
                            View Tenants
                        </Button>
                    }
                />
                <Card.Body flush>
                    {(() => {
                        const expiringSoon = tenants.filter((t) => {
                            if (t.status !== 'active') return false;
                            const end = new Date(t.lease_end);
                            const diff = Math.ceil(
                                (end - new Date()) / (1000 * 60 * 60 * 24),
                            );
                            return diff > 0 && diff <= EXPIRING_SOON_DAYS;
                        });
                        return expiringSoon.length === 0 ? (
                            <div className="p-5 text-sm text-[#5C6B88]">
                                No expiring leases right now.
                            </div>
                        ) : (
                            expiringSoon.map((tenant) => (
                                <div
                                    key={tenant.id}
                                    className="flex items-center justify-between border-b border-[#1B2B4B]/5 px-5 py-3.5 last:border-0"
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-[#1B2B4B]">
                                            {tenant.name}
                                        </p>
                                        <p className="text-xs text-[#5C6B88]">
                                            Unit {(tenant.units ?? []).map((u) => u.number).join(', ')} · Ends{' '}
                                            {formatDateDisplay(
                                                tenant.lease_end,
                                            )}
                                        </p>
                                    </div>
                                    <Badge variant="amber">Expiring</Badge>
                                </div>
                            ))
                        );
                    })()}
                </Card.Body>
            </Card>
        </div>
    );
}
