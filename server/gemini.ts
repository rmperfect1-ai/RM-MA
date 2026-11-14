import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { RESTAURANT_META } from '../src/data/seedData';
import type { AppLanguage, RestaurantServerState } from '../src/types/restaurant';
import {
  buildFinancialVoiceScript,
  computeAccountingSummary,
  formatUzsPrice,
} from '../src/utils/restaurantLogic';

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function withTimeout<T>(promise: Promise<T>, ms = 4500): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gemini request timeout')), ms);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

function buildDeterministicGuestReply(
  message: string,
  state: RestaurantServerState,
  language: AppLanguage,
): string {
  const q = message.toLowerCase();
  const topDishes = state.dishes
    .slice()
    .sort((a, b) => b.ordersToday - a.ordersToday)
    .slice(0, 4)
    .map((d) => `${d.name} (${formatUzsPrice(d.priceUzs)})`)
    .join(', ');

  if (q.includes('menyu') || q.includes('меню') || q.includes('menu') || q.includes('taom') || q.includes('narx')) {
    if (language === 'ru') {
      return `В меню Sayqal представлены салаты, супы, горячие блюда, шашлыки и авторские десерты. Хиты сегодня: ${topDishes}. Вы можете сразу оформить заказ через QR или NFC меню со стола.`;
    }
    if (language === 'en') {
      return `Sayqal serves salads, soups, Uzbek & European mains, charcoal grills, and artisan cheesecakes. Today's favorites include ${topDishes}. Tap "Explore Menu" or scan your table QR/NFC to order directly.`;
    }
    return `Sayqal menyusida salatlar, sho‘rvalar, milliy va Yevropa taomlari, shashlik hamda desertlar mavjud. Bugungi eng mashhur taomlar: ${topDishes}. Stolingizdagi QR yoki NFC orqali to‘g‘ridan-to‘g‘ri buyurtma berishingiz mumkin.`;
  }

  if (q.includes('bron') || q.includes('stol') || q.includes('брон') || q.includes('book') || q.includes('table')) {
    if (language === 'ru') {
      return `Мы открыты ежедневно с ${RESTAURANT_META.hours} по адресу ${RESTAURANT_META.addressLine}. Нажмите кнопку «Бронировать» вверху или оставьте заявку в разделе бронирования — стол будет закреплён за вами.`;
    }
    if (language === 'en') {
      return `We welcome guests daily (${RESTAURANT_META.hours}) at ${RESTAURANT_META.addressLine}. Click "Reserve Table" above to book courtyard or private salon seating.`;
    }
    return `Restoranimiz har kuni ${RESTAURANT_META.hours} oralig‘ida ishlaydi (${RESTAURANT_META.addressLine}). Yuqoridagi «Bron qilish» tugmasini bosing — oilaviy zal yoki hovli stolini band qilishingiz mumkin.`;
  }

  if (q.includes('restoran') || q.includes('manzil') || q.includes('ресторан') || q.includes('about') || q.includes('info')) {
    if (language === 'ru') {
      return `Sayqal Family Restaurant (${RESTAURANT_META.addressLine}) — семейный ресторан премиальной узбекской и европейской кухни. Рейтинг гостей: ${RESTAURANT_META.rating}★ (${RESTAURANT_META.reviewCount} отзывов). Телефон: ${RESTAURANT_META.phone}.`;
    }
    if (language === 'en') {
      return `Sayqal Family Restaurant (${RESTAURANT_META.addressLine}) offers fine Uzbek and international dining in Tashkent, rated ${RESTAURANT_META.rating}★ across ${RESTAURANT_META.reviewCount} reviews. Phone: ${RESTAURANT_META.phone}.`;
    }
    return `Sayqal Family Restaurant — Toshkent shahri, Zargarlik ko‘chasi 9-uyda joylashgan oilaviy restoran (${RESTAURANT_META.hours}). Mijozlar bahosi: ${RESTAURANT_META.rating}★. Telefon: ${RESTAURANT_META.phone}.`;
  }

  if (language === 'ru') {
    return `Я Sayqal Gusto AI — помогу с выбором блюд, ценами в сумах, бронью стола и запуском заказа со стола через QR/NFC. Что вас интересует?`;
  }
  if (language === 'en') {
    return `I am Sayqal Gusto AI — I can help with dish recommendations, UZS pricing, table bookings, or QR/NFC table ordering. What would you like to know?`;
  }
  return `Men Sayqal Gusto AI yordamchisiman — taomlar narxi, stol bron qilish yoki QR/NFC orqali buyurtma berish bo‘yicha yordam bera olaman. Qanday savolingiz bor?`;
}

