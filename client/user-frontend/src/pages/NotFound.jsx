import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h1 className="text-9xl font-black text-orange-500 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h2>
      <p className="text-gray-500 mb-8">Oops! The page you're looking for doesn't exist.</p>
      <Link to="/" className="bg-orange-500 text-white font-bold px-8 py-3 rounded-full hover:bg-orange-600 transition">
        Go Back Home
      </Link>
    </div>
  );
}
