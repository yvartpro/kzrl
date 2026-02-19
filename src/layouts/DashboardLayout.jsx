import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Package, ShoppingCart, DollarSign, BarChart3, Settings, Menu, X, Wallet, LogOut, User, BookOpen, Store as StoreIcon, Briefcase, ClipboardList } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';

const navigation = [
  { name: 'Tableau de Bord', href: '/', icon: Home },
  { name: 'Produits', href: '/products', icon: Package },
  { name: 'Achats', href: '/purchases', icon: ShoppingCart },
  { name: 'Ventes', href: '/sales', icon: DollarSign },
  { name: 'Caisse & Dépenses', href: '/cash-expenses', icon: Wallet },
  { name: 'Inventaire Casiers ✨', href: '/inventory', icon: ClipboardList, roles: ['ADMIN', 'MANAGER'] },
  { name: 'Inventaire Matériel', href: '/equipment-inventory', icon: Briefcase },
  { name: 'Salaires', href: '/salaries', icon: User, roles: ['ADMIN', 'MANAGER'] },
  { name: 'Rapports', href: '/reports', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },
  { name: 'Gestion Utilisateurs', href: '/users', icon: User, roles: ['ADMIN', 'MANAGER'] },
  { name: 'Paramètres', href: '/settings', icon: Settings, roles: ['ADMIN'] },
  { name: 'Documentation', href: '/documentation', icon: BookOpen },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { stores, currentStore, changeStore } = useStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNavigation = navigation.filter(item =>
    !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-2xl animate-fade-in">
            <div className="flex h-16 items-center justify-between px-6 border-b">
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">KZRL Manager</h1>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="h-6 w-6 text-gray-400" />
              </button>
            </div>

            <div className="px-4 py-4 border-b bg-gray-50">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Service / Magasin</label>
              <div className="relative">
                <select
                  value={currentStore?.id || ''}
                  onChange={(e) => changeStore(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none transition-all"
                >
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                  {stores.length === 0 && <option value="">Aucun magasin</option>}
                </select>
                <StoreIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
            <nav className="mt-6 px-3">
              {filteredNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors ${isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <item.icon className={`h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="absolute bottom-0 w-full p-4 border-t bg-gray-50">
              <div className="flex items-center gap-3 mb-4 px-2">
                <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{user?.username}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col border-r bg-white shadow-sm">
        <div className="flex h-16 items-center px-6 border-b">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 underline">KZRL Manager v2</h1>
        </div>

        <div className="px-4 py-4 border-b bg-gray-50">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Service / Magasin</label>
          <div className="relative">
            <select
              value={currentStore?.id || ''}
              onChange={(e) => changeStore(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none transition-all"
            >
              {stores.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
              {stores.length === 0 && <option value="">Aucun magasin</option>}
            </select>
            <StoreIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <nav className="mt-6 px-3">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors ${isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold shadow-sm">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.username}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Déconnexion
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b bg-white/80 backdrop-blur-md px-4 shadow-sm sm:px-6 lg:px-8">
          <button
            type="button"
            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-sm text-gray-500 font-medium">
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
            <div className="h-6 w-px bg-gray-200 hidden sm:block" />
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-gray-900">{user?.username}</p>
                <p className="text-xs text-indigo-600 font-medium uppercase">{user?.role}</p>
              </div>
              <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        <main className="py-6 px-4 sm:px-6 lg:px-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
