import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Minus,
  Plus,
  QrCode,
  Receipt,
  Search,
  ShoppingBag,
  Smartphone,
  UtensilsCrossed,
  Wifi,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { DICTIONARIES } from '../data/i18n';
import { RESTAURANT_META } from '../data/seedData';
import type {
  AppLanguage,
  DietaryTag,
  Dish,
  DishCategory,
  EMenuSource,
  Order,
} from '../types/restaurant';
import { resolveDishImageUrl } from '../utils/dishImages';
import {
  MENU_FILTER_CATEGORIES,
  canGuestCancelOrder,
  computeTableEstimateTotal,
  filterMenuDishes,
  formatUzsPrice,
} from '../utils/restaurantLogic';
import { DishVisual } from './DishVisual';
import { FiscalReceiptModal } from './FiscalReceiptModal';
import { SayqalEmblem } from './SayqalEmblem';

const DIETARY_BADGE_STYLES: Record<DietaryTag, string> = {
  Vegan: 'border-[#2D4A3E] bg-[#2D4A3E]/35 text-[#A9CEBE]',
  'Gluten-Free': 'border-[#C9A84C]/45 bg-[#C9A84C]/12 text-[#E6CB7D]',
  Spicy: 'border-[#8B3A2A]/75 bg-[#8B3A2A]/28 text-[#F0A495]',
};

const MY_ORDERS_KEY = 'sayqal_guest_order_ids_v1';

interface GuestOrderAppProps {
  dishes: Dish[];
  orders: Order[];
  source: EMenuSource;
  initialTable?: string;
  tableCount?: number;
  language: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
  onPlaceOrder: (input: {
    tableNumber: string;
    source: EMenuSource;
    guestName?: string;
    note?: string;
    items: Array<{ dishId: string; quantity: number }>;
  }) => Promise<Order>;
  onRequestElectronicCheck: (orderId: string) => Promise<Order>;
  onCancelOrder: (orderId: string, reason?: string) => Promise<Order>;
  onExitToLounge: () => void;
  onOpenQrNfc: () => void;
}

