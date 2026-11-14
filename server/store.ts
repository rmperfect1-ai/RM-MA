import fs from 'node:fs';
import path from 'node:path';
import type { Response } from 'express';
import {
  INITIAL_ACTIVITY,
  INITIAL_DISHES,
  INITIAL_LEDGER,
  INITIAL_ORDERS,
  INITIAL_RESERVATIONS,
  INITIAL_REVIEWS,
  INITIAL_SETTINGS,
  INITIAL_WAITERS,
} from '../src/data/seedData';
import type {
  ActivityEntry,
  ArchivedReceipt,
  DietaryTag,
  Dish,
  LedgerEntry,
  Order,
  OrderStatus,
  PaymentMethod,
  Reservation,
  ReservationStatus,
  RestaurantServerState,
  RestaurantSettings,
  StaffRole,
  WaiterProfile,
} from '../src/types/restaurant';
import {
  archivePaidOrders,
  authenticateStaffByCode,
  buildFiscalReceipt,
  computeOrderTotalUzs,
  createOrderRecord,
  formatUzsPrice,
  normalizeDishRecord,
  normalizeOrderRecord,
  normalizeSettings,
  purgeExpiredArchivedReceipts,
  resolveEffectiveWaiterPercent,
  toggleDietaryTag,
} from '../src/utils/restaurantLogic';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'sayqal-db.json');

const sseClients = new Set<Response>();

function formatNowTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function createSeedState(): RestaurantServerState {
  return {
    dishes: INITIAL_DISHES,
    reservations: INITIAL_RESERVATIONS,
    reviews: INITIAL_REVIEWS,
    orders: INITIAL_ORDERS,
    ledger: INITIAL_LEDGER,
    activityLog: INITIAL_ACTIVITY,
    waiters: INITIAL_WAITERS,
    settings: INITIAL_SETTINGS,
    receiptArchive: [],
    version: 1,
  };
}

function loadStateFromDisk(): RestaurantServerState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<RestaurantServerState>;
      const dishes =
        Array.isArray(parsed.dishes) && parsed.dishes.length > 0
          ? parsed.dishes.map((d) => normalizeDishRecord(d, INITIAL_DISHES))
          : INITIAL_DISHES;
      const waiters =
        Array.isArray(parsed.waiters) && parsed.waiters.length > 0
          ? parsed.waiters
          : INITIAL_WAITERS;
      const settings = normalizeSettings(parsed.settings, INITIAL_SETTINGS);
      const orders = Array.isArray(parsed.orders)
        ? parsed.orders.map((o) => normalizeOrderRecord(o))
        : INITIAL_ORDERS;
      const rawArchive = Array.isArray(parsed.receiptArchive) ? parsed.receiptArchive : [];
      const receiptArchive = purgeExpiredArchivedReceipts(rawArchive, 30);

      return {
        dishes,
        reservations: Array.isArray(parsed.reservations)
          ? parsed.reservations
          : INITIAL_RESERVATIONS,
        reviews:
          Array.isArray(parsed.reviews) && parsed.reviews.length > 0
            ? parsed.reviews
            : INITIAL_REVIEWS,
        orders,
        ledger: Array.isArray(parsed.ledger) ? parsed.ledger : INITIAL_LEDGER,
        activityLog: Array.isArray(parsed.activityLog) ? parsed.activityLog : INITIAL_ACTIVITY,
        waiters,
        settings,
        receiptArchive,
        version: typeof parsed.version === 'number' ? parsed.version : 1,
      };
    }
  } catch {
    // Fall back to clean seed state if file is corrupted
  }
  return createSeedState();
}

let state: RestaurantServerState = loadStateFromDisk();

// Non-blocking batched async persistence so 25+ concurrent terminals never stall event loop
let persistTimer: ReturnType<typeof setTimeout> | null = null;
let isWritingDisk = false;
let needsFollowUpWrite = false;

