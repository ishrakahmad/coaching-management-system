import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  CalendarRange, Contact, GraduationCap, Layers, LayoutDashboard, LogOut, LucideIcon, School, Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

// Grouped so the sidebar shows the difference between day-to-day records
// and the academic structure that is set up once per session.
const navGroups: { label?: string; items: NavItem[] }[] = [
  { items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
  {
    label: 'শিক্ষার্থী ও শিক্ষক',
    items: [
      { to: '/dashboard/students', label: 'Students', icon: GraduationCap },
      { to: '/dashboard/guardians', label: 'Guardians', icon: Contact },
      { to: '/dashboard/teachers', label: 'Teachers', icon: Users },
    ],
  },
  {
    label: 'Academic setup',
    items: [
      { to: '/dashboard/batches', label: 'Batches', icon: Layers },
      { to: '/dashboard/classes', label: 'Classes', icon: School },
      { to: '/dashboard/sessions', label: 'Sessions', icon: CalendarRange },
    ],
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
    <div className="min-h-screen flex bg-paper">
      <aside className="w-60 shrink-0 bg-teal-900 text-paper flex flex-col">
        <div className="px-5 py-5 font-display text-lg font-semibold tracking-tight border-b border-teal-800">
          শিক্ষা<span className="text-amber-400">সেবা</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-5" aria-label="Main">
          {navGroups.map((group, index) => (
            <div key={group.label ?? index}>
              {group.label && <div className="px-3 pb-1.5 text-xs text-teal-200/50">{group.label}</div>}
              <div className="space-y-1">
                {group.items.map(({ to, label, icon: Icon, end }) => (
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
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-teal-800">
          <div className="px-3 text-xs text-teal-200/60 mb-2 truncate">{user?.email}</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-teal-100/70 hover:bg-teal-800/50 hover:text-paper transition w-full outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <LogOut size={18} aria-hidden />
            লগআউট
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