export async function generateGuestConciergeReply(
  message: string,
  state: RestaurantServerState,
  language: AppLanguage,
): Promise<{ text: string; usedFallback: boolean }> {
  const ai = getAiClient();
  if (!ai) {
    return {
      text: buildDeterministicGuestReply(message, state, language),
      usedFallback: true,
    };
  }

  const menuDigest = state.dishes
    .slice(0, 20)
    .map((d) => `- ${d.name} (${d.category}, ${d.portion ?? ''}): ${formatUzsPrice(d.priceUzs)}`)
    .join('\n');

  const langPrompt =
    language === 'ru'
      ? 'Respond in concise, warm Russian.'
      : language === 'en'
        ? 'Respond in concise, warm English.'
        : 'Respond in concise, natural Uzbek (Latin script).';

  try {
    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: message,
        config: {
          systemInstruction:
            `You are Sayqal Gusto AI, the digital concierge for Sayqal Family Restaurant in Tashkent (${RESTAURANT_META.addressLine}, ${RESTAURANT_META.hours}, phone ${RESTAURANT_META.phone}). ` +
            `${langPrompt} Keep replies to 2-3 clear sentences. Use only real prices and dishes below:\n${menuDigest}`,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      }),
      4500,
    );
    const text = response.text?.trim();
    if (text) {
      return { text, usedFallback: false };
    }
  } catch {
    // Graceful fallback if key fails or hits quota
  }

  return {
    text: buildDeterministicGuestReply(message, state, language),
    usedFallback: true,
  };
}

export async function generateFinancialBriefing(
  question: string | undefined,
  state: RestaurantServerState,
  language: AppLanguage,
): Promise<{ text: string; usedFallback: boolean; summary: ReturnType<typeof computeAccountingSummary> }> {
  const todayIso = new Date().toISOString().slice(0, 10);
  const summary = computeAccountingSummary(state.ledger, state.orders, todayIso);
  const baseScript = buildFinancialVoiceScript(summary, language);

  if (!question?.trim()) {
    const ai = getAiClient();
    if (!ai) {
      return { text: baseScript, usedFallback: true, summary };
    }

    const langDirective =
      language === 'ru'
        ? 'Speak in natural Russian.'
        : language === 'en'
          ? 'Speak in natural English.'
          : 'Speak in natural Uzbek (Latin script).';

    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents:
            `Summarize today's restaurant performance in 3-4 spoken sentences using these exact figures:\n` +
            `Total Kirim (Income): ${summary.totalIncomeUzs} UZS\n` +
            `Total Chiqim (Expenses): ${summary.totalExpenseUzs} UZS\n` +
            `Sof Foyda (Net Profit): ${summary.netProfitUzs} UZS (${summary.profitMarginPercent}% margin)\n` +
            `Cash: ${summary.cashIncomeUzs} UZS, Card: ${summary.cardIncomeUzs} UZS, Payme/Click: ${summary.digitalIncomeUzs} UZS\n` +
            `Paid orders: ${summary.paidOrdersCount}, Active kitchen orders: ${summary.activeOrdersCount} (worth ${summary.activeOrdersPipelineUzs} UZS), Cancelled (Atmen): ${summary.cancelledOrdersCount}\n` +
            `Top dish: ${summary.topOrderedDishes[0]?.name ?? 'Sayqal Salad'}`,
          config: {
            systemInstruction:
              `You are Sayqal Restaurant's AI Voice Financial Director. ${langDirective} Produce clean spoken prose without markdown, bullet points, or asterisks so it reads smoothly as voice audio.`,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        }),
        4500,
      );
      const text = response.text?.trim();
      if (text) {
        return { text, usedFallback: false, summary };
      }
    } catch {
      // Fallback below
    }
    return { text: baseScript, usedFallback: true, summary };
  }

  // Answer a specific financial / operational question
  const ai = getAiClient();
  const expenseDigest = state.ledger
    .filter((e) => e.type === 'expense')
    .slice(0, 8)
    .map((e) => `${e.title} (${e.category}): ${e.amountUzs} UZS`)
    .join('; ');

  const incomeDigest = state.ledger
    .filter((e) => e.type === 'income')
    .slice(0, 8)
    .map((e) => `${e.title} (${e.paymentMethod}): ${e.amountUzs} UZS`)
    .join('; ');

  if (ai) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: question,
          config: {
            systemInstruction:
              `You are Sayqal Restaurant's AI CFO & Operations Advisor. Answer in ${
                language === 'ru' ? 'Russian' : language === 'en' ? 'English' : 'Uzbek (Latin)'
              } concisely in plain spoken sentences (no markdown). Live data:\n` +
              `- Total Kirim: ${summary.totalIncomeUzs} UZS\n` +
              `- Total Chiqim: ${summary.totalExpenseUzs} UZS\n` +
              `- Sof Foyda: ${summary.netProfitUzs} UZS (${summary.profitMarginPercent}%)\n` +
              `- Paid orders: ${summary.paidOrdersCount}, Active orders: ${summary.activeOrdersCount}, Cancelled (Atmen): ${summary.cancelledOrdersCount}\n` +
              `- Recent Incomes: ${incomeDigest || 'None'}\n` +
              `- Recent Expenses: ${expenseDigest || 'None'}\n` +
              `- Top dishes: ${summary.topOrderedDishes.map((d) => `${d.name} (${d.quantity}x)`).join(', ')}`,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        }),
        4500,
      );
      const text = response.text?.trim();
      if (text) {
        return { text, usedFallback: false, summary };
      }
    } catch {
      // Fallback below
    }
  }

  return {
    text: buildDeterministicQaFallback(question, summary, state, language),
    usedFallback: true,
    summary,
  };
}

