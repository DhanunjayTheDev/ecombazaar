import { useState, useEffect } from 'react';
import { Save, Store, Mail, Phone, MapPin, Percent, Truck, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

const Section = ({ icon: Icon, title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-6">
    <div className="flex items-center gap-2 mb-5">
      <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
        <Icon size={15} className="text-orange-500" />
      </div>
      <h2 className="font-bold text-gray-800">{title}</h2>
    </div>
    {children}
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{label}</label>
    {children}
  </div>
);

export default function Settings() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('storeSettings');
    return saved ? JSON.parse(saved) : {
      store: { name: 'EcomBazaar', tagline: 'Shop Smart, Live Better', email: 'support@ecombazaar.com', phone: '+91 98765 43210', address: '123 Market Street, Mumbai, India' },
      tax: { enabled: true, rate: 10 },
      shipping: { freeAbove: 999, flatRate: 50 },
      payment: { cod: true, upi: true, card: false },
    };
  });
  
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Settings endpoint doesn't exist yet - save to localStorage only
      localStorage.setItem('storeSettings', JSON.stringify(settings));
      toast.success('Settings saved to your device');
    } catch (err) {
      localStorage.setItem('storeSettings', JSON.stringify(settings));
      toast.success('Settings saved');
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: typeof value === 'object' ? { ...prev[key], ...value } : value }));
  };

  const input = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition';

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-800">Settings</h1>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium px-5 py-2.5 rounded-xl transition text-sm">
          <Save size={15} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Store Info */}
      <Section icon={Store} title="Store Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Store Name">
            <input value={settings.store.name} onChange={(e) => updateSettings('store', { ...settings.store, name: e.target.value })} className={input} />
          </Field>
          <Field label="Tagline">
            <input value={settings.store.tagline} onChange={(e) => updateSettings('store', { ...settings.store, tagline: e.target.value })} className={input} />
          </Field>
          <Field label="Support Email">
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={settings.store.email} onChange={(e) => updateSettings('store', { ...settings.store, email: e.target.value })} className={`${input} pl-8`} />
            </div>
          </Field>
          <Field label="Phone">
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={settings.store.phone} onChange={(e) => updateSettings('store', { ...settings.store, phone: e.target.value })} className={`${input} pl-8`} />
            </div>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address">
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-3 text-gray-400" />
                <textarea value={settings.store.address} onChange={(e) => updateSettings('store', { ...settings.store, address: e.target.value })} rows={2} className={`${input} pl-8 resize-none`} />
              </div>
            </Field>
          </div>
        </div>
      </Section>

      {/* Tax Settings */}
      <Section icon={Percent} title="Tax Settings">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700 text-sm">Enable Tax</p>
              <p className="text-xs text-gray-400">Apply tax to all orders</p>
            </div>
            <button onClick={() => updateSettings('tax', { ...settings.tax, enabled: !settings.tax.enabled })}
              className={`w-11 h-6 rounded-full transition-colors ${settings.tax.enabled ? 'bg-orange-500' : 'bg-gray-200'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${settings.tax.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          {settings.tax.enabled && (
            <Field label="Tax Rate (%)">
              <input type="number" min="0" max="50" value={settings.tax.rate} onChange={(e) => updateSettings('tax', { ...settings.tax, rate: parseFloat(e.target.value) })} className={`${input} max-w-[120px]`} />
            </Field>
          )}
        </div>
      </Section>

      {/* Shipping Settings */}
      <Section icon={Truck} title="Shipping Settings">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Flat Shipping Rate (₹)">
            <input type="number" min="0" value={settings.shipping.flatRate} onChange={(e) => updateSettings('shipping', { ...settings.shipping, flatRate: parseFloat(e.target.value) })} className={input} />
          </Field>
          <Field label="Free Shipping Above (₹)">
            <input type="number" min="0" value={settings.shipping.freeAbove} onChange={(e) => updateSettings('shipping', { ...settings.shipping, freeAbove: parseFloat(e.target.value) })} className={input} />
          </Field>
        </div>
      </Section>

      {/* Payment Methods */}
      <Section icon={CreditCard} title="Payment Methods">
        <div className="space-y-3">
          {[
            { key: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive your order' },
            { key: 'upi', label: 'UPI / Net Banking', desc: 'Instant digital payment' },
            { key: 'card', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, etc.' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="font-medium text-gray-700 text-sm">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <button onClick={() => updateSettings('payment', { ...settings.payment, [key]: !settings.payment[key] })}
                className={`w-11 h-6 rounded-full transition-colors ${settings.payment[key] ? 'bg-orange-500' : 'bg-gray-200'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${settings.payment[key] ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
