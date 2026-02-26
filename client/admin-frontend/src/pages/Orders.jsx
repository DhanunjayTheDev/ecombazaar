import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Printer, Download, Package, MapPin, CreditCard, Clock, User, ChevronDown, RefreshCw, Filter } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const STATUS_COLORS = {
  Pending:    'bg-yellow-100 text-yellow-700 border-yellow-200',
  Processing: 'bg-blue-100 text-blue-700 border-blue-200',
  Shipped:    'bg-purple-100 text-purple-700 border-purple-200',
  Delivered:  'bg-green-100 text-green-700 border-green-200',
  Cancelled:  'bg-red-100 text-red-700 border-red-200',
};
const STATUS_TIMELINE = {
  Pending:    0,
  Processing: 1,
  Shipped:    2,
  Delivered:  3,
};

// ── Print / Download helper ───────────────────────────────────────────────
function buildInvoiceHTML(order) {
  const addr = order.shippingAddress || {};
  const items = order.items || [];
  const history = order.statusHistory || [];
  const date = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const rows = items.map(i => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0">
        <div style="font-weight:600;color:#1f2937">${i.name}</div>
      </td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:center">${i.quantity}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:right">₹${i.price?.toLocaleString()}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600">₹${(i.price * i.quantity).toLocaleString()}</td>
    </tr>`).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8" />
  <title>Invoice – ${String(order._id).slice(-8).toUpperCase()}</title>
  <style>
    body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:32px;color:#374151;font-size:13px}
    h1{margin:0;font-size:22px;color:#f97316}h2{font-size:13px;margin:0 0 4px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:2px solid #f97316}
    .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:#fef3c7;color:#92400e}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px}
    .box{background:#f9fafb;border-radius:10px;padding:14px}
    .box label{display:block;font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}
    .box .val{font-weight:600;color:#111827}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}
    thead tr{background:#f3f4f6}
    th{padding:10px 8px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280;letter-spacing:.05em}
    th:last-child,th:nth-child(3),th:nth-child(2){text-align:right}th:nth-child(2){text-align:center}
    .total-row{font-size:15px;font-weight:700;color:#f97316}
    .footer{margin-top:28px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center}
    @media print{body{padding:16px}}
  </style>
</head><body>
  <div class="header">
    <div><h1>EcomBazaar</h1><p style="margin:4px 0 0;color:#6b7280">Tax Invoice</p></div>
    <div style="text-align:right">
      <p style="font-size:18px;font-weight:700;color:#111">#${String(order._id).slice(-8).toUpperCase()}</p>
      <p style="color:#6b7280;margin:2px 0">${date}</p>
      <span class="badge">${order.status}</span>
    </div>
  </div>

  <div class="grid2">
    <div class="box">
      <label>Bill To</label>
      <div class="val">${order.user?.name || addr.fullName || '—'}</div>
      <div>${order.user?.email || ''}</div>
      ${order.user?.phone || addr.phone ? `<div>${order.user?.phone || addr.phone}</div>` : ''}
    </div>
    <div class="box">
      <label>Ship To</label>
      <div class="val">${addr.fullName || order.user?.name || '—'}</div>
      <div>${addr.street || ''}</div>
      <div>${[addr.city, addr.state].filter(Boolean).join(', ')} ${addr.zip || ''}</div>
      <div>${addr.country || 'India'}</div>
    </div>
    <div class="box">
      <label>Payment Method</label>
      <div class="val">${order.paymentMethod || '—'}</div>
      ${order.paymentId ? `<div style="font-size:11px;color:#9ca3af">ID: ${order.paymentId}</div>` : ''}
    </div>
    <div class="box">
      <label>Payment Status</label>
      <div class="val" style="color:${order.paymentMethod === 'COD' ? '#92400e' : '#065f46'}">
        ${order.paymentMethod === 'COD' ? 'Pay on Delivery' : 'Paid Online'}
      </div>
    </div>
  </div>

  <table>
    <thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Amount</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr><td colspan="3" style="padding:8px;text-align:right;color:#6b7280">Subtotal</td><td style="padding:8px;text-align:right">₹${order.subtotal?.toLocaleString() || '—'}</td></tr>
      <tr><td colspan="3" style="padding:8px;text-align:right;color:#6b7280">Tax (10%)</td><td style="padding:8px;text-align:right">₹${order.tax?.toLocaleString() || '—'}</td></tr>
      <tr><td colspan="3" style="padding:8px;text-align:right;color:#6b7280">Shipping</td><td style="padding:8px;text-align:right">₹${order.shippingCharge?.toLocaleString() || '50'}</td></tr>
      ${order.discount > 0 ? `<tr><td colspan="3" style="padding:8px;text-align:right;color:#059669">Discount</td><td style="padding:8px;text-align:right;color:#059669">−₹${order.discount?.toLocaleString()}</td></tr>` : ''}
      <tr class="total-row"><td colspan="3" style="padding:10px 8px;text-align:right">Total</td><td style="padding:10px 8px;text-align:right">₹${order.totalAmount?.toLocaleString()}</td></tr>
    </tfoot>
  </table>

  ${history.length > 0 ? `
  <div style="margin-top:20px">
    <h2 style="margin-bottom:10px;color:#374151">Order History</h2>
    <table style="width:100%">
      ${history.map(h => `<tr><td style="padding:5px 8px;color:#6b7280;font-size:11px">${new Date(h.updatedAt || h.date || h.createdAt || Date.now()).toLocaleString('en-IN')}</td><td style="padding:5px 8px;font-weight:600">${h.status}</td><td style="padding:5px 8px;color:#9ca3af">${h.note || ''}</td></tr>`).join('')}
    </table>
  </div>` : ''}

  <div class="footer">Thank you for shopping with EcomBazaar · support@ecombazaar.com</div>
</body></html>`;
}

function printOrder(order) {
  const w = window.open('', '_blank', 'width=900,height=700');
  w.document.write(buildInvoiceHTML(order));
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 500);
}