async function writeSnapshotAsync() {
  if (isWritingDisk) {
    needsFollowUpWrite = true;
    return;
  }
  isWritingDisk = true;
  try {
    await fs.promises.mkdir(DATA_DIR, { recursive: true });
    const snapshot = JSON.stringify(state, null, 2);
    const tempFile = `${DB_FILE}.${process.pid}.tmp`;
    await fs.promises.writeFile(tempFile, snapshot, 'utf-8');
    await fs.promises.rename(tempFile, DB_FILE);
  } catch {
    // Non-fatal in read-only edge runtimes; in-memory state stays authoritative
  } finally {
    isWritingDisk = false;
    if (needsFollowUpWrite) {
      needsFollowUpWrite = false;
      void writeSnapshotAsync();
    }
  }
}

function schedulePersistToDisk() {
  if (persistTimer) {
    clearTimeout(persistTimer);
  }
  persistTimer = setTimeout(() => {
    persistTimer = null;
    void writeSnapshotAsync();
  }, 150);
}

export function flushStateToDiskSync() {
  try {
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistTimer = null;
    }
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.flush.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(state, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch {
    // Ignore read-only runtime flush errors
  }
}

function appendActivity(
  action: string,
  detail: string,
  existing: ActivityEntry[],
  actorRole?: StaffRole | 'guest',
  actorName?: string,
): ActivityEntry[] {
  return [
    {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      detail,
      timestamp: formatNowTime(),
      actorRole,
      actorName,
    },
    ...existing.slice(0, 59),
  ];
}

export function getServerState(): RestaurantServerState {
  return state;
}

export function subscribeSseClient(res: Response) {
  sseClients.add(res);
  res.write(`event: state\ndata: ${JSON.stringify(state)}\n\n`);
}

export function unsubscribeSseClient(res: Response) {
  sseClients.delete(res);
}

function broadcastEvent(eventName: string, payload: unknown) {
  const chunk = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    if (client.writableEnded || client.destroyed) {
      sseClients.delete(client);
      continue;
    }
    try {
      client.write(chunk);
    } catch {
      sseClients.delete(client);
    }
  }
}

function commitState(eventName = 'state', extraPayload?: unknown) {
  state = { ...state, version: state.version + 1 };
  schedulePersistToDisk();
  broadcastEvent('state', state);
  if (eventName !== 'state' && extraPayload) {
    broadcastEvent(eventName, extraPayload);
  }
  return state;
}

export function verifyStaffLogin(passcode: string, preferredRole?: StaffRole) {
  return authenticateStaffByCode(passcode, state.waiters, preferredRole);
}

