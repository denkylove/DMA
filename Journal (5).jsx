import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, ClipboardList, Ship, Users,
  FileText, Snowflake, Users2, BarChart3, Anchor
} from 'lucide-react'

const NAV = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/journal',      icon: ClipboardList,   label: 'Journal de vente' },
  { to: '/importations', icon: Ship,            label: 'Importations' },
  { to: '/clients',      icon: Users,           label: 'Clients' },
  { to: '/factures',     icon: FileText,        label: 'Factures' },
  { to: '/socef',        icon: Snowflake,       label: 'Stock SOCEF' },
  { to: '/comptabilite', icon: BarChart3,       label: 'Comptabilité' },
  { to: '/rh',           icon: Users2,          label: 'Ressources humaines' },
]

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-ocean-900 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-ocean-700">
          <div className="flex items-center gap-2 mb-1">
            <Anchor size={18} className="text-ocean-300" />
            <span className="text-white font-semibold text-sm tracking-wide">ThonImport CI</span>
          </div>
          <p className="text-ocean-400 text-xs font-mono">Port d'Abidjan</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={15} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-ocean-700">
          <p className="text-ocean-500 text-xs font-mono">v1.0.0 · 2025</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto bg-slate-50">
        <div className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
