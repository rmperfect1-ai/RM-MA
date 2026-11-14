import { Star } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { DICTIONARIES } from '../data/i18n';
import { RATING_DISTRIBUTION, RESTAURANT_META } from '../data/seedData';
import type { AppLanguage, Review } from '../types/restaurant';
import { computeRatingPercentages, getVisibleReviews } from '../utils/restaurantLogic';

interface ReviewsSectionProps {
  reviews: Review[];
  language: AppLanguage;
}

export function ReviewsSection({ reviews, language }: ReviewsSectionProps) {
  const dict = DICTIONARIES[language].reviewsSection;
  const sectionRef = useRef<HTMLElement | null>(null);
  const [barsVisible, setBarsVisible] = useState(false);

  const visibleReviews = getVisibleReviews(reviews);
  const distribution = computeRatingPercentages(RATING_DISTRIBUTION);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setBarsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setBarsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="reviews"
      ref={sectionRef}
      aria-labelledby="reviews-heading"
      className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="rounded-lg border border-[#C9A84C]/20 bg-[#14100C] p-6 sm:p-8 lg:col-span-4">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#C9A84C]">
            {dict.badge}
          </p>
          <h2
            id="reviews-heading"
            className="font-display mt-2 text-3xl font-semibold text-[#F5EDD6]"
          >
            {dict.heading}
          </h2>

          <div className="mt-6 flex items-baseline gap-4 border-b border-[#C9A84C]/15 pb-6">
            <span className="font-display text-5xl font-semibold tabular-nums text-[#E6CB7D]">
              {RESTAURANT_META.rating.toFixed(1)}
            </span>
            <div>
              <div className="flex items-center gap-1 text-[#C9A84C]" aria-label="4.1 out of 5 stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${star <= 4 ? 'fill-[#C9A84C] text-[#C9A84C]' : 'text-[#C9A84C]/40'}`}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs tabular-nums text-[#B8AE98]">
                Based on {RESTAURANT_META.reviewCount} verified guest reviews
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3" aria-label={dict.ratingBreakdown}>
            {distribution.map((row) => (
              <div key={row.stars} className="flex items-center gap-3 text-xs">
                <span className="w-8 shrink-0 font-medium tabular-nums text-[#F5EDD6]">
                  {row.stars} ★
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#1E1914]">
                  <div
                    style={{
                      transform: barsVisible ? `scaleX(${row.percent / 100})` : 'scaleX(0)',
                      transformOrigin: 'left center',
                    }}
                    className="h-full w-full rounded-full bg-[#C9A84C] transition-transform duration-700 ease-out"
                  />
                </div>
                <span className="w-10 shrink-0 text-right tabular-nums text-[#B8AE98]">
                  {row.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8">
          {visibleReviews.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-lg border border-[#C9A84C]/20 bg-[#14100C] p-10 text-center">
              <p className="text-sm text-[#B8AE98]">
                Guest reviews are currently curated in the Admin Panel.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {visibleReviews.map((review, index) => (
                <article
                  key={review.id}
                  className={`flex flex-col justify-between rounded-lg border bg-[#14100C] p-6 transition-colors duration-150 ${
                    review.featured
                      ? 'border-[#C9A84C]/45'
                      : 'border-[#C9A84C]/18'
                  } ${index === 0 && visibleReviews.length === 3 ? 'md:col-span-2' : ''}`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#C9A84C]/40 bg-[#1E1812] text-xs font-semibold tracking-wider text-[#E6CB7D]">
                          {review.initials}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-[#F5EDD6]">
                            {review.author}
                          </h3>
                          <p className="text-xs text-[#B8AE98]">
                            {review.visitContext}
                          </p>
                        </div>
                      </div>

                      <div
                        className="flex items-center gap-0.5 text-[#C9A84C]"
                        aria-label={`${review.rating} out of 5 stars`}
                      >
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3.5 w-3.5 ${
                              s <= review.rating
                                ? 'fill-[#C9A84C] text-[#C9A84C]'
                                : 'text-[#C9A84C]/30'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-relaxed text-[#E5DEC9]">
                      “{review.text}”
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-[#C9A84C]/12 pt-3 text-xs text-[#B8AE98]">
                    <span>{review.dateLabel}</span>
                    {review.featured && (
                      <span className="font-medium text-[#C9A84C]">{dict.verifiedReview}</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
