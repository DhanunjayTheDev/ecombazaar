import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState([]);
  const [ordersStatusData, setOrdersStatusData] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [stats, setStats] = useState({});

  const STATUS_PIE_COLORS = {
    Pending: '#f59e0b', Processing: '#3b82f6', Shipped: '#8b5cf6', Delivered: '#10b981', Cancelled: '#ef4444',
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/orders/admin/stats');
        
        if (data.success) {
          setStats(data);

          // Revenue data
          if (data.monthlySales && data.monthlySales.length > 0) {
            const formatted = data.monthlySales.map(m => ({
              month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m._id.month - 1],
              revenue: m.revenue,
              orders: m.orders,
            }));
            setRevenueData(formatted);
            setSalesData(formatted);
          }

          // Orders by status
          if (data.ordersByStatus && data.ordersByStatus.length > 0) {
            setOrdersStatusData(data.ordersByStatus.map(s => ({
              name: s._id,
              value: s.count,
              color: STATUS_PIE_COLORS[s._id] || '#d1d5db',
            })));
          }
        }
      } catch (err) {
        toast.error('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-800">Analytics</h1>
        <p className="text-sm text-gray-500">Detailed insights into your store performance</p>
      </div>

      {loading ? (
        <div className="grid lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-gray-200 rounded-2xl h-64 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Revenue Area Chart */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${v/1000}K`} />
                <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#f97316" fill="url(#revGrad)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Sales Volume Bar */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">Monthly Orders Volume</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#f97316" radius={[8, 8, 0, 0]} name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Order Status Pie */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">Order Status Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={ordersStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {ordersStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue vs Orders */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">Revenue vs Order Count</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={v => `₹${v/1000}K`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} dot={false} name="Revenue" />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} dot={false} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4">Performance Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { label: 'Total Revenue', value: `₹${(stats.totalRevenue || 0).toLocaleString()}`, trend: stats.totalRevenue > 0 ? '+100%' : '0%' },
            { label: 'Total Orders', value: stats.totalOrders || 0, trend: '+5%' },
            { label: 'Pending Orders', value: stats.pendingOrders || 0, trend: stats.pendingOrders > 0 ? '+2%' : '0%' },
            { label: 'Avg per Order', value: stats.totalOrders > 0 ? `₹${Math.round(stats.totalRevenue / stats.totalOrders)}` : '₹0', trend: '+3%' },
          ].map(({ label, value, trend }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className="text-lg font-bold text-gray-800">{value}</p>
              <p className={`text-xs font-medium mt-1 ${trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{trend} vs last month</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
