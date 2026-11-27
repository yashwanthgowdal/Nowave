"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, ShieldAlert, Sparkles, Plus, Minus, Check, Tag } from "lucide-react";
import { MenuItem, ShortlistItem, ItemCustomization } from "@/lib/types";
import { getDishAllergens, getDishHalfPrice, getDishDeal } from "@/lib/itemHelpers";
import { formatPrice } from "@/lib/utils";

interface ItemCustomizationModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (customizedItem: ShortlistItem) => void;
}

export function ItemCustomizationModal({
  item,
  isOpen,
  onClose,
  onAddToCart,
}: ItemCustomizationModalProps) {
  if (!item) return null;

  const allergens = getDishAllergens(item);
  const halfPrice = getDishHalfPrice(item);
  const deal = getDishDeal(item);

  const [spiceLevel, setSpiceLevel] = useState<"mild" | "medium" | "spicy">("medium");
  const [portionSize, setPortionSize] = useState<"half" | "full">("full");
  const [dealSelected, setDealSelected] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(1);

  // Dynamic calculated unit price
  const basePrice = portionSize === "half" ? halfPrice : item.price;
  const dealPrice = dealSelected ? deal.price : 0;
  const unitPrice = basePrice + dealPrice;
  const totalPrice = unitPrice * quantity;

  const handleConfirm = () => {
    const customization: ItemCustomization = {
      spiceLevel,
      portionSize,
      selectedDeal: dealSelected ? deal : null,
    };

    onAddToCart({
      item,
      quantity,
      customization,
      calculatedPrice: unitPrice,
    });

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal / Bottom Sheet */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative z-10 w-full max-w-lg bg-[#141416] border border-zinc-800/80 rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Dish Image Banner */}
            {item.imageUrl ? (
              <div className="relative h-52 w-full overflow-hidden bg-zinc-900">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141416] via-[#141416]/40 to-transparent" />
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/90 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="p-4 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-serif text-2xl font-bold text-white tracking-wide">
                    {item.name}
                  </h3>
                  <span className="font-serif text-xl font-bold text-amber">
                    {formatPrice(unitPrice)}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* 1. Spice Level Selector */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber" /> Spice Level
                  </span>
                  <span className="text-xs font-medium text-amber capitalize">
                    {spiceLevel}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(["mild", "medium", "spicy"] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSpiceLevel(level)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-semibold capitalize flex items-center justify-center gap-1.5 transition-all ${
                        spiceLevel === level
                          ? "bg-amber/15 border-amber text-amber shadow-lg shadow-amber/10"
                          : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      <span>{level === "mild" ? "🌶️" : level === "medium" ? "🌶️🌶️" : "🌶️🌶️🌶️"}</span>
                      <span>{level}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Portion Size Selector */}
              <div className="space-y-2.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Portion Size
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPortionSize("half")}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                      portionSize === "half"
                        ? "bg-amber/15 border-amber text-white"
                        : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-white">Half Portion</p>
                      <p className="text-[11px] text-zinc-400">Standard serving</p>
                    </div>
                    <span className="text-xs font-semibold text-amber">
                      {formatPrice(halfPrice)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPortionSize("full")}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                      portionSize === "full"
                        ? "bg-amber/15 border-amber text-white"
                        : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-white">Full Portion</p>
                      <p className="text-[11px] text-zinc-400">Chef recommendation</p>
                    </div>
                    <span className="text-xs font-semibold text-amber">
                      {formatPrice(item.price)}
                    </span>
                  </button>
                </div>
              </div>

              {/* 3. Allergen Info */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-zinc-400" /> Allergen Info
                </span>
                <div className="flex flex-wrap gap-2">
                  {allergens.map((alg) => (
                    <span
                      key={alg}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-[11px] font-medium text-zinc-300"
                    >
                      {alg}
                    </span>
                  ))}
                </div>
              </div>

              {/* 4. Contextual Upsell / Deal */}
              <div
                onClick={() => setDealSelected(!dealSelected)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  dealSelected
                    ? "bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-950/20"
                    : "bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      dealSelected
                        ? "bg-emerald-500 border-emerald-500 text-black"
                        : "border-zinc-700 bg-zinc-800"
                    }`}
                  >
                    {dealSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3 h-3 text-emerald-400" />
                      <span className="text-xs font-bold text-white">{deal.name}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400">Pair this meal deal</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400">
                  +{formatPrice(deal.price)}
                </span>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="p-4 bg-[#111113] border-t border-zinc-800/80 flex items-center gap-3">
              {/* Quantity stepper */}
              <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white transition-all active:scale-95"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-xs font-bold text-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add to Order CTA */}
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-3.5 px-5 rounded-xl bg-gradient-to-r from-amber to-amber-600 text-obsidian font-bold text-sm tracking-wide shadow-xl shadow-amber/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-between"
              >
                <span>Add to order</span>
                <span>{formatPrice(totalPrice)}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