function buildDeterministicQaFallback(
  question: string,
  summary: ReturnType<typeof computeAccountingSummary>,
  state: RestaurantServerState,
  language: AppLanguage,
): string {
  const q = question.toLowerCase();
  if (q.includes('chiqim') || q.includes('xarajat') || q.includes('расход') || q.includes('expense')) {
    const expenses = state.ledger.filter((e) => e.type === 'expense');
    const topExp = expenses.slice().sort((a, b) => b.amountUzs - a.amountUzs)[0];
    if (language === 'ru') {
      return `Общие расходы составляют ${formatUzsPrice(summary.totalExpenseUzs)}. Крупнейшая статья: ${topExp ? `${topExp.title} (${formatUzsPrice(topExp.amountUzs)})` : 'нет записей'}.`;
    }
    if (language === 'en') {
      return `Total expenses are ${formatUzsPrice(summary.totalExpenseUzs)}. Largest item: ${topExp ? `${topExp.title} (${formatUzsPrice(topExp.amountUzs)})` : 'none recorded'}.`;
    }
    return `Jami chiqimlar ${formatUzsPrice(summary.totalExpenseUzs)} ni tashkil qiladi. Eng katta xarajat: ${topExp ? `${topExp.title} (${formatUzsPrice(topExp.amountUzs)})` : 'yozuvlar yo‘q'}.`;
  }

  if (q.includes('atmen') || q.includes('bekor') || q.includes('отмен') || q.includes('cancel')) {
    if (language === 'ru') {
      return `Отменено заказов: ${summary.cancelledOrdersCount} на сумму ${formatUzsPrice(summary.cancelledOrdersValueUzs)}.`;
    }
    if (language === 'en') {
      return `There are ${summary.cancelledOrdersCount} cancelled orders totaling ${formatUzsPrice(summary.cancelledOrdersValueUzs)}.`;
    }
    return `Jami ${summary.cancelledOrdersCount} ta buyurtma bekor qilingan (Atmen), umumiy qiymati ${formatUzsPrice(summary.cancelledOrdersValueUzs)}.`;
  }

  return buildFinancialVoiceScript(summary, language);
}

export async function synthesizeBriefingSpeech(
  text: string,
): Promise<{ audioBase64: string | null; mimeType: string; usedFallback: boolean }> {
  const ai = getAiClient();
  if (!ai) {
    return { audioBase64: null, mimeType: 'audio/wav', usedFallback: true };
  }

  try {
    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text,
                speechMetadata: {
                  style: 'Clear, warm, confident restaurant financial assistant',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      }),
      5000,
    );

    const part = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (part?.data) {
      return {
        audioBase64: part.data,
        mimeType: part.mimeType || 'audio/wav',
        usedFallback: false,
      };
    }
  } catch {
    // Client falls back smoothly to Web Speech API synthesis if Gemini TTS is unavailable
  }

  return { audioBase64: null, mimeType: 'audio/wav', usedFallback: true };
}