export function addWaiter(input: {
  name: string;
  pinCode: string;
  commissionPercent?: number;
}): WaiterProfile {
  const cleanName = input.name.trim();
  const cleanPin = input.pinCode.trim();
  if (!cleanName || cleanName.length < 2) {
    throw new Error('Ofitsiant ismi kamida 2 ta harf bo‘lishi kerak.');
  }
  if (!/^\d{4}$/.test(cleanPin)) {
    throw new Error('Shaxsiy kod aniq 4 ta raqamdan iborat bo‘lishi kerak (masalan: 2100).');
  }
  if (cleanPin === '0500' || cleanPin === '0900') {
    throw new Error('0500 (Oshpaz) va 0900 (Kassir) tizim kodlari bilan band.');
  }
  if (state.waiters.some((w) => w.pinCode === cleanPin)) {
    throw new Error(`${cleanPin} kodi boshqa ofitsiantga biriktirilgan.`);
  }

  const palette = ['#E6CB7D', '#87A89A', '#F0A495', '#C9A84C', '#A9CEBE', '#E5DEC9'];
  const newWaiter: WaiterProfile = {
    id: `w-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
    name: cleanName,
    pinCode: cleanPin,
    active: true,
    commissionPercent:
      typeof input.commissionPercent === 'number' && Number.isFinite(input.commissionPercent)
        ? Math.max(0, Math.min(50, input.commissionPercent))
        : undefined,
    colorTag: palette[state.waiters.length % palette.length],
  };

  state = {
    ...state,
    waiters: [...state.waiters, newWaiter],
    activityLog: appendActivity(
      'Yangi ofitsiant qo‘shildi',
      `${newWaiter.name} (Shaxsiy kod: ${newWaiter.pinCode})`,
      state.activityLog,
    ),
  };
  commitState();
  return newWaiter;
}

export function updateWaiter(
  id: string,
  patch: Partial<Pick<WaiterProfile, 'name' | 'pinCode' | 'commissionPercent' | 'active'>>,
): WaiterProfile {
  const target = state.waiters.find((w) => w.id === id);
  if (!target) {
    throw new Error('Ofitsiant topilmadi.');
  }

  const nextPin = patch.pinCode !== undefined ? patch.pinCode.trim() : target.pinCode;
  if (!/^\d{4}$/.test(nextPin)) {
    throw new Error('Shaxsiy kod 4 ta raqamdan iborat bo‘lishi kerak.');
  }
  if (nextPin === '0500' || nextPin === '0900') {
    throw new Error('0500 va 0900 tizim kodlari bilan band.');
  }
  if (state.waiters.some((w) => w.id !== id && w.pinCode === nextPin)) {
    throw new Error(`${nextPin} kodi boshqa ofitsiantga biriktirilgan.`);
  }

  const updated: WaiterProfile = {
    ...target,
    name: patch.name !== undefined && patch.name.trim() ? patch.name.trim() : target.name,
    pinCode: nextPin,
    active: patch.active !== undefined ? Boolean(patch.active) : target.active,
    commissionPercent:
      patch.commissionPercent === undefined
        ? target.commissionPercent
        : patch.commissionPercent === null || Number.isNaN(Number(patch.commissionPercent))
          ? undefined
          : Math.max(0, Math.min(50, Number(patch.commissionPercent))),
  };

  state = {
    ...state,
    waiters: state.waiters.map((w) => (w.id === id ? updated : w)),
    activityLog: appendActivity(
      'Ofitsiant ma’lumoti yangilandi',
      `${updated.name} (Kod: ${updated.pinCode})`,
      state.activityLog,
    ),
  };
  commitState();
  return updated;
}

export function deleteWaiter(id: string) {
  const target = state.waiters.find((w) => w.id === id);
  if (!target) return;
  state = {
    ...state,
    waiters: state.waiters.filter((w) => w.id !== id),
    activityLog: appendActivity(
      'Ofitsiant ro‘yxatdan o‘chirildi',
      `${target.name} (${target.pinCode})`,
      state.activityLog,
    ),
  };
  commitState();
}

export function updateRestaurantSettings(
  patch: Partial<RestaurantSettings>,
): RestaurantSettings {
  const nextSettings = normalizeSettings({ ...state.settings, ...patch }, state.settings);

  // Recalculate service fees on currently open (unpaid) orders so Cashier changes reflect smoothly
  const nextOrders = state.orders.map((order) => {
    if (order.status === 'Paid' || order.status === 'Cancelled') return order;
    const subtotalUzs = order.subtotalUzs ?? computeOrderTotalUzs(order.items);
    const serviceFeeUzs = Math.round((subtotalUzs * nextSettings.serviceChargePercent) / 100);
    const totalUzs = subtotalUzs + serviceFeeUzs;
    const fiscalReceipt = order.fiscalReceipt
      ? buildFiscalReceipt(
          { ...order, subtotalUzs, serviceFeeUzs, totalUzs },
          nextSettings,
          state.waiters,
          order.fiscalReceipt.issuedAt,
        )
      : undefined;

    return {
      ...order,
      subtotalUzs,
      serviceFeeUzs,
      totalUzs,
      fiscalReceipt,
    };
  });

  state = {
    ...state,
    settings: nextSettings,
    orders: nextOrders,
    activityLog: appendActivity(
      'Ofitsiant % va Kassa sozlamalari yangilandi',
      `Ofitsiant ulushi: ${nextSettings.defaultWaiterCommissionPercent}% · Xizmat: ${nextSettings.serviceChargePercent}%`,
      state.activityLog,
    ),
  };
  commitState('settings:updated', nextSettings);
  return nextSettings;
}

export function placeOrder(input: {
  tableNumber: string;
  source: Order['source'];
  guestName?: string;
  guestPhone?: string;
  waiterId?: string;
  waiterName?: string;
  waiterCode?: string;
  note?: string;
  items: Array<{ dishId: string; quantity: number }>;
}): Order {
  const resolvedItems = input.items
    .map((reqItem) => {
      const dish = state.dishes.find((d) => d.id === reqItem.dishId);
      const qty = Math.floor(reqItem.quantity);
      if (!dish || qty <= 0) return null;
      return {
        dishId: dish.id,
        name: dish.name,
        priceUzs: dish.priceUzs,
        quantity: qty,
        portion: dish.portion,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (resolvedItems.length === 0) {
    throw new Error('Buyurtma uchun kamida 1 ta taom tanlanishi kerak.');
  }

  // Resolve waiter record if waiterId or waiterCode provided
  const matchedWaiter =
    (input.waiterId ? state.waiters.find((w) => w.id === input.waiterId) : undefined) ||
    (input.waiterCode ? state.waiters.find((w) => w.pinCode === input.waiterCode) : undefined);

  const order = createOrderRecord({
    tableNumber: input.tableNumber,
    source: input.source,
    guestName: input.guestName,
    guestPhone: input.guestPhone,
    waiterId: matchedWaiter?.id ?? input.waiterId,
    waiterName: matchedWaiter?.name ?? input.waiterName,
    waiterCode: matchedWaiter?.pinCode ?? input.waiterCode,
    note: input.note,
    items: resolvedItems,
    serviceChargePercent: state.settings.serviceChargePercent,
  });

  const qtyByDish = new Map<string, number>();
  for (const item of resolvedItems) {
    qtyByDish.set(item.dishId, (qtyByDish.get(item.dishId) ?? 0) + item.quantity);
  }

  const waiterTag = order.waiterName ? ` · Ofitsiant: ${order.waiterName}` : '';

  state = {
    ...state,
    orders: [order, ...state.orders],
    dishes: state.dishes.map((dish) => {
      const add = qtyByDish.get(dish.id) ?? 0;
      return add > 0 ? { ...dish, ordersToday: dish.ordersToday + add } : dish;
    }),
    activityLog: appendActivity(
      `Yangi buyurtma (${order.source.toUpperCase()} · Stol #${order.tableNumber}${waiterTag})`,
      `${order.code} · ${resolvedItems.length} xil taom · ${formatUzsPrice(order.totalUzs)}`,
      state.activityLog,
      order.waiterName ? 'waiter' : 'guest',
      order.waiterName || order.guestName || 'Mehmon',
    ),
  };

  commitState('order:created', order);
  return order;
}

