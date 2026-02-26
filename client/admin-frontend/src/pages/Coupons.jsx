import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const defaultForm = { code: '', discountType: 'percentage', discountValue: '', expiryDate: '', minOrderAmount: '', isActive: true };

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/coupons');
      if (data.success && data.coupons) {
        setCoupons(data.coupons);
      } else {
        setCoupons([]);
      }
    } catch (err) {
      console.error('Error fetching coupons:', err);
      toast.error('Failed to load coupons');
      setCoupons([]);
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const openModal = (coupon = null) => {
    setEditing(coupon);
    setForm(coupon ? { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue, expiryDate: coupon.expiryDate?.slice(0, 10) || '', minOrderAmount: coupon.minOrderAmount, isActive: coupon.isActive } : defaultForm);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.code || !form.discountValue || !form.expiryDate) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      if (editing) {
        const { data } = await api.put(`/coupons/${editing._id}`, form);
        if (data.success) {
          setCoupons(prev => prev.map(c => c._id === editing._id ? data.coupon : c));
          toast.success('Coupon updated successfully');
        }
      } else {
        const { data } = await api.post('/coupons', form);
        if (data.success) {
          setCoupons(prev => [data.coupon, ...prev]);
          toast.success('Coupon created successfully');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save coupon');
    }
    setModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try { 
      const { data } = await api.delete(`/coupons/${id}`);
      if (data.success) {
        setCoupons(prev => prev.filter(c => c._id !== id));
        toast.success('Coupon deleted successfully');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete coupon');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Coupons</h1>
          <p className="text-sm text-gray-500">{coupons.length} active coupons</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 rounded-xl transition text-sm">
          <Plus size={16} /> Add Coupon
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-white rounded-2xl h-40 animate-pulse border border-gray-100" />) :
          coupons.map(coupon => (
            <div key={coupon._id} className="bg-white border border-dashed border-orange-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-orange-100 text-orange-600 font-mono font-bold px-3 py-1 rounded-lg text-sm">{coupon.code}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {coupon.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Discount: <strong>{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}</strong></p>
                <p>Min Order: <strong>₹{coupon.minOrderAmount}</strong></p>
                <p>Expires: <strong>{new Date(coupon.expiryDate).toLocaleDateString('en-IN')}</strong></p>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => openModal(coupon)} className="flex-1 flex items-center justify-center gap-1 border border-gray-200 rounded-xl py-1.5 text-xs font-medium hover:border-orange-300 transition">
                  <Edit2 size={12} /> Edit
                </button>
                <button onClick={() => handleDelete(coupon._id)} className="flex-1 flex items-center justify-center gap-1 border border-gray-200 rounded-xl py-1.5 text-xs font-medium hover:border-red-300 hover:text-red-500 transition">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))
        }
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-800">{editing ? 'Edit Coupon' : 'New Coupon'}</h2>
              <button onClick={() => setModalOpen(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Coupon Code</label>
                <input required type="text" value={form.code} onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 uppercase font-mono" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Discount Type</label>
                <select value={form.discountType} onChange={(e) => setForm(f => ({ ...f, discountType: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none">
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
              {[
                { key: 'discountValue', label: form.discountType === 'percentage' ? 'Discount % (e.g. 10)' : 'Discount Amount (₹)', type: 'number' },
                { key: 'minOrderAmount', label: 'Minimum Order Amount (₹)', type: 'number' },
                { key: 'expiryDate', label: 'Expiry Date', type: 'date' },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
                  <input required type={type} value={form[key]} onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400" />
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="couponActive" checked={form.isActive} onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                <label htmlFor="couponActive" className="text-sm text-gray-700">Active</label>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 border border-gray-200 rounded-xl py-2 text-sm hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" className="flex-1 bg-orange-500 text-white rounded-xl py-2 text-sm hover:bg-orange-600 transition">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
