// src/components/layout/TenantNavbar.jsx
import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import Icon from '../../components/Icon';
import NotifItem from '../../components/NotifItem';
import { formatDateTimeDisplay } from '../../lib/date';

export default function TenantNavbar({
    pageTitle,
    action,
    user,
    notifCount = 0,
    notifications = [],
    archivedNotifications = [],
    onNotifClick,
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const activeNotifs = notifications ?? [];
    const recent = activeNotifs.slice(0, 10);

    return (
        <header className="flex h-14 flex-shrink-0 items-center gap-4 border-b border-[var(--rtms-navy)]/10 bg-white px-6">
            <h1 className="text-[15px] font-semibold text-[var(--rtms-navy)]">
                {pageTitle}
            </h1>

            <div className="flex-1" />

            {action && <div className="flex items-center gap-2">{action}</div>}

            {/* Bell */}
            <div ref={ref} className="relative">
                <button
                    onClick={() => setOpen((v) => !v)}
                    className="relative flex-shrink-0 rounded-lg p-2 text-[var(--rtms-muted)] transition-colors hover:bg-[var(--rtms-sand)] hover:text-[var(--rtms-navy)]"
                >
                    <Icon name="bell" size={16} className="block" />
                    {notifCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full border-2 border-white bg-red-400" />
                    )}
                </button>

                {open && (
                    <div className="absolute top-full right-0 z-50 mt-2 w-96 overflow-hidden rounded-xl border border-[#1B2B4B]/10 bg-white shadow-lg">
                        <div className="border-b border-[#1B2B4B]/8 px-4 py-3">
                            <p className="text-sm font-semibold text-[#1B2B4B]">
                                Notifications
                            </p>
                        </div>

                        <div className="max-h-80 overflow-y-auto">
                            {recent.length === 0 ? (
                                <div className="py-8 text-center text-sm text-[#5C6B88]">
                                    No notifications yet.
                                </div>
                            ) : (
                                recent.map((n) => (
                                    <button
                                        key={n.id}
                                        className="w-full text-left"
                                        onClick={() => {
                                            if (n.unread) {
                                                router.patch(
                                                    `/tenant/notifications/${n.id}/read`,
                                                    {},
                                                    { preserveScroll: true },
                                                );
                                            }
                                            setOpen(false);
                                            onNotifClick();
                                        }}
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
                        </div>

                        <div className="border-t border-[#1B2B4B]/8 px-4 py-2.5">
                            <button
                                className="w-full rounded-lg py-1.5 text-center text-xs font-medium text-[#24A18F] transition-colors hover:bg-[#24A18F]/5"
                                onClick={() => {
                                    setOpen(false);
                                    onNotifClick();
                                }}
                            >
                                View All Notifications
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="h-6 w-px flex-shrink-0 bg-[var(--rtms-navy)]/10" />
        </header>
    );
}
