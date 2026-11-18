import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  Settings,
  Scale,
  Menu,
  X,
} from 'lucide-react';
import { useReviewStore } from '../../store/useReviewStore';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const { userSettings } = useReviewStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      to: '/documents',
      label: 'Documents',
      icon: FolderKanban,
    },
    {
      to: '/reports',
      label: 'Reports & Analytics',
      icon: BarChart3,
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans antialiased">
      {/* Global Enterprise Top Navigation Bar */}
      <nav className="relative z-30 grid h-15 shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-b border-slate-800 bg-slate-900 px-3 text-white shadow-sm sm:px-6">
        {/* Brand Logo & Platform Title */}
        <div className="flex min-w-0 items-center justify-self-start">
          <Link
            to="/"
            className="group flex min-w-0 items-center gap-2.5 select-none"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500 text-white shadow-xs transition-colors group-hover:bg-indigo-400">
              <Scale className="w-4 h-4" />
            </div>
            <div className="flex min-w-0 flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-bold text-base tracking-tight text-white">
                  Northwind
                </span>
                <span className="hidden rounded border border-indigo-400/30 bg-indigo-500/20 px-1.5 py-0.5 text-[11px] font-bold text-indigo-300 sm:inline">
                  LEGAL AI
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium tracking-wide">
                Contract Intelligence Platform
              </span>
            </div>
          </Link>
        </div>

        {/* Centered Navigation */}
        <div className="relative justify-self-center">
          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  `relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs font-bold'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-2.5 py-1.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 md:hidden"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span>Menu</span>
          </button>

          {mobileMenuOpen && (
            <div className="absolute left-1/2 top-full z-50 mt-2 w-56 -translate-x-1/2 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-lg md:hidden">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Reviewer Profile */}
        <div className="flex min-w-0 items-center justify-self-end">
          <div
            onClick={() => navigate('/settings')}
            className="flex min-w-0 items-center gap-2 cursor-pointer transition-opacity hover:opacity-90"
            title={`Reviewer: ${userSettings.reviewerName} (${userSettings.reviewerRole})`}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-xs font-bold text-white shadow-xs">
              {userSettings.reviewerName.charAt(0)}
            </div>
            <div className="hidden min-w-0 flex-col text-left leading-tight sm:flex">
              <span className="text-sm font-semibold text-white">
                {userSettings.reviewerName}
              </span>
              <span className="text-xs text-slate-400">
                {userSettings.reviewerRole}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Page Body */}
      <div className="flex-1 overflow-hidden relative">
        <Outlet />
      </div>
    </div>
  );
};
