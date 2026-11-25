export interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  _count?: { items: number };
}

export type DietaryType = "veg" | "nonveg" | "vegan" | "egg";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  dietaryType: DietaryType | string;
  spiceLevel: number;
  isChefSpecial: boolean;
  isBestseller: boolean;
  availabilitySlot: string;
  isStruckOut: boolean;
  isAvailable: boolean;
  sortOrder: number;
  categoryId: string;
  category?: Category;
}

export interface ShortlistItem {
  item: MenuItem;
  quantity: number;
  note?: string;
}

export interface RealtimeMenuEvent {
  type: "item_updated" | "item_created" | "item_deleted" | "category_updated" | "reset_all" | "connected" | "heartbeat";
  payload: Record<string, unknown>;
  timestamp: number;
}
