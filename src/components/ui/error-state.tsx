"use client";

import { motion } from "framer-motion";

interface ErrorStateProps {
    icon?: string;
    message: string;
    onRetry?: () => void;
    retryLabel?: string;
}

export function ErrorState({ icon = "wifi_off", message, onRetry, retryLabel = "Retry" }: ErrorStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center gap-4 py-20 text-center"
        >
            <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-slate-500">{icon}</span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="mt-2 px-5 py-2 rounded-lg bg-primary/20 text-primary text-xs font-bold uppercase tracking-widest hover:bg-primary/30 transition-colors border border-primary/30"
                >
                    {retryLabel}
                </button>
            )}
        </motion.div>
    );
}
