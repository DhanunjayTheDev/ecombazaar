import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Printer, Download, Package, MapPin, CreditCard, Clock, User, ChevronDown, RefreshCw, Filter } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import CustomSelect from '../components/CustomSelect';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import logoSrc from '../assets/ssdealsify_logo.png';

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
const STATUS_DOT = {
  Pending:    'bg-yellow-400',
  Processing: 'bg-blue-400',
  Shipped:    'bg-purple-400',
  Delivered:  'bg-green-400',
  Cancelled:  'bg-red-400',
};

// Compact status badge + dropdown for the orders table
function StatusDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const ref = useRef(null);
  
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen(o => !o);
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleOpen}
        className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer select-none ${
          STATUS_COLORS[value] || 'bg-gray-100 text-gray-600 border-gray-200'
        }`}
      >
        {value}
        <ChevronDown size={10} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div 
          className="fixed z-50 w-36 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden"
          style={{ top: `${dropdownPos.top}px`, left: `${dropdownPos.left}px` }}
        >
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => { onChange(s); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-orange-50 transition flex items-center gap-2 ${
                s === value ? 'font-semibold text-orange-600' : 'text-gray-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[s] || 'bg-gray-400'}`} />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── PDF Invoice ───────────────────────────────────────────────────────────
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

function buildInvoiceHTML(order, logoB64) {
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

function printOrder(order) {
  const html = buildInvoiceHTML(order, null);
  const scriptTag = `<script>window.addEventListener('load',function(){setTimeout(function(){window.print()},400)})<\/script>`;
  const fullHtml = html.replace('</body>', scriptTag + '</body>');
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank');
  if (!w) toast.error('Popup blocked — allow popups');
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

async function downloadOrder(order) {
  const toastId = toast.loading('Generating PDF…');
  try {
    await makePDF(order);
    toast.success('Invoice downloaded!', { id: toastId });
  } catch (err) {
    console.error('PDF error:', err);
    toast.error('PDF failed — try again', { id: toastId });
  }
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
          <Filter size={14} className="text-gray-400 shrink-0" />
          <CustomSelect
            value={filter || 'All Statuses'}
            onChange={v => { setFilter(v === 'All Statuses' ? '' : v); setPage(1); }}
            options={['All Statuses', ...STATUS_OPTIONS]}
            placeholder="All Statuses"
            className="min-w-[140px]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="overflow-x-auto overflow-y-visible rounded-2xl">
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
                  <td className="px-4 py-3 overflow-visible relative" onClick={e => e.stopPropagation()}>
                    <StatusDropdown value={order.status} onChange={s => updateStatus(order._id, s)} />
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
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
