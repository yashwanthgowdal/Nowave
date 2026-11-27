"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CreditCard,
  QrCode,
  Banknote,
  Building2,
  Check,
  Star,
  Users,
  Send,
  Heart,
  Sparkles,
} from "lucide-react";
import { Order } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { RestaurantStore } from "@/lib/RestaurantStore";
import { playSuccessChime } from "@/lib/audioService";

interface BillSplitPaymentModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: () => void;
}

export function BillSplitPaymentModal({
  order,
  isOpen,
  onClose,
  onPaymentSuccess,
}: BillSplitPaymentModalProps) {
  if (!isOpen) return null;

  const [splitWays, setSplitWays] = useState<number>(1);
  const [tipPercent, setTipPercent] = useState<number>(10);
  const [selectedMethod, setSelectedMethod] = useState<"upi" | "card" | "cash">("upi");
  const [step, setStep] = useState<"split_and_pay" | "success" | "review">("split_and_pay");
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false);

  // Calculations
  const tipAmount = Math.round((order.totalAmount * tipPercent) / 100);
  const grandTotal = order.totalAmount + tipAmount;
  const perPersonAmount = Math.round(grandTotal / splitWays);

  const handlePay = () => {
    RestaurantStore.recordPayment({
      orderId: order.id,
      tableNumber: order.tableNumber,
      splitWays,
      perPersonAmount,
      tipAmount,
      totalPaid: grandTotal,
      method: selectedMethod,
    });

    playSuccessChime();
    setStep("success");
    if (onPaymentSuccess) onPaymentSuccess();
  };

  const handleRatingSubmit = (stars: number) => {
    setReviewRating(stars);
    RestaurantStore.submitReview({
      orderId: order.id,
      tableNumber: order.tableNumber,
      rating: stars,
    });
    setReviewSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  // UPI deep link
  const upiPayUrl = `upi://pay?pa=nowave.pay@icici&pn=NoWaveRestaurant&am=${perPersonAmount}&cu=INR&tn=Table${order.tableNumber}_Bill`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-sm bg-[#141416] border border-zinc-800 rounded-[32px] p-6 shadow-2xl overflow-hidden"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ── STEP 1: BILL SPLIT & PAYMENT OPTIONS ── */}
        {step === "split_and_pay" && (
          <div className="space-y-5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber">
                Table {order.tableNumber} • Bill Breakdown
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <h3 className="font-serif text-2xl font-bold text-white">Your Bill</h3>
                <span className="font-serif text-2xl font-extrabold text-amber">
                  {formatPrice(order.totalAmount)}
                </span>
              </div>
            </div>

            {/* Split Selector: 1, 2, 3 Ways */}
            <div className="p-3.5 bg-zinc-900/70 border border-zinc-800 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber" /> Split Bill
                </span>
                <span className="text-amber font-bold">{splitWays} {splitWays === 1 ? "person" : "ways"}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((ways) => (
                  <button
                    key={ways}
                    type="button"
                    onClick={() => setSplitWays(ways)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      splitWays === ways
                        ? "bg-amber text-obsidian border-amber shadow-lg shadow-amber/10"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {ways === 1 ? "1 Person" : `${ways} Ways`}
                  </button>
                ))}
              </div>

              {/* Individual Split Avatars */}
              {splitWays > 1 && (
                <div className="flex items-center justify-around pt-2 border-t border-zinc-800/80">
                  {Array.from({ length: splitWays }).map((_, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-amber/20 border border-amber/40 flex items-center justify-center text-xs font-bold text-amber">
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="text-[11px] font-bold text-white mt-1">
                        {formatPrice(perPersonAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Gratuity / Tip Selector */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span>Add Tip for Hospitality</span>
                <span className="text-amber">+{formatPrice(tipAmount)}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[0, 5, 10, 15].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setTipPercent(pct)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      tipPercent === pct
                        ? "bg-amber/15 border-amber text-amber"
                        : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    {pct === 0 ? "No Tip" : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Payment Method
              </span>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setSelectedMethod("upi")}
                  className={`w-full p-3 rounded-2xl border flex items-center justify-between text-left transition-all ${
                    selectedMethod === "upi"
                      ? "bg-emerald-950/20 border-emerald-500 text-white"
                      : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-xs">
                      UPI
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Instant UPI</p>
                      <p className="text-[10px] text-zinc-400">GPay, PhonePe, Paytm, BHIM</p>
                    </div>
                  </div>
                  {selectedMethod === "upi" && <Check className="w-4 h-4 text-emerald-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod("card")}
                  className={`w-full p-3 rounded-2xl border flex items-center justify-between text-left transition-all ${
                    selectedMethod === "card"
                      ? "bg-amber/15 border-amber text-white"
                      : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber/20 flex items-center justify-center text-amber">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Debit / Credit Card</p>
                      <p className="text-[10px] text-zinc-400">Tap or Chip & PIN</p>
                    </div>
                  </div>
                  {selectedMethod === "card" && <Check className="w-4 h-4 text-amber" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod("cash")}
                  className={`w-full p-3 rounded-2xl border flex items-center justify-between text-left transition-all ${
                    selectedMethod === "cash"
                      ? "bg-zinc-800 border-zinc-500 text-white"
                      : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-300">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Cash at Table</p>
                      <p className="text-[10px] text-zinc-400">Server collects at table</p>
                    </div>
                  </div>
                  {selectedMethod === "cash" && <Check className="w-4 h-4 text-white" />}
                </button>
              </div>
            </div>

            {/* Pay CTA */}
            <button
              type="button"
              onClick={handlePay}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 active:scale-[0.98] text-black font-extrabold text-sm tracking-wide shadow-xl shadow-emerald-500/20 flex items-center justify-between px-5 transition-all"
            >
              <span>Pay at Table</span>
              <span>
                {splitWays > 1 ? `${formatPrice(perPersonAmount)} each` : formatPrice(grandTotal)}
              </span>
            </button>
          </div>
        )}

        {/* ── STEP 2: PAYMENT SUCCESS CHECKMARK & RECEIPT ── */}
        {step === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6 space-y-5"
          >
            {/* Animated Green Checkmark */}
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto shadow-2xl shadow-emerald-500/30">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>

            <div>
              <h3 className="font-serif text-2xl font-bold text-white">
                Paid {formatPrice(perPersonAmount)}
              </h3>
              <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wider font-semibold">
                via {selectedMethod.toUpperCase()} • Table {order.tableNumber}
              </p>
            </div>

            {/* Receipt Notice */}
            <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs text-zinc-300 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-amber" />
              <span>Digital receipt generated & synced</span>
            </div>

            <button
              type="button"
              onClick={() => setStep("review")}
              className="w-full py-3.5 rounded-xl bg-amber text-obsidian font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber/20 hover:brightness-110 active:scale-98 transition-all"
            >
              Rate Your Experience ➔
            </button>
          </motion.div>
        )}

        {/* ── STEP 3: 1-TAP REVIEW (09 / REVIEW) ── */}
        {step === "review" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6 space-y-6"
          >
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber">
                Thank You for Dining With Us
              </span>
              <h3 className="font-serif text-2xl font-bold text-white mt-1">
                How was your meal?
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Tap a star below for 1-tap feedback
              </p>
            </div>

            {/* 5-Star Rating Buttons */}
            <div className="flex items-center justify-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingSubmit(star)}
                  className="p-1 hover:scale-125 transition-transform"
                >
                  <Star
                    className={`w-9 h-9 transition-colors ${
                      star <= reviewRating
                        ? "text-amber fill-amber drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                        : "text-zinc-700"
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="text-xl font-bold text-white font-serif">
              {reviewRating}.0 ★
            </div>

            {reviewSubmitted && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-emerald-950/60 border border-emerald-500/60 rounded-xl text-emerald-400 text-xs font-bold"
              >
                ✓ Review posted! Thank you!
              </motion.div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
