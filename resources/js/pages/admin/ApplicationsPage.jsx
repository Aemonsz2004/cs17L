import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import Modal from '../../components/Modal';

const statusStyles = {
    pending_review: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    lease_sent: 'bg-blue-50 text-blue-700 border-blue-200',
    payment_pending: 'bg-orange-50 text-orange-700 border-orange-200',
    payment_paid: 'bg-teal-50 text-teal-700 border-teal-200',
    converted: 'bg-gray-100 text-gray-700 border-gray-300',
};

const statusLabel = {
    pending_review: 'Pending review',
    approved: 'Approved (Reserved)',
    rejected: 'Rejected',
    lease_sent: 'Lease sent',
    payment_pending: 'Payment pending',
    payment_paid: 'Payment paid',
    converted: 'Converted',
};

export default function ApplicationsPage({ applications = [], archivedApplications = [] }) {
    const flash = usePage().props?.flash ?? {};
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [reviewOpen, setReviewOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [leaseTerms, setLeaseTerms] = useState('');
    const [leaseAttachment, setLeaseAttachment] = useState(null);
    const [viewMode, setViewMode] = useState('active');

    const visibleApplications = viewMode === 'active'
        ? applications
        : archivedApplications;

    const counters = useMemo(() => {
        const pending = visibleApplications.filter((app) => app.status === 'pending_review').length;
        const leaseWaiting = visibleApplications.filter((app) => app.status === 'approved').length;
        const deposits = visibleApplications.filter((app) => app.status === 'payment_paid').length;

        return { pending, leaseWaiting, deposits };
    }, [visibleApplications]);

    const approve = (applicationId) => {
        router.patch(`/admin/applications/${applicationId}/approve`, {}, { preserveScroll: true });
    };

    const reject = (applicationId, reason) => {
        const trimmedReason = reason.trim();
        if (!trimmedReason) {
            window.alert('Rejection reason is required.');
            return;
        }

        router.patch(`/admin/applications/${applicationId}/reject`, {
            rejection_reason: trimmedReason,
        }, { preserveScroll: true });
    };

    const sendLease = (applicationId, terms, attachment) => {
        const trimmedTerms = terms.trim();
        if (trimmedTerms.length < 20) {
            window.alert('Lease terms must be at least 20 characters.');
            return;
        }

        router.patch(`/admin/applications/${applicationId}/send-lease`, {
            lease_terms: trimmedTerms,
            lease_attachment: attachment,
        }, {
            preserveScroll: true,
            forceFormData: true,
        });
    };

    const confirmDeposit = (applicationId) => {
        router.patch(`/admin/applications/${applicationId}/confirm-deposit`, {}, { preserveScroll: true });
    };

    const convertTenant = (applicationId, payload) => {
        router.post(`/admin/applications/${applicationId}/convert-tenant`, {
            start_date: payload.start_date,
            end_date: payload.end_date,
            payment_method: payload.payment_method,
        }, { preserveScroll: true });
    };

    const archiveApplication = (applicationId) => {
        if (!window.confirm('Archive this application?')) {
            return;
        }
        router.delete(`/admin/applications/${applicationId}`);
    };

    const restoreApplication = (applicationId) => {
        if (!window.confirm('Restore this application?')) {
            return;
        }
        router.post(`/admin/applications/${applicationId}/restore`);
    };

    const openReview = (application) => {
        if (viewMode !== 'active') {
            return;
        }
        setSelectedApplication(application);
        setRejectionReason(application.rejection_reason ?? '');
        setLeaseTerms(application.lease_terms ?? '');
        setLeaseAttachment(null);
        setReviewOpen(true);
    };

    useEffect(() => {
        const flag = localStorage.getItem('admin-applications-autofocus');
        if (flag !== 'pending_review') {
            return;
        }

        localStorage.removeItem('admin-applications-autofocus');

        const target = applications.find((app) => app.status === 'pending_review') ?? applications[0];
        if (target) {
            openReview(target);
        }
    }, [applications]);
    useEffect(() => {
        if (viewMode !== 'active') {
            setReviewOpen(false);
            setSelectedApplication(null);
        }
    }, [viewMode]);

    const closeReview = () => {
        setReviewOpen(false);
        setSelectedApplication(null);
    };

    return (
        <>
            <Head title="Rental Applications" />

            <div className="min-h-screen bg-[#f3efe7] px-6 py-8 text-[#15233d]">
                <div className="mx-auto max-w-6xl space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#1d7b6e]">
                                Admin Queue
                            </p>
                            <h1 className="text-3xl font-black">Rental Applications</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex gap-0.5 rounded-lg bg-white/80 p-0.5">
                                {['active', 'archived'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setViewMode(tab)}
                                        className={[
                                            'rounded-md px-3 py-1 text-xs font-medium capitalize transition-all',
                                            viewMode === tab
                                                ? 'bg-[#15233d] text-white shadow-sm'
                                                : 'text-[#42506b] hover:bg-white',
                                        ].join(' ')}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                            <Link href="/admin/dashboard" className="rounded-lg border border-[#15233d]/20 px-4 py-2 text-sm font-medium hover:bg-white">
                                Back to Dashboard
                            </Link>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-xl border border-[#15233d]/10 bg-white p-4 shadow-sm">
                            <p className="text-sm text-[#42506b]">Pending Review</p>
                            <p className="text-2xl font-black">{counters.pending}</p>
                        </div>
                        <div className="rounded-xl border border-[#15233d]/10 bg-white p-4 shadow-sm">
                            <p className="text-sm text-[#42506b]">Awaiting Lease Send</p>
                            <p className="text-2xl font-black">{counters.leaseWaiting}</p>
                        </div>
                        <div className="rounded-xl border border-[#15233d]/10 bg-white p-4 shadow-sm">
                            <p className="text-sm text-[#42506b]">Auto-Converted Ready</p>
                            <p className="text-2xl font-black">{counters.deposits}</p>
                        </div>
                    </div>

                    {flash.success && (
                        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
                            {flash.success}
                        </div>
                    )}

                    {flash.error && (
                        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                            {flash.error}
                        </div>
                    )}

                    {flash.tenant_credentials && (
                        <div className="rounded-lg border border-blue-300 bg-blue-50 p-3 text-sm text-blue-800">
                            Tenant profile linked: {flash.tenant_credentials.email}
                            {flash.tenant_credentials.temp_password ? ` / ${flash.tenant_credentials.temp_password}` : ''}
                        </div>
                    )}

                    <div className="space-y-4">
                        {visibleApplications.map((application) => (
                            <article key={application.id} className="rounded-2xl border border-[#15233d]/10 bg-white p-5 shadow-sm">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h2 className="text-lg font-bold">{application.full_name}</h2>
                                        <p className="text-sm text-[#42506b]">
                                            {application.user?.email} · Unit {application.unit?.number} ({application.unit?.floor}, {application.unit?.type})
                                        </p>
                                        {application.unit?.status === 'reserved' && (
                                            <p className="text-xs font-semibold tracking-wide text-[#0f766e] uppercase">
                                                Unit RESERVED until {application.unit?.reserved_until ? new Date(application.unit.reserved_until).toLocaleString() : 'N/A'}
                                            </p>
                                        )}
                                        <p className="text-sm text-[#42506b]">
                                            Occupation: {application.occupation} · Income: P{Number(application.monthly_income).toLocaleString()}
                                        </p>
                                        <p className="text-sm text-[#42506b]">Emergency Contact: {application.emergency_contact}</p>
                                    </div>
                                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[application.status] ?? 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                                        {statusLabel[application.status] ?? application.status}
                                    </span>
                                </div>

                                <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                                    <a href={`/storage/${application.government_id_path}`} target="_blank" rel="noreferrer" className="rounded-lg border border-[#15233d]/15 px-3 py-2 font-medium hover:bg-[#f8fafc]">
                                        View Government ID
                                    </a>
                                    <a href={`/storage/${application.income_proof_path}`} target="_blank" rel="noreferrer" className="rounded-lg border border-[#15233d]/15 px-3 py-2 font-medium hover:bg-[#f8fafc]">
                                        View Proof of Income
                                    </a>
                                </div>

                                {application.rejection_reason && (
                                    <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                                        Rejection reason: {application.rejection_reason}
                                    </p>
                                )}

                                {application.lease_terms && (
                                    <div className="mt-3 rounded-lg bg-[#f8fafc] p-3 text-sm text-[#334155]">
                                        <p className="mb-1 font-semibold text-[#15233d]">Lease terms sent</p>
                                        <p className="line-clamp-4 whitespace-pre-wrap">{application.lease_terms}</p>
                                    </div>
                                )}

                                {application.latest_payment?.provider_reference && (
                                    <p className="mt-3 text-sm text-[#42506b]">
                                        Deposit via {application.latest_payment?.payment_method ?? 'N/A'} · Ref: {application.latest_payment.provider_reference}
                                    </p>
                                )}

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {viewMode === 'active' ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => openReview(application)}
                                                className="rounded-lg bg-[#15233d] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0f1a2d]"
                                            >
                                                Review Details
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => archiveApplication(application.id)}
                                                className="rounded-lg border border-[#ef4444]/40 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                                            >
                                                Archive
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => restoreApplication(application.id)}
                                            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                                        >
                                            Restore
                                        </button>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </div>

            {selectedApplication && (
                <Modal
                    open={reviewOpen}
                    onClose={closeReview}
                    title={`Application Review · ${selectedApplication.full_name}`}
                    size="xl"
                    footer={
                        <div className="flex w-full items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={closeReview}
                                className="rounded-lg border border-[#15233d]/20 px-4 py-2 text-sm font-medium hover:bg-[#f5f0e8]"
                            >
                                Close
                            </button>
                        </div>
                    }
                >
                    <div className="space-y-4 text-sm text-[#334155]">
                        <div className="grid gap-3 rounded-xl border border-[#15233d]/10 bg-[#f8fafc] p-4 md:grid-cols-2">
                            <p><span className="font-semibold text-[#15233d]">Applicant:</span> {selectedApplication.full_name}</p>
                            <p><span className="font-semibold text-[#15233d]">Email:</span> {selectedApplication.user?.email}</p>
                            <p><span className="font-semibold text-[#15233d]">Occupation:</span> {selectedApplication.occupation}</p>
                            <p><span className="font-semibold text-[#15233d]">Monthly Income:</span> P{Number(selectedApplication.monthly_income).toLocaleString()}</p>
                            <p><span className="font-semibold text-[#15233d]">Emergency Contact:</span> {selectedApplication.emergency_contact}</p>
                            <p><span className="font-semibold text-[#15233d]">Unit:</span> {selectedApplication.unit?.number} ({selectedApplication.unit?.floor}, {selectedApplication.unit?.type})</p>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            <a href={`/storage/${selectedApplication.government_id_path}`} target="_blank" rel="noreferrer" className="rounded-lg border border-[#15233d]/15 px-3 py-2 font-medium hover:bg-[#f8fafc]">
                                View Government ID
                            </a>
                            <a href={`/storage/${selectedApplication.income_proof_path}`} target="_blank" rel="noreferrer" className="rounded-lg border border-[#15233d]/15 px-3 py-2 font-medium hover:bg-[#f8fafc]">
                                View Proof of Income
                            </a>
                        </div>

                        <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[selectedApplication.status] ?? 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                            {statusLabel[selectedApplication.status] ?? selectedApplication.status}
                        </div>

                        {selectedApplication.status === 'pending_review' && (
                            <div className="space-y-3 rounded-xl border border-[#15233d]/10 p-4">
                                <p className="font-semibold text-[#15233d]">Decision</p>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(event) => setRejectionReason(event.target.value)}
                                    rows={3}
                                    placeholder="Optional while approving, required when rejecting."
                                    className="w-full rounded-lg border border-[#15233d]/20 px-3 py-2 outline-none focus:ring-2 focus:ring-[#1d7b6e]/30"
                                />
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => approve(selectedApplication.id)}
                                        className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                                    >
                                        Accept Application
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => reject(selectedApplication.id, rejectionReason)}
                                        className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                                    >
                                        Reject Application
                                    </button>
                                </div>
                            </div>
                        )}

                        {selectedApplication.status === 'approved' && (
                            <div className="space-y-3 rounded-xl border border-[#15233d]/10 p-4">
                                <p className="font-semibold text-[#15233d]">Send Lease Terms</p>
                                <textarea
                                    value={leaseTerms}
                                    onChange={(event) => setLeaseTerms(event.target.value)}
                                    rows={5}
                                    placeholder="Enter complete lease terms for the applicant..."
                                    className="w-full rounded-lg border border-[#15233d]/20 px-3 py-2 outline-none focus:ring-2 focus:ring-[#1d7b6e]/30"
                                />

                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-[#15233d]">Lease PDF Attachment (optional)</label>
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={(event) => {
                                            const file = event.target.files?.[0] ?? null;
                                            setLeaseAttachment(file);
                                        }}
                                        className="block w-full rounded-lg border border-[#15233d]/20 bg-white px-3 py-2 text-sm"
                                    />
                                    <p className="text-xs text-[#64748b]">Upload a PDF lease file if you want applicants to open/download it.</p>
                                    {selectedApplication.lease_attachment_path && !leaseAttachment && (
                                        <a
                                            href={`/storage/${selectedApplication.lease_attachment_path}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex rounded-lg border border-[#15233d]/20 px-3 py-2 text-xs font-medium hover:bg-[#f8fafc]"
                                        >
                                            View current attached PDF
                                        </a>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => sendLease(selectedApplication.id, leaseTerms, leaseAttachment)}
                                    className="rounded-lg bg-[#15233d] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0f1a2d]"
                                >
                                    Send Lease
                                </button>
                            </div>
                        )}

                        {selectedApplication.status === 'payment_pending' && (
                            <div className="space-y-3 rounded-xl border border-[#15233d]/10 p-4">
                                <p><span className="font-semibold text-[#15233d]">Deposit Method:</span> {selectedApplication.latest_payment?.payment_method ?? 'N/A'}</p>
                                <p><span className="font-semibold text-[#15233d]">Reference:</span> {selectedApplication.latest_payment?.provider_reference ?? 'N/A'}</p>
                                <p>
                                    <span className="font-semibold text-[#15233d]">Webhook Status:</span>{' '}
                                    {selectedApplication.payment_verified_at ? 'payment_paid' : 'awaiting webhook'}
                                </p>

                                {selectedApplication.latest_payment?.checkout_url && !selectedApplication.payment_verified_at && (
                                    <a
                                        href={selectedApplication.latest_payment.checkout_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex rounded-lg border border-[#15233d]/20 px-3 py-2 text-sm font-medium hover:bg-[#f8fafc]"
                                    >
                                        Open PayMongo Checkout
                                    </a>
                                )}

                                {selectedApplication.payment_verified_at ? (
                                    <button
                                        type="button"
                                        onClick={() => confirmDeposit(selectedApplication.id)}
                                        className="rounded-lg bg-[#1d7b6e] px-3 py-2 text-sm font-semibold text-white hover:bg-[#166459]"
                                    >
                                        Run Admin Override Conversion
                                    </button>
                                ) : (
                                    <p className="text-xs text-amber-700">Auto-conversion runs after webhook verification. Override is enabled only if stuck.</p>
                                )}
                            </div>
                        )}

                        {selectedApplication.status === 'payment_paid' && (
                            <div className="space-y-3 rounded-xl border border-[#15233d]/10 p-4">
                                <p className="font-semibold text-[#15233d]">Auto-conversion pending</p>
                                <p className="text-xs text-[#42506b]">System will auto-convert to tenant. Use manual convert only as override.</p>
                                <button
                                    type="button"
                                    onClick={() => convertTenant(selectedApplication.id, {})}
                                    className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                                >
                                    Manual Convert Override
                                </button>
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </>
    );
}
