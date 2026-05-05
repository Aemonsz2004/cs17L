// src/pages/tenant/PayRentPage.jsx
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
        sub: 'API checkout',
        detail: 'Creates a demo PayMongo payment intent and lets you simulate success.',
    },
    {
        id: 'bank',
        label: 'Bank Transfer',
        sub: 'BDO / BPI / UnionBank',
        detail: 'Account: 1234-5678-9012 · Pandarawan Realty Inc.',
    },
    {
        id: 'cash',
        label: 'Cash Payment',
        sub: 'Pay at admin office',
        detail: 'Admin Office, Ground Floor · Mon–Sat 8AM–5PM',
    },
];
export default function PayRentPage() {
    const { unpaidInvoices, auth } = usePage().props;
    const [method, setMethod] = useState('gcash');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [successOpen, setSuccessOpen] = useState(false);
    const [refNo, setRefNo] = useState('');
    const [demoOpen, setDemoOpen] = useState(false);
    const [demoLoading, setDemoLoading] = useState(false);
    const [demoIntent, setDemoIntent] = useState(null);
    const csrfToken = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content');
    const callDemoApi = async (url, method, payload) => {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
            },
            credentials: 'same-origin',
            body: method === 'POST' ? JSON.stringify(payload ?? {}) : undefined,
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || 'Demo API request failed');
        }
        return response.json();
    };
    const createDemoIntent = async () => {
        if (!activeInvoice) {
            return;
        }
        setDemoLoading(true);
        try {
            const result = await callDemoApi(
                '/tenant/paymongo/demo/payment-intents',
                'POST',
                {
                    invoice_id: activeInvoice.id,
                    channel: 'gcash',
                },
            );
            setDemoIntent({
                id: result.data.id,
                status: result.data.attributes.status,
                checkoutUrl:
                    result.data.attributes?.next_action?.redirect?.checkout_url,
            });
            setDemoOpen(true);
            setConfirmOpen(false);
        } catch (error) {
            window.alert('Unable to create demo payment intent.');
            console.error(error);
        } finally {
            setDemoLoading(false);
        }
    };
    const refreshDemoIntent = async () => {
        if (!demoIntent) {
            return;
        }
        setDemoLoading(true);
        try {
            const result = await callDemoApi(
                `/tenant/paymongo/demo/payment-intents/${demoIntent.id}`,
                'GET',
            );
            setDemoIntent((current) =>
                current
                    ? {
                          ...current,
                          status: result.data.attributes.status,
                      }
                    : current,
            );
        } catch (error) {
            window.alert('Unable to refresh demo payment status.');
            console.error(error);
        } finally {
            setDemoLoading(false);
        }
    };
    const confirmDemoIntent = async () => {
        if (!demoIntent || !activeInvoice) {
            return;
        }
        setDemoLoading(true);
        try {
            const result = await callDemoApi(
                `/tenant/paymongo/demo/payment-intents/${demoIntent.id}/confirm`,
                'POST',
            );
            setDemoIntent((current) =>
                current
                    ? {
                          ...current,
                          status: result.data.attributes.status,
                      }
                    : current,
            );
            router.post('/tenant/pay-rent', {
                invoice_id: activeInvoice.id,
                method: 'GCash',
                reference: demoIntent.id,
            });
        } catch (error) {
            window.alert('Unable to confirm demo payment.');
            console.error(error);
        } finally {
            setDemoLoading(false);
        }
    };
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
          }
        : null;
    const selected = METHODS.find((m) => m.id === method);
    const handleConfirm = () => {
        // Validate required reference for Bank Transfer
        if (method === 'bank' && !refNo.trim()) {
            window.alert('Bank Reference is required for Bank Transfer payments.');
            return;
        }

        if (method === 'gcash') {
            void createDemoIntent();
            return;
        }
        if (activeInvoice?.id) {
            router.post('/tenant/pay-rent', {
                invoice_id: activeInvoice.id,
                method:
                    method === 'gcash'
                        ? 'GCash'
                        : method === 'bank'
                          ? 'Bank Transfer'
                          : 'Cash',
                reference: method === 'bank' ? refNo.trim() : undefined,
            });
            return;
        }
        setConfirmOpen(false);
        setSuccessOpen(true);
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
        <div className="max-w-3xl space-y-5">
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
                                {/* Radio */}
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

                                {/* Icon placeholder */}
                                <div
                                    className={[
                                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold',
                                        m.id === 'gcash'
                                            ? 'bg-blue-50 text-blue-600'
                                            : m.id === 'bank'
                                              ? 'bg-[#1B2B4B]/8 text-[#1B2B4B]'
                                              : 'bg-[#C8963E]/10 text-[#C8963E]',
                                    ].join(' ')}
                                >
                                    {m.id === 'gcash'
                                        ? 'G'
                                        : m.id === 'bank'
                                          ? 'B'
                                          : '₱'}
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

                    {/* Selected method instructions */}
                    <div className="mb-5 rounded-xl bg-[#F5F0E8] p-4">
                        <p className="mb-1 text-[10px] font-bold tracking-wider text-[#5C6B88] uppercase">
                            {selected.label} Details
                        </p>
                        <p className="text-sm font-medium text-[#1B2B4B]">
                            {selected.detail}
                        </p>
                    </div>

                    {/* Reference number (for GCash/Bank) */}
                    {method === 'bank' && (
                        <Input
                            label="Reference / Transaction Number"
                            placeholder="e.g. 1234567890"
                            value={refNo}
                            onChange={(e) => setRefNo(e.target.value)}
                            helper="Enter the reference number from your GCash or bank transfer confirmation."
                            full
                        />
                    )}

                    {/* Cash instructions */}
                    {method === 'cash' && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                            <p className="mb-1 text-sm font-semibold text-amber-700">
                                Cash Payment Instructions
                            </p>
                            <p className="text-xs text-amber-600">
                                Please bring exact change and your invoice
                                number ({activeInvoice?.invoiceNo ?? 'N/A'}) to
                                the admin office. A receipt will be issued upon
                                payment. Office hours: Mon–Sat, 8AM–5PM.
                            </p>
                        </div>
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
                            onClick={() => setConfirmOpen(true)}
                            disabled={method === 'bank' && refNo.trim() === ''}
                        >
                            {method === 'gcash'
                                ? 'Start GCash Demo Checkout'
                                : method === 'cash'
                                  ? "I've Paid — Notify Admin"
                                  : 'Confirm Payment'}
                        </Button>
                    </div>
                </Card.Footer>
            </Card>

            {/* ── Confirm Modal ── */}
            <Modal
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                title="Confirm Payment"
                size="sm"
                footer={
                    <>
                        <Button
                            variant="ghost"
                            onClick={() => setConfirmOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleConfirm}>
                            Yes, Confirm
                        </Button>
                    </>
                }
            >
                <div className="py-2 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#24A18F]/10">
                        <span className="text-2xl">₱</span>
                    </div>
                    <p className="mb-1 text-3xl font-bold text-[#1B2B4B]">
                        ₱{activeInvoice.total.toLocaleString()}
                    </p>
                    <p className="mb-5 text-sm text-[#5C6B88]">
                        {activeInvoice.period} · via {selected.label}
                    </p>
                </div>
                <InfoRow label="Tenant" value={auth?.user?.name ?? 'Tenant'} />
                <InfoRow label="Unit" value="-" />
                <InfoRow label="Invoice" value={activeInvoice.invoiceNo} />
                <InfoRow label="Method" value={selected.label} border={false} />
                {method === 'bank' && refNo && (
                    <InfoRow label="Reference" value={refNo} border={false} />
                )}
            </Modal>

            {/* ── PayMongo Demo Modal ── */}
            <Modal
                open={demoOpen}
                onClose={() => setDemoOpen(false)}
                title="PayMongo Demo Checkout"
                size="sm"
                footer={
                    <>
                        <Button
                            variant="ghost"
                            onClick={() => setDemoOpen(false)}
                        >
                            Close
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => void refreshDemoIntent()}
                            disabled={demoLoading || !demoIntent}
                        >
                            Refresh Status
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => void confirmDemoIntent()}
                            disabled={demoLoading || !demoIntent}
                        >
                            Simulate GCash Success
                        </Button>
                    </>
                }
            >
                <div className="space-y-2">
                    <InfoRow
                        label="Invoice"
                        value={activeInvoice?.invoiceNo ?? '-'}
                    />
                    <InfoRow
                        label="Amount"
                        value={`₱${activeInvoice?.total?.toLocaleString() ?? '0'}`}
                    />
                    <InfoRow
                        label="Intent ID"
                        value={
                            <span className="font-mono text-xs">
                                {demoIntent?.id ?? '-'}
                            </span>
                        }
                    />
                    <InfoRow
                        label="Status"
                        value={
                            <Badge variant="blue">
                                {demoIntent?.status ?? '-'}
                            </Badge>
                        }
                        border={false}
                    />
                </div>

                {demoIntent?.checkoutUrl && (
                    <div className="mt-4 rounded-xl border border-[#1B2B4B]/12 bg-[#F7FAFF] p-3">
                        <p className="text-xs text-[#5C6B88]">
                            Demo checkout URL
                        </p>
                        <p className="mt-1 font-mono text-xs break-all text-[#1B2B4B]">
                            {demoIntent.checkoutUrl}
                        </p>
                    </div>
                )}
            </Modal>

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
                        Payment Submitted!
                    </h3>
                    <p className="mb-5 text-sm text-[#5C6B88]">
                        Your payment notification has been sent to the admin for
                        confirmation. You will receive a receipt once verified.
                    </p>
                    <div className="mb-5 rounded-xl bg-[#F5F0E8] p-4 text-left">
                        <InfoRow
                            label="Amount"
                            value={`₱${activeInvoice.total.toLocaleString()}`}
                        />
                        <InfoRow label="Method" value={selected.label} />
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
                        onClick={() => setSuccessOpen(false)}
                    >
                        Done
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
