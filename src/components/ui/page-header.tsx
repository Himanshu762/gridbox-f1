"use client";

import { motion } from "framer-motion";

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    variant?: "hero" | "panel";
    accent?: string;
    description?: string;
}

export function PageHeader({ title, subtitle, variant = "hero", accent, description }: PageHeaderProps) {
    if (variant === "panel") {
        return (
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="glass rounded-xl border border-white/10 px-6 py-4 mb-6 flex items-center gap-4 relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
                <div className="w-1 h-8 rounded-full bg-primary relative z-10" />
                <h1 className="text-xl md:text-2xl font-bold uppercase tracking-widest text-white relative z-10">{title}</h1>
                <div className="flex-1" />
                <div className="flex items-center gap-2 relative z-10">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary">LIVE</span>
                </div>
            </motion.div>
        );
    }

    const accentColor = accent || "#E10600";

    return (
        <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10 relative"
        >
            {/* Ambient glow behind header */}
            <div
                className="absolute -top-20 -left-20 w-[300px] h-[200px] rounded-full blur-[100px] opacity-20 pointer-events-none"
                style={{ background: accentColor }}
            />

            <h1 className="text-5xl md:text-7xl font-black italic uppercase leading-[0.9] tracking-tight relative">
                <motion.span
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="inline-block -skew-x-6 text-white"
                >
                    {title}
                </motion.span>
                {subtitle && (
                    <>
                        <br />
                        <motion.span
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="inline-block -skew-x-6 text-transparent bg-clip-text"
                            style={{
                                backgroundImage: `linear-gradient(135deg, ${accentColor}, ${accentColor}66)`,
                            }}
                        >
                            {subtitle}
                        </motion.span>
                    </>
                )}
            </h1>

            {/* Animated underline */}
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: 80 }}
                transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                className="mt-4 h-1 rounded-full"
                style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
            />

            {description && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mt-3 text-sm text-slate-400 max-w-lg"
                >
                    {description}
                </motion.p>
            )}
        </motion.div>
    );
}
