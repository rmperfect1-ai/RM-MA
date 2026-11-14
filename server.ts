import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import type {
  AppLanguage,
  OrderStatus,
  PaymentMethod,
  ReservationStatus,
  StaffRole,
} from './src/types/restaurant';
import {
  generateFinancialBriefing,
  generateGuestConciergeReply,
  synthesizeBriefingSpeech,
} from './server/gemini';
import {
  addDish,
  addLedgerEntry,
  addReservation,
  addWaiter,
  clearReceiptArchive,
  closeDailyShift,
  deleteDish,
  deleteLedgerEntry,
  deleteWaiter,
  flushStateToDiskSync,
  getServerState,
  placeOrder,
  requestElectronicCheck,
  subscribeSseClient,
  toggleDishDietaryTag,
  toggleReviewFeatured,
  toggleReviewHidden,
  unsubscribeSseClient,
  updateDish,
  updateOrderStatus,
  updateReservationStatus,
  updateRestaurantSettings,
  updateWaiter,
  verifyStaffLogin,
} from './server/store';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '1mb' }));

  // Live state snapshot
  app.get('/api/state', (_req, res) => {
    res.json(getServerState());
  });

  // Real-time Server-Sent Events stream (syncs 25+ Waiters, Kitchen KDS, Cashier & Guests)
  app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    subscribeSseClient(res);

    const heartbeat = setInterval(() => {
      try {
        res.write(': keepalive\n\n');
      } catch {
        clearInterval(heartbeat);
        unsubscribeSseClient(res);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeat);
      unsubscribeSseClient(res);
    });
  });

  // Guest / Waiter POS Orders
  app.post('/api/orders', (req, res) => {
    try {
      const {
        tableNumber,
        source,
        guestName,
        guestPhone,
        waiterId,
        waiterName,
        waiterCode,
        note,
        items,
      } = req.body ?? {};
      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'Kamida bitta taom tanlang.' });
        return;
      }
      const order = placeOrder({
        tableNumber: String(tableNumber ?? '1'),
        source: source === 'nfc' || source === 'qr' || source === 'pos' ? source : 'web',
        guestName: typeof guestName === 'string' ? guestName : undefined,
        guestPhone: typeof guestPhone === 'string' ? guestPhone : undefined,
        waiterId: typeof waiterId === 'string' ? waiterId : undefined,
        waiterName: typeof waiterName === 'string' ? waiterName : undefined,
        waiterCode: typeof waiterCode === 'string' ? waiterCode : undefined,
        note: typeof note === 'string' ? note : undefined,
        items,
      });
      res.status(201).json({ order, state: getServerState() });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Buyurtma yuborishda xatolik.',
      });
    }
  });

  // Request Electronic Check (Soliq.uz QR) -> sends directly to Cashier & Guest receipt
  app.post('/api/orders/:id/request-check', (req, res) => {
    try {
      const order = requestElectronicCheck(req.params.id);
      res.json({ order, state: getServerState() });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Elektron chek yaratib bo‘lmadi.',
      });
    }
  });

  app.patch('/api/orders/:id/status', (req, res) => {
    try {
      const id = req.params.id;
      const { status, paymentMethod, cancelledBy, cancelReason } = req.body ?? {};
      const validStatuses: OrderStatus[] = ['Pending', 'Preparing', 'Ready', 'Paid', 'Cancelled'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ error: 'Noto‘g‘ri buyurtma holati.' });
        return;
      }
      const validPayments: PaymentMethod[] = ['Cash', 'Card', 'PaymeClick'];
      const updatedOrder = updateOrderStatus(id, status, {
        paymentMethod: validPayments.includes(paymentMethod) ? paymentMethod : undefined,
        cancelledBy: cancelledBy === 'guest' ? 'guest' : 'staff',
        cancelReason: typeof cancelReason === 'string' ? cancelReason : undefined,
      });
      res.json({ order: updatedOrder, state: getServerState() });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Buyurtma holatini yangilab bo‘lmadi.',
      });
    }
  });

  // Staff Authentication Verification (Admin / Personal Waiter PIN / Kitchen 0500 / Cashier 0900)
  app.post('/api/staff/verify', (req, res) => {
    const passcode = String(req.body?.passcode ?? '');
    const preferredRole = req.body?.preferredRole as StaffRole | undefined;
    const auth = verifyStaffLogin(passcode, preferredRole);
    if (auth.ok) {
      res.json(auth);
      return;
    }
    res.status(401).json({
      ok: false,
      error: "Noto'g'ri kod. Masalan: Ofitsiant (2100, 0800), Oshpaz (0500), Kassir (0900) yoki Admin.",
    });
  });

  // Waiters Roster CRUD (supports 25+ waiters)
  app.post('/api/waiters', (req, res) => {
    try {
      const { name, pinCode, commissionPercent } = req.body ?? {};
      const waiter = addWaiter({
        name: String(name ?? ''),
        pinCode: String(pinCode ?? ''),
        commissionPercent:
          typeof commissionPercent === 'number' ? commissionPercent : undefined,
      });
      res.status(201).json({ waiter, state: getServerState() });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Ofitsiant qo‘shishda xatolik.',
      });
    }
  });

  app.patch('/api/waiters/:id', (req, res) => {
    try {
      const waiter = updateWaiter(req.params.id, req.body ?? {});
      res.json({ waiter, state: getServerState() });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Ofitsiantni yangilab bo‘lmadi.',
      });
    }
  });

  app.delete('/api/waiters/:id', (req, res) => {
    deleteWaiter(req.params.id);
    res.json({ state: getServerState() });
  });

  // Restaurant Waiter Commission % & Soliq.uz Fiscal Settings
  app.patch('/api/settings', (req, res) => {
    const settings = updateRestaurantSettings(req.body ?? {});
    res.json({ settings, state: getServerState() });
  });

  // Accounting Kirim / Chiqim Ledger
  app.post('/api/ledger', (req, res) => {
    const { type, category, title, amountUzs, paymentMethod, note, createdBy, date } =
      req.body ?? {};
    const numAmount = Number(amountUzs);
    if (
      (type !== 'income' && type !== 'expense') ||
      typeof title !== 'string' ||
      !title.trim() ||
      !Number.isFinite(numAmount) ||
      numAmount <= 0
    ) {
      res.status(400).json({ error: 'Nomi va musbat UZS summa kiritilishi shart.' });
      return;
    }
    const entry = addLedgerEntry({
      type,
      category: category || (type === 'income' ? 'Other Income' : 'Ingredients / Bazaar'),
      title: title.trim(),
      amountUzs: numAmount,
      paymentMethod:
        paymentMethod === 'Card' || paymentMethod === 'PaymeClick' ? paymentMethod : 'Cash',
      note: typeof note === 'string' && note.trim() ? note.trim() : undefined,
      createdBy: typeof createdBy === 'string' && createdBy.trim() ? createdBy.trim() : 'Menejer',
      date: typeof date === 'string' ? date : undefined,
    });
    res.status(201).json({ entry, state: getServerState() });
  });

  app.delete('/api/ledger/:id', (req, res) => {
    deleteLedgerEntry(req.params.id);
    res.json({ state: getServerState() });
  });

  // Daily Shift Closing with Cashier confirmation and 30-day receipt archive
  app.post('/api/shift/close', (req, res) => {
    try {
      const { archiveChecks = true, closedBy } = req.body ?? {};
      const result = closeDailyShift({
        archiveChecks: Boolean(archiveChecks),
        closedBy: typeof closedBy === 'string' ? closedBy : undefined,
      });
      res.json({ result, state: getServerState() });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Smenani yopishda xatolik yuz berdi.',
      });
    }
  });

  // Purge/clear all archived receipts with cashier permission
  app.delete('/api/shift/archive', (_req, res) => {
    try {
      const result = clearReceiptArchive();
      res.json({ result, state: getServerState() });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Cheklar tarixini tozalab bo‘lmadi.',
      });
    }
  });

  // Reservations
  app.post('/api/reservations', (req, res) => {
    const reservation = req.body;
    if (!reservation?.guestName || !reservation?.code) {
      res.status(400).json({ error: 'Invalid reservation payload.' });
      return;
    }
    addReservation(reservation);
    res.status(201).json({ reservation, state: getServerState() });
  });

  app.patch('/api/reservations/:id/status', (req, res) => {
    const status = req.body?.status as ReservationStatus;
    if (status !== 'Confirmed' && status !== 'Pending' && status !== 'Cancelled') {
      res.status(400).json({ error: 'Invalid reservation status.' });
      return;
    }
    updateReservationStatus(req.params.id, status);
    res.json({ state: getServerState() });
  });

  // Menu Dishes CRUD
  app.post('/api/dishes', (req, res) => {
    const dishData = req.body;
    if (!dishData?.name || !dishData?.priceUzs) {
      res.status(400).json({ error: 'Dish name and price are required.' });
      return;
    }
    const dish = addDish(dishData);
    res.status(201).json({ dish, state: getServerState() });
  });

  app.put('/api/dishes/:id', (req, res) => {
    const updated = { ...req.body, id: req.params.id };
    updateDish(updated);
    res.json({ state: getServerState() });
  });

  app.post('/api/dishes/:id/tags', (req, res) => {
    const tag = req.body?.tag;
    if (tag !== 'Vegan' && tag !== 'Gluten-Free' && tag !== 'Spicy') {
      res.status(400).json({ error: 'Invalid dietary tag.' });
      return;
    }
    toggleDishDietaryTag(req.params.id, tag);
    res.json({ state: getServerState() });
  });

  app.delete('/api/dishes/:id', (req, res) => {
    deleteDish(req.params.id);
    res.json({ state: getServerState() });
  });

  // Reviews Moderation
  app.post('/api/reviews/:id/featured', (req, res) => {
    toggleReviewFeatured(req.params.id);
    res.json({ state: getServerState() });
  });

  app.post('/api/reviews/:id/hidden', (req, res) => {
    toggleReviewHidden(req.params.id);
    res.json({ state: getServerState() });
  });

  // Gemini AI Concierge (1st page Gusto AI widget)
  app.post('/api/ai/chat', async (req, res) => {
    const message = String(req.body?.message ?? '').trim();
    const language: AppLanguage =
      req.body?.language === 'ru' || req.body?.language === 'en' ? req.body.language : 'uz';
    if (!message) {
      res.status(400).json({ error: 'Xabar matni bo‘sh bo‘lmasligi kerak.' });
      return;
    }
    const result = await generateGuestConciergeReply(message, getServerState(), language);
    res.json(result);
  });

  // Gemini AI CFO Financial Briefing & Q&A
  app.post('/api/ai/briefing', async (req, res) => {
    const question =
      typeof req.body?.question === 'string' ? req.body.question.trim() : undefined;
    const language: AppLanguage =
      req.body?.language === 'ru' || req.body?.language === 'en' ? req.body.language : 'uz';
    const result = await generateFinancialBriefing(question, getServerState(), language);
    res.json(result);
  });

  // Gemini 3.8 TTS Spoken Audio Synthesis
  app.post('/api/ai/tts', async (req, res) => {
    const text = String(req.body?.text ?? '').trim();
    if (!text) {
      res.status(400).json({ error: 'Matn talab qilinadi.' });
      return;
    }
    const result = await synthesizeBriefingSpeech(text);
    res.json(result);
  });

  // Mount Vite middleware in development or serve compiled dist/ in production
  const distDir = path.resolve(process.cwd(), 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distDir);

  if (isProd) {
    app.use(express.static(distDir));
    app.get('/{*path}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sayqal Restaurant OS listening on http://localhost:${PORT}`);
  });

  const handleShutdown = () => {
    flushStateToDiskSync();
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
