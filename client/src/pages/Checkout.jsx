import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Check, CreditCard, Banknote, Lock, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import StripePaymentForm from '../components/cart/StripePaymentForm';
import { computeTotals, readSavedCoupon, clearSavedCoupon } from '../components/cart/CartSummary';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { orderApi } from '../api/orderApi';
import { paymentApi, loadRazorpayScript, getStripePromise } from '../api/paymentApi';
import { userApi } from '../api/userApi';
import { getErrorMessage } from '../api/axios';
import { formatCurrency } from '../utils/formatCurrency';
import { effectivePrice } from '../utils/calculateDiscount';

const STEPS = ['Shipping', 'Payment', 'Review'];

const emptyAddress = {
  fullName: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  country: '',
  zip: '',
};

export default function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, count, clearCart } = useCart();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [email, setEmail] = useState(user?.email || '');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('new');
  const [address, setAddress] = useState({ ...emptyAddress, fullName: user?.name || '', phone: user?.phone || '' });
  const [saveAddress, setSaveAddress] = useState(false);
  const [payment, setPayment] = useState('cod');
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);
  const [stripeCfg, setStripeCfg] = useState({ enabled: false, publishableKey: null });
  const [razorpayCfg, setRazorpayCfg] = useState({ enabled: false, keyId: null, currency: 'INR' });
  const [usdToInr, setUsdToInr] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);

  const coupon = readSavedCoupon();
  const { shipping, tax, total, discounted } = computeTotals(subtotal, coupon?.discount || 0);

  // Stripe.js instance (memoized by publishable key) + the ≈INR preview amount.
  const stripePromise = useMemo(() => getStripePromise(stripeCfg.publishableKey), [stripeCfg.publishableKey]);
  const inrApprox = usdToInr ? Math.round(total * usdToInr) : null;

  // Build the payment options from whichever gateways are configured.
  const paymentOptions = useMemo(() => {
    const opts = [];
    if (stripeCfg.enabled) {
      opts.push({ id: 'stripe', label: 'Card — Pay in USD', icon: CreditCard, sub: 'Secure payment via Stripe' });
    }
    if (razorpayCfg.enabled) {
      opts.push({
        id: 'razorpay',
        label: 'UPI / Card — Pay in INR',
        icon: CreditCard,
        sub: inrApprox ? `Razorpay · ≈ ₹${inrApprox.toLocaleString('en-IN')}` : 'Secure payment via Razorpay',
      });
    }
    if (!stripeCfg.enabled && !razorpayCfg.enabled) {
      opts.push({ id: 'card', label: 'Credit / Debit Card', icon: CreditCard, sub: 'Demo card — no real charge' });
    }
    opts.push({ id: 'cod', label: 'Cash on Delivery', icon: Banknote, sub: 'Pay when you receive' });
    return opts;
  }, [stripeCfg.enabled, razorpayCfg.enabled, inrApprox]);

  // Redirect if cart empty
  useEffect(() => {
    if (count === 0) navigate('/cart');
  }, [count, navigate]);

  // Load saved addresses
  useEffect(() => {
    userApi
      .getAddresses()
      .then((res) => {
        const list = res.data.addresses || [];
        setSavedAddresses(list);
        const def = list.find((a) => a.isDefault) || list[0];
        if (def) {
          setSelectedAddressId(def._id);
          setAddress({
            fullName: def.fullName,
            phone: def.phone,
            street: def.street,
            city: def.city,
            state: def.state,
            country: def.country,
            zip: def.zip,
          });
        }
      })
      .catch(() => {});
  }, []);

  // Discover which gateways are available + the live USD→INR rate, then default
  // to the first available online option (falling back to COD).
  useEffect(() => {
    paymentApi
      .getConfig()
      .then((res) => {
        const s = res.data.stripe || { enabled: false };
        const r = res.data.razorpay || { enabled: false };
        setStripeCfg(s);
        setRazorpayCfg(r);
        setUsdToInr(res.data.usdToInr || null);
        setPayment(s.enabled ? 'stripe' : r.enabled ? 'razorpay' : 'cod');
      })
      .catch(() => {});
  }, []);

  // Create a Stripe PaymentIntent when the user reaches Review with Stripe
  // selected (recreated if they change coupon/gateway and return).
  useEffect(() => {
    if (step === 2 && payment === 'stripe' && stripeCfg.enabled) {
      setClientSecret(null);
      paymentApi
        .createStripePaymentIntent({ couponCode: coupon?.code })
        .then((res) => setClientSecret(res.data.clientSecret))
        .catch((err) => toast.error(getErrorMessage(err)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, payment, stripeCfg.enabled]);

  const pickSaved = (a) => {
    setSelectedAddressId(a._id);
    setAddress({
      fullName: a.fullName,
      phone: a.phone,
      street: a.street,
      city: a.city,
      state: a.state,
      country: a.country,
      zip: a.zip,
    });
  };

  const validateShipping = () => {
    const e = {};
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) e.email = 'Valid email is required';
    ['fullName', 'phone', 'street', 'city', 'country', 'zip'].forEach((k) => {
      if (!address[k]?.trim()) e[k] = 'Required';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Card details are entered in the Razorpay window (or skipped in demo mode),
  // so there's nothing to validate on this step beyond shipping.
  const validatePayment = () => true;

  const next = () => {
    if (step === 0 && !validateShipping()) return;
    if (step === 1 && !validatePayment()) return;
    setErrors({});
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  // Create the order on our backend. Maps the selected option → the API's
  // paymentMethod + gateway, attaching the gateway-specific proof in `extra`
  // (Stripe PaymentIntent id or Razorpay signature) which the server verifies.
  const finalizeOrder = async (extra = {}) => {
    const paymentMethod = payment === 'cod' ? 'cod' : 'card';
    const gateway =
      payment === 'stripe' ? 'stripe' : payment === 'razorpay' ? 'razorpay' : undefined;
    const { data } = await orderApi.create({
      shippingAddress: address,
      paymentMethod,
      gateway,
      couponCode: coupon?.code,
      notes: '',
      ...extra,
    });
    clearSavedCoupon();
    await clearCart();
    toast.success('Order placed successfully');
    navigate(`/order-confirmation/${data.order._id}`);
  };

  // Open the Razorpay checkout window, then finalize the order on success.
  const payWithRazorpay = async () => {
    const ready = await loadRazorpayScript();
    if (!ready) {
      toast.error('Could not load the payment window. Check your connection.');
      setPlacing(false);
      return;
    }

    let rzpOrder;
    try {
      const { data } = await paymentApi.createRazorpayOrder({ couponCode: coupon?.code });
      rzpOrder = data;
    } catch (err) {
      toast.error(getErrorMessage(err));
      setPlacing(false);
      return;
    }

    const rzp = new window.Razorpay({
      key: rzpOrder.keyId,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      order_id: rzpOrder.orderId,
      name: 'LUXE',
      description: 'Order payment',
      prefill: { name: address.fullName, email, contact: address.phone },
      theme: { color: '#c9a84c' },
      handler: async (response) => {
        try {
          await finalizeOrder({
            razorpay: {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            },
          });
        } catch (err) {
          toast.error(getErrorMessage(err));
        } finally {
          setPlacing(false);
        }
      },
      modal: {
        ondismiss: () => {
          setPlacing(false);
          toast('Payment cancelled');
        },
      },
    });
    rzp.on('payment.failed', (resp) => {
      toast.error(resp.error?.description || 'Payment failed. Please try again.');
      setPlacing(false);
    });
    rzp.open();
  };

  const placeOrder = async () => {
    setPlacing(true);
    try {
      if (saveAddress && selectedAddressId === 'new') {
        try {
          await userApi.addAddress({ ...address, label: 'Home' });
        } catch {
          /* non-fatal */
        }
      }

      // Razorpay → pay in the gateway window, then finalize inside its callbacks.
      if (payment === 'razorpay' && razorpayCfg.enabled) {
        await payWithRazorpay();
        return;
      }

      // Stripe has its own inline "Pay" button (Review step), so it never reaches
      // here. COD / demo-card → create the order directly.
      await finalizeOrder();
      setPlacing(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setPlacing(false);
    }
  };

  const field = (key, label, props = {}) => (
    <Input
      label={label}
      value={address[key]}
      onChange={(e) => setAddress((a) => ({ ...a, [key]: e.target.value }))}
      error={errors[key]}
      {...props}
    />
  );

  return (
    <div className="container-luxe py-10">
      <h1 className="mb-8 font-serif text-4xl text-textPrimary">Checkout</h1>

      {/* Stepper */}
      <div className="mb-10 flex items-center justify-center">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
                  i < step
                    ? 'border-accent bg-accent text-background'
                    : i === step
                    ? 'border-accent text-accent'
                    : 'border-border text-textMuted'
                }`}
              >
                {i < step ? <Check size={18} /> : i + 1}
              </div>
              <span className={`mt-2 text-xs ${i <= step ? 'text-textPrimary' : 'text-textMuted'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-3 h-px w-16 sm:w-28 ${i < step ? 'bg-accent' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* Form column */}
        <div className="rounded-card border border-border bg-card p-6 md:p-8">
          {/* Step 1: Shipping */}
          {step === 0 && (
            <div className="animate-fade-in">
              <h2 className="mb-5 font-serif text-2xl text-textPrimary">Contact Information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  containerClassName="sm:col-span-2"
                />
              </div>

              {savedAddresses.length > 0 && (
                <div className="mt-6">
                  <p className="mb-3 text-sm font-medium text-textPrimary">Saved Addresses</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {savedAddresses.map((a) => (
                      <button
                        key={a._id}
                        onClick={() => pickSaved(a)}
                        className={`rounded-card border p-4 text-left text-sm transition-colors ${
                          selectedAddressId === a._id
                            ? 'border-accent bg-accent/5'
                            : 'border-border hover:border-accent/50'
                        }`}
                      >
                        <p className="font-medium text-textPrimary">{a.fullName} {a.isDefault && '· Default'}</p>
                        <p className="mt-1 text-textSecondary">{a.street}, {a.city}, {a.country} {a.zip}</p>
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setSelectedAddressId('new');
                        setAddress({ ...emptyAddress, fullName: user?.name || '', phone: user?.phone || '' });
                      }}
                      className={`rounded-card border border-dashed p-4 text-sm transition-colors ${
                        selectedAddressId === 'new' ? 'border-accent text-accent' : 'border-border text-textSecondary hover:border-accent/50'
                      }`}
                    >
                      + Use a new address
                    </button>
                  </div>
                </div>
              )}

              <h2 className="mb-5 mt-8 font-serif text-2xl text-textPrimary">Shipping Address</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {field('fullName', 'Full Name', { containerClassName: 'sm:col-span-2' })}
                {field('phone', 'Phone')}
                {field('zip', 'ZIP / Postal Code')}
                {field('street', 'Street Address', { containerClassName: 'sm:col-span-2' })}
                {field('city', 'City')}
                {field('state', 'State / Province')}
                {field('country', 'Country', { containerClassName: 'sm:col-span-2' })}
              </div>

              {selectedAddressId === 'new' && (
                <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-textSecondary">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                    className="h-4 w-4 accent-accent"
                  />
                  Save this address for future orders
                </label>
              )}
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="mb-5 font-serif text-2xl text-textPrimary">Payment Method</h2>
              <div className="space-y-3">
                {paymentOptions.map((m) => (
                  <label
                    key={m.id}
                    className={`flex cursor-pointer items-center gap-4 rounded-card border p-4 transition-colors ${
                      payment === m.id ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={payment === m.id}
                      onChange={() => setPayment(m.id)}
                      className="h-4 w-4 accent-accent"
                    />
                    <m.icon size={22} className="text-accent" />
                    <div>
                      <p className="text-sm font-medium text-textPrimary">{m.label}</p>
                      <p className="text-xs text-textSecondary">{m.sub}</p>
                    </div>
                  </label>
                ))}
              </div>

              {payment === 'stripe' && (
                <div className="mt-6 rounded-card border border-border bg-surface p-5 text-sm text-textSecondary">
                  <p className="flex items-center gap-1.5 text-textPrimary">
                    <Lock size={14} className="text-accent" /> You&apos;ll enter your card securely on the next step (Review).
                  </p>
                  <p className="mt-1 text-xs text-textMuted">
                    Test card <code className="rounded bg-card px-1">4242 4242 4242 4242</code>, any future expiry, any CVC &amp; ZIP.
                  </p>
                </div>
              )}
              {payment === 'razorpay' && (
                <div className="mt-6 rounded-card border border-border bg-surface p-5 text-sm text-textSecondary">
                  <div className="space-y-1.5">
                    <p className="flex items-center gap-1.5 text-textPrimary">
                      <Lock size={14} className="text-accent" /> You&apos;ll pay securely in the Razorpay window
                      {inrApprox ? ` (≈ ₹${inrApprox.toLocaleString('en-IN')})` : ''}.
                    </p>
                    <p className="text-xs text-textMuted">
                      Test mode — UPI <code className="rounded bg-card px-1">success@razorpay</code> or card{' '}
                      <code className="rounded bg-card px-1">4111 1111 1111 1111</code>, any future expiry &amp; any CVV.
                    </p>
                  </div>
                </div>
              )}
              {payment === 'card' && (
                <div className="mt-6 rounded-card border border-border bg-surface p-5 text-sm text-textSecondary">
                  <p className="flex items-center gap-1.5">
                    <Lock size={14} className="text-accent" /> Demo mode — no real charge.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="mb-5 font-serif text-2xl text-textPrimary">Review Your Order</h2>

              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item._id} className="flex items-center gap-4 border-b border-border pb-4">
                    <img
                      src={item.product.images?.[0]?.url}
                      alt={item.product.name}
                      className="h-16 w-16 rounded border border-border object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-textPrimary">{item.product.name}</p>
                      <p className="text-xs text-textSecondary">
                        {item.size && `Size ${item.size} · `}
                        {item.color && `${item.color} · `}Qty {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-accent">
                      {formatCurrency(effectivePrice(item.product) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-card border border-border p-4 text-sm">
                  <p className="mb-2 font-medium text-textPrimary">Shipping To</p>
                  <p className="text-textSecondary">{address.fullName}</p>
                  <p className="text-textSecondary">{address.street}</p>
                  <p className="text-textSecondary">
                    {address.city}, {address.state} {address.zip}
                  </p>
                  <p className="text-textSecondary">{address.country}</p>
                  <p className="mt-1 text-textSecondary">{address.phone}</p>
                </div>
                <div className="rounded-card border border-border p-4 text-sm">
                  <p className="mb-2 font-medium text-textPrimary">Payment</p>
                  <p className="text-textSecondary">
                    {payment === 'cod'
                      ? 'Cash on Delivery'
                      : payment === 'stripe'
                      ? 'Card · Stripe (USD)'
                      : payment === 'razorpay'
                      ? 'UPI / Card · Razorpay (INR)'
                      : 'Card'}
                  </p>
                  <p className="mt-2 font-medium text-textPrimary">Contact</p>
                  <p className="text-textSecondary">{email}</p>
                </div>
              </div>

              {payment === 'stripe' && stripeCfg.enabled && (
                <div className="mt-6 rounded-card border border-border bg-surface p-5">
                  <p className="mb-3 flex items-center gap-1.5 text-sm text-textPrimary">
                    <Lock size={14} className="text-accent" /> Card details · Stripe (USD)
                  </p>
                  {clientSecret ? (
                    <StripePaymentForm
                      stripePromise={stripePromise}
                      clientSecret={clientSecret}
                      amountLabel={formatCurrency(total)}
                      onPaid={(piId) => finalizeOrder({ stripePaymentIntentId: piId })}
                    />
                  ) : (
                    <p className="text-sm text-textSecondary">Preparing secure payment…</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Nav buttons */}
          <div className="mt-8 flex items-center justify-between">
            {step > 0 ? (
              <Button variant="ghost" onClick={back}>
                <ChevronLeft size={16} /> Back
              </Button>
            ) : (
              <Link to="/cart">
                <Button variant="ghost">
                  <ChevronLeft size={16} /> Cart
                </Button>
              </Link>
            )}

            {step < STEPS.length - 1 ? (
              <Button onClick={next}>Continue</Button>
            ) : payment === 'stripe' && stripeCfg.enabled ? (
              <span className="text-xs text-textMuted">Complete card payment above to place your order</span>
            ) : (
              <Button onClick={placeOrder} loading={placing}>
                Place Order · {formatCurrency(total)}
              </Button>
            )}
          </div>
        </div>

        {/* Summary column */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-card border border-border bg-card p-6">
            <h2 className="mb-5 font-serif text-xl text-textPrimary">Order Summary</h2>
            <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item._id} className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={item.product.images?.[0]?.url}
                      alt={item.product.name}
                      className="h-12 w-12 rounded border border-border object-cover"
                    />
                    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-background">
                      {item.quantity}
                    </span>
                  </div>
                  <p className="flex-1 truncate text-xs text-textSecondary">{item.product.name}</p>
                  <p className="text-xs font-semibold text-textPrimary">
                    {formatCurrency(effectivePrice(item.product) * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3 border-t border-border pt-5 text-sm">
              <div className="flex justify-between">
                <span className="text-textSecondary">Subtotal</span>
                <span className="text-textPrimary">{formatCurrency(subtotal)}</span>
              </div>
              {coupon?.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-textSecondary">Discount ({coupon.code})</span>
                  <span className="text-accent">- {formatCurrency(coupon.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-textSecondary">Shipping</span>
                <span className="text-textPrimary">{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-textSecondary">Tax (10%)</span>
                <span className="text-textPrimary">{formatCurrency(tax)}</span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-border pt-5">
              <span className="text-sm font-medium text-textPrimary">Total</span>
              <span className="font-serif text-2xl font-bold text-accent">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
