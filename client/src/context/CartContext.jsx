import { createContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { cartApi } from '../api/cartApi';
import { getErrorMessage } from '../api/axios';
import { effectivePrice } from '../utils/calculateDiscount';
import { useAuth } from '../hooks/useAuth';

export const CartContext = createContext(null);

const GUEST_KEY = 'luxe_guest_cart';

const localId = () => `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const computeSubtotal = (items) =>
  Math.round(
    items.reduce((sum, i) => sum + effectivePrice(i.product) * i.quantity, 0) * 100
  ) / 100;

export function CartProvider({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const syncedRef = useRef(false);

  // ── Guest helpers ─────────────────────────────────────────────────────
  const readGuest = () => {
    try {
      return JSON.parse(localStorage.getItem(GUEST_KEY)) || [];
    } catch {
      return [];
    }
  };
  const writeGuest = (next) => {
    localStorage.setItem(GUEST_KEY, JSON.stringify(next));
  };

  const applyGuest = useCallback((next) => {
    setItems(next);
    setSubtotal(computeSubtotal(next));
    writeGuest(next);
  }, []);

  const applyServer = useCallback((cart, sub) => {
    const list = cart?.items || [];
    setItems(list);
    setSubtotal(sub ?? computeSubtotal(list));
  }, []);

  // ── Load cart whenever auth state settles ─────────────────────────────
  const loadServerCart = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await cartApi.get();
      applyServer(data.cart, data.subtotal);
    } catch (err) {
      console.error('Cart load failed:', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [applyServer]);

  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated) {
      // On first authenticated render, merge any guest cart then load.
      (async () => {
        if (!syncedRef.current) {
          syncedRef.current = true;
          const guest = readGuest();
          if (guest.length) {
            try {
              const payload = guest.map((i) => ({
                productId: i.product._id,
                quantity: i.quantity,
                size: i.size,
                color: i.color,
              }));
              const { data } = await cartApi.sync(payload);
              applyServer(data.cart, data.subtotal);
              localStorage.removeItem(GUEST_KEY);
              setLoading(false);
              return;
            } catch (err) {
              console.error('Cart sync failed:', getErrorMessage(err));
            }
          }
        }
        await loadServerCart();
      })();
    } else {
      syncedRef.current = false;
      applyGuest(readGuest());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading]);

  // ── Actions ───────────────────────────────────────────────────────────
  const addItem = useCallback(
    async (product, { quantity = 1, size = '', color = '' } = {}) => {
      if (isAuthenticated) {
        try {
          const { data } = await cartApi.add({ productId: product._id, quantity, size, color });
          applyServer(data.cart, data.subtotal);
          setDrawerOpen(true);
          toast.success('Added to cart');
        } catch (err) {
          toast.error(getErrorMessage(err));
        }
      } else {
        const next = [...readGuest()];
        const existing = next.find(
          (i) => i.product._id === product._id && i.size === size && i.color === color
        );
        if (existing) existing.quantity += quantity;
        else
          next.push({
            _id: localId(),
            product: {
              _id: product._id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              discountPrice: product.discountPrice,
              images: product.images,
              stock: product.stock,
              brand: product.brand,
            },
            quantity,
            size,
            color,
          });
        applyGuest(next);
        setDrawerOpen(true);
        toast.success('Added to cart');
      }
    },
    [isAuthenticated, applyServer, applyGuest]
  );

  const updateItem = useCallback(
    async (itemId, patch) => {
      if (isAuthenticated) {
        try {
          const { data } = await cartApi.update(itemId, patch);
          applyServer(data.cart, data.subtotal);
        } catch (err) {
          toast.error(getErrorMessage(err));
        }
      } else {
        const next = readGuest().map((i) => (i._id === itemId ? { ...i, ...patch } : i));
        applyGuest(next);
      }
    },
    [isAuthenticated, applyServer, applyGuest]
  );

  const removeItem = useCallback(
    async (itemId) => {
      if (isAuthenticated) {
        try {
          const { data } = await cartApi.remove(itemId);
          applyServer(data.cart, data.subtotal);
          toast.success('Item removed');
        } catch (err) {
          toast.error(getErrorMessage(err));
        }
      } else {
        applyGuest(readGuest().filter((i) => i._id !== itemId));
        toast.success('Item removed');
      }
    },
    [isAuthenticated, applyServer, applyGuest]
  );

  const clearCart = useCallback(async () => {
    if (isAuthenticated) {
      try {
        await cartApi.clear();
      } catch {
        /* ignore */
      }
    } else {
      localStorage.removeItem(GUEST_KEY);
    }
    setItems([]);
    setSubtotal(0);
  }, [isAuthenticated]);

  const count = useMemo(() => items.reduce((n, i) => n + i.quantity, 0), [items]);

  const value = useMemo(
    () => ({
      items,
      subtotal,
      count,
      loading,
      drawerOpen,
      setDrawerOpen,
      addItem,
      updateItem,
      removeItem,
      clearCart,
      reload: loadServerCart,
    }),
    [items, subtotal, count, loading, drawerOpen, addItem, updateItem, removeItem, clearCart, loadServerCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
