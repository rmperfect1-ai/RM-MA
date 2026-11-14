import { useEffect, useRef, useState } from 'react';
import { DICTIONARIES } from '../data/i18n';
import { RESTAURANT_META } from '../data/seedData';
import type { AppLanguage } from '../types/restaurant';
import { UzbekPatternCanvas } from './UzbekPatternCanvas';

interface AboutSectionProps {
  language: AppLanguage;
}

export function AboutSection({ language }: AboutSectionProps) {
  const dict = DICTIONARIES[language].aboutSection;
  const sectionRef = useRef<HTMLElement | null>(null);
  const [parallaxY, setParallaxY] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let rafId = 0;
    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        const el = sectionRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const progress = Math.max(-1, Math.min(1, rect.top / window.innerHeight));
        setParallaxY(Math.round(progress * 26));
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section
      id="story"
      ref={sectionRef}
      aria-labelledby="story-heading"
      className="relative overflow-hidden border-y border-[#C9A84C]/15 bg-[#0D0A07] py-24"
    >
      <UzbekPatternCanvas parallaxOffset={parallaxY} />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0A0806]/92 via-[#0A0806]/82 to-[#0A0806]/90"
      />

      <div className="relative z-10 mx-auto grid max-w-[1200px] grid-cols-1 items-stretch gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="flex flex-col justify-between lg:col-span-7">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#C9A84C]">
              {dict.badge}
            </p>
            <h2
              id="story-heading"
              className="font-display mt-2 text-3xl font-semibold tracking-tight text-[#F5EDD6] sm:text-5xl [text-wrap:balance]"
            >
              {dict.heading}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#E5DEC9]">
              {dict.p1}
            </p>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#B8AE98]">
              {dict.p2}
            </p>
          </div>

          <figure className="mt-10 rounded-lg border border-[#C9A84C]/25 bg-[#14100C]/92 p-6 sm:p-7">
            <blockquote className="font-display text-2xl italic leading-snug text-[#F5EDD6] sm:text-[1.65rem]">
              {dict.quote}
            </blockquote>
            <figcaption className="mt-3 flex items-center gap-2 text-xs font-medium text-[#C9A84C]">
              <span>{dict.quoteAuthor}</span>
            </figcaption>
          </figure>
        </div>

        <div className="flex flex-col justify-between rounded-lg border border-[#C9A84C]/25 bg-[#14100C]/95 p-7 sm:p-8 lg:col-span-5">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#C9A84C]">
              {dict.visitBadge}
            </p>
            <h3 className="font-display mt-2 text-3xl font-semibold text-[#F5EDD6]">
              {dict.hoursTitle}
            </h3>

            <dl className="mt-7 space-y-5 divide-y divide-[#C9A84C]/12">
              <div className="pt-1">
                <dt className="text-xs font-medium uppercase tracking-wider text-[#B8AE98]">
                  {dict.locationLabel}
                </dt>
                <dd className="mt-1 text-base font-medium text-[#F5EDD6]">
                  {RESTAURANT_META.plusCode}
                </dd>
                <dd className="mt-0.5 text-sm text-[#B8AE98]">
                  {dict.cityState}
                </dd>
              </div>

              <div className="pt-4">
                <dt className="text-xs font-medium uppercase tracking-wider text-[#B8AE98]">
                  {dict.hoursLabel}
                </dt>
                <dd className="mt-1 text-base font-medium tabular-nums text-[#F5EDD6]">
                  {dict.hoursDesc}
                </dd>
              </div>

              <div className="pt-4">
                <dt className="text-xs font-medium uppercase tracking-wider text-[#B8AE98]">
                  {dict.formatsLabel}
                </dt>
                <dd className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm font-medium text-[#87A89A]">
                  <span>{dict.formatsValue}</span>
                </dd>
              </div>

              <div className="pt-4">
                <dt className="text-xs font-medium uppercase tracking-wider text-[#B8AE98]">
                  {dict.deskLabel}
                </dt>
                <dd className="mt-1 text-base font-medium tabular-nums text-[#E6CB7D]">
                  {RESTAURANT_META.phone}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-8 border-t border-[#C9A84C]/15 pt-5">
            <a
              href="#reserve"
              className="inline-flex w-full items-center justify-center rounded-md border border-[#C9A84C]/50 px-5 py-3 text-sm font-medium text-[#F5EDD6] transition-colors duration-150 hover:bg-[#C9A84C] hover:text-[#0A0806]"
            >
              {dict.bookBtn}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
