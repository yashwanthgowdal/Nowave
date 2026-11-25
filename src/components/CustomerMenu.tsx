import { useState, useMemo, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Lock,
  UtensilsCrossed,
  Wifi,
} from "lucide-react";
import { useRealtimeMenu } from "@/lib/useRealtimeMenu";
import { MenuItem, Category, ShortlistItem } from "@/lib/types";
import { DishCard } from "@/components/DishCard";
import { TableShortlistDrawer } from "@/components/TableShortlistDrawer";

type FilterType = "all" | "veg" | "nonveg" | "special" | "bestseller";

export function CustomerMenu() {
  const [searchParams] = useSearchParams();
  const tableParam = searchParams.get("table");

  const { items, categories, loading, error, isFirebaseConfigured } = useRealtimeMenu();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);
  const [shortlist, setShortlist] = useState<ShortlistItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Category section refs for smooth scrolling
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // ─── STRICT RULE: ONLY AVAILABLE ITEMS ARE RENDERED TO THE DOM ───
  // Items marked isAvailable: false or isStruckOut: true are strictly excluded
  const availableItems = useMemo(() => {
    return items.filter((item) => {
      return item.isAvailable === true && item.isStruckOut !== true;
    });
  }, [items]);

  // Apply Search & Dietary Filters
  const filteredItems = useMemo(() => {
    let result = availableItems;

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
  }, [availableItems, searchQuery, activeFilter]);

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

  // ─── EMPTY CATEGORY CLEANUP (PRODUCTION REQUIREMENT) ───
  // Automatically hide any category tab or section heading if 100% of dishes in that category are toggled isAvailable: false
  const activeCategories = useMemo(() => {
    return categories.filter((cat) => {
      const catItems = categorizedItems[cat.id];
      return catItems && catItems.length > 0;
    });
  }, [categories, categorizedItems]);

  // Shortlist helpers
  const handleAddNote = (item: MenuItem) => {
    setShortlist((prev) => {
      const exists = prev.find((s) => s.item.id === item.id);
      if (exists) {
        return prev.map((s) =>
          s.item.id === item.id ? { ...s, quantity: s.quantity + 1 } : s
        );
      }
      return [...prev, { item, quantity: 1 }];
    });

    setToastMessage(`Added "${item.name}" to your table note`);
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

  const scrollToCategory = (catId: string, slug: string) => {
    setSelectedCategory(slug);
    const element = sectionRefs.current[catId];
    if (element) {
      const yOffset = -130; // offset for sticky headers
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-obsidian text-zinc-100 pb-36 font-sans">
      {/* ─── 1. HEADER & BRAND BANNER ─── */}
      <header className="relative bg-gradient-to-b from-zinc-950 via-obsidian to-obsidian border-b border-obsidian-border/80 pt-6 pb-6 px-4">
        {/* Subtle warm ambient light accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-md h-24 bg-amber/10 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-4xl mx-auto flex flex-col items-center text-center relative z-10">
          {/* Top Info Bar: Table badge + Real-time status */}
          <div className="w-full flex items-center justify-between mb-4 text-xs">
            {tableParam ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber/15 border border-amber/40 text-amber font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-amber animate-pulse" />
                Table {tableParam.length === 1 ? `0${tableParam}` : tableParam}
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 text-zinc-500 text-xs">
                <UtensilsCrossed className="w-3.5 h-3.5 text-amber" />
                <span>Guest Digital Menu</span>
              </div>
            )}

            {/* Live Synchronized Status Pill */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300"
              title={
                isFirebaseConfigured
                  ? "Live cloud synchronization active via Firebase Firestore"
                  : "Live parallel menu updates active"
              }
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-medium text-emerald-400">Live Menu</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400 hidden sm:inline">Real-time sync</span>
            </div>
          </div>

          {/* Logo & Identity */}
          <div className="space-y-1">
            <h1 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-wider text-white">
              NO WAVE
            </h1>
            <p className="text-xs uppercase tracking-[0.3em] font-semibold text-amber">
              Company
            </p>
          </div>

          <p className="text-xs sm:text-sm text-zinc-400 italic mt-2.5 max-w-sm">
            &ldquo;No Wave. Just Tilt. Dining, Redefined.&rdquo;
          </p>

          <p className="text-[11px] text-zinc-500 mt-1 max-w-md">
            Browse our fresh offerings below. When ready, simply inform your server or tilt your table lamp.
          </p>
        </div>
      </header>

      {/* ─── 2. SMART SEARCH & DIETARY FILTERS ─── */}
      <section className="sticky top-0 z-30 bg-obsidian/95 backdrop-blur-xl border-b border-obsidian-border/80 shadow-xl shadow-black/40">
        <div className="max-w-4xl mx-auto px-4 py-3 space-y-2.5">
          {/* Instant Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, ingredients, starters, desserts..."
              className="w-full bg-zinc-900/90 border border-obsidian-border rounded-xl pl-9 pr-9 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber transition-all"
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
              { id: "all", label: "All Items" },
              { id: "veg", label: "Veg 🟢" },
              { id: "nonveg", label: "Non-Veg 🔴" },
              { id: "special", label: "Chef's Special ⭐" },
              { id: "bestseller", label: "Bestseller 🔥" },
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setActiveFilter(chip.id as FilterType)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeFilter === chip.id
                    ? "bg-amber text-black font-semibold shadow-md shadow-amber/20"
                    : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800/80"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Sticky Category Tabs (Empty Categories Automatically Excluded) */}
          {activeCategories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1 border-t border-zinc-800/60">
              {activeCategories.map((cat) => {
                const count = categorizedItems[cat.id]?.length || 0;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => scrollToCategory(cat.id, cat.slug)}
                    className={`whitespace-nowrap px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                      selectedCategory === cat.slug
                        ? "text-amber font-semibold bg-amber/10 border border-amber/30"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">({count})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── 3. MENU CONTENT / DISH CARDS ─── */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-12">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-500 gap-3">
            <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Connecting to real-time menu...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-red-400 space-y-2">
            <p className="font-semibold">{error}</p>
            <p className="text-xs text-zinc-500">Please try refreshing your browser.</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <UtensilsCrossed className="w-12 h-12 text-zinc-600 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-zinc-300">
              No matching dishes found
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              {searchQuery
                ? `No dishes found matching "${searchQuery}". Try a different keyword.`
                : "No dishes currently available in this dietary filter."}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setActiveFilter("all");
              }}
              className="text-xs text-amber font-semibold underline underline-offset-4"
            >
              Reset filters
            </button>
          </div>
        ) : (
          activeCategories.map((category) => {
            const categoryDishes = categorizedItems[category.id] || [];
            if (categoryDishes.length === 0) return null;

            return (
              <section
                key={category.id}
                ref={(el) => {
                  sectionRefs.current[category.id] = el;
                }}
                className="space-y-4 scroll-mt-36"
              >
                {/* Category Header */}
                <div className="flex items-end justify-between border-b border-obsidian-border pb-2.5">
                  <div>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-wide flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber" />
                      {category.name}
                    </h2>
                    <span className="text-xs text-zinc-500">
                      {categoryDishes.length} {categoryDishes.length === 1 ? "dish" : "dishes"} available
                    </span>
                  </div>
                </div>

                {/* Dish Grid: Available Items Only */}
                {/* Strict Rule: Any item toggled OFF by manager disappears immediately from DOM with zero layout shift */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <AnimatePresence mode="popLayout">
                    {categoryDishes.map((dish) => {
                      const isNoted = shortlist.some((s) => s.item.id === dish.id);
                      return (
                        <DishCard
                          key={dish.id}
                          item={dish}
                          onImageClick={(url, name) => setLightboxImage({ url, name })}
                          onAddNote={handleAddNote}
                          isNoted={isNoted}
                        />
                      );
                    })}
                  </AnimatePresence>
                </div>
              </section>
            );
          })
        )}
      </main>

      {/* ─── 4. SUBTLE TABLE SERVICE REMINDER FOOTER ─── */}
      <footer className="max-w-4xl mx-auto px-4 mt-20 pt-8 border-t border-obsidian-border text-center space-y-4">
        <div className="p-4 rounded-2xl bg-obsidian-card border border-obsidian-border max-w-md mx-auto">
          <p className="text-xs sm:text-sm text-zinc-300 font-medium">
            Ready to order? Simply tilt your table lamp or call your server.
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">
            Orders are taken verbally by your table waiter.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 text-xs text-zinc-600">
          <span>&copy; {new Date().getFullYear()} No Wave Company</span>
          <span>•</span>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1 text-zinc-500 hover:text-amber transition-colors"
            title="Manager Admin Portal"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Staff Portal</span>
          </Link>
        </div>
      </footer>

      {/* ─── 5. SHORTLIST DRAWER HELPER ─── */}
      <TableShortlistDrawer
        shortlist={shortlist}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearShortlist={handleClearShortlist}
        tableNumber={tableParam}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 border border-amber/40 text-white text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 pointer-events-none"
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
              className="relative max-w-xl w-full bg-obsidian-card rounded-3xl overflow-hidden border border-obsidian-border shadow-2xl"
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

              <div className="p-4 bg-obsidian">
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
