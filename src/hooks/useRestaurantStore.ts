import { useCallback, useEffect, useState } from 'react';
import {
  INITIAL_ACTIVITY,
  INITIAL_DISHES,
  INITIAL_LEDGER,
  INITIAL_ORDERS,
  INITIAL_RESERVATIONS,
  INITIAL_REVIEWS,
  INITIAL_SETTINGS,
  INITIAL_WAITERS,
} from '../data/seedData';
import type {
  DietaryTag,
  Dish,
  EMenuSource,
  LedgerCategory,
  LedgerType,
  Order,
  OrderStatus,
  PaymentMethod,
  Reservation,
  ReservationStatus,
  RestaurantServerState,
  RestaurantSettings,
  WaiterProfile,
} from '../types/restaurant';

const FALLBACK_STATE: RestaurantServerState = {
  dishes: INITIAL_DISHES,
  reservations: INITIAL_RESERVATIONS,
  reviews: INITIAL_REVIEWS,
  orders: INITIAL_ORDERS,
  ledger: INITIAL_LEDGER,
  activityLog: INITIAL_ACTIVITY,
  waiters: INITIAL_WAITERS,
  settings: INITIAL_SETTINGS,
  receiptArchive: [],
  version: 0,
};

async function apiJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `Server error (${res.status})`);
  }
  return data;
}

