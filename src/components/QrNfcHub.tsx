import { Check, Copy, Download, QrCode, Smartphone, Wifi, X } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import type { EMenuSource } from '../types/restaurant';
import { buildEMenuUrl } from '../utils/restaurantLogic';

interface NdefWriterInstance {
  write: (message: { records: Array<{ recordType: string; data: string }> }) => Promise<void>;
  scan: () => Promise<void>;
  addEventListener: (type: string, listener: (event: unknown) => void) => void;
}

type NdefConstructor = new () => NdefWriterInstance;

function getNdefReader(): NdefConstructor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as { NDEFReader?: NdefConstructor };
  return typeof win.NDEFReader === 'function' ? win.NDEFReader : null;
}

interface QrNfcPanelProps {
  onLaunchEMenu: (source: EMenuSource, table?: string) => void;
}

export function QrNfcPanel({ onLaunchEMenu }: QrNfcPanelProps) {
  const [tableNumber, setTableNumber] = useState('1');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedType, setCopiedType] = useState<'nfc' | 'qr' | null>(null);
  const [nfcStatus, setNfcStatus] = useState<string>('');
  const [isScanningNfc, setIsScanningNfc] = useState(false);

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://sayqal.uz';
  const cleanTable = tableNumber === 'all' ? undefined : tableNumber;
  const nfcUrl = buildEMenuUrl(origin, { source: 'nfc', table: cleanTable });
  const qrUrl = buildEMenuUrl(origin, { source: 'qr', table: cleanTable });

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(qrUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0A0806',
        light: '#F5EDD6',
      },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('');
      });

    return () => {
      cancelled = true;
    };
  }, [qrUrl]);

  const handleCopy = async (text: string, type: 'nfc' | 'qr') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      window.setTimeout(() => setCopiedType(null), 1800);
    } catch {
      setCopiedType(null);
    }
  };

  const handleWriteNfcTag = async () => {
    const NDEFReaderCtor = getNdefReader();
    if (!NDEFReaderCtor) {
      setNfcStatus(
        'Web NFC faqat Android Chrome brauzerida to‘g‘ridan-to‘g‘ri yozadi. NFC stikerga yuqoridagi NFC havolasini yozsangiz, iPhone va Android telefonlar tekkizilganda Elektron Menyu avtomatik ochiladi.',
      );
      return;
    }

    try {
      setNfcStatus('Telefon orqasini NFC stikerga tekkizing...');
      const ndef = new NDEFReaderCtor();
      await ndef.write({
        records: [{ recordType: 'url', data: nfcUrl }],
      });
      setNfcStatus(
        `Muvaffaqiyatli yozildi! Endi stol #${cleanTable ?? 'Umumiy'} NFC stikeriga telefon tekkizilganda Elektron Menyu narxlari bilan ochiladi.`,
      );
    } catch (err) {
      setNfcStatus(
        err instanceof Error
          ? `NFC yozishda xatolik: ${err.message}`
          : 'NFC tegiga yozib bo‘lmadi.',
      );
    }
  };

  const handleListenNfc = async () => {
    const NDEFReaderCtor = getNdefReader();
    if (!NDEFReaderCtor) {
      setNfcStatus(
        'Brauzerda Web NFC skaneri mavjud emas — quyidagi "Telefonni NFC ga tekkizish (Demo)" tugmasi bilan darhol sinab ko‘rishingiz mumkin.',
      );
      return;
    }
    try {
      const ndef = new NDEFReaderCtor();
      await ndef.scan();
      setIsScanningNfc(true);
      setNfcStatus('NFC tinglash faol: telefonni NFC stikeriga yaqinlashtiring.');
      ndef.addEventListener('reading', () => {
        onLaunchEMenu('nfc', cleanTable);
      });
    } catch (err) {
      setNfcStatus(
        err instanceof Error ? `NFC skaner xatosi: ${err.message}` : 'NFC skaner yoqilmadi.',
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Table Selector */}
      <div className="flex flex-col gap-3 rounded-lg border border-[#C9A84C]/20 bg-[#14100C] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[#C9A84C]">
            Stol raqamini tanlang
          </p>
          <p className="mt-0.5 text-xs text-[#B8AE98]">
            Har bir stol uchun alohida NFC havolasi va QR kod avtomatik shakllanadi.
          </p>
        </div>

        <select
          aria-label="Select table for NFC and QR menu"
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
          className="rounded-md border border-[#C9A84C]/35 bg-[#0A0806] px-3 py-2 text-sm text-[#F5EDD6] focus:border-[#C9A84C] focus:outline-none"
        >
          <option value="all">Umumiy Menyu (Stolsiz)</option>
          {Array.from({ length: 25 }, (_, i) => String(i + 1)).map((num) => (
            <option key={num} value={num}>
              Stol #{num}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* NFC Card */}
        <div className="flex flex-col justify-between rounded-lg border border-[#C9A84C]/25 bg-[#14100C] p-5 sm:p-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[#C9A84C]/35 bg-[#0A0806] text-[#C9A84C]">
                <Wifi className="h-5 w-5 rotate-90" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-semibold text-[#F5EDD6]">
                  NFC Elektron Menyu
                </h3>
                <p className="text-xs text-[#B8AE98]">
                  Telefon tekkizilishi bilan darhol ochiladi
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-md border border-[#C9A84C]/20 bg-[#0A0806] p-3.5">
              <p className="text-[11px] uppercase tracking-wider text-[#B8AE98]">
                NFC Teg URL Manzil (NDEF URI)
              </p>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <code className="truncate text-xs text-[#E6CB7D]">{nfcUrl}</code>
                <button
                  type="button"
                  onClick={() => handleCopy(nfcUrl, 'nfc')}
                  aria-label="Copy NFC URL"
                  className="inline-flex shrink-0 items-center gap-1 rounded border border-[#C9A84C]/25 px-2.5 py-1 text-[11px] text-[#F5EDD6] hover:bg-[#1E1812]"
                >
                  {copiedType === 'nfc' ? (
                    <>
                      <Check className="h-3 w-3 text-[#87A89A]" />
                      <span>Nusxalandi</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Nusxalash</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-[#B8AE98]">
              Stol ustidagi NFC stikeriga ushbu NDEF URI manzil yozilganda, mehmon telefonini tekkizishi bilanoq narxlari bilan Sayqal Elektron Menyusi ochiladi.
            </p>

            {nfcStatus && (
              <p
                role="status"
                className="mt-3 rounded-md border border-[#C9A84C]/30 bg-[#1B1610] p-3 text-xs text-[#E6CB7D]"
              >
                {nfcStatus}
              </p>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="button"
              data-testid="simulate-nfc-tap-btn"
              onClick={() => onLaunchEMenu('nfc', cleanTable)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#C9A84C] px-4 py-2.5 text-sm font-semibold text-[#0A0806] transition-colors hover:bg-[#E6CB7D]"
            >
              <Smartphone className="h-4 w-4" />
              <span>Telefonni NFC ga tekkizish (Menyuni ochish)</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleWriteNfcTag}
                className="rounded-md border border-[#C9A84C]/35 bg-[#0A0806] px-3 py-2 text-xs font-medium text-[#F5EDD6] hover:bg-[#1E1812]"
              >
                NFC Stikerga yozish
              </button>
              <button
                type="button"
                onClick={handleListenNfc}
                className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                  isScanningNfc
                    ? 'border-[#2D4A3E] bg-[#2D4A3E]/40 text-[#A9CEBE]'
                    : 'border-[#C9A84C]/35 bg-[#0A0806] text-[#F5EDD6] hover:bg-[#1E1812]'
                }`}
              >
                {isScanningNfc ? 'NFC Tinglanmoqda' : 'NFC Skanerni yoqish'}
              </button>
            </div>
          </div>
        </div>

        {/* QR Code Card */}
        <div className="flex flex-col justify-between rounded-lg border border-[#C9A84C]/25 bg-[#14100C] p-5 sm:p-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[#C9A84C]/35 bg-[#0A0806] text-[#C9A84C]">
                <QrCode className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-semibold text-[#F5EDD6]">
                  QR Kod Elektron Menyu
                </h3>
                <p className="text-xs text-[#B8AE98]">
                  Kamera bilan skanerlang — narxlar darhol ko‘rinadi
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col items-center rounded-lg border border-[#C9A84C]/25 bg-[#0A0806] p-5">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`Sayqal QR Menu for Table ${cleanTable ?? 'All'}`}
                  className="h-44 w-44 rounded-md border border-[#C9A84C]/40 bg-[#F5EDD6] p-2"
                />
              ) : (
                <div className="flex h-44 w-44 items-center justify-center rounded-md border border-[#C9A84C]/20 text-xs text-[#B8AE98]">
                  QR tayyorlanmoqda...
                </div>
              )}
              <p className="mt-3 text-xs font-medium text-[#E6CB7D]">
                {cleanTable ? `Stol #${cleanTable} · QR Menyu` : 'Sayqal Elektron Menyu QR'}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => onLaunchEMenu('qr', cleanTable)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#C9A84C] bg-[#C9A84C]/15 px-4 py-2.5 text-sm font-medium text-[#E6CB7D] transition-colors hover:bg-[#C9A84C] hover:text-[#0A0806]"
            >
              <QrCode className="h-4 w-4" />
              <span>QR Menyu ko‘rinishini ochish</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              {qrDataUrl && (
                <a
                  href={qrDataUrl}
                  download={`sayqal-menu-table-${cleanTable ?? 'general'}.png`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-[#C9A84C]/35 bg-[#0A0806] px-3 py-2 text-xs font-medium text-[#F5EDD6] hover:bg-[#1E1812]"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>QR Yuklash</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => handleCopy(qrUrl, 'qr')}
                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-[#C9A84C]/35 bg-[#0A0806] px-3 py-2 text-xs font-medium text-[#F5EDD6] hover:bg-[#1E1812]"
              >
                {copiedType === 'qr' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#87A89A]" />
                    <span>Nusxalandi</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Havolani nusxalash</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface QrNfcModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchEMenu: (source: EMenuSource, table?: string) => void;
}

export function QrNfcModal({ isOpen, onClose, onLaunchEMenu }: QrNfcModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="NFC va QR Elektron Menyu"
      data-testid="qr-nfc-modal"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative my-auto w-full max-w-4xl rounded-lg border border-[#C9A84C]/35 bg-[#0E0B08] p-5 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-[#C9A84C]/18 pb-4">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#C9A84C]">
              Elektron Menyu Kirish
            </p>
            <h2 className="font-display mt-1 text-3xl font-semibold text-[#F5EDD6]">
              NFC & QR Kod Orqali Menyu
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close NFC and QR modal"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-[#C9A84C]/30 bg-[#14100C] text-[#F5EDD6] hover:bg-[#1E1812]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <QrNfcPanel onLaunchEMenu={onLaunchEMenu} />
      </div>
    </div>
  );
}
