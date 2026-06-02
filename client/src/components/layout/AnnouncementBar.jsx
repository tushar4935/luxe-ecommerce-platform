const messages = [
  'Free shipping on orders over $100',
  'New Collection 2025 — now live',
  'Easy 30-day returns',
  'Members get early access to drops',
];

export default function AnnouncementBar() {
  // Duplicate the list so the marquee loops seamlessly at -50%.
  const loop = [...messages, ...messages];
  return (
    <div className="overflow-hidden bg-accent text-background">
      <div className="flex w-max animate-marquee whitespace-nowrap py-2">
        {loop.map((m, i) => (
          <span key={i} className="mx-8 text-xs font-medium uppercase tracking-wider">
            {m}
            <span className="mx-8 text-background/40">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
