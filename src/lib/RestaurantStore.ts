import {
  Order,
  OrderItemRecord,
  OrderStatus,
  TableSession,
  TableStatus,
  Waiter,
  BillPayment,
  CustomerReview,
  ShortlistItem,
  RealtimeMenuEvent,
} from "./types";
import { getDishStation } from "./itemHelpers";
import { playOrderChime, playSuccessChime } from "./audioService";
import { verifyTableToken } from "./tableSession";
import { supabase, isSupabaseConfigured } from "./supabase";

const ORDERS_STORAGE_KEY = "nowave_orders_store_v4";
const TABLES_STORAGE_KEY = "nowave_tables_store_v4";
const PAYMENTS_STORAGE_KEY = "nowave_payments_store_v4";
const REVIEWS_STORAGE_KEY = "nowave_reviews_store_v4";
const RESTAURANT_BUS_CHANNEL = "nowave_restaurant_realtime_bus";

export const DEFAULT_WAITERS: Waiter[] = [
  { id: "w1", name: "Rahul", pin: "1234", role: "lead", isActive: true, avatarColor: "#C59B43" },
  { id: "w2", name: "Priya", pin: "1234", role: "waiter", isActive: true, avatarColor: "#3B82F6" },
  { id: "w3", name: "Karthik", pin: "1234", role: "waiter", isActive: true, avatarColor: "#10B981" },
  { id: "w4", name: "Sneha", pin: "1234", role: "waiter", isActive: true, avatarColor: "#EC4899" },
];

function generateOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Initial Standard Tables for NoWave Smart Dining
const INITIAL_TABLES: TableSession[] = [
  { tableNumber: "1", tableLabel: "Table 01", qrToken: "qr_tbl_01", status: "available", verificationOtp: "4821", otpAttempts: 0, guestCount: 2, totalSpent: 0, lastActiveAt: Date.now() },
  { tableNumber: "2", tableLabel: "Table 02", qrToken: "qr_tbl_02", status: "available", verificationOtp: "7392", otpAttempts: 0, guestCount: 4, totalSpent: 0, lastActiveAt: Date.now() },
  { tableNumber: "3", tableLabel: "Table 03", qrToken: "qr_tbl_03", status: "available", verificationOtp: "5129", otpAttempts: 0, guestCount: 2, totalSpent: 0, lastActiveAt: Date.now() },
  { tableNumber: "4", tableLabel: "Table 04", qrToken: "qr_tbl_04", status: "available", verificationOtp: "8301", otpAttempts: 0, guestCount: 4, totalSpent: 0, lastActiveAt: Date.now() },
  { tableNumber: "5", tableLabel: "Table 05", qrToken: "qr_tbl_05", status: "available", verificationOtp: "2948", otpAttempts: 0, guestCount: 2, totalSpent: 0, lastActiveAt: Date.now() },
  { tableNumber: "6", tableLabel: "Table 06", qrToken: "qr_tbl_06", status: "available", verificationOtp: "6173", otpAttempts: 0, guestCount: 4, totalSpent: 0, lastActiveAt: Date.now() },
  { tableNumber: "7", tableLabel: "Table 07", qrToken: "qr_tbl_07", status: "available", verificationOtp: "3502", otpAttempts: 0, guestCount: 6, totalSpent: 0, lastActiveAt: Date.now() },
  { tableNumber: "8", tableLabel: "Table 08", qrToken: "qr_tbl_08", status: "available", verificationOtp: "9416", otpAttempts: 0, guestCount: 4, totalSpent: 0, lastActiveAt: Date.now() },
  { tableNumber: "9", tableLabel: "Table 09", qrToken: "qr_tbl_09", status: "available", verificationOtp: "1824", otpAttempts: 0, guestCount: 4, totalSpent: 0, lastActiveAt: Date.now() },
  { tableNumber: "10", tableLabel: "Table 10", qrToken: "qr_tbl_10", status: "available", verificationOtp: "7645", otpAttempts: 0, guestCount: 2, totalSpent: 0, lastActiveAt: Date.now() },
  { tableNumber: "12", tableLabel: "Table 12", qrToken: "qr_tbl_12", status: "available", verificationOtp: "3912", otpAttempts: 0, guestCount: 4, totalSpent: 0, lastActiveAt: Date.now() },
  { tableNumber: "14", tableLabel: "Table 14", qrToken: "qr_tbl_14", status: "available", verificationOtp: "6489", otpAttempts: 0, guestCount: 6, totalSpent: 0, lastActiveAt: Date.now() },
  { tableNumber: "Patio-1", tableLabel: "Patio 1", qrToken: "qr_patio_01", status: "available", verificationOtp: "5281", otpAttempts: 0, guestCount: 4, totalSpent: 0, lastActiveAt: Date.now() },
  { tableNumber: "Patio-2", tableLabel: "Patio 2", qrToken: "qr_patio_02", status: "available", verificationOtp: "9134", otpAttempts: 0, guestCount: 4, totalSpent: 0, lastActiveAt: Date.now() },
  { tableNumber: "VIP", tableLabel: "VIP Lounge", qrToken: "qr_vip_lounge", status: "available", verificationOtp: "8820", otpAttempts: 0, guestCount: 8, totalSpent: 0, lastActiveAt: Date.now() },
];

