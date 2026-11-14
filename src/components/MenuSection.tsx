import { QrCode, Search, Smartphone } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { DICTIONARIES } from '../data/i18n';
import type { AppLanguage, DietaryTag, Dish, DishCategory, EMenuSource } from '../types/restaurant';
import { resolveDishImageUrl } from '../utils/dishImages';
import {
  MENU_FILTER_CATEGORIES,
  filterMenuDishes,
  formatUzsPrice,
} from '../utils/restaurantLogic';
import { DishVisual } from './DishVisual';

const DIETARY_BADGE_STYLES: Record<DietaryTag, string> = {
  Vegan: 'border-[#2D4A3E] bg-[#2D4A3E]/35 text-[#A9CEBE]',
  'Gluten-Free': 'border-[#C9A84C]/45 bg-[#C9A84C]/12 text-[#E6CB7D]',
  Spicy: 'border-[#8B3A2A]/75 bg-[#8B3A2A]/28 text-[#F0A495]',
};

interface MenuSectionProps {
  dishes: Dish[];
  requestedCategory?: 'All' | DishCategory;
  onLaunchEMenu: (source: EMenuSource, table?: string) => void;
  onOpenQrNfc: () => void;
  language: AppLanguage;
}

interface TiltDishCardProps {
  dish: Dish;
}

function TiltDishCard({ dish }: TiltDishCardProps) {
  const cardRef = useRef<HTMLElement | null>(null);
  const sheenRef = useRef<HTMLDivElement | null>(null);
  const resolvedImage = resolveDishImageUrl(dish.id, dish.imageUrl);

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const el = cardRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 12;
    const rotateX = (0.5 - py) * 12;

    el.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-6px)`;

    if (sheenRef.current) {
      sheenRef.current.style.opacity = '1';
      sheenRef.current.style.background = `radial-gradient(circle at ${Math.round(px * 100)}% ${Math.round(py * 100)}%, rgba(230, 203, 125, 0.2), transparent 58%)`;
    }
  };

  const handlePointerLeave = () => {
    const el = cardRef.current;
    if (el) {
      el.style.transform = 'rotateX(0deg) rotateY(0deg) translateY(0px)';
    }
    if (sheenRef.current) {
      sheenRef.current.style.opacity = '0';
    }
  };

  return (
    <div className="tilt-card-wrapper">
      <article
        ref={cardRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="tilt-card-inner group relative flex h-full flex-col overflow-hidden rounded-xl border border-[#C9A84C]/28 bg-gradient-to-b from-[#17120D] to-[#110D0A] transition-colors duration-150 hover:border-[#E6CB7D]/70"
      >
        <div
          ref={sheenRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-200"
        />

        <DishVisual
          style={dish.visualStyle}
          title={dish.name}
          imageUrl={resolvedImage}
          priceLabel={formatUzsPrice(dish.priceUzs)}
          featured={dish.featured}
        />

        <div className="relative z-20 flex flex-1 flex-col justify-between p-5 sm:p-6">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium tracking-wide text-[#B8AE98]">
              <span className="text-[#E6CB7D]">{dish.category}</span>
              {dish.portion && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{dish.portion}</span>
                </>
              )}
            </div>

            <div className="tilt-card-depth flex items-baseline justify-between gap-3">
              <h3 className="font-display text-2xl font-semibold leading-tight text-[#F5EDD6]">
                {dish.name}
              </h3>
            </div>

            <p className="mt-2.5 text-sm leading-relaxed text-[#C2B8A2]">
              {dish.description}
            </p>

            {dish.dietaryTags.length > 0 && (
              <div className="mt-3.5 flex flex-wrap items-center gap-1.5" aria-label="Dietary tags">
                {dish.dietaryTags.map((tag) => (
                  <span
                    key={tag}
                    className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium tracking-wide whitespace-nowrap shrink-0 ${DIETARY_BADGE_STYLES[tag]}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-[#C9A84C]/18 pt-4">
            <span className="text-sm font-semibold tabular-nums tracking-wide text-[#E6CB7D]">
              {formatUzsPrice(dish.priceUzs)}
            </span>
            <span className="text-xs text-[#B8AE98]">Buyurtma asosida</span>
          </div>
        </div>
      </article>
    </div>
  );
}

export function MenuSection({
  dishes,
  requestedCategory,
  onLaunchEMenu,
  onOpenQrNfc,
  language,
}: MenuSectionProps) {
  const dict = DICTIONARIES[language].menuSection;
  const [selectedCategory, setSelectedCategory] = useState<'All' | DishCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (requestedCategory) {
      setSelectedCategory(requestedCategory);
    }
  }, [requestedCategory]);

  const visibleDishes = filterMenuDishes(dishes, selectedCategory, searchQuery);

  return (
    <section
      id="menu"
      aria-labelledby="menu-heading"
      className="relative mx-auto max-w-[1200px] px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#C9A84C]">
              {dict.badge}
            </p>
            <h2
              id="menu-heading"
              className="font-display mt-2 text-3xl font-semibold tracking-tight text-[#F5EDD6] sm:text-4xl [text-wrap:balance]"
            >
              {dict.heading}
            </h2>
            <p className="mt-3 text-base text-[#B8AE98]">
              {dict.subheading}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onLaunchEMenu('nfc', '1')}
              className="inline-flex items-center gap-2 rounded-md bg-[#C9A84C] px-4 py-2.5 text-xs font-semibold text-[#0A0806] transition-colors hover:bg-[#E6CB7D] whitespace-nowrap"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>{dict.nfcBtn}</span>
            </button>
            <button
              type="button"
              onClick={onOpenQrNfc}
              className="inline-flex items-center gap-2 rounded-md border border-[#C9A84C]/40 bg-[#14100C] px-4 py-2.5 text-xs font-medium text-[#E6CB7D] transition-colors hover:border-[#C9A84C] hover:bg-[#1E1812] whitespace-nowrap"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>{dict.qrBtn}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div
            role="tablist"
            aria-label="Filter dishes by category"
            className="flex items-center gap-1.5 overflow-x-auto rounded-lg border border-[#C9A84C]/20 bg-[#14100C] p-1"
          >
            {MENU_FILTER_CATEGORIES.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-md px-3 py-2 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#C9A84C] ${
                    active
                      ? 'bg-[#C9A84C] text-[#0A0806]'
                      : 'text-[#B8AE98] hover:text-[#F5EDD6]'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          <div className="relative sm:w-64">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#B8AE98]"
            />
            <input
              type="search"
              aria-label="Search dishes"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={dict.searchPlaceholder}
              className="w-full rounded-lg border border-[#C9A84C]/20 bg-[#14100C] py-2.5 pl-8 pr-3 text-xs text-[#F5EDD6] placeholder-[#B8AE98]/60 focus:border-[#C9A84C] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {visibleDishes.length === 0 ? (
        <div className="mt-12 rounded-lg border border-[#C9A84C]/20 bg-[#14100C] px-6 py-14 text-center">
          <p className="font-display text-2xl text-[#F5EDD6]">
            {dict.noDishes}
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
            }}
            className="mt-5 rounded-md bg-[#C9A84C] px-5 py-2.5 text-sm font-medium text-[#0A0806] hover:bg-[#E6CB7D]"
          >
            {dict.showAll}
          </button>
        </div>
      ) : (
        <div
          data-testid="menu-grid"
          className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {visibleDishes.map((dish) => (
            <TiltDishCard key={dish.id} dish={dish} />
          ))}
        </div>
      )}
    </section>
  );
}
