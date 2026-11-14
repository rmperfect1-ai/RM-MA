export type AppLanguage = 'uz' | 'ru' | 'en';

export type AppMode = 'lounge' | 'guest-order' | 'staff-os';

export type StaffRole = 'admin' | 'waiter' | 'kitchen' | 'cashier';

export type DishCategory =
  | 'Salads'
  | 'Soups'
  | 'Mains'
  | 'Grills'
  | 'Pastry & Doner'
  | 'Desserts'
  | 'Drinks';

export type DietaryTag = 'Vegan' | 'Gluten-Free' | 'Spicy';

export type DishVisualStyle =
  | 'salad'
  | 'soup'
  | 'doner'
  | 'kofte'
  | 'somsa'
  | 'osh'
  | 'cheesecake'
  | 'shashlik'
  | 'manti'
  | 'kabob'
  | 'choy';

export type EMenuSource = 'nfc' | 'qr' | 'web' | 'pos';

export interface AppLaunchParams {
  mode: AppMode;
  source: EMenuSource;
  table?: string;
  staffRole?: StaffRole;
}

export interface EMenuLaunchParams {
  open: boolean;
  source: EMenuSource;
  table?: string;
}

export interface Dish {
  id: string;
  name: string;
  category: DishCategory;
  priceUzs: number;
  portion?: string;
  description: string;
  featured: boolean;
  visualStyle: DishVisualStyle;
  ordersToday: number;
  dietaryTags: DietaryTag[];
  imageUrl?: string;
}

export type OrderStatus = 'Pending' | 'Preparing' | 'Ready' | 'Paid' | 'Cancelled';

export type PaymentMethod = 'Cash' | 'Card' | 'PaymeClick';

export interface OrderItem {
  dishId: string;
  name: string;
  priceUzs: number;
  quantity: number;
  portion?: string;
}

export interface WaiterProfile {
  id: string;
  name: string;
  pinCode: string;
  commissionPercent?: number;
  active: boolean;
  colorTag?: string;
}

export interface RestaurantSettings {
  defaultWaiterCommissionPercent: number;
  serviceChargePercent: number;
  tableCount: number;
  companyName: string;
  inn: string;
  virtualTerminalId: string;
}

export interface FiscalReceipt {
  receiptNumber: string;
  fiscalSign: string;
  inn: string;
  terminalId: string;
  companyName: string;
  soliqUrl: string;
  issuedAt: string;
  subtotalUzs: number;
  serviceChargePercent: number;
  serviceFeeUzs: number;
  waiterSharePercent: number;
  waiterShareUzs: number;
  totalUzs: number;
}

export interface StaffSession {
  role: StaffRole;
  waiter?: WaiterProfile;
}

export interface Order {
  id: string;
  code: string;
  tableNumber: string;
  source: EMenuSource;
  guestName?: string;
  guestPhone?: string;
  waiterId?: string;
  waiterName?: string;
  waiterCode?: string;
  items: OrderItem[];
  subtotalUzs?: number;
  serviceFeeUzs?: number;
  totalUzs: number;
  note?: string;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  checkRequested?: boolean;
  checkRequestedAt?: string;
  fiscalReceipt?: FiscalReceipt;
  waiterCommissionPercent?: number;
  waiterCommissionUzs?: number;
  cancelledBy?: 'guest' | 'staff';
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type LedgerType = 'income' | 'expense';

export type LedgerCategory =
  | 'Order Revenue'
  | 'Banquet / VIP'
  | 'Other Income'
  | 'Ingredients / Bazaar'
  | 'Staff Payroll'
  | 'Utilities & Rent'
  | 'Equipment & Delivery';

export interface LedgerEntry {
  id: string;
  type: LedgerType;
  category: LedgerCategory;
  title: string;
  amountUzs: number;
  paymentMethod: PaymentMethod;
  orderId?: string;
  note?: string;
  date: string;
  createdAt: string;
  createdBy: string;
}

export type ReservationStatus = 'Confirmed' | 'Pending' | 'Cancelled';

export interface Reservation {
  id: string;
  code: string;
  guestName: string;
  contact: string;
  date: string;
  time: string;
  partySize: number;
  requests: string;
  status: ReservationStatus;
  createdAt: string;
}

export interface Review {
  id: string;
  author: string;
  initials: string;
  rating: number;
  dateLabel: string;
  text: string;
  featured: boolean;
  hidden: boolean;
  visitContext: string;
}

export type GalleryCategory = 'Food & Drink' | 'Vibe' | 'Menu';

export interface GalleryItem {
  id: string;
  title: string;
  category: GalleryCategory;
  caption: string;
  aspect: 'tall' | 'wide' | 'square';
  motif: 'lagan' | 'courtyard' | 'somsa' | 'tea' | 'cheesecake' | 'tandoor';
  imageUrl: string;
}

export interface ActivityEntry {
  id: string;
  action: string;
  detail: string;
  timestamp: string;
  actorRole?: StaffRole | 'guest';
  actorName?: string;
}

export interface ArchivedReceipt {
  id: string;
  orderId: string;
  code: string;
  tableNumber: string;
  waiterId?: string;
  waiterName?: string;
  waiterCode?: string;
  guestName?: string;
  items: OrderItem[];
  subtotalUzs: number;
  serviceFeeUzs: number;
  totalUzs: number;
  waiterCommissionPercent?: number;
  waiterCommissionUzs?: number;
  paymentMethod: PaymentMethod;
  fiscalReceipt?: FiscalReceipt;
  closedAt: string;
  shiftDate: string;
}

export interface RestaurantServerState {
  dishes: Dish[];
  reservations: Reservation[];
  reviews: Review[];
  orders: Order[];
  ledger: LedgerEntry[];
  activityLog: ActivityEntry[];
  waiters: WaiterProfile[];
  settings: RestaurantSettings;
  receiptArchive?: ArchivedReceipt[];
  version: number;
}

export type SortField = 'guestName' | 'date' | 'partySize' | 'status';
export type SortDirection = 'asc' | 'desc';
