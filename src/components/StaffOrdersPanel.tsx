import {
  CheckCircle2,
  ChefHat,
  Clock,
  CreditCard,
  Plus,
  Utensils,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import type { Dish, Order, OrderStatus, PaymentMethod } from '../types/restaurant';
import { formatUzsPrice } from '../utils/restaurantLogic';

interface StaffOrdersPanelProps {
  orders: Order[];
  dishes: Dish[];
  onUpdateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    options?: { paymentMethod?: PaymentMethod; cancelReason?: string },
  ) => Promise<Order>;
  onCreatePosOrder: (input: {
    tableNumber: string;
    source: 'pos';
    guestName?: string;
    note?: string;
    items: Array<{ dishId: string; quantity: number }>;
  }) => Promise<Order>;
}

export function StaffOrdersPanel({
  orders,
  dishes,
  onUpdateOrderStatus,
  onCreatePosOrder,
}: StaffOrdersPanelProps) {
  const [filter, setFilter] = useState<'active' | 'paid' | 'cancelled' | 'all'>('active');
  const [paymentChoice, setPaymentChoice] = useState<Record<string, PaymentMethod>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  // Quick Walk-in / Waiter POS creator
  const [showPosModal, setShowPosModal] = useState(false);
  const [posTable, setPosTable] = useState('4');
  const [posDishId, setPosDishId] = useState(dishes[0]?.id ?? '');
  const [posQty, setPosQty] = useState(1);
  const [posNote, setPosNote] = useState('');

  const filteredOrders = orders.filter((order) => {
    if (filter === 'active') {
      return order.status === 'Pending' || order.status === 'Preparing' || order.status === 'Ready';
    }
    if (filter === 'paid') return order.status === 'Paid';
    if (filter === 'cancelled') return order.status === 'Cancelled';
    return true;
  });

  const activeCount = orders.filter(
    (o) => o.status === 'Pending' || o.status === 'Preparing' || o.status === 'Ready',
  ).length;
  const cancelledCount = orders.filter((o) => o.status === 'Cancelled').length;
  const paidCount = orders.filter((o) => o.status === 'Paid').length;

  const handleStatusChange = async (
    orderId: string,
    nextStatus: OrderStatus,
    paymentMethod?: PaymentMethod,
  ) => {
    setBusyId(orderId);
    try {
      await onUpdateOrderStatus(orderId, nextStatus, { paymentMethod });
    } finally {
      setBusyId(null);
    }
  };

  const handleQuickPosSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!posDishId || posQty <= 0) return;
    await onCreatePosOrder({
      tableNumber: posTable,
      source: 'pos',
      guestName: `Ofitsiant POS · Stol #${posTable}`,
      note: posNote.trim() || undefined,
      items: [{ dishId: posDishId, quantity: posQty }],
    });
    setPosNote('');
    setPosQty(1);
    setShowPosModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-[#C9A84C]/25 bg-[#14100C] p-1">
          {(
            [
              { id: 'active', label: `Faol (${activeCount})` },
              { id: 'paid', label: `To‘langan (${paidCount})` },
              { id: 'cancelled', label: `Atmen / Bekor (${cancelledCount})` },
              { id: 'all', label: `Hammasi (${orders.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                filter === tab.id
                  ? 'bg-[#C9A84C] text-[#0A0806]'
                  : 'text-[#B8AE98] hover:text-[#F5EDD6]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowPosModal((prev) => !prev)}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#C9A84C] px-4 py-2 text-xs font-semibold text-[#0A0806] hover:bg-[#E6CB7D]"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Ofitsiant POS Buyurtma</span>
        </button>
      </div>

      {/* Inline Waiter POS Quick Order Box */}
      {showPosModal && (
        <form
          onSubmit={handleQuickPosSubmit}
          className="grid grid-cols-1 gap-3 rounded-xl border border-[#C9A84C] bg-[#17120C] p-5 sm:grid-cols-5 sm:items-end"
        >
          <div>
            <label htmlFor="pos-table" className="block text-xs font-medium text-[#E5DEC9]">
              Stol raqami
            </label>
            <select
              id="pos-table"
              value={posTable}
              onChange={(e) => setPosTable(e.target.value)}
              className="mt-1 w-full rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3 py-2 text-xs text-[#F5EDD6]"
            >
              {Array.from({ length: 25 }, (_, i) => String(i + 1)).map((n) => (
                <option key={n} value={n}>
                  Stol #{n}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="pos-dish" className="block text-xs font-medium text-[#E5DEC9]">
              Taom
            </label>
            <select
              id="pos-dish"
              value={posDishId}
              onChange={(e) => setPosDishId(e.target.value)}
              className="mt-1 w-full rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3 py-2 text-xs text-[#F5EDD6]"
            >
              {dishes.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {formatUzsPrice(d.priceUzs)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="pos-qty" className="block text-xs font-medium text-[#E5DEC9]">
              Soni
            </label>
            <input
              id="pos-qty"
              type="number"
              min={1}
              max={30}
              value={posQty}
              onChange={(e) => setPosQty(Math.max(1, Number(e.target.value) || 1))}
              className="mt-1 w-full rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3 py-2 text-xs text-[#F5EDD6]"
            />
          </div>

          <button
            type="submit"
            className="rounded-md bg-[#C9A84C] px-4 py-2 text-xs font-semibold text-[#0A0806] hover:bg-[#E6CB7D]"
          >
            Oshxonaga yuborish
          </button>
        </form>
      )}

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-xl border border-[#C9A84C]/20 bg-[#14100C] p-10 text-center text-sm text-[#B8AE98]">
          Bu bo‘limda hozircha buyurtmalar yo‘q.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredOrders.map((order) => {
            const isCancelled = order.status === 'Cancelled';
            const isPaid = order.status === 'Paid';
            const selectedMethod = paymentChoice[order.id] ?? 'Cash';

            return (
              <div
                key={order.id}
                data-testid={`admin-order-card-${order.id}`}
                className={`flex flex-col justify-between rounded-xl border p-5 ${
                  isCancelled
                    ? 'border-[#8B3A2A]/70 bg-[#19100E]'
                    : isPaid
                      ? 'border-[#2D4A3E]/80 bg-[#111613]'
                      : 'border-[#C9A84C]/35 bg-[#14100C]'
                }`}
              >
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#C9A84C]/15 pb-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-[#E6CB7D]">
                          {order.code}
                        </span>
                        <span className="rounded border border-[#C9A84C]/30 bg-[#0A0806] px-2 py-0.5 text-xs font-medium text-[#F5EDD6]">
                          Stol #{order.tableNumber}
                        </span>
                        <span className="text-[11px] uppercase text-[#B8AE98]">
                          · {order.source}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#B8AE98]">
                        {order.guestName || `Stol #${order.tableNumber}`} ·{' '}
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          isCancelled
                            ? 'text-[#F0A495]'
                            : isPaid
                              ? 'text-[#A9CEBE]'
                              : 'text-[#E6CB7D]'
                        }`}
                      >
                        {isCancelled ? (
                          <XCircle className="h-3.5 w-3.5" />
                        ) : isPaid ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <Clock className="h-3.5 w-3.5" />
                        )}
                        {isCancelled
                          ? order.cancelledBy === 'guest'
                            ? 'Mijoz Atmen qildi'
                            : 'Bekor qilindi'
                          : isPaid
                            ? `To‘landi (${order.paymentMethod})`
                            : order.status}
                      </span>
                      <p className="mt-0.5 text-lg font-semibold tabular-nums text-[#F5EDD6]">
                        {formatUzsPrice(order.totalUzs)}
                      </p>
                    </div>
                  </div>

                  {/* Items list */}
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {order.items.map((item) => (
                      <li
                        key={`${order.id}-${item.dishId}`}
                        className="flex items-center justify-between gap-2 text-[#E5DEC9]"
                      >
                        <span>
                          <span className="font-semibold text-[#E6CB7D]">{item.quantity}×</span>{' '}
                          {item.name}
                        </span>
                        <span className="tabular-nums text-xs text-[#B8AE98]">
                          {formatUzsPrice(item.priceUzs * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {order.note && (
                    <p className="mt-2.5 rounded border border-[#C9A84C]/20 bg-[#0A0806] px-3 py-1.5 text-xs text-[#E6CB7D]">
                      Izoh: {order.note}
                    </p>
                  )}

                  {isCancelled && order.cancelReason && (
                    <p className="mt-2.5 rounded border border-[#8B3A2A]/50 bg-[#8B3A2A]/20 px-3 py-1.5 text-xs text-[#F0A495]">
                      Sabab: {order.cancelReason}
                    </p>
                  )}
                </div>

                {/* Staff Workflow Action Buttons */}
                {!isCancelled && !isPaid && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#C9A84C]/15 pt-3.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {order.status === 'Pending' && (
                        <button
                          type="button"
                          disabled={busyId === order.id}
                          onClick={() => handleStatusChange(order.id, 'Preparing')}
                          className="inline-flex items-center gap-1 rounded border border-[#C9A84C]/45 bg-[#C9A84C]/15 px-2.5 py-1.5 text-xs font-medium text-[#E6CB7D] hover:bg-[#C9A84C] hover:text-[#0A0806]"
                        >
                          <ChefHat className="h-3.5 w-3.5" />
                          <span>Tayyorlash</span>
                        </button>
                      )}
                      {(order.status === 'Pending' || order.status === 'Preparing') && (
                        <button
                          type="button"
                          disabled={busyId === order.id}
                          onClick={() => handleStatusChange(order.id, 'Ready')}
                          className="inline-flex items-center gap-1 rounded border border-[#C9A84C]/45 bg-[#0A0806] px-2.5 py-1.5 text-xs font-medium text-[#F5EDD6] hover:bg-[#1E1812]"
                        >
                          <Utensils className="h-3.5 w-3.5" />
                          <span>Tayyor</span>
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busyId === order.id}
                        onClick={() => handleStatusChange(order.id, 'Cancelled')}
                        className="inline-flex items-center gap-1 rounded border border-[#8B3A2A]/60 px-2.5 py-1.5 text-xs font-medium text-[#F0A495] hover:bg-[#8B3A2A]/30"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Atmen</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <select
                        aria-label={`Payment method for ${order.code}`}
                        value={selectedMethod}
                        onChange={(e) =>
                          setPaymentChoice((prev) => ({
                            ...prev,
                            [order.id]: e.target.value as PaymentMethod,
                          }))
                        }
                        className="rounded border border-[#2D4A3E] bg-[#0A0806] px-2 py-1.5 text-xs text-[#F5EDD6]"
                      >
                        <option value="Cash">Naqd</option>
                        <option value="Card">Karta</option>
                        <option value="PaymeClick">Payme/Click</option>
                      </select>
                      <button
                        type="button"
                        data-testid={`mark-paid-${order.id}`}
                        disabled={busyId === order.id}
                        onClick={() =>
                          handleStatusChange(order.id, 'Paid', selectedMethod)
                        }
                        className="inline-flex items-center gap-1 rounded bg-[#2D4A3E] px-3 py-1.5 text-xs font-semibold text-[#F5EDD6] hover:bg-[#3A6151]"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>To‘landi</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
