import { useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Card from '../../components/Card';
import MetricCard from '../../components/MetricCard';
import Table from '../../components/Table';
import { formatDateDisplay } from '../../lib/date';
function groupByMonth(invoices) {
    const map = new Map();
    for (const invoice of invoices) {
        const month = invoice.period;
        const current = map.get(month) ?? {
            month,
            billed: 0,
            collected: 0,
            outstanding: 0,
        };
        current.billed += invoice.total;
        if (invoice.status === 'paid') {
            current.collected += invoice.total;
        } else {
            current.outstanding += invoice.total;
        }
        map.set(month, current);
    }
    return Array.from(map.values());
}
const summaryColumns = [
    { key: 'month', label: 'Month' },
    {
        key: 'billed',
        label: 'Billed',
        align: 'right',
        render: (value) => `P${Number(value).toLocaleString()}`,
    },
    {
        key: 'collected',
        label: 'Collected',
        align: 'right',
        render: (value) => (
            <span className="font-semibold text-[#1D7B6E]">
                P{Number(value).toLocaleString()}
            </span>
        ),
    },
    {
        key: 'outstanding',
        label: 'Outstanding',
        align: 'right',
        render: (value) => {
            const amount = Number(value);
            return amount > 0 ? (
                <span className="font-semibold text-red-500">
                    P{amount.toLocaleString()}
                </span>
            ) : (
                <Badge variant="green">Cleared</Badge>
            );
        },
    },
];
export default function ReportsPage() {
    const { invoices = [] } = usePage().props;
    const monthlySummary = useMemo(() => groupByMonth(invoices), [invoices]);
    const totals = useMemo(() => {
        const billed = invoices.reduce(
            (sum, invoice) => sum + invoice.total,
            0,
        );
        const collected = invoices
            .filter((invoice) => invoice.status === 'paid')
            .reduce((sum, invoice) => sum + invoice.total, 0);
        const outstanding = billed - collected;
        const collectionRate =
            billed > 0 ? Math.round((collected / billed) * 100) : 0;
        return { billed, collected, outstanding, collectionRate };
    }, [invoices]);
    const downloadCsv = () => {
        const rows = [
            ['Month', 'Billed', 'Collected', 'Outstanding'],
            ...monthlySummary.map((row) => [
                row.month,
                row.billed,
                row.collected,
                row.outstanding,
            ]),
        ];
        const csv = rows.map((row) => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'financial-summary.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    return (
        <div className="space-y-5">
            <div className="grid grid-cols-4 gap-4">
                <MetricCard
                    label="Total Billed"
                    value={`P${totals.billed.toLocaleString()}`}
                    sub="All invoices"
                />
                <MetricCard
                    label="Collected"
                    value={`P${totals.collected.toLocaleString()}`}
                    sub="Paid invoices"
                    trend="up"
                />
                <MetricCard
                    label="Outstanding"
                    value={`P${totals.outstanding.toLocaleString()}`}
                    sub="Due and overdue"
                    trend="down"
                    iconBg="bg-amber-50 text-amber-500"
                />
                <MetricCard
                    label="Collection Rate"
                    value={`${totals.collectionRate}%`}
                    sub="From billed amount"
                />
            </div>

            <Card>
                <Card.Header
                    title="Monthly Summary"
                    action={
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={downloadCsv}
                        >
                            Export CSV
                        </Button>
                    }
                />
                <Table
                    columns={summaryColumns}
                    data={monthlySummary}
                    keyField={'month'}
                    emptyText="No invoice data available."
                />
            </Card>

            <Card>
                <Card.Header title="Latest Invoice Activity" />
                <Card.Body flush>
                    {invoices.length === 0 ? (
                        <div className="p-5 text-sm text-[#5C6B88]">
                            No invoice activity yet.
                        </div>
                    ) : (
                        invoices.slice(0, 8).map((invoice) => (
                            <div
                                key={invoice.id}
                                className="flex items-center justify-between border-b border-[#1B2B4B]/5 px-5 py-3.5 last:border-0"
                            >
                                <div>
                                    <p className="text-sm font-medium text-[#1B2B4B]">
                                        {invoice.period}
                                    </p>
                                    <p className="text-xs text-[#5C6B88]">
                                        {invoice.tenant?.name ?? 'Unknown'} · Unit{' '}
                                        {(invoice.tenant?.units ?? []).map((u) => u.number).join(', ') || '-'}
                                    </p>
                                    <p className="text-xs text-[#5C6B88]">
                                        Due{' '}
                                        {formatDateDisplay(invoice.due_date)}
                                        {invoice.paid_date
                                            ? ` · Paid ${formatDateDisplay(invoice.paid_date)}`
                                            : ''}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-[#1B2B4B]">
                                        P{invoice.total.toLocaleString()}
                                    </span>
                                    <Badge
                                        variant={
                                            invoice.status === 'paid'
                                                ? 'green'
                                                : invoice.status === 'due'
                                                  ? 'amber'
                                                  : 'red'
                                        }
                                    >
                                        {invoice.status}
                                    </Badge>
                                </div>
                            </div>
                        ))
                    )}
                </Card.Body>
            </Card>
        </div>
    );
}
