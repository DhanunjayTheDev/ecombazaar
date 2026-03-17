import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, XCircle, RotateCcw, Download } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import logoSrc from '../assets/ssdealsify_logo.png';

const STATUS_STYLE = {
  Pending:    { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  Processing: { color: 'bg-blue-100 text-blue-700',    icon: RotateCcw },
  Shipped:    { color: 'bg-purple-100 text-purple-700', icon: Truck },
  Delivered:  { color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  Cancelled:  { color: 'bg-red-100 text-red-600',      icon: XCircle },
};

// ── PDF Invoice ──────────────────────────────────────────────────────────
let _logoB64 = null;
async function getLogoBase64() {
  if (_logoB64) return _logoB64;
  try {
    const res = await fetch(logoSrc);
    const blob = await res.blob();
    _logoB64 = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
    return _logoB64;
  } catch { return null; }
}

function buildInvoiceHTML(order, logoB64 = null) {
  const addr = order.shippingAddress || {};
  const items = order.items || [];
  const date = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const STATUS_BADGE = { Pending:{bg:'#fef3c7',c:'#92400e'}, Processing:{bg:'#dbeafe',c:'#1e40af'}, Shipped:{bg:'#ede9fe',c:'#5b21b6'}, Delivered:{bg:'#dcfce7',c:'#166534'}, Cancelled:{bg:'#fee2e2',c:'#991b1b'} };
  const badge = STATUS_BADGE[order.status] || { bg:'#f3f4f6', c:'#374151' };
  const subtotal = order.subtotal || items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = order.shippingCharge || order.shippingCost || 0;
  const rows = items.map(i => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #f0f0f0;word-break:break-word"><div style="font-weight:600;color:#1f2937;line-height:1.5">${i.name || '—'}</div></td>
      <td style="padding:10px;border-bottom:1px solid #f0f0f0;text-align:center;width:60px;color:#6b7280">${i.quantity}</td>
      <td style="padding:10px;border-bottom:1px solid #f0f0f0;text-align:right;white-space:nowrap;width:110px">&#8377;${i.price?.toLocaleString()}</td>
      <td style="padding:10px;border-bottom:1px solid #f0f0f0;text-align:right;white-space:nowrap;width:110px;font-weight:600">&#8377;${(i.price * i.quantity).toLocaleString()}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Invoice #${String(order._id).slice(-8).toUpperCase()}</title><style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#374151;background:#fff;padding:28px 32px;width:794px}
.ilab{font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;font-weight:700;margin-bottom:6px}
.ival{font-weight:700;color:#111827;font-size:12px;line-height:1.5;word-break:break-word}
.isub{color:#6b7280;font-size:11px;margin-top:3px;line-height:1.5;word-break:break-word}
</style></head><body>
<table style="width:100%;border-collapse:collapse;border-bottom:3px solid #f97316"><tr>
  <td style="padding-bottom:16px;vertical-align:middle">
    ${logoB64 ? `<img src="${logoB64}" style="height:40px;display:block" alt="Ssdealsify">` : '<div style="font-size:22px;font-weight:700;color:#f97316">Ssdealsify</div>'}
    <div style="font-size:10px;color:#6b7280;margin-top:4px">Tax Invoice</div>
  </td>
  <td style="text-align:right;vertical-align:middle;padding-bottom:16px">
    <div style="font-size:18px;font-weight:700;color:#111">#${String(order._id).slice(-8).toUpperCase()}</div>
    <div style="font-size:11px;color:#6b7280;margin-top:3px">${date}</div>
    <span style="display:inline-block;margin-top:8px;padding:5px 12px;border-radius:20px;font-size:10px;font-weight:600;line-height:1.4;vertical-align:middle;background:${badge.bg};color:${badge.c}">${order.status}</span>
  </td>
</tr></table>
<table style="width:100%;border-collapse:collapse;margin:16px 0 20px"><tr>
  <td style="width:25%;padding:12px 14px;vertical-align:top;background:#f9fafb">
    <div class="ilab">Bill To</div>
    <div class="ival">${order.user?.name || addr.fullName || '—'}</div>
    <div class="isub">${order.user?.email || ''}</div>
    ${(order.user?.phone || addr.phone) ? `<div class="isub">${order.user?.phone || addr.phone}</div>` : ''}
  </td>
  <td style="width:25%;padding:12px 14px;vertical-align:top;background:#f9fafb;border-left:4px solid #fff">
    <div class="ilab">Ship To</div>
    <div class="ival">${addr.fullName || order.user?.name || '—'}</div>
    <div class="isub">${[addr.street, [addr.city,addr.state].filter(Boolean).join(', '), addr.zip].filter(Boolean).join(', ')}</div>
    <div class="isub">${addr.country || 'India'}</div>
  </td>
  <td style="width:25%;padding:12px 14px;vertical-align:top;background:#f9fafb;border-left:4px solid #fff">
    <div class="ilab">Payment</div>
    <div class="ival">${order.paymentMethod || '—'}</div>
    <div class="isub">${order.paymentMethod === 'COD' ? 'Pay on Delivery' : 'Paid Online'}</div>
  </td>
  <td style="width:25%;padding:12px 14px;vertical-align:top;background:#f9fafb;border-left:4px solid #fff">
    <div class="ilab">Status</div>
    <div class="ival" style="color:${order.status==='Delivered'?'#059669':order.status==='Cancelled'?'#dc2626':'#f97316'}">${order.status}</div>
    ${order.deliveredAt ? `<div class="isub">Delivered ${new Date(order.deliveredAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>` : ''}
  </td>
</tr></table>
<table style="width:100%;border-collapse:collapse"><thead><tr style="background:#f3f4f6">
  <th style="padding:9px 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;text-align:left">Item</th>
  <th style="padding:9px 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;text-align:center;width:60px">Qty</th>
  <th style="padding:9px 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;text-align:right;width:110px">Unit Price</th>
  <th style="padding:9px 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;text-align:right;width:110px">Amount</th>
</tr></thead><tbody>${rows}</tbody></table>
<table style="margin-left:auto;border-collapse:collapse;margin-top:6px;min-width:240px">
  <tr><td style="padding:5px 20px 5px 8px;text-align:right;color:#6b7280">Subtotal</td><td style="padding:5px 8px;text-align:right;white-space:nowrap;font-weight:500">&#8377;${subtotal?.toLocaleString()}</td></tr>
  ${order.tax > 0 ? `<tr><td style="padding:5px 20px 5px 8px;text-align:right;color:#6b7280">Tax (10%)</td><td style="padding:5px 8px;text-align:right;white-space:nowrap;font-weight:500">&#8377;${order.tax?.toLocaleString()}</td></tr>` : ''}
  ${shipping > 0 ? `<tr><td style="padding:5px 20px 5px 8px;text-align:right;color:#6b7280">Shipping</td><td style="padding:5px 8px;text-align:right;white-space:nowrap;font-weight:500">&#8377;${shipping.toLocaleString()}</td></tr>` : ''}
  ${order.discount > 0 ? `<tr><td style="padding:5px 20px 5px 8px;text-align:right;color:#059669">Discount</td><td style="padding:5px 8px;text-align:right;white-space:nowrap;color:#059669;font-weight:500">-&#8377;${order.discount?.toLocaleString()}</td></tr>` : ''}
  <tr><td style="padding:10px 20px 5px 8px;text-align:right;border-top:2px solid #e5e7eb;font-size:14px;font-weight:700">Total</td><td style="padding:10px 8px 5px;text-align:right;border-top:2px solid #e5e7eb;font-size:14px;font-weight:700;white-space:nowrap;color:#f97316">&#8377;${order.totalAmount?.toLocaleString()}</td></tr>
</table>
<div style="margin-top:28px;padding-top:14px;border-top:1px solid #e5e7eb;text-align:center;font-size:10px;color:#9ca3af">Thank you for shopping with Ssdealsify &nbsp;&middot;&nbsp; support@ssdealsify.in</div>
</body></html>`;
}

async function makePDF(order) {
  const logoB64 = await getLogoBase64();
  const html = buildInvoiceHTML(order, logoB64);
  const filename = `invoice-${String(order._id).slice(-8).toUpperCase()}.pdf`;
  const iframe = document.createElement('iframe');
  Object.assign(iframe.style, { position:'absolute', top:'-99999px', left:'0', width:'794px', height:'960px', border:'none', visibility:'hidden', pointerEvents:'none' });
  document.body.appendChild(iframe);
  iframe.contentDocument.open();
  iframe.contentDocument.write(html);
  iframe.contentDocument.close();
  await new Promise(r => setTimeout(r, 900));
  const bodyEl = iframe.contentDocument.body;
  iframe.style.height = (bodyEl.scrollHeight + 60) + 'px';
  await new Promise(r => setTimeout(r, 100));
  const canvas = await html2canvas(bodyEl, { scale: 2, useCORS: true, allowTaint: true, logging: false, windowWidth: 794 });
  document.body.removeChild(iframe);
  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgH = (canvas.height * pageW) / canvas.width;
  let heightLeft = imgH, pos = 0;
  pdf.addImage(imgData, 'JPEG', 0, pos, pageW, imgH);
  heightLeft -= pageH;
  while (heightLeft > 0) { pos -= pageH; pdf.addPage(); pdf.addImage(imgData, 'JPEG', 0, pos, pageW, imgH); heightLeft -= pageH; }
  pdf.save(filename);
}

// ── Download Invoice Function ─────────────────────────────────────────────
async function downloadInvoice(order, setDownloading) {
  setDownloading(true);
  try {
    await makePDF(order);
    toast.success('Invoice downloaded!');
  } catch (err) {
    console.error('PDF error:', err);
    toast.error('PDF failed — try again');
  } finally {
    setDownloading(false);
  }
}

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(({ data }) => setOrder(data.order))
      .catch(() => {
        toast.error('Failed to load order details');
        navigate('/orders');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 animate-pulse">
        <div className="h-6 bg-gray-100 rounded w-1/3 mb-6" />
        <div className="space-y-4">
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-3/4" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
    </div>
  );

  if (!order) return (
    <div className="max-w-2xl mx-auto px-4 py-10 text-center">
      <Package size={64} className="mx-auto text-gray-200 mb-4" />
      <h2 className="text-2xl font-bold text-gray-700 mb-2">Order not found</h2>
      <button
        onClick={() => navigate('/orders')}
        className="text-orange-500 hover:text-orange-600 font-medium mt-4"
      >
        Back to Orders
      </button>
    </div>
  );

  const { color, icon: StatusIcon } = STATUS_STYLE[order.status] || STATUS_STYLE.Pending;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium"
        >
          <ArrowLeft size={18} /> Back to Orders
        </button>
        {order.status === 'Delivered' && (
          <button
            onClick={() => downloadInvoice(order, setDownloading)}
            disabled={downloading}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white font-medium px-4 py-2 rounded-lg transition"
          >
            <Download size={16} className={downloading ? 'animate-bounce' : ''} />
            {downloading ? 'Generating PDF…' : 'Download Invoice'}
          </button>
        )}
      </div>

      {/* Order Info Card */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-6">
        {/* Top Section */}
        <div className="px-6 py-5 border-b border-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Order ID</p>
              <p className="font-mono text-lg font-bold text-gray-700">{order._id}</p>
            </div>
            <span className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full ${color}`}>
              <StatusIcon size={14} />
              {order.status}
            </span>
          </div>
        </div>

        {/* Order Details */}
        <div className="px-6 py-4 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-gray-400 text-xs font-medium mb-1">Order Date</p>
            <p className="font-medium text-gray-700">
              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs font-medium mb-1">Payment Method</p>
            <p className="font-medium text-gray-700 capitalize">{order.paymentMethod}</p>
          </div>
          {order.deliveredAt && (
            <div>
              <p className="text-gray-400 text-xs font-medium mb-1">Delivered On</p>
              <p className="font-medium text-gray-700">
                {new Date(order.deliveredAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          )}
          {order.shippedAt && (
            <div>
              <p className="text-gray-400 text-xs font-medium mb-1">Shipped On</p>
              <p className="font-medium text-gray-700">
                {new Date(order.shippedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-50">
          <h3 className="font-bold text-gray-800">Order Items</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {order.items?.map((item, idx) => (
            <div key={idx} className="px-6 py-4 flex gap-4">
              <img
                src={item.image || 'https://images.unsplash.com/photo-1595872018818-97555653a011?w=120'}
                alt={item.name}
                className="w-20 h-20 rounded-lg object-cover border border-gray-100 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-800">{item.name}</h4>
                <p className="text-sm text-gray-500 mb-2">Quantity: {item.quantity}</p>
                <div className="flex gap-2 text-sm">
                  <span className="text-gray-700 font-medium">₹{item.price?.toLocaleString()}</span>
                  {item.discountPrice && item.discountPrice < item.price && (
                    <span className="text-gray-400 line-through">₹{item.discountPrice?.toLocaleString()}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400 mb-1">Subtotal</p>
                <p className="font-bold text-gray-800">₹{(item.price * item.quantity)?.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping Address */}
      {order.shippingAddress && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-50">
            <h3 className="font-bold text-gray-800">Shipping Address</h3>
          </div>
          <div className="px-6 py-4 text-sm text-gray-700">
            <p className="font-medium mb-1">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.address}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
            <p>{order.shippingAddress.country}</p>
            <p className="mt-3 text-gray-500">Phone: {order.shippingAddress.phone}</p>
          </div>
        </div>
      )}

      {/* Price Summary */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-6 py-4">
          <div className="space-y-3 mb-4 pb-4 border-b border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-800 font-medium">₹{order.subtotal?.toLocaleString()}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount</span>
                <span className="text-green-600 font-medium">-₹{order.discount?.toLocaleString()}</span>
              </div>
            )}
            {order.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="text-gray-800 font-medium">₹{order.tax?.toLocaleString()}</span>
              </div>
            )}
            {order.shippingCost > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="text-gray-800 font-medium">₹{order.shippingCost?.toLocaleString()}</span>
              </div>
            )}
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-gray-800">Total Amount</span>
            <span className="font-bold text-lg text-orange-600">₹{order.totalAmount?.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
