import { useState, useEffect } from 'react';
import { Star, Trash2, Search } from 'lucide-react';
import { fakeDelay } from '../utils/mockData';
import toast from 'react-hot-toast';

const MOCK_REVIEWS = [
  { _id: 'r1', user: { name: 'Alice Johnson' }, product: { name: 'Wireless Headphones', _id: 'p1' }, rating: 5, comment: 'Absolutely love them! Great sound quality.', createdAt: '2025-06-01T10:00:00Z' },
  { _id: 'r2', user: { name: 'Bob Smith' }, product: { name: 'Running Shoes', _id: 'p2' }, rating: 4, comment: 'Very comfortable for long runs.', createdAt: '2025-06-05T12:30:00Z' },
  { _id: 'r3', user: { name: 'Carol White' }, product: { name: 'Yoga Mat', _id: 'p3' }, rating: 3, comment: 'Decent quality but a bit thin.', createdAt: '2025-06-08T09:15:00Z' },
  { _id: 'r4', user: { name: 'David Lee' }, product: { name: 'Coffee Maker', _id: 'p4' }, rating: 5, comment: 'Makes the perfect cup every morning!', createdAt: '2025-06-10T08:00:00Z' },
  { _id: 'r5', user: { name: 'Eva Martinez' }, product: { name: 'Wireless Headphones', _id: 'p1' }, rating: 2, comment: 'Bass is weak. Not worth the price.', createdAt: '2025-06-12T14:45:00Z' },
];

const Stars = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(s => (
      <Star key={s} size={13} className={s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 fill-gray-200'} />
    ))}
  </div>
);

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // Endpoint doesn't exist yet - skip backend call
        setReviews(MOCK_REVIEWS);
      } catch {
        await fakeDelay(300);
        setReviews(MOCK_REVIEWS);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const handleDelete = async (productId, reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    setReviews(prev => prev.filter(r => r._id !== reviewId));
    toast.success('Review deleted');
  };

  const filtered = reviews.filter(r => {
    const matchSearch = search === '' ||
      r.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.comment?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || r.rating === parseInt(filter);
    return matchSearch && matchFilter;
  });

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-gray-800">Reviews</h1>
        <p className="text-sm text-gray-500">{reviews.length} total reviews · avg {avgRating} ★</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-3">
        {[5, 4, 3, 2, 1].map(star => {
          const count = reviews.filter(r => r.rating === star).length;
          const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
          return (
            <button key={star} onClick={() => setFilter(filter === String(star) ? 'all' : String(star))}
              className={`bg-white rounded-2xl p-3 text-center border transition hover:shadow-sm ${filter === String(star) ? 'border-orange-400 shadow-sm' : 'border-gray-100'}`}>
              <span className="text-yellow-400 font-bold text-lg">{star}★</span>
              <p className="text-gray-700 font-bold">{count}</p>
              <p className="text-xs text-gray-400">{pct}%</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reviews..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading reviews...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No reviews found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Customer</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Product</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Rating</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Comment</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Date</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r._id} className="border-b border-gray-50 hover:bg-orange-50/30 transition">
                  <td className="px-5 py-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-600 text-xs mb-1">
                      {r.user?.name?.[0] ?? '?'}
                    </div>
                    <span className="font-medium text-gray-800">{r.user?.name}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-600 max-w-[140px] truncate">{r.product?.name}</td>
                  <td className="px-5 py-3"><Stars rating={r.rating} /></td>
                  <td className="px-5 py-3 text-gray-600 max-w-[200px]">
                    <span className="line-clamp-2">{r.comment}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-400 whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => handleDelete(r.product?._id, r._id)} className="text-gray-400 hover:text-red-500 transition">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
