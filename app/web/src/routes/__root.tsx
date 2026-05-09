/// <reference types="vite/client" />
import {
  HeadContent,
  Link,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import * as React from 'react'
import { DefaultCatchBoundary } from '~/components/DefaultCatchBoundary'
import { NotFound } from '~/components/NotFound'
import appCss from '~/styles/app.css?url'
import { seo } from '~/utils/seo'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ...seo({
        title: 'PotholeTracker — Barcelona',
        description: 'Real-time pothole detection and tracking across Barcelona.',
      }),
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
      { rel: 'manifest', href: '/site.webmanifest', color: '#ffffff' },
      { rel: 'icon', href: '/favicon.ico' },
      {
        rel: 'stylesheet',
        href: 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css',
      },
    ],
  }),
  errorComponent: DefaultCatchBoundary,
  notFoundComponent: () => <NotFound />,
  shellComponent: RootDocument,
})

const navItems = [
  { to: '/',            icon: 'ti-home',     label: 'Home'        },
  { to: '/map',         icon: 'ti-map-2',    label: 'Map'         },
  { to: '/alerts',      icon: 'ti-bell',     label: 'Alerts'      },
  { to: '/city-report', icon: 'ti-building', label: 'City Report' },
]

function RootDocument({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  return (
    <html className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="h-screen flex flex-col bg-gray-950 text-gray-100 overflow-hidden">

        {/* ── TOPBAR ── */}
        <header className="h-14 shrink-0 bg-gray-900 border-b border-gray-800 flex items-center px-4 gap-3 z-30">

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
            onClick={() => setSidebarOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <i className={`ti ${sidebarOpen ? 'ti-x' : 'ti-menu-2'} text-lg text-gray-300`} />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center shrink-0">
              <i className="ti ti-bike text-white text-sm" />
            </div>
            <span className="text-sm font-medium tracking-tight text-gray-100">
              Pothole<span className="text-green-500">Tracker</span>
            </span>
          </div>

          {/* Live indicator */}
          <div className="hidden sm:flex items-center gap-1.5 ml-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-gray-500">Live · Barcelona</span>
          </div>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-3">
            {/* Notification bell */}
            <button
              className="relative p-2 rounded-lg hover:bg-gray-800 transition-colors"
              aria-label="Notifications"
            >
              <i className="ti ti-bell text-base text-gray-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* ── BODY ── */}
        <div className="flex flex-1 overflow-hidden relative">

          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/60 z-20 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* ── SIDEBAR ── */}
          <aside className={`
            fixed md:relative top-0 left-0 h-full z-20
            w-56 shrink-0
            bg-gray-900
            border-r border-gray-800
            flex flex-col
            transition-transform duration-200 ease-in-out
            md:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            md:top-auto
          `}>

            {/* Nav links */}
            <nav className="flex-1 p-3 flex flex-col gap-1 mt-14 md:mt-0">
              <p className="text-xs text-gray-600 px-3 mb-2 mt-2 uppercase tracking-wider">
                Navigation
              </p>

              {navItems.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  activeOptions={item.to === '/' ? { exact: true } : undefined}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-100 transition-all"
                  activeProps={{
                    className: 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm bg-green-950 text-green-400 font-medium border border-green-900',
                  }}
                >
                  <i className={`ti ${item.icon} text-base`} />
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Bottom status */}
            <div className="p-3 border-t border-gray-800">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-800">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-300">System online</p>
                  <p className="text-xs text-gray-500">All sensors active</p>
                </div>
              </div>
            </div>
          </aside>

          {/* ── PAGE CONTENT ── */}
          <main className="flex-1 overflow-auto p-3 md:p-4">
            {children}
          </main>
        </div>

        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  )
}