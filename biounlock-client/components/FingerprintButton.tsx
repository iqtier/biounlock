"use client";

import React from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export type BiometricState = "idle" | "requesting" | "scanning" | "verifying" | "success" | "error";

interface FingerprintButtonProps {
  state: BiometricState;
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  sublabel?: string;
}

export default function FingerprintButton({
  state,
  onClick,
  disabled = false,
  label,
  sublabel,
}: FingerprintButtonProps) {
  const isBusy = state === "requesting" || state === "scanning" || state === "verifying";
  const isScanning = state === "scanning";
  const isSuccess = state === "success";
  const isError = state === "error";

  // Dynamic color palette based on state
  const getGlowColor = () => {
    if (isSuccess) return "from-emerald-500/30 to-green-500/10 border-emerald-500/50 shadow-emerald-500/30";
    if (isError) return "from-rose-500/30 to-red-500/10 border-rose-500/50 shadow-rose-500/30";
    if (isScanning || isBusy) return "from-cyan-500/40 to-blue-500/20 border-cyan-400/70 shadow-cyan-500/40";
    return "from-cyan-500/20 to-teal-500/10 border-cyan-500/30 hover:border-cyan-400/60 shadow-cyan-500/20";
  };

  const getStrokeColor = () => {
    if (isSuccess) return "#10b981"; // emerald-500
    if (isError) return "#f43f5e"; // rose-500
    if (isScanning) return "#38bdf8"; // sky-400
    return "#06b6d4"; // cyan-500
  };

  return (
    <div className="flex flex-col items-center justify-center select-none">
      {/* Outer sensor container with ambient biometric glow */}
      <div className="relative flex items-center justify-center p-4">
        {/* Pulsing ripple wave when active/scanning */}
        {isScanning && (
          <>
            <span className="absolute inset-0 rounded-full bg-cyan-400/20 animate-biometric-ripple" />
            <span className="absolute inset-2 rounded-full bg-cyan-500/20 animate-biometric-ripple [animation-delay:400ms]" />
          </>
        )}

        {/* Ambient background glow ring */}
        <div
          className={`absolute inset-1 rounded-full bg-gradient-to-tr ${getGlowColor()} blur-xl opacity-60 transition-all duration-700 pointer-events-none ${
            isScanning ? "animate-biometric-glow" : ""
          }`}
        />

        {/* Interactive Biometric Sensor Pad Button */}
        <button
          type="button"
          onClick={onClick}
          disabled={disabled || isBusy}
          aria-label={label || "Biometric fingerprint scanner"}
          className={`group relative flex items-center justify-center w-36 h-36 sm:w-40 sm:h-40 rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-500/40 ${
            disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer active:scale-95"
          }`}
        >
          {/* Outer metallic bezel ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-zinc-700 via-zinc-850 to-zinc-950 p-[3px] shadow-[0_10px_25px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)]">
            {/* Illuminated sensor rim */}
            <div
              className={`w-full h-full rounded-full border transition-all duration-500 ${
                isSuccess
                  ? "border-emerald-400/80 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                  : isError
                  ? "border-rose-400/80 shadow-[0_0_15px_rgba(244,63,94,0.5)]"
                  : isBusy
                  ? "border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.6)]"
                  : "border-cyan-500/40 group-hover:border-cyan-400 group-hover:shadow-[0_0_16px_rgba(6,182,212,0.45)]"
              } bg-zinc-950/90 backdrop-blur-md flex items-center justify-center overflow-hidden`}
            >
              {/* Radial gradient scanner glass depth */}
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/30 via-zinc-950/60 to-black/90 pointer-events-none" />

              {/* Concentric subtle target grooves */}
              <div className="absolute inset-3 rounded-full border border-dashed border-cyan-500/15 pointer-events-none" />
              <div className="absolute inset-7 rounded-full border border-cyan-500/10 pointer-events-none" />

              {/* Laser scan line sweeping across when scanning */}
              {isScanning && (
                <div className="absolute inset-x-3 h-0.5 bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_12px_#38bdf8,0_0_4px_#ffffff] z-20 animate-biometric-scan pointer-events-none">
                  <div className="absolute inset-x-0 -top-4 bottom-0 bg-gradient-to-b from-cyan-400/20 to-transparent pointer-events-none" />
                </div>
              )}

              {/* Success Overlay Indicator */}
              {isSuccess && (
                <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/40 z-30 animate-in fade-in zoom-in duration-300">
                  <CheckCircle2 className="w-16 h-16 text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                </div>
              )}

              {/* Error Overlay Indicator */}
              {isError && (
                <div className="absolute inset-0 flex items-center justify-center bg-rose-950/40 z-30 animate-in fade-in zoom-in duration-300">
                  <AlertCircle className="w-16 h-16 text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.8)]" />
                </div>
              )}

              {/* High-fidelity Vector Fingerprint Ridges */}
              <svg
                viewBox="0 0 100 100"
                className={`w-24 h-24 sm:w-28 sm:h-28 transition-all duration-500 z-10 ${
                  isSuccess
                    ? "opacity-20 scale-95"
                    : isError
                    ? "opacity-20"
                    : isScanning
                    ? "opacity-100 scale-105 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                    : "opacity-80 group-hover:opacity-100 group-hover:scale-105 group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                }`}
                fill="none"
                stroke={getStrokeColor()}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Detailed biometric whorl and ridge paths */}
                {/* Innermost loop */}
                <path d="M 50 44 C 47 44 46 47 46 50 C 46 56 48 60 50 63" />
                
                {/* Second ridge loop */}
                <path d="M 42 50 C 42 43 45 39 50 39 C 55 39 58 43 58 48 C 58 57 55 64 53 69" />
                
                {/* Third ridge loop */}
                <path d="M 38 53 C 38 41 42 34 50 34 C 58 34 62 41 62 48 C 62 58 59 67 56 74" />
                
                {/* Fourth arch loop */}
                <path d="M 34 58 C 34 40 40 29 50 29 C 60 29 66 39 66 50 C 66 62 63 72 59 79" />
                
                {/* Fifth outer loop */}
                <path d="M 30 63 C 30 42 38 24 50 24 C 62 24 70 36 70 51 C 70 65 67 76 63 82" />
                
                {/* Sixth outer ridge */}
                <path d="M 26 69 C 26 46 36 19 50 19 C 64 19 74 33 74 52 C 74 67 71 80 67 85" />
                
                {/* Lower left delta / entry ridges */}
                <path d="M 23 75 C 23 60 25 50 30 43" />
                <path d="M 28 82 C 30 76 34 71 36 67" />
                <path d="M 34 86 C 36 82 40 78 43 74" />
                
                {/* Center lower core ridge */}
                <path d="M 47 71 C 48 76 49 81 50 86" />
                
                {/* Lower right delta ridges */}
                <path d="M 72 87 C 75 80 77 71 77 62" />
                <path d="M 77 72 C 80 64 81 55 81 46 C 81 33 75 20 66 15" />
                
                {/* Crown arches */}
                <path d="M 40 16 C 43 15 47 14 50 14 C 54 14 58 15 62 16" />
              </svg>

              {/* Subtle glass reflection highlight */}
              <div className="absolute -top-12 -left-12 w-28 h-28 rounded-full bg-gradient-to-br from-white/10 to-transparent blur-md pointer-events-none" />
            </div>
          </div>
        </button>
      </div>

      {/* Sensor prompt label & status hint */}
      <div className="mt-4 text-center">
        <p className="text-sm font-semibold tracking-wide text-zinc-200 transition-colors">
          {label || (isScanning ? "Touch Sensor Now" : isBusy ? "Processing..." : "Touch to Scan")}
        </p>
        {sublabel && (
          <p className="text-xs text-zinc-400 mt-1 flex items-center justify-center gap-1.5">
            {isBusy && <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />}
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
}
