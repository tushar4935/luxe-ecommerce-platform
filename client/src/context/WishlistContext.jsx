import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { wishlistApi } from '../api/cartApi';
import { getErrorMessage } from '../api/axios';
import { useAuth } from '../hooks/useAuth';

export const WishlistContext = createContext(null);

const GUEST_KEY = 'luxe_guest_wishlist';

export function WishlistProvider({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]); // full product objects
  const [loading, setLoading] = useState(false);

  const readGuest = () => {
    try {
      return JSON.parse(localStorage.getItem(GUEST_KEY)) || [];
    } catch {
      return [];
    }
  };
  const writeGuest = (next) => localStorage.setItem(GUEST_KEY, JSON.stringify(next));

  const loadServer = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await wishlistApi.get();
      setProducts(data.wishlist?.products || []);
    } catch (err) {
      console.error('Wishlist load failed:', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      (async () => {
        // Push any guest wishlist items up to the server, then load
        const guest = readGuest();
        if (guest.length) {
          await Promise.allSettled(guest.map((p) => wishlistApi.add(p._id)));
          localStorage.removeItem(GUEST_KEY);
        }
        await loadServer();
      })();
    } else {
      setProducts(readGuest());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading]);

  const ids = useMemo(() => new Set(products.map((p) => p._id)), [products]);
  const isWishlisted = useCallback((productId) => ids.has(productId), [ids]);

  const add = useCallback(
    async (product) => {
      if (isAuthenticated) {
        try {
          await wishlistApi.add(product._id);
          setProducts((prev) =>
            prev.some((p) => p._id === product._id) ? prev : [...prev, product]
          );
          toast.success('Added to wishlist');
        } catch (err) {
          toast.error(getErrorMessage(err));
        }
      } else {
        const next = readGuest();
        if (!next.some((p) => p._id === product._id)) {
          next.push(product);
          writeGuest(next);
          setProducts(next);
        }
        toast.success('Added to wishlist');
      }
    },
    [isAuthenticated]
  );

  const remove = useCallback(
    async (productId) => {
      if (isAuthenticated) {
        try {
          await wishlistApi.remove(productId);
        } catch (err) {
          toast.error(getErrorMessage(err));
          return;
        }
      } else {
        writeGuest(readGuest().filter((p) => p._id !== productId));
      }
      setProducts((prev) => prev.filter((p) => p._id !== productId));
      toast.success('Removed from wishlist');
    },
    [isAuthenticated]
  );

  const toggle = useCallback(
    (product) => (ids.has(product._id) ? remove(product._id) : add(product)),
    [ids, add, remove]
  );

  const value = useMemo(
    () => ({
      products,
      count: products.length,
      loading,
      isWishlisted,
      add,
      remove,
      toggle,
      reload: loadServer,
    }),
    [products, loading, isWishlisted, add, remove, toggle, loadServer]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
