"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCountdown } from "@/lib/utils";

interface CountdownTimerProps {
    targetDate: Date;
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
    // Initialize with static zeros to avoid hydration mismatch (Date.now() differs server vs client)
    const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

    useEffect(() => {
        setCountdown(formatCountdown(targetDate));
        const interval = setInterval(() => {
            setCountdown(formatCountdown(targetDate));
        }, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);

    const units = [
        { label: "DAYS", value: countdown.days },
        { label: "HRS", value: countdown.hours },
        { label: "MINS", value: countdown.mins },
        { label: "SECS", value: countdown.secs },
    ];

    return (
        <div className="flex items-center gap-3 sm:gap-4">
            {units.map((unit, i) => (
                <div key={unit.label} className="flex items-center gap-3 sm:gap-4">
                    <div className="flex flex-col items-center">
                        {/* Flip-clock style digit */}
                        <div className="relative w-16 h-20 sm:w-20 sm:h-24 rounded-lg overflow-hidden bg-[#111118] border border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                            {/* Top half background */}
                            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-[#2A2A3A] to-[#1E1E2E]" />
                            {/* Bottom half background */}
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-[#1A1A28] to-[#151520]" />
                            {/* Divider line */}
                            <div className="absolute inset-x-0 top-1/2 h-px bg-black/60 z-10" />
                            <div className="absolute inset-x-0 top-[calc(50%+1px)] h-px bg-white/[0.03] z-10" />
                            {/* Notches on divider edges */}
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2 bg-black/40 rounded-r-full z-10" />
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-2 bg-black/40 rounded-l-full z-10" />
                            {/* Animated number — centered in full cell */}
                            <AnimatePresence mode="popLayout">
                                <motion.span
                                    key={unit.value}
                                    initial={{ y: -14, opacity: 0, filter: "blur(2px)" }}
                                    animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                                    exit={{ y: 14, opacity: 0, filter: "blur(2px)" }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    className="absolute inset-0 flex items-center justify-center font-mono text-3xl sm:text-4xl font-black text-white tabular-nums z-20 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
                                >
                                    {String(unit.value).padStart(2, "0")}
                                </motion.span>
                            </AnimatePresence>
                            {/* Subtle red glow on sides */}
                            <div className="absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b from-transparent via-f1-red/30 to-transparent" />
                            <div className="absolute inset-y-0 right-0 w-0.5 bg-gradient-to-b from-transparent via-f1-red/30 to-transparent" />
                            {/* Inner highlight on top edge */}
                            <div className="absolute inset-x-0 top-0 h-px bg-white/[0.06]" />
                        </div>
                        <span className="mt-2 text-[10px] font-mono text-muted-foreground tracking-[0.2em]">
                            {unit.label}
                        </span>
                    </div>
                    {/* Colon separator with glow */}
                    {i < units.length - 1 && (
                        <div className="flex flex-col gap-2 pb-6">
                            <div className="w-1.5 h-1.5 rounded-full bg-f1-red shadow-[0_0_6px_rgba(225,6,0,0.8),0_0_12px_rgba(225,6,0,0.4)]" />
                            <div className="w-1.5 h-1.5 rounded-full bg-f1-red shadow-[0_0_6px_rgba(225,6,0,0.8),0_0_12px_rgba(225,6,0,0.4)]" />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
