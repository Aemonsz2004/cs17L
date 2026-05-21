import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '../../components/InputError';

import PublicLayout from '../../components/Layouts/PublicLayout';

export default function ReapplyForm({ unit, tenant }) {
    const { data, setData, post, processing, errors } = useForm({
        full_name: tenant.name ?? '',
        occupation: '',
        monthly_income: '',
        emergency_contact: '',
        preferred_move_in: '',
        lease_duration: '6',
    });

    const submit = (event) => {
        event.preventDefault();
        post(`/tenant/reapply/${unit.id}`);
    };

    const inputClass = (field) => [
        'mt-1 w-full rounded-lg border px-3 py-2 outline-none transition-colors duration-150',
        errors[field]
            ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-200/30'
            : 'border-[#15233d]/20 focus:border-[#1d7b6e] focus:ring-2 focus:ring-[#1d7b6e]/20',
    ].join(' ');

    return (
        <>
            <Head title="Re-Apply for Unit" />

            <div className="min-h-screen bg-[#f3efe7] px-4 py-8">
                <div className="mx-auto w-full max-w-3xl rounded-2xl border border-[#15233d]/10 bg-white p-6 shadow-sm">
                    <h1 className="text-2xl font-bold text-[#15233d]">Re-Apply for Unit {unit.number}</h1>
                    <p className="mt-1 text-sm text-[#42506b]">
                        {unit.floor} &middot; {unit.type} &middot; P{Number(unit.base_rent).toLocaleString()}/month
                    </p>
                    <p className="mt-1 text-sm text-[#42506b]">
                        Fill in your updated details below to submit a new application.
                    </p>

                    <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={submit}>
                        <div className="md:col-span-2">
                            <label htmlFor="full_name" className="block text-sm font-medium text-[#15233d]">Full Name</label>
                            <input
                                id="full_name"
                                value={data.full_name}
                                onChange={(event) => setData('full_name', event.target.value)}
                                className={inputClass('full_name')}
                            />
                            <InputError message={errors.full_name} id="full_name-error" />
                        </div>

                        <div>
                            <label htmlFor="occupation" className="block text-sm font-medium text-[#15233d]">Occupation</label>
                            <input
                                id="occupation"
                                value={data.occupation}
                                onChange={(event) => setData('occupation', event.target.value)}
                                className={inputClass('occupation')}
                                required
                            />
                            <InputError message={errors.occupation} id="occupation-error" />
                        </div>

                        <div>
                            <label htmlFor="monthly_income" className="block text-sm font-medium text-[#15233d]">Monthly Income</label>
                            <input
                                id="monthly_income"
                                type="number"
                                min="0"
                                value={data.monthly_income}
                                onChange={(event) => setData('monthly_income', event.target.value)}
                                className={inputClass('monthly_income')}
                                required
                            />
                            <InputError message={errors.monthly_income} id="monthly_income-error" />
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="emergency_contact" className="block text-sm font-medium text-[#15233d]">Emergency Contact</label>
                            <input
                                id="emergency_contact"
                                value={data.emergency_contact}
                                onChange={(event) => setData('emergency_contact', event.target.value)}
                                className={inputClass('emergency_contact')}
                                required
                            />
                            <InputError message={errors.emergency_contact} id="emergency_contact-error" />
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="preferred_move_in" className="block text-sm font-medium text-[#15233d]">Preferred Move-In Date</label>
                            <input
                                id="preferred_move_in"
                                type="date"
                                value={data.preferred_move_in}
                                onChange={(event) => setData('preferred_move_in', event.target.value)}
                                className={inputClass('preferred_move_in')}
                            />
                            <InputError message={errors.preferred_move_in} id="preferred_move_in-error" />
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="lease_duration" className="block text-sm font-medium text-[#15233d]">Lease Duration</label>
                            <select
                                id="lease_duration"
                                value={data.lease_duration}
                                onChange={(event) => setData('lease_duration', event.target.value)}
                                className={inputClass('lease_duration')}
                            >
                                <option value="3">3 months</option>
                                <option value="6">6 months</option>
                                <option value="12">12 months</option>
                            </select>
                            <InputError message={errors.lease_duration} id="lease_duration-error" />
                        </div>

                        <div className="md:col-span-2 flex items-center justify-between pt-2">
                            <Link href="/tenant/home" className="text-sm font-semibold text-[#1d7b6e] hover:underline">
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
                </div>
            </div>
        </>
    );
}

ReapplyForm.layout = (page) => <PublicLayout children={page} />;
