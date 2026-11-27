"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Wifi,
  Award,
  Gamepad2,
  Check,
  Copy,
  Receipt,
  Bell,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Flame,
  X,
  CreditCard,
} from "lucide-react";
import { Order } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

interface SmartWaitScreenProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onOpenCallWaiter: () => void;
  onOpenPayBill: () => void;
}

const QUIZ_QUESTIONS = [
  {
    q: "Sabse teekhi mirch kaunsi hai (Hottest chili in India)?",
    options: ["Bhut Jolokia (Ghost Pepper)", "Jalapeño", "Kashmiri Mirch", "Guntur Sannam"],
    answerIndex: 0,
    funFact: "Bhut Jolokia from Assam was once certified by Guinness as the hottest chili!",
  },
  {
    q: "Which spice gives Dal Makhani and Biryani its golden yellow hue?",
    options: ["Saffron (Kesar)", "Turmeric (Haldi)", "Cardamom", "Star Anise"],
    answerIndex: 1,
    funFact: "Turmeric has been used in Ayurvedic cooking for over 4,000 years.",
  },
  {
    q: "What gives Tandoori Roti its signature smoky aroma?",
    options: ["Clay tandoor oven & charcoal embers", "Gas grill", "Microwave radiation", "Cast iron pan"],
    answerIndex: 0,
    funFact: "Authentic clay tandoors reach temperatures exceeding 480°C (900°F)!",
  },
];

