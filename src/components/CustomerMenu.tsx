import { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  ChefHat,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { useRealtimeMenu } from "@/lib/useRealtimeMenu";
import { MenuItem, Category, ShortlistItem } from "@/lib/types";
import { DishCard } from "@/components/DishCard";
import { TableShortlistDrawer } from "@/components/TableShortlistDrawer";
import { ItemCustomizationModal } from "@/components/ItemCustomizationModal";
import { SmartWaitScreen } from "@/components/SmartWaitScreen";
import { BillSplitPaymentModal } from "@/components/BillSplitPaymentModal";
import { NoWaveLampBanner } from "@/components/NoWaveLampBanner";
import { useRestaurantStore } from "@/lib/useRestaurantStore";
import { getOrCreateTableSession } from "@/lib/tableSession";

type FilterType = "all" | "veg" | "nonveg" | "special" | "bestseller";

export function CustomerMenu() {
  const [searchParams] = useSearchParams();
  const routeParams = useParams<{ tableId?: string }>();

  // Determine Table Number from route (/table/:tableId) or query param (?table=5)
  const tableParam = routeParams.tableId || searchParams.get("table") || "5";

  // Anti-Spoofing Signed Session Token
  const [sessionToken, setSessionToken] = useState<string>("");

  useEffect(() => {
    const token = getOrCreateTableSession(tableParam);
    setSessionToken(token);
  }, [tableParam]);

  const { items, categories, loading } = useRealtimeMenu();
  const { activeTableOrder, createOrder } = useRestaurantStore(tableParam);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);
  const [shortlist, setShortlist] = useState<ShortlistItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [isWaitScreenOpen, setIsWaitScreenOpen] = useState(false);
  const [isPayBillOpen, setIsPayBillOpen] = useState(false);

  // Category section refs for smooth scrolling
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Apply Search & Dietary Filters (Render ALL items, striking out unavailable ones)
  const filteredItems = useMemo(() => {
    let result = items;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q)
      );
    }

    // Dietary filter
    if (activeFilter === "veg") {
      result = result.filter((i) => i.dietaryType === "veg" || i.dietaryType === "vegan");
    } else if (activeFilter === "nonveg") {
      result = result.filter((i) => i.dietaryType === "nonveg");
    } else if (activeFilter === "special") {
      result = result.filter((i) => i.isChefSpecial);
    } else if (activeFilter === "bestseller") {
      result = result.filter((i) => i.isBestseller);
    }

    return result;
  }, [items, searchQuery, activeFilter]);

  // Group filtered items by category
  const categorizedItems = useMemo(() => {
    const map: Record<string, MenuItem[]> = {};
    categories.forEach((cat) => {
      map[cat.id] = [];
    });

    filteredItems.forEach((item) => {
      if (map[item.categoryId]) {
        map[item.categoryId].push(item);
      } else {
        map[item.categoryId] = [item];
      }
    });

    return map;
  }, [categories, filteredItems]);

  const activeCategories = useMemo(() => {
    return categories.filter((cat) => {
      const catItems = categorizedItems[cat.id];
      return catItems && catItems.length > 0;
    });
  }, [categories, categorizedItems]);

  const handleAddNote = (item: MenuItem) => {
    if (item.isStruckOut || !item.isAvailable) return;
    setCustomizingItem(item);
  };

  const handleAddCustomizedItem = (customizedItem: ShortlistItem) => {
    setShortlist((prev) => {
      const existsIndex = prev.findIndex(
        (s) =>
          s.item.id === customizedItem.item.id &&
          s.customization?.portionSize === customizedItem.customization?.portionSize &&
          s.customization?.spiceLevel === customizedItem.customization?.spiceLevel &&
          s.customization?.selectedDeal?.name === customizedItem.customization?.selectedDeal?.name
      );

      if (existsIndex >= 0) {
        const copy = [...prev];
        copy[existsIndex].quantity += customizedItem.quantity;
        return copy;
      }
      return [...prev, customizedItem];
    });

    setToastMessage(`Added "${customizedItem.item.name}" (${customizedItem.customization?.portionSize})`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setShortlist((prev) =>
      prev
        .map((s) => {
          if (s.item.id === itemId) {
            const newQ = s.quantity + delta;
            return newQ > 0 ? { ...s, quantity: newQ } : null;
          }
          return s;
        })
        .filter(Boolean) as ShortlistItem[]
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setShortlist((prev) => prev.filter((s) => s.item.id !== itemId));
  };

  const handleClearShortlist = () => {
    setShortlist([]);
  };

  const handlePlaceOrder = () => {
    const totalAmount = shortlist.reduce(
      (sum, item) => sum + (item.calculatedPrice || item.item.price) * item.quantity,
      0
    );

    createOrder({
      tableNumber: tableParam,
      items: shortlist,
      totalAmount,
      sessionToken,
    });

    setShortlist([]);
    setTimeout(() => {
      setIsWaitScreenOpen(true);
    }, 1600);
  };

  const scrollToCategory = (catId: string, slug: string) => {
    setSelectedCategory(slug);
    const element = sectionRefs.current[catId];
    if (element) {
      const yOffset = -130;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#11100F] text-[#FAF7F2] pb-36 font-sans antialiased selection:bg-amber/30 selection:text-white">
      {/* ─── 1. TACTILE HEADER & BRAND IDENTITY ─── */}
      <header className="relative bg-gradient-to-b from-[#181615] via-[#141312] to-[#11100F] border-b border-white/5 pt-6 pb-6 px-4">
        {/* Warm Ambient Backlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-md h-24 bg-amber/10 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-4xl mx-auto flex flex-col items-center text-center relative z-10 space-y-4">
          {/* Top Info Bar */}
          <div className="w-full flex items-center justify-between text-xs">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber/15 border border-amber/30 text-amber font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-amber animate-pulse" />
              Table {tableParam.length === 1 ? `0${tableParam}` : tableParam}
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-[11px] text-zinc-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-medium text-emerald-400">Live Kitchen Connected</span>
            </div>
          </div>

          {/* Brand Heading */}
          <div className="space-y-1">
            <h1 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-wider text-[#FAF7F2]">
              NO WAVE
            </h1>
            <p className="text-[11px] uppercase tracking-[0.3em] font-semibold text-amber">
              Dining, Redefined
            </p>
          </div>

          {/* ─── HARDWARE + SOFTWARE SYNERGY: NoWave Lamp Prompt ─── */}
          <div className="w-full max-w-xl">
            <NoWaveLampBanner tableNumber={tableParam} />
          </div>
        </div>
      </header>

      {/* Floating Active Order Tracker Banner */}
      {activeTableOrder && (
        <div className="max-w-4xl mx-auto px-4 pt-3">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-amber/15 via-[#1a1816] to-[#1a1816] border border-amber/40 shadow-xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber/20 border border-amber/30 flex items-center justify-center text-amber animate-pulse">
                <ChefHat className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Order {activeTableOrder.orderNumber} is {activeTableOrder.status}</span>
                  <span className="w-2 h-2 rounded-full bg-amber animate-ping" />
                </p>
                <p className="text-[10px] text-zinc-400">
                  Tap to track live cooking timer & table-side checkout
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPayBillOpen(true)}
                className="py-1.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition-all"
              >
                Bill
              </button>
              <button
                type="button"
                onClick={() => setIsWaitScreenOpen(true)}
                className="py-1.5 px-3.5 rounded-xl bg-amber hover:bg-amber-500 text-obsidian text-xs font-extrabold shadow-md shadow-amber/20 transition-all"
              >
                Track Live
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ─── 2. SEARCH & DIETARY FILTER BAR ─── */}
      <section className="sticky top-0 z-30 bg-[#11100F]/95 backdrop-blur-xl border-b border-white/5 shadow-xl shadow-black/40">
        <div className="max-w-4xl mx-auto px-4 py-3 space-y-2.5">
          {/* Instant Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, gravies, tandoor breads, drinks..."
              className="w-full bg-[#181716] border border-white/10 rounded-xl pl-9 pr-9 py-2.5 text-sm text-[#FAF7F2] placeholder:text-zinc-500 focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="w-6 h-6 absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white flex items-center justify-center rounded-full hover:bg-zinc-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dietary Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {[
              { id: "all", label: "All Offerings" },
              { id: "veg", label: "Pure Veg 🟢" },
              { id: "nonveg", label: "Non-Veg 🔴" },
              { id: "special", label: "Chef's Special ⭐" },
              { id: "bestseller", label: "Bestseller 🔥" },
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setActiveFilter(chip.id as FilterType)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  activeFilter === chip.id
                    ? "bg-amber text-black font-semibold shadow-md shadow-amber/20"
                    : "bg-[#181716] text-zinc-400 hover:text-white border border-white/10"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Category Quick Scroll Tabs */}
          {activeCategories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1">
              {activeCategories.map((cat) => {
                const count = categorizedItems[cat.id]?.length || 0;
                const isSelected = selectedCategory === cat.slug;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => scrollToCategory(cat.id, cat.slug)}
                    className={`text-xs px-3 py-1 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      isSelected
                        ? "text-amber font-semibold bg-amber/10 border border-amber/30"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-[10px] text-zinc-500">({count})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── 3. DISH SECTIONS (TACTILE PHYSICAL MENU PRESENTATION) ─── */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-zinc-500 tracking-wider uppercase">
              Loading culinary repertoire...
            </p>
          </div>
        ) : activeCategories.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-zinc-200">
              No dishes found
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              No offerings match your current search criteria.
            </p>
          </div>
        ) : (
          activeCategories.map((category) => {
            const catItems = categorizedItems[category.id] || [];
            if (catItems.length === 0) return null;

            return (
              <section
                key={category.id}
                ref={(el) => {
                  sectionRefs.current[category.id] = el;
                }}
                className="space-y-4"
              >
                {/* Category Section Header */}
                <div className="border-b border-white/10 pb-2.5 flex items-baseline justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber" />
                    <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-wide text-[#FAF7F2]">
                      {category.name}
                    </h2>
                  </div>
                  <span className="text-xs text-zinc-500 font-sans">
                    {catItems.length} {catItems.length === 1 ? "dish" : "dishes"}
                  </span>
                </div>

                {/* Dish Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {catItems.map((item) => {
                    const isNoted = shortlist.some((s) => s.item.id === item.id);
                    return (
                      <DishCard
                        key={item.id}
                        item={item}
                        onImageClick={(url, name) => setLightboxImage({ url, name })}
                        onAddNote={handleAddNote}
                        onCustomize={(it) => setCustomizingItem(it)}
                        isNoted={isNoted}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </main>

      {/* ─── 4. ITEM CUSTOMIZATION MODAL ─── */}
      <ItemCustomizationModal
        item={customizingItem}
        isOpen={Boolean(customizingItem)}
        onClose={() => setCustomizingItem(null)}
        onAddToCart={handleAddCustomizedItem}
      />

      {/* ─── 5. SMART WAIT EXPERIENCE SCREEN ─── */}
      {activeTableOrder && (
        <SmartWaitScreen
          order={activeTableOrder}
          isOpen={isWaitScreenOpen}
          onClose={() => setIsWaitScreenOpen(false)}
          onOpenPayBill={() => {
            setIsWaitScreenOpen(false);
            setIsPayBillOpen(true);
          }}
        />
      )}

      {/* ─── 6. BILL SPLITTING & CHECKOUT MODAL ─── */}
      {activeTableOrder && (
        <BillSplitPaymentModal
          order={activeTableOrder}
          isOpen={isPayBillOpen}
          onClose={() => setIsPayBillOpen(false)}
        />
      )}

      {/* ─── 7. 1-TAP ORDER NOTEPAD / CART DRAWER ─── */}
      <TableShortlistDrawer
        shortlist={shortlist}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearShortlist={handleClearShortlist}
        onPlaceOrder={handlePlaceOrder}
        tableNumber={tableParam}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#1e1c1a] border border-amber/40 text-white text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 pointer-events-none"
          >
            <span className="w-2 h-2 rounded-full bg-amber" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-Screen Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-xl w-full bg-[#181716] rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <img
                src={lightboxImage.url}
                alt={lightboxImage.name}
                className="w-full h-auto max-h-[70vh] object-cover"
              />

              <div className="p-4 bg-[#141312]">
                <h4 className="font-serif text-lg font-bold text-white text-center">
                  {lightboxImage.name}
                </h4>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
