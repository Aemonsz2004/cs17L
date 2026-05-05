// src/App.jsx
import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import MainLayout from '../components/MainLayout';
import BillingPage from './admin/BillingPage';
import DashboardPage from './admin/DashboardPage';
import MaintenancePage from './admin/MaintenancePage';
import MessagesPage from './admin/MessagesPage';
import NotificationsPage from './admin/NotificationsPage';
import ApplicationsPage from './admin/ApplicationsPage';
import ReportsPage from './admin/ReportsPage';
import TenantsPage from './admin/TenantsPage';
import UnitsPage from './admin/UnitsPage';
// ── Nav definition ────────────────────────────────────────────────────────────
const BASE_NAV_SECTIONS = [
    {
        section: 'Main',
        items: [
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'tenants', label: 'Tenants' },
            { id: 'units', label: 'Units' },
        ],
    },
    {
        section: 'Operations',
        items: [
            { id: 'billing', label: 'Billing', badge: 0 },
            { id: 'applications', label: 'Applications', badge: 0 },
            { id: 'maintenance', label: 'Maintenance', badge: 0 },
            { id: 'messages', label: 'Messages', badge: 0 },
            { id: 'notifications', label: 'Notifications', badge: 0 },
            { id: 'reports', label: 'Reports' },
        ],
    },
];
const PAGE_TITLES = {
    dashboard: 'Dashboard',
    tenants: 'Tenants',
    units: 'Units',
    billing: 'Billing & Payments',
    applications: 'Rental Applications',
    maintenance: 'Maintenance',
    messages: 'Tenant Messages',
    notifications: 'Notifications',
    reports: 'Reports & Analytics',
};
const PAGE_ROUTES = {
    dashboard: '/admin/dashboard',
    tenants: '/admin/tenants',
    units: '/admin/units',
    billing: '/admin/billing',
    applications: '/admin/applications',
    maintenance: '/admin/maintenance',
    messages: '/admin/messages',
    notifications: '/admin/notifications',
    reports: '/admin/reports',
};
const ADMIN_USER = {
    name: 'DM Rashid F.',
    role: 'Administrator',
    initials: 'DM',
};
// ── Root App ──────────────────────────────────────────────────────────────────
export default function App({ initialPage = 'dashboard' }) {
    const page = initialPage;
    const {
        notifications: propNotifications,
        messages: propMessages,
        applications: propApplications,
        unread_count,
    } =
        usePage().props;
    const [notifications, setNotifications] = useState(propNotifications ?? []);
    const unreadCount = propNotifications
        ? notifications.filter((n) => n.unread).length
        : unread_count ?? 0;
    const unreadMessageCount = (propMessages ?? []).filter(
        (message) => message.from === 'tenant' && !message.read,
    ).length;
    const navSections = BASE_NAV_SECTIONS.map((section) => {
        if (section.section !== 'Operations') {
            return section;
        }
        return {
            ...section,
            items: section.items.map((item) =>
                item.id === 'notifications'
                    ? { ...item, badge: unreadCount }
                    : item.id === 'messages'
                      ? { ...item, badge: unreadMessageCount }
                      : item,
            ),
        };
    });
    const navigate = (target) => {
        router.visit(PAGE_ROUTES[target]);
    };
    const renderPage = () => {
        switch (page) {
            case 'dashboard':
                return <DashboardPage onNavigate={(next) => navigate(next)} />;
            case 'tenants':
                return <TenantsPage openAddSignal={0} />;
            case 'units':
                return <UnitsPage openAddSignal={0} />;
            case 'billing':
                return <BillingPage openAddSignal={0} />;
            case 'applications':
                return <ApplicationsPage applications={propApplications ?? []} />;
            case 'maintenance':
                return <MaintenancePage openAddSignal={0} />;
            case 'messages':
                return <MessagesPage messages={propMessages} />;
            case 'notifications':
                return (
                    <NotificationsPage
                        notifications={notifications}
                        onChangeNotifications={setNotifications}
                        onNavigate={(next) => navigate(next)}
                    />
                );
            case 'reports':
                return <ReportsPage />;
        }
    };
    return (
        <MainLayout
            navSections={navSections}
            activeId={page}
            onNavigate={(id) => navigate(id)}
            user={ADMIN_USER}
            pageTitle={PAGE_TITLES[page]}
            notifCount={unreadCount}
            onNotifClick={() => navigate('notifications')}
        >
            {renderPage()}
        </MainLayout>
    );
}
