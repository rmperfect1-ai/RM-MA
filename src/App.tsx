import { ChefHat, Receipt, ShieldCheck, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AboutSection } from './components/AboutSection';
import { AdminPanel } from './components/AdminPanel';
import { GallerySection } from './components/GallerySection';
import { GuestOrderApp } from './components/GuestOrderApp';
import { Header } from './components/Header';
import { HeroLandingFirstPage } from './components/HeroLandingFirstPage';
import { MenuSection } from './components/MenuSection';
import { QrNfcModal } from './components/QrNfcHub';
import { ReservationSection } from './components/ReservationSection';
import { ReviewsSection } from './components/ReviewsSection';
import { RESTAURANT_META } from './data/seedData';
import { useRestaurantStore } from './hooks/useRestaurantStore';
import type {
  AppLanguage,
  AppLaunchParams,
  DishCategory,
  EMenuSource,
  StaffRole,
  StaffSession,
} from './types/restaurant';
import {
  buildEMenuUrl,
  buildStaffAppUrl,
  parseAppLaunchFromUrl,
} from './utils/restaurantLogic';

const LANG_STORAGE_KEY = 'sayqal_lang_v1';

function loadInitialLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'uz';
  try {
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'uz' || saved === 'ru' || saved === 'en') return saved;
  } catch {
    // Ignore storage access errors
  }
  return 'uz';
}

