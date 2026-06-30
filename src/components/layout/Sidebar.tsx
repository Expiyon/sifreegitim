import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

export default function Sidebar({ role }: { role: string }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const studentLinks = [
    { name: 'Kontrol Paneli', icon: LayoutDashboard, path: '/student' },
  ];

  const adminLinks = [
    { name: 'Kontrol Paneli', icon: LayoutDashboard, path: '/admin' },
  ];

  const links = role === 'admin' ? adminLinks : studentLinks;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-[#f8fafc] border-r border-[#e2e8f0] h-screen flex flex-col p-6 sticky top-0">
      <div className="mb-10 pt-2">
        <img src="/logo.png" alt="Şifre Akademi" className="h-28 object-contain" />
      </div>

      <nav className="flex-1 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            end
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm",
                isActive 
                  ? "bg-white text-navy-900 shadow-sm border border-slate-100" 
                  : "text-slate-500 hover:text-navy-900 hover:bg-slate-100"
              )
            }
          >
            <link.icon className="w-5 h-5" />
            {link.name}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 transition-colors rounded-xl text-sm font-medium"
        >
          <LogOut className="w-5 h-5" />
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
