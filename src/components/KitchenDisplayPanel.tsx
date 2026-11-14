import { CheckCircle2, ChefHat, Clock, Flame, Utensils } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Order, OrderStatus } from '../types/restaurant';

interface KitchenDisplayPanelProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => Promise<Order>;
}

function formatWaitDuration(createdAtIso: string, nowMs: number): string {
  const createdMs = new Date(createdAtIso).getTime();
  if (!Number.isFinite(createdMs)) return '00:00';
  const diffSec = Math.max(0, Math.floor((nowMs - createdMs) / 1000));
  const mins = Math.floor(diffSec / 60);
  const secs = diffSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function KitchenDisplayPanel({ orders, onUpdateOrderStatus }: KitchenDisplayPanelProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'active' | 'ready' | 'cancelled'>('active');
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 10000);
    return () => window.clearInterval(timer);
  }, []);

  // Kitchen Display ONLY sees incoming orders to prepare (zero prices or financial data)
  const incomingOrders = orders.filter(
    (o) => o.status === 'Pending' || o.status === 'Preparing',
  );
  const readyOrders = orders.filter((o) => o.status === 'Ready');
  const cancelledOrders = orders.filter((o) => o.status === 'Cancelled').slice(0, 8);

  const visibleOrders =
    filter === 'active' ? incomingOrders : filter === 'ready' ? readyOrders : cancelledOrders;

  const handleStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setBusyId(orderId);
    try {
      await onUpdateOrderStatus(orderId, nextStatus);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div data-testid="kitchen-kds-panel" className="space-y-6">
      {/* Top KDS Summary Strip */}
      <div className="flex flex-col gap-4 rounded-xl border border-[#C9A84C]/30 bg-[#14100C] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#C9A84C]/40 bg-[#1C160E] text-[#E6CB7D]">
            <ChefHat className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C9A84C]">
              Oshpaz Dasturi (KDS) · Faqat Oshxona Uchun
            </p>
            <h2 className="font-display text-2xl font-semibold text-[#F5EDD6] sm:text-3xl">
              Oshxona Buyurtmalar Ekrani
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'active', label: `Pishirilishi kerak (${incomingOrders.length})` },
              { id: 'ready', label: `Tayyor / Tarqatish (${readyOrders.length})` },
              { id: 'cancelled', label: `Atmen (${cancelledOrders.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                filter === tab.id
                  ? 'bg-[#C9A84C] text-[#0A0806]'
                  : 'border border-[#C9A84C]/25 bg-[#0A0806] text-[#B8AE98] hover:text-[#F5EDD6]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Kitchen Tickets Grid */}
      {visibleOrders.length === 0 ? (
        <div className="rounded-xl border border-[#C9A84C]/20 bg-[#14100C] p-12 text-center">
          <Utensils className="mx-auto h-10 w-10 text-[#C9A84C]/55" />
          <p className="font-display mt-3 text-2xl text-[#F5EDD6]">
            {filter === 'active'
              ? 'Hozircha yangi buyurtmalar yo‘q'
              : filter === 'ready'
                ? 'Tayyor kutayotgan taomlar yo‘q'
                : 'Bekor qilingan buyurtmalar yo‘q'}
          </p>
          <p className="mt-1 text-xs text-[#B8AE98]">
            Ofitsiantlar yoki stol QR/NFC dan buyurtma berilishi bilan darhol shu ekranga chiqadi.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleOrders.map((order) => {
            const isPending = order.status === 'Pending';
            const isPreparing = order.status === 'Preparing';
            const isReady = order.status === 'Ready';
            const isCancelled = order.status === 'Cancelled';

            return (
              <article
                key={order.id}
                data-testid={`kds-ticket-${order.id}`}
                className={`flex flex-col justify-between rounded-xl border p-5 transition-all ${
                  isCancelled
                    ? 'border-[#8B3A2A]/75 bg-[#1B100E] opacity-85'
                    : isReady
                      ? 'border-[#2D4A3E] bg-[#111A16]'
                      : isPreparing
                        ? 'border-[#C9A84C] bg-[#1C160D]'
                        : 'border-[#E6CB7D]/70 bg-[#16120B]'
                }`}
              >
                <div>
                  {/* Ticket Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-[#C9A84C]/18 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-[#C9A84C] px-2.5 py-1 text-sm font-bold text-[#0A0806]">
                          Stol #{order.tableNumber}
                        </span>
                        <span className="font-mono text-xs font-semibold text-[#E6CB7D]">
                          {order.code}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-[#B8AE98]">
                        Ofitsiant:{' '}
                        <span className="font-semibold text-[#F5EDD6]">
                          {order.waiterName
                            ? `${order.waiterName} (${order.waiterCode ?? 'POS'})`
                            : `Mijoz ${order.source.toUpperCase()}`}
                        </span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold uppercase ${
                          isCancelled
                            ? 'bg-[#8B3A2A]/35 text-[#F0A495]'
                            : isReady
                              ? 'bg-[#2D4A3E]/55 text-[#A9CEBE]'
                              : isPreparing
                                ? 'bg-[#C9A84C]/25 text-[#E6CB7D]'
                                : 'bg-[#8B3A2A]/35 text-[#F0D388]'
                        }`}
                      >
                        {isPending
                          ? 'YANGI'
                          : isPreparing
                            ? 'TAYYORLANMOQDA'
                            : isReady
                              ? 'TAYYOR'
                              : 'ATMEN'}
                      </span>
                      <p className="mt-1 flex items-center justify-end gap-1 font-mono text-xs text-[#B8AE98]">
                        <Clock className="h-3 w-3" />
                        <span>{formatWaitDuration(order.createdAt, nowMs)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Dishes List (Large Clear Kitchen Typography, No Prices) */}
                  <ul className="mt-4 space-y-2.5">
                    {order.items.map((item) => (
                      <li
                        key={`${order.id}-${item.dishId}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-[#C9A84C]/15 bg-[#0A0806] px-3.5 py-2.5"
                      >
                        <span className="text-base font-semibold text-[#F5EDD6]">
                          {item.name}
                        </span>
                        <span className="rounded-md bg-[#C9A84C]/20 px-2.5 py-1 text-base font-bold tabular-nums text-[#E6CB7D]">
                          ×{item.quantity}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {order.note && (
                    <div className="mt-3 rounded-lg border border-[#E6CB7D]/35 bg-[#1B150A] px-3.5 py-2 text-xs font-medium text-[#E6CB7D]">
                      Oshpazga eslatma: {order.note}
                    </div>
                  )}

                  {isCancelled && order.cancelReason && (
                    <div className="mt-3 rounded-lg border border-[#8B3A2A]/60 bg-[#8B3A2A]/20 px-3.5 py-2 text-xs text-[#F0A495]">
                      Bekor qilindi: {order.cancelReason}
                    </div>
                  )}
                </div>

                {/* Big Kitchen Action Buttons */}
                {!isCancelled && (isPending || isPreparing) && (
                  <div className="mt-5 grid grid-cols-1 gap-2 border-t border-[#C9A84C]/15 pt-4 sm:grid-cols-2">
                    {isPending && (
                      <button
                        type="button"
                        data-testid={`kds-start-${order.id}`}
                        disabled={busyId === order.id}
                        onClick={() => handleStatus(order.id, 'Preparing')}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#C9A84C]/55 bg-[#C9A84C]/20 px-3 py-2.5 text-xs font-bold text-[#E6CB7D] transition-colors hover:bg-[#C9A84C] hover:text-[#0A0806] disabled:opacity-50"
                      >
                        <Flame className="h-4 w-4" />
                        <span>Tayyorlashni boshlash</span>
                      </button>
                    )}

                    <button
                      type="button"
                      data-testid={`kds-ready-${order.id}`}
                      disabled={busyId === order.id}
                      onClick={() => handleStatus(order.id, 'Ready')}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#2D4A3E] px-3 py-2.5 text-xs font-bold text-[#F5EDD6] transition-colors hover:bg-[#3A6151] disabled:opacity-50 ${
                        isPending ? '' : 'sm:col-span-2'
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Tayyor (Ofitsiantga xabar)</span>
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
