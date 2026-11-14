import {
  Calendar,
  ChefHat,
  ChevronDown,
  Home,
  Headphones,
  Image as ImageIcon,
  Info,
  Menu,
  Receipt,
  ShieldCheck,
  Smartphone,
  UserCheck,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { DICTIONARIES } from '../data/i18n';
import type { AppLanguage, EMenuSource, StaffRole } from '../types/restaurant';
import { SayqalEmblem } from './SayqalEmblem';

interface HeaderProps {
  language: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
  onReserveClick: () => void;
  onOpenStaffRole: (role: StaffRole) => void;
  onLaunchGuestOrderApp: (source: EMenuSource, table?: string) => void;
}

export function Header({
  language,
  onChangeLanguage,
  onReserveClick,
  onOpenStaffRole,
  onLaunchGuestOrderApp,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);
  const appsRef = useRef<HTMLDivElement | null>(null);
  const dict = DICTIONARIES[language].nav;

  useEffect(() => {
    if (!appsOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (appsRef.current && !appsRef.current.contains(e.target as Node)) {
        setAppsOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, [appsOpen]);

  const navItems = [
    { id: 'top', label: dict.home, href: '#top', icon: Home, active: true },
    { id: 'menu', label: dict.menu, href: '#menu', icon: UtensilsCrossed, active: false },
    { id: 'gallery', label: dict.gallery, href: '#gallery', icon: ImageIcon, active: false },
    { id: 'events', label: dict.events, href: '#story', icon: Calendar, active: false },
    { id: 'about', label: dict.about, href: '#story', icon: Info, active: false },
    { id: 'contact', label: dict.contact, href: '#reserve', icon: Headphones, active: false },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-40 border-b border-[#C9A84C]/18 bg-[#0A0806]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Left: Gold Sayqal Flame + Wordmark */}
        <a
          href="#top"
          className="flex items-center gap-2.5 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C9A84C]"
        >
          <SayqalEmblem className="h-9 w-9 shrink-0" />
          <div className="leading-none">
            <span className="font-display block text-xl font-semibold tracking-[0.14em] text-[#E6CB7D] whitespace-nowrap">
              SAYQAL
            </span>
            <span className="block text-[9px] font-medium tracking-[0.26em] uppercase text-[#C9A84C]/85 whitespace-nowrap">
              FAMILY RESTAURANT
            </span>
          </div>
        </a>

        {/* Center: Clean single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden xl:flex items-center gap-1 rounded-full border border-[#C9A84C]/22 bg-[#120E0A]/75 px-2 py-1"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href={item.href}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  item.active
                    ? 'border border-[#C9A84C]/45 bg-[#2A1E10]/90 text-[#F5EDD6]'
                    : 'text-[#D6CCB4] hover:text-[#E6CB7D]'
                }`}
              >
                <Icon className="h-3.5 w-3.5 text-[#E6CB7D]" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Right: Dasturlar (Admin/Ofitsiant/Kassir) + UZ|RU|EN + Reserve CTA */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Staff & Guest Programs Switcher */}
          <div ref={appsRef} className="relative hidden sm:block">
            <button
              type="button"
              data-testid="header-apps-dropdown-btn"
              aria-expanded={appsOpen}
              onClick={() => setAppsOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A84C]/40 bg-[#14100C]/90 px-3.5 py-2 text-xs font-medium text-[#E6CB7D] transition-colors hover:border-[#E6CB7D] whitespace-nowrap"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Dasturlar</span>
              <ChevronDown className="h-3 w-3 opacity-80" />
            </button>

            {appsOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-64 rounded-xl border border-[#C9A84C]/35 bg-[#120E0A] p-2 shadow-2xl backdrop-blur-xl"
              >
                <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#C9A84C]">
                  Restoran Ichki Dasturlari (PIN / Parol)
                </p>
                <button
                  type="button"
                  data-testid="nav-open-admin"
                  onClick={() => {
                    setAppsOpen(false);
                    onOpenStaffRole('admin');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-[#F5EDD6] hover:bg-[#1E1812]"
                >
                  <ShieldCheck className="h-4 w-4 text-[#E6CB7D]" />
                  <div>
                    <p className="font-semibold">Admin Panel (sayqal2024)</p>
                    <p className="text-[10px] text-[#B8AE98]">Xodimlar, kirim-chiqim, AI ovoz</p>
                  </div>
                </button>
                <button
                  type="button"
                  data-testid="nav-open-waiter"
                  onClick={() => {
                    setAppsOpen(false);
                    onOpenStaffRole('waiter');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-[#F5EDD6] hover:bg-[#1E1812]"
                >
                  <UserCheck className="h-4 w-4 text-[#E6CB7D]" />
                  <div>
                    <p className="font-semibold">Ofitsiant Dasturi (2100/0800)</p>
                    <p className="text-[10px] text-[#B8AE98]">1–25 stollar · Shaxsiy kabinet</p>
                  </div>
                </button>
                <button
                  type="button"
                  data-testid="nav-open-kitchen"
                  onClick={() => {
                    setAppsOpen(false);
                    onOpenStaffRole('kitchen');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-[#F5EDD6] hover:bg-[#1E1812]"
                >
                  <ChefHat className="h-4 w-4 text-[#E6CB7D]" />
                  <div>
                    <p className="font-semibold">Oshpaz Dasturi (0500)</p>
                    <p className="text-[10px] text-[#B8AE98]">Faqat oshxona buyurtmalari (KDS)</p>
                  </div>
                </button>
                <button
                  type="button"
                  data-testid="nav-open-cashier"
                  onClick={() => {
                    setAppsOpen(false);
                    onOpenStaffRole('cashier');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-[#F5EDD6] hover:bg-[#1E1812]"
                >
                  <Receipt className="h-4 w-4 text-[#E6CB7D]" />
                  <div>
                    <p className="font-semibold">Kassir Dasturi (0900)</p>
                    <p className="text-[10px] text-[#B8AE98]">Soliq.uz QR chek · Foiz hisobi</p>
                  </div>
                </button>
                <div className="my-1.5 border-t border-[#C9A84C]/15" />
                <button
                  type="button"
                  data-testid="nav-open-nfc-menu"
                  onClick={() => {
                    setAppsOpen(false);
                    onLaunchGuestOrderApp('nfc', '1');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-[#A9CEBE] hover:bg-[#1E1812]"
                >
                  <Smartphone className="h-4 w-4" />
                  <div>
                    <p className="font-semibold">NFC / QR Mijoz Menyusi</p>
                    <p className="text-[10px] text-[#B8AE98]">Stoldan buyurtma berish dasturi</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          <div
            role="group"
            aria-label="Select language"
            className="hidden sm:inline-flex items-center rounded-full border border-[#C9A84C]/35 bg-[#120E0A]/80 p-0.5 text-xs font-medium"
          >
            {(['uz', 'ru', 'en'] as const).map((lang) => {
              const active = language === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => onChangeLanguage(lang)}
                  className={`rounded-full px-2.5 py-1 uppercase transition-colors whitespace-nowrap ${
                    active
                      ? 'border border-[#C9A84C]/60 bg-[#2A1E10] text-[#E6CB7D]'
                      : 'text-[#B8AE98] hover:text-[#F5EDD6]'
                  }`}
                >
                  {lang}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onReserveClick();
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#E6CB7D] to-[#C99B3B] px-4 py-2 text-xs font-semibold text-[#0A0806] shadow-md transition-opacity hover:opacity-95 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5EDD6]"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>{dict.reserveBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="inline-flex xl:hidden h-9 w-9 items-center justify-center rounded-full border border-[#C9A84C]/30 text-[#F5EDD6] hover:bg-[#19140F]"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-[#C9A84C]/15 bg-[#0A0806]/95 px-4 py-4 space-y-3">
          <div className="flex items-center gap-2 sm:hidden">
            {(['uz', 'ru', 'en'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => onChangeLanguage(lang)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${
                  language === lang
                    ? 'border-[#C9A84C] bg-[#C9A84C]/20 text-[#E6CB7D]'
                    : 'border-[#C9A84C]/25 text-[#B8AE98]'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          <nav aria-label="Mobile navigation" className="grid grid-cols-2 gap-2">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg border border-[#C9A84C]/15 bg-[#14100C] px-3 py-2.5 text-sm font-medium text-[#F5EDD6] hover:border-[#C9A84C]/45"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="border-t border-[#C9A84C]/15 pt-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#C9A84C]">
              Dasturlar (Admin · Ofitsiant · Oshpaz · Kassir)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenStaffRole('admin');
                }}
                className="rounded-lg border border-[#C9A84C]/30 bg-[#14100C] px-3 py-2 text-left text-xs font-semibold text-[#E6CB7D]"
              >
                Admin Panel
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenStaffRole('waiter');
                }}
                className="rounded-lg border border-[#C9A84C]/30 bg-[#14100C] px-3 py-2 text-left text-xs font-semibold text-[#E6CB7D]"
              >
                Ofitsiant Dasturi
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenStaffRole('kitchen');
                }}
                className="rounded-lg border border-[#C9A84C]/30 bg-[#14100C] px-3 py-2 text-left text-xs font-semibold text-[#E6CB7D]"
              >
                Oshpaz Dasturi (0500)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenStaffRole('cashier');
                }}
                className="rounded-lg border border-[#C9A84C]/30 bg-[#14100C] px-3 py-2 text-left text-xs font-semibold text-[#E6CB7D]"
              >
                Kassir Dasturi
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLaunchGuestOrderApp('nfc', '1');
                }}
                className="col-span-2 rounded-lg border border-[#2D4A3E] bg-[#121814] px-3 py-2 text-left text-xs font-semibold text-[#A9CEBE]"
              >
                NFC / QR Menyu
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
