import { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import { getErrorMessage } from '../../api/axios';

/**
 * The actual card form. Must live inside <Elements> so the useStripe/useElements
 * hooks have a Stripe context. On submit it confirms the PaymentIntent in-page
 * (card-only → no redirect) and, on success, hands the PaymentIntent id back so
 * the parent can create the order (which the server re-verifies with Stripe).
 */
function InnerForm({ amountLabel, onPaid }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required', // stay in-page for card payments
      confirmParams: { return_url: `${window.location.origin}/checkout` },
    });

    if (error) {
      toast.error(error.message || 'Payment failed. Please try again.');
      setSubmitting(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      try {
        await onPaid(paymentIntent.id); // navigates away on success
      } catch (err) {
        toast.error(getErrorMessage(err));
        setSubmitting(false);
      }
    } else {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <PaymentElement />
      <Button onClick={handlePay} loading={submitting} disabled={!stripe} className="w-full">
        Pay {amountLabel}
      </Button>
    </div>
  );
}

/**
 * Wraps the card form in Stripe's <Elements> provider, keyed by the PaymentIntent
 * client secret. Renders nothing until both the Stripe instance and the client
 * secret are ready.
 */
export default function StripePaymentForm({ stripePromise, clientSecret, amountLabel, onPaid }) {
  if (!stripePromise || !clientSecret) return null;

  const options = {
    clientSecret,
    appearance: { theme: 'night', variables: { colorPrimary: '#c9a84c' } },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <InnerForm amountLabel={amountLabel} onPaid={onPaid} />
    </Elements>
  );
}
