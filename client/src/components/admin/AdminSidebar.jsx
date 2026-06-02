import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tags,
  Star,
  Ticket,
  Home,
} from 'lucide-react';

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
];

export default function AdminSidebar({ onNavigate }) {
  return (
    <aside className="flex h-full flex-col border-r border-border bg-surface">
      <div className="border-b border-border px-6 py-5">
        <Link to="/" className="font-serif text-2xl font-bold tracking-wider text-accent">
          LUXE
        </Link>
        <p className="mt-1 text-xs uppercase tracking-widest text-textMuted">Admin Panel</p>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded border-l-2 px-3 py-2.5 text-sm transition-colors duration-300 ${
                isActive
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-transparent text-textSecondary hover:bg-card hover:text-textPrimary'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-4">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded px-3 py-2.5 text-sm text-textSecondary transition-colors hover:text-accent"
        >
          <Home size={18} /> Back to Store
        </Link>
      </div>
    </aside>
  );
}
