import type {
  AppLaunchParams,
  AppLanguage,
  AppMode,
  ArchivedReceipt,
  DietaryTag,
  Dish,
  DishCategory,
  EMenuLaunchParams,
  EMenuSource,
  FiscalReceipt,
  LedgerEntry,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  Reservation,
  ReservationStatus,
  RestaurantSettings,
  Review,
  SortDirection,
  SortField,
  StaffRole,
  WaiterProfile,
} from '../types/restaurant';

export const DIETARY_TAGS: DietaryTag[] = ['Vegan', 'Gluten-Free', 'Spicy'];

export const MENU_FILTER_CATEGORIES: Array<'All' | DishCategory> = [
  'All',
  'Salads',
  'Soups',
  'Mains',
  'Grills',
  'Pastry & Doner',
  'Desserts',
  'Drinks',
];

export function filterMenuDishes(
  dishes: Dish[],
  category: 'All' | DishCategory,
  searchQuery = '',
): Dish[] {
  const query = searchQuery.trim().toLowerCase();
  return dishes.filter((dish) => {
    const matchesCategory = category === 'All' || dish.category === category;
    if (!matchesCategory) return false;
    if (!query) return true;
    return (
      dish.name.toLowerCase().includes(query) ||
      dish.description.toLowerCase().includes(query) ||
      dish.category.toLowerCase().includes(query) ||
      dish.dietaryTags.some((tag) => tag.toLowerCase().includes(query))
    );
  });
}

export function toggleDietaryTag(current: DietaryTag[], tag: DietaryTag): DietaryTag[] {
  const nextSet = new Set(current);
  if (nextSet.has(tag)) {
    nextSet.delete(tag);
  } else {
    nextSet.add(tag);
  }
  return DIETARY_TAGS.filter((t) => nextSet.has(t));
}

export function normalizeDishDietaryTags(
  dish: Omit<Dish, 'dietaryTags'> & { dietaryTags?: DietaryTag[] },
  fallbackDishes: Dish[] = [],
): Dish {
  if (Array.isArray(dish.dietaryTags)) {
    const valid = DIETARY_TAGS.filter((t) => dish.dietaryTags!.includes(t));
    return { ...dish, dietaryTags: valid };
  }
  const seedMatch = fallbackDishes.find((item) => item.id === dish.id);
  return {
    ...dish,
    dietaryTags: seedMatch ? [...seedMatch.dietaryTags] : [],
  };
}

export function normalizeDishRecord(
  dish: Omit<Dish, 'dietaryTags' | 'category'> & {
    category: DishCategory | 'Pastry';
    dietaryTags?: DietaryTag[];
    imageUrl?: string;
  },
  fallbackDishes: Dish[] = [],
): Dish {
  const mappedCategory: DishCategory =
    dish.category === 'Pastry' ? 'Pastry & Doner' : dish.category;
  const normalizedBase = { ...dish, category: mappedCategory };
  const withTags = normalizeDishDietaryTags(normalizedBase, fallbackDishes);
  if (typeof dish.imageUrl === 'string') {
    const trimmed = dish.imageUrl.trim();
    return { ...withTags, imageUrl: trimmed ? trimmed : undefined };
  }
  const seedMatch = fallbackDishes.find((item) => item.id === dish.id);
  return {
    ...withTags,
    imageUrl: seedMatch?.imageUrl,
  };
}

export function buildEMenuUrl(
  baseOrigin: string,
  options: { source?: EMenuSource; table?: string } = {},
): string {
  const cleanOrigin = baseOrigin.replace(/\/+$/, '');
  const params = new URLSearchParams();
  params.set('emenu', '1');
  if (options.source) {
    params.set('source', options.source);
  }
  const trimmedTable = options.table?.trim();
  if (trimmedTable) {
    params.set('table', trimmedTable);
  }
  return `${cleanOrigin}/?${params.toString()}`;
}

export function buildStaffAppUrl(baseOrigin: string, role: StaffRole = 'admin'): string {
  const cleanOrigin = baseOrigin.replace(/\/+$/, '');
  if (role === 'waiter') return `${cleanOrigin}/?app=waiter`;
  if (role === 'kitchen') return `${cleanOrigin}/?app=kitchen`;
  if (role === 'cashier') return `${cleanOrigin}/?app=cashier`;
  return `${cleanOrigin}/?app=staff`;
}

