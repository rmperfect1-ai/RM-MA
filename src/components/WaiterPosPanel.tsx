import {
  ChefHat,
  Clock,
  KeyRound,
  Minus,
  Plus,
  QrCode,
  Search,
  Send,
  Smartphone,
  UserCheck,
  Utensils,
  Wallet,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import type {
  Dish,
  DishCategory,
  EMenuSource,
  Order,
  OrderStatus,
  PaymentMethod,
  RestaurantSettings,
  WaiterProfile,
} from '../types/restaurant';
import { resolveDishImageUrl } from '../utils/dishImages';
import {
  MENU_FILTER_CATEGORIES,
  computeTableEstimateTotal,
  computeWaiterPayouts,
  filterMenuDishes,
  formatUzsPrice,
  getTableOwnershipMap,
} from '../utils/restaurantLogic';
import { FiscalReceiptModal } from './FiscalReceiptModal';

interface WaiterPosPanelProps {
  dishes: Dish[];
  orders: Order[];
  waiters: WaiterProfile[];
  settings: RestaurantSettings;
  activeWaiter?: WaiterProfile;
  isAdminMode?: boolean;
  onSelectWaiterForCabinet?: (waiter: WaiterProfile) => void;
  onSwitchPinLock?: () => void;
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
  onRequestElectronicCheck: (orderId: string) => Promise<Order>;
  onUpdateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    options?: { paymentMethod?: PaymentMethod; cancelReason?: string },
  ) => Promise<Order>;
  onLaunchEMenu: (source: EMenuSource, table?: string) => void;
}

