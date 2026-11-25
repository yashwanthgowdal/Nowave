"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Flame, Star, Plus, Check, Utensils } from "lucide-react";
import { MenuItem } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

interface DishCardProps {
  item: MenuItem;
  onImageClick?: (url: string, name: string) => void;
  onAddNote: (item: MenuItem) => void;
  isNoted?: boolean;
}

// ── Veg / Non-Veg Standard Icon ──
function DietaryIndicator({ type }: { type: string }) {
  const isNonVeg = type === "nonveg";
  const isEgg = type === "egg";
  const isVegan = type === "vegan";

  let borderColor = "border-emerald-500";
  let fillColor = "bg-emerald-500";
  let label = "Veg";

  if (isNonVeg) {
    borderColor = "border-red-500";
    fillColor = "bg-red-500";
    label = "Non-Veg";
  } else if (isEgg) {
    borderColor = "border-amber-500";
    fillColor = "bg-amber-500";
    label = "Egg";
  } else if (isVegan) {
    borderColor = "border-emerald-400";
    fillColor = "bg-emerald-400";
    label = "Vegan";
  }

  return (
    <div
      className="inline-flex items-center gap-1.5"
      title={`${label} dish`}
    >
      <div
        className={`w-4 h-4 border-2 ${borderColor} rounded-[3px] flex items-center justify-center p-[2px] bg-obsidian`}
      >
        <div className={`w-2 h-2 rounded-full ${fillColor}`} />
      </div>
      <span className="text-[11px] font-medium text-zinc-400 capitalize">
        {label}
      </span>
    </div>
  );
}

// ── Spice Level Indicator ──
function SpiceLevel({ level }: { level: number }) {
  if (level <= 1) return null;
  return (
    <div
      className="inline-flex items-center gap-0.5 text-red-400"
      title={`Spice Level: ${level}/5`}
    >
      {Array.from({ length: Math.min(level, 5) }).map((_, i) => (
        <Flame key={i} className="w-3 h-3 fill-red-500 text-red-500" />
      ))}
    </div>
  );
}

export function DishCard({
  item,
  onImageClick,
  onAddNote,
  isNoted = false,
}: DishCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.25 } }}
      transition={{ duration: 0.2 }}
      className="group bg-obsidian-card border border-obsidian-border hover:border-amber/40 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col justify-between"
    >
      <div>
        {/* Image / Fallback Container */}
        <div
          className="relative h-44 w-full bg-zinc-900 overflow-hidden cursor-pointer"
          onClick={() => {
            if (item.imageUrl && !imageError && onImageClick) {
              onImageClick(item.imageUrl, item.name);
            }
          }}
        >
          {item.imageUrl && !imageError ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 to-obsidian text-zinc-600 gap-2">
              <Utensils className="w-10 h-10 text-amber/40" />
              <span className="text-[11px] font-sans text-zinc-500 uppercase tracking-widest">
                No Wave Culinary
              </span>
            </div>
          )}

          {/* Badges Overlay */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {item.isChefSpecial && (
              <span className="bg-amber text-black font-bold text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                <Star className="w-3 h-3 fill-black text-black" />
                Chef's Special
              </span>
            )}
            {item.isBestseller && (
              <span className="bg-red-600/90 backdrop-blur-sm text-white font-bold text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                <Flame className="w-3 h-3 fill-white text-white" />
                Bestseller
              </span>
            )}
          </div>

          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
            <span className="text-amber font-mono font-bold text-sm">
              {formatPrice(item.price)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <DietaryIndicator type={item.dietaryType} />
            <SpiceLevel level={item.spiceLevel} />
          </div>

          <h3 className="font-serif font-bold text-base text-zinc-100 group-hover:text-amber transition-colors leading-snug">
            {item.name}
          </h3>

          <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
            {item.description}
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 pt-1 border-t border-obsidian-border/50 flex items-center justify-between">
        <div className="text-xs text-zinc-500">
          Table service only
        </div>

        <button
          type="button"
          onClick={() => onAddNote(item)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
            isNoted
              ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-400"
              : "bg-zinc-800 hover:bg-amber hover:text-black text-zinc-200 border border-zinc-700"
          }`}
        >
          {isNoted ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Noted
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              + Note
            </>
          )}
        </button>
      </div>
    </motion.article>
  );
}
