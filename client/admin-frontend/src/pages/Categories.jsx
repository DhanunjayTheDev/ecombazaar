import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, RefreshCw, ImageIcon, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const EMPTY_FORM = { name: '', image: '', description: '', isActive: true };

export default function Categories() {
  const [categories, setCategories]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [modalOpen, setModalOpen]       = useState(false);
  const [editing, setEditing]           = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [imgUploading, setImgUploading] = useState(false);
  const fileRef = useRef(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/categories?all=true');
      if (data.success) setCategories(data.categories);
    } catch { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const openModal = (cat = null) => {
    setEditing(cat);
    setForm(cat
      ? { name: cat.name, image: cat.image || '', description: cat.description || '', isActive: cat.isActive }
      : EMPTY_FORM);
    setModalOpen(true);
  };

  // Upload selected image to Cloudinary via /api/upload, store URL in form.image
  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (data.success) { setForm(f => ({ ...f, image: data.url })); toast.success('Image uploaded'); }
    } catch { toast.error('Image upload failed'); }
    finally { setImgUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Category name is required');
    setSaving(true);
    try {
      const payload = { name: form.name, image: form.image, description: form.description, isActive: form.isActive };
      if (editing) {
        const { data } = await api.put(`/categories/${editing._id}`, payload);
        setCategories(prev => prev.map(c => c._id === editing._id ? data.category : c));
        toast.success('Category updated');
      } else {
        const { data } = await api.post('/categories', payload);
        setCategories(prev => [...prev, data.category]);
        toast.success('Category created');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? Products using this category won't be affected.`)) return;
    try {
      await api.delete(`/categories/${id}`);
      setCategories(prev => prev.filter(c => c._id !== id));
      toast.success('Category deleted');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  const handleToggle = async (cat) => {
    try {
      const { data } = await api.put(`/categories/${cat._id}`, { isActive: !cat.isActive });
      setCategories(prev => prev.map(c => c._id === cat._id ? data.category : c));
      toast.success(`${cat.name} ${!cat.isActive ? 'activated' : 'deactivated'}`);
    } catch { toast.error('Failed to update status'); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Categories</h1>
          <p className="text-sm text-gray-500">{categories.length} total · {categories.filter(c => c.isActive).length} active</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchCategories} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition" title="Refresh">
            <RefreshCw size={15} className={loading ? 'animate-spin text-orange-500' : 'text-gray-400'} />
          </button>
          <button onClick={() => openModal()} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 rounded-xl transition text-sm">
            <Plus size={16} /> Add Category
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-gray-100 rounded-2xl h-44 animate-pulse" />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ImageIcon size={28} className="text-gray-300" />
          </div>
          <p className="font-medium">No categories yet</p>
          <p className="text-sm">Click &quot;Add Category&quot; to create your first one</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map(cat => (
            <div key={cat._id} className={`bg-white border rounded-2xl overflow-hidden hover:shadow-md transition ${cat.isActive ? 'border-gray-100' : 'border-dashed border-gray-200 opacity-60'}`}>
              {/* Image strip */}
              <div className="relative h-28 bg-gray-50 flex items-center justify-center overflow-hidden">
                {cat.image
                  ? <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                  : <ImageIcon size={32} className="text-gray-200" />}
                {/* Toggle always visible */}
                <button onClick={() => handleToggle(cat)} title={cat.isActive ? 'Deactivate' : 'Activate'}
                  className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-0.5 shadow hover:scale-110 transition">
                  {cat.isActive ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} className="text-gray-400" />}
                </button>
              </div>

              <div className="p-4">
                <h3 className="font-bold text-gray-800 truncate">{cat.name}</h3>
                {cat.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{cat.description}</p>}
                <p className="text-xs text-gray-300 mt-0.5">/{cat.slug}</p>

                {/* Action buttons — always visible */}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openModal(cat)} className="flex-1 flex items-center justify-center gap-1 border border-gray-200 rounded-xl py-1.5 text-xs hover:border-orange-300 hover:text-orange-500 transition">
                    <Edit2 size={11} /> Edit
                  </button>
                  <button onClick={() => handleDelete(cat._id, cat.name)} className="flex-1 flex items-center justify-center gap-1 border border-gray-200 rounded-xl py-1.5 text-xs hover:border-red-300 hover:text-red-500 transition">
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-800 text-lg">{editing ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-xl transition">
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Name *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Electronics" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 transition" />
              </div>

              {/* Image upload */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Category Image</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                    {form.image
                      ? <img src={form.image} alt="preview" className="w-full h-full object-cover" />
                      : <ImageIcon size={20} className="text-gray-300" />}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className={`flex items-center gap-2 border border-dashed border-gray-300 rounded-xl px-3 py-2 cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition ${imgUploading ? 'pointer-events-none opacity-60' : ''}`}>
                      {imgUploading ? <Loader2 size={14} className="animate-spin text-orange-500" /> : <ImageIcon size={14} className="text-gray-400" />}
                      <span className="text-xs text-gray-500">{imgUploading ? 'Uploading…' : 'Choose image'}</span>
                      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageSelect} className="hidden" disabled={imgUploading} />
                    </label>
                    {form.image && (
                      <button type="button" onClick={() => setForm(f => ({ ...f, image: '' }))} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition">
                        <X size={11} /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Short description (optional)"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 resize-none transition" />
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-3 cursor-pointer pt-1">
                <span className="text-sm font-medium text-gray-700">Active</span>
                <div onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${form.isActive ? 'bg-orange-500' : 'bg-gray-300'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </label>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 border border-gray-200 rounded-xl py-2 text-sm hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" disabled={saving || imgUploading} className="flex-1 bg-orange-500 text-white rounded-xl py-2 text-sm font-semibold hover:bg-orange-600 disabled:opacity-60 transition">
                  {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
