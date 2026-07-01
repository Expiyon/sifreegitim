import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { useState } from 'react';

export default function Sidebar({ role }: { role: string }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

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
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden sticky top-0 z-50 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-4 py-3">
        <img src="/logo.png" alt="Şifre Akademi" className="h-10 object-contain" />
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-navy-900 rounded-lg hover:bg-slate-100" aria-label="Menü">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <>
          <button
            type="button"
            aria-hidden
            className="md:hidden fixed inset-0 bg-black/30 z-40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="md:hidden fixed top-[3.25rem] left-0 right-0 bg-[#f8fafc] border-b border-[#e2e8f0] z-50 px-4 py-4 shadow-lg">
            <nav className="space-y-1">
              {links.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  end
                  onClick={() => setMobileOpen(false)}
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
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 transition-colors rounded-xl text-sm font-medium mt-2"
            >
              <LogOut className="w-5 h-5" />
              Çıkış Yap
            </button>
          </div>
        </>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#f8fafc] border-r border-[#e2e8f0] h-screen flex-col p-6 sticky top-0">
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
    </>
  );
}
