import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, GraduationCap, Layers, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/students', label: 'Students', icon: GraduationCap },
  { to: '/dashboard/teachers', label: 'Teachers', icon: Users },
  { to: '/dashboard/batches', label: 'Batches', icon: Layers },
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
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-teal-800 text-paper'
                    : 'text-teal-100/70 hover:bg-teal-800/50 hover:text-paper'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-teal-800">
          <div className="px-3 text-xs text-teal-200/60 mb-2 truncate">{user?.email}</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-teal-100/70 hover:bg-teal-800/50 hover:text-paper transition w-full"
          >
            <LogOut size={18} />
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
