// src/pages/tenant/NotificationsPage.jsx
import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import NotifItem from '../../components/NotifItem';
import { formatDateTimeDisplay } from '../../lib/date';
const CATS = [
    { id: 'all', label: 'All' },
    { id: 'payment', label: 'Payments' },
    { id: 'maintenance', label: 'Maintenance' },
    { id: 'lease', label: 'Lease' },
    { id: 'system', label: 'System' },
];
const categoryLabel = (category) => {
    if (category === 'payment') return 'Payment';
    if (category === 'lease') return 'Lease';
    if (category === 'maintenance') return 'Maintenance';
    return 'System';
};
export default function TenantNotificationsPage({ notifications }) {
    const [category, setCategory] = useState('all');
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const items = notifications ?? [];
    const unreadCount = items.filter((n) => n.unread).length;
    const q = search.trim().toLowerCase();
    const filtered = items.filter((n) => {
        const matchCat = category === 'all' || n.category === category;
        const matchUnread = !unreadOnly || n.unread;
        const matchSearch =
            !q ||
            [
                n.message,
                categoryLabel(n.category),
                        formatDateTimeDisplay(
                            n.timestamp ?? n.created_at,
                            '',
                        ),
            ]
                .join(' ')
                .toLowerCase()
                .includes(q);
        return matchCat && matchUnread && matchSearch;
    });
    useEffect(() => {
        setPage(1);
    }, [category, unreadOnly, search]);
    const perPage = 8;
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * perPage;
    const paged = filtered.slice(start, start + perPage);
    const openNotification = (notification) => {
        setSelected(notification);
        setDetailOpen(true);
        if (notification.unread) {
            router.patch(
                `/tenant/notifications/${notification.id}/read`,
                {},
                { preserveScroll: true },
            );
        }
    };
    return (
        <div className="max-w-3xl space-y-5">
            {/* ── Summary ── */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    {
                        label: 'Total',
                        count: items.length,
                        color: 'text-[#1B2B4B]',
                    },
                    {
                        label: 'Unread',
                        count: unreadCount,
                        color: 'text-red-500',
                    },
                    {
                        label: 'Payments',
                        count: items.filter((n) => n.category === 'payment')
                            .length,
                        color: 'text-[#1D7B6E]',
                    },
                    {
                        label: 'Maintenance',
                        count: items.filter((n) => n.category === 'maintenance')
                            .length,
                        color: 'text-amber-600',
                    },
                ].map((s) => (
                    <div
                        key={s.label}
                        className="rounded-xl border border-[#1B2B4B]/10 bg-white px-4 py-3 shadow-sm"
                    >
                        <p className={`text-2xl font-bold ${s.color}`}>
                            {s.count}
                        </p>
                        <p className="mt-0.5 text-xs text-[#5C6B88]">
                            {s.label}
                        </p>
                    </div>
                ))}
            </div>

            {/* ── List ── */}
            <Card>
                <Card.Header
                    title="Notifications"
                    action={
                        <div className="flex items-center gap-2">
                            <input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search notifications..."
                                className="h-9 w-64 rounded-lg border border-[#1B2B4B]/15 bg-white px-3 text-sm text-[#1B2B4B] transition outline-none focus:border-[#1B2B4B]/35"
                            />
                            <button
                                onClick={() => setUnreadOnly((v) => !v)}
                                className={[
                                    'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                                    unreadOnly
                                        ? 'border-[#1B2B4B] bg-[#1B2B4B] text-white'
                                        : 'border-[#1B2B4B]/15 bg-white text-[#5C6B88] hover:bg-[#F5F0E8]',
                                ].join(' ')}
                            >
                                {unreadOnly ? 'Showing Unread' : 'Show Unread'}
                                {unreadCount > 0 && (
                                    <span className="ml-1.5 rounded-full bg-red-400 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                    router.post(
                                        '/tenant/notifications/read-all',
                                    )
                                }
                            >
                                Mark All Read
                            </Button>
                        </div>
                    }
                />

                {/* Category tabs */}
                <div className="flex gap-1 overflow-x-auto border-b border-[#1B2B4B]/8 px-5 py-2.5">
                    {CATS.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => setCategory(c.id)}
                            className={[
                                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all',
                                category === c.id
                                    ? 'bg-[#1B2B4B] text-white'
                                    : 'text-[#5C6B88] hover:bg-[#F5F0E8] hover:text-[#1B2B4B]',
                            ].join(' ')}
                        >
                            {c.label}
                            <span
                                className={[
                                    'rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                                    category === c.id
                                        ? 'bg-white/20 text-white'
                                        : 'bg-[#F5F0E8] text-[#5C6B88]',
                                ].join(' ')}
                            >
                                {c.id === 'all'
                                    ? items.length
                                    : items.filter((n) => n.category === c.id)
                                          .length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Items */}
                {filtered.length === 0 ? (
                    <div className="py-12 text-center text-sm text-[#5C6B88]">
                        No notifications here.
                    </div>
                ) : (
                    paged.map((n) => (
                        <button
                            key={n.id}
                            className="w-full text-left"
                            onClick={() => openNotification(n)}
                            title="Open notification details"
                        >
                            <NotifItem
                                variant={n.variant}
                                message={n.message}
                                timestamp={formatDateTimeDisplay(
                                    n.timestamp ?? n.created_at,
                                    '-',
                                )}
                                unread={n.unread}
                                className="transition-colors hover:bg-[#F5F0E8]"
                            />
                        </button>
                    ))
                )}

                <Card.Footer>
                    <div className="flex w-full items-center justify-between gap-3">
                        <div>
                            {filtered.length} notification
                            {filtered.length !== 1 ? 's' : ''}
                            {unreadOnly && ' (unread only)'}
                        </div>
                        {filtered.length > 0 && (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        setPage((prev) => Math.max(1, prev - 1))
                                    }
                                    disabled={currentPage === 1}
                                >
                                    Prev
                                </Button>
                                <span className="text-xs text-[#5C6B88]">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        setPage((prev) =>
                                            Math.min(totalPages, prev + 1),
                                        )
                                    }
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </div>
                </Card.Footer>
            </Card>

            {selected && (
                <Modal
                    open={detailOpen}
                    onClose={() => setDetailOpen(false)}
                    title="Notification Detail"
                    size="md"
                    footer={
                        <Button
                            variant="primary"
                            onClick={() => setDetailOpen(false)}
                        >
                            Close
                        </Button>
                    }
                >
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Badge variant={selected.unread ? 'red' : 'gray'}>
                                {selected.unread ? 'Unread' : 'Read'}
                            </Badge>
                            <Badge variant="blue">
                                {categoryLabel(selected.category)}
                            </Badge>
                        </div>
                        <p className="text-base leading-snug font-semibold text-[#1B2B4B]">
                            {selected.message}
                        </p>
                        <p className="text-xs text-[#5C6B88]">
                            {formatDateTimeDisplay(
                                selected.timestamp ?? selected.created_at,
                                '-',
                            )}
                        </p>
                    </div>
                </Modal>
            )}
        </div>
    );
}
