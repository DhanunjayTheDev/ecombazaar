import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Edit2, Trash2, Search, X, Check, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import CustomSelect from '../components/CustomSelect';
import ConfirmDialog from '../components/ConfirmDialog';

// ── Key Features Tag Input ─────────────────────────────────────────────────
function KeyFeaturesInput({ value, onChange }) {
  const [input, setInput] = useState('');
  const add = () => {
    if (!input.trim()) return;
    onChange([...value, input.trim()]);
    setInput('');
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="Add a feature and press Enter…"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
        />
        <button type="button" onClick={add} className="bg-orange-100 text-orange-600 px-3 py-2 rounded-xl text-sm font-medium hover:bg-orange-200 transition">Add</button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((f, i) => (
            <span key={i} className="flex items-center gap-1 bg-orange-50 text-orange-700 text-xs font-medium px-3 py-1 rounded-full border border-orange-100">
              {f}
              <button type="button" onClick={() => onChange(value.filter((_, idx) => idx !== i))}><X size={11} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Product Type → Spec Fields Config ──────────────────────────────────────
const PRODUCT_SPECS = {
  'Pendrive / Flash Drive': [
    { key: 'capacity',      label: 'Storage Capacity', type: 'select', options: ['8GB','16GB','32GB','64GB','128GB','256GB','512GB','1TB'] },
    { key: 'usbVersion',    label: 'USB Interface',    type: 'select', options: ['USB 2.0','USB 3.0','USB 3.1 Gen 1','USB 3.1 Gen 2','USB 3.2','USB-C','Dual (USB-A + C)'] },
    { key: 'readSpeed',     label: 'Read Speed',       type: 'text', placeholder: 'e.g. 150 MB/s' },
    { key: 'writeSpeed',    label: 'Write Speed',      type: 'text', placeholder: 'e.g. 70 MB/s' },
    { key: 'compatibility', label: 'Compatibility',    type: 'text', placeholder: 'e.g. Windows, Mac, Linux' },
    { key: 'warranty',      label: 'Warranty',         type: 'text', placeholder: 'e.g. 2 Years' },
  ],
  'SD Card / Memory Card': [
    { key: 'capacity',      label: 'Storage Capacity', type: 'select', options: ['16GB','32GB','64GB','128GB','256GB','512GB','1TB'] },
    { key: 'cardType',      label: 'Card Type',        type: 'select', options: ['SD','SDHC','SDXC','microSD','microSDHC','microSDXC'] },
    { key: 'speedClass',    label: 'Speed Class',      type: 'select', options: ['Class 4','Class 6','Class 10','UHS-I (U1)','UHS-I (U3)','UHS-II','V30','V60','V90'] },
    { key: 'readSpeed',     label: 'Read Speed',       type: 'text', placeholder: 'e.g. 100 MB/s' },
    { key: 'writeSpeed',    label: 'Write Speed',      type: 'text', placeholder: 'e.g. 60 MB/s' },
    { key: 'compatibility', label: 'Compatible With',  type: 'text', placeholder: 'e.g. Camera, Drone, Phone' },
  ],
  'Laptop': [
    { key: 'processor', label: 'Processor',         type: 'text',   placeholder: 'e.g. Intel Core i5-12th Gen' },
    { key: 'ram',       label: 'RAM',               type: 'select', options: ['4GB','8GB','12GB','16GB','32GB','64GB'] },
    { key: 'storage',   label: 'Storage',           type: 'text',   placeholder: 'e.g. 512GB SSD + 1TB HDD' },
    { key: 'display',   label: 'Display',           type: 'text',   placeholder: 'e.g. 15.6" FHD IPS 144Hz' },
    { key: 'graphics',  label: 'Graphics Card',     type: 'text',   placeholder: 'e.g. NVIDIA GTX 1650 4GB' },
    { key: 'os',        label: 'Operating System',  type: 'select', options: ['Windows 11 Home','Windows 11 Pro','Windows 10','macOS','Linux','Chrome OS','Without OS'] },
    { key: 'battery',   label: 'Battery Life',      type: 'text',   placeholder: 'e.g. 56Wh, Up to 8 hrs' },
    { key: 'weight',    label: 'Weight',            type: 'text',   placeholder: 'e.g. 1.8 kg' },
  ],
  'Smartphone': [
    { key: 'processor', label: 'Processor',        type: 'text',   placeholder: 'e.g. Snapdragon 8 Gen 2' },
    { key: 'ram',       label: 'RAM',              type: 'select', options: ['4GB','6GB','8GB','12GB','16GB'] },
    { key: 'storage',   label: 'Internal Storage', type: 'select', options: ['64GB','128GB','256GB','512GB','1TB'] },
    { key: 'display',   label: 'Display',          type: 'text',   placeholder: 'e.g. 6.7" AMOLED 120Hz' },
    { key: 'camera',    label: 'Camera',           type: 'text',   placeholder: 'e.g. 200MP + 12MP + 10MP' },
    { key: 'battery',   label: 'Battery',          type: 'text',   placeholder: 'e.g. 5000mAh, 67W Fast Charge' },
    { key: 'os',        label: 'OS',               type: 'select', options: ['Android 14','Android 13','Android 12','iOS 17','iOS 16'] },
    { key: 'network',   label: 'Network',          type: 'select', options: ['5G','4G LTE','3G'] },
  ],
  'Smartwatch': [
    { key: 'displayType',     label: 'Display Type',    type: 'select', options: ['AMOLED','LCD','IPS','E-Ink','Retina LTPO'] },
    { key: 'displaySize',     label: 'Display Size',    type: 'text',   placeholder: 'e.g. 1.8" 368x448px' },
    { key: 'batteryLife',     label: 'Battery Life',    type: 'text',   placeholder: 'e.g. Up to 18 days' },
    { key: 'waterResistance', label: 'Water Resistance',type: 'select', options: ['IP67','IP68','5ATM','10ATM','None'] },
    { key: 'connectivity',    label: 'Connectivity',    type: 'text',   placeholder: 'e.g. Bluetooth 5.3, WiFi, GPS' },
    { key: 'sensors',         label: 'Health Sensors',  type: 'text',   placeholder: 'e.g. Heart rate, SpO2, ECG' },
    { key: 'compatibility',   label: 'Compatibility',   type: 'select', options: ['Android only','iOS only','Android & iOS'] },
  ],
  'Earphones / AirPods': [
    { key: 'type',            label: 'Type',             type: 'select', options: ['True Wireless (TWS)','Wired Earphones','Neckband / Wireless','Over-Ear','On-Ear'] },
    { key: 'driver',          label: 'Driver Size',      type: 'text',   placeholder: 'e.g. 13mm Dynamic' },
    { key: 'batteryLife',     label: 'Battery Life',     type: 'text',   placeholder: 'e.g. 8hrs + 24hrs (case)' },
    { key: 'noiseCancellation', label: 'Noise Cancellation', type: 'select', options: ['Active (ANC)','Passive','None'] },
    { key: 'connectivity',    label: 'Connectivity',     type: 'select', options: ['Bluetooth 5.0','Bluetooth 5.1','Bluetooth 5.2','Bluetooth 5.3','Wired 3.5mm','Wired USB-C'] },
    { key: 'waterResistance', label: 'Water Resistance', type: 'select', options: ['IPX4','IPX5','IPX7','None'] },
    { key: 'microphone',      label: 'Microphone',       type: 'text',   placeholder: 'e.g. Dual mic with ENC' },
  ],
  'Bluetooth Speaker': [
    { key: 'outputPower',     label: 'Output Power',     type: 'text',   placeholder: 'e.g. 40W RMS' },
    { key: 'batteryLife',     label: 'Battery Life',     type: 'text',   placeholder: 'e.g. 12 hours' },
    { key: 'connectivity',    label: 'Connectivity',     type: 'text',   placeholder: 'e.g. Bluetooth 5.1, AUX, USB-C' },
    { key: 'waterResistance', label: 'Water Resistance', type: 'select', options: ['IPX4','IPX5','IPX7','IP67','None'] },
    { key: 'channels',        label: 'Channels',         type: 'select', options: ['Mono','Stereo (2.0)','2.1','5.1'] },
    { key: 'frequency',       label: 'Frequency Response',type: 'text',  placeholder: 'e.g. 80Hz - 20kHz' },
  ],
  'Smart TV': [
    { key: 'screenSize',  label: 'Screen Size', type: 'select', options: ['24"','32"','40"','43"','50"','55"','65"','75"','85"'] },
    { key: 'resolution',  label: 'Resolution',  type: 'select', options: ['HD (720p)','Full HD (1080p)','4K Ultra HD','8K'] },
    { key: 'os',          label: 'Smart TV OS', type: 'select', options: ['Android TV','Google TV','Tizen','WebOS','Fire TV','Roku TV'] },
    { key: 'refreshRate', label: 'Refresh Rate',type: 'select', options: ['60Hz','120Hz','144Hz'] },
    { key: 'panelType',   label: 'Panel Type',  type: 'select', options: ['LED','OLED','QLED','Mini LED','NanoCell','IPS'] },
    { key: 'connectivity',label: 'Connectivity',type: 'text',   placeholder: 'e.g. WiFi, Bluetooth, 3x HDMI, 2x USB' },
  ],
  'Tablet': [
    { key: 'processor', label: 'Processor', type: 'text',   placeholder: 'e.g. Apple M2 / Snapdragon 870' },
    { key: 'ram',       label: 'RAM',       type: 'select', options: ['4GB','6GB','8GB','12GB','16GB'] },
    { key: 'storage',   label: 'Storage',   type: 'select', options: ['64GB','128GB','256GB','512GB','1TB'] },
    { key: 'display',   label: 'Display',   type: 'text',   placeholder: 'e.g. 11" Liquid Retina 120Hz' },
    { key: 'battery',   label: 'Battery',   type: 'text',   placeholder: 'e.g. 7500mAh, USB-C charging' },
    { key: 'os',        label: 'OS',        type: 'select', options: ['iPadOS','Android','Windows 11'] },
  ],
  'Power Bank': [
    { key: 'capacity',    label: 'Capacity',     type: 'select', options: ['5000mAh','10000mAh','20000mAh','25000mAh','30000mAh'] },
    { key: 'inputPower',  label: 'Input',        type: 'text',   placeholder: 'e.g. 18W USB-C + Micro-USB' },
    { key: 'outputPower', label: 'Output',       type: 'text',   placeholder: 'e.g. 22.5W QC, 20W PD' },
    { key: 'ports',       label: 'Ports',        type: 'text',   placeholder: 'e.g. 2x USB-A, 1x USB-C' },
    { key: 'weight',      label: 'Weight',       type: 'text',   placeholder: 'e.g. 220g' },
  ],
  'Router / WiFi Device': [
    { key: 'type',         label: 'Type',         type: 'select', options: ['WiFi Router','Mesh System','Range Extender','4G/5G Router','WiFi Dongle'] },
    { key: 'wifiStandard', label: 'WiFi Standard',type: 'select', options: ['WiFi 4 (802.11n)','WiFi 5 (802.11ac)','WiFi 6 (802.11ax)','WiFi 6E','WiFi 7'] },
    { key: 'speed',        label: 'Max Speed',    type: 'text',   placeholder: 'e.g. AX3000 (3000 Mbps)' },
    { key: 'bands',        label: 'Bands',        type: 'select', options: ['Single Band (2.4GHz)','Dual Band','Tri-Band'] },
    { key: 'ports',        label: 'Ports',        type: 'text',   placeholder: 'e.g. 1x WAN GbE, 4x LAN GbE' },
  ],
  'Gift Item': [
    { key: 'occasion',      label: 'Occasion',      type: 'text', placeholder: 'e.g. Birthday, Anniversary, Diwali' },
    { key: 'material',      label: 'Material',      type: 'text', placeholder: 'e.g. Crystal, Wood, Metal' },
    { key: 'dimensions',    label: 'Dimensions',    type: 'text', placeholder: 'e.g. 20cm x 15cm x 10cm' },
    { key: 'packaging',     label: 'Packaging',     type: 'text', placeholder: 'e.g. Premium Gift Box included' },
    { key: 'customization', label: 'Customization', type: 'text', placeholder: 'e.g. Name engraving available' },
  ],
};
const PRODUCT_TYPE_LIST = Object.keys(PRODUCT_SPECS);

// ── Dynamic Spec Fields ──────────────────────────────────────────────────────
function SpecsFields({ productType, specs, onChange }) {
  const fields = PRODUCT_SPECS[productType];
  if (!fields) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {fields.map(f => (
        <div key={f.key}>
          <label className="text-xs font-medium text-gray-600 mb-1 block">{f.label}</label>
          {f.type === 'select' ? (
            <CustomSelect
              value={specs[f.key] || ''}
              onChange={v => onChange({ ...specs, [f.key]: v })}
              options={f.options}
              placeholder={`Select ${f.label}…`}
            />
          ) : (
            <input
              type="text"
              value={specs[f.key] || ''}
              onChange={e => onChange({ ...specs, [f.key]: e.target.value })}
              placeholder={f.placeholder}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 transition"
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Variants Manager ─────────────────────────────────────────────────────────
function VariantsSection({ variants, onChange }) {
  const add = () => onChange([...variants, { label: '', price: '', discountPrice: '', stock: '' }]);
  const remove = i => onChange(variants.filter((_, idx) => idx !== i));
  const update = (i, key, val) => { const a = [...variants]; a[i] = { ...a[i], [key]: val }; onChange(a); };
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Variants</p>
          <p className="text-xs text-gray-400 mt-0.5">Different sizes, capacities, or colors with individual prices.</p>
        </div>
        <button type="button" onClick={add}
          className="flex items-center gap-1 bg-orange-100 text-orange-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-orange-200 transition">
          + Add Variant
        </button>
      </div>
      {variants.length === 0 ? (
        <p className="text-xs text-gray-400 italic bg-gray-50 rounded-xl px-4 py-3">No variants — single price applies. Add variants for e.g. pendrives (128GB ₹499, 256GB ₹799…) or phones (8GB+128GB, 12GB+256GB…).</p>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-gray-400 px-1">
            <span>Label <span className="text-red-400">*</span></span>
            <span>MRP (₹) <span className="text-red-400">*</span></span>
            <span>Sale Price (₹)</span>
            <span>Stock <span className="text-red-400">*</span></span>
          </div>
          {variants.map((v, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 items-center">
              <input value={v.label} onChange={e => update(i, 'label', e.target.value)}
                placeholder="e.g. 128GB" className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 transition" />
              <input type="number" min="0" value={v.price} onChange={e => update(i, 'price', e.target.value)}
                placeholder="0" className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 transition" />
              <input type="number" min="0" value={v.discountPrice} onChange={e => update(i, 'discountPrice', e.target.value)}
                placeholder="0" className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 transition" />
              <div className="flex gap-1">
                <input type="number" min="0" value={v.stock} onChange={e => update(i, 'stock', e.target.value)}
                  placeholder="0" className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 transition" />
                <button type="button" onClick={() => remove(i)}
                  className="w-8 h-9 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition shrink-0">
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const emptyForm = { name: '', category: '', productType: '', brand: '', price: '', discountPrice: '', stock: '', description: '', keyFeatures: [], specifications: {}, variants: [], isActive: true };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState([]);
  const [form, setForm]               = useState(emptyForm);
  const [imagePreviews, setImagePreviews] = useState([]);   // Cloudinary URLs
  const [imageUploading, setImageUploading] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: '', type: '', data: null, isLoading: false });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.get('/products?limit=1000'),
        api.get('/categories?all=true'),
      ]);
      if (prodRes.data.success) setProducts(prodRes.data.products || []);
      if (catRes.data.success) setCategories(catRes.data.categories.map(c => c.name) || []);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = (product = null) => {
    setEditing(product);
    setImagePreviews(product?.images || []);
    setForm(product ? {
      name: product.name || '', category: product.category || '',
      productType: product.productType || '', brand: product.brand || '',
      price: product.price || '', discountPrice: product.discountPrice || '',
      stock: product.stock || '', description: product.description || '',
      keyFeatures: product.keyFeatures || [],
      specifications: (product.specifications && typeof product.specifications === 'object' && !Array.isArray(product.specifications))
        ? { ...product.specifications } : {},
      variants: product.variants || [],
      isActive: product.isActive ?? true,
    } : emptyForm);
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditing(null); setImagePreviews([]); };

  // Upload each selected image to Cloudinary immediately, then store the URL
  const handleImages = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setImageUploading(true);
    try {
      const urls = await Promise.all(files.map(async (file) => {
        const fd = new FormData();
        fd.append('image', file);
        const { data } = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        return data.url;
      }));
      setImagePreviews(prev => [...prev, ...urls]);
    } catch { toast.error('Image upload failed'); }
    finally { setImageUploading(false); e.target.value = ''; }
  };
  const removePreview = (idx) => setImagePreviews(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async (e) => {
    e.preventDefault();
    const validVariants = form.variants.filter(v => v.label && v.price && v.stock);
    if (!form.name || !form.category) { toast.error('Name and category are required'); return; }
    if (validVariants.length === 0 && (!form.price || !form.stock)) { toast.error('Add price & stock, or define at least one variant'); return; }
    setSaving(true);
    try {
      const finalPrice = validVariants.length > 0
        ? Math.min(...validVariants.map(v => Number(v.price))) : Number(form.price);
      const saleVariants = validVariants.filter(v => Number(v.discountPrice) > 0);
      const finalDiscountPrice = saleVariants.length > 0
        ? Math.min(...saleVariants.map(v => Number(v.discountPrice))) : Number(form.discountPrice) || 0;
      const finalStock = validVariants.length > 0
        ? validVariants.reduce((s, v) => s + Number(v.stock), 0) : Number(form.stock);
      const payload = {
        name: form.name, category: form.category, productType: form.productType, brand: form.brand,
        price: finalPrice, discountPrice: finalDiscountPrice, stock: finalStock,
        description: form.description, isActive: form.isActive,
        keyFeatures: form.keyFeatures, images: imagePreviews,
        specifications: form.specifications,
        variants: validVariants.map(v => ({
          label: v.label, price: Number(v.price),
          discountPrice: Number(v.discountPrice) || 0, stock: Number(v.stock),
        })),
      };
      if (editing) {
        const { data } = await api.put(`/products/${editing._id}`, payload);
        if (data.success) { setProducts(prev => prev.map(p => p._id === editing._id ? data.product : p)); toast.success('Product updated'); }
      } else {
        const { data } = await api.post('/products', payload);
        if (data.success) {
          setProducts(prev => [data.product, ...prev]);
          if (!categories.includes(form.category)) setCategories(prev => [...prev, form.category].sort());
          toast.success('Product created');
        }
      }
      closeModal();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = (id) => {
    setConfirmDialog({ isOpen: true, message: 'This product will be permanently deleted.', type: 'delete', data: { id }, isLoading: false });
  };

  const handleConfirmDelete = async () => {
    const { id } = confirmDialog.data;
    setConfirmDialog(prev => ({ ...prev, isLoading: true }));
    try {
      await api.delete(`/products/${id}`);
      setProducts(prev => prev.filter(p => p._id !== id));
      toast.success('Product deleted successfully');
      setConfirmDialog({ isOpen: false, message: '', type: '', data: null, isLoading: false });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product');
      setConfirmDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleBulkDelete = () => {
    setConfirmDialog({ isOpen: true, message: `All ${selected.length} selected products will be permanently deleted.`, type: 'bulkDelete', data: { ids: selected }, isLoading: false });
  };

  const handleConfirmBulkDelete = async () => {
    const { ids } = confirmDialog.data;
    setConfirmDialog(prev => ({ ...prev, isLoading: true }));
    try {
      await Promise.all(ids.map(id => api.delete(`/products/${id}`).catch(() => {})));
      setProducts(prev => prev.filter(p => !ids.includes(p._id)));
      setSelected([]);
      toast.success(`${ids.length} products deleted successfully`);
      setConfirmDialog({ isOpen: false, message: '', type: '', data: null, isLoading: false });
    } catch (err) {
      toast.error('Failed to delete some products');
      setConfirmDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  const filtered = products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()));
  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(i => i !== id) : [...s, id]);
  const toggleAll = () => setSelected(s => s.length === filtered.length ? [] : filtered.map(p => p._id));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Products</h1>
          <p className="text-sm text-gray-500">{products.length} total products</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 rounded-xl transition text-sm shadow-sm shadow-orange-200">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2 gap-2 flex-1">
          <Search size={15} className="text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" className="outline-none text-sm flex-1" />
          {search && <button onClick={() => setSearch('')}><X size={14} className="text-gray-400 hover:text-gray-600" /></button>}
        </div>
        {selected.length > 0 && (
          <button onClick={handleBulkDelete} className="flex items-center gap-2 bg-red-50 text-red-500 font-medium px-4 py-2 rounded-xl text-sm hover:bg-red-100 transition">
            <Trash2 size={14} /> Delete {selected.length}
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 w-8"><input type="checkbox" onChange={toggleAll} checked={selected.length === filtered.length && filtered.length > 0} className="rounded accent-orange-500" /></th>
                {['Product', 'Category', 'Price', 'Stock', 'Rating', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">{Array.from({ length: 8 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded" /></td>)}</tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No products found</td></tr>
              ) : filtered.map(p => (
                <tr key={p._id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3"><input type="checkbox" checked={selected.includes(p._id)} onChange={() => toggleSelect(p._id)} className="rounded accent-orange-500" /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1595872018818-97555653a011?w=80'} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      <div>
                        <p className="font-medium text-gray-800 max-w-44 truncate">{p.name}</p>
                        {p.brand && <p className="text-xs text-gray-400">{p.brand}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.category}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold">₹{(p.discountPrice || p.price)?.toLocaleString()}</span>
                    {p.discountPrice > 0 && <span className="text-xs text-gray-400 line-through ml-1">₹{p.price?.toLocaleString()}</span>}
                  </td>
                  <td className="px-4 py-3"><span className={p.stock < 5 ? 'text-red-500 font-semibold' : 'text-gray-700'}>{p.stock}</span></td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-yellow-500 font-medium text-xs">
                      ★ {p.rating?.toFixed(1) || '0.0'}
                      <span className="text-gray-400">({p.numReviews || 0})</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openModal(p)} className="text-gray-400 hover:text-orange-500 p-1.5 rounded-lg hover:bg-orange-50 transition"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(p._id)} className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Confirm Dialog ──────────────────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.type === 'bulkDelete' ? 'Delete Products?' : 'Delete Product?'}
        message={confirmDialog.message}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        isLoading={confirmDialog.isLoading}
        onConfirm={confirmDialog.type === 'bulkDelete' ? handleConfirmBulkDelete : handleConfirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, message: '', type: '', data: null, isLoading: false })}
      />

      {/* ── Modal ──────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Sparkles size={15} className="text-orange-500" />
                </div>
                <h2 className="font-bold text-gray-800 text-lg">{editing ? 'Edit Product' : 'Add New Product'}</h2>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-xl transition"><X size={18} /></button>
            </div>

            {/* Scrollable Content */}
            <form id="product-form" onSubmit={handleSave} className="overflow-y-auto flex-1">
              <div className="space-y-6 p-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Basic Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Product Name <span className="text-red-400">*</span></label>
                    <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 transition" placeholder="e.g. Premium Wireless Headphones" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Category <span className="text-red-400">*</span></label>
                    <CustomSelect value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} options={categories} placeholder="Select category…" allowCustom />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Brand</label>
                    <input type="text" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 transition" placeholder="e.g. Sony, Apple…" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Product Type</label>
                    <CustomSelect
                      value={form.productType}
                      onChange={v => setForm(f => ({ ...f, productType: v, specifications: {} }))}
                      options={['— General product —', ...PRODUCT_TYPE_LIST]}
                      placeholder="Select product type…"
                    />
                  </div>
                </div>

                {/* Specifications */}
                {form.productType && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Specifications</p>
                    <SpecsFields productType={form.productType} specs={form.specifications}
                      onChange={s => setForm(f => ({ ...f, specifications: s }))} />
                  </div>
                )}

                {/* Variants */}
                <div>
                  <VariantsSection variants={form.variants} onChange={v => setForm(f => ({ ...f, variants: v }))} />
                </div>

                {/* Pricing */}
                {form.variants.filter(v => v.label && v.price && v.stock).length === 0 ? (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Pricing &amp; Inventory</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">MRP (₹) <span className="text-red-400">*</span></label>
                        <input type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 transition" placeholder="0" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Sale Price (₹)</label>
                        <input type="number" min="0" value={form.discountPrice} onChange={e => setForm(f => ({ ...f, discountPrice: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 transition" placeholder="0" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Stock Qty <span className="text-red-400">*</span></label>
                        <input type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 transition" placeholder="0" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
                    <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">Pricing &amp; Inventory</p>
                    <p className="text-xs text-orange-400">Price and stock are auto-calculated from your variants above.</p>
                  </div>
                )}

                {/* Description */}
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Description</p>
                  <textarea required rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 transition resize-none"
                    placeholder="Describe the product in detail…" />
                </div>

                {/* Key Features */}
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Key Features</p>
                  <KeyFeaturesInput value={form.keyFeatures} onChange={v => setForm(f => ({ ...f, keyFeatures: v }))} />
                </div>

                {/* Images */}
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Product Images</p>
                  <div className="flex flex-wrap gap-3">
                    {imagePreviews.map((src, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removePreview(i)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    <label className={`w-20 h-20 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1 transition ${imageUploading ? 'border-orange-300 bg-orange-50 cursor-wait' : 'border-gray-200 cursor-pointer hover:border-orange-400 hover:bg-orange-50'}`}>
                      {imageUploading
                        ? <Loader2 size={18} className="text-orange-500 animate-spin" />
                        : <><ImageIcon size={18} className="text-gray-400" /><span className="text-xs text-gray-400">Add</span></>
                      }
                      <input type="file" multiple accept="image/*" onChange={handleImages} className="hidden" disabled={imageUploading} />
                    </label>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Uploaded to Cloudinary · Max 8 images, 5 MB each (JPG, PNG, WebP)</p>
                </div>

                {/* Status Toggle */}
                <label className="flex items-center gap-3 cursor-pointer pb-3">
                  <div onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                    className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors shrink-0 ${form.isActive ? 'bg-orange-500' : 'bg-gray-200'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Active product</span>
                    <p className="text-xs text-gray-400">Visible to customers in the store</p>
                  </div>
                </label>
              </div>
            </form>

            {/* Fixed Footer */}
            <div className="border-t border-gray-100 p-6 flex gap-3 shrink-0 bg-gray-50/50">
              <button type="button" onClick={closeModal} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-100 transition">Cancel</button>
              <button type="submit" form="product-form" disabled={saving || imageUploading}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-bold transition">
                {saving ? 'Saving…' : imageUploading ? 'Uploading images…' : editing ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