export function WaiterPosPanel({
  dishes,
  orders,
  waiters,
  settings,
  activeWaiter,
  isAdminMode = false,
  onSelectWaiterForCabinet,
  onSwitchPinLock,
  onCreatePosOrder,
  onRequestElectronicCheck,
  onUpdateOrderStatus,
  onLaunchEMenu,
}: WaiterPosPanelProps) {
  const effectiveWaiter = activeWaiter ?? waiters.find((w) => w.active);

  const [selectedTable, setSelectedTable] = useState('1');
  const [selectedCategory, setSelectedCategory] = useState<'All' | DishCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [kitchenNote, setKitchenNote] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [receiptOrderId, setReceiptOrderId] = useState<string | null>(null);

  const filteredDishes = filterMenuDishes(dishes, selectedCategory, searchQuery);
  const ticketEstimate = computeTableEstimateTotal(dishes, quantities);

  const tableMap = getTableOwnershipMap(
    orders,
    effectiveWaiter?.id,
    settings.tableCount,
  );
  const selectedTableMeta = tableMap.find((t) => t.tableNumber === selectedTable);

  const waiterPayouts = computeWaiterPayouts(orders, waiters, settings);
  const myPayout = effectiveWaiter
    ? waiterPayouts.find((p) => p.waiterId === effectiveWaiter.id)
    : undefined;

  const activeOrders = orders.filter(
    (o) => o.status === 'Pending' || o.status === 'Preparing' || o.status === 'Ready',
  );

  // Personal orders strictly belonging to this waiter across all their tables
  const myActiveOrders = effectiveWaiter
    ? activeOrders.filter((o) => o.waiterId === effectiveWaiter.id)
    : activeOrders;

  const selectedTableOrders = activeOrders.filter((o) => o.tableNumber === selectedTable);
  const emptyTablesCount = tableMap.filter((t) => t.ownership === 'empty').length;
  const myTablesCount = tableMap.filter((t) => t.ownership === 'mine').length;

  const receiptOrder = receiptOrderId
    ? orders.find((o) => o.id === receiptOrderId) ?? null
    : null;

  const adjustQty = (dishId: string, delta: number) => {
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

  const handleSendToKitchen = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([dishId, quantity]) => ({ dishId, quantity }));
    if (items.length === 0) return;

    setIsSending(true);
    setFeedbackMsg('');
    try {
      const created = await onCreatePosOrder({
        tableNumber: selectedTable,
        source: 'pos',
        guestName: `Stol #${selectedTable}`,
        waiterId: effectiveWaiter?.id,
        waiterName: effectiveWaiter?.name,
        waiterCode: effectiveWaiter?.pinCode,
        note: kitchenNote.trim() || undefined,
        items,
      });
      setQuantities({});
      setKitchenNote('');
      setFeedbackMsg(
        `${created.code} — Stol #${selectedTable} (${effectiveWaiter?.name ?? 'POS'}) buyurtmasi oshxonaga yuborildi!`,
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleRequestCheck = async (orderId: string) => {
    setBusyOrderId(orderId);
    setFeedbackMsg('');
    try {
      const updated = await onRequestElectronicCheck(orderId);
      setReceiptOrderId(updated.id);
      setFeedbackMsg(
        `Stol #${updated.tableNumber} uchun Soliq.uz elektron cheki shakllantirildi va Kassirga yuborildi!`,
      );
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleAdvanceStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setBusyOrderId(orderId);
    try {
      await onUpdateOrderStatus(orderId, nextStatus);
    } finally {
      setBusyOrderId(null);
    }
  };

  return (
    <div data-testid="waiter-pos-panel" className="space-y-6">
      {/* Personal Waiter Cabinet Header Banner */}
      <div className="rounded-xl border border-[#C9A84C]/35 bg-gradient-to-r from-[#17120B] via-[#14100C] to-[#111814] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#C9A84C]/45 bg-[#0A0806] font-mono text-base font-bold text-[#E6CB7D]">
              {effectiveWaiter?.pinCode ?? 'POS'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C9A84C]">
                  Ofitsiant Shaxsiy Kabineti
                </p>
                <span className="rounded border border-[#2D4A3E] bg-[#2D4A3E]/40 px-2 py-0.5 text-[10px] font-semibold text-[#A9CEBE]">
                  Kod: {effectiveWaiter?.pinCode ?? '—'}
                </span>
              </div>
              <h2
                data-testid="waiter-cabinet-name"
                className="font-display mt-0.5 text-2xl font-semibold text-[#F5EDD6] sm:text-3xl"
              >
                {effectiveWaiter ? `${effectiveWaiter.name} — Mening Stollarim` : 'Ofitsiant Kabineti'}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Waiter Personal Earnings Strip */}
            {myPayout && (
              <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[#C9A84C]/25 bg-[#0A0806] px-4 py-2.5">
                <div>
                  <span className="block text-[10px] uppercase text-[#B8AE98]">Mening stollarim</span>
                  <span
                    data-testid="waiter-my-tables-count"
                    className="text-sm font-bold tabular-nums text-[#E6CB7D]"
                  >
                    {myTablesCount} ta band · {emptyTablesCount} bo‘sh
                  </span>
                </div>
                <div className="h-6 w-px bg-[#C9A84C]/20" />
                <div>
                  <span className="block text-[10px] uppercase text-[#B8AE98]">
                    Ulush ({myPayout.commissionPercent}%)
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-bold tabular-nums text-[#A9CEBE]">
                    <Wallet className="h-3.5 w-3.5" />
                    {formatUzsPrice(myPayout.earnedCommissionUzs)}
                  </span>
                </div>
              </div>
            )}

            {/* Admin can switch waiters directly; or staff can return to PIN pad */}
            {isAdminMode && onSelectWaiterForCabinet && (
              <select
                aria-label="Ofitsiant kabinetini almashtirish"
                value={effectiveWaiter?.id ?? ''}
                onChange={(e) => {
                  const found = waiters.find((w) => w.id === e.target.value);
                  if (found) onSelectWaiterForCabinet(found);
                }}
                className="rounded-lg border border-[#C9A84C]/40 bg-[#0A0806] px-3 py-2 text-xs font-semibold text-[#E6CB7D]"
              >
                {waiters
                  .filter((w) => w.active)
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.pinCode})
                    </option>
                  ))}
              </select>
            )}

            {onSwitchPinLock && (
              <button
                type="button"
                data-testid="waiter-switch-pin-btn"
                onClick={onSwitchPinLock}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9A84C]/40 bg-[#0A0806] px-3.5 py-2 text-xs font-semibold text-[#E6CB7D] hover:bg-[#1E1812]"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Kod bilan kirish</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 1–25 Table Floor Map with Ownership Legend */}
      <div className="rounded-xl border border-[#C9A84C]/28 bg-[#14100C] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 font-medium text-[#E6CB7D]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#E6CB7D]" />
              Mening stolim ({myTablesCount})
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-[#A9CEBE]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#2D4A3E]" />
              Bo‘sh / Odam yo‘q ({emptyTablesCount})
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-[#B8AE98]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#8B3A2A]" />
              Boshqa ofitsiantda
            </span>
          </div>

          <button
            type="button"
            onClick={() => onLaunchEMenu('nfc', selectedTable)}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#C9A84C]/40 bg-[#0A0806] px-3 py-1.5 text-xs font-medium text-[#E6CB7D] hover:border-[#C9A84C]"
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Stol #{selectedTable} QR/NFC Menyusi</span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-9 lg:grid-cols-10">
          {tableMap.map((tbl) => {
            const isSelected = selectedTable === tbl.tableNumber;
            const isMine = tbl.ownership === 'mine';
            const isEmpty = tbl.ownership === 'empty';

            return (
              <button
                key={tbl.tableNumber}
                type="button"
                data-testid={`waiter-table-${tbl.tableNumber}`}
                onClick={() => setSelectedTable(tbl.tableNumber)}
                className={`flex flex-col items-start rounded-lg border px-2.5 py-2 text-left transition-all ${
                  isSelected
                    ? 'border-[#E6CB7D] bg-[#C9A84C] text-[#0A0806] shadow-md'
                    : isMine
                      ? 'border-[#E6CB7D]/70 bg-[#1F180D] text-[#F5EDD6] hover:border-[#E6CB7D]'
                      : isEmpty
                        ? 'border-[#2D4A3E]/65 bg-[#0D1310] text-[#A9CEBE] hover:border-[#87A89A]'
                        : 'border-[#8B3A2A]/50 bg-[#17100F] text-[#B8AE98] hover:border-[#C9A84C]/50'
                }`}
              >
                <div className="flex w-full items-center justify-between gap-1">
                  <span className="text-xs font-bold">#{tbl.tableNumber}</span>
                  {tbl.checkRequested ? (
                    <QrCode
                      className={`h-3 w-3 ${isSelected ? 'text-[#0A0806]' : 'text-[#E6CB7D]'}`}
                    />
                  ) : (
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isSelected
                          ? 'bg-[#0A0806]'
                          : isMine
                            ? 'bg-[#E6CB7D]'
                            : isEmpty
                              ? 'bg-[#2D4A3E]'
                              : 'bg-[#8B3A2A]'
                      }`}
                    />
                  )}
                </div>
                <span
                  className={`mt-1 w-full truncate text-[10px] font-medium tabular-nums ${
                    isSelected
                      ? 'text-[#0A0806]/90'
                      : isMine
                        ? 'text-[#E6CB7D]'
                        : isEmpty
                          ? 'text-[#87A89A]'
                          : 'text-[#F0A495]'
                  }`}
                >
                  {isEmpty
                    ? "Odam yo'q"
                    : isMine
                      ? formatUzsPrice(tbl.totalUzs).replace('UZS ', '')
                      : tbl.waiterName || 'Band'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {feedbackMsg && (
        <div
          role="status"
          className="rounded-lg border border-[#2D4A3E] bg-[#121D18] px-4 py-3 text-xs font-medium text-[#A9CEBE]"
        >
          {feedbackMsg}
        </div>
      )}

      {/* Main Split: Left Photo Dish Picker + Right Draft Ticket & My Personal Orders */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Visual Photo Dish Picker */}
        <div className="space-y-4 lg:col-span-7">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {MENU_FILTER_CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    selectedCategory === category
                      ? 'bg-[#C9A84C] text-[#0A0806]'
                      : 'border border-[#C9A84C]/20 bg-[#14100C] text-[#B8AE98] hover:text-[#F5EDD6]'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="relative sm:w-52 shrink-0">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#B8AE98]"
              />
              <input
                type="search"
                aria-label="Ofitsiant taom qidirish"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Taom qidirish..."
                className="w-full rounded-md border border-[#C9A84C]/25 bg-[#14100C] py-2 pl-8 pr-3 text-xs text-[#F5EDD6] placeholder-[#B8AE98]/55 focus:border-[#C9A84C] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredDishes.map((dish) => {
              const qty = quantities[dish.id] ?? 0;
              const imgUrl = resolveDishImageUrl(dish.id, dish.imageUrl);
              return (
                <div
                  key={dish.id}
                  className={`group flex flex-col overflow-hidden rounded-xl border transition-all ${
                    qty > 0
                      ? 'border-[#E6CB7D] bg-[#1A150E]'
                      : 'border-[#C9A84C]/22 bg-[#14100C] hover:border-[#C9A84C]/60'
                  }`}
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0E0B08]">
                    {imgUrl && (
                      <img
                        src={imgUrl}
                        alt={dish.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#14100C]/85 via-transparent to-transparent" />
                    <span className="absolute bottom-2 right-2.5 rounded border border-[#E6CB7D]/50 bg-[#0A0806]/90 px-2 py-0.5 text-[11px] font-bold tabular-nums text-[#E6CB7D]">
                      {formatUzsPrice(dish.priceUzs)}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-3.5">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-[#C9A84C]">
                        {dish.category} {dish.portion ? `· ${dish.portion}` : ''}
                      </p>
                      <h3 className="font-display mt-0.5 text-lg font-semibold leading-snug text-[#F5EDD6]">
                        {dish.name}
                      </h3>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#C9A84C]/15 pt-2.5">
                      {qty > 0 ? (
                        <div className="flex w-full items-center justify-between">
                          <button
                            type="button"
                            onClick={() => adjustQty(dish.id, -1)}
                            aria-label={`Remove ${dish.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded border border-[#C9A84C]/35 bg-[#0A0806] text-[#F5EDD6]"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-sm font-bold tabular-nums text-[#E6CB7D]">
                            {qty} ta
                          </span>
                          <button
                            type="button"
                            onClick={() => adjustQty(dish.id, 1)}
                            aria-label={`Add one more ${dish.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded bg-[#C9A84C] text-[#0A0806]"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          data-testid={`waiter-add-${dish.id}`}
                          onClick={() => adjustQty(dish.id, 1)}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded border border-[#C9A84C]/40 bg-[#0A0806] py-1.5 text-xs font-semibold text-[#E6CB7D] transition-colors hover:bg-[#C9A84C] hover:text-[#0A0806]"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Stol #{selectedTable} ga qo‘shish</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Draft Ticket + My Personal Orders & Table Check */}
        <div className="space-y-5 lg:col-span-5">
          <form
            onSubmit={handleSendToKitchen}
            className="rounded-xl border border-[#C9A84C]/35 bg-[#14100C] p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#C9A84C]/18 pb-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-[#C9A84C]">
                  Yangi Buyurtma · {effectiveWaiter?.name ?? 'Ofitsiant'}
                </p>
                <h3 className="font-display text-2xl font-semibold text-[#F5EDD6]">
                  Stol #{selectedTable}{' '}
                  <span className="text-sm font-normal text-[#B8AE98]">
                    ({selectedTableMeta?.ownership === 'empty'
                      ? 'Bo‘sh stol'
                      : selectedTableMeta?.ownership === 'mine'
                        ? 'Mening stolim'
                        : `${selectedTableMeta?.waiterName || 'Band'}`})
                  </span>
                </h3>
              </div>
              {ticketEstimate.itemCount > 0 && (
                <button
                  type="button"
                  onClick={() => setQuantities({})}
                  className="text-xs text-[#B8AE98] hover:text-[#F0A495]"
                >
                  Tozalash
                </button>
              )}
            </div>

            {ticketEstimate.itemCount === 0 ? (
              <p className="rounded-lg border border-dashed border-[#C9A84C]/22 bg-[#0A0806] p-4 text-center text-xs text-[#B8AE98]">
                Chapdan taom ustiga bosing — Stol #{selectedTable} buyurtmasi shu yerda yig‘iladi.
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {dishes
                  .filter((d) => (quantities[d.id] ?? 0) > 0)
                  .map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-[#C9A84C]/15 bg-[#0A0806] px-3 py-2 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[#F5EDD6]">{d.name}</p>
                        <p className="text-[11px] tabular-nums text-[#B8AE98]">
                          {quantities[d.id]} × {formatUzsPrice(d.priceUzs)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => adjustQty(d.id, -1)}
                          aria-label={`Decrease ${d.name}`}
                          className="flex h-6 w-6 items-center justify-center rounded border border-[#C9A84C]/30 text-[#F5EDD6]"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustQty(d.id, 1)}
                          aria-label={`Increase ${d.name}`}
                          className="flex h-6 w-6 items-center justify-center rounded border border-[#C9A84C]/30 text-[#E6CB7D]"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            <div>
              <label htmlFor="waiter-kitchen-note" className="block text-xs font-medium text-[#E5DEC9]">
                Oshpazga izoh (ixtiyoriy)
              </label>
              <input
                id="waiter-kitchen-note"
                type="text"
                value={kitchenNote}
                onChange={(e) => setKitchenNote(e.target.value)}
                placeholder="Masalan: piyozsiz, choyni tezroq..."
                className="mt-1 w-full rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3 py-2 text-xs text-[#F5EDD6] placeholder-[#B8AE98]/50 focus:border-[#C9A84C] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between border-t border-[#C9A84C]/18 pt-3 text-xs">
              <span className="text-[#B8AE98]">
                Taomlar summasi (+{settings.serviceChargePercent}% xizmat):
              </span>
              <span className="text-lg font-bold tabular-nums text-[#E6CB7D]">
                {formatUzsPrice(
                  ticketEstimate.totalUzs +
                    Math.round((ticketEstimate.totalUzs * settings.serviceChargePercent) / 100),
                )}
              </span>
            </div>

            <button
              type="submit"
              data-testid="waiter-send-kitchen-btn"
              disabled={isSending || ticketEstimate.itemCount === 0}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#E6CB7D] to-[#C89635] px-4 py-2.5 text-xs font-bold text-[#0A0806] shadow-md transition-opacity hover:opacity-95 disabled:opacity-45"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSending ? 'Yuborilmoqda...' : 'Oshxonaga yuborish'}</span>
            </button>
          </form>

          {/* My Personal Orders (Strict Waiter Cabinet Isolation) */}
          <div className="rounded-xl border border-[#C9A84C]/25 bg-[#14100C] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-[#F5EDD6]">
                <UserCheck className="mr-1.5 inline h-4 w-4 text-[#C9A84C]" />
                {effectiveWaiter?.name} — Faol Buyurtmalari ({myActiveOrders.length})
              </h3>
            </div>

            {myActiveOrders.length === 0 && selectedTableOrders.length === 0 ? (
              <p className="text-xs text-[#B8AE98]">
                Sizda hozircha faol stol buyurtmalari yo‘q. Yuqoridan bo‘sh stol tanlab buyurtma oling.
              </p>
            ) : (
              <div className="space-y-3">
                {myActiveOrders.map((order) => (
                  <div
                    key={order.id}
                    data-testid={`waiter-order-card-${order.id}`}
                    className={`rounded-lg border p-3.5 space-y-2.5 ${
                      order.checkRequested
                        ? 'border-[#2D4A3E] bg-[#101915]'
                        : 'border-[#C9A84C]/25 bg-[#0A0806]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[#C9A84C] px-2 py-0.5 text-xs font-bold text-[#0A0806]">
                          Stol #{order.tableNumber}
                        </span>
                        <span className="font-mono text-xs font-bold text-[#E6CB7D]">
                          {order.code}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#A9CEBE]">
                        <Clock className="h-3 w-3" />
                        {order.checkRequested ? 'Soliq.uz Chek yuborildi' : order.status}
                      </span>
                    </div>

                    <ul className="space-y-1 text-xs text-[#E5DEC9]">
                      {order.items.map((item) => (
                        <li key={`${order.id}-${item.dishId}`} className="flex justify-between gap-2">
                          <span>
                            {item.quantity}× {item.name}
                          </span>
                          <span className="tabular-nums text-[#B8AE98]">
                            {formatUzsPrice(item.priceUzs * item.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex items-center justify-between border-t border-[#C9A84C]/12 pt-2 text-xs">
                      <span className="text-[#B8AE98]">Jami (xizmat bilan):</span>
                      <span className="font-bold tabular-nums text-[#E6CB7D]">
                        {formatUzsPrice(order.totalUzs)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        data-testid={`waiter-request-check-${order.id}`}
                        disabled={busyOrderId === order.id}
                        onClick={() => handleRequestCheck(order.id)}
                        className="inline-flex items-center gap-1 rounded border border-[#C9A84C] bg-[#C9A84C]/20 px-2.5 py-1.5 text-[11px] font-bold text-[#E6CB7D] hover:bg-[#C9A84C] hover:text-[#0A0806]"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        <span>
                          {order.fiscalReceipt ? 'Soliq.uz Chekni ko‘rish' : 'Hisob / Elektron Chek'}
                        </span>
                      </button>

                      {order.status === 'Pending' && (
                        <button
                          type="button"
                          disabled={busyOrderId === order.id}
                          onClick={() => handleAdvanceStatus(order.id, 'Preparing')}
                          className="inline-flex items-center gap-1 rounded border border-[#C9A84C]/40 bg-[#14100C] px-2.5 py-1.5 text-[11px] font-medium text-[#E6CB7D]"
                        >
                          <ChefHat className="h-3 w-3" />
                          <span>Tayyorlash</span>
                        </button>
                      )}
                      {(order.status === 'Pending' || order.status === 'Preparing') && (
                        <button
                          type="button"
                          disabled={busyOrderId === order.id}
                          onClick={() => handleAdvanceStatus(order.id, 'Ready')}
                          className="inline-flex items-center gap-1 rounded border border-[#2D4A3E] bg-[#2D4A3E]/40 px-2.5 py-1.5 text-[11px] font-semibold text-[#A9CEBE]"
                        >
                          <Utensils className="h-3 w-3" />
                          <span>Tayyor</span>
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busyOrderId === order.id}
                        onClick={() => handleAdvanceStatus(order.id, 'Cancelled')}
                        className="inline-flex items-center gap-1 rounded border border-[#8B3A2A]/60 px-2 py-1.5 text-[11px] font-medium text-[#F0A495]"
                      >
                        <XCircle className="h-3 w-3" />
                        <span>Atmen</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <FiscalReceiptModal order={receiptOrder} onClose={() => setReceiptOrderId(null)} />
    </div>
  );
}
