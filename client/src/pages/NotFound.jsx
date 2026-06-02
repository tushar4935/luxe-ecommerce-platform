import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="font-serif text-8xl font-bold text-gradient-gold">404</p>
      <h1 className="mt-4 font-serif text-3xl text-textPrimary">Page not found</h1>
      <p className="mt-3 max-w-md text-textSecondary">
        The page you’re looking for doesn’t exist or has been moved. Let’s get you back to the
        collection.
      </p>
      <Link to="/" className="mt-8">
        <Button>Back to Home</Button>
      </Link>
    </div>
  );
}