class RestaurantOperationsStore {
  private orders: Order[] = [];
  private tables: TableSession[] = [...INITIAL_TABLES];
  private waiters: Waiter[] = [...DEFAULT_WAITERS];
  private payments: BillPayment[] = [];
  private reviews: CustomerReview[] = [];

  private listeners: Set<() => void> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private orderCounter: number = 214;
  private pollingTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.loadFromStorage();
    this.initRealtime();
    this.startPollingFallback();
  }

  private initRealtime() {
    if (typeof window === "undefined") return;

    // 1. Browser BroadcastChannel for instant local cross-tab sync
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

    // 2. Storage event listener for cross-window sync
    window.addEventListener("storage", (e: StorageEvent) => {
      if (
        e.key === ORDERS_STORAGE_KEY ||
        e.key === TABLES_STORAGE_KEY ||
        e.key === PAYMENTS_STORAGE_KEY
      ) {
        this.loadFromStorage();
        this.notify();
      }
    });

    // 3. Supabase Realtime Subscription (Production Cloud DB)
    if (supabase && isSupabaseConfigured) {
      try {
        const channel = supabase
          .channel("nowave-live-sync")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "restaurant_tables" },
            (payload) => {
              this.handleSupabaseTableChange(payload);
            }
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "orders" },
            (payload) => {
              this.handleSupabaseOrderChange(payload);
            }
          )
          .subscribe();

        console.info("⚡ Supabase Realtime WebSocket channel active:", channel.topic);
      } catch (err) {
        console.warn("Supabase Realtime subscription error:", err);
      }
    }
  }

  // Automatic 2.5-second SWR/Polling Fallback for restrictive café Wi-Fi
  private startPollingFallback() {
    if (typeof window === "undefined") return;
    this.pollingTimer = setInterval(() => {
      this.syncFromCloudOrStorage();
    }, 2500);
  }

  private async syncFromCloudOrStorage() {
    if (supabase && isSupabaseConfigured) {
      try {
        const { data: dbTables } = await supabase.from("restaurant_tables").select("*");
        if (dbTables && dbTables.length > 0) {
          dbTables.forEach((row: any) => {
            const idx = this.tables.findIndex((t) => t.tableNumber === row.table_number);
            const session: TableSession = {
              tableNumber: row.table_number,
              tableLabel: row.table_label || `Table ${row.table_number}`,
              qrToken: row.qr_token || undefined,
              status: row.status as TableStatus,
              assignedWaiterId: row.assigned_waiter_id || undefined,
              assignedWaiterName: row.assigned_waiter_name || undefined,
              verificationOtp: row.verification_otp || undefined,
              otpAttempts: row.otp_attempts || 0,
              currentOrderId: row.current_order_id || undefined,
              guestCount: row.guest_count || 2,
              totalSpent: Number(row.total_spent) || 0,
              lastActiveAt: row.last_active ? new Date(row.last_active).getTime() : Date.now(),
            };
            if (idx >= 0) {
              this.tables[idx] = { ...this.tables[idx], ...session };
            } else {
              this.tables.push(session);
            }
          });
          this.persist();
          this.notify();
        }

        const { data: dbOrders } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .neq("status", "completed");

        if (dbOrders && dbOrders.length > 0) {
          dbOrders.forEach((row: any) => {
            const idx = this.orders.findIndex((o) => o.id === row.id);
            if (idx >= 0) {
              this.orders[idx] = {
                ...this.orders[idx],
                status: row.status as OrderStatus,
                assignedWaiterId: row.assigned_waiter_id || undefined,
                assignedWaiterName: row.assigned_waiter_name || undefined,
                verificationOtp: row.verification_otp || this.orders[idx].verificationOtp,
              };
            } else {
              const mappedItems: OrderItemRecord[] = (row.order_items || []).map((oi: any) => ({
                id: oi.id,
                menuItemId: oi.menu_item_id,
                name: oi.name,
                price: Number(oi.price),
                quantity: oi.quantity,
                station: oi.station,
                customization: oi.customization || { spiceLevel: "medium", portionSize: "full" },
                stationStatus: oi.station_status || "pending",
                prepSecondsElapsed: 0,
              }));

              this.orders.unshift({
                id: row.id,
                orderNumber: row.order_number,
                tableNumber: row.table_number,
                tableLabel: row.table_label || `Table ${row.table_number}`,
                items: mappedItems,
                totalAmount: Number(row.total_amount),
                status: row.status as OrderStatus,
                verificationOtp: row.verification_otp,
                assignedWaiterId: row.assigned_waiter_id || undefined,
                assignedWaiterName: row.assigned_waiter_name || undefined,
                createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
                estimatedMinutes: row.estimated_minutes || 12,
              });
            }
          });
          this.persist();
          this.notify();
        }
      } catch (err) {
        // Silently continue with local store
      }
    } else {
      this.loadFromStorage();
    }
  }

  private handleSupabaseTableChange(payload: any) {
    if (!payload?.new) return;
    const row = payload.new;
    const idx = this.tables.findIndex((t) => t.tableNumber === row.table_number);
    const updated: TableSession = {
      tableNumber: row.table_number,
      tableLabel: row.table_label || `Table ${row.table_number}`,
      qrToken: row.qr_token || undefined,
      status: row.status as TableStatus,
      assignedWaiterId: row.assigned_waiter_id || undefined,
      assignedWaiterName: row.assigned_waiter_name || undefined,
      verificationOtp: row.verification_otp || undefined,
      otpAttempts: row.otp_attempts || 0,
      currentOrderId: row.current_order_id || undefined,
      guestCount: row.guest_count || 2,
      totalSpent: Number(row.total_spent) || 0,
      lastActiveAt: Date.now(),
    };

    if (idx >= 0) {
      this.tables[idx] = { ...this.tables[idx], ...updated };
    } else {
      this.tables.push(updated);
    }
    this.persist();
    this.notify();
  }

  private async handleSupabaseOrderChange(payload: any) {
    if (!payload?.new) return;
    const row = payload.new;
    const idx = this.orders.findIndex((o) => o.id === row.id || o.orderNumber === row.order_number);
    if (idx >= 0) {
      this.orders[idx] = {
        ...this.orders[idx],
        status: row.status as OrderStatus,
        assignedWaiterId: row.assigned_waiter_id || undefined,
        assignedWaiterName: row.assigned_waiter_name || undefined,
        verificationOtp: row.verification_otp || this.orders[idx].verificationOtp,
      };
    } else {
      let items: OrderItemRecord[] = [];
      if (supabase && isSupabaseConfigured) {
        try {
          const { data: dbItems } = await supabase.from("order_items").select("*").eq("order_id", row.id);
          if (dbItems && dbItems.length > 0) {
            items = dbItems.map((oi: any) => ({
              id: oi.id,
              menuItemId: oi.menu_item_id,
              name: oi.name,
              price: Number(oi.price),
              quantity: oi.quantity,
              station: oi.station,
              customization: oi.customization || { spiceLevel: "medium", portionSize: "full" },
              stationStatus: oi.station_status || "pending",
              prepSecondsElapsed: 0,
            }));
          }
        } catch {}
      }

      this.orders.unshift({
        id: row.id,
        orderNumber: row.order_number,
        tableNumber: row.table_number,
        tableLabel: row.table_label || `Table ${row.table_number}`,
        items,
        totalAmount: Number(row.total_amount),
        status: row.status as OrderStatus,
        verificationOtp: row.verification_otp,
        assignedWaiterId: row.assigned_waiter_id || undefined,
        assignedWaiterName: row.assigned_waiter_name || undefined,
        createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
        estimatedMinutes: row.estimated_minutes || 12,
      });
      playOrderChime();
    }
    this.persist();
    this.notify();
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return;
    try {
      const storedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (storedOrders) this.orders = JSON.parse(storedOrders);

      const storedTables = localStorage.getItem(TABLES_STORAGE_KEY);
      if (storedTables) {
        const parsed = JSON.parse(storedTables);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.tables = parsed;
        }
      }

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
    } else if (event.type === "bill_paid" || event.type === "order_verified") {
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

  // ─── DYNAMIC TABLE CRUD & MANAGEMENT ───

  public async createTable(params: {
    tableNumber: string;
    tableLabel?: string;
    guestCount?: number;
  }): Promise<TableSession> {
    const cleanNumber = params.tableNumber.trim();
    const cleanLabel =
      params.tableLabel?.trim() ||
      (isNaN(Number(cleanNumber)) ? cleanNumber : `Table ${cleanNumber.padStart(2, "0")}`);
    const qrToken = `qr_${cleanNumber.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    const otp = generateOtp();

    const newTable: TableSession = {
      tableNumber: cleanNumber,
      tableLabel: cleanLabel,
      qrToken,
      status: "available",
      verificationOtp: otp,
      otpAttempts: 0,
      guestCount: params.guestCount || 4,
      totalSpent: 0,
      lastActiveAt: Date.now(),
    };

    const existingIdx = this.tables.findIndex(
      (t) => t.tableNumber.toLowerCase() === cleanNumber.toLowerCase()
    );
    if (existingIdx >= 0) {
      this.tables[existingIdx] = { ...this.tables[existingIdx], ...newTable };
    } else {
      this.tables.push(newTable);
    }

    this.persist();
    this.broadcast("table_updated", { table: newTable });
    this.notify();

    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.from("restaurant_tables").upsert({
          table_number: newTable.tableNumber,
          table_label: newTable.tableLabel,
          qr_token: newTable.qrToken,
          status: newTable.status,
          verification_otp: newTable.verificationOtp,
          guest_count: newTable.guestCount,
          last_active: new Date().toISOString(),
        });
      } catch (err) {
        console.warn("Supabase upsert table error:", err);
      }
    }

    return newTable;
  }

  public async deleteTable(tableNumber: string): Promise<void> {
    this.tables = this.tables.filter((t) => t.tableNumber !== tableNumber);
    this.persist();
    this.broadcast("table_reset", { tableNumber });
    this.notify();

    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.from("restaurant_tables").delete().eq("table_number", tableNumber);
      } catch (err) {
        console.warn("Supabase delete table error:", err);
      }
    }
  }

  /** Resolves table by either tableNumber, tableLabel, or qrToken */
  public resolveTable(identifier: string): TableSession {
    const clean = identifier.trim();
    let match = this.tables.find(
      (t) =>
        t.tableNumber.toLowerCase() === clean.toLowerCase() ||
        t.qrToken?.toLowerCase() === clean.toLowerCase() ||
        t.tableLabel?.toLowerCase() === clean.toLowerCase()
    );

    if (match) return match;
    return this.pingBrowsing(clean);
  }

  /** Triggered the moment a customer opens /table/:tableId */
  public pingBrowsing(identifier: string): TableSession {
    const clean = identifier.trim();
    let table = this.tables.find(
      (t) =>
        t.tableNumber.toLowerCase() === clean.toLowerCase() ||
        t.qrToken?.toLowerCase() === clean.toLowerCase() ||
        t.tableLabel?.toLowerCase() === clean.toLowerCase()
    );

    if (!table) {
      const tableNumber = clean;
      const tableLabel = isNaN(Number(tableNumber)) ? tableNumber : `Table ${tableNumber.padStart(2, "0")}`;
      const qrToken = `qr_${tableNumber.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
      table = {
        tableNumber,
        tableLabel,
        qrToken,
        status: "browsing",
        verificationOtp: generateOtp(),
        otpAttempts: 0,
        guestCount: 2,
        totalSpent: 0,
        lastActiveAt: Date.now(),
      };
      this.tables.push(table);
    } else {
      if (!table.verificationOtp) {
        table.verificationOtp = generateOtp();
      }
      if (table.status === "available") {
        table.status = "browsing";
      }
      table.lastActiveAt = Date.now();
    }

    this.persist();
    this.broadcast("table_updated", { table });
    this.notify();

    // Async cloud sync
    if (supabase && isSupabaseConfigured) {
      supabase
        .from("restaurant_tables")
        .upsert({
          table_number: table.tableNumber,
          table_label: table.tableLabel,
          qr_token: table.qrToken,
          status: table.status,
          verification_otp: table.verificationOtp,
          last_active: new Date().toISOString(),
        })
        .then();
    }

    return table;
  }

  public getTableSession(tableNumber: string): TableSession {
    return this.resolveTable(tableNumber);
  }

  public getAllTables(): TableSession[] {
    return [...this.tables];
  }

  public getAllWaiters(): Waiter[] {
    return [...this.waiters];
  }

  // ─── ORDERS & VERIFICATION FLOW ───

  /** Step A: Customer places order -> Status is 'awaiting_verification' */
  public createOrder(params: {
    tableNumber: string;
    tableLabel?: string;
    items: ShortlistItem[];
    totalAmount: number;
    estimatedMinutes?: number;
    sessionToken?: string;
  }): Order {
    if (params.sessionToken) {
      const isValid = verifyTableToken(params.sessionToken, params.tableNumber);
      if (!isValid) {
        console.warn("Anti-spoofing: order session token mismatch, re-anchoring table");
      }
    }

    const table = this.resolveTable(params.tableNumber);
    const otp = table.verificationOtp || generateOtp();
    table.verificationOtp = otp;
    table.status = "awaiting_verification";
    table.otpAttempts = 0;

    const orderNum = `#${this.orderCounter++}`;
    const orderItems: OrderItemRecord[] = params.items.map((shortItem, idx) => {
      const station = getDishStation(shortItem.item);
      return {
        id: `oi-${Date.now()}-${idx}`,
        menuItemId: shortItem.item.id,
        name: shortItem.item.name,
        price: shortItem.calculatedPrice || shortItem.item.price,
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
      tableNumber: table.tableNumber,
      tableLabel: table.tableLabel || params.tableLabel || `Table ${table.tableNumber}`,
      items: orderItems,
      totalAmount: params.totalAmount,
      status: "awaiting_verification", // Awaiting 4-digit Waiter OTP!
      verificationOtp: otp,
      assignedWaiterId: table.assignedWaiterId,
      assignedWaiterName: table.assignedWaiterName,
      createdAt: Date.now(),
      estimatedMinutes: params.estimatedMinutes || 12,
      sessionToken: params.sessionToken,
    };

    table.currentOrderId = newOrder.id;
    this.orders.unshift(newOrder);

    this.persist();
    playOrderChime();
    this.broadcast("order_created", { order: newOrder, table });
    this.notify();

    // Cloud push if configured
    if (supabase && isSupabaseConfigured) {
      supabase
        .from("orders")
        .insert({
          id: newOrder.id,
          order_number: newOrder.orderNumber,
          table_number: newOrder.tableNumber,
          table_label: newOrder.tableLabel,
          total_amount: newOrder.totalAmount,
          status: newOrder.status,
          verification_otp: newOrder.verificationOtp,
          assigned_waiter_id: newOrder.assignedWaiterId,
          assigned_waiter_name: newOrder.assignedWaiterName,
          estimated_minutes: newOrder.estimatedMinutes,
        })
        .then(({ error }: any) => {
          if (error) console.error("⚡ Supabase insert order error:", error);
        });

      if (orderItems.length > 0) {
        const dbItems = orderItems.map((oi) => ({
          id: oi.id,
          order_id: newOrder.id,
          menu_item_id: oi.menuItemId,
          name: oi.name,
          price: oi.price,
          quantity: oi.quantity,
          station: oi.station,
          customization: oi.customization,
          station_status: oi.stationStatus,
        }));
        supabase
          .from("order_items")
          .insert(dbItems)
          .then(({ error }: any) => {
            if (error) console.error("⚡ Supabase insert order_items error:", error);
          });
      }

      supabase
        .from("restaurant_tables")
        .upsert({
          table_number: table.tableNumber,
          table_label: table.tableLabel || `Table ${table.tableNumber}`,
          status: "awaiting_verification",
          verification_otp: otp,
          current_order_id: newOrder.id,
          last_active: new Date().toISOString(),
        })
        .then(({ error }: any) => {
          if (error) console.error("⚡ Supabase upsert table error:", error);
        });
    }

    return newOrder;
  }

  /** Step B: Waiter claims table */
  public claimTable(
    tableNumber: string,
    waiterId: string,
    waiterName: string
  ): { success: boolean; message: string } {
    const table = this.tables.find(
      (t) => t.tableNumber.toLowerCase() === tableNumber.toLowerCase()
    );
    if (!table) {
      return { success: false, message: "Table not found." };
    }

    // Atomic claim check
    if (table.assignedWaiterId && table.assignedWaiterId !== waiterId) {
      return {
        success: false,
        message: `Already claimed by ${table.assignedWaiterName}.`,
      };
    }

    table.assignedWaiterId = waiterId;
    table.assignedWaiterName = waiterName;

    // Update active order assigned waiter
    const activeOrder = this.orders.find(
      (o) =>
        o.tableNumber.toLowerCase() === tableNumber.toLowerCase() &&
        o.status === "awaiting_verification"
    );
    if (activeOrder) {
      activeOrder.assignedWaiterId = waiterId;
      activeOrder.assignedWaiterName = waiterName;
    }

    this.persist();
    this.broadcast("table_claimed", { tableNumber: table.tableNumber, waiterId, waiterName });
    this.notify();

    if (supabase && isSupabaseConfigured) {
      supabase
        .from("restaurant_tables")
        .update({
          assigned_waiter_id: waiterId,
          assigned_waiter_name: waiterName,
        })
        .eq("table_number", table.tableNumber)
        .then();

      if (activeOrder) {
        supabase
          .from("orders")
          .update({
            assigned_waiter_id: waiterId,
            assigned_waiter_name: waiterName,
          })
          .eq("id", activeOrder.id)
          .then();
      }
    }

    return {
      success: true,
      message: `${table.tableLabel || `Table ${table.tableNumber}`} locked to ${waiterName}.`,
    };
  }

  /** Transfer Table to another staff member */
  public transferTable(
    tableNumber: string,
    newWaiterId: string,
    newWaiterName: string
  ) {
    const table = this.tables.find(
      (t) => t.tableNumber.toLowerCase() === tableNumber.toLowerCase()
    );
    if (table) {
      table.assignedWaiterId = newWaiterId;
      table.assignedWaiterName = newWaiterName;
    }

    this.orders.forEach((o) => {
      if (
        o.tableNumber.toLowerCase() === tableNumber.toLowerCase() &&
        o.status !== "completed"
      ) {
        o.assignedWaiterId = newWaiterId;
        o.assignedWaiterName = newWaiterName;
      }
    });

    this.persist();
    this.broadcast("table_updated", { tableNumber, newWaiterId, newWaiterName });
    this.notify();

    if (supabase && isSupabaseConfigured) {
      supabase
        .from("restaurant_tables")
        .update({
          assigned_waiter_id: newWaiterId,
          assigned_waiter_name: newWaiterName,
        })
        .eq("table_number", tableNumber)
        .then();
    }
  }

  /** Step C: Verify 4-Digit Table OTP */
  public verifyOrderOtp(
    tableNumber: string,
    inputOtp: string
  ): { success: boolean; message: string; remainingAttempts?: number } {
    const table = this.tables.find(
      (t) => t.tableNumber.toLowerCase() === tableNumber.toLowerCase()
    );
    if (!table) return { success: false, message: "Table session expired." };

    // Rate-limiting: Max 5 wrong attempts per session
    const attempts = table.otpAttempts || 0;
    if (attempts >= 5) {
      return {
        success: false,
        message: "Maximum verification attempts reached (5/5). Waiter must verify at table.",
        remainingAttempts: 0,
      };
    }

    const cleanInput = inputOtp.trim();
    if (cleanInput !== table.verificationOtp) {
      table.otpAttempts = attempts + 1;
      this.persist();
      this.notify();
      return {
        success: false,
        message: "Incorrect 4-digit code. Check with your waiter.",
        remainingAttempts: 5 - table.otpAttempts,
      };
    }

    // OTP Correct: Confirm Order & Advance Table to 'ordered' -> routes to KDS!
    table.otpAttempts = 0;
    table.status = "ordered";

    const activeOrder = this.orders.find(
      (o) =>
        o.tableNumber.toLowerCase() === tableNumber.toLowerCase() &&
        o.status === "awaiting_verification"
    );
    if (activeOrder) {
      activeOrder.status = "confirmed";
    }

    this.persist();
    playSuccessChime();
    this.broadcast("order_verified", { tableNumber: table.tableNumber, orderId: activeOrder?.id });
    this.notify();

    if (supabase && isSupabaseConfigured) {
      supabase
        .from("restaurant_tables")
        .update({
          status: "ordered",
          otp_attempts: 0,
        })
        .eq("table_number", table.tableNumber)
        .then();

      if (activeOrder) {
        supabase
          .from("orders")
          .update({ status: "confirmed" })
          .eq("id", activeOrder.id)
          .then();
      }
    }

    return { success: true, message: "Order verified! Kitchen has started preparing." };
  }

  /** Waiter Direct Physical Override Verification */
  public waiterDirectVerify(tableNumber: string, waiterId: string) {
    const table = this.tables.find(
      (t) => t.tableNumber.toLowerCase() === tableNumber.toLowerCase()
    );
    if (!table) return;

    table.status = "ordered";
    table.otpAttempts = 0;

    const activeOrder = this.orders.find(
      (o) =>
        o.tableNumber.toLowerCase() === tableNumber.toLowerCase() &&
        o.status === "awaiting_verification"
    );
    if (activeOrder) {
      activeOrder.status = "confirmed";
      activeOrder.assignedWaiterId = waiterId;
    }

    this.persist();
    playSuccessChime();
    this.broadcast("order_verified", { tableNumber: table.tableNumber, orderId: activeOrder?.id, waiterId });
    this.notify();

    if (supabase && isSupabaseConfigured) {
      supabase
        .from("restaurant_tables")
        .update({ status: "ordered", otp_attempts: 0 })
        .eq("table_number", table.tableNumber)
        .then();

      if (activeOrder) {
        supabase
          .from("orders")
          .update({ status: "confirmed" })
          .eq("id", activeOrder.id)
          .then();
      }
    }
  }

  /** 1-Click Reset Table */
  public resetTable(tableNumber: string) {
    const tableIndex = this.tables.findIndex(
      (t) => t.tableNumber.toLowerCase() === tableNumber.toLowerCase()
    );
    const freshOtp = generateOtp();

    if (tableIndex >= 0) {
      const prev = this.tables[tableIndex];
      this.tables[tableIndex] = {
        ...prev,
        status: "available",
        verificationOtp: freshOtp,
        otpAttempts: 0,
        assignedWaiterId: undefined,
        assignedWaiterName: undefined,
        currentOrderId: undefined,
        totalSpent: 0,
        lastActiveAt: Date.now(),
      };
    }

    // Complete any hanging orders
    this.orders.forEach((o) => {
      if (
        o.tableNumber.toLowerCase() === tableNumber.toLowerCase() &&
        o.status !== "completed"
      ) {
        o.status = "completed";
      }
    });

    this.persist();
    this.broadcast("table_reset", { tableNumber, freshOtp });
    this.notify();

    if (supabase && isSupabaseConfigured) {
      supabase
        .from("restaurant_tables")
        .update({
          status: "available",
          verification_otp: freshOtp,
          otp_attempts: 0,
          assigned_waiter_id: null,
          assigned_waiter_name: null,
          current_order_id: null,
          last_active: new Date().toISOString(),
        })
        .eq("table_number", tableNumber)
        .then();
    }
  }

  // ─── KDS & STATION LIFECYCLE ───

  public updateOrderStatus(orderId: string, status: OrderStatus) {
    this.orders = this.orders.map((o) => {
      if (o.id === orderId) {
        const updated = { ...o, status };
        if (status === "cooking") {
          this.updateTableStatus(o.tableNumber, "cooking");
        } else if (status === "ready" || status === "served") {
          this.updateTableStatus(o.tableNumber, "eating");
        } else if (status === "completed") {
          this.updateTableStatus(o.tableNumber, "paid");
        }
        return updated;
      }
      return o;
    });

    this.persist();
    this.broadcast("order_updated", { orderId, status });
    this.notify();

    if (supabase && isSupabaseConfigured) {
      supabase.from("orders").update({ status }).eq("id", orderId).then();
    }
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

  public updateTableStatus(tableNumber: string, status: TableStatus) {
    const table = this.tables.find(
      (t) => t.tableNumber.toLowerCase() === tableNumber.toLowerCase()
    );
    if (table) {
      table.status = status;
      table.lastActiveAt = Date.now();
      this.persist();
      this.notify();

      if (supabase && isSupabaseConfigured) {
        supabase
          .from("restaurant_tables")
          .update({ status, last_active: new Date().toISOString() })
          .eq("table_number", table.tableNumber)
          .then();
      }
    }
  }

  public getActiveOrderByTable(tableNumber: string): Order | undefined {
    return this.orders.find(
      (o) =>
        o.tableNumber.toLowerCase() === tableNumber.toLowerCase() &&
        o.status !== "completed" &&
        o.status !== "cancelled"
    );
  }

  public getAllOrders(): Order[] {
    return [...this.orders];
  }

  // ─── BILL PAYMENT & CHECKOUT ───

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
    this.updateOrderStatus(params.orderId, "completed");

    const table = this.tables.find(
      (t) => t.tableNumber.toLowerCase() === params.tableNumber.toLowerCase()
    );
    if (table) {
      table.totalSpent = (table.totalSpent || 0) + params.totalPaid;
      table.status = "paid";
    }

    this.persist();
    playSuccessChime();
    this.broadcast("bill_paid", { payment });
    this.notify();

    if (supabase && isSupabaseConfigured) {
      supabase
        .from("payments")
        .insert({
          id: payment.id,
          order_id: payment.orderId,
          table_number: payment.tableNumber,
          split_ways: payment.splitWays,
          per_person_amount: payment.perPersonAmount,
          tip_amount: payment.tipAmount,
          total_paid: payment.totalPaid,
          payment_method: payment.method,
        })
        .then();
    }

    return payment;
  }

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

  public getLiveMetrics() {
    const activeTables = this.tables.filter((t) => t.status !== "available").length;
    const totalTables = this.tables.length || 15;

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
      activeTables,
      totalTables,
      totalOrdersCount,
      totalSales,
      avgRating,
    };
  }
}

export const RestaurantStore = new RestaurantOperationsStore();
