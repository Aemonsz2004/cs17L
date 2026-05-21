// src/TenantApp.jsx
// Root of the tenant portal.
// Swap this with App.jsx (or add a route/toggle) when switching between admin and tenant views.
import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import TenantLayout from '../../components/Layouts/TenantLayout';
import TenantBillingPage from './BillingPage';
import LeasePage from './LeasePage';
import TenantMaintenancePage from './MaintenancePage';
import MessagesPage from './MessagesPage';
import MyUnitPage from './MyunitPage';
import TenantNotificationsPage from './NotificationPage';
import PayRentPage from './PayrentPage';
const PAGE_TITLES = {
    'my-unit': 'Available Units',
    lease: 'Lease Agreement',
    billing: 'Billing & Payments',
    'pay-rent': 'Pay Rent',
    maintenance: 'Maintenance Requests',
    messages: 'Messages',
    notifications: 'Notifications',
};
const TENANT_ROUTE_MAP = {
    'my-unit': '/tenant/home',
    lease: '/tenant/lease',
    billing: '/tenant/billing',
    'pay-rent': '/tenant/pay-rent',
    maintenance: '/tenant/maintenance',
    messages: '/tenant/messages',
    notifications: '/tenant/notifications',
};
export default function TenantApp({
    initialPage = 'my-unit',
    tenant,
    invoices,
    leases,
    maintenance,
    notifications,
    messages,
    isMovedOut = false,
    availableUnits = [],
}) {
    const [page] = useState(initialPage);
    const { auth, unread_count, archivedNotifications } = usePage().props;
    const userName = auth?.user?.name ?? 'Tenant';
    const initials = userName
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    const unreadCount =
        unread_count ?? (notifications ?? []).filter((n) => n.unread).length;
    const messageCount = (messages ?? []).filter(
        (message) => message.from === 'admin',
    ).length;
    const navigate = (id) => {
        const target = id;
        const route = TENANT_ROUTE_MAP[target];
        if (route) {
            router.visit(route);
        }
    };
    const renderPage = () => {
        switch (page) {
            case 'my-unit':
                return (
                    <MyUnitPage
                        onNavigate={navigate}
                        tenant={tenant}
                        invoices={invoices}
                        maintenance={maintenance}
                        isMovedOut={isMovedOut}
                        availableUnits={availableUnits}
                    />
                );
            case 'lease':
                return (
                    <LeasePage
                        tenant={tenant}
                        invoices={invoices}
                        leases={leases}
                    />
                );
            case 'billing':
                return (
                    <TenantBillingPage onPayRent={() => navigate('pay-rent')} />
                );
            case 'pay-rent':
                return <PayRentPage />;
            case 'maintenance':
                return <TenantMaintenancePage maintenance={maintenance} />;
            case 'messages':
                return <MessagesPage messages={messages} />;
            case 'notifications':
                return (
                    <TenantNotificationsPage
                        notifications={notifications}
                        archivedNotifications={archivedNotifications}
                    />
                );
        }
    };
    return (
        <TenantLayout
            activeId={page}
            onNavigate={navigate}
            user={{
                name: userName,
                initials,
                unit:
                    tenant?.units?.length > 0
                        ? tenant.units.map((u) => u.number).join(', ')
                        : (tenant?.unit ?? null),
                tenant,
            }}
            messageCount={messageCount}
            pageTitle={PAGE_TITLES[page]}
            notifCount={unreadCount}
            notifications={notifications}
            archivedNotifications={archivedNotifications}
            onNotifClick={() => navigate('notifications')}
            isMovedOut={isMovedOut}
        >
            {renderPage()}
        </TenantLayout>
    );
}