export function requestElectronicCheck(orderId: string): Order {
  const target = state.orders.find((o) => o.id === orderId);
  if (!target) {
    throw new Error('Buyurtma topilmadi.');
  }
  if (target.status === 'Cancelled') {
    throw new Error('Bekor qilingan buyurtma uchun chek chiqarib bo‘lmaydi.');
  }

  const nowIso = new Date().toISOString();
  const fiscalReceipt = buildFiscalReceipt(target, state.settings, state.waiters, nowIso);

  const updatedOrder: Order = {
    ...target,
    subtotalUzs: fiscalReceipt.subtotalUzs,
    serviceFeeUzs: fiscalReceipt.serviceFeeUzs,
    totalUzs: fiscalReceipt.totalUzs,
    checkRequested: true,
    checkRequestedAt: nowIso,
    fiscalReceipt,
    updatedAt: nowIso,
  };

  state = {
    ...state,
    orders: state.orders.map((o) => (o.id === orderId ? updatedOrder : o)),
    activityLog: appendActivity(
      `Elektron chek (Soliq.uz QR) so‘raldi · Stol #${updatedOrder.tableNumber}`,
      `${fiscalReceipt.receiptNumber} · ${formatUzsPrice(fiscalReceipt.totalUzs)}`,
      state.activityLog,
      'waiter',
      updatedOrder.waiterName || 'Ofitsiant',
    ),
  };

  commitState('order:check_requested', updatedOrder);
  return updatedOrder;
}

