import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Card from '../../components/Card';
import InfoRow from '../../components/InfoRow';
import { Input } from '../../components/Input';
import Modal from '../../components/Modal';
import { formatDateDisplay } from '../../lib/date';

const METHODS = [
    {
        id: 'gcash',
        label: 'GCash',
        sub: 'Online payment',
        detail: 'Reference number is required.',
        icon: 'G',
        iconClass: 'bg-blue-50 text-blue-600',
    },
    {
        id: 'cash',
        label: 'Cash',
        sub: 'Pay in person at the office',
        detail: 'No reference number needed. The admin will be notified.',
        icon: '₱',
        iconClass: 'bg-[#C8963E]/10 text-[#C8963E]',
    },
];

export default function PayRentPage() {
    const { unpaidInvoices, auth, flash } = usePage().props;
    const [method, setMethod] = useState('gcash');
    const [successOpen, setSuccessOpen] = useState(false);
    const [refNo, setRefNo] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const activeInvoice = unpaidInvoices?.[0]
        ? {
              id: unpaidInvoices[0].id,
              invoiceNo: unpaidInvoices[0].invoice_no,
              period: unpaidInvoices[0].period,
              rent: unpaidInvoices[0].rent,
              utilities: unpaidInvoices[0].utilities,
              penalty: unpaidInvoices[0].penalty,
              total: unpaidInvoices[0].total,
              dueDate: unpaidInvoices[0].due_date,
              status: unpaidInvoices[0].status,
          }
        : null;

    const selected = METHODS.find((m) => m.id === method);
    const isGcash = method === 'gcash';

    const handlePay = () => {
        if (isGcash && !refNo.trim()) {
            window.alert('Reference number is required for GCash payments.');
            return;
        }

        setSubmitting(true);

        const payload = {
            invoice_id: activeInvoice.id,
            method: isGcash ? 'GCash' : 'Cash',
        };
        if (isGcash) {
            payload.reference = refNo.trim();
        }

        router.post('/tenant/pay-rent', payload, {
            onSuccess: () => {
                setSubmitting(false);
                setSuccessOpen(true);
            },
            onError: (errors) => {
                setSubmitting(false);
                const message =
                    errors?.invoice_id ??
                    errors?.method ??
                    errors?.reference ??
                    'Unable to submit payment.';
                window.alert(message);
            },
        });
    };

    if ((unpaidInvoices?.length ?? 0) === 0) {
        return (
            <Card>
                <Card.Body>
                    <div className="py-8 text-center">
                        <p className="text-lg font-bold text-[#1B2B4B]">
                            No unpaid invoices
                        </p>
                        <p className="mt-1 text-sm text-[#5C6B88]">
                            You are all settled for now.
                        </p>
                    </div>
                </Card.Body>
            </Card>
        );
    }

    return (
        <div className="space-y-5">
            {/* ── Invoice summary ── */}
            <Card>
                <Card.Header
                    title={`Invoice — ${activeInvoice.period}`}
                    action={<Badge variant="amber">Unpaid</Badge>}
                />
                <Card.Body>
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <InfoRow
                                label="Invoice No."
                                value={
                                    <span className="font-mono text-sm">
                                        {activeInvoice.invoiceNo}
                                    </span>
                                }
                            />
                            <InfoRow
                                label="Period"
                                value={activeInvoice.period}
                            />
                            <InfoRow
                                label="Due Date"
                                value={formatDateDisplay(activeInvoice.dueDate)}
                            />
                            <InfoRow
                                label="Status"
                                value={
                                    <span className="font-semibold text-amber-600">
                                        Unpaid
                                    </span>
                                }
                                border={false}
                            />
                        </div>
                        <div>
                            <InfoRow
                                label="Base Rent"
                                value={`₱${activeInvoice.rent.toLocaleString()}`}
                            />
                            <InfoRow
                                label="Utilities"
                                value={`₱${activeInvoice.utilities.toLocaleString()}`}
                            />
                            <InfoRow
                                label="Penalty"
                                value={
                                    activeInvoice.penalty > 0
                                        ? `₱${activeInvoice.penalty.toLocaleString()}`
                                        : 'None'
                                }
                            />
                            <div className="mt-1 flex items-center justify-between border-t border-[#1B2B4B]/8 pt-3">
                                <span className="text-sm font-bold text-[#1B2B4B]">
                                    Total Due
                                </span>
                                <span className="text-2xl font-bold text-[#1B2B4B]">
                                    ₱{activeInvoice.total.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* ── Pending confirmation / Payment method ── */}
            {activeInvoice.status === 'pending' ? (
                <Card>
                    <Card.Body>
                        <div className="py-6 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
                                <svg
                                    className="h-7 w-7 animate-spin text-amber-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    />
                                </svg>
                            </div>
                            <h3 className="mb-1 text-lg font-bold text-[#1B2B4B]">
                                Waiting for Confirmation
                            </h3>
                            <p className="mx-auto max-w-sm text-sm text-[#5C6B88]">
                                Your payment for Invoice{' '}
                                {activeInvoice.invoiceNo} has been submitted and
                                is awaiting admin confirmation. You will be
                                notified once confirmed.
                            </p>
                        </div>
                    </Card.Body>
                </Card>
            ) : (
                <>
                    {/* ── Payment method ── */}
                    <Card>
                        <Card.Header title="Select Payment Method" />
                        <Card.Body>
                            <div className="mb-5 space-y-3">
                                {METHODS.map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => setMethod(m.id)}
                                        className={[
                                            'flex w-full items-center gap-4 rounded-xl border-2 px-4 py-4 text-left transition-all',
                                            method === m.id
                                                ? 'border-[#24A18F] bg-[#24A18F]/5'
                                                : 'border-[#1B2B4B]/12 hover:border-[#1B2B4B]/25 hover:bg-[#FAF8F4]',
                                        ].join(' ')}
                                    >
                                        <div
                                            className={[
                                                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                                                method === m.id
                                                    ? 'border-[#24A18F]'
                                                    : 'border-[#1B2B4B]/25',
                                            ].join(' ')}
                                        >
                                            {method === m.id && (
                                                <div className="h-2.5 w-2.5 rounded-full bg-[#24A18F]" />
                                            )}
                                        </div>

                                        <div
                                            className={[
                                                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold',
                                                m.iconClass,
                                            ].join(' ')}
                                        >
                                            {m.icon}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-[#1B2B4B]">
                                                {m.label}
                                            </p>
                                            <p className="text-xs text-[#5C6B88]">
                                                {m.sub}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="mb-5 rounded-xl bg-[#F5F0E8] p-4">
                                <p className="mb-1 text-[10px] font-bold tracking-wider text-[#5C6B88] uppercase">
                                    {selected.label} Details
                                </p>
                                <p className="text-sm font-medium text-[#1B2B4B]">
                                    {selected.detail}
                                </p>
                            </div>

                            {isGcash && (
                                <Input
                                    label="Reference / Transaction Number"
                                    placeholder="e.g. 1234567890"
                                    value={refNo}
                                    onChange={(e) => setRefNo(e.target.value)}
                                    helper="Enter your GCash reference number."
                                    full
                                />
                            )}
                        </Card.Body>
                        <Card.Footer>
                            <div className="flex w-full items-center justify-between">
                                <div>
                                    <span className="text-xs text-[#5C6B88]">
                                        You are paying{' '}
                                    </span>
                                    <span className="text-sm font-bold text-[#1B2B4B]">
                                        ₱{activeInvoice.total.toLocaleString()}
                                    </span>
                                    <span className="text-xs text-[#5C6B88]">
                                        {' '}
                                        via {selected.label}
                                    </span>
                                </div>
                                <Button
                                    variant="primary"
                                    size="md"
                                    onClick={handlePay}
                                    disabled={
                                        (isGcash && refNo.trim() === '') ||
                                        submitting
                                    }
                                >
                                    {submitting
                                        ? 'Processing...'
                                        : `Pay ${selected.label}`}
                                </Button>
                            </div>
                        </Card.Footer>
                    </Card>
                </>
            )}

            {/* ── Success Modal ── */}
            <Modal
                open={successOpen}
                onClose={() => setSuccessOpen(false)}
                hideClose
                size="sm"
            >
                <div className="py-4 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#24A18F]/15">
                        <span className="text-3xl text-[#24A18F]">✓</span>
                    </div>
                    <h3 className="mb-1 text-lg font-bold text-[#1B2B4B]">
                        Payment Submitted
                    </h3>
                    <p className="mb-5 text-sm text-[#5C6B88]">
                        {isGcash
                            ? 'Your GCash payment has been recorded. The admin will confirm it shortly.'
                            : 'You chose to pay with cash. The admin has been notified.'}
                    </p>
                    <div className="mb-5 rounded-xl bg-[#F5F0E8] p-4 text-left">
                        <InfoRow
                            label="Amount"
                            value={`₱${activeInvoice.total.toLocaleString()}`}
                        />
                        <InfoRow label="Method" value={selected.label} />
                        {isGcash && <InfoRow label="Reference" value={refNo} />}
                        <InfoRow
                            label="Invoice"
                            value={activeInvoice.invoiceNo}
                            border={false}
                        />
                    </div>
                    <Button
                        variant="primary"
                        size="md"
                        full
                        onClick={() => {
                            setSuccessOpen(false);
                            router.visit('/tenant/pay-rent', {
                                preserveState: false,
                            });
                        }}
                    >
                        Done
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
