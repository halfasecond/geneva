import { Link, Outlet, useLocation } from 'react-router-dom'
import Logo from './Logo'

const NAV = [
    { to: '/', label: 'Home', end: true },
    { to: '/search', label: 'Search' },
    { to: '/kitty-hats', label: 'Kitty Hats' },
    { to: '/report', label: 'Report' },
] as const

const isFamilyTreeRoute = (pathname: string) => /^\/kitty\/\d+/.test(pathname)

const Layout = () => {
    const { pathname } = useLocation()
    const familyTree = isFamilyTreeRoute(pathname)

    const isActive = (to: string, end?: boolean) =>
        end ? pathname === to : pathname.startsWith(to)

    if (familyTree) {
        return (
            <div className="kf-app min-h-screen !bg-transparent overflow-y-auto">
                <main className="w-full">
                    <Outlet />
                </main>
            </div>
        )
    }

    return (
        <div className="kf-app">
            <header className="sticky top-0 z-40 border-b border-kf-warm/10 bg-kf-cream/95 backdrop-blur-sm">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
                    <Link to="/" className="shrink-0 md:hidden">
                        <img src="/kittyFamily/logo.svg" alt="kitty.family" className="h-10 w-10" />
                    </Link>
                    <nav className="flex flex-1 flex-wrap items-center justify-center gap-x-6 gap-y-2 md:justify-end">
                        {NAV.map(({ to, label, end }) => (
                            <Link
                                key={to}
                                to={to}
                                className={isActive(to, end) ? 'kf-nav-link-active' : 'kf-nav-link'}
                            >
                                {label}
                            </Link>
                        ))}
                    </nav>
                </div>
            </header>

            <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:px-6 xl:grid-cols-[1fr_280px]">
                <main className="min-w-0">
                    <Outlet />
                </main>

                <aside className="kf-chat-panel p-4">
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-kf-warm">Kitty chat</h3>
                    <p className="text-sm text-kf-warm/80 leading-relaxed">
                        Chat room for kitty owners — wiring up once kittyfamily auth + socket land in Geneva.
                    </p>
                </aside>
            </div>
        </div>
    )
}

export default Layout