function downloadOrder(order) {
  const w = window.open('', '_blank', 'width=900,height=700');
  const html = buildInvoiceHTML(order);
  w.document.write(html);
  w.document.close();
  w.focus();
  // Trigger print dialog (user can "Save as PDF" from dialog)
  setTimeout(() => {
    w.print();
    toast.success('Use "Save as PDF" in the print dialog to download');
  }, 500);
}

// ── Status Pill ───────────────────────────────────────────────────────────
function StatusPill({ status }) {
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {status}
    </span>
  );
}

// ── Order Detail Panel ────────────────────────────────────────────────────
function OrderDetail({ order, onClose, onStatusChange }) {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const panelRef = useRef(null);

  const handleStatusChange = async (status) => {
    setUpdatingStatus(true);
    await onStatusChange(order._id, status);
    setUpdatingStatus(false);
  };

  const addr = order.shippingAddress || {};
  const timelineStep = STATUS_TIMELINE[order.status] ?? -1;
  const timelineSteps = ['Pending', 'Processing', 'Shipped', 'Delivered'];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div ref={panelRef} className="w-full max-w-2xl bg-white h-full overflow-y-auto flex flex-col shadow-2xl">
        {/* Panel Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-gray-800 text-lg">Order #{String(order._id).slice(-8).toUpperCase()}</h2>
              <StatusPill status={order.status} />
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => printOrder(order)} className="flex items-center gap-1.5 border border-gray-200 hover:border-orange-300 hover:text-orange-500 text-gray-500 text-xs font-medium px-3 py-2 rounded-xl transition">
              <Printer size={13} /> Print
            </button>
            <button onClick={() => downloadOrder(order)} className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium px-3 py-2 rounded-xl transition">
              <Download size={13} /> Download PDF
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
              <X size={16} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Timeline */}
          {order.status !== 'Cancelled' && (
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Order Progress</p>
              <div className="flex items-center">
                {timelineSteps.map((step, i) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                        i <= timelineStep ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'
                      }`}>{i < timelineStep ? '✓' : i + 1}</div>
                      <p className={`text-xs mt-1 font-medium text-center ${i <= timelineStep ? 'text-orange-600' : 'text-gray-400'}`}>{step}</p>
                    </div>
                    {i < timelineSteps.length - 1 && (
                      <div className={`h-1 flex-1 mx-1 rounded transition-all ${i < timelineStep ? 'bg-orange-400' : 'bg-gray-200'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {order.status === 'Cancelled' && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
              <p className="text-red-600 font-semibold">This order has been cancelled</p>
            </div>
          )}

          {/* Update Status */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Update Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(s => (
                <button key={s} disabled={updatingStatus} onClick={() => handleStatusChange(s)}
                  className={`text-xs px-4 py-1.5 rounded-full font-semibold border transition ${
                    order.status === s
                      ? STATUS_COLORS[s] + ' ring-2 ring-offset-1 ring-orange-300'
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-orange-300 hover:text-orange-500'
                  } disabled:opacity-50`}
                >{updatingStatus && order.status !== s ? '…' : s}</button>
              ))}
            </div>
          </div>

          {/* Info Grid: Customer + Shipping + Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center">
                  <User size={12} className="text-orange-500" />
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Customer</p>
              </div>
              <p className="font-bold text-gray-800 text-sm">{order.user?.name || '—'}</p>
              <p className="text-xs text-gray-500 mt-0.5 break-all">{order.user?.email}</p>
              {(order.user?.phone || addr.phone) && (
                <p className="text-xs text-gray-500 mt-0.5">{order.user?.phone || addr.phone}</p>
              )}
            </div>

            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MapPin size={12} className="text-blue-500" />
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Shipping</p>
              </div>
              {addr.fullName && <p className="font-bold text-gray-800 text-sm">{addr.fullName}</p>}
              {addr.phone && <p className="text-xs text-gray-500">{addr.phone}</p>}
              <p className="text-xs text-gray-600 mt-1">{addr.street}</p>
              <p className="text-xs text-gray-600">{[addr.city, addr.state].filter(Boolean).join(', ')}{addr.zip ? ` — ${addr.zip}` : ''}</p>
              <p className="text-xs text-gray-500">{addr.country || 'India'}</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                  <CreditCard size={12} className="text-green-500" />
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Payment</p>
              </div>
              <p className="font-bold text-gray-800 text-sm">{order.paymentMethod || '—'}</p>
              <div className={`mt-1 inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                order.paymentMethod === 'COD' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
              }`}>
                {order.paymentMethod === 'COD' ? 'Pay on Delivery' : '✓ Paid Online'}
              </div>
              {order.paymentId && (
                <p className="text-xs text-gray-400 mt-1 break-all">ID: {order.paymentId}</p>
              )}
              {order.couponCode && (
                <p className="text-xs text-green-600 mt-1">Coupon: {order.couponCode}</p>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Package size={14} className="text-orange-500" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Items ({order.items?.length})</p>
            </div>
            <div className="divide-y divide-gray-50">
              {(order.items || []).map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package size={18} className="text-gray-300" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">₹{item.price?.toLocaleString()} × {item.quantity}</p>
                  </div>
                  <p className="font-bold text-gray-800 text-sm shrink-0">₹{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Price Summary */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Price Summary</p>
            {[
              ['Subtotal', `₹${order.subtotal?.toLocaleString() || '—'}`],
              ['Tax (10%)', `₹${order.tax?.toLocaleString() || '—'}`],
              ['Shipping', `₹${order.shippingCharge?.toLocaleString() ?? 50}`],
              ...(order.discount > 0 ? [['Discount', `−₹${order.discount?.toLocaleString()}`, 'text-green-600']] : []),
            ].map(([label, val, cls]) => (
              <div key={label} className="flex justify-between text-gray-600">
                <span>{label}</span>
                <span className={cls}>{val}</span>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-2 mt-1 flex justify-between font-black text-gray-900 text-base">
              <span>Total</span>
              <span className="text-orange-600">₹{order.totalAmount?.toLocaleString()}</span>
            </div>
          </div>

          {/* Status History */}
          {order.statusHistory?.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={14} className="text-gray-400" />
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Status History</p>
              </div>
              <div className="relative pl-4">
                <div className="absolute left-0 top-1 bottom-0 w-px bg-gray-100" />
                {[...order.statusHistory].reverse().map((h, i) => (
                  <div key={i} className="relative pl-4 pb-4 last:pb-0">
                    <div className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full bg-orange-400" />
                    <p className="font-semibold text-sm text-gray-800">{h.status}</p>
                    {h.note && <p className="text-xs text-gray-400">{h.note}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {(h.updatedAt || h.date) ? new Date(h.updatedAt || h.date).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Orders Page ──────────────────────────────────────────────────────
export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchOrders = useCallback(async (p = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: p, limit: 20 });
      if (filter) params.append('status', filter);
      const { data } = await api.get(`/orders?${params}`);
      if (data.success) {
        setOrders(data.orders || []);
        setTotal(data.total || 0);
        setTotalPages(data.pages || 1);
      }
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchOrders(page); }, [fetchOrders, page]);

  const updateStatus = async (orderId, status) => {
    try {
      const { data } = await api.put(`/orders/${orderId}/status`, { status });
      if (data.success) {
        setOrders(prev => prev.map(o => o._id === orderId ? data.order : o));
        if (selectedOrder?._id === orderId) setSelectedOrder(data.order);
        toast.success(`Status → ${status}`);
      }
    } catch { toast.error('Failed to update status'); }
  };

  const clientFiltered = orders.filter(o =>
    !search ||
    o._id.toLowerCase().includes(search.toLowerCase()) ||
    o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Orders</h1>
          <p className="text-sm text-gray-500">{total} total orders</p>
        </div>
        <button onClick={() => fetchOrders(page)} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition" title="Refresh">
          <RefreshCw size={15} className={loading ? 'animate-spin text-orange-500' : 'text-gray-400'} />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2 gap-2 flex-1">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search order ID, customer name or email…"
            className="outline-none text-sm flex-1 bg-transparent" />
          {search && <button onClick={() => setSearch('')}><X size={13} className="text-gray-300" /></button>}
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none bg-white">
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Order ID', 'Customer', 'Items', 'Payment', 'Total', 'Date', 'Status', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 8 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded" /></td>)}
                </tr>
              )) : clientFiltered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No orders found</td></tr>
              ) : clientFiltered.map(order => (
                <tr key={order._id} className="hover:bg-orange-50/30 transition group cursor-pointer" onClick={() => setSelectedOrder(order)}>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-bold text-gray-700">#{String(order._id).slice(-8).toUpperCase()}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-800 text-xs">{order.user?.name || '—'}</p>
                    <p className="text-xs text-gray-400">{order.user?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{order.items?.length || 1} item(s)</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      order.paymentMethod === 'COD' ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'
                    }`}>{order.paymentMethod || '—'}</span>
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-800 text-sm">₹{order.totalAmount?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <select value={order.status}
                      onChange={e => updateStatus(order._id, e.target.value)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer appearance-none outline-none ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => setSelectedOrder(order)} className="p-1.5 hover:bg-gray-100 rounded-lg transition" title="View Details">
                        <ChevronDown size={13} className="text-gray-400" />
                      </button>
                      <button onClick={() => printOrder(order)} className="p-1.5 hover:bg-gray-100 rounded-lg transition" title="Print">
                        <Printer size={13} className="text-gray-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Page {page} of {totalPages} · {total} orders
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:border-orange-300 transition">Previous</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:border-orange-300 transition">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Side Panel */}
      {selectedOrder && (
        <OrderDetail
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={updateStatus}
        />
      )}
    </div>
  );
}
