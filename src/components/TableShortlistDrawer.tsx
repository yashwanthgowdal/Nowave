"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  X,
  Plus,
  Minus,
  Trash2,
  BellRing,
  Sparkles,
  ChevronUp,
} from "lucide-react";
import { ShortlistItem, MenuItem } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

interface TableShortlistDrawerProps {
  shortlist: ShortlistItem[];
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearShortlist: () => void;
  tableNumber?: string | null;
}

export function TableShortlistDrawer({
  shortlist,
  onUpdateQuantity,
  onRemoveItem,
  onClearShortlist,
  tableNumber,
}: TableShortlistDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const totalItemsCount = shortlist.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = shortlist.reduce(
    (sum, item) => sum + item.item.price * item.quantity,
    0
  );

  if (totalItemsCount === 0) return null;

  return (
    <>
      {/* Floating Sticky Bottom Bar */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 z-40 max-w-lg mx-auto"
        style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full bg-gradient-to-r from-zinc-900 to-obsidian border border-amber/40 shadow-2xl shadow-amber/20 rounded-2xl p-3.5 flex items-center justify-between text-left group hover:border-amber transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber/20 border border-amber/30 flex items-center justify-center text-amber relative">
              <ClipboardList className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 bg-amber text-black font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-black">
                {totalItemsCount}
              </span>
            </div>
            <div>
              <div className="text-white text-sm font-semibold flex items-center gap-2">
                <span>My Table Order Notepad</span>
                {tableNumber && (
                  <span className="text-[10px] bg-amber/15 text-amber px-2 py-0.5 rounded-full font-mono font-bold">
                    T-{tableNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                {totalItemsCount} {totalItemsCount === 1 ? "item" : "items"} noted • Tap to view verbal order checklist
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-base font-bold text-amber">
              {formatPrice(totalAmount)}
            </span>
            <div className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center group-hover:bg-amber group-hover:text-black transition-colors">
              <ChevronUp className="w-4 h-4" />
            </div>
          </div>
        </button>
      </motion.div>

      {/* Expanded Modal / Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-obsidian-card border-t sm:border border-obsidian-border rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 border-b border-obsidian-border flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-amber" />
                    <h3 className="font-serif text-lg font-bold text-white">
                      Table Order Checklist
                    </h3>
                    {tableNumber && (
                      <span className="text-xs bg-amber/20 border border-amber/40 text-amber px-2 py-0.5 rounded-full font-mono font-bold">
                        Table {tableNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Personal verbal reminder for when your waiter arrives.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="p-5 overflow-y-auto space-y-3.5 flex-1 divide-y divide-zinc-800/60">
                {shortlist.map(({ item, quantity }) => (
                  <div
                    key={item.id}
                    className="pt-3.5 first:pt-0 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {/* Veg / Non-Veg badge */}
                        <span
                          className={`w-3.5 h-3.5 border flex items-center justify-center shrink-0 ${
                            item.dietaryType === "nonveg"
                              ? "border-red-500"
                              : "border-emerald-500"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.dietaryType === "nonveg"
                                ? "bg-red-500"
                                : "bg-emerald-500"
                            }`}
                          />
                        </span>
                        <h4 className="font-medium text-sm text-zinc-100 truncate">
                          {item.name}
                        </h4>
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        {formatPrice(item.price)} each •{" "}
                        <span className="text-amber font-medium">
                          {formatPrice(item.price * quantity)}
                        </span>
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center bg-obsidian border border-obsidian-border rounded-xl">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-l-xl transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center font-mono text-sm text-white font-bold">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-r-xl transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        className="w-8 h-8 rounded-xl bg-zinc-800/80 hover:bg-red-950/60 text-zinc-500 hover:text-red-400 flex items-center justify-center transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Informational callout & summary footer */}
              <div
                className="p-5 bg-obsidian border-t border-obsidian-border space-y-4"
                style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}
              >
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber/5 border border-amber/20 text-xs text-zinc-300">
                  <BellRing className="w-4 h-4 text-amber shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-amber">Verbal ordering:</strong> When
                    your waiter attends to your table, simply read this list. No
                    online payments or app checkout required.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-xs text-zinc-500 uppercase tracking-wider block">
                      Estimated Total
                    </span>
                    <span className="text-2xl font-bold font-serif text-amber">
                      {formatPrice(totalAmount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClearShortlist}
                      className="px-3 py-2 text-xs text-zinc-400 hover:text-red-400 transition-colors"
                    >
                      Clear List
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="px-5 py-2.5 bg-amber hover:bg-brass-dark text-black font-semibold rounded-xl text-sm transition-all shadow-md shadow-amber/20"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
