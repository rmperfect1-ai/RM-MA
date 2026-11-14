import {
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  MinusCircle,
  Percent,
  Printer,
  QrCode,
  Receipt,
  Smartphone,
  Users,
  Wallet,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type {
  LedgerCategory,
  LedgerEntry,
  LedgerType,
  Order,
  OrderStatus,
  PaymentMethod,
  RestaurantSettings,
  WaiterProfile,
} from '../types/restaurant';
import {
  computeAccountingSummary,
  computeOrderTotalUzs,
  computeWaiterPayouts,
  formatPaymentMethodLabel,
  formatUzsPrice,
} from '../utils/restaurantLogic';
import type { ArchivedReceipt } from '../types/restaurant';
import { FiscalReceiptModal } from './FiscalReceiptModal';
import { QrCodeGraphic } from './QrCodeGraphic';
import { ReceiptArchiveModal } from './ReceiptArchiveModal';
import { ShiftSummaryModal } from './ShiftSummaryModal';
import { Archive, Moon } from 'lucide-react';

const QUICK_EXPENSE_TEMPLATES = [
  {
    title: 'Un xaridi (Oliy nav un)',
    category: 'Ingredients / Bazaar' as const,
    defaultAmount: '450000',
    emoji: '🌾',
    label: 'Un (Flour)',
  },
  {
    title: 'Shakar xaridi (Qandolatchilik)',
    category: 'Ingredients / Bazaar' as const,
    defaultAmount: '280000',
    emoji: '🧂',
    label: 'Shakar (Sugar)',
  },
  {
    title: 'Cheesecake olib kelinishi (Patisserie)',
    category: 'Ingredients / Bazaar' as const,
    defaultAmount: '620000',
    emoji: '🍰',
    label: 'Cheesecake ta’minoti',
  },
  {
    title: 'Go‘sht va lahm xaridi',
    category: 'Ingredients / Bazaar' as const,
    defaultAmount: '1250000',
    emoji: '🥩',
    label: 'Go‘sht / Qiyma',
  },
  {
    title: 'O‘simlik yog‘i & Guruch',
    category: 'Ingredients / Bazaar' as const,
    defaultAmount: '380000',
    emoji: '🌻',
    label: 'Yog‘ & Guruch',
  },
  {
    title: 'Kechki tozalash vositalari',
    category: 'Kitchen Consumables' as const,
    defaultAmount: '120000',
    emoji: '🧼',
    label: 'Tozalash vositalari',
  },
  {
    title: 'Kommunal / Boshqa xarajat',
    category: 'Utilities' as const,
    defaultAmount: '250000',
    emoji: '💡',
    label: 'Kommunal / Boshqa',
  },
];

interface CashierRegisterPanelProps {
  orders: Order[];
  ledger: LedgerEntry[];
  waiters: WaiterProfile[];
  settings: RestaurantSettings;
  receiptArchive?: ArchivedReceipt[];
  onUpdateSettings: (patch: Partial<RestaurantSettings>) => Promise<RestaurantSettings>;
  onUpdateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    options?: { paymentMethod?: PaymentMethod; cancelReason?: string },
  ) => Promise<Order>;
  onRequestElectronicCheck: (orderId: string) => Promise<Order>;
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
  onCloseDailyShift?: (options: {
    archiveChecks: boolean;
    closedBy?: string;
  }) => Promise<{ archivedCount: number; remainingActiveCount: number; totalArchivedSaved: number }>;
  onClearReceiptArchive?: () => Promise<{ clearedCount: number }>;
}

