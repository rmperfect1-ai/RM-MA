import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DICTIONARIES } from '../data/i18n';
import { GALLERY_ITEMS } from '../data/seedData';
import type { AppLanguage, GalleryCategory, GalleryItem } from '../types/restaurant';
import { resolveGalleryAssetUrl } from '../utils/dishImages';

const GALLERY_FILTERS: Array<'All' | GalleryCategory> = [
  'All',
  'Food & Drink',
  'Vibe',
  'Menu',
];

function GalleryArtwork({ item }: { item: GalleryItem }) {
  return (
    <svg
      viewBox="0 0 400 300"
      className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`gal-glow-${item.id}`} cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.24" />
          <stop offset="55%" stopColor="#2D4A3E" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#0D0A07" stopOpacity="1" />
        </radialGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#gal-glow-${item.id})`} />

      <path
        d="M52 278 L52 125 Q52 44 200 26 Q348 44 348 125 L348 278"
        fill="none"
        stroke="#C9A84C"
        strokeOpacity="0.25"
        strokeWidth="1.5"
      />
      <path
        d="M72 278 L72 132 Q72 62 200 46 Q328 62 328 132 L328 278"
        fill="none"
        stroke="#C9A84C"
        strokeOpacity="0.12"
        strokeWidth="1"
      />

      {item.motif === 'lagan' && (
        <g>
          <ellipse cx="200" cy="176" rx="108" ry="62" fill="#17130E" stroke="#C9A84C" strokeWidth="2" />
          <ellipse cx="200" cy="172" rx="74" ry="42" fill="#D49A3A" />
          <ellipse cx="188" cy="162" rx="22" ry="11" fill="#632919" />
          <ellipse cx="216" cy="172" rx="18" ry="10" fill="#73311F" />
          <circle cx="200" cy="148" r="9" fill="#EAE0C8" />
        </g>
      )}

      {item.motif === 'courtyard' && (
        <g>
          {[135, 200, 265].map((lx, idx) => (
            <g key={lx}>
              <line x1={lx} y1="36" x2={lx} y2={90 + idx * 14} stroke="#C9A84C" strokeWidth="1.2" />
              <polygon
                points={`${lx},${88 + idx * 14} ${lx + 12},${108 + idx * 14} ${lx},${130 + idx * 14} ${lx - 12},${108 + idx * 14}`}
                fill="#C9A84C"
                fillOpacity="0.32"
                stroke="#E6CB7D"
                strokeWidth="1.3"
              />
            </g>
          ))}
          <rect x="92" y="210" width="216" height="16" rx="4" fill="#2A1D13" stroke="#C9A84C" strokeOpacity="0.35" />
          <circle cx="150" cy="202" r="9" fill="#E6CB7D" fillOpacity="0.45" />
          <circle cx="250" cy="202" r="9" fill="#E6CB7D" fillOpacity="0.45" />
        </g>
      )}

      {item.motif === 'cheesecake' && (
        <g>
          <ellipse cx="200" cy="196" rx="84" ry="38" fill="#1A1510" stroke="#C9A84C" strokeWidth="1.6" />
          <polygon points="152,194 248,194 232,140 168,140" fill="#EAE1CA" />
          <path d="M167 140 Q200 128 233 140 L226 154 Q200 146 174 154 Z" fill="#467653" />
          <circle cx="192" cy="142" r="4" fill="#82B674" />
          <circle cx="206" cy="140" r="3.5" fill="#92C783" />
          <path d="M142 200 Q190 214 244 200" stroke="#C9A84C" strokeWidth="2.5" fill="none" />
        </g>
      )}

      {item.motif === 'somsa' && (
        <g>
          <ellipse cx="200" cy="186" rx="94" ry="48" fill="#16120D" stroke="#C9A84C" strokeWidth="1.6" />
          <polygon points="196,120 242,188 152,188" fill="#D5953F" stroke="#8C591A" strokeWidth="1.4" />
          <polygon points="148,148 188,200 122,196" fill="#BE8032" stroke="#8C591A" strokeWidth="1.2" />
          <polygon points="248,148 278,196 212,200" fill="#C98838" stroke="#8C591A" strokeWidth="1.2" />
          <circle cx="200" cy="206" r="14" fill="#EAE2CE" stroke="#C9A84C" strokeWidth="1.2" />
        </g>
      )}

      {item.motif === 'tea' && (
        <g>
          <ellipse cx="176" cy="176" rx="46" ry="38" fill="#213A31" stroke="#C9A84C" strokeWidth="2" />
          <circle cx="176" cy="138" r="13" fill="#2D4A3E" stroke="#C9A84C" strokeWidth="1.5" />
          <path d="M130 172 Q108 156 118 188" stroke="#C9A84C" strokeWidth="3.5" fill="none" />
          <path d="M218 164 Q242 140 248 144" stroke="#213A31" strokeWidth="7" fill="none" strokeLinecap="round" />
          <ellipse cx="264" cy="196" rx="22" ry="14" fill="#F5EDD6" stroke="#C9A84C" strokeWidth="1.5" />
          <ellipse cx="264" cy="193" rx="16" ry="9" fill="#C98A2C" />
        </g>
      )}

      {item.motif === 'tandoor' && (
        <g>
          <ellipse cx="200" cy="212" rx="112" ry="36" fill="#24140D" stroke="#8B3A2A" strokeWidth="2" />
          <ellipse cx="200" cy="212" rx="76" ry="22" fill="#8B3A2A" fillOpacity="0.6" />
          <ellipse cx="200" cy="212" rx="44" ry="12" fill="#C9A84C" fillOpacity="0.55" />
          <line x1="120" y1="158" x2="280" y2="158" stroke="#B8B2A6" strokeWidth="3" />
          <rect x="150" y="148" width="22" height="20" rx="4" fill="#6D2D1D" />
          <rect x="188" y="148" width="24" height="20" rx="4" fill="#7D3523" />
          <rect x="228" y="148" width="22" height="20" rx="4" fill="#642819" />
        </g>
      )}
    </svg>
  );
}