export function SmartWaitScreen({
  order,
  isOpen,
  onClose,
  onOpenCallWaiter,
  onOpenPayBill,
}: SmartWaitScreenProps) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<"wifi" | "rewards" | "games">("wifi");
  const [wifiCopied, setWifiCopied] = useState(false);
  const [isItemsExpanded, setIsItemsExpanded] = useState(false);

  // Live countdown timer calculation
  const totalSeconds = (order.estimatedMinutes || 12) * 60;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    const elapsed = Math.floor((Date.now() - order.createdAt) / 1000);
    return Math.max(10, totalSeconds - elapsed);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // Percentage for the animated circle
  const progressPercent = Math.max(
    5,
    Math.min(100, Math.round(((totalSeconds - secondsRemaining) / totalSeconds) * 100))
  );

  // Wi-Fi details
  const wifiSSID = "NoWave_Guest";
  const wifiPass = "nowave2026";

  const handleCopyWifi = () => {
    navigator.clipboard.writeText(wifiPass);
    setWifiCopied(true);
    setTimeout(() => setWifiCopied(false), 2500);
  };

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [myScore, setMyScore] = useState(4);
  const [rivalScore] = useState(3);
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);

  const currentQuiz = QUIZ_QUESTIONS[quizIndex];

  const handleSelectQuizOption = (optIdx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(optIdx);
    if (optIdx === currentQuiz.answerIndex) {
      setMyScore((s) => s + 1);
      setQuizFeedback("Correct! 🎉 " + currentQuiz.funFact);
    } else {
      setQuizFeedback("Not quite! The right answer is: " + currentQuiz.options[currentQuiz.answerIndex]);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setQuizFeedback(null);
    setQuizIndex((idx) => (idx + 1) % QUIZ_QUESTIONS.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-[#131316] border border-zinc-800 rounded-none sm:rounded-[36px] p-6 shadow-2xl flex flex-col min-h-screen sm:min-h-0 text-center overflow-hidden"
      >
        {/* Glow ambient background */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber/10 blur-[80px] pointer-events-none rounded-full" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 relative z-10">
          <div className="text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber">
              Table {order.tableNumber} • Order {order.orderNumber}
            </span>
            <h3 className="font-serif text-lg font-bold text-white">
              {order.status === "ready"
                ? "Your food is ready!"
                : order.status === "served"
                ? "Enjoy your meal!"
                : "Your food is cooking"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Central Circular Timer Progress */}
        <div className="my-6 flex flex-col items-center justify-center relative">
          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* SVG Progress Ring */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r="68"
                className="stroke-zinc-800"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r="68"
                className="stroke-amber"
                strokeWidth="10"
                strokeDasharray={427}
                strokeDashoffset={427 - (427 * progressPercent) / 100}
                strokeLinecap="round"
                fill="transparent"
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <Clock className="w-5 h-5 text-amber mb-1 animate-pulse" />
              <span className="font-mono text-3xl font-black text-white tracking-wider">
                {formattedTime}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mt-0.5">
                min left
              </span>
            </div>
          </div>

          {/* Stepper Status Indicators */}
          <div className="flex items-center gap-3 mt-4 text-[11px] font-semibold text-zinc-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Ordered
            </span>
            <span>•</span>
            <span
              className={`flex items-center gap-1 ${
                order.status === "cooking" ? "text-amber font-bold" : "text-zinc-500"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber animate-ping" /> Cooking
            </span>
            <span>•</span>
            <span
              className={`flex items-center gap-1 ${
                order.status === "ready" || order.status === "served"
                  ? "text-emerald-400 font-bold"
                  : "text-zinc-500"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-zinc-600" /> Ready
            </span>
          </div>
        </div>

        {/* 3 Interactive Tabs While Waiting */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-zinc-900/80 border border-zinc-800 rounded-2xl mb-4">
          <button
            type="button"
            onClick={() => setActiveTab("wifi")}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "wifi"
                ? "bg-amber text-obsidian shadow-lg shadow-amber/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>WiFi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("rewards")}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "rewards"
                ? "bg-amber text-obsidian shadow-lg shadow-amber/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Rewards</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("games")}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "games"
                ? "bg-amber text-obsidian shadow-lg shadow-amber/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Games</span>
          </button>
        </div>

        {/* Tab Content Box */}
        <div className="min-h-[170px] bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-center text-center">
          {/* 1. WiFi Tab */}
          {activeTab === "wifi" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-center gap-2 text-zinc-300 font-semibold text-xs">
                <Wifi className="w-4 h-4 text-amber" />
                <span>Complimentary Guest High-Speed Wi-Fi</span>
              </div>
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
                <div className="text-left">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Network Name</p>
                  <p className="text-xs font-bold text-white">{wifiSSID}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Password</p>
                  <p className="text-xs font-mono font-bold text-amber">{wifiPass}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyWifi}
                className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                {wifiCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Password Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-amber" />
                    <span>Copy Password</span>
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* 2. Rewards Tab */}
          {activeTab === "rewards" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2.5"
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber/15 border border-amber/30 text-amber text-xs font-bold">
                <Sparkles className="w-3 h-3" />
                <span>+40 Points Earned on this order!</span>
              </div>
              <p className="text-xs font-semibold text-white">
                Every meal earns points towards free dishes
              </p>
              {/* Progress bar */}
              <div className="space-y-1 mt-2">
                <div className="flex justify-between text-[11px] font-bold text-zinc-400">
                  <span>140 Points</span>
                  <span>Goal: 200 Points</span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber to-amber-500 rounded-full w-[70%]" />
                </div>
                <p className="text-[10px] text-zinc-400 pt-1">
                  🎁 60 points away from a <strong className="text-amber">Free Mango Lassi</strong>!
                </p>
              </div>
            </motion.div>
          )}

          {/* 3. Games Tab (Spice Quiz) */}
          {activeTab === "games" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {/* Live Leaderboard vs Table 2 */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 rounded-xl border border-zinc-800 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-amber text-obsidian text-[10px] font-black">
                    T{order.tableNumber}
                  </span>
                  <span className="font-bold text-white">You: {myScore} pts</span>
                </div>
                <span className="text-zinc-500 font-bold text-[10px]">LIVE VS</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-zinc-400">Table 2: {rivalScore} pts</span>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-black">
                    T2
                  </span>
                </div>
              </div>

              {/* Question */}
              <p className="text-xs font-bold text-white text-left">
                Q: {currentQuiz.q}
              </p>

              {/* Options */}
              <div className="grid grid-cols-2 gap-1.5">
                {currentQuiz.options.map((opt, oIdx) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelectQuizOption(oIdx)}
                    className={`p-2 rounded-xl border text-[11px] font-medium text-left transition-all ${
                      selectedOption === oIdx
                        ? oIdx === currentQuiz.answerIndex
                          ? "bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold"
                          : "bg-red-950/60 border-red-500 text-red-300"
                        : "bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {quizFeedback && (
                <div className="text-[11px] font-medium text-amber mt-1 flex items-center justify-between">
                  <span>{quizFeedback}</span>
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="text-[11px] underline font-bold text-white ml-2"
                  >
                    Next Q ➔
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Expandable Order Items List */}
        <div className="mt-4 border-t border-zinc-800/80 pt-3">
          <button
            type="button"
            onClick={() => setIsItemsExpanded(!isItemsExpanded)}
            className="w-full flex items-center justify-between text-xs font-semibold text-zinc-400 hover:text-white"
          >
            <span>
              {order.items.reduce((sum, i) => sum + i.quantity, 0)} items in this order (
              {formatPrice(order.totalAmount)})
            </span>
            {isItemsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <AnimatePresence>
            {isItemsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-2 space-y-1.5 text-left text-xs text-zinc-300 bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800"
              >
                {order.items.map((it) => (
                  <div key={it.id} className="flex justify-between items-center py-1 border-b border-zinc-800/50 last:border-0">
                    <div>
                      <span className="font-semibold">{it.quantity}x {it.name}</span>
                      <span className="text-[10px] text-zinc-400 block capitalize">
                        {it.customization.portionSize} • {it.customization.spiceLevel} spice
                        {it.customization.selectedDeal && ` • ${it.customization.selectedDeal.name}`}
                      </span>
                    </div>
                    <span className="font-medium text-zinc-300">{formatPrice(it.price * it.quantity)}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Actions: Call Waiter & Pay Bill */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={onOpenCallWaiter}
            className="py-3 px-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <Bell className="w-4 h-4 text-red-400" />
            <span>Call Waiter</span>
          </button>

          <button
            type="button"
            onClick={onOpenPayBill}
            className="py-3 px-3 rounded-2xl bg-gradient-to-r from-amber to-amber-600 text-obsidian text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98 shadow-lg shadow-amber/20 hover:brightness-110"
          >
            <CreditCard className="w-4 h-4" />
            <span>Split & Pay Bill</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
