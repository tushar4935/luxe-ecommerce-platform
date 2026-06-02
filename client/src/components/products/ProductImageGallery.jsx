import { useState } from 'react';

/**
 * Large main image with thumbnail row. Click thumbnail → crossfade swap.
 * Hover the main image → subtle zoom.
 */
export default function ProductImageGallery({ images = [], alt = '' }) {
  const list = images.length ? images : [{ url: 'https://picsum.photos/seed/luxe/600/600' }];
  const [active, setActive] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);

  const select = (i) => {
    if (i === active) return;
    setActive(i);
    setFadeKey((k) => k + 1);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="group relative aspect-square overflow-hidden rounded-card border border-border bg-card">
        <img
          key={fadeKey}
          src={list[active].url}
          alt={alt}
          className="h-full w-full animate-fade-in object-cover transition-transform duration-500 ease-luxe group-hover:scale-110"
        />
      </div>

      {list.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {list.slice(0, 4).map((img, i) => (
            <button
              key={i}
              onClick={() => select(i)}
              aria-label={`View image ${i + 1}`}
              className={`aspect-square overflow-hidden rounded border-2 transition-all duration-300 ${
                active === i ? 'border-accent' : 'border-border hover:border-accent/50'
              }`}
            >
              <img src={img.url} alt={`${alt} thumbnail ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