export function useRestaurantStore() {
  const [state, setState] = useState<RestaurantServerState>(FALLBACK_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastOrderAlert, setLastOrderAlert] = useState<Order | null>(null);

  const refreshState = useCallback(async () => {
    try {
      const next = await apiJson<RestaurantServerState>('/api/state');
      setState(next);
      setIsLoaded(true);
    } catch {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    refreshState();

    let source: EventSource | null = null;
    let reconnectTimer: number | null = null;

    const connect = () => {
      source = new EventSource('/api/stream');
      source.onopen = () => setIsConnected(true);
      source.addEventListener('state', (evt) => {
        try {
          const parsed = JSON.parse((evt as MessageEvent).data) as RestaurantServerState;
          setState(parsed);
          setIsLoaded(true);
        } catch {
          // Ignore malformed event
        }
      });
      source.addEventListener('order:created', (evt) => {
        try {
          const order = JSON.parse((evt as MessageEvent).data) as Order;
          setLastOrderAlert(order);
        } catch {
          // Ignore malformed event
        }
      });
      source.addEventListener('order:check_requested', (evt) => {
        try {
          const order = JSON.parse((evt as MessageEvent).data) as Order;
          setLastOrderAlert(order);
        } catch {
          // Ignore malformed event
        }
      });
      source.addEventListener('order:updated', (evt) => {
        try {
          const order = JSON.parse((evt as MessageEvent).data) as Order;
          if (order.status === 'Cancelled' && order.cancelledBy === 'guest') {
            setLastOrderAlert(order);
          }
        } catch {
          // Ignore malformed event
        }
      });
      source.onerror = () => {
        setIsConnected(false);
        source?.close();
        if (reconnectTimer) window.clearTimeout(reconnectTimer);
        reconnectTimer = window.setTimeout(connect, 2500);
      };
    };

    connect();

    return () => {
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      source?.close();
    };
  }, [refreshState]);

  const placeOrder = async (input: {
    tableNumber: string;
    source: EMenuSource;
    guestName?: string;
    guestPhone?: string;
    waiterId?: string;
    waiterName?: string;
    waiterCode?: string;
    note?: string;
    items: Array<{ dishId: string; quantity: number }>;
  }): Promise<Order> => {
    const res = await apiJson<{ order: Order; state: RestaurantServerState }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    setState(res.state);
    return res.order;
  };

  const requestElectronicCheck = async (orderId: string): Promise<Order> => {
    const res = await apiJson<{ order: Order; state: RestaurantServerState }>(
      `/api/orders/${encodeURIComponent(orderId)}/request-check`,
      { method: 'POST' },
    );
    setState(res.state);
    return res.order;
  };

  const cancelOrderByGuest = async (orderId: string, reason = 'Mijoz fikridan qaytdi') => {
    const res = await apiJson<{ order: Order; state: RestaurantServerState }>(
      `/api/orders/${encodeURIComponent(orderId)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'Cancelled',
          cancelledBy: 'guest',
          cancelReason: reason,
        }),
      },
    );
    setState(res.state);
    return res.order;
  };

  const updateOrderStatus = async (
    orderId: string,
    status: OrderStatus,
    options: { paymentMethod?: PaymentMethod; cancelReason?: string } = {},
  ) => {
    const res = await apiJson<{ order: Order; state: RestaurantServerState }>(
      `/api/orders/${encodeURIComponent(orderId)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          paymentMethod: options.paymentMethod,
          cancelledBy: 'staff',
          cancelReason: options.cancelReason,
        }),
      },
    );
    setState(res.state);
    return res.order;
  };

  const addWaiter = async (input: {
    name: string;
    pinCode: string;
    commissionPercent?: number;
  }): Promise<WaiterProfile> => {
    const res = await apiJson<{ waiter: WaiterProfile; state: RestaurantServerState }>(
      '/api/waiters',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
    setState(res.state);
    return res.waiter;
  };

  const updateWaiter = async (
    id: string,
    patch: Partial<Pick<WaiterProfile, 'name' | 'pinCode' | 'commissionPercent' | 'active'>>,
  ): Promise<WaiterProfile> => {
    const res = await apiJson<{ waiter: WaiterProfile; state: RestaurantServerState }>(
      `/api/waiters/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      },
    );
    setState(res.state);
    return res.waiter;
  };

  const deleteWaiter = async (id: string) => {
    const res = await apiJson<{ state: RestaurantServerState }>(
      `/api/waiters/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    );
    setState(res.state);
  };

  const updateSettings = async (patch: Partial<RestaurantSettings>) => {
    const res = await apiJson<{ settings: RestaurantSettings; state: RestaurantServerState }>(
      '/api/settings',
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      },
    );
    setState(res.state);
    return res.settings;
  };

  const addLedgerEntry = async (input: {
    type: LedgerType;
    category: LedgerCategory;
    title: string;
    amountUzs: number;
    paymentMethod: PaymentMethod;
    note?: string;
    createdBy?: string;
    date?: string;
  }) => {
    const res = await apiJson<{ state: RestaurantServerState }>('/api/ledger', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    setState(res.state);
  };

  const deleteLedgerEntry = async (id: string) => {
    const res = await apiJson<{ state: RestaurantServerState }>(
      `/api/ledger/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    );
    setState(res.state);
  };

  const createReservation = async (reservation: Reservation) => {
    const res = await apiJson<{ state: RestaurantServerState }>('/api/reservations', {
      method: 'POST',
      body: JSON.stringify(reservation),
    });
    setState(res.state);
  };

  const updateReservationStatus = async (id: string, status: ReservationStatus) => {
    const res = await apiJson<{ state: RestaurantServerState }>(
      `/api/reservations/${encodeURIComponent(id)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      },
    );
    setState(res.state);
  };

  const addDish = async (dishData: Omit<Dish, 'id' | 'ordersToday'>) => {
    const res = await apiJson<{ state: RestaurantServerState }>('/api/dishes', {
      method: 'POST',
      body: JSON.stringify(dishData),
    });
    setState(res.state);
  };

  const updateDish = async (updated: Dish) => {
    const res = await apiJson<{ state: RestaurantServerState }>(
      `/api/dishes/${encodeURIComponent(updated.id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(updated),
      },
    );
    setState(res.state);
  };

  const toggleDishDietaryTag = async (id: string, tag: DietaryTag) => {
    const res = await apiJson<{ state: RestaurantServerState }>(
      `/api/dishes/${encodeURIComponent(id)}/tags`,
      {
        method: 'POST',
        body: JSON.stringify({ tag }),
      },
    );
    setState(res.state);
  };

  const deleteDish = async (id: string) => {
    const res = await apiJson<{ state: RestaurantServerState }>(
      `/api/dishes/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    );
    setState(res.state);
  };

  const toggleReviewFeatured = async (id: string) => {
    const res = await apiJson<{ state: RestaurantServerState }>(
      `/api/reviews/${encodeURIComponent(id)}/featured`,
      { method: 'POST' },
    );
    setState(res.state);
  };

  const toggleReviewHidden = async (id: string) => {
    const res = await apiJson<{ state: RestaurantServerState }>(
      `/api/reviews/${encodeURIComponent(id)}/hidden`,
      { method: 'POST' },
    );
    setState(res.state);
  };

  const closeDailyShift = async (options: {
    archiveChecks: boolean;
    closedBy?: string;
  }) => {
    const res = await apiJson<{
      result: { archivedCount: number; remainingActiveCount: number; totalArchivedSaved: number };
      state: RestaurantServerState;
    }>('/api/shift/close', {
      method: 'POST',
      body: JSON.stringify(options),
    });
    setState(res.state);
    return res.result;
  };

  const clearReceiptArchive = async () => {
    const res = await apiJson<{
      result: { clearedCount: number };
      state: RestaurantServerState;
    }>('/api/shift/archive', {
      method: 'DELETE',
    });
    setState(res.state);
    return res.result;
  };

  return {
    state,
    isLoaded,
    isConnected,
    lastOrderAlert,
    clearLastOrderAlert: () => setLastOrderAlert(null),
    placeOrder,
    requestElectronicCheck,
    cancelOrderByGuest,
    updateOrderStatus,
    addWaiter,
    updateWaiter,
    deleteWaiter,
    updateSettings,
    addLedgerEntry,
    deleteLedgerEntry,
    closeDailyShift,
    clearReceiptArchive,
    createReservation,
    updateReservationStatus,
    addDish,
    updateDish,
    toggleDishDietaryTag,
    deleteDish,
    toggleReviewFeatured,
    toggleReviewHidden,
  };
}