export function updateOrderStatus(
  orderId: string,
  nextStatus: OrderStatus,
  options: {
    paymentMethod?: PaymentMethod;
    cancelledBy?: 'guest' | 'staff';
    cancelReason?: string;
  } = {},
): Order {
  const target = state.orders.find((o) => o.id === orderId);
  if (!target) {
    throw new Error('Buyurtma topilmadi.');
  }

  if (options.cancelledBy === 'guest' && target.status === 'Paid') {
    throw new Error("To'langan buyurtmani bekor qilib bo'lmaydi. Ofitsiantga murojaat qiling.");
  }

  const nowIso = new Date().toISOString();
  const paymentMethod = options.paymentMethod ?? target.paymentMethod ?? 'Cash';

  const subtotalUzs = target.subtotalUzs ?? computeOrderTotalUzs(target.items);
  const serviceFeeUzs =
    typeof target.serviceFeeUzs === 'number'
      ? target.serviceFeeUzs
      : Math.round((subtotalUzs * state.settings.serviceChargePercent) / 100);
  const totalUzs = subtotalUzs + serviceFeeUzs;

  const waiterCommissionPercent =
    nextStatus === 'Paid'
      ? resolveEffectiveWaiterPercent(
          target,
          state.waiters,
          state.settings.defaultWaiterCommissionPercent,
          true,
        )
      : target.waiterCommissionPercent;

  const waiterCommissionUzs =
    nextStatus === 'Paid' && typeof waiterCommissionPercent === 'number'
      ? Math.round((subtotalUzs * waiterCommissionPercent) / 100)
      : target.waiterCommissionUzs;

  const fiscalReceipt =
    nextStatus === 'Paid'
      ? target.fiscalReceipt ??
        buildFiscalReceipt(
          { ...target, subtotalUzs, serviceFeeUzs, totalUzs },
          state.settings,
          state.waiters,
          nowIso,
        )
      : target.fiscalReceipt;

  const updatedOrder: Order = {
    ...target,
    subtotalUzs,
    serviceFeeUzs,
    totalUzs,
    status: nextStatus,
    paymentMethod: nextStatus === 'Paid' ? paymentMethod : target.paymentMethod,
    waiterCommissionPercent,
    waiterCommissionUzs,
    fiscalReceipt,
    cancelledBy: nextStatus === 'Cancelled' ? options.cancelledBy ?? 'staff' : undefined,
    cancelReason: nextStatus === 'Cancelled' ? options.cancelReason : undefined,
    updatedAt: nowIso,
  };

  let nextLedger = state.ledger;

  // Automatically record Kirim (Income) in accounting ledger when order is marked Paid
  if (nextStatus === 'Paid') {
    const alreadyRecorded = state.ledger.some(
      (entry) => entry.orderId === updatedOrder.id && entry.type === 'income',
    );
    if (!alreadyRecorded) {
      const waiterLabel = updatedOrder.waiterName ? ` · ${updatedOrder.waiterName}` : '';
      const incomeEntry: LedgerEntry = {
        id: `led-ord-${Date.now()}`,
        type: 'income',
        category: 'Order Revenue',
        title: `Stol #${updatedOrder.tableNumber} buyurtmasi (${updatedOrder.code}${waiterLabel})`,
        amountUzs: updatedOrder.totalUzs,
        paymentMethod,
        orderId: updatedOrder.id,
        note:
          updatedOrder.waiterName && typeof waiterCommissionUzs === 'number'
            ? `Ofitsiant ulushi (${waiterCommissionPercent}%): ${formatUzsPrice(waiterCommissionUzs)}`
            : undefined,
        date: getTodayIso(),
        createdAt: nowIso,
        createdBy: 'Kassir POS',
      };
      nextLedger = [incomeEntry, ...state.ledger];
    }
  }

  // If previously paid order gets cancelled by staff, remove linked order revenue entry cleanly
  if (nextStatus === 'Cancelled' && target.status === 'Paid') {
    nextLedger = state.ledger.filter((entry) => entry.orderId !== updatedOrder.id);
  }

  const activityTitle =
    nextStatus === 'Cancelled'
      ? options.cancelledBy === 'guest'
        ? `Mijoz buyurtmani atmen qildi (${updatedOrder.code})`
        : `Buyurtma bekor qilindi (${updatedOrder.code})`
      : nextStatus === 'Paid'
        ? `Chek yopildi & Kirim yozildi (${updatedOrder.code})`
        : `Buyurtma holati: ${nextStatus} (${updatedOrder.code})`;

  const actorRole: StaffRole | 'guest' =
    nextStatus === 'Cooking' || nextStatus === 'Ready'
      ? 'kitchen'
      : nextStatus === 'Paid'
        ? 'cashier'
        : options.cancelledBy === 'guest'
          ? 'guest'
          : 'waiter';

  const actorName: string =
    nextStatus === 'Cooking' || nextStatus === 'Ready'
      ? 'Oshpazlar guruhi'
      : nextStatus === 'Paid'
        ? 'Kassir POS'
        : options.cancelledBy === 'guest'
          ? updatedOrder.guestName || 'Mehmon'
          : updatedOrder.waiterName || 'Ofitsiant';

  state = {
    ...state,
    orders: state.orders.map((o) => (o.id === orderId ? updatedOrder : o)),
    ledger: nextLedger,
    activityLog: appendActivity(
      activityTitle,
      `Stol #${updatedOrder.tableNumber} · ${formatUzsPrice(updatedOrder.totalUzs)}`,
      state.activityLog,
      actorRole,
      actorName,
    ),
  };

  commitState('order:updated', updatedOrder);
  return updatedOrder;
}

