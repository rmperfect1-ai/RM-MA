import { CheckCircle2, MapPin } from 'lucide-react';
import { useState } from 'react';
import { DICTIONARIES } from '../data/i18n';
import { RESTAURANT_META } from '../data/seedData';
import type { AppLanguage, Reservation } from '../types/restaurant';
import {
  createReservationRecord,
  validateReservationInput,
  type ReservationInput,
} from '../utils/restaurantLogic';

interface ReservationSectionProps {
  onCreateReservation: (reservation: Reservation) => void;
  language: AppLanguage;
}

const TIME_SLOTS = ['12:00', '13:30', '18:00', '19:00', '19:30', '20:00', '20:30', '21:30'];

export function ReservationSection({ onCreateReservation, language }: ReservationSectionProps) {
  const dict = DICTIONARIES[language].reservationSection;
  const [form, setForm] = useState<ReservationInput>({
    guestName: '',
    contact: '',
    date: '2026-11-15',
    time: '19:30',
    partySize: 4,
    requests: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ReservationInput, string>>>({});
  const [confirmedBooking, setConfirmedBooking] = useState<Reservation | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validation = validateReservationInput(form);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    const record = createReservationRecord(form);
    onCreateReservation(record);
    setConfirmedBooking(record);
    setForm((prev) => ({
      ...prev,
      guestName: '',
      contact: '',
      requests: '',
    }));
  };

  return (
    <section
      id="reserve"
      aria-labelledby="reserve-heading"
      className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
        <div className="rounded-lg border border-[#C9A84C]/25 bg-[#14100C] p-6 sm:p-8 lg:col-span-7">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#C9A84C]">
            {dict.badge}
          </p>
          <h2
            id="reserve-heading"
            className="font-display mt-2 text-3xl font-semibold text-[#F5EDD6] sm:text-4xl"
          >
            {dict.heading}
          </h2>
          <p className="mt-2 text-sm text-[#B8AE98]">
            {dict.subheading}
          </p>

          {confirmedBooking && (
            <div
              role="status"
              className="mt-6 flex items-start gap-3 rounded-md border border-[#2D4A3E] bg-[#2D4A3E]/25 p-4 text-sm text-[#F5EDD6]"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#87A89A]" />
              <div>
                <p className="font-semibold">
                  {dict.successTitle}{' '}
                  <span className="tabular-nums text-[#E6CB7D]">{confirmedBooking.code}</span>
                </p>
                <p className="mt-1 text-xs text-[#E5DEC9]">
                  {confirmedBooking.guestName} · Party of {confirmedBooking.partySize} on{' '}
                  {confirmedBooking.date} at {confirmedBooking.time}. {dict.successMessage}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="res-name"
                  className="block text-xs font-medium text-[#E5DEC9]"
                >
                  {dict.nameLabel}
                </label>
                <input
                  id="res-name"
                  type="text"
                  value={form.guestName}
                  onChange={(e) => setForm({ ...form, guestName: e.target.value })}
                  placeholder="e.g. Jasmina Rasulova"
                  className="mt-1.5 w-full rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3.5 py-2.5 text-sm text-[#F5EDD6] placeholder-[#B8AE98]/50 focus:border-[#C9A84C] focus:outline-none"
                />
                {errors.guestName && (
                  <p className="mt-1 text-xs text-[#E88473]">{errors.guestName}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="res-contact"
                  className="block text-xs font-medium text-[#E5DEC9]"
                >
                  {dict.phoneLabel}
                </label>
                <input
                  id="res-contact"
                  type="text"
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  placeholder="+998 90 123 45 67"
                  className="mt-1.5 w-full rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3.5 py-2.5 text-sm text-[#F5EDD6] placeholder-[#B8AE98]/50 focus:border-[#C9A84C] focus:outline-none"
                />
                {errors.contact && (
                  <p className="mt-1 text-xs text-[#E88473]">{errors.contact}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="res-date"
                  className="block text-xs font-medium text-[#E5DEC9]"
                >
                  {dict.dateLabel}
                </label>
                <input
                  id="res-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="mt-1.5 w-full rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3.5 py-2.5 text-sm tabular-nums text-[#F5EDD6] focus:border-[#C9A84C] focus:outline-none"
                />
                {errors.date && (
                  <p className="mt-1 text-xs text-[#E88473]">{errors.date}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="res-time"
                  className="block text-xs font-medium text-[#E5DEC9]"
                >
                  {dict.timeLabel}
                </label>
                <select
                  id="res-time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="mt-1.5 w-full rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3.5 py-2.5 text-sm tabular-nums text-[#F5EDD6] focus:border-[#C9A84C] focus:outline-none"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
                {errors.time && (
                  <p className="mt-1 text-xs text-[#E88473]">{errors.time}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="res-party"
                  className="block text-xs font-medium text-[#E5DEC9]"
                >
                  {dict.partyLabel}
                </label>
                <input
                  id="res-party"
                  type="number"
                  min={1}
                  max={20}
                  value={form.partySize}
                  onChange={(e) =>
                    setForm({ ...form, partySize: Number(e.target.value) || 0 })
                  }
                  className="mt-1.5 w-full rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3.5 py-2.5 text-sm tabular-nums text-[#F5EDD6] focus:border-[#C9A84C] focus:outline-none"
                />
                {errors.partySize && (
                  <p className="mt-1 text-xs text-[#E88473]">{errors.partySize}</p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="res-requests"
                className="block text-xs font-medium text-[#E5DEC9]"
              >
                {dict.requestsLabel}
              </label>
              <textarea
                id="res-requests"
                rows={3}
                value={form.requests}
                onChange={(e) => setForm({ ...form, requests: e.target.value })}
                placeholder="Courtyard seating, high chair, celebratory pistachio cheesecake..."
                className="mt-1.5 w-full rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3.5 py-2.5 text-sm text-[#F5EDD6] placeholder-[#B8AE98]/50 focus:border-[#C9A84C] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-[#C9A84C] px-6 py-3 text-sm font-semibold text-[#0A0806] transition-colors duration-150 hover:bg-[#E6CB7D] sm:w-auto"
            >
              {dict.submitBtn}
            </button>
          </form>
        </div>

        <div className="flex flex-col justify-between overflow-hidden rounded-lg border border-[#C9A84C]/25 bg-[#14100C] lg:col-span-5">
          <div className="relative flex-1 min-h-[280px] overflow-hidden bg-[#0E0B08]">
            <svg
              viewBox="0 0 420 320"
              className="h-full w-full"
              role="img"
              aria-label="Map illustration showing Sayqal Family Restaurant at 7556+RPR, Tashkent"
            >
              <rect width="420" height="320" fill="#0F0C09" />
              <path d="M0 78 Q150 64 420 96" stroke="#2D4A3E" strokeWidth="10" fill="none" strokeOpacity="0.45" />
              <line x1="0" y1="154" x2="420" y2="142" stroke="#2B2219" strokeWidth="8" />
              <line x1="0" y1="224" x2="420" y2="236" stroke="#2B2219" strokeWidth="5" />
              <line x1="118" y1="0" x2="132" y2="320" stroke="#2B2219" strokeWidth="6" />
              <line x1="256" y1="0" x2="244" y2="320" stroke="#2B2219" strokeWidth="9" />
              <line x1="342" y1="0" x2="348" y2="320" stroke="#221B14" strokeWidth="4" />

              <rect x="148" y="96" width="84" height="44" rx="4" fill="#18130E" stroke="#C9A84C" strokeOpacity="0.14" />
              <rect x="268" y="108" width="60" height="32" rx="4" fill="#18130E" stroke="#C9A84C" strokeOpacity="0.14" />
              <rect x="150" y="166" width="82" height="48" rx="4" fill="#18130E" stroke="#C9A84C" strokeOpacity="0.14" />

              <circle cx="246" cy="148" r="28" fill="#C9A84C" fillOpacity="0.14" />
              <circle cx="246" cy="148" r="14" fill="#C9A84C" fillOpacity="0.28" />
              <circle cx="246" cy="148" r="6" fill="#C9A84C" />
              <text x="264" y="144" fill="#F5EDD6" fontSize="12" fontWeight="600">
                Sayqal Family Restaurant
              </text>
              <text x="264" y="160" fill="#C9A84C" fontSize="10">
                7556+RPR · Tashkent
              </text>
            </svg>
          </div>

          <div className="border-t border-[#C9A84C]/15 p-6">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A84C]" />
              <div>
                <h3 className="font-display text-2xl font-semibold text-[#F5EDD6]">
                  {RESTAURANT_META.plusCode}
                </h3>
                <p className="mt-1 text-sm text-[#B8AE98]">
                  Tashkent, Uzbekistan · Valet parking at evening courtyard entrance
                </p>
                <p className="mt-3 text-xs tabular-nums text-[#E6CB7D]">
                  {RESTAURANT_META.hours} · {RESTAURANT_META.phone}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
