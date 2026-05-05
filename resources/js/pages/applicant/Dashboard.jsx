import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Modal from '../../components/Modal';

const STATUS_LABELS = {
    pending_review: 'Pending admin review',
    approved: 'Approved - unit reserved for you',
    rejected: 'Rejected',
    lease_sent: 'Lease sent - waiting for your acknowledgment',
    payment_pending: 'Payment pending - complete PayMongo checkout',
    payment_paid: 'Payment paid - system is auto-converting your tenant profile',
    converted: 'Converted to tenant',
};

export default function Dashboard({ application }) {
    const flash = usePage().props?.flash ?? {};
    const [leaseModalOpen, setLeaseModalOpen] = useState(false);
    const [retryingCheckout, setRetryingCheckout] = useState(false);

    const depositForm = useForm({
        deposit_method: 'GCash',
    });

    const latestPayment = application?.latest_payment ?? null;
    const webhookVerified = Boolean(application?.payment_verified_at);
    const latestPaymentExpired = Boolean(
        latestPayment?.expires_at && new Date(latestPayment.expires_at).getTime() <= Date.now(),
    );
    const latestPaymentBlocked =
        !webhookVerified
        && (
            latestPayment?.status === 'failed'
            || latestPayment?.status === 'expired'
            || latestPaymentExpired
        );
    const isBankTransferPending =
        !webhookVerified && latestPayment?.payment_method === 'Bank Transfer';
    const canStartCheckout = application?.status === 'payment_pending' && (!latestPayment || latestPaymentBlocked);

    const acknowledgeLease = () => {
        if (!application) return;
        router.post(`/apply/${application.id}/acknowledge-lease`);
    };

    const submitDeposit = (event) => {
        event.preventDefault();
        if (!application) return;
        depositForm.post(`/apply/${application.id}/submit-deposit`);
    };

    const retryDeposit = () => {
        if (!application) return;

        setRetryingCheckout(true);

        router.post(
            `/apply/${application.id}/submit-deposit`,
            {
                deposit_method: 'GCash',
                retry: true,
            },
            {
                preserveScroll: true,
                onFinish: () => setRetryingCheckout(false),
            },
        );
    };

    return (
        <>
            <Head title="Applicant Dashboard" />

            <div className="min-h-screen bg-[#f3efe7] px-4 py-8 text-[#15233d]">
                <div className="mx-auto w-full max-w-4xl space-y-5">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-black">Applicant Dashboard</h1>
                        <div className="flex gap-2">
                            <Link href="/units" className="rounded-lg border border-[#15233d]/20 px-4 py-2 text-sm font-medium hover:bg-white">
                                Browse Units
                            </Link>
                            {!application && (
                                <Link href="/apply/form" className="rounded-lg bg-[#15233d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f1a2d]">
                                    Start Application
                                </Link>
                            )}
                        </div>
                    </div>

                    {flash.success && (
                        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                            {flash.success}
                        </div>
                    )}

                    {flash.error && (
                        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {flash.error}
                        </div>
                    )}

                    {!application ? (
                        <div className="rounded-2xl border border-[#15233d]/10 bg-white p-6 shadow-sm">
                            <p className="text-sm text-[#42506b]">
                                You have no applications yet. Start by choosing a unit and submitting your documents.
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-[#15233d]/10 bg-white p-6 shadow-sm">
                            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#1d7b6e]">
                                Current Status
                            </p>
                            <h2 className="mt-1 text-2xl font-bold">
                                {STATUS_LABELS[application.status] ?? application.status}
                            </h2>
                            <p className="mt-2 text-sm text-[#42506b]">
                                Unit {application.unit?.number} · {application.unit?.floor} · {application.unit?.type}
                            </p>

                            {application.rejection_reason && (
                                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    Rejection reason: {application.rejection_reason}
                                </div>
                            )}

                            {application.status === 'rejected' && (
                                <div className="mt-5">
                                    <Link href="/apply/form" className="rounded-lg bg-[#15233d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f1a2d]">
                                        Re-apply now
                                    </Link>
                                </div>
                            )}

                            {application.status === 'lease_sent' && (
                                <div className="mt-5 space-y-3">
                                    <button
                                        type="button"
                                        onClick={() => setLeaseModalOpen(true)}
                                        className="w-full rounded-lg border border-[#15233d]/10 bg-[#f8fafc] p-4 text-left text-sm text-[#334155] hover:bg-white"
                                    >
                                        <p className="mb-2 font-semibold text-[#15233d]">Lease Terms (Click to view full)</p>
                                        <p className="line-clamp-4 whitespace-pre-wrap">{application.lease_terms}</p>
                                    </button>

                                    {application.lease_attachment_path && (
                                        <a
                                            href={`/storage/${application.lease_attachment_path}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex rounded-lg border border-[#15233d]/20 px-4 py-2 text-sm font-medium hover:bg-white"
                                        >
                                            Open Lease PDF Attachment
                                        </a>
                                    )}

                                    <button
                                        type="button"
                                        onClick={acknowledgeLease}
                                        className="rounded-lg bg-[#15233d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f1a2d]"
                                    >
                                        I acknowledge these lease terms
                                    </button>
                                </div>
                            )}

                            {canStartCheckout && (
                                <form className="mt-5 grid gap-3 md:grid-cols-3" onSubmit={submitDeposit}>
                                    <div>
                                        <label className="block text-sm font-medium">Deposit Method</label>
                                        <select
                                            value={depositForm.data.deposit_method}
                                            onChange={(event) =>
                                                depositForm.setData('deposit_method', event.target.value)
                                            }
                                            disabled
                                            className="mt-1 w-full rounded-lg border border-[#15233d]/20 bg-[#f1f5f9] px-3 py-2 text-[#334155]"
                                        >
                                            <option value="GCash">GCash</option>
                                        </select>
                                        <p className="mt-1 text-xs text-[#64748b]">Temporary mode: GCash only.</p>
                                    </div>

                                    <div className="md:col-span-2 rounded-lg border border-[#15233d]/10 bg-[#f8fafc] px-3 py-2 text-xs text-[#42506b]">
                                        {latestPaymentBlocked
                                            ? 'Your previous checkout expired/failed. Start a new checkout to continue payment.'
                                            : 'After checkout, PayMongo webhook will automatically mark your payment as verified.'}
                                    </div>

                                    <div className="md:col-span-3 flex items-center gap-3">
                                        <button
                                            type="submit"
                                            disabled={depositForm.processing}
                                            className="rounded-lg bg-[#15233d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f1a2d] disabled:opacity-60"
                                        >
                                            {depositForm.processing ? 'Creating checkout...' : 'Start PayMongo Deposit Checkout'}
                                        </button>

                                        {flash.checkout_url && (
                                            <a
                                                href={flash.checkout_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="rounded-lg border border-[#15233d]/20 px-4 py-2 text-sm font-medium hover:bg-white"
                                            >
                                                Open Checkout
                                            </a>
                                        )}
                                    </div>
                                </form>
                            )}

                            {application.status === 'payment_pending' && latestPayment && !canStartCheckout && (
                                <div className="mt-5 space-y-3 rounded-lg border border-[#15233d]/10 bg-[#f8fafc] p-4">
                                    <p className="text-sm text-[#334155]">
                                        Latest payment reference: <span className="font-semibold">{latestPayment?.provider_reference ?? 'N/A'}</span>
                                    </p>
                                    <p className="text-sm text-[#334155]">
                                        Payment method: <span className="font-semibold">{latestPayment?.payment_method ?? 'N/A'}</span>
                                    </p>
                                    <p className={`text-sm font-semibold ${webhookVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
                                        {webhookVerified
                                            ? 'Payment verified by PayMongo webhook. Auto-conversion is in progress.'
                                            : 'Waiting PayMongo webhook verification.'}
                                    </p>
                                    {isBankTransferPending && (
                                        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                            If BPI shows "Access token is invalid or expired", use the retry button once to generate a fresh GCash checkout.
                                        </p>
                                    )}
                                    {latestPayment?.expires_at && !webhookVerified && (
                                        <p className="text-sm text-[#334155]">
                                            Checkout expires at: <span className="font-semibold">{new Date(latestPayment.expires_at).toLocaleString()}</span>
                                        </p>
                                    )}
                                    {latestPayment?.checkout_url && !webhookVerified && !latestPaymentBlocked && (
                                        <a
                                            href={latestPayment.checkout_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex rounded-lg border border-[#15233d]/20 px-4 py-2 text-sm font-medium hover:bg-white"
                                        >
                                            {isBankTransferPending ? 'Continue Previous Checkout' : 'Continue PayMongo Checkout'}
                                        </a>
                                    )}
                                    {!webhookVerified && (
                                        <button
                                            type="button"
                                            onClick={retryDeposit}
                                            disabled={retryingCheckout}
                                            className="inline-flex rounded-lg bg-[#15233d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f1a2d] disabled:opacity-60"
                                        >
                                            {retryingCheckout
                                                ? 'Generating new checkout...'
                                                : isBankTransferPending
                                                  ? 'Generate Fresh GCash Checkout'
                                                  : 'Try Again (Generate New Checkout)'}
                                        </button>
                                    )}
                                </div>
                            )}

                            {application.status === 'payment_paid' && (
                                <div className="mt-5 rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm text-teal-700">
                                    Payment has been verified. The system is now creating your tenant profile automatically.
                                </div>
                            )}

                            {application.status === 'converted' && (
                                <div className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
                                    Conversion complete. Your current account now has tenant access.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {application?.status === 'lease_sent' && (
                <Modal
                    open={leaseModalOpen}
                    onClose={() => setLeaseModalOpen(false)}
                    title="Lease Terms"
                    size="xl"
                    footer={
                        <div className="flex w-full items-center justify-end gap-2">
                            {application.lease_attachment_path && (
                                <a
                                    href={`/storage/${application.lease_attachment_path}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-lg border border-[#15233d]/20 px-4 py-2 text-sm font-medium hover:bg-white"
                                >
                                    Open PDF Attachment
                                </a>
                            )}
                            <button
                                type="button"
                                onClick={() => setLeaseModalOpen(false)}
                                className="rounded-lg border border-[#15233d]/20 px-4 py-2 text-sm font-medium hover:bg-white"
                            >
                                Close
                            </button>
                        </div>
                    }
                >
                    <div className="max-h-[70vh] overflow-y-auto rounded-lg border border-[#15233d]/10 bg-[#f8fafc] p-4 text-sm text-[#334155]">
                        <p className="whitespace-pre-wrap">{application.lease_terms}</p>
                    </div>
                </Modal>
            )}
        </>
    );
}
