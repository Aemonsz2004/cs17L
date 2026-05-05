// src/components/layout/Sidebar.jsx
import { router } from '@inertiajs/react';
import Icon from './Icon';
const navIcon = {
    dashboard: 'grid',
    tenants: 'users',
    units: 'building',
    billing: 'credit-card',
    maintenance: 'wrench',
    messages: 'message-square',
    notifications: 'bell',
    reports: 'bar-chart',
};
export default function Sidebar({
    navSections,
    activeId,
    onNavigate,
    user,
    notifCount = 0,
}) {
    return (
        <aside className="flex h-full w-[210px] flex-shrink-0 flex-col bg-[var(--rtms-navy)]">
            {/* Brand */}
            <div className="flex h-16 flex-shrink-0 items-center gap-2.5 border-b border-white/[0.08] px-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--rtms-brown)] text-sm font-bold text-white select-none">
                    P
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] leading-tight font-semibold tracking-wide text-white/90">
                        Pandarawan RTMS
                    </p>
                    <p className="text-[10px] leading-tight text-white/40">
                        Admin Panel
                    </p>
                </div>
                <button className="ml-auto flex-shrink-0 rounded p-1 text-white/30 transition-colors hover:text-white/70">
                    <Icon name="chevron-left" size={16} className="block" />
                </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-2 py-3">
                {navSections.map((group) => (
                    <div key={group.section} className="mb-1">
                        <p className="px-2 pt-3 pb-1 text-[10px] font-semibold tracking-widest text-white/25 uppercase select-none">
                            {group.section}
                        </p>
                        {group.items.map((item) => {
                            const isActive = item.id === activeId;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onNavigate(item.id)}
                                    className={[
                                        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2',
                                        'text-sm font-medium transition-all duration-150 select-none',
                                        isActive
                                            ? 'bg-[var(--rtms-brown)]/20 text-[var(--rtms-sand)]'
                                            : 'text-white/55 hover:bg-white/[0.07] hover:text-white/90',
                                    ].join(' ')}
                                >
                                    <Icon
                                        name={navIcon[item.id] ?? 'grid'}
                                        size={15}
                                        className="h-[15px] w-[15px] flex-shrink-0"
                                    />
                                    <span className="flex-1 truncate text-left">
                                        {item.label}
                                    </span>
                                    {(((item.id === 'notifications'
                                        ? notifCount
                                        : item.badge) ?? 0) > 0) && (
                                        <span className="ml-auto flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-red-400/90 text-[9px] font-bold text-white">
                                            {item.id === 'notifications'
                                                ? notifCount
                                                : item.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* User footer */}
            <div className="flex-shrink-0 border-t border-white/[0.08] px-3 py-3">
                <div className="flex items-center gap-2.5 px-1">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--rtms-deep-brown)] text-[11px] font-bold text-white select-none">
                        {user.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-white/80">
                            {user.name}
                        </p>
                        <p className="truncate text-[10px] text-white/35">
                            {user.role}
                        </p>
                    </div>
                    <button
                        className="flex-shrink-0 p-1 text-white/30 transition-colors hover:text-white/70"
                        onClick={() => router.post('/logout')}
                        type="button"
                    >
                        <Icon name="log-out" size={16} className="block" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
