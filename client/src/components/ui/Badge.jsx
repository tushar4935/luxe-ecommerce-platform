const tones = {
  gold: 'bg-accent/15 text-accent',
  green: 'bg-success/15 text-success',
  red: 'bg-error/15 text-error',
  gray: 'bg-border text-textSecondary',
  solidGold: 'bg-accent text-background',
  solidRed: 'bg-error text-white',
};

export default function Badge({ children, tone = 'gold', className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

// Maps an order status to a colored badge tone + label.
export function StatusBadge({ status }) {
  const map = {
    processing: { tone: 'gold', label: 'Processing' },
    confirmed: { tone: 'gold', label: 'Confirmed' },
    shipped: { tone: 'gold', label: 'Shipped' },
    delivered: { tone: 'green', label: 'Delivered' },
    cancelled: { tone: 'red', label: 'Cancelled' },
    returned: { tone: 'red', label: 'Returned' },
    pending: { tone: 'gray', label: 'Pending' },
    paid: { tone: 'green', label: 'Paid' },
    failed: { tone: 'red', label: 'Failed' },
    refunded: { tone: 'gray', label: 'Refunded' },
  };
  const cfg = map[status] || { tone: 'gray', label: status };
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}
