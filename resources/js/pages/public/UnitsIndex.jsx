import { Head, Link, usePage } from '@inertiajs/react';

export default function UnitsIndex({ property, units = [] }) {
    const authUser = usePage().props?.auth?.user;
    const applyHref = authUser?.role === 'applicant' ? '/apply/form' : '/apply/register';

    return (
        <>
            <Head title="Available Units" />

            <div className="min-h-screen bg-[#f3efe7] px-6 py-8 text-[#15233d]">
                <div className="mx-auto max-w-6xl space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#1d7b6e]">
                                {property?.name}
                            </p>
                            <h1 className="text-3xl font-black">Available Units</h1>
                        </div>
                        <Link href="/" className="rounded-lg border border-[#15233d]/20 px-4 py-2 text-sm font-medium hover:bg-white">
                            Back to Landing
                        </Link>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {units.map((unit) => (
                            <article key={unit.id} className="rounded-2xl border border-[#15233d]/10 bg-white p-4 shadow-sm">
                                <img
                                    src={unit.gallery?.[0]}
                                    alt={`Unit ${unit.number}`}
                                    className="h-40 w-full rounded-xl object-cover"
                                />
                                <h2 className="mt-3 text-xl font-bold">Unit {unit.number}</h2>
                                <p className="text-sm text-[#42506b]">
                                    {unit.floor} · {unit.type}
                                </p>
                                <p className="text-sm text-[#42506b]">{unit.area} sqm</p>
                                <p className="mt-2 text-lg font-black text-[#1d7b6e]">
                                    P{Number(unit.base_rent).toLocaleString()}/month
                                </p>
                                <div className="mt-3 flex gap-2">
                                    <Link href={`/units/${unit.id}`} className="rounded-lg border border-[#15233d]/20 px-3 py-2 text-sm font-medium hover:bg-[#f8fafc]">
                                        Full Specs
                                    </Link>
                                    <Link href={`${applyHref}?unit=${unit.id}`} className="rounded-lg bg-[#15233d] px-3 py-2 text-sm font-medium text-white hover:bg-[#0f1a2d]">
                                        Apply
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
