import { Link, router, usePage } from '@inertiajs/react';

export default function PublicLayout({ children }) {
    const authUser = usePage().props?.auth?.user;

    return (
        <>
            <nav className="sticky top-0 z-50 border-b border-[#15233d]/10 bg-white/80 backdrop-blur-md">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
                    <Link href="/" className="text-sm font-semibold tracking-[0.2em] uppercase text-[#1d7b6e]">
                        Leasing Portal
                    </Link>

                    <div className="flex items-center gap-3">
                        <Link href="/units" className="rounded-lg px-3 py-2 text-sm font-medium text-[#15233d] hover:bg-[#f5f0e8]">
                            View Units
                        </Link>

                        {authUser ? (
                            <>
                                {authUser.role === 'applicant' && (
                                    <Link href="/apply/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium text-[#15233d] hover:bg-[#f5f0e8]">
                                        Dashboard
                                    </Link>
                                )}
                                <span className="text-sm text-[#42506b]">{authUser.name}</span>
                                <button
                                    type="button"
                                    onClick={() => router.post('/logout')}
                                    className="rounded-lg border border-[#15233d]/20 px-3 py-2 text-sm font-medium hover:bg-[#f5f0e8]"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <Link href="/login" className="rounded-lg border border-[#15233d]/20 px-3 py-2 text-sm font-medium hover:bg-[#f5f0e8]">
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {children}
        </>
    );
}
