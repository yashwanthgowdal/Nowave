import React, { useState } from "react";
import { ShieldCheck, CheckCircle2, AlertCircle, KeyRound, UserCheck } from "lucide-react";
import { TableSession, Order } from "@/lib/types";

interface TableOrderVerificationModalProps {
  tableNumber: string;
  tableSession?: TableSession;
  activeOrder?: Order;
  isOpen: boolean;
  onVerify: (code: string) => { success: boolean; message: string; remainingAttempts?: number };
  onClose?: () => void;
}

export function TableOrderVerificationModal({
  tableNumber,
  tableSession,
  activeOrder,
  isOpen,
  onVerify,
}: TableOrderVerificationModalProps) {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleChange = (index: number, val: string) => {
    const digit = val.replace(/[^0-9]/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setErrorMsg(null);

    // Auto-focus next input
    if (digit && index < 3) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 4);
    if (!pasteData) return;
    const newOtp = ["", "", "", ""];
    for (let i = 0; i < pasteData.length; i++) {
      newOtp[i] = pasteData[i];
    }
    setOtp(newOtp);
    if (pasteData.length === 4) {
      submitCode(pasteData);
    }
  };

  const submitCode = (code: string) => {
    setIsSubmitting(true);
    const result = onVerify(code);
    setIsSubmitting(false);

    if (result.success) {
      setIsSuccess(true);
      setErrorMsg(null);
    } else {
      setErrorMsg(result.message);
      setOtp(["", "", "", ""]);
      const firstInput = document.getElementById("otp-input-0");
      firstInput?.focus();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 4) {
      setErrorMsg("Please enter the full 4-digit code.");
      return;
    }
    submitCode(code);
  };

  const assignedWaiterName = tableSession?.assignedWaiterName || activeOrder?.assignedWaiterName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#181615] border border-amber/30 rounded-3xl p-6 shadow-2xl text-[#FAF7F2] overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-amber/15 blur-2xl rounded-full pointer-events-none" />

        {isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8 animate-bounce" />
            </div>
            <h3 className="text-2xl font-serif text-[#FAF7F2]">Table Verified!</h3>
            <p className="text-sm text-zinc-300">
              Your order has been transmitted directly to our kitchen stations.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Badge */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber/15 border border-amber/30 text-amber font-mono text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                {tableSession?.tableLabel || `Table ${tableNumber}`} Verification
              </div>
              <div className="text-[11px] text-zinc-400 font-mono">
                Anti-Fake Order Gate
              </div>
            </div>

            {/* Instruction Title */}
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-serif text-[#FAF7F2]">
                Order Sent to Staff!
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed max-w-xs mx-auto">
                To guarantee genuine in-seat dining, a waiter is walking to{" "}
                <span className="text-amber font-bold">{tableSession?.tableLabel || `Table ${tableNumber}`}</span> with your 4-digit confirmation code.
              </p>
            </div>

            {/* Waiter Status Card */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber/15 border border-amber/30 flex items-center justify-center text-amber shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-zinc-400 font-medium">Assigned Server</div>
                <div className="text-sm font-semibold text-[#FAF7F2] truncate">
                  {assignedWaiterName ? (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      {assignedWaiterName} (Walking to your table)
                    </span>
                  ) : (
                    <span className="text-amber animate-pulse">
                      Assigning nearest available server...
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 4-Digit Input Form */}
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="flex justify-center gap-3">
                {[0, 1, 2, 3].map((index) => (
                  <input
                    key={index}
                    id={`otp-input-${index}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={otp[index]}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    autoFocus={index === 0}
                    className="w-14 h-16 text-center text-3xl font-bold font-mono bg-black/60 border-2 border-amber/40 focus:border-amber rounded-2xl text-amber outline-none transition-all shadow-inner"
                  />
                ))}
              </div>

              {errorMsg && (
                <div className="flex items-center justify-center gap-2 text-xs text-red-400 font-medium bg-red-950/30 border border-red-800/40 py-2 px-3 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={otp.join("").length !== 4 || isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber to-amber-600 text-black font-semibold text-sm hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber/20 flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                {isSubmitting ? "Verifying Code..." : "Verify & Send to Kitchen"}
              </button>
            </form>

            {/* Physical NoWave Lamp Prompt */}
            <div className="pt-2 border-t border-white/5 text-center">
              <p className="text-[11px] text-zinc-400 italic">
                Need water, cutlery, or prompt assistance? <br />
                <span className="text-amber font-medium not-italic">
                  No Wave. Just Tilt — flip your table lamp to Red.
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
