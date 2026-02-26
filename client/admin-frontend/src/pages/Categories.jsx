import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const EMPTY_FORM = { name: '', icon: '📦', description: '', isActive: true };

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

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
    setForm(cat ? { name: cat.name, icon: cat.icon || '📦', description: cat.description || '', isActive: cat.isActive } : EMPTY_FORM);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Category name is required');
    setSaving(true);
    try {
      if (editing) {
        const { data } = await api.put(`/categories/${editing._id}`, form);
        setCategories(prev => prev.map(c => c._id === editing._id ? data.category : c));
        toast.success('Category updated');
      } else {
        const { data } = await api.post('/categories', form);
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
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-2xl h-36 animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-3">📦</p>
          <p className="font-medium">No categories yet</p>
          <p className="text-sm">Click "Add Category" to create your first one</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map(cat => (
            <div key={cat._id} className={`bg-white border rounded-2xl p-5 hover:shadow-md transition group ${cat.isActive ? 'border-gray-100' : 'border-dashed border-gray-200 opacity-60'}`}>
              <div className="flex items-start justify-between mb-2">
                <span className="text-3xl">{cat.icon || '📦'}</span>
                <button onClick={() => handleToggle(cat)} className="opacity-0 group-hover:opacity-100 transition" title={cat.isActive ? 'Deactivate' : 'Activate'}>
                  {cat.isActive
                    ? <ToggleRight size={20} className="text-green-500" />
                    : <ToggleLeft size={20} className="text-gray-400" />}
                </button>
              </div>
              <h3 className="font-bold text-gray-800 truncate">{cat.name}</h3>
              {cat.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{cat.description}</p>}
              <p className="text-xs text-gray-400 mt-1">/{cat.slug}</p>
              <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => openModal(cat)} className="flex-1 flex items-center justify-center gap-1 border border-gray-200 rounded-xl py-1.5 text-xs hover:border-orange-300 transition">
                  <Edit2 size={11} /> Edit
                </button>
                <button onClick={() => handleDelete(cat._id, cat.name)} className="flex-1 flex items-center justify-center gap-1 border border-gray-200 rounded-xl py-1.5 text-xs hover:border-red-300 hover:text-red-500 transition">
                  <Trash2 size={11} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="font-bold text-gray-800 mb-5">{editing ? 'Edit Category' : 'Add Category'}</h2>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Name *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Electronics" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Icon (emoji)</label>
                <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                  placeholder="📦" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Short description (optional)"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 resize-none" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer pt-1">
                <span className="text-sm font-medium text-gray-700">Active</span>
                <div
                  onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${form.isActive ? 'bg-orange-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </label>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 border border-gray-200 rounded-xl py-2 text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-orange-500 text-white rounded-xl py-2 text-sm hover:bg-orange-600 disabled:opacity-60">
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
