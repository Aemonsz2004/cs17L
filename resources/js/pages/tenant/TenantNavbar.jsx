// src/components/layout/TenantNavbar.jsx
import Icon from '../../components/Icon';
export default function TenantNavbar({
    pageTitle,
    action,
    user,
    notifCount = 0,
    onNotifClick,
}) {
    return (
        <header className="flex h-14 flex-shrink-0 items-center gap-4 border-b border-[var(--rtms-navy)]/10 bg-white px-6">
            <h1 className="text-[15px] font-semibold text-[var(--rtms-navy)]">
                {pageTitle}
            </h1>

            <div className="flex-1" />

            {action && <div className="flex items-center gap-2">{action}</div>}

            {/* Bell */}
            <button
                onClick={onNotifClick}
                className="relative flex-shrink-0 rounded-lg p-2 text-[var(--rtms-muted)] transition-colors hover:bg-[var(--rtms-sand)] hover:text-[var(--rtms-navy)]"
            >
                <Icon name="bell" size={16} className="block" />
                {notifCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full border-2 border-white bg-red-400" />
                )}
            </button>

            <div className="h-6 w-px flex-shrink-0 bg-[var(--rtms-navy)]/10" />

            {/* User chip */}
            <div className="flex flex-shrink-0 items-center gap-2.5">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--rtms-deep-brown)] text-[11px] font-bold text-white select-none">
                    {user.initials}
                </div>
                <div>
                    <p className="text-xs leading-tight font-semibold text-[var(--rtms-navy)]">
                        {user.name}
                    </p>
                    <p className="text-[10px] leading-tight text-[var(--rtms-muted)]">
                        Unit {user.unit ?? '-'}
                    </p>
                </div>
                <Icon
                    name="chevron-down"
                    size={12}
                    className="text-[var(--rtms-muted)]"
                />
            </div>
        </header>
    );
}
