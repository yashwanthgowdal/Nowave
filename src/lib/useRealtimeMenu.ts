import { useState, useEffect } from "react";
import { MenuItem, Category } from "./types";
import { MenuService } from "./MenuService";
import { isFirebaseConfigured } from "./firebase";

export function useRealtimeMenu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = MenuService.subscribe((updatedItems, updatedCategories) => {
      setItems(updatedItems);
      setCategories(updatedCategories);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    items,
    setItems,
    categories,
    loading,
    error,
    isLive: true,
    isFirebaseConfigured,
    refresh: () => {
      // Handled automatically by Firestore onSnapshot subscription
    },
  };
}
