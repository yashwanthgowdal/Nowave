"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  X,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  ChevronUp,
  Check,
  Send,
  Zap,
} from "lucide-react";
import { ShortlistItem } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

interface TableShortlistDrawerProps {
  shortlist: ShortlistItem[];
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearShortlist: () => void;
  onPlaceOrder: () => void;
  tableNumber?: string | null;
}

export function TableShortlistDrawer({
  shortlist,
  onUpdateQuantity,
  onRemoveItem,
  onClearShortlist,
  onPlaceOrder,
  tableNumber,
}: TableShortlistDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [placedSuccess, setPlacedSuccess] = useState(false);

  const totalItemsCount = shortlist.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = shortlist.reduce(
    (sum, item) => sum + (item.calculatedPrice || item.item.price) * item.quantity,
    0
  );

  const handleOrderSubmit = () => {
    setIsPlacing(true);
    setTimeout(() => {
      setIsPlacing(false);
      setPlacedSuccess(true);
      onPlaceOrder();
      setTimeout(() => {
        setPlacedSuccess(false);
        setIsOpen(false);
      }, 1500);
    }, 600);
  };

  if (totalItemsCount === 0 && !placedSuccess) return null;

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
          className="w-full bg-gradient-to-r from-[#18181b] to-obsidian border border-amber/40 shadow-2xl shadow-amber/20 rounded-2xl p-3.5 flex items-center justify-between text-left group hover:border-amber transition-all active:scale-[0.99]"
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
                <span>View Order Cart</span>
                {tableNumber && (
                  <span className="text-[10px] bg-amber/15 text-amber px-2 py-0.5 rounded-full font-mono font-bold">
                    Table {tableNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                {totalItemsCount} {totalItemsCount === 1 ? "item" : "items"} ready • Tap to review & place order
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
              className="relative w-full max-w-lg bg-[#141416] border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {placedSuccess ? (
                /* Instant Green Order Placed Animation (Video: "03 / ORDER") */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-10 text-center flex flex-col items-center justify-center space-y-4"
                >
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400">
                    <Check className="w-10 h-10 stroke-[3]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-white">Order placed!</h3>
                    <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wider font-semibold">
                      Table {tableNumber || "5"} • {totalItemsCount} items • {formatPrice(totalAmount)}
                    </p>
                  </div>
                  <p className="text-xs text-emerald-400 font-medium">
                    Order routed directly to Kitchen Station screens!
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* Header */}
                  <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-amber" />
                        <h3 className="font-serif text-lg font-bold text-white">
                          Your Order Cart
                        </h3>
                        {tableNumber && (
                          <span className="text-xs bg-amber/20 border border-amber/40 text-amber px-2 py-0.5 rounded-full font-mono font-bold">
                            Table {tableNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Instant 1-Tap order dispatch directly to Kitchen
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
                    {shortlist.map(({ item, quantity, customization, calculatedPrice }) => {
                      const itemPrice = calculatedPrice || item.price;
                      return (
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

                            {/* Customization Details */}
                            {customization && (
                              <div className="flex flex-wrap gap-1 mt-1 text-[10px] text-zinc-400">
                                <span className="capitalize text-amber font-semibold">
                                  {customization.portionSize}
                                </span>
                                <span>•</span>
                                <span className="capitalize">{customization.spiceLevel} spice</span>
                                {customization.selectedDeal && (
                                  <>
                                    <span>•</span>
                                    <span className="text-emerald-400 font-semibold">
                                      {customization.selectedDeal.name}
                                    </span>
                                  </>
                                )}
                              </div>
                            )}

                            <div className="text-xs text-zinc-400 mt-0.5">
                              {formatPrice(itemPrice)} each •{" "}
                              <span className="text-amber font-semibold">
                                {formatPrice(itemPrice * quantity)}
                              </span>
                            </div>
                          </div>

                          {/* Quantity controls */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl">
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
                      );
                    })}
                  </div>

                  {/* Summary & 1-Tap Place Order Footer */}
                  <div
                    className="p-5 bg-zinc-950 border-t border-zinc-800 space-y-4"
                    style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}
                  >
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-xs text-zinc-500 uppercase tracking-wider block">
                          Total Amount
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
                          Clear
                        </button>

                        {/* 1-Tap Place Order Button */}
                        <button
                          type="button"
                          disabled={isPlacing}
                          onClick={handleOrderSubmit}
                          className="px-6 py-3 bg-gradient-to-r from-amber to-amber-600 hover:brightness-110 text-obsidian font-extrabold rounded-xl text-sm transition-all shadow-xl shadow-amber/20 flex items-center gap-2 active:scale-98"
                        >
                          <Zap className="w-4 h-4 fill-obsidian" />
                          <span>{isPlacing ? "Sending..." : "Place Order (1-Tap)"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
