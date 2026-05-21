import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Modal from '../../components/Modal';

const STATUS_LABELS = {
    pending: 'Pending admin review',
    approved: 'Approved - awaiting payment',
    paid: 'Payment confirmed - awaiting move-in confirmation',
    rejected: 'Rejected',
    converted: 'You are now a tenant!',
};

import PublicLayout from '../../components/Layouts/PublicLayout';

export default function Dashboard({ application }) {
    const flash = usePage().props?.flash ?? {};
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    useEffect(() => {
        if (flash.payment_success) {
            setShowPaymentModal(true);
        }
    }, [flash.payment_success]);

    return (
        <>
            <Head title="Applicant Dashboard" />

            <div className="min-h-screen bg-[#f3efe7] px-4 py-8 text-[#15233d]">
                <div className="mx-auto w-full max-w-4xl space-y-5">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-black">Applicant Dashboard</h1>
                        <div className="flex gap-2">
                            <Link href="/units" className="rounded-lg border border-[#15233d]/20 px-4 py-2 text-sm font-medium bg-white hover:gray-50">
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

                            {application.status === 'approved' && (
                                <div className="mt-5 space-y-4">
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                                        Your application has been approved and the unit is reserved for you.
                                        Choose your payment method below to proceed.
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={() => router.post('/apply/payment/choose', { payment_method: 'gcash' }, { preserveScroll: true })}
                                            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                                        >
                                            Pay with GCash
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => router.post('/apply/payment/choose', { payment_method: 'cash' }, { preserveScroll: true })}
                                            className="rounded-lg border border-[#15233d]/20 bg-white px-5 py-3 text-sm font-semibold text-[#15233d] hover:bg-gray-50"
                                        >
                                            Pay with Cash
                                        </button>
                                    </div>
                                </div>
                            )}

                            {application.status === 'paid' && (
                                <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
                                    Payment confirmed. Awaiting admin move-in confirmation.
                                </div>
                            )}

                            {application.status === 'converted' && (
                                <div className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
                                    You are now a tenant! Use your tenant account to manage payments and requests.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Modal
                open={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                title="Payment Successful"
                size="sm"
                footer={
                    <button
                        type="button"
                        onClick={() => setShowPaymentModal(false)}
                        className="rounded-lg bg-[#15233d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f1a2d]"
                    >
                        Done
                    </button>
                }
            >
                <div className="space-y-4 py-2 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                        <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-[#15233d]">GCash Payment Complete</h3>
                    <p className="text-sm leading-relaxed text-[#42506b]">
                        Your payment has been received and your application is now marked as paid.
                        The admin will confirm your move-in shortly.
                    </p>
                </div>
            </Modal>
        </>
    );
}

Dashboard.layout = (page) => <PublicLayout children={page} />;
