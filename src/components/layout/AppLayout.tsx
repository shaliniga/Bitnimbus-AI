import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  Settings,
  Scale,
  ArrowRight,
} from 'lucide-react';
import { useReviewStore } from '../../store/useReviewStore';
import { calculateRiskAnalytics } from '../../utils/riskCalculator';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { contract, findings, reviews, userSettings } = useReviewStore();

  const analytics = React.useMemo(() => {
    return calculateRiskAnalytics(contract, findings, reviews);
  }, [contract, findings, reviews]);

  // Global Navigation: Exactly Dashboard, Documents, Reports & Analytics, Settings
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
      <nav className="h-13 px-4 sm:px-6 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between gap-4 z-30 shrink-0 shadow-sm">
        {/* Brand Logo & Platform Title */}
        <div className="flex items-center gap-6">
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-500 text-white flex items-center justify-center shadow-xs group-hover:bg-indigo-400 transition-colors">
              <Scale className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-bold text-sm tracking-tight text-white">
                  Northwind
                </span>
                <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded border border-indigo-400/30">
                  LEGAL AI
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                Contract Intelligence Platform
              </span>
            </div>
          </div>

          {/* Navigation Links: Dashboard, Documents, Reports & Analytics, Settings */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'text-white bg-indigo-600 shadow-xs font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Right Section: Active Review Quick-Pill & Reviewer Profile */}
        <div className="flex items-center gap-3">
          {/* Quick jump to active MSA review workspace */}
          <button
            type="button"
            onClick={() => navigate('/review/msa-northwind-brightline-2026')}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700 cursor-pointer"
            title="Open active review in dedicated workspace"
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              <span className="font-semibold text-white">
                Brightline MSA
              </span>
              <span className="text-[10px] text-slate-400">
                ({analytics.residualRiskScore}/100 Risk)
              </span>
            </div>
            <ArrowRight className="w-3 h-3 text-slate-400" />
          </button>

          {/* User Profile Tag */}
          <div
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 pl-2 border-l border-slate-700/80 cursor-pointer hover:opacity-90 transition-opacity"
            title="User Profile & Settings"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {userSettings.reviewerName.charAt(0)}
            </div>
            <div className="hidden lg:flex flex-col text-left leading-tight">
              <span className="text-xs font-semibold text-white">
                {userSettings.reviewerName}
              </span>
              <span className="text-[10px] text-slate-400">
                {userSettings.reviewerRole.split(' ')[0]}
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