export default function App() {
  const store = useRestaurantStore();
  const [language, setLanguage] = useState<AppLanguage>(() => loadInitialLanguage());
  const [launch, setLaunch] = useState<AppLaunchParams>(() =>
    parseAppLaunchFromUrl(
      typeof window !== 'undefined' ? window.location.search : '',
      typeof window !== 'undefined' ? window.location.hash : '',
    ),
  );
  const [staffSession, setStaffSession] = useState<StaffSession | null>(null);
  const [isQrNfcOpen, setIsQrNfcOpen] = useState(false);
  const [requestedCategory, setRequestedCategory] = useState<'All' | DishCategory>('All');

  useEffect(() => {
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, language);
      document.documentElement.lang = language;
    } catch {
      // Ignore storage errors
    }
  }, [language]);

  useEffect(() => {
    const syncFromUrl = () => {
      setLaunch(parseAppLaunchFromUrl(window.location.search, window.location.hash));
    };
    window.addEventListener('popstate', syncFromUrl);
    window.addEventListener('hashchange', syncFromUrl);
    return () => {
      window.removeEventListener('popstate', syncFromUrl);
      window.removeEventListener('hashchange', syncFromUrl);
    };
  }, []);

  const navigateUrl = (nextUrl: string) => {
    try {
      const relative = nextUrl.startsWith(window.location.origin)
        ? nextUrl.replace(window.location.origin, '')
        : nextUrl;
      window.history.replaceState(null, '', relative);
    } catch {
      // Ignore history API restrictions
    }
  };

  const handleLaunchGuestOrderApp = (source: EMenuSource, table?: string) => {
    setIsQrNfcOpen(false);
    setLaunch({ mode: 'guest-order', source, table });
    if (typeof window !== 'undefined') {
      navigateUrl(buildEMenuUrl(window.location.origin, { source, table }));
      window.scrollTo({ top: 0 });
    }
  };

  const handleOpenStaffOs = (role: StaffRole = 'admin') => {
    setIsQrNfcOpen(false);
    if (staffSession && staffSession.role !== 'admin' && staffSession.role !== role) {
      setStaffSession(null);
    }
    setLaunch({ mode: 'staff-os', source: 'pos', staffRole: role });
    if (typeof window !== 'undefined') {
      navigateUrl(buildStaffAppUrl(window.location.origin, role));
      window.scrollTo({ top: 0 });
    }
  };

  const handleExitToLounge = () => {
    setLaunch({ mode: 'lounge', source: 'web' });
    if (typeof window !== 'undefined') {
      navigateUrl('/');
      window.scrollTo({ top: 0 });
    }
  };

  const scrollToReserve = () => {
    if (launch.mode !== 'lounge') {
      handleExitToLounge();
      window.setTimeout(() => {
        document.getElementById('reserve')?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    } else {
      document.getElementById('reserve')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // PROGRAM 1: Standalone Guest Table Ordering App (opened via NFC tap or QR code)
  if (launch.mode === 'guest-order') {
    return (
      <>
        <GuestOrderApp
          dishes={store.state.dishes}
          orders={store.state.orders}
          source={launch.source}
          initialTable={launch.table}
          tableCount={store.state.settings.tableCount}
          language={language}
          onChangeLanguage={setLanguage}
          onPlaceOrder={store.placeOrder}
          onRequestElectronicCheck={store.requestElectronicCheck}
          onCancelOrder={store.cancelOrderByGuest}
          onExitToLounge={handleExitToLounge}
          onOpenQrNfc={() => setIsQrNfcOpen(true)}
        />
        <QrNfcModal
          isOpen={isQrNfcOpen}
          onClose={() => setIsQrNfcOpen(false)}
          onLaunchEMenu={handleLaunchGuestOrderApp}
        />
      </>
    );
  }

  // PROGRAM 2: Restaurant-Only Internal Staff Operating System (Waiter · Kitchen · Cashier · Admin)
  if (launch.mode === 'staff-os') {
    return (
      <AdminPanel
        dishes={store.state.dishes}
        reservations={store.state.reservations}
        reviews={store.state.reviews}
        orders={store.state.orders}
        ledger={store.state.ledger}
        activityLog={store.state.activityLog}
        waiters={store.state.waiters}
        settings={store.state.settings}
        language={language}
        onChangeLanguage={setLanguage}
        isConnected={store.isConnected}
        lastOrderAlert={store.lastOrderAlert}
        onClearOrderAlert={store.clearLastOrderAlert}
        staffSession={staffSession}
        onUnlockSession={(session) => setStaffSession(session)}
        onSignOutSession={() => setStaffSession(null)}
        onAddDish={store.addDish}
        onUpdateDish={store.updateDish}
        onToggleDishDietaryTag={store.toggleDishDietaryTag}
        onDeleteDish={store.deleteDish}
        onUpdateReservationStatus={store.updateReservationStatus}
        onToggleReviewFeatured={store.toggleReviewFeatured}
        onToggleReviewHidden={store.toggleReviewHidden}
        onUpdateOrderStatus={store.updateOrderStatus}
        onRequestElectronicCheck={store.requestElectronicCheck}
        onCreatePosOrder={store.placeOrder}
        onAddWaiter={store.addWaiter}
        onUpdateWaiter={store.updateWaiter}
        onDeleteWaiter={store.deleteWaiter}
        onUpdateSettings={store.updateSettings}
        onAddLedgerEntry={store.addLedgerEntry}
        onDeleteLedgerEntry={store.deleteLedgerEntry}
        receiptArchive={store.state.receiptArchive ?? []}
        onCloseDailyShift={store.closeDailyShift}
        onClearReceiptArchive={store.clearReceiptArchive}
        onLaunchEMenu={handleLaunchGuestOrderApp}
        onCloseAdmin={handleExitToLounge}
        initialRole={launch.staffRole ?? 'admin'}
        onRoleChange={(role) => {
          setLaunch((prev) => ({ ...prev, staffRole: role }));
          if (typeof window !== 'undefined') {
            navigateUrl(buildStaffAppUrl(window.location.origin, role));
          }
        }}
      />
    );
  }

  // LOUNGE / FIRST PAGE (Matches reference design + below-fold showcase)
  return (
    <div className="min-h-screen bg-[#0A0806] text-[#F5EDD6]">
      <Header
        language={language}
        onChangeLanguage={setLanguage}
        onReserveClick={scrollToReserve}
        onOpenStaffRole={handleOpenStaffOs}
        onLaunchGuestOrderApp={handleLaunchGuestOrderApp}
      />

      <main>
        <HeroLandingFirstPage
          language={language}
          onReserveClick={scrollToReserve}
          onLaunchGuestOrderApp={handleLaunchGuestOrderApp}
          onOpenQrNfc={() => setIsQrNfcOpen(true)}
          onSelectMenuCategory={setRequestedCategory}
        />

        <MenuSection
          dishes={store.state.dishes}
          requestedCategory={requestedCategory}
          onLaunchEMenu={handleLaunchGuestOrderApp}
          onOpenQrNfc={() => setIsQrNfcOpen(true)}
          language={language}
        />

        <GallerySection language={language} />
        <AboutSection language={language} />
        <ReviewsSection reviews={store.state.reviews} language={language} />
        <ReservationSection onCreateReservation={store.createReservation} language={language} />
      </main>

      {/* Editorial Footer with clear Admin, Ofitsiant & Kassir Dasturi access */}
      <footer className="border-t border-[#C9A84C]/15 bg-[#0A0806] py-10">
        <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-4 px-4 text-xs text-[#B8AE98] lg:flex-row lg:items-center sm:px-6 lg:px-8">
          <div>
            <span className="font-display text-lg font-semibold text-[#F5EDD6]">
              {RESTAURANT_META.name}
            </span>
            <span className="mx-2 text-[#C9A84C]/50">·</span>
            <span>{RESTAURANT_META.addressLine}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="mr-1">{RESTAURANT_META.hours}</span>
            <button
              type="button"
              data-testid="footer-staff-entry"
              onClick={() => handleOpenStaffOs('admin')}
              className="inline-flex items-center gap-1.5 rounded border border-[#C9A84C]/35 bg-[#14100C] px-2.5 py-1.5 text-[11px] font-medium text-[#E6CB7D] transition-colors hover:border-[#C9A84C]"
            >
              <ShieldCheck className="h-3 w-3" />
              <span>Admin Panel</span>
            </button>
            <button
              type="button"
              data-testid="footer-waiter-entry"
              onClick={() => handleOpenStaffOs('waiter')}
              className="inline-flex items-center gap-1.5 rounded border border-[#C9A84C]/35 bg-[#14100C] px-2.5 py-1.5 text-[11px] font-medium text-[#E6CB7D] transition-colors hover:border-[#C9A84C]"
            >
              <UserCheck className="h-3 w-3" />
              <span>Ofitsiant Dasturi</span>
            </button>
            <button
              type="button"
              data-testid="footer-kitchen-entry"
              onClick={() => handleOpenStaffOs('kitchen')}
              className="inline-flex items-center gap-1.5 rounded border border-[#C9A84C]/35 bg-[#14100C] px-2.5 py-1.5 text-[11px] font-medium text-[#E6CB7D] transition-colors hover:border-[#C9A84C]"
            >
              <ChefHat className="h-3 w-3" />
              <span>Oshpaz Dasturi</span>
            </button>
            <button
              type="button"
              data-testid="footer-cashier-entry"
              onClick={() => handleOpenStaffOs('cashier')}
              className="inline-flex items-center gap-1.5 rounded border border-[#C9A84C]/35 bg-[#14100C] px-2.5 py-1.5 text-[11px] font-medium text-[#E6CB7D] transition-colors hover:border-[#C9A84C]"
            >
              <Receipt className="h-3 w-3" />
              <span>Kassir Dasturi</span>
            </button>
          </div>
        </div>
      </footer>

      <QrNfcModal
        isOpen={isQrNfcOpen}
        onClose={() => setIsQrNfcOpen(false)}
        onLaunchEMenu={handleLaunchGuestOrderApp}
      />
    </div>
  );
}
