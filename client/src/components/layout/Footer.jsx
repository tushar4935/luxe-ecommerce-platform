import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook, Youtube, Send } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function Footer() {
  const [email, setEmail] = useState('');

  const subscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    toast.success('Subscribed — welcome to the list!');
    setEmail('');
  };

  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-luxe grid grid-cols-1 gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div>
          <Link to="/" className="font-serif text-2xl font-bold tracking-wider text-accent">
            LUXE
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-textSecondary">
            Modern luxury, thoughtfully curated. Timeless pieces designed for the way you live today.
          </p>
          <div className="mt-6 flex gap-3">
            {[Instagram, Twitter, Facebook, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="social link"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-textSecondary transition-colors hover:border-accent hover:text-accent"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        {/* Shop */}
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-textPrimary">Shop</h4>
          <ul className="space-y-2.5 text-sm">
            {[
              { label: 'All Products', to: '/shop' },
              { label: 'New Arrivals', to: '/shop?sort=newest' },
              { label: 'Best Sellers', to: '/shop?sort=popular' },
              { label: 'Top Rated', to: '/shop?sort=top-rated' },
              { label: 'Wishlist', to: '/wishlist' },
            ].map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="text-textSecondary transition-colors hover:text-accent">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Account */}
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-textPrimary">Account</h4>
          <ul className="space-y-2.5 text-sm">
            {[
              { label: 'My Account', to: '/account' },
              { label: 'Orders', to: '/account/orders' },
              { label: 'Addresses', to: '/account/addresses' },
              { label: 'Cart', to: '/cart' },
              { label: 'Login / Register', to: '/login' },
            ].map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="text-textSecondary transition-colors hover:text-accent">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-textPrimary">
            Newsletter
          </h4>
          <p className="mb-4 text-sm text-textSecondary">
            Subscribe for early access to new collections and members-only offers.
          </p>
          <form onSubmit={subscribe} className="flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className="input flex-1 py-2.5 text-sm"
            />
            <button
              type="submit"
              aria-label="Subscribe"
              className="flex items-center justify-center rounded bg-accent px-4 text-background transition-colors hover:bg-accent-light"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="container-luxe flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="text-xs text-textMuted">
            © {new Date().getFullYear()} LUXE. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-textMuted">
            {['Visa', 'Mastercard', 'Amex', 'PayPal'].map((p) => (
              <span
                key={p}
                className="rounded-sm border border-border px-2 py-1 text-[10px] font-medium uppercase tracking-wider"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
