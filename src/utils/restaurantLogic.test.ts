import test from 'node:test';
import assert from 'node:assert/strict';
import {
  archivePaidOrders,
  authenticateStaffByCode,
  buildEMenuUrl,
  buildFinancialVoiceScript,
  buildFiscalReceipt,
  buildOrderItemsFromQuantities,
  buildStaffAppUrl,
  canGuestCancelOrder,
  computeAccountingSummary,
  computeDashboardStats,
  computeDayEndShiftSummary,
  computeOrderTotalUzs,
  computeRatingPercentages,
  computeTableEstimateTotal,
  computeWaiterPayouts,
  createOrderRecord,
  createReservationRecord,
  exportLedgerCsv,
  filterMenuDishes,
  formatUzsPrice,
  getPopularDish,
  getTableOwnershipMap,
  getVisibleReviews,
  normalizeDishDietaryTags,
  normalizeDishRecord,
  parseAppLaunchFromUrl,
  parseEMenuLaunchFromUrl,
  purgeExpiredArchivedReceipts,
  sortReservations,
  toggleDietaryTag,
  validateReservationInput,
  verifyAdminPassword,
} from './restaurantLogic';
import {
  INITIAL_DISHES,
  INITIAL_LEDGER,
  INITIAL_ORDERS,
  INITIAL_RESERVATIONS,
  INITIAL_REVIEWS,
  INITIAL_SETTINGS,
  INITIAL_WAITERS,
  RATING_DISTRIBUTION,
} from '../data/seedData';

test('filterMenuDishes filters accurately by category and search query', () => {
  const all = filterMenuDishes(INITIAL_DISHES, 'All');
  assert.equal(all.length, INITIAL_DISHES.length);

  const desserts = filterMenuDishes(INITIAL_DISHES, 'Desserts');
  assert.equal(desserts.length, 2);
  assert.equal(desserts[0]?.name, 'San-Sebastian Cheesecake');

  const search = filterMenuDishes(INITIAL_DISHES, 'All', 'saffron');
  assert.equal(search.length, 1);
  assert.equal(search[0]?.category, 'Drinks');
});

test('validateReservationInput rejects missing fields and accepts valid input', () => {
  const invalid = validateReservationInput({
    guestName: 'A',
    contact: '',
    date: '',
    time: '',
    partySize: 0,
    requests: '',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.guestName);
  assert.ok(invalid.errors.contact);
  assert.ok(invalid.errors.date);
  assert.ok(invalid.errors.time);
  assert.ok(invalid.errors.partySize);

  const valid = validateReservationInput({
    guestName: 'Madina Azizova',
    contact: '+998 90 123 45 67',
    date: '2026-11-16',
    time: '19:30',
    partySize: 4,
    requests: 'Window table',
  });
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.errors, {});
});

test('createReservationRecord creates a structured Pending reservation', () => {
  const rec = createReservationRecord(
    {
      guestName: '  Kamol Rustamov ',
      contact: ' kamol@example.uz ',
      date: '2026-11-18',
      time: '20:00',
      partySize: 3,
      requests: 'Quiet booth',
    },
    5521,
  );
  assert.equal(rec.code, 'SYQ-5521');
  assert.equal(rec.guestName, 'Kamol Rustamov');
  assert.equal(rec.status, 'Pending');
  assert.equal(rec.partySize, 3);
});

test('sortReservations sorts by partySize and date ascending/descending', () => {
  const bySizeAsc = sortReservations(INITIAL_RESERVATIONS, 'partySize', 'asc');
  assert.ok(bySizeAsc[0]!.partySize <= bySizeAsc[bySizeAsc.length - 1]!.partySize);

  const bySizeDesc = sortReservations(INITIAL_RESERVATIONS, 'partySize', 'desc');
  assert.ok(bySizeDesc[0]!.partySize >= bySizeDesc[bySizeDesc.length - 1]!.partySize);
});

test('getVisibleReviews excludes hidden and prioritizes featured', () => {
  const modified = INITIAL_REVIEWS.map((r, idx) =>
    idx === 2 ? { ...r, hidden: true } : r,
  );
  const visible = getVisibleReviews(modified);
  assert.equal(visible.length, 2);
  assert.equal(visible[0]?.featured, true);
});

