import { useState, useEffect } from 'react';
import { TrendingUp, ShoppingBag, Users, Package, Clock, AlertTriangle } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import api from '../utils/api';
import toast from 'react-hot-toast';

const StatCard = ({ icon: Icon, title, value, subtitle, color }) => (
  <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-black text-gray-800">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
  });
  const [ordersStatusData, setOrdersStatusData] = useState([]);
  const [orders, setOrders] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  const STATUS_PIE_COLORS = {
    Pending: '#f59e0b', Processing: '#3b82f6', Shipped: '#8b5cf6', Delivered: '#10b981', Cancelled: '#ef4444',
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch all data in parallel
        const [statsRes, productsRes, usersRes] = await Promise.allSettled([
          api.get('/orders/admin/stats'),
          api.get('/products?limit=1'),
          api.get('/users?limit=1'),
        ]);

        const statsData = statsRes.status === 'fulfilled' ? statsRes.value.data : {};
        const totalProducts = productsRes.status === 'fulfilled' ? (productsRes.value.data.total || 0) : 0;
        const totalUsers = usersRes.status === 'fulfilled' ? (usersRes.value.data.total || 0) : 0;

        if (statsData.success) {
          const newStats = {
            totalRevenue: statsData.totalRevenue || 0,
            totalOrders: statsData.totalOrders || 0,
            pendingOrders: statsData.pendingOrders || 0,
            totalUsers,
            totalProducts,
            lowStockProducts: 0,
          };

          if (statsData.monthlySales && statsData.monthlySales.length > 0) {
            const formatted = statsData.monthlySales.map(m => ({
              month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m._id.month - 1],
              revenue: m.revenue,
              orders: m.orders,
            }));
            setRevenueData(formatted);
            setSalesData(formatted);
          }

          // Build pie chart data from real ordersByStatus
          if (statsData.ordersByStatus?.length > 0) {
            setOrdersStatusData(statsData.ordersByStatus.map(s => ({
              name: s._id,
              value: s.count,
              color: STATUS_PIE_COLORS[s._id] || '#d1d5db',
            })));
          }

          setStats(newStats);
        }
      } catch (err) {
        console.error('Dashboard error:', err);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const statusColor = { pending: 'bg-yellow-100 text-yellow-700', processing: 'bg-blue-100 text-blue-700', shipped: 'bg-purple-100 text-purple-700', delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={TrendingUp} title="Total Revenue" value={`₹${(stats.totalRevenue / 1000).toFixed(0)}K`} subtitle="Lifetime earnings" color="bg-orange-500" />
        <StatCard icon={ShoppingBag} title="Total Orders" value={stats.totalOrders} subtitle="All time" color="bg-blue-500" />
        <StatCard icon={Users} title="Users" value={stats.totalUsers} subtitle="Registered" color="bg-purple-500" />
        <StatCard icon={Package} title="Products" value={stats.totalProducts} subtitle="Active listings" color="bg-green-500" />
        <StatCard icon={Clock} title="Pending" value={stats.pendingOrders} subtitle="Needs action" color="bg-yellow-500" />
        <StatCard icon={AlertTriangle} title="Low Stock" value={stats.lowStockProducts} subtitle="Products" color="bg-red-500" />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Revenue Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${v/1000}K`} />
              <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2.5} dot={{ r: 4, fill: '#f97316' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Orders by Status</h3>
          {ordersStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={ordersStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value">
                  {ordersStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend iconSize={10} formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No order data yet</div>
          )}
        </div>
      </div>

      {/* Monthly Sales Bar + Recent Orders */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Monthly Sales Volume</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {orders.slice(0, 5).map(order => (
              <div key={order._id} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
                  <ShoppingBag size={14} className="text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{order.user?.name}</p>
                  <p className="text-xs text-gray-400">{order.items?.length} item(s)</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold">₹{order.totalAmount?.toLocaleString()}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[order.status] || 'bg-gray-100 text-gray-600'}`}>{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
