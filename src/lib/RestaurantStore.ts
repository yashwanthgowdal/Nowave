import {
  Order,
  OrderItemRecord,
  OrderStatus,
  ServiceRequest,
  ServiceRequestType,
  TableSession,
  TableStatus,
  BillPayment,
  CustomerReview,
  ShortlistItem,
  KitchenStation,
  RealtimeMenuEvent,
} from "./types";
import { getDishStation } from "./itemHelpers";
import { playBellSound, playOrderChime, playSuccessChime } from "./audioService";

const ORDERS_STORAGE_KEY = "nowave_orders_store_v1";
const TABLES_STORAGE_KEY = "nowave_tables_store_v1";
const REQUESTS_STORAGE_KEY = "nowave_service_requests_v1";
const PAYMENTS_STORAGE_KEY = "nowave_payments_store_v1";
const REVIEWS_STORAGE_KEY = "nowave_reviews_store_v1";

const RESTAURANT_BUS_CHANNEL = "nowave_restaurant_realtime_bus";

// Initial standard 6 restaurant tables as shown in the video
const INITIAL_TABLES: TableSession[] = [
  { tableNumber: "1", status: "eating", guestCount: 2, totalSpent: 840 },
  { tableNumber: "2", status: "bill", guestCount: 4, totalSpent: 1650 },
  { tableNumber: "3", status: "ordering", guestCount: 2, totalSpent: 0 },
  { tableNumber: "4", status: "eating", guestCount: 3, totalSpent: 1120 },
  { tableNumber: "5", status: "available", guestCount: 2, totalSpent: 0 },
  { tableNumber: "6", status: "eating", guestCount: 4, totalSpent: 1980 },
];

class RestaurantOperationsStore {
  private orders: Order[] = [];
  private tables: TableSession[] = [...INITIAL_TABLES];
  private serviceRequests: ServiceRequest[] = [];
  private payments: BillPayment[] = [];
  private reviews: CustomerReview[] = [];

  private listeners: Set<() => void> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private orderCounter: number = 214;

  constructor() {
    this.loadFromStorage();

    if (typeof window !== "undefined") {
      try {
        if ("BroadcastChannel" in window) {
          this.broadcastChannel = new BroadcastChannel(RESTAURANT_BUS_CHANNEL);
          this.broadcastChannel.onmessage = (e: MessageEvent<RealtimeMenuEvent>) => {
            if (e.data && e.data.type) {
              this.handleRemoteEvent(e.data);
            }
          };
        }
      } catch (err) {
        console.warn("BroadcastChannel not available:", err);
      }

      window.addEventListener("storage", (e: StorageEvent) => {
        if (
          e.key === ORDERS_STORAGE_KEY ||
          e.key === TABLES_STORAGE_KEY ||
          e.key === REQUESTS_STORAGE_KEY ||
          e.key === PAYMENTS_STORAGE_KEY
        ) {
          this.loadFromStorage();
          this.notify();
        }
      });
    }
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return;
    try {
      const storedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (storedOrders) this.orders = JSON.parse(storedOrders);

      const storedTables = localStorage.getItem(TABLES_STORAGE_KEY);
      if (storedTables) this.tables = JSON.parse(storedTables);

      const storedRequests = localStorage.getItem(REQUESTS_STORAGE_KEY);
      if (storedRequests) this.serviceRequests = JSON.parse(storedRequests);

      const storedPayments = localStorage.getItem(PAYMENTS_STORAGE_KEY);
      if (storedPayments) this.payments = JSON.parse(storedPayments);

      const storedReviews = localStorage.getItem(REVIEWS_STORAGE_KEY);
      if (storedReviews) this.reviews = JSON.parse(storedReviews);

      if (this.orders.length > 0) {
        const lastNum = parseInt(this.orders[0].orderNumber.replace("#", ""), 10);
        if (!isNaN(lastNum)) this.orderCounter = Math.max(this.orderCounter, lastNum + 1);
      }
    } catch (err) {
      console.warn("Error reading restaurant store from localStorage:", err);
    }
  }

