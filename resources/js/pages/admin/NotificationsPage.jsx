// src/pages/admin/NotificationsPage.jsx
import { router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ConfirmModal from '../../components/ConfirmModal';
import { Input } from '../../components/Input';
import MetricCard from '../../components/MetricCard';
import NotifItem from '../../components/NotifItem';
import { formatDateTimeDisplay } from '../../lib/date';
const CATEGORIES = [
    { key: 'all', label: 'All' },
    { key: 'payment', label: 'Payments' },
    { key: 'lease', label: 'Leases' },
    { key: 'maintenance', label: 'Maintenance' },
    { key: 'system', label: 'System' },
];
const getDestination = (category) => {
    if (category === 'payment') return 'billing';
    if (category === 'lease') return 'applications';
    if (category === 'maintenance') return 'maintenance';
    return 'reports';
};
const categoryLabel = (category) => {
    if (category === 'payment') return 'Payment';
    if (category === 'lease') return 'Lease';
    if (category === 'maintenance') return 'Maintenance';
    return 'System';
};
export default function NotificationsPage({
    notifications,
    archivedNotifications,
    onChangeNotifications,
    onChangeArchived,
    onNavigate,
}) {
    const [viewMode, setViewMode] = useState('active');
    const [category, setCategory] = useState('all');
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 8;
    const unreadCount = useMemo(
        () => notifications.filter((n) => n.unread).length,
        [notifications],
    );
    const items = viewMode === 'active' ? notifications : archivedNotifications;
    const filtered = useMemo(
        () =>
            items.filter((n) => {
                const matchCat = category === 'all' || n.category === category;
                const matchUnread = !showUnreadOnly || n.unread;
                const keyword = search.toLowerCase().trim();
                const matchSearch =
                    !keyword || n.message.toLowerCase().includes(keyword);
                return matchCat && matchUnread && matchSearch;
            }),
        [items, category, showUnreadOnly, search],
    );
    useEffect(() => {
        setPage(1);
    }, [category, showUnreadOnly, search]);
    useEffect(() => {
        if (viewMode !== 'active') {
            setShowUnreadOnly(false);
        }
        setPage(1);
    }, [viewMode]);
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const pagedNotifications = filtered.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
    );
    const markAsRead = (id) => {
        if (viewMode !== 'active') {
            return;
        }
        router.patch(
            `/admin/notifications/${id}/read`,
            {},
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
        onChangeNotifications((prev) =>
            prev.map((notification) =>
                notification.id === id
                    ? { ...notification, unread: false }
                    : notification,
            ),
        );
    };
    const [confirmAction, setConfirmAction] = useState(null);
    const markAllRead = () => {
        if (viewMode !== 'active') {
            return;
        }
        setConfirmAction({ type: 'markAllRead' });
    };
    const confirmMarkAllRead = () => {
        if (!confirmAction) return;
        setConfirmAction(null);
        router.post(
            '/admin/notifications/read-all',
            {},
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
        onChangeNotifications((prev) =>
            prev.map((notification) => ({ ...notification, unread: false })),
        );
    };
    const archiveNotification = (notification) => {
        setConfirmAction({ type: 'archive', notification });
    };
    const confirmArchiveNotification = () => {
        if (!confirmAction) return;
        const notification = confirmAction.notification;
        setConfirmAction(null);
        router.delete(`/admin/notifications/${notification.id}`);
        onChangeNotifications((prev) =>
            prev.filter((item) => item.id !== notification.id),
        );
        onChangeArchived((prev) => [notification, ...prev]);
    };
    const restoreNotification = (notification) => {
        setConfirmAction({ type: 'restore', notification });
    };
    const confirmRestoreNotification = () => {
        if (!confirmAction) return;
        const notification = confirmAction.notification;
        setConfirmAction(null);
        router.post(`/admin/notifications/${notification.id}/restore`);
        onChangeArchived((prev) =>
            prev.filter((item) => item.id !== notification.id),
        );
        onChangeNotifications((prev) => [notification, ...prev]);
    };
    const openDetails = (notification) => {
        markAsRead(notification.id);

        if (notification.category === 'lease') {
            localStorage.setItem(
                'admin-applications-autofocus',
                'pending_review',
            );
        }

        onNavigate(getDestination(notification.category));
    };
    return (
        <div className="space-y-5">
            {/* ── Metrics ── */}
            <div className="grid grid-cols-4 gap-4">
                <MetricCard
                    label="Total"
                    value={items.length}
                    sub="All notifications"
                />
                <MetricCard
                    label="Unread"
                    value={viewMode === 'active' ? unreadCount : 0}
                    sub="Need attention"
                    trend="down"
                    iconBg="bg-red-50 text-red-400"
                />
                <MetricCard
                    label="Payments"
                    value={items.filter((n) => n.category === 'payment').length}
                    sub="Payment alerts"
                />
                <MetricCard
                    label="Maintenance"
                    value={
                        items.filter((n) => n.category === 'maintenance').length
                    }
                    sub="Repair alerts"
                />
            </div>

            <Card>
                <Card.Header
                    title="Notifications"
                    action={
                        <div className="flex items-center gap-2">
                            <div className="flex gap-0.5 rounded-lg bg-[#F5F0E8] p-0.5">
                                {['archived', 'active'].map((tab) => (
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
                                placeholder="Search notifications..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-56"
                            />
                            {/* Unread toggle */}
                            <button
                                onClick={() =>
                                    setShowUnreadOnly((value) => !value)
                                }
                                className={[
                                    'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                                    showUnreadOnly
                                        ? 'border-[#1B2B4B] bg-[#1B2B4B] text-white'
                                        : 'border-[#1B2B4B]/15 bg-white text-[#5C6B88] hover:bg-[#F5F0E8]',
                                ].join(' ')}
                                disabled={viewMode !== 'active'}
                            >
                                {showUnreadOnly
                                    ? 'Showing Unread'
                                    : 'Show Unread Only'}
                                {viewMode === 'active' && unreadCount > 0 && (
                                    <span className="ml-1.5 rounded-full bg-red-400 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                            {viewMode === 'active' && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={markAllRead}
                                >
                                    Mark All Read
                                </Button>
                            )}
                        </div>
                    }
                />

                {/* Category tabs */}
                <div className="flex gap-1 overflow-x-auto border-b border-[#1B2B4B]/8 px-5 py-3">
                    {CATEGORIES.map((c) => (
                        <button
                            key={c.key}
                            onClick={() => setCategory(c.key)}
                            className={[
                                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all',
                                category === c.key
                                    ? 'bg-[#1B2B4B] text-white'
                                    : 'text-[#5C6B88] hover:bg-[#F5F0E8] hover:text-[#1B2B4B]',
                            ].join(' ')}
                        >
                            {c.label}
                            <span
                                className={[
                                    'rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                                    category === c.key
                                        ? 'bg-white/20 text-white'
                                        : 'bg-[#F5F0E8] text-[#5C6B88]',
                                ].join(' ')}
                            >
                                {c.key === 'all'
                                    ? items.length
                                    : items.filter((n) => n.category === c.key)
                                          .length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* List */}
                {filtered.length === 0 ? (
                    <div className="py-12 text-center text-sm text-[#5C6B88]">
                        No notifications in this category.
                    </div>
                ) : (
                    pagedNotifications.map((notification) => (
                        <div
                            key={notification.id}
                            className="flex items-center gap-2 border-b border-[#1B2B4B]/5 px-5 transition-colors hover:bg-[#FAF8F4]"
                        >
                            <button
                                type="button"
                                onClick={() => openDetails(notification)}
                                title="Go to related page"
                                aria-label={`Go to related page: ${notification.message}`}
                                className="min-w-0 flex-1 text-left"
                            >
                                <NotifItem
                                    variant={notification.variant}
                                    message={notification.message}
                                    timestamp={formatDateTimeDisplay(
                                        notification.timestamp ??
                                            notification.created_at,
                                        '-',
                                    )}
                                    unread={notification.unread}
                                    className="border-0"
                                />
                            </button>
                            <div className="flex shrink-0 items-center gap-1 rounded-2xlhover:opacity-50 text-white px-2 py-1 text-xs font-medium">
                                {viewMode === 'active' && (
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            markAsRead(notification.id);
                                        }}
                                    >
                                        Mark as read
                                    </Button>
                                )}
                                {viewMode === 'active' ? (
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            archiveNotification(notification);
                                        }}
                                    >
                                        Archive
                                    </Button>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            restoreNotification(notification);
                                        }}
                                    >
                                        Restore
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))
                )}

                <Card.Footer>
                    <div className="flex w-full items-center justify-between gap-3">
                        <span>
                            Showing{' '}
                            {filtered.length === 0
                                ? 0
                                : (currentPage - 1) * pageSize + 1}
                            -{Math.min(currentPage * pageSize, filtered.length)}{' '}
                            of {filtered.length}
                            {showUnreadOnly &&
                                viewMode === 'active' &&
                                ' (unread only)'}
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="xs"
                                disabled={currentPage <= 1}
                                onClick={() =>
                                    setPage((prev) => Math.max(1, prev - 1))
                                }
                            >
                                Prev
                            </Button>
                            <span className="text-xs text-[#5C6B88]">
                                Page {currentPage} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="xs"
                                disabled={currentPage >= totalPages}
                                onClick={() =>
                                    setPage((prev) =>
                                        Math.min(totalPages, prev + 1),
                                    )
                                }
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </Card.Footer>
            </Card>

            {confirmAction && (
                <ConfirmModal
                    open
                    onClose={() => setConfirmAction(null)}
                    onConfirm={() => {
                        if (confirmAction.type === 'archive')
                            confirmArchiveNotification();
                        if (confirmAction.type === 'restore')
                            confirmRestoreNotification();
                        if (confirmAction.type === 'markAllRead')
                            confirmMarkAllRead();
                    }}
                    title={
                        confirmAction.type === 'archive'
                            ? 'Archive Notification'
                            : confirmAction.type === 'restore'
                              ? 'Restore Notification'
                              : 'Mark All as Read'
                    }
                    message={
                        confirmAction.type === 'archive'
                            ? 'Archive this notification?'
                            : confirmAction.type === 'restore'
                              ? 'Restore this notification?'
                              : 'Mark all notifications as read?'
                    }
                    variant={
                        confirmAction.type === 'archive' ? 'danger' : 'primary'
                    }
                    confirmLabel={
                        confirmAction.type === 'archive'
                            ? 'Archive'
                            : confirmAction.type === 'restore'
                              ? 'Restore'
                              : 'Mark All Read'
                    }
                />
            )}
        </div>
    );
}