export function GalleryMedia({ item }: { item: GalleryItem }) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = resolveGalleryAssetUrl(item.imageUrl);

  if (resolvedSrc && !failed) {
    return (
      <img
        src={resolvedSrc}
        alt={item.title}
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
    );
  }

  return <GalleryArtwork item={item} />;
}

interface GallerySectionProps {
  language: AppLanguage;
}

export function GallerySection({ language }: GallerySectionProps) {
  const dict = DICTIONARIES[language].gallerySection;
  const [filter, setFilter] = useState<'All' | GalleryCategory>('All');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const visibleItems =
    filter === 'All'
      ? GALLERY_ITEMS
      : GALLERY_ITEMS.filter((item) => item.category === filter);

  useEffect(() => {
    if (activeIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveIndex(null);
      if (e.key === 'ArrowRight') {
        setActiveIndex((idx) => (idx === null ? null : (idx + 1) % visibleItems.length));
      }
      if (e.key === 'ArrowLeft') {
        setActiveIndex((idx) =>
          idx === null ? null : (idx - 1 + visibleItems.length) % visibleItems.length,
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, visibleItems.length]);

  const activeItem = activeIndex !== null ? visibleItems[activeIndex] ?? null : null;

  return (
    <section
      id="gallery"
      aria-labelledby="gallery-heading"
      className="border-t border-[#C9A84C]/15 bg-[#0D0A07] py-20"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#C9A84C]">
              {dict.badge}
            </p>
            <h2
              id="gallery-heading"
              className="font-display mt-2 text-3xl font-semibold text-[#F5EDD6] sm:text-4xl"
            >
              {dict.heading}
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="Filter gallery by section"
            className="flex flex-wrap items-center gap-1.5 rounded-lg border border-[#C9A84C]/20 bg-[#14100C] p-1"
          >
            {GALLERY_FILTERS.map((cat) => {
              const active = filter === cat;
              return (
                <button
                  key={cat}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => {
                    setFilter(cat);
                    setActiveIndex(null);
                  }}
                  className={`rounded-md px-3.5 py-2 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#C9A84C] text-[#0A0806]'
                      : 'text-[#B8AE98] hover:text-[#F5EDD6]'
                  }`}
                >
                  {cat === 'All' ? dict.tabAll : cat === 'Food & Drink' ? dict.tabFood : cat === 'Vibe' ? dict.tabVibe : dict.tabMenu}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-10 columns-1 gap-5 space-y-5 sm:columns-2 lg:columns-3">
          {visibleItems.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              aria-label={`Open gallery image: ${item.title}`}
              className="group relative block w-full break-inside-avoid overflow-hidden rounded-lg border border-[#C9A84C]/20 bg-[#14100C] text-left transition-colors duration-150 hover:border-[#C9A84C]/60 focus-visible:outline-2 focus-visible:outline-[#C9A84C]"
            >
              <div
                className={`w-full overflow-hidden ${
                  item.aspect === 'tall'
                    ? 'aspect-[4/5]'
                    : item.aspect === 'wide'
                      ? 'aspect-[16/10]'
                      : 'aspect-square'
                }`}
              >
                <GalleryMedia item={item} />
              </div>
              <div className="border-t border-[#C9A84C]/12 p-4">
                <p className="text-xs font-medium text-[#C9A84C]">{item.category}</p>
                <h3 className="font-display mt-0.5 text-xl font-semibold text-[#F5EDD6]">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#B8AE98]">
                  {item.caption}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {activeItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeItem.title}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setActiveIndex(null)}
        >
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-lg border border-[#C9A84C]/35 bg-[#14100C]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#C9A84C]/15 px-5 py-3.5">
              <div>
                <p className="text-xs font-medium text-[#C9A84C]">{activeItem.category}</p>
                <h3 className="font-display text-2xl font-semibold text-[#F5EDD6]">
                  {activeItem.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveIndex(null)}
                aria-label="Close gallery lightbox"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-[#C9A84C]/25 text-[#F5EDD6] hover:bg-[#1E1812]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="aspect-[4/3] w-full overflow-hidden bg-[#0A0806]">
              <GalleryMedia item={activeItem} />
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-[#C9A84C]/15 px-5 py-4">
              <p className="text-sm text-[#E5DEC9]">{activeItem.caption}</p>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex((idx) =>
                      idx === null
                        ? null
                        : (idx - 1 + visibleItems.length) % visibleItems.length,
                    )
                  }
                  aria-label="Previous gallery item"
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-[#C9A84C]/25 text-[#F5EDD6] hover:bg-[#1E1812]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex((idx) =>
                      idx === null ? null : (idx + 1) % visibleItems.length,
                    )
                  }
                  aria-label="Next gallery item"
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-[#C9A84C]/25 text-[#F5EDD6] hover:bg-[#1E1812]"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
