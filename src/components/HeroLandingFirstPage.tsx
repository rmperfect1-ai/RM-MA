import {
  ArrowDown,
  ArrowRight,
  Gem,
  Play,
  QrCode,
  Sparkles,
  Star,
  Users,
  Utensils,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { SAYQAL_ASSETS } from '../assets/heroAssets';
import { DICTIONARIES } from '../data/i18n';
import type { AppLanguage, DishCategory, EMenuSource } from '../types/restaurant';
import { GustoAiWidget } from './GustoAiWidget';
import { SayqalEmblem } from './SayqalEmblem';

interface HeroLandingFirstPageProps {
  language: AppLanguage;
  onReserveClick: () => void;
  onLaunchGuestOrderApp: (source: EMenuSource, table?: string) => void;
  onOpenQrNfc: () => void;
  onSelectMenuCategory: (category: 'All' | DishCategory) => void;
}

export function HeroLandingFirstPage({
  language,
  onReserveClick,
  onLaunchGuestOrderApp,
  onOpenQrNfc,
  onSelectMenuCategory,
}: HeroLandingFirstPageProps) {
  const dict = DICTIONARIES[language].hero;
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  const featureItems = [
    { icon: Utensils, label: dict.feat1 },
    { icon: Gem, label: dict.feat2 },
    { icon: Users, label: dict.feat3 },
    { icon: Star, label: dict.feat4 },
  ];

  const cardAssets = [
    SAYQAL_ASSETS.cardDishes,
    SAYQAL_ASSETS.cardAmbiance,
    SAYQAL_ASSETS.cardDesserts,
    SAYQAL_ASSETS.cardEvents,
  ];

  const handleCardAction = (target: 'menu' | 'gallery' | 'desserts' | 'events') => {
    if (target === 'desserts') {
      onSelectMenuCategory('Desserts');
      document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (target === 'menu') {
      onSelectMenuCategory('All');
      document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (target === 'gallery') {
      document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="top"
      aria-label="Sayqal Family Restaurant Home"
      className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-[#0A0806] pt-16"
    >
      {/* Full-bleed candlelit luxury restaurant photography */}
      <img
        src={SAYQAL_ASSETS.heroInterior}
        alt="Sayqal Family Restaurant candlelit chandelier interior"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-80"
      />

      {/* Directional warm obsidian gradient scrim so typography pops with > 4.5:1 contrast */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0A0806]/95 via-[#0A0806]/68 to-[#0A0806]/45"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A0806] via-transparent to-[#0A0806]/65"
      />

      {/* Subtle golden Sayqal logo projection on background salon arch (desktop decorative focal) */}
      <div
        aria-hidden="true"
        className="pointer-events-none hidden lg:flex absolute right-[28%] top-[36%] flex-col items-center opacity-75"
      >
        <SayqalEmblem className="h-16 w-16 drop-shadow-[0_0_24px_rgba(201,168,76,0.5)]" />
        <span className="font-display mt-1 text-2xl font-semibold tracking-[0.18em] text-[#E6CB7D]">
          SAYQAL
        </span>
        <span className="text-[9px] tracking-[0.28em] text-[#C9A84C]/90 uppercase">
          FAMILY RESTAURANT
        </span>
      </div>

      {/* Main Hero Row */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        {/* Left Hero Typography + Features + CTAs */}
        <div className="max-w-[590px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/40 bg-[#14100C]/85 px-3.5 py-1 text-xs font-medium text-[#E6CB7D] backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#C9A84C]" />
            <span>{dict.badge}</span>
          </div>

          <h1 className="font-display gold-shimmer-text mt-4 text-6xl font-bold leading-[0.95] tracking-[0.06em] sm:text-7xl lg:text-[5.5rem]">
            SAYQAL
          </h1>

          <p className="font-display mt-1.5 text-2xl font-medium tracking-[0.12em] text-[#F5EDD6] sm:text-4xl">
            {dict.subtitle}
          </p>

          <p className="font-display mt-2.5 text-2xl italic text-[#E6CB7D] sm:text-3xl">
            {dict.tagline}
          </p>

          {/* 4-column frosted feature strip matching reference */}
          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {featureItems.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.label}
                  className="flex flex-col items-center justify-center rounded-xl border border-[#C9A84C]/22 bg-[#14100C]/78 px-3 py-3 text-center backdrop-blur-md"
                >
                  <Icon className="h-5 w-5 text-[#E6CB7D]" />
                  <span className="mt-1.5 text-[11px] font-medium leading-tight text-[#F5EDD6]">
                    {feat.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Primary Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onLaunchGuestOrderApp('web', '1')}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#F0D388] to-[#C89635] px-6 py-3 text-sm font-semibold text-[#0A0806] shadow-[0_8px_28px_rgba(201,168,76,0.35)] transition-transform hover:scale-[1.02] whitespace-nowrap"
            >
              <Utensils className="h-4 w-4" />
              <span>{dict.ctaMenu}</span>
            </button>

            <button
              type="button"
              onClick={() => setVideoModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/45 bg-[#14100C]/80 px-5 py-3 text-sm font-medium text-[#F5EDD6] backdrop-blur-md transition-colors hover:border-[#C9A84C] hover:bg-[#1E1812] whitespace-nowrap"
            >
              <Play className="h-4 w-4 text-[#E6CB7D]" />
              <span>{dict.ctaVideo}</span>
            </button>

            <button
              type="button"
              onClick={onOpenQrNfc}
              className="inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/30 bg-[#14100C]/75 px-4 py-3 text-xs font-medium text-[#E6CB7D] backdrop-blur-md transition-colors hover:border-[#C9A84C] whitespace-nowrap"
            >
              <QrCode className="h-4 w-4" />
              <span>NFC / QR Dastur</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Gusto AI Chat Assistant matching screenshot */}
        <div className="mt-8 flex justify-end lg:mt-0">
          <GustoAiWidget
            language={language}
            onActionNavigate={(target) => {
              if (target === 'reserve') onReserveClick();
              if (target === 'menu') {
                document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          />
        </div>
      </div>

      {/* Bottom Showcase Strip matching reference: Scroll button + 4 Photo Cards */}
      <div className="relative z-20 mx-auto w-full max-w-[1400px] px-4 pb-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <a
            href="#menu"
            className="hidden lg:flex flex-col items-center gap-1.5 pb-1 pr-3 text-center text-[11px] font-medium text-[#D6CCB4] hover:text-[#E6CB7D] shrink-0"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#C9A84C]/45 bg-[#14100C]/85 text-[#E6CB7D]">
              <ArrowDown className="h-4 w-4" />
            </span>
            <span className="leading-tight whitespace-nowrap">{dict.scrollHint}</span>
          </a>

          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {dict.cards.map((card, idx) => (
              <button
                key={card.id}
                type="button"
                onClick={() => handleCardAction(card.target)}
                className="group relative flex h-24 items-end overflow-hidden rounded-xl border border-[#C9A84C]/35 bg-[#14100C] p-3.5 text-left transition-transform duration-150 hover:-translate-y-0.5 hover:border-[#C9A84C]"
              >
                <img
                  src={cardAssets[idx]}
                  alt={card.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/15"
                />
                <div className="relative z-10 flex w-full items-end justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[#F5EDD6]">{card.title}</p>
                    <p className="text-[11px] text-[#D6CCB4]">{card.subtitle}</p>
                  </div>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#C9A84C]/60 bg-[#0A0806]/70 text-[#E6CB7D] transition-colors group-hover:bg-[#C9A84C] group-hover:text-[#0A0806]">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Atmosphere & Kitchen Tour Modal ("Video ko'rish") */}
      {videoModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Sayqal Atmosphere Tour"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setVideoModalOpen(false)}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-xl border border-[#C9A84C]/35 bg-[#14100C]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#C9A84C]/20 px-5 py-3.5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-[#C9A84C]">
                  Sayqal Virtual Tour
                </p>
                <h3 className="font-display text-2xl font-semibold text-[#F5EDD6]">
                  Zargarlik 9 · Tashkent Grand Salon
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setVideoModalOpen(false)}
                aria-label="Close virtual tour"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-[#C9A84C]/30 text-[#F5EDD6] hover:bg-[#1E1812]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
              <div className="overflow-hidden rounded-lg border border-[#C9A84C]/20">
                <img
                  src={SAYQAL_ASSETS.heroInterior}
                  alt="Sayqal Grand Dining Room"
                  className="h-48 w-full object-cover"
                />
                <p className="p-3 text-xs text-[#E5DEC9]">
                  Asosiy zal — oltin halqali qandillar va oilaviy kechalar uchun qulay stollar.
                </p>
              </div>
              <div className="overflow-hidden rounded-lg border border-[#C9A84C]/20">
                <img
                  src={SAYQAL_ASSETS.cardAmbiance}
                  alt="Sayqal VIP Arched Salon"
                  className="h-48 w-full object-cover"
                />
                <p className="p-3 text-xs text-[#E5DEC9]">
                  Tadbirlar va VIP mehmonlar uchun bezatilgan sharqona arkalik zal.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#C9A84C]/15 px-5 py-4">
              <p className="text-xs text-[#B8AE98]">
                Har kuni 11:00 – 23:30 · Jonli stol buyurtmasi QR va NFC orqali ishlaydi.
              </p>
              <button
                type="button"
                onClick={() => {
                  setVideoModalOpen(false);
                  onLaunchGuestOrderApp('web', '1');
                }}
                className="rounded-md bg-[#C9A84C] px-4 py-2 text-xs font-semibold text-[#0A0806] hover:bg-[#E6CB7D]"
              >
                Buyurtma dasturini ochish
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