test('computeDashboardStats and getPopularDish identify top dish and active counts', () => {
  const popular = getPopularDish(INITIAL_DISHES);
  assert.equal(popular?.name, 'Molotiy Shashlik');

  const stats = computeDashboardStats(INITIAL_RESERVATIONS, INITIAL_DISHES, 273, 4.1, '2026-11-14');
  assert.equal(stats.todaysReservations, 3);
  assert.equal(stats.totalReviews, 273);
  assert.equal(stats.avgRating, 4.1);
});

test('computeRatingPercentages sums close to 100 and formats UZS prices', () => {
  const breakdown = computeRatingPercentages(RATING_DISTRIBUTION);
  assert.equal(breakdown[0]?.stars, 5);
  assert.equal(breakdown[0]?.percent, 54);
  assert.equal(formatUzsPrice(145000), 'UZS 145,000');
});

test('verifyAdminPassword strictly checks sayqal2024', () => {
  assert.equal(verifyAdminPassword('sayqal2024'), true);
  assert.equal(verifyAdminPassword(' sayqal2024 '), true);
  assert.equal(verifyAdminPassword('wrongpass'), false);
  assert.equal(verifyAdminPassword(''), false);
});

test('toggleDietaryTag toggles tags while preserving canonical order', () => {
  const addedSpicy = toggleDietaryTag(['Vegan'], 'Spicy');
  assert.deepEqual(addedSpicy, ['Vegan', 'Spicy']);

  const addedGlutenFree = toggleDietaryTag(addedSpicy, 'Gluten-Free');
  assert.deepEqual(addedGlutenFree, ['Vegan', 'Gluten-Free', 'Spicy']);

  const removedVegan = toggleDietaryTag(addedGlutenFree, 'Vegan');
  assert.deepEqual(removedVegan, ['Gluten-Free', 'Spicy']);
});

test('normalizeDishDietaryTags hydrates legacy dishes missing dietaryTags', () => {
  const legacyDish = { ...INITIAL_DISHES[0]! } as Omit<(typeof INITIAL_DISHES)[0], 'dietaryTags'>;
  delete (legacyDish as { dietaryTags?: unknown }).dietaryTags;
  const hydrated = normalizeDishDietaryTags(legacyDish, INITIAL_DISHES);
  assert.deepEqual(hydrated.dietaryTags, ['Gluten-Free']);
});

test('normalizeDishRecord preserves custom imageUrl cleanly', () => {
  const jiz = INITIAL_DISHES.find((d) => d.id === 'dish-sayqal-jiz')!;
  const custom = normalizeDishRecord(
    { ...jiz, imageUrl: ' https://example.com/jiz.jpg ' },
    INITIAL_DISHES,
  );
  assert.equal(custom.imageUrl, 'https://example.com/jiz.jpg');
});

test('buildEMenuUrl, buildStaffAppUrl, parseEMenuLaunchFromUrl, and parseAppLaunchFromUrl route Guest Order, Admin, Waiter & Cashier', () => {
  const nfcUrl = buildEMenuUrl('https://sayqal.uz/', { source: 'nfc', table: '7' });
  assert.equal(nfcUrl, 'https://sayqal.uz/?emenu=1&source=nfc&table=7');
  assert.equal(buildStaffAppUrl('https://sayqal.uz', 'waiter'), 'https://sayqal.uz/?app=waiter');
  assert.equal(buildStaffAppUrl('https://sayqal.uz', 'kitchen'), 'https://sayqal.uz/?app=kitchen');
  assert.equal(buildStaffAppUrl('https://sayqal.uz', 'cashier'), 'https://sayqal.uz/?app=cashier');
  assert.equal(buildStaffAppUrl('https://sayqal.uz', 'admin'), 'https://sayqal.uz/?app=staff');

  assert.deepEqual(parseEMenuLaunchFromUrl('?emenu=1&source=nfc&table=7', ''), {
    open: true,
    source: 'nfc',
    table: '7',
  });

  assert.deepEqual(parseAppLaunchFromUrl('?emenu=1&source=nfc&table=5', ''), {
    mode: 'guest-order',
    source: 'nfc',
    table: '5',
  });

  assert.deepEqual(parseAppLaunchFromUrl('?app=staff', ''), {
    mode: 'staff-os',
    source: 'pos',
    staffRole: 'admin',
  });

  assert.deepEqual(parseAppLaunchFromUrl('?app=waiter', ''), {
    mode: 'staff-os',
    source: 'pos',
    staffRole: 'waiter',
  });

  assert.deepEqual(parseAppLaunchFromUrl('?app=kitchen', ''), {
    mode: 'staff-os',
    source: 'pos',
    staffRole: 'kitchen',
  });

  assert.deepEqual(parseAppLaunchFromUrl('?app=cashier', ''), {
    mode: 'staff-os',
    source: 'pos',
    staffRole: 'cashier',
  });

  assert.deepEqual(parseAppLaunchFromUrl('', ''), {
    mode: 'lounge',
    source: 'web',
  });
});

