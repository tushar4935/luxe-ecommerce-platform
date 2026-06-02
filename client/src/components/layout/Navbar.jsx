import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Search,
  Heart,
  ShoppingBag,
  User as UserIcon,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Package,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/shop', label: 'Shop' },
  { to: '/compare', label: 'Compare' },
  { to: '/account', label: 'Account' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { count: cartCount, setDrawerOpen } = useCart();
  const { count: wishCount } = useWishlist();

  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const lastScroll = useRef(0);
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);

  // Sticky scroll behavior: opaque on scroll, hide on down / show on up.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      setHidden(y > lastScroll.current && y > 200);
      lastScroll.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  // Close the user dropdown on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchValue.trim())}`);
      setSearchOpen(false);
      setMobileOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    setMobileOpen(false);
    navigate('/');
  };

  const CountBadge = ({ n }) =>
    n > 0 ? (
      <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-background">
        {n > 99 ? '99+' : n}
      </span>
    ) : null;

  return (
    <header
      className={`sticky top-0 z-50 transition-transform duration-300 ease-luxe ${
        hidden ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <div
        className={`glass border-b transition-all duration-300 ${
          scrolled ? 'border-border bg-background/95' : 'border-transparent'
        }`}
      >
        <nav className="container-luxe flex h-16 items-center justify-between gap-4">
          {/* Left: mobile toggle + logo */}
          <div className="flex items-center gap-3">
            <button
              className="text-textPrimary md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <Link to="/" className="font-serif text-2xl font-bold tracking-wider text-accent">
              LUXE
            </Link>
          </div>

          {/* Center: nav links */}
          <div className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Admin
              </NavLink>
            )}
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Inline expanding search */}
            <div className="hidden items-center sm:flex">
              {searchOpen ? (
                <form onSubmit={submitSearch} className="animate-fade-in">
                  <input
                    ref={searchRef}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onBlur={() => !searchValue && setSearchOpen(false)}
                    placeholder="Search products…"
                    className="w-44 rounded border border-border bg-card px-3 py-1.5 text-sm text-textPrimary placeholder:text-textMuted focus:border-accent focus:outline-none md:w-56"
                  />
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search"
                  className="text-textPrimary transition-colors hover:text-accent"
                >
                  <Search size={20} />
                </button>
              )}
            </div>

            <Link
              to="/wishlist"
              aria-label="Wishlist"
              className="relative text-textPrimary transition-colors hover:text-accent"
            >
              <Heart size={20} />
              <CountBadge n={wishCount} />
            </Link>

            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Cart"
              className="relative text-textPrimary transition-colors hover:text-accent"
            >
              <ShoppingBag size={20} />
              <CountBadge n={cartCount} />
            </button>

            {/* User */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => (isAuthenticated ? setUserMenuOpen((o) => !o) : navigate('/login'))}
                aria-label="Account"
                className="flex items-center text-textPrimary transition-colors hover:text-accent"
              >
                {isAuthenticated && user?.avatar?.url ? (
                  <img
                    src={user.avatar.url}
                    alt={user.name}
                    className="h-7 w-7 rounded-full object-cover ring-1 ring-border"
                  />
                ) : (
                  <UserIcon size={20} />
                )}
              </button>

              {isAuthenticated && userMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-card border border-border bg-card shadow-modal animate-slide-up">
                  <div className="border-b border-border px-4 py-3">
                    <p className="truncate text-sm font-medium text-textPrimary">{user.name}</p>
                    <p className="truncate text-xs text-textSecondary">{user.email}</p>
                  </div>
                  <div className="py-1 text-sm">
                    <Link
                      to="/account"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-textSecondary hover:bg-surface hover:text-accent"
                    >
                      <UserIcon size={16} /> My Account
                    </Link>
                    <Link
                      to="/account/orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-textSecondary hover:bg-surface hover:text-accent"
                    >
                      <Package size={16} /> Orders
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-textSecondary hover:bg-surface hover:text-accent"
                      >
                        <LayoutDashboard size={16} /> Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-error hover:bg-surface"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile full-screen overlay nav */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-background animate-fade-in" />
          <div className="relative flex h-full flex-col bg-background animate-slide-in-right">
            <div className="flex h-16 items-center justify-between px-4">
              <Link to="/" onClick={() => setMobileOpen(false)} className="font-serif text-2xl font-bold text-accent">
                LUXE
              </Link>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="text-textPrimary">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={submitSearch} className="px-4 pb-4">
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search products…"
                className="input"
              />
            </form>

            <div className="flex flex-col gap-1 px-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `rounded px-3 py-3 font-serif text-xl ${
                      isActive ? 'text-accent' : 'text-textPrimary'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <NavLink
                to="/wishlist"
                onClick={() => setMobileOpen(false)}
                className="rounded px-3 py-3 font-serif text-xl text-textPrimary"
              >
                Wishlist
              </NavLink>
              {isAdmin && (
                <NavLink
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="rounded px-3 py-3 font-serif text-xl text-textPrimary"
                >
                  Admin
                </NavLink>
              )}
            </div>

            <div className="mt-auto border-t border-border p-4">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-error"
                >
                  <LogOut size={18} /> Logout
                </button>
              ) : (
                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-primary w-full">
                  Login / Register
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
