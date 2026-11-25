import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  writeBatch,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db, isFirebaseConfigured, autoSeedFirestoreIfEmpty } from "./firebase";
import { MenuItem, Category, RealtimeMenuEvent } from "./types";
import { DEFAULT_CATEGORIES, INITIAL_MENU_ITEMS } from "./sampleMenu";

const BROADCAST_CHANNEL_NAME = "nowave_menu_realtime_bus";
const STORAGE_SYNC_KEY = "nowave_menu_sync_event";

class CloudMenuService {
  private inMemoryItems: MenuItem[] = [];
  private inMemoryCategories: Category[] = [...DEFAULT_CATEGORIES];
  private listeners: Set<(items: MenuItem[], categories: Category[]) => void> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private isAutoSeeded = false;

  constructor() {
    // Initialize in-memory items from initial sample data with generated IDs
    this.inMemoryItems = INITIAL_MENU_ITEMS.map((item, idx) => ({
      ...item,
      id: `dish-sample-${idx + 1}`,
      category: DEFAULT_CATEGORIES.find((c) => c.id === item.categoryId),
    }));

    if (typeof window !== "undefined") {
      try {
        if ("BroadcastChannel" in window) {
          this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
          this.broadcastChannel.onmessage = (e: MessageEvent<RealtimeMenuEvent>) => {
            if (e.data && e.data.type) {
              this.handleLocalEvent(e.data);
            }
          };
        }
      } catch (err) {
        console.warn("BroadcastChannel not available:", err);
      }

      window.addEventListener("storage", (e: StorageEvent) => {
        if (e.key === STORAGE_SYNC_KEY && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            if (data?.event) {
              this.handleLocalEvent(data.event);
            }
          } catch {}
        }
      });
    }
  }

  private handleLocalEvent(event: RealtimeMenuEvent) {
    if (event.type === "item_updated") {
      const updated = event.payload.item as MenuItem;
      if (updated && updated.id) {
        this.inMemoryItems = this.inMemoryItems.map((i) =>
          i.id === updated.id ? { ...i, ...updated } : i
        );
        this.notifyAll();
      }
    } else if (event.type === "reset_all") {
      this.inMemoryItems = this.inMemoryItems.map((i) => ({
        ...i,
        isAvailable: true,
        isStruckOut: false,
      }));
      this.notifyAll();
    } else if (event.type === "item_created") {
      const created = event.payload.item as MenuItem;
      if (created) {
        this.inMemoryItems = [...this.inMemoryItems, created];
        this.notifyAll();
      }
    } else if (event.type === "item_deleted") {
      const id = event.payload.id as string;
      if (id) {
        this.inMemoryItems = this.inMemoryItems.filter((i) => i.id !== id);
        this.notifyAll();
      }
    }
  }

  private notifyAll() {
    this.listeners.forEach((listener) => {
      listener(this.inMemoryItems, this.inMemoryCategories);
    });
  }

  private broadcastLocal(event: RealtimeMenuEvent) {
    try {
      this.broadcastChannel?.postMessage(event);
    } catch {}

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          STORAGE_SYNC_KEY,
          JSON.stringify({ event, t: Date.now(), r: Math.random() })
        );
      }
    } catch {}
  }

  // ─── Real-Time Subscription (Firestore onSnapshot + Fallback) ───
  public subscribe(
    onData: (items: MenuItem[], categories: Category[]) => void
  ): () => void {
    this.listeners.add(onData);

    // If Firebase is configured, connect live Firestore onSnapshot listener
    if (isFirebaseConfigured && db) {
      if (!this.isAutoSeeded) {
        this.isAutoSeeded = true;
        autoSeedFirestoreIfEmpty(db).catch(console.error);
      }

      const menuCol = collection(db, "menuItems");
      const unsubscribeSnapshot = onSnapshot(
        menuCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreItems: MenuItem[] = snapshot.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                name: data.name || "Untitled Dish",
                description: data.description || "",
                price: Number(data.price) || 0,
                imageUrl: data.imageUrl || null,
                dietaryType: data.dietaryType || "veg",
                spiceLevel: Number(data.spiceLevel) || 1,
                isChefSpecial: Boolean(data.isChefSpecial),
                isBestseller: Boolean(data.isBestseller),
                availabilitySlot: data.availabilitySlot || "all_day",
                isStruckOut: Boolean(data.isStruckOut),
                isAvailable: data.isAvailable !== undefined ? Boolean(data.isAvailable) : !data.isStruckOut,
                sortOrder: Number(data.sortOrder) || 0,
                categoryId: data.categoryId || "cat-starters",
                category: this.inMemoryCategories.find((c) => c.id === data.categoryId),
              };
            });

            // Sort by sortOrder and name
            firestoreItems.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
            this.inMemoryItems = firestoreItems;
            onData(firestoreItems, this.inMemoryCategories);
          } else {
            // First time loading or empty
            onData(this.inMemoryItems, this.inMemoryCategories);
          }
        },
        (error) => {
          console.warn("Firestore onSnapshot error:", error);
          // Fall back gracefully to in-memory state
          onData(this.inMemoryItems, this.inMemoryCategories);
        }
      );

      return () => {
        this.listeners.delete(onData);
        unsubscribeSnapshot();
      };
    }

    // Fallback mode (Firebase keys not yet configured)
    onData(this.inMemoryItems, this.inMemoryCategories);

    return () => {
      this.listeners.delete(onData);
    };
  }

  // ─── Instant Availability Toggle ───
  public async toggleItemAvailability(
    itemId: string,
    isAvailable: boolean
  ): Promise<void> {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, "menuItems", itemId);
      await updateDoc(docRef, {
        isAvailable,
        isStruckOut: !isAvailable,
        updatedAt: Date.now(),
      });
      return;
    }

    // Local fallback update
    this.inMemoryItems = this.inMemoryItems.map((item) =>
      item.id === itemId
        ? { ...item, isAvailable, isStruckOut: !isAvailable }
        : item
    );
    const updated = this.inMemoryItems.find((i) => i.id === itemId);
    if (updated) {
      this.broadcastLocal({
        type: "item_updated",
        payload: { item: updated },
        timestamp: Date.now(),
      });
    }
    this.notifyAll();
  }

  // ─── Bulk Action: Reset All to Available ───
  public async resetAllAvailable(): Promise<{ restoredCount: number }> {
    if (isFirebaseConfigured && db) {
      const menuCol = collection(db, "menuItems");
      const snapshot = await getDocs(menuCol);
      const batch = writeBatch(db);
      let count = 0;

      snapshot.docs.forEach((d) => {
        const data = d.data();
        if (data.isAvailable === false || data.isStruckOut === true) {
          batch.update(d.ref, {
            isAvailable: true,
            isStruckOut: false,
            updatedAt: Date.now(),
          });
          count++;
        }
      });

      if (count > 0) {
        await batch.commit();
      }
      return { restoredCount: count };
    }

    let count = 0;
    this.inMemoryItems = this.inMemoryItems.map((item) => {
      if (!item.isAvailable || item.isStruckOut) {
        count++;
        return { ...item, isAvailable: true, isStruckOut: false };
      }
      return item;
    });

    this.broadcastLocal({
      type: "reset_all",
      payload: { count },
      timestamp: Date.now(),
    });
    this.notifyAll();
    return { restoredCount: count };
  }

  // ─── CRUD: Create Dish ───
  public async createMenuItem(data: Partial<MenuItem>): Promise<MenuItem> {
    const isAvailable = data.isAvailable !== undefined ? data.isAvailable : !data.isStruckOut;
    const isStruckOut = !isAvailable;

    if (isFirebaseConfigured && db) {
      const menuCol = collection(db, "menuItems");
      const docRef = await addDoc(menuCol, {
        ...data,
        isAvailable,
        isStruckOut,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return {
        ...(data as MenuItem),
        id: docRef.id,
        isAvailable,
        isStruckOut,
      };
    }

    const newItem: MenuItem = {
      id: `dish-custom-${Date.now()}`,
      name: data.name || "Untitled Dish",
      description: data.description || "",
      price: Number(data.price) || 0,
      imageUrl: data.imageUrl || null,
      dietaryType: data.dietaryType || "veg",
      spiceLevel: Number(data.spiceLevel) || 1,
      isChefSpecial: Boolean(data.isChefSpecial),
      isBestseller: Boolean(data.isBestseller),
      availabilitySlot: data.availabilitySlot || "all_day",
      isStruckOut,
      isAvailable,
      sortOrder: data.sortOrder || this.inMemoryItems.length,
      categoryId: data.categoryId || "cat-starters",
      category: this.inMemoryCategories.find((c) => c.id === data.categoryId),
    };

    this.inMemoryItems = [...this.inMemoryItems, newItem];
    this.broadcastLocal({
      type: "item_created",
      payload: { item: newItem },
      timestamp: Date.now(),
    });
    this.notifyAll();
    return newItem;
  }

  // ─── CRUD: Update Dish ───
  public async updateMenuItem(
    itemId: string,
    data: Partial<MenuItem>
  ): Promise<void> {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, "menuItems", itemId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Date.now(),
      });
      return;
    }

    this.inMemoryItems = this.inMemoryItems.map((i) =>
      i.id === itemId ? { ...i, ...data } : i
    );
    const updated = this.inMemoryItems.find((i) => i.id === itemId);
    if (updated) {
      this.broadcastLocal({
        type: "item_updated",
        payload: { item: updated },
        timestamp: Date.now(),
      });
    }
    this.notifyAll();
  }

  // ─── CRUD: Delete Dish ───
  public async deleteMenuItem(itemId: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, "menuItems", itemId);
      await deleteDoc(docRef);
      return;
    }

    this.inMemoryItems = this.inMemoryItems.filter((i) => i.id !== itemId);
    this.broadcastLocal({
      type: "item_deleted",
      payload: { id: itemId },
      timestamp: Date.now(),
    });
    this.notifyAll();
  }
}

export const MenuService = new CloudMenuService();
