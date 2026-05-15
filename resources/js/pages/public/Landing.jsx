import { Head, Link, usePage } from '@inertiajs/react';

export default function Landing({ property, featuredUnits = [] }) {
    const authUser = usePage().props?.auth?.user;
    const applyHref = authUser?.role === 'applicant' ? '/apply/form' : '/apply/register';

    return (
        <>
            <Head title="Pandarawan Leasing" />

            <div className="min-h-screen bg-[#f3efe7] text-[#15233d]">
                <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
                    <div>
                        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#1d7b6e]">
                            Leasing Portal
                        </p>
                        <h1 className="text-2xl font-bold">{property?.name}</h1>
                    </div>

                    <div className="flex gap-2">
                        <Link href="/units" className="rounded-lg border border-[#15233d]/20 px-4 py-2 text-sm font-medium hover:bg-white">
                            View Units
                        </Link>
                        <Link href={applyHref} className="rounded-lg bg-[#15233d] px-4 py-2 text-sm font-medium text-white hover:bg-[#0f1a2d]">
                            Apply Now
                        </Link>
                        {!authUser && (
                            <Link href="/login" className="rounded-lg border border-[#15233d]/20 px-4 py-2 text-sm font-medium hover:bg-white">
                                Sign In
                            </Link>
                        )}
                    </div>
                </header>

                <main className="mx-auto max-w-6xl space-y-10 px-6 pb-14">
                    <section className="grid gap-6 lg:grid-cols-2">
                        <div className="space-y-4 rounded-2xl bg-white p-7 shadow-sm">
                            <h2 className="text-4xl font-black leading-tight">
                                {property?.tagline}
                            </h2>
                            <p className="text-[#42506b]">
                                {property?.location}
                            </p>
                            <ul className="space-y-2 text-sm text-[#30415f]">
                                {(property?.amenities ?? []).map((item) => (
                                    <li key={item} className="rounded-lg bg-[#f6f9f8] px-3 py-2">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {(property?.photos ?? []).map((photo, index) => (
                                <img
                                    key={photo}
                                    src={photo}
                                    alt={`Building view ${index + 1}`}
                                    className={[
                                        'h-44 w-full rounded-2xl object-cover',
                                        index === 0 ? 'col-span-2 h-56' : '',
                                    ].join(' ')}
                                />
                            ))}
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-bold">Featured Available Units</h3>
                            <Link href="/units" className="text-sm font-semibold text-[#1d7b6e] hover:underline">
                                See all available units
                            </Link>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {featuredUnits.map((unit) => (
                                <article key={unit.id} className="rounded-2xl border border-[#15233d]/10 bg-white p-4 shadow-sm">
                                    <img
                                        src={unit.gallery?.[0]}
                                        alt={`Unit ${unit.number}`}
                                        className="h-36 w-full rounded-xl object-cover"
                                    />
                                    <h4 className="mt-3 text-lg font-bold">Unit {unit.number}</h4>
                                    <p className="text-sm text-[#42506b]">
                                        {unit.floor} · {unit.type} · {unit.area} sqm
                                    </p>
                                    {unit.description ? (
                                        <p className="mt-2 text-sm leading-6 text-[#42506b]">
                                            {unit.description}
                                        </p>
                                    ) : null}
                                    <p className="mt-2 text-xl font-black text-[#1d7b6e]">
                                        P{Number(unit.base_rent).toLocaleString()}/month
                                    </p>
                                    <div className="mt-3 flex gap-2">
                                        <Link href={`/units/${unit.id}`} className="rounded-lg border border-[#15233d]/20 px-3 py-2 text-sm font-medium hover:bg-[#f8fafc]">
                                            View Details
                                        </Link>
                                        <Link href={`${applyHref}?unit=${unit.id}`} className="rounded-lg bg-[#15233d] px-3 py-2 text-sm font-medium text-white hover:bg-[#0f1a2d]">
                                            Apply
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}
