export interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  _count?: { items: number };
}

export type DietaryType = "veg" | "nonveg" | "vegan" | "egg";

export type KitchenStation = "tandoor" | "curry" | "drinks" | "desserts";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  dietaryType: DietaryType | string;
  spiceLevel: number; // default spice level 1-3
  isChefSpecial: boolean;
  isBestseller: boolean;
  availabilitySlot: string;
  isStruckOut: boolean;
  isAvailable: boolean;
  sortOrder: number;
  categoryId: string;
  category?: Category;
  station?: KitchenStation;
  allergens?: string[];
  halfPrice?: number;
  dealAddon?: {
    name: string;
    price: number;
  };
}

export interface ItemCustomization {
  spiceLevel: "mild" | "medium" | "spicy";
  portionSize: "half" | "full";
  selectedDeal?: {
    name: string;
    price: number;
  } | null;
  specialNote?: string;
}

export interface ShortlistItem {
  item: MenuItem;
  quantity: number;
  customization?: ItemCustomization;
  calculatedPrice: number;
  note?: string;
}

export type OrderStatus =
  | "awaiting_verification"
  | "confirmed"
  | "cooking"
  | "ready"
  | "served"
  | "completed"
  | "cancelled";

export interface OrderItemRecord {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  station: KitchenStation;
  customization: ItemCustomization;
  stationStatus: "pending" | "cooking" | "ready";
  prepSecondsElapsed: number;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "#214"
  tableNumber: string; // e.g. "5"
  items: OrderItemRecord[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: number;
  estimatedMinutes: number;
  sessionToken?: string;
  verificationOtp?: string; // 4-digit code e.g. "4829"
  assignedWaiterId?: string;
  assignedWaiterName?: string;
}

export type TableStatus =
  | "available"
  | "browsing"
  | "awaiting_verification"
  | "ordered"
  | "cooking"
  | "eating"
  | "paid";

export interface Waiter {
  id: string;
  name: string;
  pin: string; // 4-digit pin e.g. "1234"
  role: "waiter" | "lead";
  isActive: boolean;
  avatarColor?: string;
}

export interface TableSession {
  tableNumber: string;
  status: TableStatus;
  currentOrderId?: string;
  assignedWaiterId?: string;
  assignedWaiterName?: string;
  verificationOtp?: string; // 4-digit OTP e.g. "4829"
  otpAttempts?: number; // max 5 attempts
  guestCount?: number;
  totalSpent?: number;
  sessionToken?: string;
  lastActiveAt?: number;
}

export interface BillPayment {
  id: string;
  orderId: string;
  tableNumber: string;
  splitWays: number;
  perPersonAmount: number;
  tipAmount: number;
  totalPaid: number;
  method: "upi" | "card" | "cash" | "bank_transfer";
  timestamp: number;
}

export interface CustomerReview {
  id: string;
  orderId: string;
  tableNumber: string;
  rating: number; // 1 to 5
  feedback?: string;
  timestamp: number;
}

export interface RealtimeMenuEvent {
  type:
    | "item_updated"
    | "item_created"
    | "item_deleted"
    | "category_updated"
    | "reset_all"
    | "order_created"
    | "order_verified"
    | "order_updated"
    | "table_claimed"
    | "table_updated"
    | "table_reset"
    | "bill_paid"
    | "review_submitted"
    | "connected"
    | "heartbeat";
  payload: Record<string, unknown>;
  timestamp: number;
}
