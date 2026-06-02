import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DollarSign, ShoppingCart, Users, Package } from 'lucide-react';
import StatsCard from '../../components/admin/StatsCard';
import { StatusBadge } from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { adminApi } from '../../api/userApi';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

const STATUS_COLORS = {
  processing: '#c9a84c',
  confirmed: '#e8c870',
  shipped: '#a8893c',
  delivered: '#22c55e',
  cancelled: '#ef4444',
  returned: '#888888',
};

const tooltipStyle = {
  background: '#1a1a1a',
  border: '1px solid #2a2a2a',
  borderRadius: 8,
  color: '#f5f5f5',
  fontSize: 12,
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .dashboard()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }
  if (!data) return <p className="text-textSecondary">Failed to load dashboard.</p>;

  const { stats, revenueChart, statusDistribution, topProducts, recentOrders } = data;

  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl text-textPrimary">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={DollarSign} accent trend={`${stats.totalOrders} total orders`} />
        <StatsCard title="Orders Today" value={stats.ordersToday} icon={ShoppingCart} />
        <StatsCard title="New Users Today" value={stats.newUsersToday} icon={Users} />
        <StatsCard title="Active Products" value={stats.activeProducts} icon={Package} />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Revenue line */}
        <div className="rounded-card border border-border bg-card p-6 lg:col-span-2">
          <h2 className="mb-4 font-serif text-lg text-textPrimary">Revenue (last 12 months)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="label" stroke="#888888" fontSize={11} tickLine={false} />
              <YAxis stroke="#888888" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(v)} />
              <Line type="monotone" dataKey="revenue" stroke="#c9a84c" strokeWidth={2} dot={{ r: 3, fill: '#c9a84c' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status doughnut */}
        <div className="rounded-card border border-border bg-card p-6">
          <h2 className="mb-4 font-serif text-lg text-textPrimary">Order Status</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={statusDistribution}
                dataKey="count"
                nameKey="status"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
              >
                {statusDistribution.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#888888'} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            {statusDistribution.map((s) => (
              <span key={s.status} className="flex items-center gap-1.5 text-xs text-textSecondary">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS[s.status] }} />
                <span className="capitalize">{s.status}</span> ({s.count})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Top products + recent orders */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-card border border-border bg-card p-6">
          <h2 className="mb-4 font-serif text-lg text-textPrimary">Top 5 Products</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topProducts.map((p) => ({ name: p.name.split(' ').slice(0, 2).join(' '), sold: p.sold }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis stroke="#888888" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="sold" fill="#c9a84c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-card border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg text-textPrimary">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs text-accent hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentOrders.slice(0, 6).map((order) => (
              <Link
                key={order._id}
                to={`/admin/orders/${order._id}`}
                className="flex items-center justify-between rounded border border-border px-3 py-2.5 transition-colors hover:border-accent/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-textPrimary">{order.orderNumber}</p>
                  <p className="truncate text-xs text-textSecondary">
                    {order.user?.name || 'Guest'} · {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-accent">{formatCurrency(order.totalAmount)}</span>
                  <StatusBadge status={order.orderStatus} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
