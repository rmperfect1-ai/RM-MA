import {
  Download,
  Mic,
  MicOff,
  PlusCircle,
  Send,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  Volume2,
  VolumeX,
  Wallet,
} from 'lucide-react';
import { useRef, useState } from 'react';
import type {
  AppLanguage,
  LedgerCategory,
  LedgerEntry,
  LedgerType,
  Order,
  PaymentMethod,
} from '../types/restaurant';
import {
  computeAccountingSummary,
  exportLedgerCsv,
  formatPaymentMethodLabel,
  formatUzsPrice,
} from '../utils/restaurantLogic';

interface StaffAccountingPanelProps {
  ledger: LedgerEntry[];
  orders: Order[];
  language: AppLanguage;
  onAddLedgerEntry: (input: {
    type: LedgerType;
    category: LedgerCategory;
    title: string;
    amountUzs: number;
    paymentMethod: PaymentMethod;
    note?: string;
    createdBy?: string;
  }) => Promise<void>;
  onDeleteLedgerEntry: (id: string) => Promise<void>;
}

const INCOME_CATEGORIES: LedgerCategory[] = [
  'Banquet / VIP',
  'Order Revenue',
  'Other Income',
];

const EXPENSE_CATEGORIES: LedgerCategory[] = [
  'Ingredients / Bazaar',
  'Staff Payroll',
  'Utilities & Rent',
  'Equipment & Delivery',
];