test('computeTableEstimateTotal and createOrderRecord calculate totals cleanly', () => {
  const jiz = INITIAL_DISHES.find((d) => d.id === 'dish-sayqal-jiz')!;
  const achchiq = INITIAL_DISHES.find((d) => d.id === 'dish-achchiq')!;
  const summary = computeTableEstimateTotal(INITIAL_DISHES, {
    [jiz.id]: 2,
    [achchiq.id]: 1,
  });
  assert.equal(summary.itemCount, 3);
  assert.equal(summary.totalUzs, jiz.priceUzs * 2 + achchiq.priceUzs);

  const items = buildOrderItemsFromQuantities(INITIAL_DISHES, { [jiz.id]: 2, [achchiq.id]: 1 });
  const order = createOrderRecord(
    { tableNumber: '5', source: 'nfc', items, note: 'Extra herbs' },
    3188,
  );
  assert.equal(order.code, 'ORD-3188');
  assert.equal(order.status, 'Pending');
  assert.equal(order.totalUzs, computeOrderTotalUzs(items));
  assert.equal(canGuestCancelOrder(order.status), true);
  assert.equal(canGuestCancelOrder('Paid'), false);
  assert.equal(canGuestCancelOrder('Cancelled'), false);
});

test('computeAccountingSummary accurately calculates Kirim, Chiqim, Net Profit and excludes Cancelled orders', () => {
  const summary = computeAccountingSummary(INITIAL_LEDGER, INITIAL_ORDERS, '2026-11-14');
  // Seed incomes: 451,000 + 498,300 + 1,850,000 = 2,799,300
  // Seed expenses: 780,000 + 195,000 = 975,000
  assert.equal(summary.totalIncomeUzs, 2799300);
  assert.equal(summary.totalExpenseUzs, 975000);
  assert.equal(summary.netProfitUzs, 1824300);
  assert.equal(summary.activeOrdersCount, 2);
  assert.equal(summary.paidOrdersCount, 2);
  assert.equal(summary.cancelledOrdersCount, 0);

  const scriptUz = buildFinancialVoiceScript(summary, 'uz');
  assert.ok(scriptUz.includes('2,799,300'));
  assert.ok(scriptUz.includes('1,824,300'));

  const csv = exportLedgerCsv(INITIAL_LEDGER);
  assert.ok(csv.includes('Kirim'));
  assert.ok(csv.includes('Chiqim'));
});

test('authenticateStaffByCode routes personal waiter PINs (2100 Doston, 0800 Sarvinoz), Kitchen (0500), Cashier (0900), and Admin', () => {
  const doston = authenticateStaffByCode('2100', INITIAL_WAITERS);
  assert.equal(doston.ok, true);
  assert.equal(doston.role, 'waiter');
  assert.equal(doston.waiter?.name, 'Doston');

  const sarvinoz = authenticateStaffByCode('0800', INITIAL_WAITERS);
  assert.equal(sarvinoz.ok, true);
  assert.equal(sarvinoz.role, 'waiter');
  assert.equal(sarvinoz.waiter?.name, 'Sarvinoz');

  const kitchen = authenticateStaffByCode('0500', INITIAL_WAITERS);
  assert.equal(kitchen.ok, true);
  assert.equal(kitchen.role, 'kitchen');

  const cashier = authenticateStaffByCode('0900', INITIAL_WAITERS);
  assert.equal(cashier.ok, true);
  assert.equal(cashier.role, 'cashier');

  const admin = authenticateStaffByCode('sayqal2024', INITIAL_WAITERS, 'admin');
  assert.equal(admin.ok, true);
  assert.equal(admin.role, 'admin');

  const inactiveRoster = INITIAL_WAITERS.map((w) =>
    w.pinCode === '2100' ? { ...w, active: false } : w,
  );
  assert.equal(authenticateStaffByCode('2100', inactiveRoster).ok, false);
  assert.equal(authenticateStaffByCode('9999', INITIAL_WAITERS).ok, false);
});