export function parseEMenuLaunchFromUrl(search: string, hash = ''): EMenuLaunchParams {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const cleanHash = hash.replace(/^#/, '').toLowerCase();
  const emenuParam = params.get('emenu');
  const appParam = params.get('app')?.toLowerCase();
  const nfcParam = params.get('nfc');
  const qrParam = params.get('qr');
  const sourceParam = params.get('source')?.toLowerCase();
  const table = params.get('table')?.trim() || undefined;

  const isOpen =
    appParam === 'order' ||
    emenuParam === '1' ||
    emenuParam === 'true' ||
    nfcParam === '1' ||
    qrParam === '1' ||
    cleanHash === 'emenu' ||
    cleanHash === 'nfc-menu' ||
    cleanHash === 'order' ||
    Boolean(table && (sourceParam === 'nfc' || sourceParam === 'qr'));

  let source: EMenuSource = 'web';
  if (nfcParam === '1' || sourceParam === 'nfc' || cleanHash === 'nfc-menu') {
    source = 'nfc';
  } else if (qrParam === '1' || sourceParam === 'qr') {
    source = 'qr';
  }

  return {
    open: isOpen,
    source,
    table,
  };
}

export function parseAppLaunchFromUrl(search: string, hash = ''): AppLaunchParams {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const cleanHash = hash.replace(/^#/, '').toLowerCase();
  const appParam = params.get('app')?.toLowerCase();

  if (appParam === 'waiter' || appParam === 'ofitsiant' || cleanHash === 'waiter') {
    return { mode: 'staff-os', source: 'pos', staffRole: 'waiter' };
  }
  if (
    appParam === 'kitchen' ||
    appParam === 'oshpaz' ||
    appParam === 'kds' ||
    cleanHash === 'kitchen'
  ) {
    return { mode: 'staff-os', source: 'pos', staffRole: 'kitchen' };
  }
  if (appParam === 'cashier' || appParam === 'kassir' || cleanHash === 'cashier') {
    return { mode: 'staff-os', source: 'pos', staffRole: 'cashier' };
  }
  if (appParam === 'staff' || appParam === 'admin' || cleanHash === 'staff') {
    return { mode: 'staff-os', source: 'pos', staffRole: 'admin' };
  }

  const emenuParsed = parseEMenuLaunchFromUrl(search, hash);
  if (emenuParsed.open) {
    return {
      mode: 'guest-order',
      source: emenuParsed.source,
      table: emenuParsed.table,
    };
  }

  const mode: AppMode = 'lounge';
  return { mode, source: 'web' };
}

export function computeTableEstimateTotal(
  dishes: Dish[],
  quantities: Record<string, number>,
): { itemCount: number; totalUzs: number } {
  let itemCount = 0;
  let totalUzs = 0;
  for (const dish of dishes) {
    const qty = quantities[dish.id] ?? 0;
    if (qty > 0 && Number.isFinite(qty)) {
      const safeQty = Math.floor(qty);
      itemCount += safeQty;
      totalUzs += safeQty * dish.priceUzs;
    }
  }
  return { itemCount, totalUzs };
}

export function computeOrderTotalUzs(items: Array<{ priceUzs: number; quantity: number }>): number {
  return items.reduce((sum, item) => {
    const qty = Number.isFinite(item.quantity) && item.quantity > 0 ? Math.floor(item.quantity) : 0;
    const price = Number.isFinite(item.priceUzs) && item.priceUzs > 0 ? Math.round(item.priceUzs) : 0;
    return sum + qty * price;
  }, 0);
}

export function canGuestCancelOrder(status: OrderStatus): boolean {
  return status === 'Pending' || status === 'Preparing' || status === 'Ready';
}

export function buildOrderItemsFromQuantities(
  dishes: Dish[],
  quantities: Record<string, number>,
): OrderItem[] {
  const result: OrderItem[] = [];
  for (const dish of dishes) {
    const qty = Math.floor(quantities[dish.id] ?? 0);
    if (qty > 0) {
      result.push({
        dishId: dish.id,
        name: dish.name,
        priceUzs: dish.priceUzs,
        quantity: qty,
        portion: dish.portion,
      });
    }
  }
  return result;
}

export function createOrderRecord(
  input: {
    tableNumber: string;
    source: EMenuSource;
    guestName?: string;
    guestPhone?: string;
    waiterId?: string;
    waiterName?: string;
    waiterCode?: string;
    note?: string;
    items: OrderItem[];
    serviceChargePercent?: number;
  },
  sequenceSeed = Math.floor(1000 + Math.random() * 9000),
): Order {
  const nowIso = new Date().toISOString();
  const codeNum = String(sequenceSeed).slice(0, 4).padStart(4, '0');
  const subtotalUzs = computeOrderTotalUzs(input.items);
  const servicePercent = Math.max(0, Math.min(30, input.serviceChargePercent ?? 0));
  const serviceFeeUzs = Math.round((subtotalUzs * servicePercent) / 100);
  const totalUzs = subtotalUzs + serviceFeeUzs;

  return {
    id: `ord-${Date.now()}-${codeNum}`,
    code: `ORD-${codeNum}`,
    tableNumber: input.tableNumber.trim() || 'Takeaway',
    source: input.source,
    guestName: input.guestName?.trim() || undefined,
    guestPhone: input.guestPhone?.trim() || undefined,
    waiterId: input.waiterId?.trim() || undefined,
    waiterName: input.waiterName?.trim() || undefined,
    waiterCode: input.waiterCode?.trim() || undefined,
    note: input.note?.trim() || undefined,
    items: input.items,
    subtotalUzs,
    serviceFeeUzs,
    totalUzs,
    status: 'Pending',
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export interface AccountingSummary {
  totalIncomeUzs: number;
  totalExpenseUzs: number;
  netProfitUzs: number;
  profitMarginPercent: number;
  todayIncomeUzs: number;
  todayExpenseUzs: number;
  todayNetUzs: number;
  cashIncomeUzs: number;
  cardIncomeUzs: number;
  digitalIncomeUzs: number;
  activeOrdersCount: number;
  activeOrdersPipelineUzs: number;
  paidOrdersCount: number;
  cancelledOrdersCount: number;
  cancelledOrdersValueUzs: number;
  topOrderedDishes: Array<{ name: string; quantity: number; revenueUzs: number }>;
}

export function computeAccountingSummary(
  ledger: LedgerEntry[],
  orders: Order[],
  targetDate = new Date().toISOString().slice(0, 10),
): AccountingSummary {
  let totalIncomeUzs = 0;
  let totalExpenseUzs = 0;
  let todayIncomeUzs = 0;
  let todayExpenseUzs = 0;
  let cashIncomeUzs = 0;
  let cardIncomeUzs = 0;
  let digitalIncomeUzs = 0;

  for (const entry of ledger) {
    const amount = Number.isFinite(entry.amountUzs) ? Math.max(0, Math.round(entry.amountUzs)) : 0;
    if (entry.type === 'income') {
      totalIncomeUzs += amount;
      if (entry.date === targetDate) todayIncomeUzs += amount;
      if (entry.paymentMethod === 'Cash') cashIncomeUzs += amount;
      else if (entry.paymentMethod === 'Card') cardIncomeUzs += amount;
      else digitalIncomeUzs += amount;
    } else {
      totalExpenseUzs += amount;
      if (entry.date === targetDate) todayExpenseUzs += amount;
    }
  }

  const netProfitUzs = totalIncomeUzs - totalExpenseUzs;
  const todayNetUzs = todayIncomeUzs - todayExpenseUzs;
  const profitMarginPercent =
    totalIncomeUzs > 0 ? Math.round((netProfitUzs / totalIncomeUzs) * 100) : 0;

  let activeOrdersCount = 0;
  let activeOrdersPipelineUzs = 0;
  let paidOrdersCount = 0;
  let cancelledOrdersCount = 0;
  let cancelledOrdersValueUzs = 0;

  const dishStats = new Map<string, { name: string; quantity: number; revenueUzs: number }>();

  for (const order of orders) {
    if (order.status === 'Pending' || order.status === 'Preparing' || order.status === 'Ready') {
      activeOrdersCount += 1;
      activeOrdersPipelineUzs += order.totalUzs;
    } else if (order.status === 'Paid') {
      paidOrdersCount += 1;
    } else if (order.status === 'Cancelled') {
      cancelledOrdersCount += 1;
      cancelledOrdersValueUzs += order.totalUzs;
    }

    if (order.status !== 'Cancelled') {
      for (const item of order.items) {
        const existing = dishStats.get(item.name);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenueUzs += item.priceUzs * item.quantity;
        } else {
          dishStats.set(item.name, {
            name: item.name,
            quantity: item.quantity,
            revenueUzs: item.priceUzs * item.quantity,
          });
        }
      }
    }
  }

  const topOrderedDishes = Array.from(dishStats.values())
    .sort((a, b) => b.revenueUzs - a.revenueUzs)
    .slice(0, 5);

  return {
    totalIncomeUzs,
    totalExpenseUzs,
    netProfitUzs,
    profitMarginPercent,
    todayIncomeUzs,
    todayExpenseUzs,
    todayNetUzs,
    cashIncomeUzs,
    cardIncomeUzs,
    digitalIncomeUzs,
    activeOrdersCount,
    activeOrdersPipelineUzs,
    paidOrdersCount,
    cancelledOrdersCount,
    cancelledOrdersValueUzs,
    topOrderedDishes,
  };
}

export function buildFinancialVoiceScript(
  summary: AccountingSummary,
  language: AppLanguage = 'uz',
): string {
  const topDish = summary.topOrderedDishes[0]?.name ?? 'Sayqal Salad';
  const incomeStr = summary.totalIncomeUzs.toLocaleString('en-US');
  const expenseStr = summary.totalExpenseUzs.toLocaleString('en-US');
  const netStr = summary.netProfitUzs.toLocaleString('en-US');

  if (language === 'ru') {
    return (
      `Здравствуйте! Финансовый отчёт ресторана Sayqal. ` +
      `Общий приход сегодня составил ${incomeStr} сум. ` +
      `Расходы составили ${expenseStr} сум, а чистая прибыль — ${netStr} сум. ` +
      `Оплаченных заказов: ${summary.paidOrdersCount}, в работе сейчас ${summary.activeOrdersCount}, ` +
      `отменено: ${summary.cancelledOrdersCount}. Самое популярное блюдо дня — ${topDish}.`
    );
  }

  if (language === 'en') {
    return (
      `Hello! Here is today's Sayqal financial briefing. ` +
      `Total revenue stands at ${incomeStr} UZS, total expenses are ${expenseStr} UZS, ` +
      `leaving a net profit of ${netStr} UZS with a ${summary.profitMarginPercent} percent margin. ` +
      `Paid orders: ${summary.paidOrdersCount}, active orders in kitchen: ${summary.activeOrdersCount}, ` +
      `cancelled: ${summary.cancelledOrdersCount}. Top dish right now is ${topDish}.`
    );
  }

  return (
    `Assalomu alaykum! Sayqal restorani bo‘yicha moliyaviy hisobot. ` +
    `Bugungi jami tushum ${incomeStr} so‘mni tashkil etdi. ` +
    `Jami chiqimlar ${expenseStr} so‘m, sof foyda esa ${netStr} so‘m (${summary.profitMarginPercent} foiz marja). ` +
    `To‘langan buyurtmalar soni ${summary.paidOrdersCount} ta, hozir oshxonada ${summary.activeOrdersCount} ta faol buyurtma bor, ` +
    `bekor qilingan buyurtmalar ${summary.cancelledOrdersCount} ta. Eng ko‘p sotilayotgan taom — ${topDish}.`
  );
}

export function exportLedgerCsv(ledger: LedgerEntry[]): string {
  const headers = ['Date', 'Type', 'Category', 'Title', 'Amount (UZS)', 'Payment', 'By', 'Note'];
  const escape = (val: string | number | undefined) =>
    `"${String(val ?? '').replace(/"/g, '""')}"`;
  const rows = ledger.map((entry) =>
    [
      escape(entry.date),
      escape(entry.type === 'income' ? 'Kirim' : 'Chiqim'),
      escape(entry.category),
      escape(entry.title),
      escape(entry.amountUzs),
      escape(entry.paymentMethod),
      escape(entry.createdBy),
      escape(entry.note),
    ].join(','),
  );
  return [headers.join(','), ...rows].join('\n');
}

export function formatPaymentMethodLabel(method: PaymentMethod): string {
  if (method === 'Cash') return 'Naqd';
  if (method === 'Card') return 'Karta';
  return 'Payme / Click';
}

export function formatUzsPrice(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
  return `UZS ${safe.toLocaleString('en-US')}`;
}

export function getPopularDish(dishes: Dish[]): Dish | null {
  if (dishes.length === 0) return null;
  return dishes.reduce((best, item) =>
    item.ordersToday > best.ordersToday ? item : best,
  );
}

export interface ReservationInput {
  guestName: string;
  contact: string;
  date: string;
  time: string;
  partySize: number;
  requests: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof ReservationInput, string>>;
}

export function validateReservationInput(input: ReservationInput): ValidationResult {
  const errors: Partial<Record<keyof ReservationInput, string>> = {};
  if (!input.guestName.trim() || input.guestName.trim().length < 2) {
    errors.guestName = 'Please enter the guest name (at least 2 characters).';
  }
  if (!input.contact.trim() || input.contact.trim().length < 5) {
    errors.contact = 'Please provide a phone number or email address.';
  }
  if (!input.date.trim()) {
    errors.date = 'Please select a dining date.';
  }
  if (!input.time.trim()) {
    errors.time = 'Please choose a reservation time.';
  }
  if (!Number.isFinite(input.partySize) || input.partySize < 1 || input.partySize > 20) {
    errors.partySize = 'Party size must be between 1 and 20 guests.';
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function createReservationRecord(
  input: ReservationInput,
  sequenceSeed = Math.floor(1000 + Math.random() * 9000),
): Reservation {
  const nowIso = new Date().toISOString();
  const codeNum = String(sequenceSeed).slice(0, 4).padStart(4, '0');
  return {
    id: `res-${Date.now()}-${codeNum}`,
    code: `SYQ-${codeNum}`,
    guestName: input.guestName.trim(),
    contact: input.contact.trim(),
    date: input.date.trim(),
    time: input.time.trim(),
    partySize: Math.round(input.partySize),
    requests: input.requests.trim(),
    status: 'Pending',
    createdAt: nowIso,
  };
}

export function sortReservations(
  reservations: Reservation[],
  field: SortField,
  direction: SortDirection,
): Reservation[] {
  const factor = direction === 'asc' ? 1 : -1;
  return [...reservations].sort((a, b) => {
    if (field === 'partySize') {
      return (a.partySize - b.partySize) * factor;
    }
    if (field === 'date') {
      const cmp = `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`);
      return cmp * factor;
    }
    const valA = a[field].toLowerCase();
    const valB = b[field].toLowerCase();
    return valA.localeCompare(valB) * factor;
  });
}

export function getVisibleReviews(reviews: Review[]): Review[] {
  return [...reviews]
    .filter((r) => !r.hidden)
    .sort((a, b) => Number(b.featured) - Number(a.featured));
}

export function computeDashboardStats(
  reservations: Reservation[],
  dishes: Dish[],
  baseReviewCount: number,
  baseAvgRating: number,
  targetDate = '2026-11-14',
) {
  const todaysReservations = reservations.filter(
    (r) => r.date === targetDate && r.status !== 'Cancelled',
  ).length;
  const activeReservations = reservations.filter((r) => r.status !== 'Cancelled').length;
  const popular = getPopularDish(dishes);
  return {
    todaysReservations,
    activeReservations,
    totalReviews: baseReviewCount,
    avgRating: baseAvgRating,
    popularDishName: popular ? popular.name : 'Pistachio Cheesecake',
    popularDishOrders: popular ? popular.ordersToday : 0,
  };
}

export function computeRatingPercentages(
  distribution: Array<{ stars: number; count: number }>,
): Array<{ stars: number; count: number; percent: number }> {
  const total = distribution.reduce((sum, item) => sum + item.count, 0);
  return distribution.map((item) => ({
    ...item,
    percent: total > 0 ? Math.round((item.count / total) * 100) : 0,
  }));
}

export function verifyAdminPassword(candidate: string): boolean {
  return candidate.trim() === 'sayqal2024';
}

export interface StaffAuthResult {
  ok: boolean;
  role?: StaffRole;
  waiter?: WaiterProfile;
}

export function authenticateStaffByCode(
  passcode: string,
  waiters: WaiterProfile[],
  preferredRole?: StaffRole,
): StaffAuthResult {
  const code = passcode.trim();
  if (!code) return { ok: false };

  // Personal 4-digit Waiter PINs (e.g. Doston 2100, Sarvinoz 0800, up to 25+ waiters)
  const matchedWaiter = waiters.find(
    (w) => w.active && w.pinCode.trim() === code,
  );
  if (matchedWaiter) {
    return {
      ok: true,
      role: 'waiter',
      waiter: matchedWaiter,
    };
  }

  // Dedicated Kitchen / Chef Display passcode
  if (code === '0500' || code.toLowerCase() === 'oshpaz2024') {
    return { ok: true, role: 'kitchen' };
  }

  // Dedicated Cashier passcode
  if (code === '0900' || code.toLowerCase() === 'kassa2024') {
    return { ok: true, role: 'cashier' };
  }

  // Master Manager / Admin passcode unlocks any chosen role (or admin by default)
  if (verifyAdminPassword(code)) {
    const resolvedRole = preferredRole ?? 'admin';
    return {
      ok: true,
      role: resolvedRole,
      waiter: resolvedRole === 'waiter' ? waiters.find((w) => w.active) : undefined,
    };
  }

  return { ok: false };
}

export function resolveEffectiveWaiterPercent(
  order: Pick<Order, 'waiterId' | 'waiterCommissionPercent'>,
  waiters: WaiterProfile[],
  defaultWaiterCommissionPercent: number,
  useLiveSettings = false,
): number {
  if (!useLiveSettings && typeof order.waiterCommissionPercent === 'number') {
    return Math.max(0, Math.min(50, order.waiterCommissionPercent));
  }
  const waiter = order.waiterId ? waiters.find((w) => w.id === order.waiterId) : undefined;
  if (waiter && typeof waiter.commissionPercent === 'number') {
    return Math.max(0, Math.min(50, waiter.commissionPercent));
  }
  return Math.max(0, Math.min(50, defaultWaiterCommissionPercent));
}

export function buildFiscalReceipt(
  order: Order,
  settings: RestaurantSettings,
  waiters: WaiterProfile[],
  issuedAt = new Date().toISOString(),
): FiscalReceipt {
  const subtotalUzs = order.subtotalUzs ?? computeOrderTotalUzs(order.items);
  const servicePercent = Math.max(0, Math.min(30, settings.serviceChargePercent));
  const serviceFeeUzs =
    typeof order.serviceFeeUzs === 'number'
      ? order.serviceFeeUzs
      : Math.round((subtotalUzs * servicePercent) / 100);
  const totalUzs = subtotalUzs + serviceFeeUzs;

  const waiterSharePercent = resolveEffectiveWaiterPercent(
    order,
    waiters,
    settings.defaultWaiterCommissionPercent,
    true,
  );
  const waiterShareUzs = Math.round((subtotalUzs * waiterSharePercent) / 100);

  const numericSeed =
    order.code.replace(/\D/g, '') + String(subtotalUzs).slice(-4).padStart(4, '0');
  const receiptNumber = `CHK-${numericSeed.slice(0, 8)}`;
  const fiscalSign = `FM${settings.inn.slice(-4)}${numericSeed.slice(-6).padStart(6, '0')}`;

  const soliqParams = new URLSearchParams({
    t: settings.virtualTerminalId,
    r: receiptNumber,
    c: issuedAt.replace(/[-:TZ.]/g, '').slice(0, 14),
    s: String(totalUzs),
    inn: settings.inn,
  });

  return {
    receiptNumber,
    fiscalSign,
    inn: settings.inn,
    terminalId: settings.virtualTerminalId,
    companyName: settings.companyName,
    soliqUrl: `https://ofd.soliq.uz/epi?${soliqParams.toString()}`,
    issuedAt,
    subtotalUzs,
    serviceChargePercent: servicePercent,
    serviceFeeUzs,
    waiterSharePercent,
    waiterShareUzs,
    totalUzs,
  };
}

export interface TableOwnershipStatus {
  tableNumber: string;
  ownership: 'mine' | 'other' | 'empty';
  activeOrdersCount: number;
  totalUzs: number;
  waiterId?: string;
  waiterName?: string;
  waiterCode?: string;
  checkRequested: boolean;
  readyCount: number;
}

export function getTableOwnershipMap(
  orders: Order[],
  currentWaiterId?: string,
  tableCount = 25,
): TableOwnershipStatus[] {
  const safeCount = Math.max(1, Math.min(40, Math.floor(tableCount)));
  const activeOrders = orders.filter(
    (o) => o.status === 'Pending' || o.status === 'Preparing' || o.status === 'Ready',
  );

  const result: TableOwnershipStatus[] = [];
  for (let i = 1; i <= safeCount; i++) {
    const tableNum = String(i);
    const tableOrders = activeOrders.filter((o) => o.tableNumber === tableNum);

    if (tableOrders.length === 0) {
      result.push({
        tableNumber: tableNum,
        ownership: 'empty',
        activeOrdersCount: 0,
        totalUzs: 0,
        checkRequested: false,
        readyCount: 0,
      });
      continue;
    }

    const totalUzs = tableOrders.reduce((s, o) => s + o.totalUzs, 0);
    const checkRequested = tableOrders.some((o) => Boolean(o.checkRequested));
    const readyCount = tableOrders.filter((o) => o.status === 'Ready').length;
    const assignedOrder = tableOrders.find((o) => Boolean(o.waiterId)) ?? tableOrders[0];
    const hasMyOrder = currentWaiterId
      ? tableOrders.some((o) => o.waiterId === currentWaiterId)
      : false;

    const ownership: TableOwnershipStatus['ownership'] =
      currentWaiterId && hasMyOrder ? 'mine' : 'other';

    result.push({
      tableNumber: tableNum,
      ownership,
      activeOrdersCount: tableOrders.length,
      totalUzs,
      waiterId: assignedOrder?.waiterId,
      waiterName:
        assignedOrder?.waiterName ||
        (assignedOrder?.source === 'nfc' || assignedOrder?.source === 'qr'
          ? 'NFC / QR Mijoz'
          : undefined),
      waiterCode: assignedOrder?.waiterCode,
      checkRequested,
      readyCount,
    });
  }

  return result;
}

export interface WaiterPayoutSummary {
  waiterId: string;
  waiterName: string;
  pinCode: string;
  active: boolean;
  commissionPercent: number;
  paidOrdersCount: number;
  activeOrdersCount: number;
  activeTables: string[];
  paidSubtotalUzs: number;
  paidTotalUzs: number;
  earnedCommissionUzs: number;
  projectedOpenCommissionUzs: number;
  restaurantNetUzs: number;
}

export function computeWaiterPayouts(
  orders: Order[],
  waiters: WaiterProfile[],
  settings: RestaurantSettings,
): WaiterPayoutSummary[] {
  return waiters.map((waiter) => {
    const waiterPercent =
      typeof waiter.commissionPercent === 'number'
        ? Math.max(0, Math.min(50, waiter.commissionPercent))
        : Math.max(0, Math.min(50, settings.defaultWaiterCommissionPercent));

    const myPaidOrders = orders.filter(
      (o) => o.waiterId === waiter.id && o.status === 'Paid',
    );
    const myActiveOrders = orders.filter(
      (o) =>
        o.waiterId === waiter.id &&
        (o.status === 'Pending' || o.status === 'Preparing' || o.status === 'Ready'),
    );

    const paidSubtotalUzs = myPaidOrders.reduce(
      (sum, o) => sum + (o.subtotalUzs ?? computeOrderTotalUzs(o.items)),
      0,
    );
    const paidTotalUzs = myPaidOrders.reduce((sum, o) => sum + o.totalUzs, 0);
    const earnedCommissionUzs = Math.round((paidSubtotalUzs * waiterPercent) / 100);

    const openSubtotalUzs = myActiveOrders.reduce(
      (sum, o) => sum + (o.subtotalUzs ?? computeOrderTotalUzs(o.items)),
      0,
    );
    const projectedOpenCommissionUzs = Math.round((openSubtotalUzs * waiterPercent) / 100);
    const activeTables = Array.from(new Set(myActiveOrders.map((o) => o.tableNumber)));

    return {
      waiterId: waiter.id,
      waiterName: waiter.name,
      pinCode: waiter.pinCode,
      active: waiter.active,
      commissionPercent: waiterPercent,
      paidOrdersCount: myPaidOrders.length,
      activeOrdersCount: myActiveOrders.length,
      activeTables,
      paidSubtotalUzs,
      paidTotalUzs,
      earnedCommissionUzs,
      projectedOpenCommissionUzs,
      restaurantNetUzs: Math.max(0, paidTotalUzs - earnedCommissionUzs),
    };
  });
}

export function normalizeSettings(
  raw: Partial<RestaurantSettings> | undefined,
  fallback: RestaurantSettings,
): RestaurantSettings {
  if (!raw) return fallback;
  return {
    defaultWaiterCommissionPercent:
      typeof raw.defaultWaiterCommissionPercent === 'number' &&
      Number.isFinite(raw.defaultWaiterCommissionPercent)
        ? Math.max(0, Math.min(50, raw.defaultWaiterCommissionPercent))
        : fallback.defaultWaiterCommissionPercent,
    serviceChargePercent:
      typeof raw.serviceChargePercent === 'number' && Number.isFinite(raw.serviceChargePercent)
        ? Math.max(0, Math.min(30, raw.serviceChargePercent))
        : fallback.serviceChargePercent,
    tableCount:
      typeof raw.tableCount === 'number' && Number.isFinite(raw.tableCount)
        ? Math.max(10, Math.min(40, Math.floor(raw.tableCount)))
        : fallback.tableCount,
    companyName:
      typeof raw.companyName === 'string' && raw.companyName.trim()
        ? raw.companyName.trim()
        : fallback.companyName,
    inn: typeof raw.inn === 'string' && raw.inn.trim() ? raw.inn.trim() : fallback.inn,
    virtualTerminalId:
      typeof raw.virtualTerminalId === 'string' && raw.virtualTerminalId.trim()
        ? raw.virtualTerminalId.trim()
        : fallback.virtualTerminalId,
  };
}

export function normalizeOrderRecord(raw: Order): Order {
  const subtotalUzs =
    typeof raw.subtotalUzs === 'number' ? raw.subtotalUzs : computeOrderTotalUzs(raw.items);
  const serviceFeeUzs = typeof raw.serviceFeeUzs === 'number' ? raw.serviceFeeUzs : 0;
  const totalUzs =
    typeof raw.totalUzs === 'number' && raw.totalUzs > 0
      ? raw.totalUzs
      : subtotalUzs + serviceFeeUzs;

  return {
    ...raw,
    subtotalUzs,
    serviceFeeUzs,
    totalUzs,
  };
}

export function nextStatusCycle(status: ReservationStatus): ReservationStatus {
  if (status === 'Pending') return 'Confirmed';
  if (status === 'Confirmed') return 'Cancelled';
  return 'Pending';
}

export function archivePaidOrders(
  orders: Order[],
  existingArchive: ArchivedReceipt[] = [],
  shiftDate = new Date().toISOString().slice(0, 10),
  closedAt = new Date().toISOString(),
): {
  remainingOrders: Order[];
  newArchive: ArchivedReceipt[];
  archivedReceipts: ArchivedReceipt[];
} {
  const paidOrCancelled = orders.filter((o) => o.status === 'Paid' || o.status === 'Cancelled');
  const remainingOrders = orders.filter((o) => o.status !== 'Paid' && o.status !== 'Cancelled');

  const newlyArchived: ArchivedReceipt[] = paidOrCancelled.map((order) => {
    const subtotal = order.subtotalUzs ?? computeOrderTotalUzs(order.items);
    const serviceFee = order.serviceFeeUzs ?? 0;
    return {
      id: `arch-${order.id}`,
      orderId: order.id,
      code: order.code,
      tableNumber: order.tableNumber,
      waiterId: order.waiterId,
      waiterName: order.waiterName,
      waiterCode: order.waiterCode,
      guestName: order.guestName,
      items: order.items,
      subtotalUzs: subtotal,
      serviceFeeUzs: serviceFee,
      totalUzs: order.totalUzs,
      waiterCommissionPercent: order.waiterCommissionPercent,
      waiterCommissionUzs: order.waiterCommissionUzs,
      paymentMethod: order.paymentMethod || 'Cash',
      fiscalReceipt: order.fiscalReceipt,
      closedAt,
      shiftDate,
    };
  });

  const existingMap = new Map<string, ArchivedReceipt>();
  for (const item of existingArchive) {
    existingMap.set(item.orderId, item);
  }
  for (const item of newlyArchived) {
    existingMap.set(item.orderId, item);
  }

  const mergedArchive = Array.from(existingMap.values()).sort(
    (a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime(),
  );

  return {
    remainingOrders,
    newArchive: mergedArchive,
    archivedReceipts: newlyArchived,
  };
}

export function purgeExpiredArchivedReceipts(
  archive: ArchivedReceipt[],
  maxDays = 30,
  nowMs = Date.now(),
): ArchivedReceipt[] {
  const maxAgeMs = maxDays * 24 * 60 * 60 * 1000;
  return archive.filter((item) => {
    const itemTime = new Date(item.closedAt).getTime();
    if (Number.isNaN(itemTime)) return true;
    return nowMs - itemTime <= maxAgeMs;
  });
}

export interface DayEndShiftSummary {
  date: string;
  totalPaidChecks: number;
  totalSalesUzs: number;
  cashSalesUzs: number;
  cardSalesUzs: number;
  digitalSalesUzs: number;
  totalExpensesUzs: number;
  supplyExpensesUzs: number;
  payrollExpensesUzs: number;
  otherExpensesUzs: number;
  waiterPayouts: Array<{
    waiterId: string;
    waiterName: string;
    pinCode: string;
    tablesServedCount: number;
    salesUzs: number;
    commissionPercent: number;
    payableCommissionUzs: number;
  }>;
  totalWaiterPayableUzs: number;
  netRestaurantProfitUzs: number;
}

export function computeDayEndShiftSummary(
  orders: Order[],
  ledger: LedgerEntry[],
  waiters: WaiterProfile[],
  settings: RestaurantSettings,
  targetDate = new Date().toISOString().slice(0, 10),
): DayEndShiftSummary {
  const paidOrders = orders.filter((o) => o.status === 'Paid');

  let cashSales = 0;
  let cardSales = 0;
  let digitalSales = 0;
  let totalSales = 0;

  for (const o of paidOrders) {
    totalSales += o.totalUzs;
    if (o.paymentMethod === 'Card') {
      cardSales += o.totalUzs;
    } else if (o.paymentMethod === 'PaymeClick') {
      digitalSales += o.totalUzs;
    } else {
      cashSales += o.totalUzs;
    }
  }

  const expenses = ledger.filter((l) => l.type === 'expense');
  let supplyExpenses = 0;
  let payrollExpenses = 0;
  let otherExpenses = 0;
  let totalExpenses = 0;

  for (const e of expenses) {
    totalExpenses += e.amountUzs;
    if (e.category === 'Ingredients / Bazaar') {
      supplyExpenses += e.amountUzs;
    } else if (e.category === 'Staff Payroll') {
      payrollExpenses += e.amountUzs;
    } else {
      otherExpenses += e.amountUzs;
    }
  }

  const payouts = computeWaiterPayouts(orders, waiters, settings);
  const waiterPayoutsList = payouts.map((p) => ({
    waiterId: p.waiterId,
    waiterName: p.waiterName,
    pinCode: p.pinCode,
    tablesServedCount: p.paidOrdersCount,
    salesUzs: p.paidSubtotalUzs,
    commissionPercent: p.commissionPercent,
    payableCommissionUzs: p.earnedCommissionUzs,
  }));

  const totalWaiterPayable = waiterPayoutsList.reduce((sum, w) => sum + w.payableCommissionUzs, 0);
  const netRestaurantProfit = Math.max(0, totalSales - totalExpenses - totalWaiterPayable);

  return {
    date: targetDate,
    totalPaidChecks: paidOrders.length,
    totalSalesUzs: totalSales,
    cashSalesUzs: cashSales,
    cardSalesUzs: cardSales,
    digitalSalesUzs: digitalSales,
    totalExpensesUzs: totalExpenses,
    supplyExpensesUzs: supplyExpenses,
    payrollExpensesUzs: payrollExpenses,
    otherExpensesUzs: otherExpenses,
    waiterPayouts: waiterPayoutsList,
    totalWaiterPayableUzs: totalWaiterPayable,
    netRestaurantProfitUzs: netRestaurantProfit,
  };
}