export function addLedgerEntry(
  input: Omit<LedgerEntry, 'id' | 'createdAt' | 'date'> & { date?: string },
): LedgerEntry {
  const nowIso = new Date().toISOString();
  const entry: LedgerEntry = {
    ...input,
    id: `led-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    amountUzs: Math.max(0, Math.round(input.amountUzs)),
    date: input.date?.trim() || getTodayIso(),
    createdAt: nowIso,
  };

  state = {
    ...state,
    ledger: [entry, ...state.ledger],
    activityLog: appendActivity(
      entry.type === 'income' ? 'Yangi Kirim qo‘shildi' : 'Yangi Chiqim yozildi',
      `${entry.title} (${entry.category}) · ${formatUzsPrice(entry.amountUzs)}`,
      state.activityLog,
      'cashier',
      entry.createdBy || 'Kassir POS',
    ),
  };

  commitState('ledger:created', entry);
  return entry;
}

export function deleteLedgerEntry(id: string) {
  const target = state.ledger.find((e) => e.id === id);
  if (!target) return;
  state = {
    ...state,
    ledger: state.ledger.filter((e) => e.id !== id),
    activityLog: appendActivity(
      'Moliyaviy yozuv o‘chirildi',
      `${target.title} (${formatUzsPrice(target.amountUzs)})`,
      state.activityLog,
    ),
  };
  commitState();
}

export function addReservation(reservation: Reservation): Reservation {
  state = {
    ...state,
    reservations: [reservation, ...state.reservations],
    activityLog: appendActivity(
      'Yangi stol broni',
      `${reservation.guestName} · ${reservation.partySize} kishi (${reservation.date} ${reservation.time})`,
      state.activityLog,
    ),
  };
  commitState();
  return reservation;
}

export function updateReservationStatus(id: string, status: ReservationStatus) {
  const target = state.reservations.find((r) => r.id === id);
  if (!target) return;
  state = {
    ...state,
    reservations: state.reservations.map((r) => (r.id === id ? { ...r, status } : r)),
    activityLog: appendActivity(
      `Bron ${status.toLowerCase()}`,
      `${target.guestName} (${target.code})`,
      state.activityLog,
    ),
  };
  commitState();
}

export function addDish(dishData: Omit<Dish, 'id' | 'ordersToday'>): Dish {
  const newDish: Dish = {
    ...dishData,
    id: `dish-${Date.now()}`,
    ordersToday: 1,
  };
  state = {
    ...state,
    dishes: [newDish, ...state.dishes],
    activityLog: appendActivity(
      'Yangi taom qo‘shildi',
      `${newDish.name} (${formatUzsPrice(newDish.priceUzs)})`,
      state.activityLog,
    ),
  };
  commitState();
  return newDish;
}

export function updateDish(updated: Dish) {
  state = {
    ...state,
    dishes: state.dishes.map((d) => (d.id === updated.id ? updated : d)),
    activityLog: appendActivity('Taom yangilandi', updated.name, state.activityLog),
  };
  commitState();
}

export function toggleDishDietaryTag(id: string, tag: DietaryTag) {
  const target = state.dishes.find((d) => d.id === id);
  if (!target) return;
  const nextTags = toggleDietaryTag(target.dietaryTags, tag);
  state = {
    ...state,
    dishes: state.dishes.map((d) => (d.id === id ? { ...d, dietaryTags: nextTags } : d)),
    activityLog: appendActivity(
      nextTags.includes(tag) ? `${tag} tegi qo‘shildi` : `${tag} tegi olindi`,
      target.name,
      state.activityLog,
    ),
  };
  commitState();
}

export function deleteDish(id: string) {
  const target = state.dishes.find((d) => d.id === id);
  if (!target) return;
  state = {
    ...state,
    dishes: state.dishes.filter((d) => d.id !== id),
    activityLog: appendActivity('Taom o‘chirildi', target.name, state.activityLog),
  };
  commitState();
}

export function toggleReviewFeatured(id: string) {
  const target = state.reviews.find((r) => r.id === id);
  if (!target) return;
  state = {
    ...state,
    reviews: state.reviews.map((r) => (r.id === id ? { ...r, featured: !r.featured } : r)),
    activityLog: appendActivity(
      !target.featured ? 'Sharh ajratib ko‘rsatildi' : 'Sharh odatiy holatga qaytarildi',
      target.author,
      state.activityLog,
    ),
  };
  commitState();
}

export function toggleReviewHidden(id: string) {
  const target = state.reviews.find((r) => r.id === id);
  if (!target) return;
  state = {
    ...state,
    reviews: state.reviews.map((r) => (r.id === id ? { ...r, hidden: !r.hidden } : r)),
    activityLog: appendActivity(
      !target.hidden ? 'Sharh yashirildi' : 'Sharh tiklandi',
      target.author,
      state.activityLog,
    ),
  };
  commitState();
}

export function closeDailyShift(options: {
  archiveChecks: boolean;
  closedBy?: string;
}): {
  archivedCount: number;
  remainingActiveCount: number;
  totalArchivedSaved: number;
} {
  const todayIso = getTodayIso();
  const closedAt = new Date().toISOString();
  let nextOrders = state.orders;
  let nextArchive = state.receiptArchive ?? [];
  let newlyCount = 0;

  if (options.archiveChecks) {
    const { remainingOrders, newArchive, archivedReceipts } = archivePaidOrders(
      state.orders,
      nextArchive,
      todayIso,
      closedAt,
    );
    newlyCount = archivedReceipts.length;
    nextOrders = remainingOrders;
    nextArchive = purgeExpiredArchivedReceipts(newArchive, 30);
  } else {
    nextArchive = purgeExpiredArchivedReceipts(nextArchive, 30);
  }

  const detailMsg = options.archiveChecks
    ? `Kassir bugungi cheklarni arxivladi (${newlyCount} ta chek xotirada 30 kun saqlanadi)`
    : `Kassir hisob-kitob qilish va tozalash ishlari sababli cheklarni aktiv saqladi`;

  state = {
    ...state,
    orders: nextOrders,
    receiptArchive: nextArchive,
    activityLog: appendActivity(
      options.archiveChecks
        ? 'Kunlik smena yopildi & cheklar arxivlandi'
        : 'Kunlik smena hisoblandi (cheklar aktiv qoldi)',
      detailMsg,
      state.activityLog,
      'cashier',
      options.closedBy || 'Bosh Kassir',
    ),
  };

  commitState('shift:closed', {
    archiveChecks: options.archiveChecks,
    archivedCount: newlyCount,
    totalArchived: nextArchive.length,
  });

  return {
    archivedCount: newlyCount,
    remainingActiveCount: nextOrders.length,
    totalArchivedSaved: nextArchive.length,
  };
}

export function clearReceiptArchive(): { clearedCount: number } {
  const previousCount = (state.receiptArchive ?? []).length;
  state = {
    ...state,
    receiptArchive: [],
    activityLog: appendActivity(
      'Cheklar tarixi tozalandi',
      `Kassir ruxsati bilan barcha arxivlangan cheklar (${previousCount} ta) xotiradan tozalandi`,
      state.activityLog,
      'cashier',
      'Bosh Kassir',
    ),
  };
  commitState('shift:archive_cleared', { clearedCount: previousCount });
  return { clearedCount: previousCount };
}