test('getTableOwnershipMap separates my tables, other waiter tables, and empty ("Odam yo\'q") tables across 25 tables', () => {
  const dostonMap = getTableOwnershipMap(INITIAL_ORDERS, 'w-doston', 25);
  assert.equal(dostonMap.length, 25);

  const table2 = dostonMap.find((t) => t.tableNumber === '2')!;
  assert.equal(table2.ownership, 'mine');
  assert.equal(table2.waiterName, 'Doston');

  const table9 = dostonMap.find((t) => t.tableNumber === '9')!;
  assert.equal(table9.ownership, 'other');
  assert.equal(table9.waiterName, 'Sarvinoz');

  const table1 = dostonMap.find((t) => t.tableNumber === '1')!;
  assert.equal(table1.ownership, 'empty');
  assert.equal(table1.activeOrdersCount, 0);
});

test('buildFiscalReceipt creates Soliq.uz OFD QR payload with STIR, service charge, and waiter commission', () => {
  const order = INITIAL_ORDERS.find((o) => o.id === 'ord-1004')!;
  const receipt = buildFiscalReceipt(order, INITIAL_SETTINGS, INITIAL_WAITERS, '2026-11-14T14:10:00Z');

  assert.ok(receipt.soliqUrl.startsWith('https://ofd.soliq.uz/epi?'));
  assert.ok(receipt.soliqUrl.includes(`inn=${INITIAL_SETTINGS.inn}`));
  assert.equal(receipt.subtotalUzs, 252000);
  assert.equal(receipt.serviceFeeUzs, 25200);
  assert.equal(receipt.totalUzs, 277200);
  assert.equal(receipt.waiterSharePercent, 10);
  assert.equal(receipt.waiterShareUzs, 25200);
});

test('computeWaiterPayouts supports 25+ waiters and recalculates automatic UZS earnings when Cashier updates %', () => {
  const twentyFiveWaiters = Array.from({ length: 25 }, (_, i) => ({
    id: i === 0 ? 'w-doston' : i === 1 ? 'w-sarvinoz' : `w-extra-${i}`,
    name: i === 0 ? 'Doston' : i === 1 ? 'Sarvinoz' : `Ofitsiant ${i + 1}`,
    pinCode: i === 0 ? '2100' : i === 1 ? '0800' : String(5000 + i),
    active: true,
  }));

  const atTenPercent = computeWaiterPayouts(INITIAL_ORDERS, twentyFiveWaiters, {
    ...INITIAL_SETTINGS,
    defaultWaiterCommissionPercent: 10,
  });
  assert.equal(atTenPercent.length, 25);
  const doston10 = atTenPercent.find((w) => w.pinCode === '2100')!;
  assert.equal(doston10.paidSubtotalUzs, 410000);
  assert.equal(doston10.earnedCommissionUzs, 41000);
  assert.equal(doston10.restaurantNetUzs, 451000 - 41000);

  const atFifteenPercent = computeWaiterPayouts(INITIAL_ORDERS, twentyFiveWaiters, {
    ...INITIAL_SETTINGS,
    defaultWaiterCommissionPercent: 15,
  });
  const doston15 = atFifteenPercent.find((w) => w.pinCode === '2100')!;
  assert.equal(doston15.commissionPercent, 15);
  assert.equal(doston15.earnedCommissionUzs, 61500);
  assert.equal(doston15.restaurantNetUzs, 451000 - 61500);
});

