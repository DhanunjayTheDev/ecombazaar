import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, Heart, ChevronRight, Minus, Plus, Truck, Shield, Package, CheckCircle2, Camera, X, Send } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useAuth } from '../contexts/AuthContext';
import { MOCK_PRODUCTS, fakeDelay } from '../utils/mockData';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [adding, setAdding] = useState(false);

  // Review form state
  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState([]);
  const [reviewPreviews, setReviewPreviews] = useState([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data.product);
      } catch {
        await fakeDelay(400);
        const mock = MOCK_PRODUCTS.find(p => p._id === id) || MOCK_PRODUCTS[0];
        setProduct(mock);
      } finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-10 animate-pulse">
      <div className="bg-gray-200 rounded-2xl aspect-square" />
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-3/4" />
        <div className="h-5 bg-gray-200 rounded w-1/2" />
        <div className="h-6 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  );

  if (!product) return <div className="text-center py-20"><p className="text-xl">Product not found</p></div>;

  const discount = product.discountPrice && product.discountPrice < product.price
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await addToCart(product, qty);
      toast.success(`${qty}x ${product.name} added to cart!`);
    } catch { toast.error('Failed to add to cart'); }
    finally { setAdding(false); }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate('/cart');
  };

  const handleReviewImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 4 - reviewImages.length);
    setReviewImages(prev => [...prev, ...files]);
    const previews = files.map(f => URL.createObjectURL(f));
    setReviewPreviews(prev => [...prev, ...previews]);
  };

  const removeReviewImage = (idx) => {
    setReviewImages(prev => prev.filter((_, i) => i !== idx));
    setReviewPreviews(prev => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewRating) return toast.error('Please select a rating');
    if (!reviewComment.trim()) return toast.error('Please write a comment');
    if (!user) return toast.error('Please login to submit a review');
    setSubmittingReview(true);
    try {
      const fd = new FormData();
      fd.append('rating', reviewRating);
      fd.append('comment', reviewComment);
      reviewImages.forEach(f => fd.append('reviewImages', f));
      const { data } = await api.post(`/products/${id}/reviews`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProduct(data.product);
      setReviewRating(0);
      setReviewComment('');
      setReviewImages([]);
      setReviewPreviews([]);
      toast.success('Review submitted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally { setSubmittingReview(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-orange-500">Home</Link>
        <ChevronRight size={14} />
        <Link to="/shop" className="hover:text-orange-500">Shop</Link>
        <ChevronRight size={14} />
        <Link to={`/shop?category=${product.category}`} className="hover:text-orange-500">{product.category}</Link>
        <ChevronRight size={14} />
        <span className="text-gray-700 truncate max-w-48">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Images */}
        <div>
          <div className="rounded-2xl overflow-hidden bg-gray-50 aspect-square mb-3">
            <img
              src={product.images?.[activeImg] || product.images?.[0] || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition ${activeImg === i ? 'border-orange-500' : 'border-gray-200'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <span className="text-sm text-orange-500 font-medium">{product.category}</span>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mt-1 mb-3">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex text-yellow-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={16} className={i < Math.round(product.rating || 4) ? 'fill-yellow-400' : 'text-gray-200'} />
              ))}
            </div>
            <span className="text-sm font-medium text-gray-700">{product.rating?.toFixed(1) || '4.0'}</span>
            <span className="text-sm text-gray-400">({product.numReviews || 0} reviews)</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl font-bold text-gray-900">₹{(product.discountPrice || product.price).toLocaleString()}</span>
            {discount > 0 && (
              <>
                <span className="text-lg text-gray-400 line-through">₹{product.price.toLocaleString()}</span>
                <span className="bg-green-100 text-green-600 text-sm font-bold px-2 py-0.5 rounded-full">{discount}% OFF</span>
              </>
            )}
          </div>

          <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>

          {product.keyFeatures?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Key Features</h3>
              <ul className="space-y-2">
                {product.keyFeatures.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle2 size={15} className="text-orange-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mb-4">
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {product.stock > 0 ? `✓ In Stock (${product.stock} available)` : '✗ Out of Stock'}
            </span>
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-medium text-gray-700">Quantity:</span>
            <div className="flex items-center border border-gray-200 rounded-full overflow-hidden">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-4 py-2 hover:bg-gray-50 transition"><Minus size={14} /></button>
              <span className="px-4 py-2 font-semibold text-gray-800 min-w-[3rem] text-center">{qty}</span>
              <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="px-4 py-2 hover:bg-gray-50 transition"><Plus size={14} /></button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={handleAddToCart}
              disabled={adding || product.stock === 0}
              className="flex-1 border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white disabled:opacity-50 font-bold py-3 rounded-full transition flex items-center justify-center gap-2"
            >
              <ShoppingCart size={18} /> {adding ? 'Adding...' : 'Add to Cart'}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-full transition"
            >
              Buy Now
            </button>
            <button
              onClick={() => toggleWishlist(product)}
              className="w-12 h-12 border border-gray-200 rounded-full flex items-center justify-center hover:border-red-300 transition"
            >
              <Heart size={18} className={isInWishlist(product._id) ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
            </button>
          </div>

          {/* Delivery Info */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            {[
              { icon: Truck, text: 'Free delivery on orders above ₹999' },
              { icon: Shield, text: '100% secure payment guaranteed' },
              { icon: Package, text: 'Easy 7-day return policy' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-gray-600">
                <Icon size={16} className="text-orange-500 shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          Customer Reviews
          {product.reviews?.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-400">({product.reviews.length})</span>
          )}
        </h2>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Review list */}
          <div className="lg:col-span-3 space-y-4">
            {product.reviews?.length > 0 ? product.reviews.map((r, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                    {r.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{r.name}</p>
                    <p className="text-xs text-gray-400">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</p>
                  </div>
                  <div className="flex text-yellow-400 ml-auto">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} size={13} className={j < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{r.comment}</p>
                {r.images?.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {r.images.map((img, j) => (
                      <img key={j} src={img} alt="review" className="w-16 h-16 rounded-xl object-cover border border-gray-100 cursor-zoom-in" onClick={() => window.open(img, '_blank')} />
                    ))}
                  </div>
                )}
              </div>
            )) : (
              <div className="bg-gray-50 rounded-2xl p-8 text-center text-gray-400">
                <Star size={28} className="mx-auto mb-2 text-gray-300" />
                <p>No reviews yet. Be the first to review!</p>
              </div>
            )}
          </div>

          {/* Submit review form */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 sticky top-20">
              <h3 className="font-bold text-gray-800 mb-4">Write a Review</h3>
              {user ? (
                <form onSubmit={submitReview} className="space-y-4">
                  {/* Star rating picker */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Your Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setReviewRating(star)}
                          className="focus:outline-none"
                        >
                          <Star size={28} className={`transition ${star <= (hoverRating || reviewRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                        </button>
                      ))}
                    </div>
                    {reviewRating > 0 && (
                      <p className="text-xs text-gray-400 mt-1">{['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewRating]}</p>
                    )}
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Comment</label>
                    <textarea
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      rows={4} placeholder="Share your experience with this product..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 resize-none transition"
                    />
                  </div>

                  {/* Image upload */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                      Photos <span className="font-normal normal-case text-gray-400">(up to 4)</span>
                    </label>
                    {reviewPreviews.length < 4 && (
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-400 hover:border-orange-300 hover:text-orange-400 transition w-full justify-center">
                        <Camera size={16} /> Add Photos
                      </button>
                    )}
                    <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleReviewImageChange} />
                    {reviewPreviews.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {reviewPreviews.map((src, i) => (
                          <div key={i} className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-200 group">
                            <img src={src} alt="" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeReviewImage(i)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                              <X size={14} className="text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit" disabled={submittingReview}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    {submittingReview ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</>
                    ) : <><Send size={15} /> Submit Review</>}
                  </button>
                </form>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500 mb-3">Please login to write a review</p>
                  <Link to="/login" className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition">Login to Review</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
