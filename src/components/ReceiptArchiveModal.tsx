import {
  Archive,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Printer,
  QrCode,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ArchivedReceipt } from '../types/restaurant';
import { formatPaymentMethodLabel, formatUzsPrice } from '../utils/restaurantLogic';

interface ReceiptArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptArchive: ArchivedReceipt[];
  onClearArchive?: () => Promise<{ clearedCount: number }>;
  onViewReceipt: (receipt: ArchivedReceipt) => void;
}

export function ReceiptArchiveModal({
  isOpen,
  onClose,
  receiptArchive,
  onClearArchive,
  onViewReceipt,
}: ReceiptArchiveModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setShowClearConfirm(false);
      setFeedback('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredArchive = receiptArchive.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.code.toLowerCase().includes(q) ||
      r.tableNumber.toLowerCase().includes(q) ||
      (r.waiterName && r.waiterName.toLowerCase().includes(q)) ||
      (r.waiterCode && r.waiterCode.toLowerCase().includes(q)) ||
      (r.fiscalReceipt?.receiptNumber && r.fiscalReceipt.receiptNumber.toLowerCase().includes(q))
    );
  });

  const totalArchivedSumUzs = receiptArchive.reduce((sum, r) => sum + r.totalUzs, 0);

  const handleClear = async () => {
    if (!onClearArchive) return;
    setIsClearing(true);
    setFeedback('');
    try {
      const res = await onClearArchive();
      setFeedback(`Kassir ruxsati bilan barcha arxivlangan cheklar (${res.clearedCount} ta) xotiradan tozalandi.`);
      setShowClearConfirm(false);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Tarixni tozalashda xatolik yuz berdi.');
    } finally {
      setIsClearing(false);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cheklar Tarixi va Xotirasi Arxiv"
      data-testid="receipt-archive-modal"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-3 sm:p-5 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="my-auto w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl border border-[#C9A84C]/50 bg-[#120E0A] p-5 sm:p-7 text-[#F5EDD6] shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#C9A84C]/25 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A84C]/35 bg-[#C9A84C]/15 px-3 py-1 text-xs font-semibold text-[#E6CB7D]">
              <Archive className="h-3.5 w-3.5" />
              <span>CHEKLAR XOTIRASI (1 OY SAQLASH ARXIVI)</span>
            </div>
            <h2 className="font-display mt-2 text-2xl sm:text-3xl font-bold text-[#F5EDD6]">
              Cheklar Tarixi & Arxiv Xotirasi
            </h2>
            <p className="mt-1 text-xs text-[#B8AE98]">
              Jami saqlangan:{' '}
              <span className="font-bold text-[#E6CB7D]">{receiptArchive.length} ta chek</span>{' '}
              · Qiymati:{' '}
              <span className="font-bold text-[#A9CEBE]">{formatUzsPrice(totalArchivedSumUzs)}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="archive-print-pdf-btn"
              onClick={handlePrintPdf}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9A84C] bg-[#C9A84C]/20 px-3.5 py-2 text-xs font-bold text-[#E6CB7D] hover:bg-[#C9A84C] hover:text-[#0A0806] transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>PDF ga Saqlash / Chop etish</span>
            </button>

            {receiptArchive.length > 0 && (
              <button
                type="button"
                data-testid="archive-clear-prompt-btn"
                onClick={() => setShowClearConfirm(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#8B3A2A]/70 bg-[#8B3A2A]/25 px-3 py-2 text-xs font-semibold text-[#F0A495] hover:bg-[#8B3A2A]/45 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Tarixni tozalash</span>
              </button>
            )}

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

        {/* 30-Day Retention Notice Banner */}
        <div className="rounded-xl border border-[#C9A84C]/35 bg-[#17120C] p-4 text-xs text-[#B8AE98] flex items-start gap-3">
          <Clock className="h-5 w-5 shrink-0 text-[#E6CB7D] mt-0.5" />
          <div>
            <span className="font-semibold text-[#E6CB7D]">
              30 Kunlik Avtomatik Saqlash Siyosati:
            </span>{' '}
            Barcha to‘langan cheklar xotirada 1 oy (30 kun) davomida to‘liq saqlanib turadi. Agar
            kassir etiborsizlik qilib tozalashni unutsa, tizim 30 kundan oshgan eski cheklarni
            avtomatik ravishda o‘chiradi. Barcha ma’lumotlarni istalgan paytda PDF shaklida saqlab
            olishingiz yoki kassir ruxsati orqali tozalashingiz mumkin.
          </div>
        </div>

        {feedback && (
          <div
            role="status"
            className="rounded-xl border border-[#2D4A3E] bg-[#121D18] p-4 text-xs font-semibold text-[#A9CEBE]"
          >
            {feedback}
          </div>
        )}

        {/* Clear Confirmation Prompt Dialog */}
        {showClearConfirm && (
          <div className="rounded-xl border border-[#8B3A2A] bg-[#22100C] p-4 sm:p-5 space-y-3">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-6 w-6 text-[#F0A495] shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-[#F5EDD6]">
                  Kassir ruxsati bilan barcha cheklar tarixi o‘chirilsinmi?
                </h4>
                <p className="mt-1 text-xs text-[#B8AE98]">
                  Bu amal xotiradagi barcha {receiptArchive.length} ta arxivlangan chekni o‘chiradi.
                  Iltimos, agar hisobot kerak bo‘lsa, avval «PDF ga Saqlash» tugmasi orqali yuklab
                  oling.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="rounded-lg border border-[#C9A84C]/30 px-3.5 py-1.5 text-xs text-[#B8AE98] hover:text-[#F5EDD6]"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                data-testid="archive-confirm-clear-btn"
                disabled={isClearing}
                onClick={handleClear}
                className="rounded-lg bg-[#8B3A2A] px-4 py-1.5 text-xs font-bold text-[#F5EDD6] hover:bg-[#A34330] disabled:opacity-50"
              >
                {isClearing ? 'Tozalanmoqda...' : 'Ha, tarix tozalansin'}
              </button>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C9A84C]" />
          <input
            type="text"
            aria-label="Cheklar ichidan qidirish"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Qidirish: Stol raqami (#4), ofitsiant (Doston), chek kodi yoki fiskal raqam..."
            className="w-full rounded-xl border border-[#C9A84C]/30 bg-[#0A0806] py-2.5 pl-10 pr-4 text-xs text-[#F5EDD6] placeholder-[#B8AE98]/60 focus:border-[#E6CB7D] focus:outline-none"
          />
        </div>

        {/* Archive Receipts Table */}
        <div className="rounded-xl border border-[#C9A84C]/25 bg-[#14100C] overflow-hidden">
          {filteredArchive.length === 0 ? (
            <div className="p-10 text-center text-xs text-[#B8AE98]">
              {receiptArchive.length === 0
                ? 'Arxivda hozircha cheklar mavjud emas. Smena yopilganda to‘langan cheklar bu yerga o‘tadi.'
                : 'Qidiruv bo‘yicha chek topilmadi.'}
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[480px]">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#0A0806] border-b border-[#C9A84C]/20 text-[11px] uppercase tracking-wider text-[#B8AE98]">
                  <tr>
                    <th className="py-3 px-3">Chek Kodi</th>
                    <th className="py-3 px-3">Stol</th>
                    <th className="py-3 px-3">Ofitsiant</th>
                    <th className="py-3 px-3">Sana & Vaqt</th>
                    <th className="py-3 px-3">To‘lov turi</th>
                    <th className="py-3 px-3 text-[#E6CB7D]">Summa (UZS)</th>
                    <th className="py-3 px-3">Soliq.uz OFD</th>
                    <th className="py-3 pr-3 text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C9A84C]/10">
                  {filteredArchive.map((receipt) => (
                    <tr
                      key={receipt.id}
                      data-testid={`archived-receipt-row-${receipt.code}`}
                      className="hover:bg-[#1A140E] transition-colors"
                    >
                      <td className="py-3 px-3 font-mono font-semibold text-[#F5EDD6]">
                        {receipt.code}
                      </td>
                      <td className="py-3 px-3">
                        <span className="rounded bg-[#0A0806] px-2 py-0.5 font-bold text-[#E6CB7D] border border-[#C9A84C]/30">
                          #{receipt.tableNumber}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#E5DEC9]">
                        {receipt.waiterName ? (
                          <span>
                            {receipt.waiterName}{' '}
                            <span className="text-[10px] font-mono text-[#C9A84C]">
                              ({receipt.waiterCode})
                            </span>
                          </span>
                        ) : (
                          <span className="text-[#B8AE98]">O‘z-o‘ziga</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[11px] text-[#B8AE98]">
                        {new Date(receipt.closedAt).toLocaleString('uz-UZ', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-3 text-[#E5DEC9]">
                        {formatPaymentMethodLabel(receipt.paymentMethod)}
                      </td>
                      <td className="py-3 px-3 font-bold tabular-nums text-[#E6CB7D]">
                        {formatUzsPrice(receipt.totalUzs)}
                      </td>
                      <td className="py-3 px-3">
                        {receipt.fiscalReceipt ? (
                          <span className="inline-flex items-center gap-1 rounded bg-[#2D4A3E]/40 px-2 py-0.5 text-[10px] font-semibold text-[#A9CEBE] border border-[#2D4A3E]">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>OFD Tayyor</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#B8AE98]">Fiskal</span>
                        )}
                      </td>
                      <td className="py-3 pr-3 text-right">
                        <button
                          type="button"
                          onClick={() => onViewReceipt(receipt)}
                          className="inline-flex items-center gap-1 rounded bg-[#C9A84C]/15 px-2.5 py-1 text-[11px] font-semibold text-[#E6CB7D] border border-[#C9A84C]/35 hover:bg-[#C9A84C] hover:text-[#0A0806] transition-colors"
                        >
                          <QrCode className="h-3 w-3" />
                          <span>Ko‘rish</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PRINTABLE PDF CONTAINER FOR ARCHIVE */}
        <div className="hidden printable-document p-6">
          <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '12px' }}>
            <h1 style={{ margin: 0, fontSize: '18pt', fontWeight: 'bold' }}>SAYQAL FAMILY RESTAURANT</h1>
            <p style={{ margin: '4px 0', fontSize: '11pt' }}>CHEKLAR XOTIRASI VA ARXIV RO‘YXATI (1 OYLIK SAQLASH)</p>
            <p style={{ margin: 0, fontSize: '10pt', color: '#555' }}>
              Chop etilgan sana: {new Date().toLocaleDateString('uz-UZ')} · Jami cheklar soni: {receiptArchive.length} ta · Jami summa: {formatUzsPrice(totalArchivedSumUzs)}
            </p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Chek Kodi</th>
                <th>Stol #</th>
                <th>Ofitsiant</th>
                <th>Sana & Vaqt</th>
                <th>To‘lov turi</th>
                <th>Summa (UZS)</th>
                <th>Fiskal Raqam</th>
              </tr>
            </thead>
            <tbody>
              {receiptArchive.map((r) => (
                <tr key={`print-arch-${r.id}`}>
                  <td>{r.code}</td>
                  <td>#{r.tableNumber}</td>
                  <td>{r.waiterName ? `${r.waiterName} (${r.waiterCode})` : 'O‘z-o‘ziga'}</td>
                  <td>{new Date(r.closedAt).toLocaleString('uz-UZ')}</td>
                  <td>{formatPaymentMethodLabel(r.paymentMethod)}</td>
                  <td><strong>{formatUzsPrice(r.totalUzs)}</strong></td>
                  <td>{r.fiscalReceipt?.receiptNumber || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', fontSize: '10pt' }}>
            <div>
              <p>Kassir tasdig‘i: ___________________</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p>Soliq.uz OFD bilan sinxronlangan</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
