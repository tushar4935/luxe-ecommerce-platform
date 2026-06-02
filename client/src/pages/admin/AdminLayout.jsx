import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { useAuth } from '../../hooks/useAuth';

export default function AdminLayout() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden w-64 flex-shrink-0 lg:block">
        <div className="fixed h-screen w-64">
          <AdminSidebar />
        </div>
      </div>

      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 animate-slide-in-right">
            <AdminSidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-surface px-4 lg:px-8">
          <button onClick={() => setOpen(true)} className="text-textPrimary lg:hidden" aria-label="Open menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-textPrimary">{user?.name}</p>
              <p className="text-xs text-textSecondary">Administrator</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