export function GuestOrderApp({
  dishes,
  orders,
  source,
  initialTable,
  tableCount = 25,
  language,
  onChangeLanguage,
  onPlaceOrder,
  onRequestElectronicCheck,
  onCancelOrder,
  onExitToLounge,
  onOpenQrNfc,
}: GuestOrderAppProps) {
  const dict = DICTIONARIES[language].guestOrder;
  const [activeTab, setActiveTab] = useState<'menu' | 'my-orders'>('menu');
  const [selectedCategory, setSelectedCategory] = useState<'All' | DishCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [tableNumber, setTableNumber] = useState(initialTable || '1');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [guestName, setGuestName] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [checkingOutId, setCheckingOutId] = useState<string | null>(null);
  const [receiptOrderId, setReceiptOrderId] = useState<string | null>(null);
  const [myOrderIds, setMyOrderIds] = useState<string[]>(() => {
    try {
      const raw = window.localStorage.getItem(MY_ORDERS_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (initialTable) {
      setTableNumber(initialTable);
    }
  }, [initialTable]);

  useEffect(() => {
    try {
      window.localStorage.setItem(MY_ORDERS_KEY, JSON.stringify(myOrderIds));
    } catch {
      // Ignore storage errors
    }
  }, [myOrderIds]);

  const filteredDishes = filterMenuDishes(dishes, selectedCategory, searchQuery);
  const estimate = computeTableEstimateTotal(dishes, quantities);

  const myOrders = orders.filter(
    (o) =>
      myOrderIds.includes(o.id) ||
      (tableNumber !== 'Takeaway' &&
        o.tableNumber === tableNumber &&
        o.status !== 'Paid' &&
        (o.source === 'nfc' || o.source === 'qr')),
  );

  const activeMyOrders = myOrders.filter(
    (o) => o.status !== 'Paid' && o.status !== 'Cancelled',
  );

  const pastMyOrders = orders.filter(
    (o) =>
      myOrderIds.includes(o.id) &&
      (o.status === 'Paid' || o.status === 'Cancelled'),
  );

  const adjustQuantity = (dishId: string, delta: number) => {
    setQuantities((prev) => {
      const next = Math.max(0, (prev[dishId] ?? 0) + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[dishId];
        return copy;
      }
      return { ...prev, [dishId]: next };
    });
  };

  const handleConfirmOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([dishId, quantity]) => ({ dishId, quantity }));

    if (items.length === 0) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const created = await onPlaceOrder({
        tableNumber,
        source,
        guestName: guestName.trim() || `Stol #${tableNumber}`,
        note: orderNote.trim() || undefined,
        items,
      });
      setMyOrderIds((prev) => [created.id, ...prev.filter((id) => id !== created.id)]);
      setQuantities({});
      setOrderNote('');
      setIsCheckoutOpen(false);
      setActiveTab('my-orders');
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Buyurtmani yuborib bo‘lmadi.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestCancel = async (orderId: string) => {
    setCancellingId(orderId);
    setErrorMsg('');
    try {
      await onCancelOrder(orderId, 'Mijoz fikridan qaytdi (Atmen)');
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Bekor qilib bo‘lmadi.',
      );
    } finally {
      setCancellingId(null);
    }
  };

  const handleGuestRequestCheck = async (orderId: string) => {
    setCheckingOutId(orderId);
    setErrorMsg('');
    try {
      const updated = await onRequestElectronicCheck(orderId);
      setReceiptOrderId(updated.id);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Elektron chekni yaratib bo‘lmadi.',
      );
    } finally {
      setCheckingOutId(null);
    }
  };

  const receiptOrder = receiptOrderId
    ? orders.find((o) => o.id === receiptOrderId) ?? null
    : null;

  const sourceLabel =
    source === 'nfc'
      ? `NFC Tap · Stol #${tableNumber}`
      : source === 'qr'
        ? `QR Kod · Stol #${tableNumber}`
        : `Elektron Menyu · Stol #${tableNumber}`;

  const statusText = (status: Order['status']) => {
    if (status === 'Pending') return 'Kutilmoqda (Yuborildi)';
    if (status === 'Preparing') return 'Oshxonada tayyorlanmoqda';
    if (status === 'Ready') return 'Tayyor — stolga chiqmoqda';
    if (status === 'Paid') return 'Yakunlandi (To‘landi)';
    return dict.cancelledByGuest;
  };

  return (
    <div
      data-testid="guest-order-app"
      className="min-h-screen bg-[#0A0806] pb-28 text-[#F5EDD6]"
    >
      {/* Standalone Guest App Top Bar (Zero Staff/Accounting Controls) */}
      <header className="sticky top-0 z-30 border-b border-[#C9A84C]/25 bg-[#0A0806]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onExitToLounge}
              aria-label="Back to Sayqal home"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#C9A84C]/30 bg-[#14100C] text-[#E6CB7D] hover:border-[#C9A84C]"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <SayqalEmblem className="h-8 w-8 shrink-0" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-xl font-semibold leading-none text-[#F5EDD6] sm:text-2xl">
                  {dict.title}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#C9A84C]/45 bg-[#C9A84C]/15 px-2.5 py-0.5 text-[11px] font-medium text-[#E6CB7D]">
                  {source === 'nfc' ? (
                    <Wifi className="h-3 w-3 rotate-90" />
                  ) : source === 'qr' ? (
                    <QrCode className="h-3 w-3" />
                  ) : (
                    <Smartphone className="h-3 w-3" />
                  )}
                  {sourceLabel}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-[#B8AE98]">
                {RESTAURANT_META.addressLine} · {dict.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* UZ / RU / EN switcher */}
            <div className="inline-flex rounded-full border border-[#C9A84C]/30 bg-[#14100C] p-0.5 text-[11px] font-medium">
              {(['uz', 'ru', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => onChangeLanguage(lang)}
                  className={`rounded-full px-2 py-1 uppercase transition-colors ${
                    language === lang
                      ? 'bg-[#C9A84C] text-[#0A0806]'
                      : 'text-[#B8AE98] hover:text-[#F5EDD6]'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onOpenQrNfc}
              aria-label="Share table QR and NFC link"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#C9A84C]/30 bg-[#14100C] px-3 py-1.5 text-xs font-medium text-[#E6CB7D] hover:border-[#C9A84C]"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>QR / NFC</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs: Menu vs My Orders + Table Selector */}
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 border-t border-[#C9A84C]/12 px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-1.5 rounded-lg border border-[#C9A84C]/20 bg-[#14100C] p-1">
            <button
              type="button"
              onClick={() => setActiveTab('menu')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === 'menu'
                  ? 'bg-[#C9A84C] text-[#0A0806]'
                  : 'text-[#B8AE98] hover:text-[#F5EDD6]'
              }`}
            >
              <UtensilsCrossed className="h-3.5 w-3.5" />
              <span>Menyu</span>
            </button>

            <button
              type="button"
              data-testid="guest-my-orders-tab"
              onClick={() => setActiveTab('my-orders')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === 'my-orders'
                  ? 'bg-[#C9A84C] text-[#0A0806]'
                  : 'text-[#B8AE98] hover:text-[#F5EDD6]'
              }`}
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>
                {dict.myOrders} ({myOrders.length})
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="guest-table-select" className="text-xs text-[#B8AE98]">
              {dict.tableLabel}:
            </label>
            <select
              id="guest-table-select"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="rounded-md border border-[#C9A84C]/30 bg-[#14100C] px-2.5 py-1.5 text-xs font-medium text-[#E6CB7D] focus:border-[#C9A84C] focus:outline-none"
            >
              {Array.from({ length: tableCount }, (_, i) => String(i + 1)).map((num) => (
                <option key={num} value={num}>
                  Stol #{num}
                </option>
              ))}
              <option value="Takeaway">{dict.takeaway}</option>
            </select>
          </div>
        </div>
      </header>

      {errorMsg && (
        <div className="mx-auto mt-4 max-w-[1200px] px-4 sm:px-6">
          <div
            role="alert"
            className="rounded-lg border border-[#8B3A2A] bg-[#8B3A2A]/25 px-4 py-3 text-xs text-[#F5EDD6]"
          >
            {errorMsg}
          </div>
        </div>
      )}

      {activeTab === 'menu' ? (
        <main className="mx-auto max-w-[1200px] px-4 pt-5 sm:px-6">
          {/* Categories + Search */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div
              role="tablist"
              aria-label="Electronic menu categories"
              className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0"
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
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#C9A84C] text-[#0A0806]'
                        : 'border border-[#C9A84C]/20 bg-[#14100C] text-[#B8AE98] hover:text-[#F5EDD6]'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            <div className="relative sm:w-64 shrink-0">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#B8AE98]"
              />
              <input
                type="search"
                aria-label="Search menu dishes"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Taom yoki narx qidirish..."
                className="w-full rounded-md border border-[#C9A84C]/25 bg-[#14100C] py-2 pl-8 pr-3 text-xs text-[#F5EDD6] placeholder-[#B8AE98]/60 focus:border-[#C9A84C] focus:outline-none"
              />
            </div>
          </div>

          {/* Dishes Grid with Crisp 3D Card Depth */}
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDishes.map((dish) => {
              const qty = quantities[dish.id] ?? 0;
              const resolvedImage = resolveDishImageUrl(dish.id, dish.imageUrl);
              return (
                <div key={dish.id} className="tilt-card-wrapper">
                  <article className="tilt-card-inner group flex h-full flex-col overflow-hidden rounded-xl border border-[#C9A84C]/28 bg-gradient-to-b from-[#17120D] to-[#110D0A] transition-all duration-200 hover:-translate-y-1 hover:border-[#E6CB7D]/70">
                    <DishVisual
                      style={dish.visualStyle}
                      title={dish.name}
                      imageUrl={resolvedImage}
                      priceLabel={formatUzsPrice(dish.priceUzs)}
                      featured={dish.featured}
                    />

                    <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                      <div>
                        <div className="flex items-center justify-between gap-2 text-xs text-[#B8AE98]">
                          <span className="font-medium text-[#E6CB7D]">{dish.category}</span>
                          {dish.portion && (
                            <span className="tabular-nums">{dish.portion}</span>
                          )}
                        </div>

                        <h2 className="tilt-card-depth font-display mt-1.5 text-xl font-semibold text-[#F5EDD6]">
                          {dish.name}
                        </h2>

                        <p className="mt-1.5 text-xs leading-relaxed text-[#C2B8A2]">
                          {dish.description}
                        </p>

                        {dish.dietaryTags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {dish.dietaryTags.map((tag) => (
                              <span
                                key={tag}
                                className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${DIETARY_BADGE_STYLES[tag]}`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#C9A84C]/18 pt-3.5">
                        <div>
                          <span className="block text-[10px] uppercase tracking-wider text-[#B8AE98]">
                            Narxi
                          </span>
                          <span className="text-base font-semibold tabular-nums text-[#E6CB7D]">
                            {formatUzsPrice(dish.priceUzs)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {qty > 0 ? (
                            <>
                              <button
                                type="button"
                                onClick={() => adjustQuantity(dish.id, -1)}
                                aria-label={`Remove ${dish.name}`}
                                className="flex h-9 w-9 items-center justify-center rounded-md border border-[#C9A84C]/35 bg-[#0A0806] text-[#F5EDD6] hover:bg-[#1E1812]"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="min-w-[1.5rem] text-center text-sm font-semibold tabular-nums text-[#F5EDD6]">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => adjustQuantity(dish.id, 1)}
                                aria-label={`Add one more ${dish.name}`}
                                className="flex h-9 w-9 items-center justify-center rounded-md border border-[#C9A84C] bg-[#C9A84C] text-[#0A0806] hover:bg-[#E6CB7D]"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => adjustQuantity(dish.id, 1)}
                              aria-label={`Add ${dish.name}`}
                              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#C9A84C]/45 bg-[#0A0806] px-3.5 text-xs font-medium text-[#E6CB7D] hover:border-[#E6CB7D] hover:bg-[#C9A84C] hover:text-[#0A0806] transition-colors"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Qo‘shish</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        </main>
      ) : (
        /* My Orders Live Tracking + Guest "Atmen qilish" Cancellation */
        <main className="mx-auto max-w-[920px] px-4 pt-6 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl font-semibold text-[#F5EDD6]">
                {dict.myOrders}
              </h2>
              <p className="mt-1 text-xs text-[#B8AE98]">
                Buyurtmangiz to‘g‘ridan-to‘g‘ri restoran oshxonasi va admin paneliga tushadi. Fikringiz o‘zgarsa «Atmen qilish» tugmasi orqali bekor qilishingiz mumkin.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('menu')}
              className="rounded-md bg-[#C9A84C] px-4 py-2 text-xs font-semibold text-[#0A0806] hover:bg-[#E6CB7D]"
            >
              + Yana taom qo‘shish
            </button>
          </div>

          {activeMyOrders.length === 0 && pastMyOrders.length === 0 ? (
            <div className="mt-6 rounded-xl border border-[#C9A84C]/20 bg-[#14100C] p-10 text-center">
              <ShoppingBag className="mx-auto h-8 w-8 text-[#C9A84C]/70" />
              <p className="mt-3 text-sm text-[#E5DEC9]">{dict.noOrdersYet}</p>
              <button
                type="button"
                onClick={() => setActiveTab('menu')}
                className="mt-4 rounded-md bg-[#C9A84C] px-5 py-2.5 text-xs font-semibold text-[#0A0806]"
              >
                Menyuga qaytish
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-8">
              {activeMyOrders.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#E6CB7D]">
                    Faol Buyurtmalar (Live Orders)
                  </h3>
                  {activeMyOrders.map((order) => {
                    const cancellable = canGuestCancelOrder(order.status);
                    const isCancelled = order.status === 'Cancelled';
                    const isPaid = order.status === 'Paid';
                    return (
                      <div
                        key={order.id}
                        data-testid={`guest-order-card-${order.id}`}
                        className={`rounded-xl border p-5 ${
                          isCancelled
                            ? 'border-[#8B3A2A]/55 bg-[#160F0D] opacity-85'
                            : 'border-[#C9A84C]/30 bg-[#14100C]'
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#C9A84C]/15 pb-3.5">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-sm font-semibold text-[#E6CB7D]">
                                {order.code}
                              </span>
                              <span className="text-xs text-[#B8AE98]">
                                · Stol #{order.tableNumber} ({order.source.toUpperCase()})
                              </span>
                            </div>
                            <p className="mt-1 flex items-center gap-1.5 text-xs">
                              {isCancelled ? (
                                <XCircle className="h-3.5 w-3.5 text-[#E88473]" />
                              ) : isPaid ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-[#87A89A]" />
                              ) : (
                                <Clock className="h-3.5 w-3.5 text-[#E6CB7D]" />
                              )}
                              <span
                                className={
                                  isCancelled
                                    ? 'font-medium text-[#E88473]'
                                    : isPaid
                                      ? 'font-medium text-[#87A89A]'
                                      : 'font-medium text-[#E6CB7D]'
                                }
                              >
                                {statusText(order.status)}
                              </span>
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="block text-[10px] uppercase tracking-wider text-[#B8AE98]">
                              {dict.totalLabel}
                            </span>
                            <span className="text-lg font-semibold tabular-nums text-[#E6CB7D]">
                              {formatUzsPrice(order.totalUzs)}
                            </span>
                          </div>
                        </div>

                        <ul className="mt-3 space-y-1.5 text-sm">
                          {order.items.map((item) => (
                            <li
                              key={`${order.id}-${item.dishId}`}
                              className="flex items-center justify-between gap-2 text-[#E5DEC9]"
                            >
                              <span>
                                {item.quantity} × {item.name}
                              </span>
                              <span className="tabular-nums text-[#B8AE98]">
                                {formatUzsPrice(item.priceUzs * item.quantity)}
                              </span>
                            </li>
                          ))}
                        </ul>

                        {order.note && (
                          <p className="mt-3 rounded border border-[#C9A84C]/15 bg-[#0A0806] px-3 py-2 text-xs text-[#B8AE98]">
                            Izoh: {order.note}
                          </p>
                        )}

                        {order.checkRequested && !isCancelled && (
                          <div className="mt-3 rounded-lg border border-[#2D4A3E] bg-[#101915] px-3 py-2 text-xs text-[#A9CEBE]">
                            Kassirga Soliq.uz elektron cheki yuborildi — QR kodni skanerlab keshbek olishingiz mumkin.
                          </div>
                        )}

                        {!isCancelled && (
                          <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5 border-t border-[#C9A84C]/12 pt-3.5">
                            <button
                              type="button"
                              data-testid={`guest-request-check-${order.id}`}
                              disabled={checkingOutId === order.id}
                              onClick={() => handleGuestRequestCheck(order.id)}
                              className="inline-flex items-center gap-1.5 rounded-md border border-[#C9A84C] bg-[#C9A84C]/18 px-3.5 py-2 text-xs font-semibold text-[#E6CB7D] transition-colors hover:bg-[#C9A84C] hover:text-[#0A0806] disabled:opacity-50"
                            >
                              <QrCode className="h-3.5 w-3.5" />
                              <span>
                                {checkingOutId === order.id
                                  ? 'Chek tayyorlanmoqda...'
                                  : order.fiscalReceipt
                                    ? 'Soliq.uz QR Chekni ochish'
                                    : 'Bo‘ldi, turamiz · Elektron Chek (Soliq.uz QR)'}
                              </span>
                            </button>

                            {cancellable && (
                              <button
                                type="button"
                                data-testid={`cancel-order-${order.id}`}
                                disabled={cancellingId === order.id}
                                onClick={() => handleGuestCancel(order.id)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-[#8B3A2A] bg-[#8B3A2A]/25 px-3.5 py-2 text-xs font-semibold text-[#F0A495] transition-colors hover:bg-[#8B3A2A]/45 disabled:opacity-50"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                <span>
                                  {cancellingId === order.id
                                    ? 'Bekor qilinmoqda...'
                                    : dict.cancelOrder}
                                </span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* View Past Orders / O'tgan buyurtmalar tarixi */}
              <div className="space-y-4 border-t border-[#C9A84C]/25 pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-semibold text-[#F5EDD6]">
                    {dict.pastOrders}
                  </h3>
                  <span className="text-xs tabular-nums text-[#B8AE98]">
                    ({pastMyOrders.length} ta)
                  </span>
                </div>

                {pastMyOrders.length === 0 ? (
                  <div className="rounded-xl border border-[#C9A84C]/15 bg-[#14100C] p-6 text-center text-xs text-[#B8AE98]">
                    {dict.noPastOrders}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pastMyOrders.map((order) => {
                      const isCancelled = order.status === 'Cancelled';
                      const isPaid = order.status === 'Paid';
                      return (
                        <div
                          key={`past-${order.id}`}
                          data-testid={`guest-past-order-${order.id}`}
                          className="rounded-xl border border-[#C9A84C]/25 bg-[#110D0A] p-5 opacity-90"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#C9A84C]/15 pb-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-sm font-semibold text-[#E6CB7D]">
                                  {order.code}
                                </span>
                                <span className="text-xs text-[#B8AE98]">
                                  · Stol #{order.tableNumber} ({order.source.toUpperCase()})
                                </span>
                              </div>
                              <p className="mt-1 flex items-center gap-1.5 text-xs">
                                {isCancelled ? (
                                  <XCircle className="h-3.5 w-3.5 text-[#E88473]" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-[#87A89A]" />
                                )}
                                <span className={isCancelled ? 'text-[#E88473]' : 'text-[#87A89A]'}>
                                  {statusText(order.status)}
                                </span>
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="block text-[10px] uppercase tracking-wider text-[#B8AE98]">
                                {dict.totalLabel}
                              </span>
                              <span className="text-base font-semibold tabular-nums text-[#E6CB7D]">
                                {formatUzsPrice(order.totalUzs)}
                              </span>
                            </div>
                          </div>
                          <ul className="mt-3 space-y-1 text-xs">
                            {order.items.map((item) => (
                              <li key={`past-item-${order.id}-${item.dishId}`} className="flex justify-between text-[#D6CCB4]">
                                <span>{item.quantity} × {item.name}</span>
                                <span className="tabular-nums">{formatUzsPrice(item.priceUzs * item.quantity)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      )}

      {/* Sticky Bottom Cart Bar */}
      {activeTab === 'menu' && estimate.itemCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-30 border-t border-[#C9A84C]/35 bg-[#14100C]/98 px-4 py-3 backdrop-blur-md sm:px-6">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-[#B8AE98]">
                Stol #{tableNumber} · Tanlangan:{' '}
                <span className="font-semibold text-[#F5EDD6]">{estimate.itemCount} ta taom</span>
              </p>
              <p className="text-base font-semibold tabular-nums text-[#E6CB7D]">
                Jami: {formatUzsPrice(estimate.totalUzs)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantities({})}
                className="rounded-md border border-[#C9A84C]/30 px-3 py-2 text-xs font-medium text-[#B8AE98] hover:text-[#F5EDD6]"
              >
                Tozalash
              </button>
              <button
                type="button"
                data-testid="open-checkout-btn"
                onClick={() => setIsCheckoutOpen(true)}
                className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-[#E6CB7D] to-[#C99B3B] px-5 py-2.5 text-xs font-semibold text-[#0A0806] shadow-lg"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>{dict.orderNow}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Confirmation Modal */}
      {isCheckoutOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm table order"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setIsCheckoutOpen(false)}
        >
          <form
            onSubmit={handleConfirmOrder}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-[#C9A84C]/35 bg-[#14100C] p-6 space-y-4"
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#C9A84C]">
                {sourceLabel}
              </p>
              <h2 className="font-display mt-1 text-2xl font-semibold text-[#F5EDD6]">
                Buyurtmani tasdiqlash
              </h2>
            </div>

            <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-[#C9A84C]/18 bg-[#0A0806] p-3 text-xs">
              {dishes
                .filter((d) => (quantities[d.id] ?? 0) > 0)
                .map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-2">
                    <span className="text-[#E5DEC9]">
                      {quantities[d.id]} × {d.name}
                    </span>
                    <span className="tabular-nums text-[#E6CB7D]">
                      {formatUzsPrice(d.priceUzs * (quantities[d.id] ?? 0))}
                    </span>
                  </div>
                ))}
              <div className="flex items-center justify-between border-t border-[#C9A84C]/15 pt-2 font-semibold text-[#F5EDD6]">
                <span>Jami summa</span>
                <span className="tabular-nums text-[#E6CB7D]">
                  {formatUzsPrice(estimate.totalUzs)}
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="checkout-guest-name" className="block text-xs font-medium text-[#E5DEC9]">
                Ismingiz (ixtiyoriy)
              </label>
              <input
                id="checkout-guest-name"
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder={`Stol #${tableNumber}`}
                className="mt-1 w-full rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3 py-2 text-sm text-[#F5EDD6] placeholder-[#B8AE98]/50 focus:border-[#C9A84C] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="checkout-note" className="block text-xs font-medium text-[#E5DEC9]">
                Oshpazga izoh (ixtiyoriy)
              </label>
              <textarea
                id="checkout-note"
                rows={2}
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="Masalan: piyozsiz, choyni avval olib keling..."
                className="mt-1 w-full rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3 py-2 text-sm text-[#F5EDD6] placeholder-[#B8AE98]/50 focus:border-[#C9A84C] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="rounded-md border border-[#C9A84C]/30 px-4 py-2 text-xs font-medium text-[#B8AE98]"
              >
                Ortga
              </button>
              <button
                type="submit"
                data-testid="confirm-send-order-btn"
                disabled={isSubmitting}
                className="rounded-md bg-[#C9A84C] px-5 py-2 text-xs font-semibold text-[#0A0806] hover:bg-[#E6CB7D] disabled:opacity-50"
              >
                {isSubmitting ? 'Yuborilmoqda...' : 'Buyurtma berish'}
              </button>
            </div>
          </form>
        </div>
      )}

      <FiscalReceiptModal order={receiptOrder} onClose={() => setReceiptOrderId(null)} />
    </div>
  );
}
