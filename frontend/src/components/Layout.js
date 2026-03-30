import React, { useState, useEffect } from 'react';
import axios, { API } from '../lib/api';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Trophy, Users, Calendar, Settings, LogOut, Shield, Menu, X, LayoutDashboard, FileText, Swords, Palette, UserCheck } from 'lucide-react';
import { isAuthenticated, logout } from '../lib/api';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    axios.get(`${API}/theme`).then(res => {
      document.documentElement.setAttribute('data-theme', res.data.theme || 'green');
    }).catch(() => {});
    axios.get(`${API}/auth/approval-status`).then(res => {
      setIsOwner(res.data.is_owner || false);
    }).catch(() => {});
  }, []);


  const isAuth = isAuthenticated();
  const isAdminPage = location.pathname.includes('/admin');

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  const isActive = (path) => {
    if (path === '') return location.pathname === '/' || location.pathname === '/rankings';
    return location.pathname.startsWith(`/${path}`);
  };

  const isAdminActive = (path) => location.pathname === path;

  const navLinks = [
    { to: '/rankings', label: 'Rankings', icon: Trophy },
    { to: '/tournaments', label: 'Torneios', icon: Calendar },
    { to: '/players', label: 'Jogadores', icon: Users },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/admin/tournaments', label: 'Torneios', icon: Calendar },
    { to: '/admin/players', label: 'Jogadores', icon: Users },
    { to: '/admin/results', label: 'Resultados', icon: FileText },
    { to: '/admin/matches', label: 'Partidas', icon: Swords },
    { to: '/admin/layout', label: 'Layout', icon: Palette },
    { to: '/admin/users', label: 'Usuários', icon: UserCheck, ownerOnly: true },
    { to: '/admin/config', label: 'Config', icon: Settings },
  ];

  return (
    <div className="min-h-screen theme-bg">

      {/* Hero */}
      {(location.pathname === '/' || location.pathname === '/rankings') && (
        <div className="relative h-40 sm:h-56 lg:h-64 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/70 to-transparent z-10" />
          <img
            src="https://i0.wp.com/worldsquashchamps.com/wp-content/uploads/world-champs-finals-62-of-74-scaled.jpg?ssl=1"
            alt="Squash"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">SquashRank Pro</h1>
              <p className="text-lg sm:text-xl theme-accent">Federação de Squash do Paraná</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-lg border-b theme-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">

            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
              <img
                src="/fsp.jpeg"
                alt="FSP"
                className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg object-cover shrink-0"
              />
              <div>
                <h1 className="text-sm sm:text-xl font-bold text-white leading-tight">Federação de Squash do Paraná</h1>
                <p className="text-xs theme-accent">Rankings Oficiais</p>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden sm:flex items-center gap-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to}
                  className={`px-3 py-2 text-sm rounded-lg flex items-center gap-1.5 ${isActive(to.slice(1)) ? 'theme-accent-bg text-white' : 'text-gray-300 hover:bg-slate-800'}`}>
                  <Icon className="w-4 h-4" />{label}
                </Link>
              ))}
              {isAuth ? (
                <>
                  <Link to="/admin"
                    className={`px-3 py-2 text-sm rounded-lg flex items-center gap-1.5 ${isAdminPage ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-slate-800'}`}>
                    <Shield className="w-4 h-4" />Admin
                  </Link>
                  <button onClick={handleLogout}
                    className="px-3 py-2 text-sm rounded-lg text-gray-300 hover:bg-red-500/20 hover:text-red-400 flex items-center gap-1.5">
                    <LogOut className="w-4 h-4" />Sair
                  </button>
                </>
              ) : (
                <Link to="/login" className="px-3 py-2 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600">Login</Link>
              )}
            </nav>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden p-2 rounded-lg text-gray-300 hover:bg-slate-800"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile menu dropdown */}
          {menuOpen && (
            <div className="sm:hidden mt-3 pb-2 border-t border-slate-700 pt-3 space-y-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${isActive(to.slice(1)) ? 'theme-accent-bg text-white' : 'text-gray-300 hover:bg-slate-800'}`}>
                  <Icon className="w-4 h-4" />{label}
                </Link>
              ))}
              {isAuth ? (
                <>
                  <Link to="/admin"
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${isAdminPage ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-slate-800'}`}>
                    <Shield className="w-4 h-4" />Admin
                  </Link>
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-red-500/20 hover:text-red-400">
                    <LogOut className="w-4 h-4" />Sair
                  </button>
                </>
              ) : (
                <Link to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm bg-blue-500 text-white">
                  Login
                </Link>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Admin subnav */}
      {isAuth && isAdminPage && (
        <div className="bg-slate-800/50 border-b border-blue-500/20">
          <div className="container mx-auto px-2">
            {/* Mobile: grid 3x2 */}
            <div className="grid grid-cols-3 sm:hidden gap-1 py-2">
              {adminLinks.filter(l => !l.ownerOnly || isOwner).map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to}
                  className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg text-xs transition-colors ${
                    isAdminActive(to) ? 'bg-blue-500 text-white' : 'text-gray-400 hover:bg-slate-700 hover:text-white'
                  }`}>
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </div>
            {/* Desktop: row */}
            <div className="hidden sm:flex space-x-1 py-2">
              {adminLinks.filter(l => !l.ownerOnly || isOwner).map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors ${
                    isAdminActive(to) ? 'bg-blue-500 text-white' : 'text-gray-400 hover:bg-slate-700 hover:text-white'
                  }`}>
                  <Icon className="w-3.5 h-3.5" />{label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/50 border-t theme-border py-6 mt-12 text-center text-gray-400 text-sm">
        © {new Date().getFullYear()} Federação de Squash do Paraná — Powered by SquashRank Pro
      </footer>
    </div>
  );
};

export default Layout;