  private persist() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(this.orders));
      localStorage.setItem(TABLES_STORAGE_KEY, JSON.stringify(this.tables));
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(this.serviceRequests));
      localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(this.payments));
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(this.reviews));
    } catch (err) {
      console.warn("Error saving restaurant store to localStorage:", err);
    }
  }

  private broadcast(type: RealtimeMenuEvent["type"], payload: Record<string, unknown>) {
    const event: RealtimeMenuEvent = {
      type,
      payload,
      timestamp: Date.now(),
    };
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(event);
      } catch {}
    }
  }

  private handleRemoteEvent(event: RealtimeMenuEvent) {
    this.loadFromStorage();
    if (event.type === "order_created") {
      playOrderChime();
    } else if (event.type === "service_called") {
      playBellSound();
    } else if (event.type === "bill_paid") {
      playSuccessChime();
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // ─── ORDERS API ───

  public createOrder(params: {
    tableNumber: string;
    items: ShortlistItem[];
    totalAmount: number;
    estimatedMinutes?: number;
  }): Order {
    const orderNum = `#${this.orderCounter++}`;
    const orderItems: OrderItemRecord[] = params.items.map((shortItem, idx) => {
      const station = getDishStation(shortItem.item);
      return {
        id: `oi-${Date.now()}-${idx}`,
        menuItemId: shortItem.item.id,
        name: shortItem.item.name,
        price: shortItem.calculatedPrice,
        quantity: shortItem.quantity,
        station,
        customization: shortItem.customization || {
          spiceLevel: "medium",
          portionSize: "full",
        },
        stationStatus: "pending",
        prepSecondsElapsed: 0,
      };
    });

    const newOrder: Order = {
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      orderNumber: orderNum,
      tableNumber: params.tableNumber,
      items: orderItems,
      totalAmount: params.totalAmount,
      status: "cooking",
      createdAt: Date.now(),
      estimatedMinutes: params.estimatedMinutes || 12,
    };

    this.orders.unshift(newOrder);

    // Update Table status
    this.updateTableStatus(params.tableNumber, "cooking", newOrder.id);

    this.persist();
    playOrderChime();
    this.broadcast("order_created", { order: newOrder });
    this.notify();

    return newOrder;
  }

  public updateOrderStatus(orderId: string, status: OrderStatus) {
    this.orders = this.orders.map((o) => {
      if (o.id === orderId) {
        const updated = { ...o, status };
        if (status === "served") {
          this.updateTableStatus(o.tableNumber, "eating");
        } else if (status === "completed") {
          this.updateTableStatus(o.tableNumber, "available");
        }
        return updated;
      }
      return o;
    });

    this.persist();
    this.broadcast("order_updated", { orderId, status });
    this.notify();
  }

  public updateItemStationStatus(
    orderId: string,
    itemId: string,
    stationStatus: "pending" | "cooking" | "ready"
  ) {
    this.orders = this.orders.map((o) => {
      if (o.id === orderId) {
        const updatedItems = o.items.map((i) =>
          i.id === itemId ? { ...i, stationStatus } : i
        );
        const allReady = updatedItems.every((i) => i.stationStatus === "ready");
        const status = allReady ? "ready" : o.status;
        return { ...o, items: updatedItems, status };
      }
      return o;
    });

    this.persist();
    this.broadcast("order_updated", { orderId, itemId, stationStatus });
    this.notify();
  }

  public getActiveOrderByTable(tableNumber: string): Order | undefined {
    return this.orders.find(
      (o) => o.tableNumber === tableNumber && o.status !== "completed"
    );
  }

  public getOrderById(orderId: string): Order | undefined {
    return this.orders.find((o) => o.id === orderId);
  }

  public getAllOrders(): Order[] {
    return [...this.orders];
  }

  // ─── SERVICE CALLS API ("Call Waiter") ───

  public callWaiter(tableNumber: string, type: ServiceRequestType): ServiceRequest {
    // Check if table already has an active pending request
    const existing = this.serviceRequests.find(
      (r) => r.tableNumber === tableNumber && r.status === "pending"
    );

    if (existing) {
      existing.type = type;
      existing.createdAt = Date.now();
      playBellSound();
      this.persist();
      this.broadcast("service_called", { request: existing });
      this.notify();
      return existing;
    }

    const request: ServiceRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tableNumber,
      type,
      status: "pending",
      createdAt: Date.now(),
    };

    this.serviceRequests.unshift(request);
    this.updateTableStatus(tableNumber, "help");

    this.persist();
    playBellSound();
    this.broadcast("service_called", { request });
    this.notify();

    return request;
  }

  public acknowledgeServiceRequest(requestId: string) {
    this.serviceRequests = this.serviceRequests.map((r) =>
      r.id === requestId ? { ...r, status: "acknowledged" } : r
    );
    this.persist();
    this.broadcast("service_resolved", { requestId });
    this.notify();
  }

  public resolveServiceRequest(requestId: string) {
    const req = this.serviceRequests.find((r) => r.id === requestId);
    if (req) {
      req.status = "resolved";
      req.resolvedAt = Date.now();
      // Revert table status from help back to eating or cooking
      const activeOrder = this.getActiveOrderByTable(req.tableNumber);
      const nextStatus: TableStatus = activeOrder
        ? activeOrder.status === "cooking"
          ? "cooking"
          : "eating"
        : "available";
      this.updateTableStatus(req.tableNumber, nextStatus);
    }
    this.persist();
    this.broadcast("service_resolved", { requestId });
    this.notify();
  }

  public getActiveServiceRequests(): ServiceRequest[] {
    return this.serviceRequests.filter((r) => r.status === "pending");
  }

  public getAllServiceRequests(): ServiceRequest[] {
    return [...this.serviceRequests];
  }

  // ─── TABLE MANAGEMENT API ───

  public updateTableStatus(
    tableNumber: string,
    status: TableStatus,
    currentOrderId?: string
  ) {
    const tableIndex = this.tables.findIndex((t) => t.tableNumber === tableNumber);
    if (tableIndex >= 0) {
      this.tables[tableIndex] = {
        ...this.tables[tableIndex],
        status,
        currentOrderId: currentOrderId || this.tables[tableIndex].currentOrderId,
      };
    } else {
      this.tables.push({
        tableNumber,
        status,
        currentOrderId,
        guestCount: 2,
        totalSpent: 0,
      });
    }
    this.persist();
    this.notify();
  }

  public getAllTables(): TableSession[] {
    return [...this.tables];
  }

  public getTableSession(tableNumber: string): TableSession {
    const table = this.tables.find((t) => t.tableNumber === tableNumber);
    if (table) return table;
    const newT: TableSession = {
      tableNumber,
      status: "available",
      guestCount: 2,
      totalSpent: 0,
    };
    this.tables.push(newT);
    return newT;
  }

  // ─── BILL PAYMENT & CHECKOUT API ───

  public recordPayment(params: {
    orderId: string;
    tableNumber: string;
    splitWays: number;
    perPersonAmount: number;
    tipAmount: number;
    totalPaid: number;
    method: BillPayment["method"];
  }): BillPayment {
    const payment: BillPayment = {
      id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...params,
      timestamp: Date.now(),
    };

    this.payments.unshift(payment);

    // Update order status to completed
    this.updateOrderStatus(params.orderId, "completed");

    // Update table total and clear table
    const table = this.tables.find((t) => t.tableNumber === params.tableNumber);
    if (table) {
      table.totalSpent = (table.totalSpent || 0) + params.totalPaid;
      table.status = "available";
      table.currentOrderId = undefined;
    }

    this.persist();
    playSuccessChime();
    this.broadcast("bill_paid", { payment });
    this.notify();

    return payment;
  }

  // ─── CUSTOMER REVIEWS API ───

  public submitReview(params: {
    orderId: string;
    tableNumber: string;
    rating: number;
    feedback?: string;
  }): CustomerReview {
    const review: CustomerReview = {
      id: `rev-${Date.now()}`,
      ...params,
      timestamp: Date.now(),
    };
    this.reviews.unshift(review);
    this.persist();
    this.broadcast("review_submitted", { review });
    this.notify();
    return review;
  }

  public getReviews(): CustomerReview[] {
    return [...this.reviews];
  }

  // ─── EXECUTIVE DASHBOARD METRICS ───

  public getLiveMetrics() {
    const occupiedTables = this.tables.filter((t) => t.status !== "available").length;
    const totalTables = this.tables.length || 6;

    const baseSales = 46700;
    const dynamicSales = this.payments.reduce((sum, p) => sum + p.totalPaid, 0);
    const totalSales = baseSales + dynamicSales;

    const baseOrders = 41;
    const totalOrdersCount = baseOrders + this.orders.length;

    let avgRating = 4.9;
    if (this.reviews.length > 0) {
      const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
      avgRating = Number(((sum + 4.9 * 20) / (this.reviews.length + 20)).toFixed(1));
    }

    return {
      occupiedTables,
      totalTables,
      totalOrdersCount,
      totalSales,
      avgRating,
      activeServiceCalls: this.getActiveServiceRequests().length,
    };
  }
}

export const RestaurantStore = new RestaurantOperationsStore();
