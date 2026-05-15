import { Head, Link, usePage } from '@inertiajs/react';

export default function UnitShow({ property, unit, canApply }) {
    const authUser = usePage().props?.auth?.user;
    const applyHref = authUser?.role === 'applicant' ? '/apply/form' : '/apply/register';

    return (
        <>
            <Head title={`Unit ${unit?.number}`} />

            <div className="min-h-screen bg-[#f3efe7] px-6 py-8 text-[#15233d]">
                <div className="mx-auto max-w-6xl space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#1d7b6e]">
                                {property?.name}
                            </p>
                            <h1 className="text-3xl font-black">Unit {unit?.number}</h1>
                        </div>
                        <Link href="/units" className="rounded-lg border border-[#15233d]/20 px-4 py-2 text-sm font-medium hover:bg-white">
                            Back to Units
                        </Link>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="space-y-3">
                            <img
                                src={unit?.gallery?.[0]}
                                alt={`Unit ${unit?.number} hero`}
                                className="h-80 w-full rounded-2xl object-cover"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                {(unit?.gallery ?? []).slice(1).map((photo, index) => (
                                    <img
                                        key={`${photo}-${index}`}
                                        src={photo}
                                        alt={`Unit ${unit?.number} gallery ${index + 1}`}
                                        className="h-32 w-full rounded-xl object-cover"
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <h2 className="text-2xl font-bold">Full Unit Specifications</h2>
                            <p className="mt-1 text-sm text-[#42506b]">
                                {unit?.floor} · {unit?.type}
                            </p>

                            {unit?.description ? (
                                <div className="mt-5 rounded-2xl bg-[#FAF8F4] p-4 text-sm text-[#42506b]">
                                    {unit.description}
                                </div>
                            ) : null}

                            <div className="mt-5 space-y-2">
                                {Object.entries(unit?.specs ?? {}).map(([label, value]) => (
                                    <div key={label} className="flex items-center justify-between rounded-lg bg-[#f8fafc] px-3 py-2 text-sm">
                                        <span className="text-[#42506b]">{label}</span>
                                        <span className="font-semibold text-[#15233d]">{value}</span>
                                    </div>
                                ))}
                            </div>

                            <p className="mt-5 text-3xl font-black text-[#1d7b6e]">
                                P{Number(unit?.base_rent ?? 0).toLocaleString()}/month
                            </p>

                            {canApply ? (
                                <Link href={`${applyHref}?unit=${unit?.id}`} className="mt-5 inline-block rounded-lg bg-[#15233d] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0f1a2d]">
                                    Apply for this unit
                                </Link>
                            ) : (
                                <p className="mt-4 text-sm font-medium text-red-600">
                                    This unit is currently unavailable.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
