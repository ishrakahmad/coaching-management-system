import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BookOpen, CalendarRange, Contact, GraduationCap, HandCoins, Layers, LayoutDashboard, LogOut, LucideIcon, ReceiptText, School,
  UserCog, Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { canSeeFinance, canSeeStudents, isInstituteAdmin } from '../../lib/roles';
import { roleLabel } from '../../lib/format';
import type { Role } from '../../types';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  show?: (role?: string) => boolean;
}

// Grouped so the sidebar separates daily work (people, money) from setup done once per session.
// Items a role can't use are hidden; the API enforces the same rules.
const navGroups: { label?: string; items: NavItem[] }[] = [
  { items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
  {
    label: 'শিক্ষার্থী ও শিক্ষক',
    items: [
      { to: '/dashboard/students', label: 'Students', icon: GraduationCap, show: canSeeStudents },
      { to: '/dashboard/guardians', label: 'Guardians', icon: Contact, show: canSeeStudents },
      { to: '/dashboard/teachers', label: 'Teachers', icon: Users, show: canSeeFinance },
    ],
  },
  {
    label: 'টাকা-পয়সা',
    items: [
      { to: '/dashboard/fees', label: 'Fees ও বকেয়া', icon: HandCoins, show: canSeeFinance },
      { to: '/dashboard/payments', label: 'Payments', icon: ReceiptText, show: canSeeFinance },
    ],
  },
  {
    label: 'Academic setup',
    items: [
      { to: '/dashboard/batches', label: 'Batches', icon: Layers },
      { to: '/dashboard/classes', label: 'Classes', icon: School },
      { to: '/dashboard/subjects', label: 'Subjects', icon: BookOpen },
      { to: '/dashboard/sessions', label: 'Sessions', icon: CalendarRange },
    ],
  },
  {
    label: 'প্রতিষ্ঠান',
    items: [{ to: '/dashboard/staff', label: 'Staff', icon: UserCog, show: isInstituteAdmin }],
  },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex bg-paper print:bg-white">
      <aside className="no-print w-60 shrink-0 bg-teal-900 text-paper flex flex-col">
        <div className="px-5 py-5 font-display text-lg font-semibold tracking-tight border-b border-teal-800">
          শিক্ষা<span className="text-amber-400">সেবা</span>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5" aria-label="Main">
          {navGroups.map((group, index) => {
            const items = group.items.filter((item) => !item.show || item.show(user?.role));
            if (!items.length) return null;
            return (
              <div key={group.label ?? index}>
                {group.label && <div className="px-3 pb-1.5 text-xs text-teal-200/50">{group.label}</div>}
                <div className="space-y-1">
                  {items.map(({ to, label, icon: Icon, end }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                          isActive ? 'bg-teal-800 text-paper' : 'text-teal-100/70 hover:bg-teal-800/50 hover:text-paper'
                        }`
                      }
                    >
                      <Icon size={18} aria-hidden />
                      {label}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-teal-800">
          <div className="px-3 mb-2">
            <div className="text-xs text-teal-100/80 truncate">{user?.email}</div>
            <div className="text-xs text-teal-200/50">{roleLabel[user?.role as Role] ?? user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-teal-100/70 hover:bg-teal-800/50 hover:text-paper transition w-full outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <LogOut size={18} aria-hidden />
            লগআউট
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
