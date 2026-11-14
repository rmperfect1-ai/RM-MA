import { CheckCircle2, ExternalLink, Printer, ShieldCheck, X } from 'lucide-react';
import { useEffect } from 'react';
import type { ArchivedReceipt, Order } from '../types/restaurant';
import { computeOrderTotalUzs, formatPaymentMethodLabel, formatUzsPrice } from '../utils/restaurantLogic';
import { QrCodeGraphic } from './QrCodeGraphic';

interface FiscalReceiptModalProps {
  order: Order | ArchivedReceipt | null;
  onClose: () => void;
}

export function FiscalReceiptModal({ order, onClose }: FiscalReceiptModalProps) {
  useEffect(() => {
    if (!order) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [order, onClose]);

  if (!order || !order.fiscalReceipt) return null;

  const fiscal = order.fiscalReceipt;
  const subtotal = fiscal.subtotalUzs ?? order.subtotalUzs ?? computeOrderTotalUzs(order.items);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Soliq.uz Elektron Fiskal Chek"
      data-testid="fiscal-receipt-modal"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="my-auto w-full max-w-md rounded-2xl border border-[#C9A84C]/45 bg-[#120E0A] p-6 text-[#F5EDD6] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-start justify-between gap-3 border-b border-[#C9A84C]/20 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#2D4A3E] bg-[#2D4A3E]/35 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#A9CEBE]">
              <ShieldCheck className="h-3 w-3" />
              <span>SOLIQ.UZ · ELEKTRON FISKAL CHEK</span>
            </div>
            <h2 className="font-display mt-2 text-2xl font-semibold text-[#F5EDD6]">
              {fiscal.companyName}
            </h2>
            <p className="text-[11px] text-[#B8AE98]">
              STIR (INN): <span className="font-mono text-[#E6CB7D]">{fiscal.inn}</span> · Virtual
              kassa: <span className="font-mono text-[#E6CB7D]">{fiscal.terminalId}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Elektron chekni yopish"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#C9A84C]/25 bg-[#1A140E] text-[#F5EDD6] hover:bg-[#241C13]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Receipt metadata */}
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-[#C9A84C]/18 bg-[#0A0806] p-3 text-xs">
          <div>
            <span className="block text-[10px] uppercase text-[#B8AE98]">Chek raqami</span>
            <span className="font-mono font-semibold text-[#E6CB7D]">{fiscal.receiptNumber}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase text-[#B8AE98]">Stol & Buyurtma</span>
            <span className="font-semibold text-[#F5EDD6]">
              Stol #{order.tableNumber} ({order.code})
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase text-[#B8AE98]">Ofitsiant</span>
            <span className="text-[#F5EDD6]">
              {order.waiterName
                ? `${order.waiterName} (${order.waiterCode ?? 'POS'})`
                : `O‘z-o‘ziga (${order.source.toUpperCase()})`}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase text-[#B8AE98]">Sana va Vaqt</span>
            <span className="tabular-nums text-[#E5DEC9]">
              {new Date(fiscal.issuedAt).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Itemized Dishes */}
        <div className="mt-4 rounded-lg border border-[#C9A84C]/18 bg-[#0A0806] p-3.5 space-y-2">
          {order.items.map((item) => (
            <div
              key={`${order.id}-${item.dishId}`}
              className="flex items-center justify-between gap-2 text-xs"
            >
              <span className="text-[#E5DEC9]">
                <span className="font-semibold text-[#E6CB7D]">{item.quantity}×</span> {item.name}
              </span>
              <span className="tabular-nums text-[#F5EDD6]">
                {formatUzsPrice(item.priceUzs * item.quantity)}
              </span>
            </div>
          ))}

          <div className="border-t border-dashed border-[#C9A84C]/25 pt-2.5 space-y-1 text-xs">
            <div className="flex justify-between text-[#B8AE98]">
              <span>Taomlar summasi:</span>
              <span className="tabular-nums text-[#E5DEC9]">{formatUzsPrice(subtotal)}</span>
            </div>
            {fiscal.serviceFeeUzs > 0 && (
              <div className="flex justify-between text-[#B8AE98]">
                <span>Xizmat haqi ({fiscal.serviceChargePercent}%):</span>
                <span className="tabular-nums text-[#E5DEC9]">
                  {formatUzsPrice(fiscal.serviceFeeUzs)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 text-sm font-bold text-[#E6CB7D]">
              <span>JAMI TO‘LOV (QQS bilan):</span>
              <span className="font-display text-2xl tabular-nums">
                {formatUzsPrice(fiscal.totalUzs)}
              </span>
            </div>
          </div>
        </div>

        {/* Soliq.uz Scannable QR Code */}
        <div className="mt-4 flex flex-col items-center rounded-xl border border-[#C9A84C]/30 bg-[#0A0806] p-4 text-center">
          <QrCodeGraphic
            value={fiscal.soliqUrl}
            alt={`Soliq.uz Fiscal QR for ${fiscal.receiptNumber}`}
            size={180}
            className="h-40 w-40 rounded-lg border border-[#C9A84C]/50 bg-[#F5EDD6] p-2"
          />
          <p className="mt-2.5 text-[11px] font-semibold text-[#E6CB7D]">
            Soliq.uz OFD Fiskal Belgisi: <span className="font-mono">{fiscal.fiscalSign}</span>
          </p>
          <p className="mt-0.5 text-[10px] text-[#B8AE98]">
            Keshbek (1%) olish uchun Soliq ilovasi orqali QR kodni skanerlang
          </p>
          <a
            href={fiscal.soliqUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[#A9CEBE] underline decoration-[#A9CEBE]/40 underline-offset-2 hover:text-[#F5EDD6]"
          >
            <span>ofd.soliq.uz tekshirish</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-[#A9CEBE]">
            <CheckCircle2 className="h-4 w-4" />
            {order.status === 'Paid'
              ? `To‘langan (${formatPaymentMethodLabel(order.paymentMethod || 'Cash')})`
              : 'Kassirga to‘lov uchun yuborilgan'}
          </span>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#C9A84C] px-4 py-2 text-xs font-semibold text-[#0A0806] hover:bg-[#E6CB7D]"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Chop etish</span>
          </button>
        </div>
      </div>
    </div>
  );
}
