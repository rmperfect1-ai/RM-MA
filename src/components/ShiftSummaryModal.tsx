import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  HelpCircle,
  Moon,
  Printer,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type {
  LedgerEntry,
  Order,
  RestaurantSettings,
  WaiterProfile,
} from '../types/restaurant';
import {
  computeDayEndShiftSummary,
  formatUzsPrice,
} from '../utils/restaurantLogic';

interface ShiftSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  ledger: LedgerEntry[];
  waiters: WaiterProfile[];
  settings: RestaurantSettings;
  onCloseDailyShift?: (options: {
    archiveChecks: boolean;
    closedBy?: string;
  }) => Promise<{ archivedCount: number; remainingActiveCount: number; totalArchivedSaved: number }>;
  onViewArchive?: () => void;
}

export function ShiftSummaryModal({
  isOpen,
  onClose,
  orders,
  ledger,
  waiters,
  settings,
  onCloseDailyShift,
  onViewArchive,
}: ShiftSummaryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setFeedbackMsg('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const todayIso = new Date().toISOString().slice(0, 10);
  const summary = computeDayEndShiftSummary(orders, ledger, waiters, settings, todayIso);

  const handleDeclineArchive = () => {
    setFeedbackMsg(
      'Cheklar aktiv holatda qoldirildi. Kassir ishchilar pulini berib bo‘lgach yoki tozalash ishlari tugagach, istalgan payt arxivlash mumkin.',
    );
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleConfirmArchive = async () => {
    if (!onCloseDailyShift) return;
    setIsSubmitting(true);
    setFeedbackMsg('');
    try {
      const res = await onCloseDailyShift({
        archiveChecks: true,
        closedBy: 'Bosh Kassir',
      });
      setFeedbackMsg(
        `Kunlik smena yopildi! ${res.archivedCount} ta chek arxivlandi va xotirada 1 oy (30 kun) davomida saqlanadi.`,
      );
      setTimeout(() => {
        onClose();
      }, 1600);
    } catch (err) {
      setFeedbackMsg(err instanceof Error ? err.message : 'Arxivlashda xatolik yuz berdi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Kunlik Smena Hisoboti va Ofitsiantlar Taqsimoti"
      data-testid="shift-summary-modal"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-3 sm:p-5 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="my-auto w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border border-[#C9A84C]/50 bg-[#120E0A] p-5 sm:p-7 text-[#F5EDD6] shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#C9A84C]/25 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A84C]/35 bg-[#C9A84C]/15 px-3 py-1 text-xs font-semibold text-[#E6CB7D]">
              <Moon className="h-3.5 w-3.5" />
              <span>KUNNI YOPISH & SMENA HISOBOTI</span>
            </div>
            <h2 className="font-display mt-2 text-2xl sm:text-3xl font-bold text-[#F5EDD6]">
              Sayqal Restaurant · Kunlik Kassa & Ishchilar Hisoboti
            </h2>
            <p className="mt-1 text-xs text-[#B8AE98]">
              Sana:{' '}
              <span className="font-semibold text-[#E6CB7D]">
                {new Date().toLocaleDateString('uz-UZ', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>{' '}
              · Barcha to‘lovlar, xomashyo chiqimlari va ofitsiantlar ulushi
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="shift-print-pdf-btn"
              onClick={handlePrintPdf}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9A84C] bg-[#C9A84C]/20 px-3.5 py-2 text-xs font-bold text-[#E6CB7D] transition-colors hover:bg-[#C9A84C] hover:text-[#0A0806]"
            >
              <Printer className="h-4 w-4" />
              <span>PDF ga Saqlash / Chop etish</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Yopish"
              className="rounded-lg border border-[#C9A84C]/30 bg-[#1A140E] p-2 text-[#B8AE98] hover:text-[#F5EDD6]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {feedbackMsg && (
          <div
            role="status"
            className="rounded-xl border border-[#2D4A3E] bg-[#121D18] p-4 text-xs font-semibold text-[#A9CEBE]"
          >
            {feedbackMsg}
          </div>
        )}

        {/* 4 Financial Key Metrics */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#2D4A3E] bg-[#111915] p-4">
            <div className="flex items-center justify-between text-xs text-[#A9CEBE]">
              <span>Jami Kassa Tushumi</span>
              <Wallet className="h-4 w-4" />
            </div>
            <p className="font-display mt-1.5 text-2xl font-bold tabular-nums text-[#F5EDD6]">
              {formatUzsPrice(summary.totalSalesUzs)}
            </p>
            <p className="mt-1 text-[11px] text-[#A9CEBE]">
              {summary.totalPaidChecks} ta chek yopilgan
            </p>
            <div className="mt-2 border-t border-[#2D4A3E]/60 pt-1.5 text-[10px] space-y-0.5 text-[#B8AE98]">
              <div>Naqd: {formatUzsPrice(summary.cashSalesUzs)}</div>
              <div>Karta: {formatUzsPrice(summary.cardSalesUzs)}</div>
              <div>Payme/Click: {formatUzsPrice(summary.digitalSalesUzs)}</div>
            </div>
          </div>

          <div className="rounded-xl border border-[#8B3A2A]/40 bg-[#17100E] p-4">
            <div className="flex items-center justify-between text-xs text-[#F0A495]">
              <span>Jami Chiqim (Xomashyo)</span>
              <Banknote className="h-4 w-4" />
            </div>
            <p className="font-display mt-1.5 text-2xl font-bold tabular-nums text-[#F5EDD6]">
              {formatUzsPrice(summary.totalExpensesUzs)}
            </p>
            <p className="mt-1 text-[11px] text-[#F0A495]">
              Un, shakar, cheesecake va h.k.
            </p>
            <div className="mt-2 border-t border-[#8B3A2A]/40 pt-1.5 text-[10px] space-y-0.5 text-[#B8AE98]">
              <div>Ta’minot/Bozor: {formatUzsPrice(summary.supplyExpensesUzs)}</div>
              <div>Maosh to‘lovlari: {formatUzsPrice(summary.payrollExpensesUzs)}</div>
              <div>Boshqa xarajat: {formatUzsPrice(summary.otherExpensesUzs)}</div>
            </div>
          </div>

          <div className="rounded-xl border border-[#C9A84C]/45 bg-[#17120C] p-4">
            <div className="flex items-center justify-between text-xs text-[#E6CB7D]">
              <span>Ofitsiantlar Maoshi</span>
              <Users className="h-4 w-4" />
            </div>
            <p className="font-display mt-1.5 text-2xl font-bold tabular-nums text-[#E6CB7D]">
              {formatUzsPrice(summary.totalWaiterPayableUzs)}
            </p>
            <p className="mt-1 text-[11px] text-[#B8AE98]">
              {summary.waiterPayouts.length} nafar ofitsiantga
            </p>
            <div className="mt-2 border-t border-[#C9A84C]/25 pt-1.5 text-[10px] text-[#E5DEC9]">
              Stavkasi: {settings.defaultWaiterCommissionPercent}% asosida avtomatik
            </div>
          </div>

          <div className="rounded-xl border border-[#C9A84C]/60 bg-[#1A140E] p-4">
            <div className="flex items-center justify-between text-xs text-[#E6CB7D]">
              <span>Restoran Sof Qoldig‘i</span>
              <ShieldCheck className="h-4 w-4" />
            </div>
            <p className="font-display mt-1.5 text-2xl font-bold tabular-nums text-[#A9CEBE]">
              {formatUzsPrice(summary.netRestaurantProfitUzs)}
            </p>
            <p className="mt-1 text-[11px] text-[#A9CEBE]">
              Sof foyda (Kassa qoldig‘i)
            </p>
            <div className="mt-2 border-t border-[#C9A84C]/25 pt-1.5 text-[10px] text-[#B8AE98]">
              Tushum - Chiqim - Maosh
            </div>
          </div>
        </div>

        {/* Section: Waiter Payouts ("Qaysi ofitsiantga qancha berish kerak") */}
        <div className="rounded-xl border border-[#C9A84C]/35 bg-[#14100C] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#C9A84C]">
                Ishchilar Taqsimoti
              </p>
              <h3 className="text-base font-semibold text-[#F5EDD6]">
                Qaysi Ofitsiantga Qancha Pul Berish Kerak?
              </h3>
            </div>
            <span className="rounded bg-[#0A0806] px-2.5 py-1 text-xs font-semibold text-[#E6CB7D] border border-[#C9A84C]/30">
              Jami beriladigan: {formatUzsPrice(summary.totalWaiterPayableUzs)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#C9A84C]/20 text-[11px] uppercase tracking-wider text-[#B8AE98]">
                <tr>
                  <th className="py-2.5 pr-3">Ofitsiant Ismi</th>
                  <th className="py-2.5 px-3">Shaxsiy Kodi</th>
                  <th className="py-2.5 px-3">Xizmat Qilingan Stollar</th>
                  <th className="py-2.5 px-3">Jami Savdosi</th>
                  <th className="py-2.5 px-3">Ulush (%)</th>
                  <th className="py-2.5 pl-3 text-right text-[#E6CB7D]">
                    Beriladigan Pul (UZS)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C9A84C]/10">
                {summary.waiterPayouts.map((row) => (
                  <tr key={row.waiterId} data-testid={`shift-waiter-payout-${row.pinCode}`}>
                    <td className="py-2.5 pr-3 font-semibold text-[#F5EDD6]">
                      {row.waiterName}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#E6CB7D]">
                      {row.pinCode}
                    </td>
                    <td className="py-2.5 px-3 tabular-nums text-[#B8AE98]">
                      {row.tablesServedCount} ta stol
                    </td>
                    <td className="py-2.5 px-3 tabular-nums text-[#E5DEC9]">
                      {formatUzsPrice(row.salesUzs)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#C9A84C]">
                      {row.commissionPercent}%
                    </td>
                    <td className="py-2.5 pl-3 text-right font-display text-base font-bold tabular-nums text-[#E6CB7D]">
                      {formatUzsPrice(row.payableCommissionUzs)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section: Shift Closing Confirmation & Archive Decision (Prompt required by user) */}
        <div className="rounded-xl border border-[#C9A84C]/50 bg-[#17120C] p-5 sm:p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-[#C9A84C]/20 p-2 text-[#E6CB7D]">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#F5EDD6]">
                Ish kuni tugadi: Bugungi to‘langan cheklar arxivlansinmi?
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-[#B8AE98]">
                Agar hozir hisob-kitob qilayotgan bo‘lsangiz, ishchilarning pulini berib olayotgan
                yoki zalda tozalash ishlari ketayotgan bo‘lsa, <span className="text-[#F0A495] font-semibold">«Yo‘q, hisoblayapman»</span> tugmasini bosing — cheklar POS ro‘yxatida aktiv saqlanadi.
                <br />
                Agar kun yakunlangan bo‘lsa, <span className="text-[#A9CEBE] font-semibold">«Ha, arxivlansin»</span> tugmasini bosing — to‘langan cheklar xotiradagi <span className="text-[#E6CB7D]">«Cheklar Tarixi»</span>ga o‘tkaziladi va <span className="text-[#E6CB7D] font-bold">1 oy (30 kun)</span> davomida saqlanadi, so‘ng avtomatik tarzda tozalanadi.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
            <button
              type="button"
              data-testid="shift-decline-archive-btn"
              disabled={isSubmitting}
              onClick={handleDeclineArchive}
              className="rounded-lg border border-[#8B3A2A]/80 bg-[#8B3A2A]/30 px-5 py-3 text-xs font-semibold text-[#F0A495] hover:bg-[#8B3A2A]/50 transition-colors"
            >
              Yo‘q, hisoblayapman / ishchilar pulini beryapman (Faol qoldirish)
            </button>

            <button
              type="button"
              data-testid="shift-confirm-archive-btn"
              disabled={isSubmitting}
              onClick={handleConfirmArchive}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2D4A3E] px-6 py-3 text-xs font-bold text-[#F5EDD6] hover:bg-[#3A6151] transition-colors shadow-lg disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {isSubmitting
                  ? 'Arxivlanmoqda...'
                  : 'Ha, barcha to‘langan cheklar arxivlansin (1 oy saqlash)'}
              </span>
            </button>
          </div>
        </div>

        {/* PRINTABLE PDF CONTAINER (Hidden on screen, rendered by window.print()) */}
        <div className="hidden printable-document p-6">
          <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '12px' }}>
            <h1 style={{ margin: 0, fontSize: '20pt', fontWeight: 'bold' }}>SAYQAL FAMILY RESTAURANT</h1>
            <p style={{ margin: '4px 0', fontSize: '11pt' }}>KUNLIK SMENA HISOBOTI & ISHCHILARNING MAOSH TAQSIMOTI</p>
            <p style={{ margin: 0, fontSize: '10pt', color: '#555' }}>Sana: {todayIso} · Kassir: Bosh Kassir</p>
          </div>

          <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #333', paddingBottom: '4px' }}>1. MOLIYAVIY KASSA XULOSASI</h3>
          <table style={{ marginBottom: '18px' }}>
            <tbody>
              <tr>
                <td><strong>Jami Savdo (Kassa Tushumi):</strong></td>
                <td>{formatUzsPrice(summary.totalSalesUzs)} ({summary.totalPaidChecks} ta chek)</td>
              </tr>
              <tr>
                <td>Naqd tushum:</td>
                <td>{formatUzsPrice(summary.cashSalesUzs)}</td>
              </tr>
              <tr>
                <td>Plastik karta:</td>
                <td>{formatUzsPrice(summary.cardSalesUzs)}</td>
              </tr>
              <tr>
                <td>Payme / Click:</td>
                <td>{formatUzsPrice(summary.digitalSalesUzs)}</td>
              </tr>
              <tr>
                <td><strong>Jami Chiqim (Xomashyo & Xarajatlar):</strong></td>
                <td>{formatUzsPrice(summary.totalExpensesUzs)}</td>
              </tr>
              <tr>
                <td><strong>Jami Ofitsiantlar Ulushi (Maosh):</strong></td>
                <td>{formatUzsPrice(summary.totalWaiterPayableUzs)}</td>
              </tr>
              <tr>
                <td><strong>RESTORANNING SOF QOLDIG‘I (FOYDA):</strong></td>
                <td><strong>{formatUzsPrice(summary.netRestaurantProfitUzs)}</strong></td>
              </tr>
            </tbody>
          </table>

          <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #333', paddingBottom: '4px' }}>2. OFITSIANTLARGA BERILADIGAN MAOSH (ULUSH)</h3>
          <table>
            <thead>
              <tr>
                <th>Ofitsiant</th>
                <th>Kodi</th>
                <th>Stollar soni</th>
                <th>Jami savdosi</th>
                <th>Foiz</th>
                <th>Beriladigan pul (UZS)</th>
                <th>Imzo</th>
              </tr>
            </thead>
            <tbody>
              {summary.waiterPayouts.map((w) => (
                <tr key={`print-${w.waiterId}`}>
                  <td>{w.waiterName}</td>
                  <td>{w.pinCode}</td>
                  <td>{w.tablesServedCount} ta</td>
                  <td>{formatUzsPrice(w.salesUzs)}</td>
                  <td>{w.commissionPercent}%</td>
                  <td><strong>{formatUzsPrice(w.payableCommissionUzs)}</strong></td>
                  <td style={{ minWidth: '90px' }}></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', fontSize: '10pt' }}>
            <div>
              <p>Bosh Kassir: ___________________</p>
              <p>Menejer: ___________________</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p>Chop etilgan vaqt: {new Date().toLocaleTimeString('uz-UZ')}</p>
              <p>Soliq.uz OFD muvofiqligi tasdiqlangan</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
