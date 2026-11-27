import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  Plus,
  RotateCcw,
  ExternalLink,
  Search,
  Trash2,
  Edit3,
  X,
  AlertTriangle,
  Check,
  QrCode,
  UtensilsCrossed,
  Layers,
  Sparkles,
  Flame,
  Star,
  Eye,
  EyeOff,
  Radio,
  SlidersHorizontal,
  Cloud,
  CloudOff,
  HelpCircle,
  LayoutDashboard,
  ChefHat,
  MapPin,
  Bell,
} from "lucide-react";
import { useRealtimeMenu } from "@/lib/useRealtimeMenu";
import { MenuService } from "@/lib/MenuService";
import { MenuItem, Category } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { QRGenerator } from "@/components/QRGenerator";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { ExecutiveDashboardView } from "@/components/ExecutiveDashboardView";
import { KitchenDisplaySystem } from "@/components/KitchenDisplaySystem";
import { StaffFloorMap } from "@/components/StaffFloorMap";
import { useRestaurantStore } from "@/lib/useRestaurantStore";

type AdminTab = "overview" | "kds" | "floor" | "availability" | "crud" | "qr";

export function AdminDashboard() {
  const navigate = useNavigate();
  const { items, categories, loading, error, refresh, setItems } = useRealtimeMenu();
  const { orders } = useRestaurantStore();

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showOnlyOutOfStock, setShowOnlyOutOfStock] = useState(false);
  const [showFirebaseBanner, setShowFirebaseBanner] = useState(!isFirebaseConfigured);

  // Modals & Dialogs state
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Live Toast feedback
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Metrics calculation
  const totalDishes = items.length;
  const availableDishes = useMemo(
    () => items.filter((i) => i.isAvailable && !i.isStruckOut).length,
    [items]
  );
  const outOfStockDishes = totalDishes - availableDishes;

  // Filter items for dashboard view
  const displayedItems = useMemo(() => {
    let result = items;

    if (showOnlyOutOfStock) {
      result = result.filter((i) => !i.isAvailable || i.isStruckOut);
    }

    if (selectedCategory !== "all") {
      result = result.filter((i) => i.categoryId === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q)
      );
    }

    return result;
  }, [items, showOnlyOutOfStock, selectedCategory, searchQuery]);

  // Group displayed items by category
  const groupedItems = useMemo(() => {
    const map: Record<string, MenuItem[]> = {};
    categories.forEach((c) => {
      map[c.id] = [];
    });

    displayedItems.forEach((item) => {
      if (map[item.categoryId]) {
        map[item.categoryId].push(item);
      } else {
        map[item.categoryId] = [item];
      }
    });

    return map;
  }, [categories, displayedItems]);

  // ─── Instant Availability Toggle (Core Feature) ───
  const handleToggleAvailability = async (item: MenuItem) => {
    const newAvailableState = !(item.isAvailable && !item.isStruckOut);

    // Optimistic UI update
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              isAvailable: newAvailableState,
              isStruckOut: !newAvailableState,
            }
          : i
      )
    );

    try {
      await MenuService.toggleItemAvailability(item.id, newAvailableState);

      if (!newAvailableState) {
        showToast(
          `🔴 "${item.name}" marked Out of Stock — Hidden from customer menus`,
          "error"
        );
      } else {
        showToast(
          `🟢 "${item.name}" restored to Available — Live on customer menus`,
          "success"
        );
      }
    } catch (err: unknown) {
      // Revert optimistic update
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? item : i))
      );
      showToast(
        err instanceof Error ? err.message : "Failed to toggle dish availability",
        "error"
      );
    }
  };

  // ─── Bulk Action: Reset All to Available ───
  const handleResetAll = async () => {
    try {
      const res = await MenuService.resetAllAvailable();
      setIsResetConfirmOpen(false);
      showToast(
        `✅ Reset complete! ${res.restoredCount} dishes restored to customer menus.`,
        "success"
      );
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Failed to reset dishes",
        "error"
      );
    }
  };

  // ─── Delete Dish ───
  const handleDeleteItem = async (id: string) => {
    try {
      await MenuService.deleteMenuItem(id);
      setDeletingItemId(null);
      showToast("Dish deleted successfully", "success");
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Failed to delete dish",
        "error"
      );
    }
  };

  // ─── Logout ───
  const handleLogout = async () => {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    } else {
      localStorage.removeItem("nowave_admin_auth");
      sessionStorage.removeItem("nowave_admin_auth");
    }
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-obsidian text-zinc-100 font-sans pb-24">
      {/* ─── Top Navbar ─── */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-b border-obsidian-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber/15 border border-amber/30 flex items-center justify-center text-amber">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-white text-base">
                  NO WAVE
                </span>
                <span className="text-[10px] bg-amber/20 border border-amber/40 text-amber font-mono font-bold px-2 py-0.5 rounded-md">
                  MANAGER ADMIN
                </span>
                {isFirebaseConfigured ? (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-md">
                    <Cloud className="w-3 h-3" /> Firestore Realtime
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] text-amber/80 bg-amber/10 border border-amber/30 px-2 py-0.5 rounded-md">
                    <CloudOff className="w-3 h-3" /> Local Fallback
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400">
                Live Kitchen Availability Control
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/menu"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs border border-obsidian-border transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber" />
              <span>Preview Customer Menu</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 text-red-300 text-xs border border-red-900/40 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── FIREBASE SETUP BANNER (FALLBACK SAFETY) ─── */}
      {!isFirebaseConfigured && showFirebaseBanner && (
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div className="p-4 rounded-2xl bg-amber/10 border border-amber/30 flex items-start justify-between gap-3 text-xs text-zinc-200">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-white">
                  Running in Local Demo Mode • Ready for Worldwide Real-Time Sync
                </p>
                <p className="text-zinc-400 leading-relaxed">
                  To sync dish availability across different smartphones globally on Vercel, paste your Firebase config in{" "}
                  <code className="text-amber bg-black/40 px-1 py-0.5 rounded font-mono">.env</code> or Vercel Environment Variables (see <code className="text-amber">.env.example</code>). Currently running with local cross-tab fallback.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowFirebaseBanner(false)}
              className="text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        {/* ─── 1. LIVE STOCK OVERVIEW HEADER & METRICS ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Dishes */}
          <div className="bg-obsidian-card border border-obsidian-border rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                Total Menu Dishes
              </p>
              <h3 className="text-3xl font-serif font-bold text-white mt-1">
                {totalDishes}
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Across {categories.length} categories
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-400">
              <Layers className="w-6 h-6 text-zinc-400" />
            </div>
          </div>

          {/* Currently Available (Green) */}
          <div className="bg-obsidian-card border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            <div>
              <p className="text-xs text-emerald-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live on Customer Phones
              </p>
              <h3 className="text-3xl font-serif font-bold text-emerald-400 mt-1">
                {availableDishes}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {totalDishes > 0
                  ? `${Math.round((availableDishes / totalDishes) * 100)}% active stock`
                  : "No items"}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Eye className="w-6 h-6" />
            </div>
          </div>

          {/* Out of Stock / Hidden (Red) */}
          <div className="bg-obsidian-card border border-red-500/20 rounded-2xl p-4 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
            <div>
              <p className="text-xs text-red-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Out of Stock (Hidden)
              </p>
              <h3 className="text-3xl font-serif font-bold text-red-400 mt-1">
                {outOfStockDishes}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {outOfStockDishes === 0
                  ? "Full menu in stock"
                  : "Hidden from customer DOM"}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-red-950/50 border border-red-500/40 flex items-center justify-center text-red-400">
              <EyeOff className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* ─── Navigation Tabs & Quick Action Bar ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-obsidian-border pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === "overview"
                  ? "bg-amber text-black shadow-lg shadow-amber/20"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-obsidian-border"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Executive Overview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("kds")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === "kds"
                  ? "bg-amber text-black shadow-lg shadow-amber/20"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-obsidian-border"
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span>Kitchen KDS</span>
              {orders.filter((o) => o.status === "cooking" || o.status === "placed").length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber text-black text-[10px] font-bold flex items-center justify-center">
                  {orders.filter((o) => o.status === "cooking" || o.status === "placed").length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("floor")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === "floor"
                  ? "bg-amber text-black shadow-lg shadow-amber/20"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-obsidian-border"
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Floor Map</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("availability")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === "availability"
                  ? "bg-amber text-black shadow-lg shadow-amber/20"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-obsidian-border"
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>Stock Toggles</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("crud")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === "crud"
                  ? "bg-amber text-black shadow-lg shadow-amber/20"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-obsidian-border"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Menu CRUD</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("qr")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === "qr"
                  ? "bg-amber text-black shadow-lg shadow-amber/20"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-obsidian-border"
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>QR Codes</span>
            </button>
          </div>

          {/* Rush Hour Bulk Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-obsidian-border hover:border-amber/40 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Reset all dishes to Available for start of day"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber" />
              <span className="hidden md:inline">Reset Stock</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber hover:bg-brass-dark text-black font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-amber/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Dish</span>
            </button>
          </div>
        </div>

        {/* ─── TAB 0: EXECUTIVE OVERVIEW (VIDEO BLUEPRINT) ─── */}
        {activeTab === "overview" && (
          <ExecutiveDashboardView onNavigateTab={setActiveTab} />
        )}

        {/* ─── TAB: KITCHEN DISPLAY SYSTEM (KDS) ─── */}
        {activeTab === "kds" && <KitchenDisplaySystem />}

        {/* ─── TAB: LIVE FLOOR MAP & WAITER CALLS ─── */}
        {activeTab === "floor" && <StaffFloorMap />}

        {/* ─── TAB 1: LIVE AVAILABILITY TOGGLES (CORE FEATURE) ─── */}
        {activeTab === "availability" && (
          <div className="space-y-4">
            {/* Search & Rush Hour Filter Switches */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-obsidian-card border border-obsidian-border rounded-2xl p-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Quick search dishes to toggle..."
                  className="w-full bg-obsidian border border-obsidian-border rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="flex items-center flex-wrap gap-2">
                {/* Category dropdown */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-obsidian border border-obsidian-border rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {/* Show Only Out of Stock Toggle */}
                <button
                  type="button"
                  onClick={() => setShowOnlyOutOfStock(!showOnlyOutOfStock)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                    showOnlyOutOfStock
                      ? "bg-red-950/80 border-red-500 text-red-300"
                      : "bg-obsidian border-obsidian-border text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      showOnlyOutOfStock ? "bg-red-500 animate-pulse" : "bg-zinc-600"
                    }`}
                  />
                  <span>Show Only Out-of-Stock ({outOfStockDishes})</span>
                </button>
              </div>
            </div>

            {/* Dish Rows by Category */}
            {categories.map((category) => {
              const catDishes = groupedItems[category.id] || [];
              if (catDishes.length === 0) return null;

              return (
                <div
                  key={category.id}
                  className="bg-obsidian-card border border-obsidian-border rounded-2xl overflow-hidden shadow-xl"
                >
                  <div className="px-5 py-3.5 bg-zinc-900/60 border-b border-obsidian-border flex items-center justify-between">
                    <h3 className="font-serif font-bold text-sm text-zinc-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber" />
                      {category.name}
                    </h3>
                    <span className="text-xs text-zinc-500 font-mono">
                      {catDishes.length} items
                    </span>
                  </div>

                  <div className="divide-y divide-zinc-800/60">
                    {catDishes.map((dish) => {
                      const isAvailable = dish.isAvailable && !dish.isStruckOut;

                      return (
                        <div
                          key={dish.id}
                          className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 ${
                            !isAvailable
                              ? "bg-red-950/10 opacity-75 hover:opacity-100"
                              : "hover:bg-zinc-900/30"
                          }`}
                        >
                          {/* Dish info */}
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {/* Veg / Non-Veg badge */}
                            <span
                              className={`w-4 h-4 border-2 mt-0.5 rounded-[3px] flex items-center justify-center p-[2px] bg-obsidian shrink-0 ${
                                dish.dietaryType === "nonveg"
                                  ? "border-red-500"
                                  : "border-emerald-500"
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  dish.dietaryType === "nonveg"
                                    ? "bg-red-500"
                                    : "bg-emerald-500"
                                }`}
                              />
                            </span>

                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4
                                  className={`font-semibold text-sm ${
                                    isAvailable
                                      ? "text-white"
                                      : "text-zinc-400 line-through decoration-red-500 decoration-2"
                                  }`}
                                >
                                  {dish.name}
                                </h4>

                                <span className="font-mono text-xs text-amber font-bold">
                                  {formatPrice(dish.price)}
                                </span>

                                {!isAvailable && (
                                  <span className="px-2 py-0.5 rounded-full bg-red-900/40 border border-red-500/40 text-red-300 text-[10px] uppercase font-bold tracking-wider">
                                    Out of Stock (Hidden)
                                  </span>
                                )}

                                {dish.isChefSpecial && (
                                  <span className="text-[10px] text-amber flex items-center gap-0.5">
                                    <Star className="w-3 h-3 fill-amber" /> Special
                                  </span>
                                )}
                                {dish.isBestseller && (
                                  <span className="text-[10px] text-red-400 flex items-center gap-0.5">
                                    <Flame className="w-3 h-3 fill-red-400" /> Bestseller
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-zinc-400 line-clamp-1">
                                {dish.description}
                              </p>
                            </div>
                          </div>

                          {/* Tactile Large Availability Toggle Switch */}
                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/40">
                            <span
                              className={`text-xs font-semibold font-mono ${
                                isAvailable ? "text-emerald-400" : "text-red-400"
                              }`}
                            >
                              {isAvailable ? "AVAILABLE" : "OUT OF STOCK"}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleToggleAvailability(dish)}
                              className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber/50 ${
                                isAvailable ? "bg-emerald-500" : "bg-red-600"
                              }`}
                              title={
                                isAvailable
                                  ? "Click to mark OUT OF STOCK (hides from customer menus)"
                                  : "Click to mark AVAILABLE (shows on customer menus)"
                              }
                            >
                              <span
                                className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center text-[10px] font-bold ${
                                  isAvailable
                                    ? "translate-x-8 text-emerald-600"
                                    : "translate-x-0 text-red-600"
                                }`}
                              >
                                {isAvailable ? "ON" : "OFF"}
                              </span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── TAB 2: FULL MENU CRUD MANAGEMENT ─── */}
        {activeTab === "crud" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-serif font-bold text-white">
                  Menu Items Database Management
                </h3>
                <p className="text-xs text-zinc-400">
                  Edit pricing, descriptions, categories, or remove outdated dishes.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-amber hover:bg-brass-dark text-black font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber/20"
              >
                <Plus className="w-4 h-4" />
                Add New Dish
              </button>
            </div>

            <div className="bg-obsidian-card border border-obsidian-border rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900/80 border-b border-obsidian-border text-zinc-400 uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Dish</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Dietary</th>
                      <th className="py-3 px-4">Live Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    {displayedItems.map((dish) => {
                      const isAvailable = dish.isAvailable && !dish.isStruckOut;
                      const category = categories.find((c) => c.id === dish.categoryId);

                      return (
                        <tr key={dish.id} className="hover:bg-zinc-900/40">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">{dish.name}</div>
                            <div className="text-[11px] text-zinc-500 truncate max-w-xs">
                              {dish.description}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-zinc-400">
                            {category?.name || "Uncategorized"}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-amber">
                            {formatPrice(dish.price)}
                          </td>
                          <td className="py-3 px-4 capitalize">
                            {dish.dietaryType}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                                isAvailable
                                  ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-400"
                                  : "bg-red-950/60 border border-red-500/40 text-red-400"
                              }`}
                            >
                              {isAvailable ? "Available" : "Out of Stock"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingItem(dish)}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                                title="Edit dish details"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingItemId(dish.id)}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950/80 text-zinc-400 hover:text-red-400 transition-colors"
                                title="Delete dish"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: TABLE QR GENERATOR ─── */}
        {activeTab === "qr" && <QRGenerator />}
      </main>

      {/* ─── MODAL: ADD / EDIT DISH ─── */}
      <DishEditModal
        isOpen={isAddModalOpen || editingItem !== null}
        item={editingItem}
        categories={categories}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        onSave={async (savedItem) => {
          if (editingItem) {
            await MenuService.updateMenuItem(editingItem.id, savedItem);
            showToast(`Updated "${savedItem.name}"`, "success");
          } else {
            await MenuService.createMenuItem(savedItem);
            showToast(`Created "${savedItem.name}"`, "success");
          }
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
      />

      {/* ─── MODAL: RESET CONFIRMATION ─── */}
      <AnimatePresence>
        {isResetConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-obsidian-card border border-obsidian-border rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber/15 border border-amber/30 text-amber flex items-center justify-center mx-auto">
                <RotateCcw className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="font-serif text-lg font-bold text-white">
                  Reset All to Available?
                </h3>
                <p className="text-xs text-zinc-400">
                  This will mark all currently out-of-stock dishes as Available and immediately show them across all customer digital menus.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="flex-1 py-2.5 rounded-xl bg-amber hover:bg-brass-dark text-black text-xs font-bold transition-all shadow-md shadow-amber/20"
                >
                  Confirm Reset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL: DELETE CONFIRMATION ─── */}
      <AnimatePresence>
        {deletingItemId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-obsidian-card border border-obsidian-border rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="font-serif text-lg font-bold text-white">
                  Delete Dish Permanently?
                </h3>
                <p className="text-xs text-zinc-400">
                  Are you sure you want to remove this dish from the restaurant database? This cannot be undone.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingItemId(null)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteItem(deletingItemId)}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-md shadow-red-600/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Toast Feedback ─── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center gap-2 max-w-md ${
              toast.type === "success"
                ? "bg-zinc-900 border-emerald-500/40 text-emerald-300"
                : "bg-zinc-900 border-red-500/40 text-red-300"
            }`}
          >
            {toast.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Modal Subcomponent: Dish Edit / Add Form ───
function DishEditModal({
  isOpen,
  item,
  categories,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  item: MenuItem | null;
  categories: Category[];
  onClose: () => void;
  onSave: (data: Partial<MenuItem>) => Promise<void>;
}) {
  const [name, setName] = useState(item?.name || "");
  const [description, setDescription] = useState(item?.description || "");
  const [price, setPrice] = useState(item ? String(item.price) : "");
  const [categoryId, setCategoryId] = useState(item?.categoryId || categories[0]?.id || "");
  const [dietaryType, setDietaryType] = useState(item?.dietaryType || "veg");
  const [spiceLevel, setSpiceLevel] = useState(item?.spiceLevel || 1);
  const [isChefSpecial, setIsChefSpecial] = useState(item?.isChefSpecial || false);
  const [isBestseller, setIsBestseller] = useState(item?.isBestseller || false);
  const [imageUrl, setImageUrl] = useState(item?.imageUrl || "");
  const [saving, setSaving] = useState(false);

  useMemo(() => {
    if (item) {
      setName(item.name);
      setDescription(item.description);
      setPrice(String(item.price));
      setCategoryId(item.categoryId);
      setDietaryType(item.dietaryType);
      setSpiceLevel(item.spiceLevel);
      setIsChefSpecial(item.isChefSpecial);
      setIsBestseller(item.isBestseller);
      setImageUrl(item.imageUrl || "");
    } else {
      setName("");
      setDescription("");
      setPrice("");
      setCategoryId(categories[0]?.id || "");
      setDietaryType("veg");
      setSpiceLevel(1);
      setIsChefSpecial(false);
      setIsBestseller(false);
      setImageUrl("");
    }
  }, [item, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !categoryId) return;

    setSaving(true);
    try {
      await onSave({
        name,
        description,
        price: parseFloat(price),
        categoryId,
        dietaryType,
        spiceLevel,
        isChefSpecial,
        isBestseller,
        imageUrl: imageUrl.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-obsidian-card border border-obsidian-border rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-obsidian-border pb-3">
          <h3 className="font-serif text-lg font-bold text-white">
            {item ? `Edit "${item.name}"` : "Add New Dish"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Dish Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Truffle Malai Paneer Tikka"
              className="w-full bg-obsidian border border-obsidian-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-obsidian border border-obsidian-border rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">
                Price (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 380"
                className="w-full bg-obsidian border border-obsidian-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Appetizing description of ingredients and preparation..."
              className="w-full bg-obsidian border border-obsidian-border rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">
                Dietary Type
              </label>
              <select
                value={dietaryType}
                onChange={(e) => setDietaryType(e.target.value)}
                className="w-full bg-obsidian border border-obsidian-border rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber"
              >
                <option value="veg">Veg 🟢</option>
                <option value="nonveg">Non-Veg 🔴</option>
                <option value="vegan">Vegan 🌿</option>
                <option value="egg">Egg 🥚</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">
                Spice Level (1-5)
              </label>
              <select
                value={spiceLevel}
                onChange={(e) => setSpiceLevel(parseInt(e.target.value, 10))}
                className="w-full bg-obsidian border border-obsidian-border rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber"
              >
                <option value={1}>1 - Mild / Not Spicy</option>
                <option value={2}>2 - Medium Spice</option>
                <option value={3}>3 - Spicy</option>
                <option value={4}>4 - Hot</option>
                <option value={5}>5 - Extra Fiery</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Image URL (Unsplash or hosted photo)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-obsidian border border-obsidian-border rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber"
            />
          </div>

          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
              <input
                type="checkbox"
                checked={isChefSpecial}
                onChange={(e) => setIsChefSpecial(e.target.checked)}
                className="w-4 h-4 rounded text-amber focus:ring-amber bg-obsidian border-zinc-700"
              />
              <span>Chef's Special ★</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
              <input
                type="checkbox"
                checked={isBestseller}
                onChange={(e) => setIsBestseller(e.target.checked)}
                className="w-4 h-4 rounded text-amber focus:ring-amber bg-obsidian border-zinc-700"
              />
              <span>Bestseller 🔥</span>
            </label>
          </div>

          <div className="flex gap-2.5 pt-4 border-t border-obsidian-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-amber hover:bg-brass-dark text-black font-bold transition-all shadow-md shadow-amber/20 disabled:opacity-50"
            >
              {saving ? "Saving..." : item ? "Save Changes" : "Create Dish"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
