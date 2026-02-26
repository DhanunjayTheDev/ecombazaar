import { useState, useEffect, useCallback } from 'react';
import { User, Package, MapPin, Edit2, Save, Plus, Trash2, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ADDR_EMPTY = { label: 'Home', fullName: '', phone: '', street: '', city: '', state: '', zip: '', country: 'India', isDefault: false };

export default function Profile() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('profile');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '' });

  // addresses
  const [addresses, setAddresses] = useState([]);
  const [addrModal, setAddrModal] = useState(false);
  const [editingAddr, setEditingAddr] = useState(null);
  const [addrForm, setAddrForm] = useState(ADDR_EMPTY);
  const [savingAddr, setSavingAddr] = useState(false);

  const fetchOrders = useCallback(async () => {
    try { const { data } = await api.get('/orders/my'); setOrders(data.orders); } catch {}
  }, []);

  const fetchAddresses = useCallback(async () => {
    try { const { data } = await api.get('/auth/addresses'); setAddresses(data.addresses || []); } catch {}
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchAddresses();
  }, [fetchOrders, fetchAddresses]);

  const handleSaveProfile = async () => {
    try {
      await api.put('/auth/profile', form);
      toast.success('Profile updated!');
      setEditing(false);
    } catch { toast.error('Failed to update profile'); }
  };

  const openAddrModal = (addr = null) => {
    setEditingAddr(addr);
    setAddrForm(addr ? { ...addr } : ADDR_EMPTY);
    setAddrModal(true);
  };

  const handleSaveAddr = async (e) => {
    e.preventDefault();
    setSavingAddr(true);
    try {
      if (editingAddr) {
        const { data } = await api.put(`/auth/addresses/${editingAddr._id}`, addrForm);
        setAddresses(data.addresses);
        toast.success('Address updated');
      } else {
        const { data } = await api.post('/auth/addresses', addrForm);
        setAddresses(data.addresses);
        toast.success('Address added');
      }
      setAddrModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save address');
    } finally { setSavingAddr(false); }
  };

  const handleDeleteAddr = async (id) => {
    if (!window.confirm('Remove this address?')) return;
    try {
      const { data } = await api.delete(`/auth/addresses/${id}`);
      setAddresses(data.addresses);
      toast.success('Address removed');
    } catch { toast.error('Failed to remove address'); }
  };

  const statusColor = {
    Pending: 'bg-yellow-100 text-yellow-700', Processing: 'bg-blue-100 text-blue-700',
    Shipped: 'bg-purple-100 text-purple-700', Delivered: 'bg-green-100 text-green-700',
    Cancelled: 'bg-red-100 text-red-700',
  };

  const addrFields = [
    { key: 'label', label: 'Label', placeholder: 'Home / Work / Other', span: 1 },
    { key: 'fullName', label: 'Full Name', placeholder: 'John Doe', span: 1 },
    { key: 'phone', label: 'Phone', placeholder: '+91 98765 43210', span: 2 },
    { key: 'street', label: 'Street Address', placeholder: '123 Main St, Apt 4B', span: 2 },
    { key: 'city', label: 'City', placeholder: 'Mumbai', span: 1 },
    { key: 'state', label: 'State', placeholder: 'Maharashtra', span: 1 },
    { key: 'zip', label: 'PIN Code', placeholder: '400001', span: 1 },
    { key: 'country', label: 'Country', placeholder: 'India', span: 1 },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Account</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b overflow-x-auto">
        {[['profile', User, 'Profile'], ['orders', Package, 'My Orders'], ['addresses', MapPin, 'Addresses']].map(([key, Icon, label]) => (
          <button
            key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition ${tab === key ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── Profile Tab ─────────────────────────────────────────── */}
      {tab === 'profile' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center text-2xl font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="font-bold text-gray-800 text-lg">{user?.name}</h2>
              <p className="text-gray-500 text-sm">{user?.email}</p>
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full mt-1 inline-block">{user?.role}</span>
            </div>
            <button onClick={() => setEditing(e => !e)} className="ml-auto text-orange-500 hover:bg-orange-50 p-2 rounded-lg transition">
              <Edit2 size={16} />
            </button>
          </div>

          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-orange-400" />
              </div>
              <button onClick={handleSaveProfile} className="flex items-center gap-2 bg-orange-500 text-white font-medium px-6 py-2 rounded-full hover:bg-orange-600 transition">
                <Save size={14} /> Save Changes
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400 mb-1">Email</p><p className="font-medium text-gray-700">{user?.email}</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400 mb-1">Member Since</p><p className="font-medium text-gray-700">{new Date(user?.createdAt || Date.now()).toLocaleDateString()}</p></div>
            </div>
          )}
        </div>
      )}

      {/* ── Orders Tab ────────────────────────────────────────────── */}
      {tab === 'orders' && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-12"><Package size={48} className="mx-auto text-gray-200 mb-3" /><p className="text-gray-500">No orders yet</p></div>
          ) : orders.map(order => (
            <div key={order._id} className="bg-white border border-gray-100 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div><p className="text-xs text-gray-400">Order ID</p><p className="font-mono text-sm text-gray-700">{order._id.slice(-8).toUpperCase()}</p></div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColor[order.status] || 'bg-gray-100 text-gray-600'}`}>{order.status}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{order.items?.length} item(s) · {new Date(order.createdAt).toLocaleDateString()}</span>
                <span className="font-bold text-gray-800">₹{order.totalAmount?.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Addresses Tab ─────────────────────────────────────────── */}
      {tab === 'addresses' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => openAddrModal()} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 rounded-xl text-sm transition">
              <Plus size={14} /> Add Address
            </button>
          </div>

          {addresses.length === 0 ? (
            <div className="text-center py-12"><MapPin size={48} className="mx-auto text-gray-200 mb-3" /><p className="text-gray-500">No saved addresses</p></div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {addresses.map(addr => (
                <div key={addr._id} className={`bg-white border-2 rounded-2xl p-4 relative ${addr.isDefault ? 'border-orange-400' : 'border-gray-100'}`}>
                  {addr.isDefault && (
                    <span className="absolute top-3 right-3 flex items-center gap-1 text-xs text-orange-500 font-medium bg-orange-50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 size={10} /> Default
                    </span>
                  )}
                  <p className="text-xs font-bold text-orange-500 uppercase tracking-wide mb-2">{addr.label}</p>
                  <p className="font-semibold text-gray-800 text-sm">{addr.fullName}</p>
                  {addr.phone && <p className="text-xs text-gray-500">{addr.phone}</p>}
                  <p className="text-sm text-gray-600 mt-1">{addr.street}</p>
                  <p className="text-sm text-gray-600">{addr.city}, {addr.state} — {addr.zip}</p>
                  <p className="text-sm text-gray-500">{addr.country}</p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => openAddrModal(addr)} className="flex-1 flex items-center justify-center gap-1 border border-gray-200 rounded-xl py-1.5 text-xs hover:border-orange-300 transition">
                      <Edit2 size={10} /> Edit
                    </button>
                    <button onClick={() => handleDeleteAddr(addr._id)} className="flex-1 flex items-center justify-center gap-1 border border-gray-200 rounded-xl py-1.5 text-xs hover:border-red-300 hover:text-red-500 transition">
                      <Trash2 size={10} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Address Modal ─────────────────────────────────────────── */}
      {addrModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-800">{editingAddr ? 'Edit Address' : 'Add Address'}</h2>
              <button onClick={() => setAddrModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveAddr} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {addrFields.map(({ key, label, placeholder, span }) => (
                  <div key={key} className={span === 2 ? 'col-span-2' : ''}>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">{label}</label>
                    <input
                      value={addrForm[key] || ''} onChange={e => setAddrForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder} required={['street','city','state','zip'].includes(key)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                    />
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-3 cursor-pointer pt-1">
                <div
                  onClick={() => setAddrForm(f => ({ ...f, isDefault: !f.isDefault }))}
                  className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${addrForm.isDefault ? 'bg-orange-500' : 'bg-gray-200'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${addrForm.isDefault ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <span className="text-sm text-gray-700">Set as default address</span>
              </label>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setAddrModal(false)} className="flex-1 border border-gray-200 rounded-xl py-2 text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={savingAddr} className="flex-1 bg-orange-500 text-white rounded-xl py-2 text-sm hover:bg-orange-600 disabled:opacity-60">
                  {savingAddr ? 'Saving…' : editingAddr ? 'Update' : 'Add Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
