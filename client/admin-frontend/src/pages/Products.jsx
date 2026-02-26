import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Edit2, Trash2, Search, X, ChevronDown, Check, Image as ImageIcon, Sparkles } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

// ── Custom Dropdown Component ──────────────────────────────────────────────
function CustomSelect({ value, onChange, options, placeholder = 'Select…', allowCustom = false }) {
  const [open, setOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const choose = (val) => { onChange(val); setOpen(false); setCustomInput(''); };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-left flex items-center justify-between outline-none focus:border-orange-400 bg-white hover:border-gray-300 transition"
      >
        <span className={value ? 'text-gray-800' : 'text-gray-400'}>{value || placeholder}</span>
        <ChevronDown size={15} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
          {allowCustom && (
            <div className="p-2 border-b border-gray-100">
              <input
                autoFocus
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && customInput.trim()) choose(customInput.trim()); }}
                placeholder="Type new category & press Enter"
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-orange-400"
              />
            </div>
          )}
          <ul className="py-1 max-h-52 overflow-y-auto">
            {options.length === 0 && (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">No categories yet — type above</li>
            )}
            {options.map(opt => (
              <li
                key={opt}
                onClick={() => choose(opt)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer hover:bg-orange-50 transition ${value === opt ? 'text-orange-600 font-medium' : 'text-gray-700'}`}
              >
                <Check size={13} className={value === opt ? 'opacity-100 text-orange-500' : 'opacity-0'} />
                {opt}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

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

const emptyForm = { name: '', category: '', brand: '', price: '', discountPrice: '', stock: '', description: '', keyFeatures: [], isActive: true };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [saving, setSaving] = useState(false);

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
    setImageFiles([]);
    setImagePreviews(product?.images || []);
    setForm(product ? {
      name: product.name || '', category: product.category || '', brand: product.brand || '',
      price: product.price || '', discountPrice: product.discountPrice || '',
      stock: product.stock || '', description: product.description || '',
      keyFeatures: product.keyFeatures || [], isActive: product.isActive ?? true,
    } : emptyForm);
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditing(null); setImageFiles([]); setImagePreviews([]); };

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };
  const removePreview = (idx) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.category || !form.price || !form.stock) { toast.error('Fill all required fields'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      ['name', 'category', 'brand', 'price', 'discountPrice', 'stock', 'description'].forEach(k => {
        if (form[k] !== '' && form[k] !== undefined) fd.append(k, form[k]);
      });
      fd.append('isActive', form.isActive);
      fd.append('keyFeatures', JSON.stringify(form.keyFeatures));
      imageFiles.forEach(f => fd.append('images', f));

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (editing) {
        const { data } = await api.put(`/products/${editing._id}`, fd, config);
        if (data.success) { setProducts(prev => prev.map(p => p._id === editing._id ? data.product : p)); toast.success('Product updated'); }
      } else {
        const { data } = await api.post('/products', fd, config);
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

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try { await api.delete(`/products/${id}`); setProducts(prev => prev.filter(p => p._id !== id)); toast.success('Deleted'); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.length} products?`)) return;
    await Promise.all(selected.map(id => api.delete(`/products/${id}`).catch(() => {})));
    setProducts(prev => prev.filter(p => !selected.includes(p._id)));
    setSelected([]); toast.success(`${selected.length} products deleted`);
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

      {/* ── Modal ──────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-6 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Sparkles size={15} className="text-orange-500" />
                </div>
                <h2 className="font-bold text-gray-800 text-lg">{editing ? 'Edit Product' : 'Add New Product'}</h2>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-xl transition"><X size={18} /></button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
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
                </div>
              </div>

              {/* Pricing */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Pricing & Inventory</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">MRP (₹) <span className="text-red-400">*</span></label>
                    <input type="number" required min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 transition" placeholder="0" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Sale Price (₹)</label>
                    <input type="number" min="0" value={form.discountPrice} onChange={e => setForm(f => ({ ...f, discountPrice: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 transition" placeholder="0" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Stock Qty <span className="text-red-400">*</span></label>
                    <input type="number" required min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 transition" placeholder="0" />
                  </div>
                </div>
              </div>

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
                  <label className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition">
                    <ImageIcon size={18} className="text-gray-400" />
                    <span className="text-xs text-gray-400">Add</span>
                    <input type="file" multiple accept="image/*" onChange={handleImages} className="hidden" />
                  </label>
                </div>
                <p className="text-xs text-gray-400 mt-2">Max 8 images, 5MB each (JPG, PNG, WebP)</p>
              </div>

              {/* Status Toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                  className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors shrink-0 ${form.isActive ? 'bg-orange-500' : 'bg-gray-200'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Active product</span>
                  <p className="text-xs text-gray-400">Visible to customers in the store</p>
                </div>
              </label>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-bold transition">
                  {saving ? 'Saving…' : editing ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

