import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { User, Package, MapPin, KeyRound, LogOut, Heart } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const links = [
  { to: '/account', label: 'Profile', icon: User, end: true },
  { to: '/account/orders', label: 'My Orders', icon: Package },
  { to: '/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/account/addresses', label: 'Addresses', icon: MapPin },
  { to: '/account/password', label: 'Change Password', icon: KeyRound },
];

export default function AccountLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="container-luxe py-10">
      <h1 className="mb-8 font-serif text-4xl text-textPrimary">My Account</h1>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <aside>
          <div className="rounded-card border border-border bg-card p-6">
            <div className="flex items-center gap-4 border-b border-border pb-5">
              {user?.avatar?.url ? (
                <img src={user.avatar.url} alt={user.name} className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-xl font-semibold text-accent">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium text-textPrimary">{user?.name}</p>
                <p className="truncate text-xs text-textSecondary">{user?.email}</p>
              </div>
            </div>

            <nav className="mt-4 space-y-1">
              {links.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded border-l-2 px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-transparent text-textSecondary hover:bg-surface hover:text-textPrimary'
                    }`
                  }
                >
                  <Icon size={17} /> {label}
                </NavLink>
              ))}
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded border-l-2 border-transparent px-3 py-2.5 text-left text-sm text-error transition-colors hover:bg-surface"
              >
                <LogOut size={17} /> Logout
              </button>
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
