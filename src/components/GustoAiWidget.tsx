import { ArrowRight, Bot, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { DICTIONARIES } from '../data/i18n';
import type { AppLanguage } from '../types/restaurant';
import { SayqalEmblem } from './SayqalEmblem';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
}

interface GustoAiWidgetProps {
  language: AppLanguage;
  onActionNavigate?: (target: 'menu' | 'reserve' | 'story') => void;
}

export function GustoAiWidget({ language, onActionNavigate }: GustoAiWidgetProps) {
  const dict = DICTIONARIES[language].ai;
  const [isOpen, setIsOpen] = useState(true);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: dict.greeting,
    },
  ]);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0]?.id === 'welcome') {
        return [{ id: 'welcome', role: 'assistant', text: dict.greeting }];
      }
      return prev;
    });
  }, [dict.greeting]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const sendMessage = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Trigger helpful scroll/navigation if clicking quick prompt
    const lower = trimmed.toLowerCase();
    if (lower.includes('band') || lower.includes('брон') || lower.includes('book')) {
      onActionNavigate?.('reserve');
    } else if (lower.includes('menyu') || lower.includes('меню') || lower.includes('menu')) {
      onActionNavigate?.('menu');
    }

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, language }),
      });
      const data = (await res.json()) as { text?: string };
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          text:
            data.text ||
            'Sayqal restorani bo‘yicha ma’lumot tayyor. Stol band qilish yoki menyuni ko‘rish tugmasidan foydalaning.',
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          text: 'Sayqal Gusto AI hozircha oflayn rejimda. Menyu va stol band qilish bo‘limlari to‘liq ishlaydi.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative z-30 flex flex-col items-end gap-2.5">
      {isOpen && (
        <aside
          aria-label="SAYQAL Gusto AI Assistant"
          data-testid="gusto-ai-panel"
          className="w-[300px] sm:w-[320px] overflow-hidden rounded-2xl border border-[#C9A84C]/35 bg-[#120E0A]/90 shadow-[0_24px_60px_rgba(0,0,0,0.75)] backdrop-blur-xl"
        >
          {/* Header matching reference */}
          <div className="flex items-center justify-between border-b border-[#C9A84C]/20 bg-[#18120C]/90 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#C9A84C]/45 bg-[#0A0806]">
                <SayqalEmblem className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold tracking-wider uppercase text-[#E6CB7D]">
                  SAYQAL
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[#F5EDD6]">{dict.title}</span>
                  <span className="text-[11px] text-[#87A89A]">· {dict.status}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Minimize Gusto AI"
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#B8AE98] transition-colors hover:bg-[#241C14] hover:text-[#F5EDD6]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Conversation body */}
          <div
            ref={scrollRef}
            className="max-h-[210px] space-y-2.5 overflow-y-auto px-4 py-3.5 text-xs"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={
                  msg.role === 'user'
                    ? 'ml-auto max-w-[85%] rounded-xl rounded-br-sm border border-[#C9A84C]/40 bg-[#C9A84C]/18 px-3 py-2 text-[#F5EDD6]'
                    : 'mr-auto max-w-[92%] leading-relaxed text-[#EFE6CE]'
                }
              >
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <p className="text-[11px] italic text-[#C9A84C]">Gusto AI yozmoqda...</p>
            )}

            {/* Quick reply prompt pills inside card when conversation is short */}
            {messages.length <= 2 && (
              <div className="flex flex-col items-end gap-1.5 pt-1">
                {dict.chips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => sendMessage(chip)}
                    className="rounded-xl border border-[#C9A84C]/30 bg-[#1C1610]/90 px-3 py-1.5 text-right text-[11px] font-medium text-[#EFE6CE] transition-colors hover:border-[#C9A84C] hover:bg-[#261D14]"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex items-center gap-2 border-t border-[#C9A84C]/20 bg-[#0E0B08]/90 px-3 py-2.5"
          >
            <input
              type="text"
              aria-label="Ask Sayqal Gusto AI"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={dict.placeholder}
              className="flex-1 bg-transparent px-1 text-xs text-[#F5EDD6] placeholder-[#B8AE98]/60 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Send message to Gusto AI"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#C9A84C]/40 bg-[#1B150E] text-[#E6CB7D] transition-colors hover:bg-[#C9A84C] hover:text-[#0A0806] disabled:opacity-45"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </aside>
      )}

      {/* Launcher chip at bottom-right matching screenshot */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2.5 rounded-full border border-[#C9A84C]/45 bg-[#16110B]/92 py-1.5 pl-2 pr-3.5 text-left shadow-xl backdrop-blur-md transition-colors hover:border-[#C9A84C] hover:bg-[#211910]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#E6CB7D] to-[#B78B36] text-[#0A0806]">
          <Bot className="h-4 w-4" />
        </span>
        <span className="leading-tight">
          <span className="block text-xs font-semibold text-[#F5EDD6]">{dict.title}</span>
          <span className="block text-[10px] text-[#B8AE98]">{dict.launcherSub}</span>
        </span>
        <ArrowRight className="ml-1 h-3.5 w-3.5 text-[#E6CB7D]" />
      </button>
    </div>
  );
}
