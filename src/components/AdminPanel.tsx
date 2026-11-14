import {
  ArrowUpDown,
  Bell,
  BookOpen,
  Check,
  ChefHat,
  Eye,
  EyeOff,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogOut,
  MessageSquare,
  Pencil,
  Plus,
  QrCode,
  Radio,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Star,
  Trash2,
  UserCheck,
  Users,
  Utensils,
  Wallet,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { DICTIONARIES } from '../data/i18n';
import { RESTAURANT_META } from '../data/seedData';
import type {
  ActivityEntry,
  AppLanguage,
  ArchivedReceipt,
  DietaryTag,
  Dish,
  DishCategory,
  EMenuSource,
  LedgerCategory,
  LedgerEntry,
  LedgerType,
  Order,
  OrderStatus,
  PaymentMethod,
  Reservation,
  ReservationStatus,
  RestaurantSettings,
  Review,
  SortDirection,
  SortField,
  StaffRole,
  StaffSession,
  WaiterProfile,
} from '../types/restaurant';
import {
  DIETARY_TAGS,
  authenticateStaffByCode,
  computeAccountingSummary,
  computeDashboardStats,
  formatUzsPrice,
  sortReservations,
  toggleDietaryTag,
} from '../utils/restaurantLogic';
import { CashierRegisterPanel } from './CashierRegisterPanel';
import { KitchenDisplayPanel } from './KitchenDisplayPanel';
import { QrNfcPanel } from './QrNfcHub';
import { SayqalEmblem } from './SayqalEmblem';
import { StaffAccountingPanel } from './StaffAccountingPanel';
import { StaffActivityReportPanel } from './StaffActivityReportPanel';
import { StaffOrdersPanel } from './StaffOrdersPanel';
import { WaiterPosPanel } from './WaiterPosPanel';
import { WaiterRosterManager } from './WaiterRosterManager';

interface AdminPanelProps {
  dishes: Dish[];
  reservations: Reservation[];
  reviews: Review[];
  orders: Order[];
  ledger: LedgerEntry[];
  activityLog: ActivityEntry[];
  waiters: WaiterProfile[];
  settings: RestaurantSettings;
  language: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
  isConnected: boolean;
  lastOrderAlert: Order | null;
  onClearOrderAlert: () => void;
  staffSession: StaffSession | null;
  onUnlockSession: (session: StaffSession) => void;
  onSignOutSession: () => void;
  onAddDish: (dish: Omit<Dish, 'id' | 'ordersToday'>) => Promise<void> | void;
  onUpdateDish: (dish: Dish) => Promise<void> | void;
  onToggleDishDietaryTag: (id: string, tag: DietaryTag) => Promise<void> | void;
  onDeleteDish: (id: string) => Promise<void> | void;
  onUpdateReservationStatus: (id: string, status: ReservationStatus) => Promise<void> | void;
  onToggleReviewFeatured: (id: string) => Promise<void> | void;
  onToggleReviewHidden: (id: string) => Promise<void> | void;
  onUpdateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    options?: { paymentMethod?: PaymentMethod; cancelReason?: string },
  ) => Promise<Order>;
  onRequestElectronicCheck: (orderId: string) => Promise<Order>;
  onCreatePosOrder: (input: {
    tableNumber: string;
    source: 'pos';
    guestName?: string;
    waiterId?: string;
    waiterName?: string;
    waiterCode?: string;
    note?: string;
    items: Array<{ dishId: string; quantity: number }>;
  }) => Promise<Order>;
  onAddWaiter: (input: {
    name: string;
    pinCode: string;
    commissionPercent?: number;
  }) => Promise<WaiterProfile>;
  onUpdateWaiter: (
    id: string,
    patch: Partial<Pick<WaiterProfile, 'name' | 'pinCode' | 'commissionPercent' | 'active'>>,
  ) => Promise<WaiterProfile>;
  onDeleteWaiter: (id: string) => Promise<void>;
  onUpdateSettings: (patch: Partial<RestaurantSettings>) => Promise<RestaurantSettings>;
  onAddLedgerEntry: (input: {
    type: LedgerType;
    category: LedgerCategory;
    title: string;
    amountUzs: number;
    paymentMethod: PaymentMethod;
    note?: string;
    createdBy?: string;
    date?: string;
  }) => Promise<void>;
  onDeleteLedgerEntry: (id: string) => Promise<void>;
  onLaunchEMenu: (source: EMenuSource, table?: string) => void;
  onCloseAdmin: () => void;
  receiptArchive?: ArchivedReceipt[];
  onCloseDailyShift?: (options: {
    archiveChecks: boolean;
    closedBy?: string;
  }) => Promise<{ archivedCount: number; remainingActiveCount: number; totalArchivedSaved: number }>;
  onClearReceiptArchive?: () => Promise<{ clearedCount: number }>;
  initialRole?: StaffRole;
  onRoleChange?: (role: StaffRole) => void;
}

type AdminTab =
  | 'waiter'
  | 'kitchen'
  | 'cashier'
  | 'waiters-roster'
  | 'orders'
  | 'staff-activity'
  | 'accounting'
  | 'dashboard'
  | 'tables-qr'
  | 'menu'
  | 'reservations'
  | 'reviews';

const DISH_CATEGORIES: DishCategory[] = [
  'Salads',
  'Soups',
  'Mains',
  'Grills',
  'Pastry & Doner',
  'Desserts',
  'Drinks',
];

