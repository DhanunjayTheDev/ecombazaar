import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { SkeletonGrid } from '../components/SkeletonLoader';
import { MOCK_PRODUCTS, MOCK_CATEGORIES, fakeDelay } from '../utils/mockData';
import api from '../utils/api';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);

  const keyword = searchParams.get('keyword') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page')) || 1;
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12, sort });
      if (keyword) params.set('keyword', keyword);
      if (category) params.set('category', category);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      const { data } = await api.get(`/products?${params}`);
      setProducts(data.products);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      await fakeDelay(400);
      let filtered = MOCK_PRODUCTS;
      if (category) filtered = filtered.filter(p => p.category === category);
      if (keyword) filtered = filtered.filter(p => p.name.toLowerCase().includes(keyword.toLowerCase()));
      setProducts(filtered);
      setTotal(filtered.length);
      setPages(1);
    } finally { setLoading(false); }
  }, [keyword, category, sort, page, minPrice, maxPrice]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'rating', label: 'Top Rated' },
    { value: 'popular', label: 'Most Popular' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{category || keyword ? `${category || `"${keyword}"`}` : 'All Products'}</h1>
          <p className="text-sm text-gray-500 mt-1">{loading ? '...' : `${total} products found`}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setFilterOpen(f => !f)} className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-full text-sm hover:border-orange-300 transition sm:hidden">
            <SlidersHorizontal size={14} /> Filters
          </button>
          <select
            value={sort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="border border-gray-200 px-4 py-2 rounded-full text-sm outline-none hover:border-orange-300 transition"
          >
            {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters */}
        <aside className={`${filterOpen ? 'block' : 'hidden'} sm:block w-56 shrink-0`}>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Filters</h3>
              {(category || minPrice || maxPrice) && (
                <button onClick={() => { updateParam('category', ''); updateParam('minPrice', ''); updateParam('maxPrice', ''); }} className="text-xs text-orange-500 hover:underline flex items-center gap-1">
                  <X size={12} /> Clear
                </button>
              )}
            </div>

            {/* Category */}
            <div className="mb-5">
              <p className="text-sm font-medium text-gray-700 mb-2">Category</p>
              <ul className="space-y-1">
                {['', ...MOCK_CATEGORIES].map(cat => (
                  <li key={cat}>
                    <button
                      onClick={() => updateParam('category', cat)}
                      className={`text-sm w-full text-left px-2 py-1 rounded-lg transition ${category === cat ? 'bg-orange-100 text-orange-600 font-medium' : 'text-gray-600 hover:text-orange-500'}`}
                    >
                      {cat || 'All Categories'}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Price Range */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Price Range</p>
              <div className="flex gap-2">
                <input
                  type="number" placeholder="Min" value={minPrice}
                  onChange={(e) => updateParam('minPrice', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm outline-none"
                />
                <input
                  type="number" placeholder="Max" value={maxPrice}
                  onChange={(e) => updateParam('maxPrice', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm outline-none"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          {loading ? <SkeletonGrid count={12} /> : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-xl font-semibold text-gray-700">No products found</p>
              <p className="text-gray-500 mt-2">Try adjusting your filters or search term</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map(p => <ProductCard key={p._id} product={p} />)}
              </div>
              {/* Pagination */}
              {pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => { const next = new URLSearchParams(searchParams); next.set('page', p); setSearchParams(next); }}
                      className={`w-10 h-10 rounded-full text-sm font-medium transition ${page === p ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-orange-300'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