export function CashierRegisterPanel({
  orders,
  ledger,
  waiters,
  settings,
  receiptArchive = [],
  onUpdateSettings,
  onUpdateOrderStatus,
  onRequestElectronicCheck,
  onAddLedgerEntry,
  onCloseDailyShift,
  onClearReceiptArchive,
}: CashierRegisterPanelProps) {
  const [queueFilter, setQueueFilter] = useState<'checks' | 'unpaid' | 'paid' | 'cancelled'>(
    'unpaid',
  );
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [receiptFeedback, setReceiptFeedback] = useState('');
  const [modalReceiptOrderId, setModalReceiptOrderId] = useState<string | null>(null);

  // Shift Closing & Archive Modals
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [viewingArchiveReceipt, setViewingArchiveReceipt] = useState<ArchivedReceipt | null>(null);

  // Cashier Commission % Controls
  const [commissionPctInput, setCommissionPctInput] = useState(
    String(settings.defaultWaiterCommissionPercent),
  );
  const [servicePctInput, setServicePctInput] = useState(String(settings.serviceChargePercent));
  const [savingSettings, setSavingSettings] = useState(false);

  // Quick Cashier Petty-Cash Expense Entry
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<LedgerCategory>('Ingredients / Bazaar');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseSaving, setExpenseSaving] = useState(false);

  useEffect(() => {
    setCommissionPctInput(String(settings.defaultWaiterCommissionPercent));
    setServicePctInput(String(settings.serviceChargePercent));
  }, [settings.defaultWaiterCommissionPercent, settings.serviceChargePercent]);

  const summary = computeAccountingSummary(ledger, orders);

  const unpaidOrders = orders.filter(
    (o) => o.status === 'Pending' || o.status === 'Preparing' || o.status === 'Ready',
  );
  const requestedCheckOrders = unpaidOrders.filter((o) => Boolean(o.checkRequested));
  const paidOrders = orders.filter((o) => o.status === 'Paid');
  const cancelledOrders = orders.filter((o) => o.status === 'Cancelled');

  const visibleQueue =
    queueFilter === 'checks'
      ? requestedCheckOrders
      : queueFilter === 'unpaid'
        ? unpaidOrders
        : queueFilter === 'paid'
          ? paidOrders
          : cancelledOrders;

  useEffect(() => {
    if (!visibleQueue.some((o) => o.id === selectedOrderId)) {
      setSelectedOrderId(visibleQueue[0]?.id ?? '');
    }
  }, [queueFilter, orders, selectedOrderId, visibleQueue]);

  const activeOrder = visibleQueue.find((o) => o.id === selectedOrderId) ?? visibleQueue[0] ?? null;
  const modalReceiptOrder = modalReceiptOrderId
    ? orders.find((o) => o.id === modalReceiptOrderId) ?? null
    : null;

  // Live preview of Waiter Payouts using whatever % Cashier typed/saved
  const liveSettingsPreview: RestaurantSettings = {
    ...settings,
    defaultWaiterCommissionPercent: Math.max(
      0,
      Math.min(50, Number(commissionPctInput) || 0),
    ),
    serviceChargePercent: Math.max(0, Math.min(30, Number(servicePctInput) || 0)),
  };
  const waiterPayouts = computeWaiterPayouts(orders, waiters, liveSettingsPreview);
  const totalWaitersCommissionUzs = waiterPayouts.reduce(
    (sum, w) => sum + w.earnedCommissionUzs,
    0,
  );

  const handleSaveRates = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const updated = await onUpdateSettings({
        defaultWaiterCommissionPercent: Math.max(
          0,
          Math.min(50, Number(commissionPctInput) || 0),
        ),
        serviceChargePercent: Math.max(0, Math.min(30, Number(servicePctInput) || 0)),
      });
      setReceiptFeedback(
        `Stavkalar yangilandi: Ofitsiant ulushi ${updated.defaultWaiterCommissionPercent}% · Xizmat haqi ${updated.serviceChargePercent}%! Barcha hisoblar avtomatik qayta hisoblandi.`,
      );
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCloseBillPaid = async () => {
    if (!activeOrder) return;
    setBusyId(activeOrder.id);
    setReceiptFeedback('');
    try {
      const closed = await onUpdateOrderStatus(activeOrder.id, 'Paid', { paymentMethod });
      setReceiptFeedback(
        `${closed.code} (Stol #${closed.tableNumber}) — ${formatPaymentMethodLabel(paymentMethod)} orqali ${formatUzsPrice(closed.totalUzs)} to‘landi! ${
          closed.waiterName
            ? `Ofitsiant ${closed.waiterName} (${closed.waiterCommissionPercent}%): +${formatUzsPrice(closed.waiterCommissionUzs ?? 0)}`
            : ''
        }`,
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleGenerateSoliqCheck = async () => {
    if (!activeOrder) return;
    setBusyId(activeOrder.id);
    try {
      const updated = await onRequestElectronicCheck(activeOrder.id);
      setModalReceiptOrderId(updated.id);
      setReceiptFeedback(
        `${updated.code} uchun Soliq.uz OFD Elektron Cheki (${updated.fiscalReceipt?.receiptNumber}) shakllantirildi!`,
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleCancelUnpaid = async () => {
    if (!activeOrder) return;
    setBusyId(activeOrder.id);
    setReceiptFeedback('');
    try {
      await onUpdateOrderStatus(activeOrder.id, 'Cancelled', {
        cancelReason: 'Kassir tomonidan atmen qilindi',
      });
      setReceiptFeedback(`${activeOrder.code} cheki bekor (Atmen) qilindi.`);
    } finally {
      setBusyId(null);
    }
  };

  const handleQuickExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const numeric = Number(expenseAmount);
    if (!expenseTitle.trim() || !Number.isFinite(numeric) || numeric <= 0) return;
    setExpenseSaving(true);
    try {
      await onAddLedgerEntry({
        type: 'expense',
        category: expenseCategory,
        title: expenseTitle.trim(),
        amountUzs: Math.round(numeric),
        paymentMethod: 'Cash',
        createdBy: 'Kassir POS',
      });
      setExpenseTitle('');
      setExpenseAmount('');
      setReceiptFeedback(
        `Kassadan chiqim qayd etildi: ${expenseTitle.trim()} (${formatUzsPrice(numeric)}). Kirim-Chiqim hisobi avtomatik yangilandi.`,
      );
    } finally {
      setExpenseSaving(false);
    }
  };

  const handleApplyExpenseTemplate = (tmpl: (typeof QUICK_EXPENSE_TEMPLATES)[number]) => {
    setExpenseTitle(tmpl.title);
    setExpenseCategory(tmpl.category);
    setExpenseAmount(tmpl.defaultAmount);
  };

  return (
    <div data-testid="cashier-register-panel" className="space-y-6">
      {/* Cashier Action Bar: Shift Closing, History Archive, PDF Export */}
      <div className="flex flex-col gap-4 rounded-xl border border-[#C9A84C]/35 bg-[#14100C] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C9A84C]">
            Kassir Boshqaruvi · Soliq.uz POS
          </span>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-[#F5EDD6]">
            Kassa Terminali & Moliyaviy Hisob-Kitob
          </h1>
          <p className="text-xs text-[#B8AE98]">
            Kirim-chiqimlar, xomashyo ta’minoti, cheklar xotirasi va ofitsiantlar hisob-kitobi
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            data-testid="cashier-open-shift-modal-btn"
            onClick={() => setIsShiftModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E6CB7D] bg-[#C9A84C] px-3.5 py-2 text-xs font-bold text-[#0A0806] hover:bg-[#E6CB7D] transition-all shadow-md"
          >
            <Moon className="h-4 w-4" />
            <span>Kunni Yopish (Smena Hisoboti)</span>
          </button>

          <button
            type="button"
            data-testid="cashier-open-archive-modal-btn"
            onClick={() => setIsArchiveModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9A84C]/40 bg-[#0A0806] px-3.5 py-2 text-xs font-semibold text-[#E6CB7D] hover:border-[#C9A84C] hover:bg-[#1C160E] transition-colors"
          >
            <Archive className="h-4 w-4" />
            <span>Cheklar Tarixi ({receiptArchive.length})</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9A84C]/30 bg-[#0A0806] p-2 text-xs text-[#B8AE98] hover:text-[#F5EDD6] transition-colors"
            title="PDF formatida chop etish"
          >
            <Printer className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Top 4 Cashier Drawer Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#2D4A3E] bg-[#121814] p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-[#A9CEBE]">
            <span>Jami Kassa Tushumi</span>
            <Wallet className="h-4 w-4" />
          </div>
          <p className="font-display mt-2 text-2xl font-semibold tabular-nums text-[#F5EDD6] sm:text-3xl">
            {formatUzsPrice(summary.totalIncomeUzs)}
          </p>
          <p className="mt-1 text-[11px] text-[#A9CEBE]/85">
            Sof qoldiq: {formatUzsPrice(summary.netProfitUzs)}
          </p>
        </div>

        <div className="rounded-xl border border-[#C9A84C]/30 bg-[#14100C] p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-[#E6CB7D]">
            <span>Naqd · Karta · Payme</span>
            <Banknote className="h-4 w-4" />
          </div>
          <p className="font-display mt-2 text-2xl font-semibold tabular-nums text-[#F5EDD6] sm:text-3xl">
            {formatUzsPrice(summary.cashIncomeUzs)}
          </p>
          <p className="mt-1 text-[11px] tabular-nums text-[#B8AE98]">
            Karta: {formatUzsPrice(summary.cardIncomeUzs)} · Digital:{' '}
            {formatUzsPrice(summary.digitalIncomeUzs)}
          </p>
        </div>

        <div className="rounded-xl border border-[#C9A84C]/30 bg-[#14100C] p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-[#E6CB7D]">
            <span>Ofitsiantlar Ulushi ({liveSettingsPreview.defaultWaiterCommissionPercent}%)</span>
            <Users className="h-4 w-4" />
          </div>
          <p
            data-testid="cashier-total-waiter-payout"
            className="font-display mt-2 text-2xl font-semibold tabular-nums text-[#E6CB7D] sm:text-3xl"
          >
            {formatUzsPrice(totalWaitersCommissionUzs)}
          </p>
          <p className="mt-1 text-[11px] text-[#B8AE98]">
            Avtomatik hisoblangan maosh ulushi
          </p>
        </div>

        <div className="rounded-xl border border-[#C9A84C]/30 bg-[#14100C] p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-[#E6CB7D]">
            <span>Soliq.uz Chek So‘rovlari</span>
            <QrCode className="h-4 w-4" />
          </div>
          <p className="font-display mt-2 text-2xl font-semibold tabular-nums text-[#F5EDD6] sm:text-3xl">
            {requestedCheckOrders.length} ta stol
          </p>
          <p className="mt-1 text-[11px] text-[#B8AE98]">
            Jami to‘lanmagan: {unpaidOrders.length} ta
          </p>
        </div>
      </div>

      {receiptFeedback && (
        <div
          role="status"
          className="rounded-lg border border-[#2D4A3E] bg-[#121D18] px-4 py-3 text-xs font-medium text-[#A9CEBE]"
        >
          {receiptFeedback}
        </div>
      )}

      {/* Commission % Settings + Automatic Per-Waiter Payouts Table */}
      <div className="rounded-xl border border-[#C9A84C]/35 bg-[#14100C] p-5 space-y-4">
        <div className="flex flex-col gap-4 border-b border-[#C9A84C]/18 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C9A84C]">
              Avtomatik Hisob-Kitob · Ofitsiant Foizi
            </p>
            <h2 className="font-display mt-0.5 text-2xl font-semibold text-[#F5EDD6]">
              Ofitsiantga Necha Foiz Berilishini Kiriting — Pullar Avtomatik Hisoblanadi
            </h2>
          </div>

          <form onSubmit={handleSaveRates} className="flex flex-wrap items-end gap-2.5">
            <div>
              <label
                htmlFor="cashier-waiter-pct"
                className="block text-[11px] font-medium text-[#E5DEC9]"
              >
                Ofitsiant ulushi (%)
              </label>
              <div className="relative mt-1">
                <input
                  id="cashier-waiter-pct"
                  data-testid="cashier-waiter-pct-input"
                  type="number"
                  min={0}
                  max={50}
                  step={0.5}
                  value={commissionPctInput}
                  onChange={(e) => setCommissionPctInput(e.target.value)}
                  className="w-28 rounded-md border border-[#C9A84C]/40 bg-[#0A0806] py-1.5 pl-3 pr-7 text-sm font-bold tabular-nums text-[#E6CB7D]"
                />
                <Percent className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#C9A84C]" />
              </div>
            </div>

            <div>
              <label
                htmlFor="cashier-service-pct"
                className="block text-[11px] font-medium text-[#E5DEC9]"
              >
                Chek Xizmati (%)
              </label>
              <input
                id="cashier-service-pct"
                type="number"
                min={0}
                max={30}
                step={0.5}
                value={servicePctInput}
                onChange={(e) => setServicePctInput(e.target.value)}
                className="mt-1 w-24 rounded-md border border-[#C9A84C]/30 bg-[#0A0806] px-3 py-1.5 text-sm font-semibold tabular-nums text-[#F5EDD6]"
              />
            </div>

            <button
              type="submit"
              data-testid="cashier-save-rates-btn"
              disabled={savingSettings}
              className="rounded-md bg-[#C9A84C] px-4 py-2 text-xs font-bold text-[#0A0806] hover:bg-[#E6CB7D] disabled:opacity-50"
            >
              {savingSettings ? 'Saqlanmoqda...' : 'Foizni qo‘llash'}
            </button>
          </form>
        </div>

        {/* Per-waiter automatic financial breakdown */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#C9A84C]/18 text-[11px] uppercase tracking-wider text-[#B8AE98]">
              <tr>
                <th className="py-2.5 pr-3">Ofitsiant (Kod)</th>
                <th className="py-2.5 px-3">Faol Stollar</th>
                <th className="py-2.5 px-3">Yopiq Cheklar</th>
                <th className="py-2.5 px-3">Taomlar Savdosi</th>
                <th className="py-2.5 px-3">Foiz (%)</th>
                <th className="py-2.5 px-3 text-[#E6CB7D]">Ofitsiantga Pul (UZS)</th>
                <th className="py-2.5 pl-3 text-right text-[#A9CEBE]">Restoran Qoldig‘i</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C9A84C]/10">
              {waiterPayouts.map((row) => (
                <tr key={row.waiterId} data-testid={`cashier-waiter-row-${row.pinCode}`}>
                  <td className="py-2.5 pr-3 font-semibold text-[#F5EDD6]">
                    {row.waiterName}{' '}
                    <span className="ml-1 rounded border border-[#C9A84C]/30 bg-[#0A0806] px-1.5 py-0.5 font-mono text-[10px] text-[#E6CB7D]">
                      {row.pinCode}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[#B8AE98]">
                    {row.activeTables.length > 0
                      ? row.activeTables.map((t) => `#${t}`).join(', ')
                      : 'Bo‘sh'}
                  </td>
                  <td className="py-2.5 px-3 tabular-nums text-[#E5DEC9]">
                    {row.paidOrdersCount} ta
                  </td>
                  <td className="py-2.5 px-3 tabular-nums text-[#E5DEC9]">
                    {formatUzsPrice(row.paidSubtotalUzs)}
                  </td>
                  <td className="py-2.5 px-3 font-semibold tabular-nums text-[#E6CB7D]">
                    {row.commissionPercent}%
                  </td>
                  <td
                    data-testid={`waiter-earned-${row.pinCode}`}
                    className="py-2.5 px-3 font-bold tabular-nums text-[#E6CB7D]"
                  >
                    {formatUzsPrice(row.earnedCommissionUzs)}
                  </td>
                  <td className="py-2.5 pl-3 text-right font-semibold tabular-nums text-[#A9CEBE]">
                    {formatUzsPrice(row.restaurantNetUzs)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Split: Unpaid Queue + Soliq.uz Check Checkout Terminal */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Queue of Check Requests / Unpaid / Paid Bills */}
        <div className="space-y-4 lg:col-span-5">
          <div className="grid grid-cols-2 gap-1 rounded-lg border border-[#C9A84C]/25 bg-[#14100C] p-1 sm:grid-cols-4">
            {(
              [
                { id: 'checks', label: `Chek (${requestedCheckOrders.length})` },
                { id: 'unpaid', label: `Ochiq (${unpaidOrders.length})` },
                { id: 'paid', label: `Yopiq (${paidOrders.length})` },
                { id: 'cancelled', label: `Atmen (${cancelledOrders.length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setQueueFilter(tab.id)}
                className={`rounded-md py-2 text-xs font-semibold transition-colors ${
                  queueFilter === tab.id
                    ? 'bg-[#C9A84C] text-[#0A0806]'
                    : 'text-[#B8AE98] hover:text-[#F5EDD6]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {visibleQueue.length === 0 ? (
              <div className="rounded-xl border border-[#C9A84C]/20 bg-[#14100C] p-8 text-center text-xs text-[#B8AE98]">
                Bu bo‘limda hozircha cheklar yo‘q.
              </div>
            ) : (
              visibleQueue.map((order) => {
                const isSelected = activeOrder?.id === order.id;
                return (
                  <button
                    key={order.id}
                    type="button"
                    data-testid={`cashier-queue-${order.id}`}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-[#E6CB7D] bg-[#1C160E] shadow-md'
                        : order.checkRequested && order.status !== 'Paid'
                          ? 'border-[#2D4A3E] bg-[#101915]'
                          : 'border-[#C9A84C]/20 bg-[#14100C] hover:border-[#C9A84C]/55'
                    }`}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-[#0A0806] px-2 py-0.5 text-xs font-bold text-[#E6CB7D]">
                          Stol #{order.tableNumber}
                        </span>
                        <span className="font-mono text-xs text-[#B8AE98]">{order.code}</span>
                        {order.checkRequested && order.status !== 'Paid' && (
                          <span className="rounded bg-[#2D4A3E]/55 px-1.5 py-0.5 text-[10px] font-semibold text-[#A9CEBE]">
                            Soliq QR
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-xs text-[#E5DEC9]">
                        {order.waiterName
                          ? `Ofitsiant: ${order.waiterName}`
                          : `Manba: ${order.source.toUpperCase()}`}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="block text-sm font-bold tabular-nums text-[#F5EDD6]">
                        {formatUzsPrice(order.totalUzs)}
                      </span>
                      <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-[#C9A84C]">
                        <Clock className="h-3 w-3" />
                        {order.status === 'Paid'
                          ? formatPaymentMethodLabel(order.paymentMethod || 'Cash')
                          : order.checkRequested
                            ? 'Chek so‘ralgan'
                            : order.status}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Quick Cashier Petty Cash & Supply Expense Box (Un, Shakar, Cheesecake va h.k.) */}
          <form
            onSubmit={handleQuickExpense}
            className="rounded-xl border border-[#8B3A2A]/50 bg-[#17100E] p-4 space-y-3"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-[#F0A495]">
              <div className="flex items-center gap-1.5">
                <MinusCircle className="h-4 w-4" />
                <span>Kassadan chiqim & xomashyo ta’minoti</span>
              </div>
              <span className="text-[10px] text-[#B8AE98]">Naqd kassa</span>
            </div>

            {/* Quick 1-click expense templates (Un, Shakar, Cheesecake, Go'sht...) */}
            <div>
              <p className="text-[10px] uppercase font-bold text-[#C9A84C] tracking-wider mb-1.5">
                Tezkor shablonlar (Bosing va to‘ldiring):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_EXPENSE_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.title}
                    type="button"
                    onClick={() => handleApplyExpenseTemplate(tmpl)}
                    className="inline-flex items-center gap-1 rounded border border-[#8B3A2A]/60 bg-[#0A0806] px-2 py-1 text-[11px] text-[#F5EDD6] hover:border-[#E6CB7D] hover:bg-[#201511] transition-colors"
                  >
                    <span>{tmpl.emoji}</span>
                    <span>{tmpl.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <input
                type="text"
                aria-label="Kassa chiqim nomi"
                value={expenseTitle}
                onChange={(e) => setExpenseTitle(e.target.value)}
                placeholder="Xarajat nomi (masalan: 2 qop un)"
                className="sm:col-span-2 rounded border border-[#C9A84C]/25 bg-[#0A0806] px-3 py-1.5 text-xs text-[#F5EDD6] placeholder-[#B8AE98]/60 focus:border-[#E6CB7D] focus:outline-none"
              />
              <input
                type="number"
                aria-label="Kassa chiqim summasi"
                min={1000}
                step={1000}
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                placeholder="UZS summa"
                className="rounded border border-[#C9A84C]/25 bg-[#0A0806] px-3 py-1.5 text-xs tabular-nums text-[#F5EDD6] placeholder-[#B8AE98]/60 focus:border-[#E6CB7D] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={expenseSaving || !expenseTitle.trim() || !expenseAmount}
              className="w-full rounded border border-[#8B3A2A] bg-[#8B3A2A]/35 py-2 text-xs font-bold text-[#F5EDD6] hover:bg-[#8B3A2A]/60 disabled:opacity-50 transition-colors"
            >
              {expenseSaving ? 'Saqlanmoqda...' : 'Chiqimni hisob-kitobga kiritish'}
            </button>
          </form>
        </div>

        {/* Right: Active Receipt Preview & Soliq.uz QR Checkout Controls */}
        <div className="lg:col-span-7">
          {!activeOrder ? (
            <div className="flex h-full min-h-[340px] flex-col items-center justify-center rounded-xl border border-[#C9A84C]/20 bg-[#14100C] p-10 text-center">
              <Receipt className="h-10 w-10 text-[#C9A84C]/60" />
              <p className="font-display mt-3 text-2xl text-[#F5EDD6]">Chek tanlanmagan</p>
              <p className="mt-1 text-xs text-[#B8AE98]">
                Chap ro‘yxatdan to‘lov qilinadigan stol buyurtmasini tanlang.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-[#C9A84C]/35 bg-[#14100C] p-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#C9A84C]/18 pb-4">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#C9A84C]">
                    Soliq.uz Fiskal Chek · Kassa Terminali
                  </p>
                  <h2 className="font-display mt-1 text-3xl font-semibold text-[#F5EDD6]">
                    Stol #{activeOrder.tableNumber} · {activeOrder.code}
                  </h2>
                  <p className="mt-0.5 text-xs text-[#B8AE98]">
                    Ofitsiant:{' '}
                    <span className="font-semibold text-[#E6CB7D]">
                      {activeOrder.waiterName
                        ? `${activeOrder.waiterName} (${activeOrder.waiterCode})`
                        : `O‘z-o‘ziga (${activeOrder.source.toUpperCase()})`}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    data-testid="cashier-soliq-qr-btn"
                    disabled={busyId === activeOrder.id}
                    onClick={handleGenerateSoliqCheck}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#C9A84C] bg-[#C9A84C]/15 px-3 py-1.5 text-xs font-semibold text-[#E6CB7D] hover:bg-[#C9A84C] hover:text-[#0A0806]"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    <span>
                      {activeOrder.fiscalReceipt
                        ? 'Soliq.uz QR Chek'
                        : 'Soliq.uz Elektron Chek'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#C9A84C]/35 bg-[#0A0806] px-3 py-1.5 text-xs font-medium text-[#E6CB7D] hover:border-[#C9A84C]"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Chop etish</span>
                  </button>
                </div>
              </div>

              {/* Itemized Receipt Lines + Soliq.uz Inline QR */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                <div className="rounded-lg border border-[#C9A84C]/18 bg-[#0A0806] p-4 space-y-2.5 md:col-span-8">
                  {activeOrder.items.map((item) => (
                    <div
                      key={`${activeOrder.id}-${item.dishId}`}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="text-[#F5EDD6]">
                        <span className="font-semibold text-[#E6CB7D]">{item.quantity}×</span>{' '}
                        {item.name}
                      </span>
                      <span className="tabular-nums text-[#E5DEC9]">
                        {formatUzsPrice(item.priceUzs * item.quantity)}
                      </span>
                    </div>
                  ))}

                  <div className="border-t border-[#C9A84C]/15 pt-2.5 space-y-1 text-xs">
                    <div className="flex justify-between text-[#B8AE98]">
                      <span>Taomlar summasi:</span>
                      <span className="tabular-nums text-[#E5DEC9]">
                        {formatUzsPrice(
                          activeOrder.subtotalUzs ?? computeOrderTotalUzs(activeOrder.items),
                        )}
                      </span>
                    </div>
                    {(activeOrder.serviceFeeUzs ?? 0) > 0 && (
                      <div className="flex justify-between text-[#B8AE98]">
                        <span>Xizmat haqi ({settings.serviceChargePercent}%):</span>
                        <span className="tabular-nums text-[#E5DEC9]">
                          {formatUzsPrice(activeOrder.serviceFeeUzs ?? 0)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-[#C9A84C]/20 pt-2">
                      <span className="text-sm font-semibold text-[#B8AE98]">JAMI TO‘LOV</span>
                      <span className="font-display text-3xl font-bold tabular-nums text-[#E6CB7D]">
                        {formatUzsPrice(activeOrder.totalUzs)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Inline Soliq.uz QR Card */}
                <div className="flex flex-col items-center justify-center rounded-lg border border-[#C9A84C]/25 bg-[#0A0806] p-3.5 text-center md:col-span-4">
                  {activeOrder.fiscalReceipt ? (
                    <>
                      <QrCodeGraphic
                        value={activeOrder.fiscalReceipt.soliqUrl}
                        alt={`Soliq.uz QR ${activeOrder.fiscalReceipt.receiptNumber}`}
                        size={128}
                        className="h-28 w-28 rounded border border-[#C9A84C]/50 bg-[#F5EDD6] p-1.5"
                      />
                      <span className="mt-2 font-mono text-[10px] font-semibold text-[#E6CB7D]">
                        {activeOrder.fiscalReceipt.fiscalSign}
                      </span>
                      <span className="text-[10px] text-[#A9CEBE]">Soliq.uz OFD tayyor</span>
                    </>
                  ) : (
                    <>
                      <QrCode className="h-10 w-10 text-[#C9A84C]/45" />
                      <p className="mt-2 text-[11px] text-[#B8AE98]">
                        Chek yopilganda yoki «Soliq.uz Elektron Chek» bosilganda QR kod shakllanadi.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Payment Action Controls */}
              {activeOrder.status !== 'Paid' && activeOrder.status !== 'Cancelled' ? (
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-medium text-[#E5DEC9]">
                      To‘lov turini tanlang:
                    </p>
                    <div className="grid grid-cols-3 gap-2.5">
                      {(
                        [
                          { id: 'Cash', label: 'Naqd (Cash)', icon: Banknote },
                          { id: 'Card', label: 'Karta (Humo/Uzcard)', icon: CreditCard },
                          { id: 'PaymeClick', label: 'Payme / Click', icon: Smartphone },
                        ] as const
                      ).map((m) => {
                        const Icon = m.icon;
                        const selected = paymentMethod === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            data-testid={`cashier-method-${m.id}`}
                            onClick={() => setPaymentMethod(m.id)}
                            className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border px-3 py-3 text-xs font-semibold transition-all ${
                              selected
                                ? 'border-[#E6CB7D] bg-[#C9A84C]/20 text-[#E6CB7D]'
                                : 'border-[#C9A84C]/20 bg-[#0A0806] text-[#B8AE98] hover:text-[#F5EDD6]'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{m.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 sm:flex-row">
                    <button
                      type="button"
                      data-testid="cashier-close-paid-btn"
                      disabled={busyId === activeOrder.id}
                      onClick={handleCloseBillPaid}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#2D4A3E] px-5 py-3 text-sm font-bold text-[#F5EDD6] shadow-md transition-colors hover:bg-[#3A6151] disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        {busyId === activeOrder.id
                          ? 'Yopilmoqda...'
                          : `To‘landi (${formatPaymentMethodLabel(paymentMethod)}) — Chekni yopish`}
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={busyId === activeOrder.id}
                      onClick={handleCancelUnpaid}
                      className="rounded-lg border border-[#8B3A2A]/70 px-4 py-3 text-xs font-semibold text-[#F0A495] hover:bg-[#8B3A2A]/25"
                    >
                      Atmen qilish
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-[#2D4A3E] bg-[#111915] px-4 py-3 text-xs text-[#A9CEBE]">
                  Holat:{' '}
                  {activeOrder.status === 'Paid'
                    ? `To‘langan (${formatPaymentMethodLabel(activeOrder.paymentMethod || 'Cash')}) — Kirim-Chiqim & Ofitsiant ulushi hisoblangan.`
                    : `Atmen qilingan (${activeOrder.cancelReason || 'Bekor qilindi'}).`}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <FiscalReceiptModal
        order={viewingArchiveReceipt || modalReceiptOrder}
        onClose={() => {
          setModalReceiptOrderId(null);
          setViewingArchiveReceipt(null);
        }}
      />

      <ShiftSummaryModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        orders={orders}
        ledger={ledger}
        waiters={waiters}
        settings={settings}
        onCloseDailyShift={onCloseDailyShift}
        onViewArchive={() => {
          setIsShiftModalOpen(false);
          setIsArchiveModalOpen(true);
        }}
      />

      <ReceiptArchiveModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        receiptArchive={receiptArchive}
        onClearArchive={onClearReceiptArchive}
        onViewReceipt={(receipt) => {
          setViewingArchiveReceipt(receipt);
        }}
      />
    </div>
  );
}