export function AdminPanel({
  dishes,
  reservations,
  reviews,
  orders,
  ledger,
  activityLog,
  waiters,
  settings,
  language,
  onChangeLanguage,
  isConnected,
  lastOrderAlert,
  onClearOrderAlert,
  staffSession,
  onUnlockSession,
  onSignOutSession,
  onAddDish,
  onUpdateDish,
  onToggleDishDietaryTag,
  onDeleteDish,
  onUpdateReservationStatus,
  onToggleReviewFeatured,
  onToggleReviewHidden,
  onUpdateOrderStatus,
  onRequestElectronicCheck,
  onCreatePosOrder,
  onAddWaiter,
  onUpdateWaiter,
  onDeleteWaiter,
  onUpdateSettings,
  onAddLedgerEntry,
  onDeleteLedgerEntry,
  onLaunchEMenu,
  onCloseAdmin,
  receiptArchive = [],
  onCloseDailyShift,
  onClearReceiptArchive,
  initialRole = 'admin',
  onRoleChange,
}: AdminPanelProps) {
  const dict = DICTIONARIES[language].staff;

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedRole, setSelectedRole] = useState<StaffRole>(initialRole);
  const [adminWaiterOverrideId, setAdminWaiterOverrideId] = useState<string | undefined>(
    undefined,
  );

  const [activeTab, setActiveTab] = useState<AdminTab>(() =>
    initialRole === 'waiter'
      ? 'waiter'
      : initialRole === 'kitchen'
        ? 'kitchen'
        : initialRole === 'cashier'
          ? 'cashier'
          : 'orders',
  );
  const [menuSearch, setMenuSearch] = useState('');

  useEffect(() => {
    setSelectedRole(initialRole);
    if (!staffSession) {
      if (initialRole === 'waiter') setActiveTab('waiter');
      else if (initialRole === 'kitchen') setActiveTab('kitchen');
      else if (initialRole === 'cashier') setActiveTab('cashier');
      else setActiveTab('orders');
      return;
    }

    if (staffSession.role === 'waiter') {
      setActiveTab('waiter');
    } else if (staffSession.role === 'kitchen') {
      setActiveTab('kitchen');
    } else if (staffSession.role === 'cashier') {
      setActiveTab((prev) =>
        prev === 'cashier' || prev === 'accounting' || prev === 'orders' ? prev : 'cashier',
      );
    } else if (staffSession.role === 'admin') {
      if (initialRole === 'waiter') setActiveTab('waiter');
      else if (initialRole === 'kitchen') setActiveTab('kitchen');
      else if (initialRole === 'cashier') setActiveTab('cashier');
    }
  }, [initialRole, staffSession]);

  // Add/Edit Dish state
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<DishCategory>('Mains');
  const [newPrice, setNewPrice] = useState('125000');
  const [newPortion, setNewPortion] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newFeatured, setNewFeatured] = useState(false);
  const [newDietaryTags, setNewDietaryTags] = useState<DietaryTag[]>([]);
  const [dishFormError, setDishFormError] = useState('');
  const [editingDish, setEditingDish] = useState<Dish | null>(null);

  // Reservations sorting
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  const routeAfterAuth = (session: StaffSession) => {
    setPassword('');
    setAuthError('');
    if (session.role === 'waiter') setActiveTab('waiter');
    else if (session.role === 'kitchen') setActiveTab('kitchen');
    else if (session.role === 'cashier') setActiveTab('cashier');
    else setActiveTab('orders');
    onUnlockSession(session);
    onRoleChange?.(session.role);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsVerifying(true);
    setAuthError('');
    try {
      const res = await fetch('/api/staff/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: password, preferredRole: selectedRole }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          ok: boolean;
          role: StaffRole;
          waiter?: WaiterProfile;
        };
        if (data.ok && data.role) {
          routeAfterAuth({ role: data.role, waiter: data.waiter });
          return;
        }
      }
      const errBody = (await res.json().catch(() => ({}))) as { error?: string };
      setAuthError(
        errBody.error ||
          'Noto‘g‘ri kod. Ofitsiant (2100, 0800), Oshpaz (0500), Kassir (0900) yoki Admin kodini kiriting.',
      );
    } catch {
      const fallbackAuth = authenticateStaffByCode(password, waiters, selectedRole);
      if (fallbackAuth.ok && fallbackAuth.role) {
        routeAfterAuth({ role: fallbackAuth.role, waiter: fallbackAuth.waiter });
      } else {
        setAuthError(
          'Noto‘g‘ri kod. Ofitsiant (2100, 0800), Oshpaz (0500), Kassir (0900) yoki Admin kodini kiriting.',
        );
      }
    } finally {
      setIsVerifying(false);
    }
  };

  if (!staffSession) {
    return (
      <section
        aria-labelledby="admin-login-heading"
        className="flex min-h-screen items-center justify-center bg-[#0A0806] px-4 py-12"
      >
        <div className="w-full max-w-md rounded-2xl border border-[#C9A84C]/35 bg-[#14100C] p-7 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#C9A84C]/35 bg-[#1B1610] text-[#C9A84C]">
                <Lock className="h-5 w-5" />
              </div>
              <SayqalEmblem className="h-8 w-8" />
            </div>
            <button
              type="button"
              onClick={onCloseAdmin}
              className="rounded-md border border-[#C9A84C]/25 px-3 py-1.5 text-xs font-medium text-[#B8AE98] hover:text-[#F5EDD6]"
            >
              Asosiy sahifa
            </button>
          </div>

          <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.2em] text-[#C9A84C]">
            Faqat Restoran Xodimlari Uchun · Shaxsiy Kabinet
          </p>
          <h1
            id="admin-login-heading"
            className="font-display mt-1 text-3xl font-semibold text-[#F5EDD6]"
          >
            {dict.loginTitle}
          </h1>
          <p className="mt-1.5 text-xs text-[#B8AE98]">
            Har bir ofitsiant o‘zining shaxsiy 4 xonali kodi bilan kiradi (masalan: Doston — 2100,
            Sarvinoz — 0800). Oshpaz (0500), Kassir (0900) va Admin (sayqal2024).
          </p>

          {/* 4 Workstation Role Tabs */}
          <div
            className="mt-5 grid grid-cols-4 gap-1.5"
            role="group"
            aria-label="Dastur bo‘limini tanlang"
          >
            {(
              [
                { id: 'waiter', label: 'Ofitsiant', icon: UserCheck },
                { id: 'kitchen', label: 'Oshpaz', icon: ChefHat },
                { id: 'cashier', label: 'Kassir', icon: Receipt },
                { id: 'admin', label: 'Admin', icon: ShieldCheck },
              ] as const
            ).map((roleItem) => {
              const Icon = roleItem.icon;
              const active = selectedRole === roleItem.id;
              return (
                <button
                  key={roleItem.id}
                  type="button"
                  onClick={() => {
                    setSelectedRole(roleItem.id);
                    onRoleChange?.(roleItem.id);
                  }}
                  className={`flex flex-col items-center justify-center gap-1 rounded-lg border px-1.5 py-2.5 text-[11px] font-semibold transition-colors ${
                    active
                      ? 'border-[#E6CB7D] bg-[#C9A84C]/20 text-[#E6CB7D]'
                      : 'border-[#C9A84C]/20 bg-[#0A0806] text-[#B8AE98] hover:text-[#F5EDD6]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{roleItem.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleLogin} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-medium text-[#E5DEC9]"
              >
                Shaxsiy PIN Kod yoki Admin Paroli
              </label>
              <div className="relative mt-1.5">
                <input
                  id="admin-password"
                  data-testid="staff-login-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masalan: 2100, 0800, 0500, 0900"
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-[#C9A84C]/25 bg-[#0A0806] py-2.5 pl-3.5 pr-10 font-mono text-sm tracking-wider text-[#F5EDD6] placeholder:font-sans placeholder:tracking-normal placeholder-[#B8AE98]/50 focus:border-[#C9A84C] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-[#B8AE98] hover:text-[#F5EDD6]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {authError && (
                <p role="alert" className="mt-2 text-xs text-[#E88473]">
                  {authError}
                </p>
              )}
            </div>

            {/* Quick Numeric Touch Keypad for Tablet / Waiter Terminal */}
            {selectedRole !== 'admin' && (
              <div className="grid grid-cols-6 gap-1.5">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => setPassword((prev) => `${prev}${digit}`)}
                    className="rounded-md border border-[#C9A84C]/20 bg-[#0A0806] py-2 font-mono text-sm font-semibold text-[#F5EDD6] hover:border-[#C9A84C]"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPassword((prev) => prev.slice(0, -1))}
                  className="col-span-2 rounded-md border border-[#8B3A2A]/50 bg-[#17100E] py-2 text-xs font-semibold text-[#F0A495]"
                >
                  Tozalash
                </button>
              </div>
            )}

            <button
              type="submit"
              data-testid="staff-unlock-btn"
              disabled={isVerifying}
              className="w-full rounded-lg bg-gradient-to-r from-[#E6CB7D] to-[#C89635] px-4 py-2.5 text-sm font-semibold text-[#0A0806] transition-opacity hover:opacity-95 disabled:opacity-60"
            >
              {isVerifying
                ? 'Tekshirilmoqda...'
                : selectedRole === 'waiter'
                  ? 'Ofitsiant Kabinetini Ochish'
                  : selectedRole === 'kitchen'
                    ? 'Oshpaz Dasturini (KDS) Ochish'
                    : selectedRole === 'cashier'
                      ? 'Kassir Dasturini Ochish'
                      : dict.unlockBtn}
            </button>
          </form>

          <div className="mt-4 rounded-lg border border-[#C9A84C]/18 bg-[#0A0806] p-3 text-[11px] leading-relaxed text-[#B8AE98]">
            <span className="font-semibold text-[#E6CB7D]">Tezkor kodlar:</span>{' '}
            Doston <span className="font-mono text-[#F5EDD6]">2100</span> · Sarvinoz{' '}
            <span className="font-mono text-[#F5EDD6]">0800</span> · Oshpaz{' '}
            <span className="font-mono text-[#F5EDD6]">0500</span> · Kassir{' '}
            <span className="font-mono text-[#F5EDD6]">0900</span> · Admin{' '}
            <span className="font-mono text-[#F5EDD6]">sayqal2024</span>
          </div>
        </div>
      </section>
    );
  }

  const stats = computeDashboardStats(
    reservations,
    dishes,
    RESTAURANT_META.reviewCount,
    RESTAURANT_META.rating,
  );
  const accountingSummary = computeAccountingSummary(ledger, orders);

  const activeOrders = orders.filter(
    (o) => o.status === 'Pending' || o.status === 'Preparing' || o.status === 'Ready',
  );

  const filteredAdminDishes = dishes.filter((d) => {
    const q = menuSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      d.name.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q)
    );
  });

  const sortedReservations = sortReservations(reservations, sortField, sortDir);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleCreateDish = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const numericPrice = Number(newPrice);
    if (!newName.trim() || !newDesc.trim() || !Number.isFinite(numericPrice) || numericPrice <= 0) {
      setDishFormError('Taom nomi, tavsifi va to‘g‘ri UZS narxini kiriting.');
      return;
    }

    const styleMap: Record<DishCategory, Dish['visualStyle']> = {
      Salads: 'salad',
      Soups: 'soup',
      Mains: 'osh',
      Grills: 'kofte',
      'Pastry & Doner': 'doner',
      Desserts: 'cheesecake',
      Drinks: 'choy',
    };

    await onAddDish({
      name: newName.trim(),
      category: newCategory,
      priceUzs: Math.round(numericPrice),
      portion: newPortion.trim() || undefined,
      description: newDesc.trim(),
      featured: newFeatured,
      visualStyle: styleMap[newCategory],
      dietaryTags: newDietaryTags,
      imageUrl: newImageUrl.trim() || undefined,
    });

    setNewName('');
    setNewPrice('125000');
    setNewPortion('');
    setNewDesc('');
    setNewImageUrl('');
    setNewFeatured(false);
    setNewDietaryTags([]);
    setDishFormError('');
  };

  const handleSaveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDish) return;
    if (!editingDish.name.trim() || editingDish.priceUzs <= 0) return;
    await onUpdateDish({
      ...editingDish,
      portion: editingDish.portion?.trim() || undefined,
      imageUrl: editingDish.imageUrl?.trim() || undefined,
    });
    setEditingDish(null);
  };

  const kitchenOrdersCount = orders.filter(
    (o) => o.status === 'Pending' || o.status === 'Preparing',
  ).length;
  const checkRequestsCount = activeOrders.filter((o) => Boolean(o.checkRequested)).length;

  const activeWaiterForPanel =
    staffSession.role === 'waiter'
      ? waiters.find((w) => w.id === staffSession.waiter?.id) ?? staffSession.waiter
      : waiters.find((w) => w.id === adminWaiterOverrideId) ?? waiters.find((w) => w.active);

  const allTabs: Array<{
    id: AdminTab;
    label: string;
    icon: typeof ShoppingBag;
    badge?: number;
  }> = [
    {
      id: 'waiter',
      label:
        staffSession.role === 'waiter' && activeWaiterForPanel
          ? `${activeWaiterForPanel.name} (${activeWaiterForPanel.pinCode})`
          : 'Ofitsiant Kabineti',
      icon: UserCheck,
    },
    {
      id: 'kitchen',
      label: 'Oshpaz (KDS)',
      icon: ChefHat,
      badge: kitchenOrdersCount,
    },
    {
      id: 'cashier',
      label: 'Kassir Kassa',
      icon: Receipt,
      badge: checkRequestsCount || activeOrders.length,
    },
    {
      id: 'waiters-roster',
      label: `Ofitsiantlar (${waiters.length})`,
      icon: Users,
    },
    {
      id: 'orders',
      label: dict.tabs.orders,
      icon: ShoppingBag,
      badge: activeOrders.length,
    },
    {
      id: 'staff-activity',
      label: 'Xodimlar Atchoti',
      icon: Radio,
      badge: activityLog.length,
    },
    { id: 'accounting', label: dict.tabs.accounting, icon: Wallet },
    { id: 'dashboard', label: dict.tabs.dashboard, icon: LayoutDashboard },
    { id: 'tables-qr', label: dict.tabs.tablesQr, icon: QrCode },
    { id: 'menu', label: dict.tabs.menu, icon: BookOpen },
    { id: 'reservations', label: dict.tabs.reservations, icon: Utensils },
    { id: 'reviews', label: dict.tabs.reviews, icon: MessageSquare },
  ];

  const tabs = allTabs.filter((t) => {
    if (staffSession.role === 'waiter') return t.id === 'waiter';
    if (staffSession.role === 'kitchen') return t.id === 'kitchen';
    if (staffSession.role === 'cashier') {
      return (
        t.id === 'cashier' ||
        t.id === 'accounting' ||
        t.id === 'orders' ||
        t.id === 'staff-activity'
      );
    }
    return true;
  });

  const sessionRoleLabel =
    staffSession.role === 'waiter' && activeWaiterForPanel
      ? `Ofitsiant: ${activeWaiterForPanel.name} (Kod ${activeWaiterForPanel.pinCode})`
      : staffSession.role === 'kitchen'
        ? 'Oshpaz Dasturi (0500)'
        : staffSession.role === 'cashier'
          ? 'Kassir Terminali (0900)'
          : 'Admin Boshqaruvi';

  return (
    <section
      aria-label="Sayqal Restoran Ichki Dasturi"
      data-testid="staff-os-console"
      className="min-h-screen bg-[#0A0806] pb-20 text-[#F5EDD6]"
    >
      {/* Dedicated Internal Restaurant OS Top Bar */}
      <header className="sticky top-0 z-30 border-b border-[#C9A84C]/25 bg-[#0A0806]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-3.5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <SayqalEmblem className="h-9 w-9 shrink-0" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-semibold leading-none text-[#F5EDD6]">
                  Sayqal Restoran OS
                </h1>
                <span className="rounded-full border border-[#C9A84C]/40 bg-[#1B150C] px-2.5 py-0.5 text-[11px] font-semibold text-[#E6CB7D]">
                  {sessionRoleLabel}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                    isConnected
                      ? 'border-[#2D4A3E] bg-[#2D4A3E]/35 text-[#A9CEBE]'
                      : 'border-[#C9A84C]/35 bg-[#14100C] text-[#E6CB7D]'
                  }`}
                >
                  <Radio className="h-3 w-3" />
                  <span>{isConnected ? 'Jonli Sinxron' : 'Ulanmoqda...'}</span>
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-[#B8AE98]">
                {staffSession.role === 'kitchen'
                  ? 'Faqat oshxona buyurtmalari — stol, taomlar va tayyorlash holati'
                  : 'Ichki boshqaruv, jonli buyurtmalar va Soliq.uz elektron cheklar (Faqat xodimlar uchun)'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Language Switch */}
            <div className="inline-flex rounded-full border border-[#C9A84C]/30 bg-[#14100C] p-0.5 text-[11px] font-medium">
              {(['uz', 'ru', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => onChangeLanguage(lang)}
                  className={`rounded-full px-2.5 py-1 uppercase transition-colors ${
                    language === lang
                      ? 'bg-[#C9A84C] text-[#0A0806]'
                      : 'text-[#B8AE98] hover:text-[#F5EDD6]'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {staffSession.role !== 'kitchen' && (
              <button
                type="button"
                onClick={() => onLaunchEMenu('nfc', '1')}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#C9A84C]/35 bg-[#14100C] px-3 py-1.5 text-xs font-medium text-[#E6CB7D] hover:border-[#C9A84C]"
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Mijoz Buyurtma</span>
              </button>
            )}

            <button
              type="button"
              data-testid="staff-switch-user-btn"
              onClick={onSignOutSession}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#C9A84C]/40 bg-[#14100C] px-3 py-1.5 text-xs font-medium text-[#E6CB7D] hover:bg-[#1E1812]"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Kod almashtirish</span>
            </button>

            <button
              type="button"
              onClick={onCloseAdmin}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#C9A84C]/30 px-3 py-1.5 text-xs font-medium text-[#F5EDD6] hover:bg-[#1E1812]"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Asosiy sahifa</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mx-auto max-w-[1400px] border-t border-[#C9A84C]/12 px-4 py-2 sm:px-6">
          <div
            role="tablist"
            aria-label="Restoran Dasturi Bo‘limlari"
            className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  data-testid={`staff-tab-${tab.id}`}
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#C9A84C] text-[#0A0806]'
                      : 'border border-[#C9A84C]/18 bg-[#14100C] text-[#B8AE98] hover:text-[#F5EDD6]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                  {typeof tab.badge === 'number' && tab.badge > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold tabular-nums ${
                        active ? 'bg-[#0A0806] text-[#E6CB7D]' : 'bg-[#8B3A2A] text-[#F5EDD6]'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-6">
        {/* Live Incoming Order / Check Request / Cancellation Alert Banner */}
        {lastOrderAlert && (
          <div
            role="status"
            data-testid="live-order-alert"
            className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${
              lastOrderAlert.status === 'Cancelled'
                ? 'border-[#8B3A2A] bg-[#1E100E]'
                : lastOrderAlert.checkRequested
                  ? 'border-[#2D4A3E] bg-[#111A16]'
                  : 'border-[#C9A84C] bg-[#1B150C]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Bell
                className={`h-5 w-5 shrink-0 ${
                  lastOrderAlert.status === 'Cancelled'
                    ? 'text-[#F0A495]'
                    : lastOrderAlert.checkRequested
                      ? 'text-[#A9CEBE]'
                      : 'text-[#E6CB7D]'
                }`}
              />
              <div>
                <p className="text-sm font-semibold text-[#F5EDD6]">
                  {lastOrderAlert.status === 'Cancelled'
                    ? `Diqqat: ${lastOrderAlert.code} (Stol #${lastOrderAlert.tableNumber}) mijoz tomonidan Atmen qilindi!`
                    : lastOrderAlert.checkRequested
                      ? `Elektron Chek So‘rovi: Stol #${lastOrderAlert.tableNumber} (${lastOrderAlert.code}) Soliq.uz cheki tayyor!`
                      : `Yangi Buyurtma: ${lastOrderAlert.code} · Stol #${lastOrderAlert.tableNumber} (${lastOrderAlert.waiterName || lastOrderAlert.source.toUpperCase()})`}
                </p>
                <p className="text-xs text-[#B8AE98]">
                  {staffSession.role !== 'kitchen'
                    ? `Summa: ${formatUzsPrice(lastOrderAlert.totalUzs)} · `
                    : ''}
                  {lastOrderAlert.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (lastOrderAlert.checkRequested && staffSession.role === 'admin') {
                    setActiveTab('cashier');
                  } else if (staffSession.role === 'admin') {
                    setActiveTab('orders');
                  }
                  onClearOrderAlert();
                }}
                className="rounded-md bg-[#C9A84C] px-3 py-1.5 text-xs font-semibold text-[#0A0806]"
              >
                Ko‘rish
              </button>
              <button
                type="button"
                onClick={onClearOrderAlert}
                aria-label="Yopish"
                className="rounded-md border border-[#C9A84C]/30 p-1.5 text-[#B8AE98] hover:text-[#F5EDD6]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB: WAITER PERSONAL CABINET (OFITSIANT KABINETI) */}
        {activeTab === 'waiter' && (
          <WaiterPosPanel
            dishes={dishes}
            orders={orders}
            waiters={waiters}
            settings={settings}
            activeWaiter={activeWaiterForPanel}
            isAdminMode={staffSession.role === 'admin'}
            onSelectWaiterForCabinet={(w) => setAdminWaiterOverrideId(w.id)}
            onSwitchPinLock={onSignOutSession}
            onCreatePosOrder={onCreatePosOrder}
            onRequestElectronicCheck={onRequestElectronicCheck}
            onUpdateOrderStatus={onUpdateOrderStatus}
            onLaunchEMenu={onLaunchEMenu}
          />
        )}

        {/* TAB: KITCHEN DISPLAY SYSTEM (OSHPAZ DASTURI) */}
        {activeTab === 'kitchen' && (
          <KitchenDisplayPanel
            orders={orders}
            onUpdateOrderStatus={onUpdateOrderStatus}
          />
        )}

        {/* TAB: CASHIER REGISTER TERMINAL (KASSIR DASTURI) */}
        {activeTab === 'cashier' && (
          <CashierRegisterPanel
            orders={orders}
            ledger={ledger}
            waiters={waiters}
            settings={settings}
            receiptArchive={receiptArchive}
            onUpdateSettings={onUpdateSettings}
            onUpdateOrderStatus={onUpdateOrderStatus}
            onRequestElectronicCheck={onRequestElectronicCheck}
            onAddLedgerEntry={onAddLedgerEntry}
            onCloseDailyShift={onCloseDailyShift}
            onClearReceiptArchive={onClearReceiptArchive}
          />
        )}

        {/* TAB: STAFF WORK REPORT & LIVE ACTIVITY (XODIMLAR ATCHOTI) */}
        {activeTab === 'staff-activity' && (
          <StaffActivityReportPanel activityLog={activityLog} />
        )}

        {/* TAB: WAITERS ROSTER (25+ WAITERS & COMMISSION SETTINGS) */}
        {activeTab === 'waiters-roster' && (
          <WaiterRosterManager
            waiters={waiters}
            settings={settings}
            onAddWaiter={onAddWaiter}
            onUpdateWaiter={onUpdateWaiter}
            onDeleteWaiter={onDeleteWaiter}
            onUpdateSettings={onUpdateSettings}
            onImpersonateWaiter={(w) => {
              setAdminWaiterOverrideId(w.id);
              setActiveTab('waiter');
            }}
          />
        )}

        {/* TAB 1: LIVE ORDERS & KITCHEN BOARD */}
        {activeTab === 'orders' && (
          <StaffOrdersPanel
            orders={orders}
            dishes={dishes}
            onUpdateOrderStatus={onUpdateOrderStatus}
            onCreatePosOrder={onCreatePosOrder}
          />
        )}

        {/* TAB 2: ACCOUNTING & AI VOICE CFO */}
        {activeTab === 'accounting' && (
          <StaffAccountingPanel
            ledger={ledger}
            orders={orders}
            language={language}
            onAddLedgerEntry={onAddLedgerEntry}
            onDeleteLedgerEntry={onDeleteLedgerEntry}
          />
        )}

        {/* TAB 3: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-[#2D4A3E] bg-[#121814] p-5">
                <p className="text-xs font-medium text-[#A9CEBE]">Jami Kirim</p>
                <p className="font-display mt-2 text-3xl font-semibold tabular-nums text-[#F5EDD6]">
                  {formatUzsPrice(accountingSummary.totalIncomeUzs)}
                </p>
                <p className="mt-1 text-xs text-[#A9CEBE]/80">
                  Sof foyda: {formatUzsPrice(accountingSummary.netProfitUzs)}
                </p>
              </div>

              <div className="rounded-xl border border-[#C9A84C]/30 bg-[#14100C] p-5">
                <p className="text-xs font-medium text-[#B8AE98]">Oshxonadagi Faol Buyurtmalar</p>
                <p className="font-display mt-2 text-3xl font-semibold tabular-nums text-[#E6CB7D]">
                  {accountingSummary.activeOrdersCount} ta
                </p>
                <p className="mt-1 text-xs text-[#B8AE98]">
                  Kutilayotgan tushum: {formatUzsPrice(accountingSummary.activeOrdersPipelineUzs)}
                </p>
              </div>

              <div className="rounded-xl border border-[#C9A84C]/25 bg-[#14100C] p-5">
                <p className="text-xs font-medium text-[#B8AE98]">Bronlar & Reyting</p>
                <p className="font-display mt-2 text-3xl font-semibold tabular-nums text-[#F5EDD6]">
                  {stats.activeReservations} ta · {stats.avgRating.toFixed(1)} ★
                </p>
                <p className="mt-1 text-xs text-[#87A89A]">
                  {stats.todaysReservations} ta bugungi bron · {stats.totalReviews} sharh
                </p>
              </div>

              <div className="rounded-xl border border-[#C9A84C]/25 bg-[#14100C] p-5">
                <p className="text-xs font-medium text-[#B8AE98]">Eng Ommabop Taom</p>
                <p className="font-display mt-2 truncate text-2xl font-semibold text-[#F5EDD6]">
                  {accountingSummary.topOrderedDishes[0]?.name || stats.popularDishName}
                </p>
                <p className="mt-1 text-xs tabular-nums text-[#C9A84C]">
                  Atmen buyurtmalar: {accountingSummary.cancelledOrdersCount} ta
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[#C9A84C]/20 bg-[#14100C] p-6">
              <h2 className="font-display text-2xl font-semibold text-[#F5EDD6]">
                So‘nggi Amaliyotlar Jurnali
              </h2>
              <ul className="mt-4 divide-y divide-[#C9A84C]/12">
                {activityLog.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col justify-between gap-1 py-3 text-sm sm:flex-row sm:items-center"
                  >
                    <div>
                      <span className="font-medium text-[#E6CB7D]">{item.action}</span>
                      <span className="mx-2 text-[#C9A84C]/50">·</span>
                      <span className="text-[#E5DEC9]">{item.detail}</span>
                    </div>
                    <span className="text-xs tabular-nums text-[#B8AE98]">
                      {item.timestamp}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* TAB 4: TABLES FLOOR GRID + QR / NFC */}
        {activeTab === 'tables-qr' && (
          <div className="space-y-8">
            <div className="rounded-xl border border-[#C9A84C]/25 bg-[#14100C] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-[#F5EDD6]">
                    Zal va Stollar Holati (1–{settings.tableCount} Stol)
                  </h2>
                  <p className="mt-1 text-xs text-[#B8AE98]">
                    Qaysi stolda qaysi ofitsiant yoki NFC/QR mehmon borligini ko‘ring.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                {Array.from({ length: settings.tableCount }, (_, idx) => String(idx + 1)).map(
                  (tableNum) => {
                    const tableActiveOrders = activeOrders.filter(
                      (o) => o.tableNumber === tableNum,
                    );
                    const activeSum = tableActiveOrders.reduce((s, o) => s + o.totalUzs, 0);
                    const occupied = tableActiveOrders.length > 0;
                    const assignedWaiter = tableActiveOrders.find((o) => o.waiterName)?.waiterName;

                    return (
                      <div
                        key={tableNum}
                        className={`flex flex-col justify-between rounded-lg border p-3.5 ${
                          occupied
                            ? 'border-[#C9A84C] bg-[#1C160E]'
                            : 'border-[#C9A84C]/18 bg-[#0E0B08]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-display text-xl font-semibold text-[#F5EDD6]">
                            Stol #{tableNum}
                          </span>
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              occupied ? 'bg-[#E6CB7D]' : 'bg-[#2D4A3E]'
                            }`}
                          />
                        </div>

                        <p className="mt-1.5 text-xs text-[#B8AE98]">
                          {occupied
                            ? `${assignedWaiter ? `${assignedWaiter} · ` : ''}${formatUzsPrice(activeSum)}`
                            : "Odam yo'q (Bo'sh)"}
                        </p>

                        <button
                          type="button"
                          onClick={() => onLaunchEMenu('nfc', tableNum)}
                          className="mt-3 rounded border border-[#C9A84C]/35 bg-[#14100C] px-2.5 py-1.5 text-[11px] font-medium text-[#E6CB7D] hover:bg-[#C9A84C] hover:text-[#0A0806]"
                        >
                          Mijoz menyusini ochish
                        </button>
                      </div>
                    );
                  },
                )}
              </div>
            </div>

            <QrNfcPanel onLaunchEMenu={onLaunchEMenu} />
          </div>
        )}

        {/* TAB 5: MENU MANAGER */}
        {activeTab === 'menu' && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <form
              onSubmit={handleCreateDish}
              className="h-fit rounded-xl border border-[#C9A84C]/25 bg-[#14100C] p-6 lg:col-span-4"
            >
              <h2 className="font-display text-2xl font-semibold text-[#F5EDD6]">
                Yangi Taom Qo‘shish
              </h2>
              <p className="mt-1 text-xs text-[#B8AE98]">
                O‘zgarishlar darhol Mijoz Buyurtma Dasturiga ham sinxronlanadi.
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <label htmlFor="dish-name" className="block text-xs font-medium text-[#E5DEC9]">
                    Taom nomi
                  </label>
                  <input
                    id="dish-name"
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Masalan: Samarqand Patir Noni"
                    className="mt-1 w-full rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3 py-2 text-sm text-[#F5EDD6]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="dish-category"
                      className="block text-xs font-medium text-[#E5DEC9]"
                    >
                      Toifa
                    </label>
                    <select
                      id="dish-category"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as DishCategory)}
                      className="mt-1 w-full rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3 py-2 text-sm text-[#F5EDD6]"
                    >
                      {DISH_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="dish-price" className="block text-xs font-medium text-[#E5DEC9]">
                      Narxi (UZS)
                    </label>
                    <input
                      id="dish-price"
                      type="number"
                      min={1000}
                      step={1000}
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="mt-1 w-full rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3 py-2 text-sm tabular-nums text-[#F5EDD6]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="dish-portion" className="block text-xs font-medium text-[#E5DEC9]">
                    Porsiya / Hajm (ixtiyoriy)
                  </label>
                  <input
                    id="dish-portion"
                    type="text"
                    value={newPortion}
                    onChange={(e) => setNewPortion(e.target.value)}
                    placeholder="250 g yoki 500 ml"
                    className="mt-1 w-full rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3 py-2 text-sm text-[#F5EDD6]"
                  />
                </div>

                <div>
                  <label htmlFor="dish-desc" className="block text-xs font-medium text-[#E5DEC9]">
                    Tavsif
                  </label>
                  <textarea
                    id="dish-desc"
                    rows={3}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Masalliqlar va tayyorlash usuli..."
                    className="mt-1 w-full rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3 py-2 text-sm text-[#F5EDD6]"
                  />
                </div>

                <div>
                  <label htmlFor="dish-image" className="block text-xs font-medium text-[#E5DEC9]">
                    Rasm URL (ixtiyoriy)
                  </label>
                  <input
                    id="dish-image"
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="mt-1 w-full rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3 py-2 text-sm text-[#F5EDD6]"
                  />
                </div>

                <fieldset>
                  <legend className="block text-xs font-medium text-[#E5DEC9]">
                    Parhez belgilari
                  </legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {DIETARY_TAGS.map((tag) => {
                      const active = newDietaryTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          aria-pressed={active}
                          onClick={() =>
                            setNewDietaryTags((prev) => toggleDietaryTag(prev, tag))
                          }
                          className={`rounded border px-2.5 py-1 text-xs font-medium transition-colors ${
                            active
                              ? 'border-[#C9A84C] bg-[#C9A84C]/20 text-[#E6CB7D]'
                              : 'border-[#C9A84C]/20 bg-[#0A0806] text-[#B8AE98] hover:text-[#F5EDD6]'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <label className="flex items-center gap-2 text-xs text-[#E5DEC9]">
                  <input
                    type="checkbox"
                    checked={newFeatured}
                    onChange={(e) => setNewFeatured(e.target.checked)}
                    className="h-4 w-4 rounded border-[#C9A84C]/40 bg-[#0A0806] accent-[#C9A84C]"
                  />
                  Firma taomi (Signature) sifatida belgilash
                </label>

                {dishFormError && <p className="text-xs text-[#E88473]">{dishFormError}</p>}

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#C9A84C] px-4 py-2.5 text-sm font-semibold text-[#0A0806] hover:bg-[#E6CB7D]"
                >
                  <Plus className="h-4 w-4" />
                  <span>Menyuga qo‘shish</span>
                </button>
              </div>
            </form>

            <div className="space-y-4 lg:col-span-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-display text-2xl font-semibold text-[#F5EDD6]">
                  Faol Menyu ({filteredAdminDishes.length})
                </h2>
                <input
                  type="search"
                  aria-label="Search menu dishes"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="Taom yoki toifa qidirish..."
                  className="w-full rounded-md border border-[#C9A84C]/25 bg-[#14100C] px-3.5 py-2 text-sm text-[#F5EDD6] placeholder-[#B8AE98]/50 sm:w-64"
                />
              </div>

              {editingDish && (
                <form
                  onSubmit={handleSaveEdit}
                  className="space-y-3 rounded-xl border border-[#C9A84C] bg-[#19140F] p-5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#E6CB7D]">
                      Tahrirlash: {editingDish.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => setEditingDish(null)}
                      aria-label="Cancel dish edit"
                      className="text-[#B8AE98] hover:text-[#F5EDD6]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <input
                      type="text"
                      aria-label="Edit dish name"
                      value={editingDish.name}
                      onChange={(e) =>
                        setEditingDish({ ...editingDish, name: e.target.value })
                      }
                      className="rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3 py-2 text-sm text-[#F5EDD6]"
                    />
                    <select
                      aria-label="Edit dish category"
                      value={editingDish.category}
                      onChange={(e) =>
                        setEditingDish({
                          ...editingDish,
                          category: e.target.value as DishCategory,
                        })
                      }
                      className="rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3 py-2 text-sm text-[#F5EDD6]"
                    >
                      {DISH_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      aria-label="Edit dish price"
                      value={editingDish.priceUzs}
                      onChange={(e) =>
                        setEditingDish({
                          ...editingDish,
                          priceUzs: Number(e.target.value) || 0,
                        })
                      }
                      className="rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3 py-2 text-sm tabular-nums text-[#F5EDD6]"
                    />
                  </div>
                  <textarea
                    rows={2}
                    aria-label="Edit dish description"
                    value={editingDish.description}
                    onChange={(e) =>
                      setEditingDish({ ...editingDish, description: e.target.value })
                    }
                    className="w-full rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3 py-2 text-sm text-[#F5EDD6]"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {DIETARY_TAGS.map((tag) => {
                        const active = editingDish.dietaryTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            aria-pressed={active}
                            onClick={() =>
                              setEditingDish({
                                ...editingDish,
                                dietaryTags: toggleDietaryTag(editingDish.dietaryTags, tag),
                              })
                            }
                            className={`rounded border px-2.5 py-1 text-xs font-medium ${
                              active
                                ? 'border-[#C9A84C] bg-[#C9A84C]/20 text-[#E6CB7D]'
                                : 'border-[#C9A84C]/20 bg-[#0A0806] text-[#B8AE98]'
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingDish(null)}
                        className="rounded-md border border-[#C9A84C]/25 px-3 py-1.5 text-xs text-[#B8AE98]"
                      >
                        Bekor qilish
                      </button>
                      <button
                        type="submit"
                        className="rounded-md bg-[#C9A84C] px-4 py-1.5 text-xs font-semibold text-[#0A0806]"
                      >
                        Saqlash
                      </button>
                    </div>
                  </div>
                </form>
              )}

              <div className="divide-y divide-[#C9A84C]/12 rounded-xl border border-[#C9A84C]/20 bg-[#14100C]">
                {filteredAdminDishes.map((dish) => (
                  <div
                    key={dish.id}
                    className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-xl font-semibold text-[#F5EDD6]">
                          {dish.name}
                        </h3>
                        <span className="text-xs text-[#C9A84C]">· {dish.category}</span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-[#B8AE98]">
                        {dish.description}
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        {DIETARY_TAGS.map((tag) => {
                          const active = dish.dietaryTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              aria-pressed={active}
                              onClick={() => onToggleDishDietaryTag(dish.id, tag)}
                              className={`rounded border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                                active
                                  ? 'border-[#C9A84C]/60 bg-[#C9A84C]/20 text-[#E6CB7D]'
                                  : 'border-[#C9A84C]/15 bg-[#0A0806] text-[#B8AE98]/70 hover:text-[#F5EDD6]'
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-semibold tabular-nums text-[#E6CB7D]">
                        {formatUzsPrice(dish.priceUzs)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingDish(dish)}
                        aria-label={`Edit ${dish.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-[#C9A84C]/25 text-[#E5DEC9] hover:bg-[#1E1812]"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteDish(dish.id)}
                        aria-label={`Delete ${dish.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-[#8B3A2A]/50 text-[#E88473] hover:bg-[#8B3A2A]/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: RESERVATIONS */}
        {activeTab === 'reservations' && (
          <div className="overflow-hidden rounded-xl border border-[#C9A84C]/20 bg-[#14100C]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#C9A84C]/18 bg-[#19140F] text-xs uppercase tracking-wider text-[#B8AE98]">
                  <tr>
                    <th className="px-4 py-3.5">Kod</th>
                    <th className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => handleSort('guestName')}
                        className="inline-flex items-center gap-1 hover:text-[#F5EDD6]"
                      >
                        Mehmon <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => handleSort('date')}
                        className="inline-flex items-center gap-1 hover:text-[#F5EDD6]"
                      >
                        Sana & Vaqt <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => handleSort('partySize')}
                        className="inline-flex items-center gap-1 hover:text-[#F5EDD6]"
                      >
                        Kishi <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => handleSort('status')}
                        className="inline-flex items-center gap-1 hover:text-[#F5EDD6]"
                      >
                        Holat <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3.5 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C9A84C]/10">
                  {sortedReservations.map((res) => (
                    <tr key={res.id} className="hover:bg-[#19140F]/70">
                      <td className="px-4 py-3.5 font-mono text-xs tabular-nums text-[#E6CB7D]">
                        {res.code}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-[#F5EDD6]">{res.guestName}</div>
                        <div className="text-xs text-[#B8AE98]">{res.contact}</div>
                      </td>
                      <td className="px-4 py-3.5 tabular-nums text-[#E5DEC9]">
                        {res.date} · {res.time}
                      </td>
                      <td className="px-4 py-3.5 tabular-nums text-[#F5EDD6]">
                        {res.partySize}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-xs font-medium ${
                            res.status === 'Confirmed'
                              ? 'text-[#87A89A]'
                              : res.status === 'Pending'
                                ? 'text-[#E6CB7D]'
                                : 'text-[#E88473]'
                          }`}
                        >
                          {res.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={res.status === 'Confirmed'}
                            onClick={() => onUpdateReservationStatus(res.id, 'Confirmed')}
                            className="rounded border border-[#2D4A3E] bg-[#2D4A3E]/30 px-2.5 py-1 text-xs font-medium text-[#A9CEBE] disabled:opacity-40"
                          >
                            Tasdiqlash
                          </button>
                          <button
                            type="button"
                            disabled={res.status === 'Cancelled'}
                            onClick={() => onUpdateReservationStatus(res.id, 'Cancelled')}
                            className="rounded border border-[#8B3A2A]/60 bg-[#8B3A2A]/20 px-2.5 py-1 text-xs font-medium text-[#E88473] disabled:opacity-40"
                          >
                            Bekor qilish
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className={`flex flex-col justify-between gap-4 rounded-xl border p-5 sm:flex-row sm:items-center ${
                  rev.hidden
                    ? 'border-[#C9A84C]/10 bg-[#100D0A] opacity-65'
                    : 'border-[#C9A84C]/25 bg-[#14100C]'
                }`}
              >
                <div className="max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[#F5EDD6]">{rev.author}</span>
                    <span className="text-xs tabular-nums text-[#C9A84C]">
                      · {rev.rating}.0 ★
                    </span>
                    <span className="text-xs text-[#B8AE98]">· {rev.dateLabel}</span>
                    {rev.featured && (
                      <span className="text-xs font-medium text-[#87A89A]">· Tanlangan</span>
                    )}
                    {rev.hidden && (
                      <span className="text-xs font-medium text-[#E88473]">· Yashirilgan</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-[#E5DEC9]">“{rev.text}”</p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleReviewFeatured(rev.id)}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium ${
                      rev.featured
                        ? 'border-[#C9A84C] bg-[#C9A84C]/15 text-[#E6CB7D]'
                        : 'border-[#C9A84C]/25 text-[#B8AE98] hover:text-[#F5EDD6]'
                    }`}
                  >
                    {rev.featured ? <Check className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
                    <span>{rev.featured ? 'Tanlangan' : 'Tanlash'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleReviewHidden(rev.id)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#C9A84C]/25 px-3 py-1.5 text-xs font-medium text-[#E5DEC9] hover:bg-[#1E1812]"
                  >
                    {rev.hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    <span>{rev.hidden ? 'Ko‘rsatish' : 'Yashirish'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
