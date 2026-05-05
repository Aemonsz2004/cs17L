import { Head, Link, useForm } from '@inertiajs/react';

export default function ApplicationForm({ blocked = false, latestStatus = null, units = [] }) {
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const preselectedUnit = searchParams.get('unit');

    const { data, setData, post, processing, errors } = useForm({
        full_name: '',
        occupation: '',
        monthly_income: '',
        emergency_contact: '',
        unit_id: preselectedUnit ?? units?.[0]?.id ?? '',
        government_id: null,
        income_proof: null,
    });

    const submit = (event) => {
        event.preventDefault();
        post('/apply/form', { forceFormData: true });
    };

    return (
        <>
            <Head title="Rental Application" />

            <div className="min-h-screen bg-[#f3efe7] px-4 py-8">
                <div className="mx-auto w-full max-w-3xl rounded-2xl border border-[#15233d]/10 bg-white p-6 shadow-sm">
                    <h1 className="text-2xl font-bold text-[#15233d]">Rental Application</h1>
                    <p className="mt-1 text-sm text-[#42506b]">
                        Complete all fields and upload required documents.
                    </p>

                    {blocked && (
                        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                            You currently have an active application ({latestStatus}).
                            <div className="mt-2">
                                <Link href="/apply/dashboard" className="font-semibold hover:underline">
                                    Go to dashboard
                                </Link>
                            </div>
                        </div>
                    )}

                    {!blocked && (
                        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={submit}>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-[#15233d]">Full Name</label>
                                <input
                                    value={data.full_name}
                                    onChange={(event) => setData('full_name', event.target.value)}
                                    className="mt-1 w-full rounded-lg border border-[#15233d]/20 px-3 py-2"
                                    required
                                />
                                {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#15233d]">Occupation</label>
                                <input
                                    value={data.occupation}
                                    onChange={(event) => setData('occupation', event.target.value)}
                                    className="mt-1 w-full rounded-lg border border-[#15233d]/20 px-3 py-2"
                                    required
                                />
                                {errors.occupation && <p className="mt-1 text-xs text-red-600">{errors.occupation}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#15233d]">Monthly Income</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.monthly_income}
                                    onChange={(event) => setData('monthly_income', event.target.value)}
                                    className="mt-1 w-full rounded-lg border border-[#15233d]/20 px-3 py-2"
                                    required
                                />
                                {errors.monthly_income && <p className="mt-1 text-xs text-red-600">{errors.monthly_income}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-[#15233d]">Emergency Contact</label>
                                <input
                                    value={data.emergency_contact}
                                    onChange={(event) => setData('emergency_contact', event.target.value)}
                                    className="mt-1 w-full rounded-lg border border-[#15233d]/20 px-3 py-2"
                                    required
                                />
                                {errors.emergency_contact && <p className="mt-1 text-xs text-red-600">{errors.emergency_contact}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-[#15233d]">Select Unit</label>
                                <select
                                    value={data.unit_id}
                                    onChange={(event) => setData('unit_id', event.target.value)}
                                    className="mt-1 w-full rounded-lg border border-[#15233d]/20 px-3 py-2"
                                    required
                                >
                                    {units.map((unit) => (
                                        <option key={unit.id} value={unit.id}>
                                            Unit {unit.number} - {unit.floor} - {unit.type} - P{Number(unit.base_rent).toLocaleString()}
                                        </option>
                                    ))}
                                </select>
                                {errors.unit_id && <p className="mt-1 text-xs text-red-600">{errors.unit_id}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#15233d]">Government ID</label>
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    onChange={(event) => setData('government_id', event.target.files?.[0] ?? null)}
                                    className="mt-1 w-full rounded-lg border border-[#15233d]/20 px-3 py-2"
                                    required
                                />
                                {errors.government_id && <p className="mt-1 text-xs text-red-600">{errors.government_id}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#15233d]">Proof of Income</label>
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    onChange={(event) => setData('income_proof', event.target.files?.[0] ?? null)}
                                    className="mt-1 w-full rounded-lg border border-[#15233d]/20 px-3 py-2"
                                    required
                                />
                                {errors.income_proof && <p className="mt-1 text-xs text-red-600">{errors.income_proof}</p>}
                            </div>

                            <div className="md:col-span-2 flex items-center justify-between pt-2">
                                <Link href="/apply/dashboard" className="text-sm font-semibold text-[#1d7b6e] hover:underline">
                                    Back to dashboard
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-lg bg-[#15233d] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0f1a2d] disabled:opacity-60"
                                >
                                    {processing ? 'Submitting...' : 'Submit Application'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
}