test('archivePaidOrders moves Paid and Cancelled orders to archive and preserves active unpaid orders', () => {
  const result = archivePaidOrders(INITIAL_ORDERS, [], '2026-11-14', '2026-11-14T22:00:00Z');

  // Initial orders has 2 Paid (ord-1001, ord-1002) and 2 Unpaid (ord-1003, ord-1004)
  assert.equal(result.archivedReceipts.length, 2);
  assert.equal(result.remainingOrders.length, 2);
  assert.ok(result.remainingOrders.every((o) => o.status !== 'Paid' && o.status !== 'Cancelled'));
  assert.equal(result.newArchive.length, 2);
  assert.equal(result.newArchive[0]?.shiftDate, '2026-11-14');
});

test('purgeExpiredArchivedReceipts automatically purges receipts older than 30 days', () => {
  const nowMs = 1763164800000; // Reference timestamp
  const twentyDaysAgo = new Date(nowMs - 20 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyFiveDaysAgo = new Date(nowMs - 35 * 24 * 60 * 60 * 1000).toISOString();

  const archive = [
    {
      id: 'arch-recent',
      orderId: 'ord-recent',
      code: 'ORD-101',
      tableNumber: '3',
      items: [],
      subtotalUzs: 100000,
      serviceFeeUzs: 10000,
      totalUzs: 110000,
      paymentMethod: 'Cash' as const,
      closedAt: twentyDaysAgo,
      shiftDate: '2026-10-25',
    },
    {
      id: 'arch-old',
      orderId: 'ord-old',
      code: 'ORD-099',
      tableNumber: '1',
      items: [],
      subtotalUzs: 200000,
      serviceFeeUzs: 20000,
      totalUzs: 220000,
      paymentMethod: 'Card' as const,
      closedAt: thirtyFiveDaysAgo,
      shiftDate: '2026-10-10',
    },
  ];

  const purged = purgeExpiredArchivedReceipts(archive, 30, nowMs);
  assert.equal(purged.length, 1);
  assert.equal(purged[0]?.id, 'arch-recent');
});

test('computeDayEndShiftSummary correctly calculates sales, raw materials expenses, and waiter payouts', () => {
  const customLedger = [
    {
      id: 'led-flour',
      type: 'expense' as const,
      category: 'Ingredients / Bazaar' as const,
      title: 'Un xaridi (2 qop)',
      amountUzs: 450000,
      paymentMethod: 'Cash' as const,
      date: '2026-11-14',
      createdAt: '2026-11-14T10:00:00Z',
    },
    {
      id: 'led-sugar',
      type: 'expense' as const,
      category: 'Ingredients / Bazaar' as const,
      title: 'Shakar xaridi',
      amountUzs: 280000,
      paymentMethod: 'Cash' as const,
      date: '2026-11-14',
      createdAt: '2026-11-14T11:00:00Z',
    },
    {
      id: 'led-cheesecakes',
      type: 'expense' as const,
      category: 'Ingredients / Bazaar' as const,
      title: 'Cheesecake olib kelinishi (Patisserie)',
      amountUzs: 620000,
      paymentMethod: 'Cash' as const,
      date: '2026-11-14',
      createdAt: '2026-11-14T12:00:00Z',
    },
  ];

  const shift = computeDayEndShiftSummary(
    INITIAL_ORDERS,
    customLedger,
    INITIAL_WAITERS,
    INITIAL_SETTINGS,
    '2026-11-14',
  );

  assert.equal(shift.totalPaidChecks, 2);
  assert.equal(shift.totalSalesUzs, 451000 + 498300); // ord-1001 (451k) + ord-1002 (498.3k) = 949,300 UZS
  assert.equal(shift.supplyExpensesUzs, 450000 + 280000 + 620000); // 1,350,000 UZS
  assert.equal(shift.totalExpensesUzs, 1350000);
  assert.ok(shift.totalWaiterPayableUzs > 0);
  assert.ok(Array.isArray(shift.waiterPayouts));
  const dostonPayout = shift.waiterPayouts.find((w) => w.pinCode === '2100');
  assert.ok(dostonPayout);
  assert.equal(dostonPayout?.waiterName, 'Doston');
  assert.equal(dostonPayout?.payableCommissionUzs, 41000);
});