export function StaffAccountingPanel({
  ledger,
  orders,
  language,
  onAddLedgerEntry,
  onDeleteLedgerEntry,
}: StaffAccountingPanelProps) {
  const [entryType, setEntryType] = useState<LedgerType>('expense');
  const [category, setCategory] = useState<LedgerCategory>('Ingredients / Bazaar');
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [ledgerFilter, setLedgerFilter] = useState<'all' | LedgerType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // AI Voice CFO State
  const [aiTranscript, setAiTranscript] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [voiceModeLabel, setVoiceModeLabel] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const summary = computeAccountingSummary(ledger, orders);

  const stopAllSpeech = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const speakTextAloud = async (text: string) => {
    stopAllSpeech();
    setIsSpeaking(true);

    try {
      const ttsRes = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const ttsData = (await ttsRes.json()) as {
        audioBase64?: string | null;
        mimeType?: string;
        usedFallback?: boolean;
      };

      if (ttsData.audioBase64) {
        setVoiceModeLabel('Gemini Voice TTS');
        const audio = new Audio(
          `data:${ttsData.mimeType || 'audio/wav'};base64,${ttsData.audioBase64}`,
        );
        audioRef.current = audio;
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => setIsSpeaking(false);
        await audio.play();
        return;
      }
    } catch {
      // Fall back to Web Speech API
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setVoiceModeLabel('Brauzer Ovoz Sintezi');
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang =
        language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-US' : 'uz-UZ';
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setVoiceModeLabel('Matnli hisobot');
      setIsSpeaking(false);
    }
  };

  const runAiBriefing = async (questionText?: string) => {
    setIsLoadingAi(true);
    try {
      const res = await fetch('/api/ai/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText?.trim() || undefined,
          language,
        }),
      });
      const data = (await res.json()) as { text?: string };
      const finalText = data.text || '';
      setAiTranscript(finalText);
      if (finalText) {
        await speakTextAloud(finalText);
      }
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleVoiceMicInput = () => {
    const win = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
    };
    const Rec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Rec) {
      setAiTranscript(
        'Mikrofon orqali ovozli savol berish Chrome brauzerida ishlaydi. Quyidagi maydonga yozib yuborishingiz ham mumkin.',
      );
      return;
    }

    const recognition = new Rec();
    recognition.lang = language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-US' : 'uz-UZ';
    recognition.interimResults = false;
    setIsListeningMic(true);
    recognition.onresult = (event) => {
      const spoken = event.results?.[0]?.[0]?.transcript || '';
      if (spoken.trim()) {
        setAiQuestion(spoken.trim());
        void runAiBriefing(spoken.trim());
      }
    };
    recognition.onerror = () => setIsListeningMic(false);
    recognition.onend = () => setIsListeningMic(false);
    recognition.start();
  };

  const handleCreateEntry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const numAmount = Number(amountStr);
    if (!title.trim() || !Number.isFinite(numAmount) || numAmount <= 0) {
      setFormError('Iltimos, operatsiya nomi va UZS summasini kiriting.');
      return;
    }
    setFormError('');
    setIsSaving(true);
    try {
      await onAddLedgerEntry({
        type: entryType,
        category,
        title: title.trim(),
        amountUzs: Math.round(numAmount),
        paymentMethod,
        note: note.trim() || undefined,
        createdBy: 'Menejer',
      });
      setTitle('');
      setAmountStr('');
      setNote('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Saqlashda xatolik.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadCsv = () => {
    const csv = exportLedgerCsv(ledger);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sayqal-kirim-chiqim-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLedger = ledger.filter((item) => {
    if (ledgerFilter !== 'all' && item.type !== ledgerFilter) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.note?.toLowerCase().includes(q) ?? false)
    );
  });

  const activeCategoryOptions =
    entryType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="space-y-6">
      {/* Top 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#2D4A3E] bg-[#121814] p-5">
          <div className="flex items-center justify-between text-xs text-[#A9CEBE]">
            <span>Jami Kirim (Tushum)</span>
            <TrendingUp className="h-4 w-4" />
          </div>
          <p
            data-testid="kpi-total-income"
            className="font-display mt-2 text-3xl font-semibold tabular-nums text-[#F5EDD6]"
          >
            {formatUzsPrice(summary.totalIncomeUzs)}
          </p>
          <p className="mt-1.5 text-[11px] tabular-nums text-[#A9CEBE]/85">
            Naqd: {formatUzsPrice(summary.cashIncomeUzs)} · Karta/Payme:{' '}
            {formatUzsPrice(summary.cardIncomeUzs + summary.digitalIncomeUzs)}
          </p>
        </div>

        <div className="rounded-xl border border-[#8B3A2A]/70 bg-[#1A110F] p-5">
          <div className="flex items-center justify-between text-xs text-[#F0A495]">
            <span>Jami Chiqim (Xarajatlar)</span>
            <TrendingDown className="h-4 w-4" />
          </div>
          <p
            data-testid="kpi-total-expense"
            className="font-display mt-2 text-3xl font-semibold tabular-nums text-[#F5EDD6]"
          >
            {formatUzsPrice(summary.totalExpenseUzs)}
          </p>
          <p className="mt-1.5 text-[11px] text-[#F0A495]/85">
            Bozor, maosh, kommunal va sarf xarajatlari
          </p>
        </div>

        <div className="rounded-xl border border-[#C9A84C]/45 bg-[#16120B] p-5">
          <div className="flex items-center justify-between text-xs text-[#E6CB7D]">
            <span>Sof Foyda (Kirim − Chiqim)</span>
            <Wallet className="h-4 w-4" />
          </div>
          <p
            data-testid="kpi-net-profit"
            className="font-display mt-2 text-3xl font-semibold tabular-nums text-[#E6CB7D]"
          >
            {formatUzsPrice(summary.netProfitUzs)}
          </p>
          <p className="mt-1.5 text-[11px] tabular-nums text-[#B8AE98]">
            Rentabellik marjasi: {summary.profitMarginPercent}%
          </p>
        </div>

        <div className="rounded-xl border border-[#C9A84C]/25 bg-[#14100C] p-5">
          <div className="flex items-center justify-between text-xs text-[#B8AE98]">
            <span>Faol & Atmen Buyurtmalar</span>
            <Sparkles className="h-4 w-4 text-[#C9A84C]" />
          </div>
          <p className="font-display mt-2 text-3xl font-semibold tabular-nums text-[#F5EDD6]">
            {summary.activeOrdersCount} faol · {summary.cancelledOrdersCount} atmen
          </p>
          <p className="mt-1.5 text-[11px] tabular-nums text-[#B8AE98]">
            Kutilayotgan tushum: {formatUzsPrice(summary.activeOrdersPipelineUzs)}
          </p>
        </div>
      </div>

      {/* AI Voice CFO Briefing & Smart Assistant */}
      <div className="rounded-xl border border-[#C9A84C]/35 bg-gradient-to-br from-[#17120C] to-[#110D09] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A84C]/45 bg-[#C9A84C]/15 px-2.5 py-0.5 text-[11px] font-medium text-[#E6CB7D]">
                <Volume2 className="h-3.5 w-3.5" />
                Ovozli AI Moliyaviy Yordamchi
              </span>
              {voiceModeLabel && (
                <span className="text-[11px] text-[#87A89A]">{voiceModeLabel}</span>
              )}
            </div>
            <h2 className="font-display mt-2 text-2xl font-semibold text-[#F5EDD6] sm:text-3xl">
              Bugungi Tushum, Chiqim va Sof Foydani Ovozda Tinglang
            </h2>
            <p className="mt-1 text-xs text-[#B8AE98]">
              AI real vaqtdagi kassa kirim-chiqimi, to‘langan va bekor qilingan buyurtmalarni hisoblab ovozli hisobot beradi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              data-testid="ai-voice-briefing-btn"
              disabled={isLoadingAi}
              onClick={() => runAiBriefing()}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#E6CB7D] to-[#C89635] px-5 py-2.5 text-xs font-semibold text-[#0A0806] shadow-md transition-opacity hover:opacity-95 disabled:opacity-50"
            >
              <Volume2 className="h-4 w-4" />
              <span>
                {isLoadingAi
                  ? 'Hisoblanmoqda...'
                  : 'Bugungi tushumni ovozda aytish'}
              </span>
            </button>

            {isSpeaking && (
              <button
                type="button"
                onClick={stopAllSpeech}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#8B3A2A] bg-[#8B3A2A]/25 px-3.5 py-2.5 text-xs font-medium text-[#F0A495]"
              >
                <VolumeX className="h-4 w-4" />
                <span>To‘xtatish</span>
              </button>
            )}
          </div>
        </div>

        {/* AI Spoken Output & Interactive Voice/Text Question Bar */}
        {aiTranscript && (
          <div
            data-testid="ai-voice-transcript"
            role="status"
            className="mt-4 rounded-lg border border-[#C9A84C]/30 bg-[#0A0806]/85 p-4 text-sm leading-relaxed text-[#F5EDD6]"
          >
            {aiTranscript}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (aiQuestion.trim()) {
                void runAiBriefing(aiQuestion);
              }
            }}
            className="flex flex-1 items-center gap-2 rounded-lg border border-[#C9A84C]/25 bg-[#0A0806] px-3 py-2"
          >
            <input
              type="text"
              aria-label="Ask AI financial assistant"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              placeholder="AI ga savol bering: Masalan, «Bugun qancha foyda qoldi?» yoki «Chiqimlar nimaga ketdi?»"
              className="flex-1 bg-transparent text-xs text-[#F5EDD6] placeholder-[#B8AE98]/55 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleVoiceMicInput}
              aria-label={isListeningMic ? 'Listening to voice' : 'Ask with microphone'}
              className={`flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
                isListeningMic
                  ? 'border-[#8B3A2A] bg-[#8B3A2A]/35 text-[#F0A495]'
                  : 'border-[#C9A84C]/25 text-[#E6CB7D] hover:bg-[#1E1812]'
              }`}
            >
              {isListeningMic ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            </button>
            <button
              type="submit"
              disabled={isLoadingAi || !aiQuestion.trim()}
              className="inline-flex items-center gap-1 rounded-md bg-[#C9A84C] px-3 py-1.5 text-xs font-semibold text-[#0A0806] disabled:opacity-45"
            >
              <Send className="h-3.5 w-3.5" />
              <span>So‘rash</span>
            </button>
          </form>

          <div className="flex flex-wrap gap-1.5">
            {[
              'Chiqimlar nimaga ketdi?',
              'Atmen qilingan buyurtmalar?',
            ].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  setAiQuestion(q);
                  void runAiBriefing(q);
                }}
                className="rounded-md border border-[#C9A84C]/25 bg-[#14100C] px-2.5 py-2 text-[11px] text-[#E5DEC9] hover:border-[#C9A84C]"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Split: Add Kirim/Chiqim Form + Transaction Ledger */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <form
          onSubmit={handleCreateEntry}
          className="h-fit rounded-xl border border-[#C9A84C]/25 bg-[#14100C] p-5 sm:p-6 lg:col-span-4 space-y-4"
        >
          <div>
            <h3 className="font-display text-2xl font-semibold text-[#F5EDD6]">
              Kirim / Chiqim Qo‘shish
            </h3>
            <p className="mt-1 text-xs text-[#B8AE98]">
              Barcha bozor xaridlari, maoshlar va qo‘shimcha daromadlarni kiriting.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-lg border border-[#C9A84C]/20 bg-[#0A0806] p-1">
            <button
              type="button"
              onClick={() => {
                setEntryType('income');
                setCategory('Banquet / VIP');
              }}
              className={`rounded-md py-2 text-xs font-semibold transition-colors ${
                entryType === 'income'
                  ? 'bg-[#2D4A3E] text-[#F5EDD6]'
                  : 'text-[#B8AE98] hover:text-[#F5EDD6]'
              }`}
            >
              + Kirim (Daromad)
            </button>
            <button
              type="button"
              onClick={() => {
                setEntryType('expense');
                setCategory('Ingredients / Bazaar');
              }}
              className={`rounded-md py-2 text-xs font-semibold transition-colors ${
                entryType === 'expense'
                  ? 'bg-[#8B3A2A] text-[#F5EDD6]'
                  : 'text-[#B8AE98] hover:text-[#F5EDD6]'
              }`}
            >
              − Chiqim (Xarajat)
            </button>
          </div>

          <div>
            <label htmlFor="ledger-category" className="block text-xs font-medium text-[#E5DEC9]">
              Toifa (Kategoriya)
            </label>
            <select
              id="ledger-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as LedgerCategory)}
              className="mt-1 w-full rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3 py-2 text-sm text-[#F5EDD6]"
            >
              {activeCategoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ledger-title" className="block text-xs font-medium text-[#E5DEC9]">
              Operatsiya nomi
            </label>
            <input
              id="ledger-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                entryType === 'expense'
                  ? 'Masalan: Go‘sht va sabzavot xaridi'
                  : 'Masalan: Kechki banket avansi'
              }
              className="mt-1 w-full rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3 py-2 text-sm text-[#F5EDD6]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="ledger-amount" className="block text-xs font-medium text-[#E5DEC9]">
                Summa (UZS)
              </label>
              <input
                id="ledger-amount"
                type="number"
                min={1000}
                step={1000}
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="450000"
                className="mt-1 w-full rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3 py-2 text-sm tabular-nums text-[#F5EDD6]"
              />
            </div>

            <div>
              <label htmlFor="ledger-payment" className="block text-xs font-medium text-[#E5DEC9]">
                To‘lov turi
              </label>
              <select
                id="ledger-payment"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="mt-1 w-full rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3 py-2 text-sm text-[#F5EDD6]"
              >
                <option value="Cash">Naqd (Cash)</option>
                <option value="Card">Karta (Humo/Uzcard)</option>
                <option value="PaymeClick">Payme / Click</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="ledger-note" className="block text-xs font-medium text-[#E5DEC9]">
              Izoh (ixtiyoriy)
            </label>
            <input
              id="ledger-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Qo‘shimcha ma’lumot..."
              className="mt-1 w-full rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3 py-2 text-sm text-[#F5EDD6]"
            />
          </div>

          {formError && <p className="text-xs text-[#E88473]">{formError}</p>}

          <button
            type="submit"
            data-testid="submit-ledger-btn"
            disabled={isSaving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#C9A84C] px-4 py-2.5 text-sm font-semibold text-[#0A0806] hover:bg-[#E6CB7D] disabled:opacity-50"
          >
            <PlusCircle className="h-4 w-4" />
            <span>
              {isSaving
                ? 'Saqlanmoqda...'
                : entryType === 'income'
                  ? 'Kirimni saqlash'
                  : 'Chiqimni saqlash'}
            </span>
          </button>
        </form>

        {/* Ledger Table */}
        <div className="rounded-xl border border-[#C9A84C]/25 bg-[#14100C] lg:col-span-8 overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-[#C9A84C]/18 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {(['all', 'income', 'expense'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setLedgerFilter(tab)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    ledgerFilter === tab
                      ? 'bg-[#C9A84C] text-[#0A0806]'
                      : 'border border-[#C9A84C]/20 bg-[#0A0806] text-[#B8AE98] hover:text-[#F5EDD6]'
                  }`}
                >
                  {tab === 'all' ? 'Hammasi' : tab === 'income' ? 'Kirimlar' : 'Chiqimlar'}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="search"
                aria-label="Search ledger entries"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Qidirish..."
                className="rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3 py-1.5 text-xs text-[#F5EDD6]"
              />
              <button
                type="button"
                onClick={handleDownloadCsv}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#C9A84C]/35 bg-[#0A0806] px-3 py-1.5 text-xs font-medium text-[#E6CB7D] hover:bg-[#1E1812]"
              >
                <Download className="h-3.5 w-3.5" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          <div className="divide-y divide-[#C9A84C]/12">
            {filteredLedger.length === 0 ? (
              <p className="p-8 text-center text-sm text-[#B8AE98]">
                Moliyaviy yozuvlar topilmadi.
              </p>
            ) : (
              filteredLedger.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col justify-between gap-3 p-4 hover:bg-[#19140F]/60 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs font-semibold ${
                          entry.type === 'income' ? 'text-[#87A89A]' : 'text-[#F0A495]'
                        }`}
                      >
                        {entry.type === 'income' ? 'KIRIM' : 'CHIQIM'}
                      </span>
                      <span className="text-xs text-[#C9A84C]">· {entry.category}</span>
                      <span className="text-xs text-[#B8AE98]">
                        · {formatPaymentMethodLabel(entry.paymentMethod)} · {entry.date}
                      </span>
                    </div>
                    <p className="mt-1 font-medium text-[#F5EDD6]">{entry.title}</p>
                    {entry.note && (
                      <p className="mt-0.5 text-xs text-[#B8AE98]">{entry.note}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        entry.type === 'income' ? 'text-[#87A89A]' : 'text-[#F0A495]'
                      }`}
                    >
                      {entry.type === 'income' ? '+' : '−'}
                      {formatUzsPrice(entry.amountUzs)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteLedgerEntry(entry.id)}
                      aria-label={`Delete ledger entry ${entry.title}`}
                      className="flex h-8 w-8 items-center justify-center rounded border border-[#8B3A2A]/40 text-[#E88473] hover:bg-[#8B3A2A]/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
