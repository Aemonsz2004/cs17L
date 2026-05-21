import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import ConfirmModal from '../../components/ConfirmModal';
import Modal from '../../components/Modal';

const statusStyles = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    paid: 'bg-blue-50 text-blue-700 border-blue-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    converted: 'bg-gray-100 text-gray-700 border-gray-300',
};

const statusLabel = {
    pending: 'Pending',
    approved: 'Approved',
    paid: 'Paid',
    rejected: 'Rejected',
    converted: 'Converted',
};

export default function ApplicationsPage({ applications = [], archivedApplications = [], units = [] }) {
    const flash = usePage().props?.flash ?? {};
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [reviewOpen, setReviewOpen] = useState(false);
    const [viewMode, setViewMode] = useState('active');
    const [rejectionReason, setRejectionReason] = useState('');
    const [moveInOpen, setMoveInOpen] = useState(false);

    const visibleApplications = viewMode === 'active' ? applications : archivedApplications;

    const counters = useMemo(() => {
        const pending = visibleApplications.filter((app) => app.status === 'pending').length;
        const approved = visibleApplications.filter((app) => app.status === 'approved').length;
        const paid = visibleApplications.filter((app) => app.status === 'paid').length;
        return { pending, approved, paid };
    }, [visibleApplications]);

    const openReview = (application) => {
        if (viewMode !== 'active') return;
        setSelectedApplication(application);
        setRejectionReason(application.rejection_reason ?? '');
        setReviewOpen(true);
    };

    const closeReview = () => {
        setReviewOpen(false);
        setSelectedApplication(null);
    };

    const [approveErrors, setApproveErrors] = useState({});

    const scrollToFirstError = (errors) => {
        if (!errors) return;
        const keys = Object.keys(errors);
        if (keys.length === 0) return;
        const firstKey = keys[0];
        const el = document.getElementById(firstKey);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus({ preventScroll: true });
        }
    };

    const approve = (applicationId, unitId) => {
        setApproveErrors({});
        router.post(`/admin/applications/${applicationId}/approve`, {
            unit_id: unitId,
        }, {
            preserveScroll: true,
            onSuccess: closeReview,
            onError: (errors) => {
                setApproveErrors(errors || {});
                scrollToFirstError(errors);
            },
        });
    };

    const reject = (applicationId, reason) => {
        setApproveErrors({});
        router.post(`/admin/applications/${applicationId}/reject`, {
            rejection_reason: reason.trim(),
        }, { preserveScroll: true, onSuccess: closeReview, onError: (errors) => {
            setApproveErrors(errors || {});
            scrollToFirstError(errors);
        } });
    };

    const confirmPayment = (applicationId) => {
        setApproveErrors({});
        router.post(`/admin/applications/${applicationId}/confirm-payment`, {}, {
            preserveScroll: true,
            onSuccess: closeReview,
            onError: (errors) => {
                setApproveErrors(errors || {});
                scrollToFirstError(errors);
            },
        });
    };

    const openMoveIn = (application) => {
        if (!application) return;
        setSelectedApplication(application);
        setMoveInOpen(true);
    };

    const confirmMoveIn = () => {
        if (!selectedApplication) return;
        setApproveErrors({});
        router.post(`/admin/applications/${selectedApplication.id}/confirm-move-in`, {
            lease_duration: selectedApplication.lease_duration ?? 6,
        }, {
            preserveScroll: true,
            onSuccess: () => setMoveInOpen(false),
            onError: (errors) => {
                setApproveErrors(errors || {});
                scrollToFirstError(errors);
            },
        });
    };

    const [confirmAction, setConfirmAction] = useState(null);

    const archiveApplication = (applicationId) => {
        setConfirmAction({ type: 'archive', applicationId });
    };

    const restoreApplication = (applicationId) => {
        setConfirmAction({ type: 'restore', applicationId });
    };

    const confirmArchive = () => {
        if (!confirmAction) return;
        setConfirmAction(null);
        router.delete(`/admin/applications/${confirmAction.applicationId}`);
    };

    const confirmRestore = () => {
        if (!confirmAction) return;
        setConfirmAction(null);
        router.post(`/admin/applications/${confirmAction.applicationId}/restore`);
    };

    useEffect(() => {
        if (viewMode !== 'active') {
            setReviewOpen(false);
            setSelectedApplication(null);
        }
    }, [viewMode]);

    return (
        <>
            <Head title="Rental Applications" />
            <div className="min-h-screen bg-[#f3efe7] px-6 py-8 text-[#15233d]">
                <div className="space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#1d7b6e]">Admin Queue</p>
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
                                            viewMode === tab ? 'bg-[#15233d] text-white shadow-sm' : 'text-[#42506b] hover:bg-white',
                                        ].join(' ')}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                            {/* <Link href="/admin/dashboard" className="rounded-lg border border-[#15233d]/20 px-4 py-2 text-sm font-medium hover:bg-white">
                                Back to Dashboard
                            </Link> */}
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-xl bg-white p-5 shadow-sm transition-colors hover:bg-gray-50">
                            <p className="text-sm font-semibold text-[#42506b]">Pending Review</p>
                            <p className="mt-1 text-3xl font-black text-[#15233d]">{counters.pending}</p>
                        </div>
                        <div className="rounded-xl bg-white p-5 shadow-sm transition-colors hover:bg-gray-50">
                            <p className="text-sm font-semibold text-[#42506b]">Approved</p>
                            <p className="mt-1 text-3xl font-black text-[#15233d]">{counters.approved}</p>
                        </div>
                        <div className="rounded-xl bg-white p-5 shadow-sm transition-colors hover:bg-gray-50">
                            <p className="text-sm font-semibold text-[#42506b]">Paid (Awaiting Move-In)</p>
                            <p className="mt-1 text-3xl font-black text-[#15233d]">{counters.paid}</p>
                        </div>
                    </div>

                    {flash.success && (
                        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">{flash.success}</div>
                    )}
                    {flash.error && (
                        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">{flash.error}</div>
                    )}

                    <div className="space-y-4">
                        {visibleApplications.length === 0 && (
                            <p className="text-center text-sm text-[#42506b]">No applications found.</p>
                        )}
                        {visibleApplications.map((application) => (
                            <article key={application.id} className="rounded-2xl border border-[#15233d]/10 bg-white p-5 shadow-sm">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h2 className="text-lg font-bold">{application.full_name}</h2>
                                        <p className="text-sm text-[#42506b]">
                                            {application.user?.email} · Unit {application.unit?.number} ({application.unit?.floor}, {application.unit?.type})
                                        </p>
                                        <p className="text-sm text-[#42506b]">
                                            Occupation: {application.occupation} · Income: P{Number(application.monthly_income).toLocaleString()}
                                        </p>
                                        <p className="text-sm text-[#42506b]">Emergency Contact: {application.emergency_contact}</p>
                                        {application.preferred_move_in && (
                                            <p className="text-sm text-[#42506b]">Preferred Move-In: {new Date(application.preferred_move_in).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' })}</p>
                                        )}
                                    </div>
                                    <span className={['rounded-full border px-3 py-1 text-xs font-semibold', statusStyles[application.status] ?? 'bg-gray-100 text-gray-700 border-gray-300'].join(' ')}>
                                        {statusLabel[application.status] ?? application.status}
                                    </span>
                                </div>

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
                <Modal open={reviewOpen} onClose={closeReview} title={'Application Review · ' + selectedApplication.full_name} size="lg"
                    footer={
                        <div className="flex w-full items-center justify-end gap-2">
                            <button type="button" onClick={closeReview} className="rounded-lg border border-[#15233d]/20 px-4 py-2 text-sm font-medium hover:bg-[#f5f0e8]">Close</button>
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
                            {selectedApplication.preferred_move_in && (
                                <p><span className="font-semibold text-[#15233d]">Preferred Move-In:</span> {new Date(selectedApplication.preferred_move_in).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' })}</p>
                            )}
                            {selectedApplication.lease_duration && (
                                <p><span className="font-semibold text-[#15233d]">Lease Duration:</span> {selectedApplication.lease_duration} months</p>
                            )}
                            {selectedApplication.applicant_notes && (
                                <div className="md:col-span-2">
                                    <p><span className="font-semibold text-[#15233d]">Notes:</span></p>
                                    <p className="mt-1 whitespace-pre-wrap text-[#42506b]">{selectedApplication.applicant_notes}</p>
                                </div>
                            )}
                            {(selectedApplication.government_id_path || selectedApplication.income_proof_path) && (
                                <div className="md:col-span-2">
                                    <p className="font-semibold text-[#15233d] mb-2">Attachments</p>
                                    <div className="flex flex-wrap gap-3">
                                        {selectedApplication.government_id_path && (
                                            <a
                                                href={'/storage/' + selectedApplication.government_id_path}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#15233d]/20 px-3 py-2 text-xs font-medium text-[#1d7b6e] hover:bg-[#f5f0e8]"
                                            >
                                                Government ID
                                            </a>
                                        )}
                                        {selectedApplication.income_proof_path && (
                                            <a
                                                href={'/storage/' + selectedApplication.income_proof_path}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#15233d]/20 px-3 py-2 text-xs font-medium text-[#1d7b6e] hover:bg-[#f5f0e8]"
                                            >
                                                Income Proof
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {selectedApplication.status === 'pending' && (
                            <div className="space-y-3 rounded-xl border border-[#15233d]/10 p-4">
                                <p className="font-semibold text-[#15233d]">Decision</p>
                                {approveErrors.rejection_reason && (
                                    <p className="text-xs text-red-600">{approveErrors.rejection_reason}</p>
                                )}
                                {approveErrors.unit_id && (
                                    <p className="text-xs text-red-600">{approveErrors.unit_id}</p>
                                )}
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={3}
                                    placeholder="Rejection reason (required when rejecting)"
                                    className="w-full rounded-lg border border-[#15233d]/20 px-3 py-2 outline-none focus:ring-2 focus:ring-[#1d7b6e]/30"
                                />
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => approve(selectedApplication.id, selectedApplication.unit_id)}
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
                                <p className="font-semibold text-[#15233d]">Payment Confirmation</p>
                                <p className="text-sm text-[#42506b]">Mark reservation/security fee as paid. The lease will not start until move-in is confirmed.</p>
                                <button
                                    type="button"
                                    onClick={() => confirmPayment(selectedApplication.id)}
                                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                >
                                    Mark as Paid
                                </button>
                            </div>
                        )}

                        {selectedApplication.status === 'paid' && (
                            <div className="space-y-3 rounded-xl border border-[#15233d]/10 p-4">
                                <p className="font-semibold text-[#15233d]">Move-In Confirmation</p>
                                <p className="text-sm text-[#42506b]">Confirm move-in to create tenant account, activate lease, and set unit as occupied.</p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        closeReview();
                                        openMoveIn(selectedApplication);
                                    }}
                                    className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                                >
                                    Confirm Move-In
                                </button>
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            <Modal
                open={moveInOpen}
                onClose={() => setMoveInOpen(false)}
                title="Confirm Move-In"
                size="sm"
                footer={
                    <>
                        <button type="button" onClick={() => setMoveInOpen(false)} className="rounded-lg border border-[#15233d]/20 px-4 py-2 text-sm font-medium hover:bg-[#f5f0e8]">Cancel</button>
                        <button type="button" onClick={confirmMoveIn} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Confirm Move-In</button>
                    </>
                }
            >
                <div className="space-y-4">
                    {approveErrors.lease_duration && (
                        <p className="text-xs text-red-600">{approveErrors.lease_duration}</p>
                    )}
                    <div>
                        <p className="text-sm font-semibold text-[#15233d]">Lease Duration</p>
                        <p className="mt-1 text-sm text-[#42506b]">
                            {selectedApplication?.lease_duration ?? 6} months
                        </p>
                    </div>
                    <p className="text-xs text-[#42506b]">
                        Lease end date will be calculated from today + selected duration.
                    </p>
                </div>
            </Modal>

            {confirmAction && (
                <ConfirmModal
                    open
                    onClose={() => setConfirmAction(null)}
                    onConfirm={() => {
                        if (confirmAction.type === 'archive') confirmArchive();
                        if (confirmAction.type === 'restore') confirmRestore();
                    }}
                    title={confirmAction.type === 'archive' ? 'Archive Application' : 'Restore Application'}
                    message={confirmAction.type === 'archive' ? 'Archive this application?' : 'Restore this application?'}
                    variant={confirmAction.type === 'archive' ? 'danger' : 'primary'}
                    confirmLabel={confirmAction.type === 'archive' ? 'Archive' : 'Restore'}
                />
            )}
        </>
    );
}
