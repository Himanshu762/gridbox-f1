"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const PRIMARY_LINKS = [
    { name: 'HOME', href: '/' },
    { name: 'STANDINGS', href: '/standings' },
    { name: 'DRIVERS', href: '/drivers' },
    { name: 'TEAMS', href: '/teams' },
    { name: 'CALENDAR', href: '/calendar' },
    { name: 'PIT WALL', href: '/live' },
    { name: 'NEWS', href: '/news' },
];

const MORE_LINKS = [
    { name: 'RESULTS', href: '/results' },
    { name: 'CIRCUITS', href: '/circuits' },
    { name: 'ANALYSIS', href: '/analysis' },
    { name: 'STRATEGY', href: '/strategy' },
    { name: 'H2H', href: '/head-to-head' },
];

const ALL_LINKS = [...PRIMARY_LINKS, ...MORE_LINKS, { name: 'WATCH LIVE', href: '/watch' }];

export function Navbar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const moreRef = useRef<HTMLDivElement>(null);

    // Close "More" dropdown when clicking outside
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
                setMoreOpen(false);
            }
        }
        if (moreOpen) {
            document.addEventListener("mousedown", handleClick);
            return () => document.removeEventListener("mousedown", handleClick);
        }
    }, [moreOpen]);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileOpen(false);
        setMoreOpen(false);
    }, [pathname]);

    const isMoreActive = MORE_LINKS.some(l => pathname === l.href);

    return (
        <header className="fixed top-4 left-4 right-4 xl:left-1/2 xl:-translate-x-1/2 max-w-[1600px] z-50">
            <nav aria-label="Main navigation" className="glass rounded-xl flex items-center justify-between px-5 lg:px-8 py-3">
                {/* Logo + Live dot */}
                <div className="flex items-center gap-3 shrink-0">
                    <Link href="/" className="flex items-center gap-3 group">
                        <span className="material-symbols-outlined text-2xl text-primary group-hover:scale-110 transition-transform">sports_motorsports</span>
                        <span className="text-xl font-extrabold tracking-tight text-primary drop-shadow-[0_0_8px_rgba(225,6,0,0.6)]">ParcFermé</span>
                    </Link>
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse-fast shadow-[0_0_6px_rgba(225,6,0,0.8)]" aria-hidden="true" />
                </div>

                {/* Desktop Nav — only visible at xl (1280px+) */}
                <div className="hidden xl:flex items-center gap-1 flex-1 justify-end">
                    <div className="flex items-center gap-5">
                        {PRIMARY_LINKS.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "transition-all text-xs font-bold tracking-widest uppercase relative py-2 px-2 rounded-md hover:bg-white/5",
                                        isActive ? "text-white" : "text-slate-400 hover:text-white"
                                    )}
                                >
                                    {item.name}
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-indicator"
                                            className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full shadow-[0_0_8px_rgba(225,6,0,0.8)]"
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}

                        {/* More dropdown */}
                        <div ref={moreRef} className="relative">
                            <button
                                onClick={() => setMoreOpen(!moreOpen)}
                                className={cn(
                                    "flex items-center gap-1 transition-all text-xs font-bold tracking-widest uppercase py-2 px-2 rounded-md hover:bg-white/5",
                                    isMoreActive || moreOpen ? "text-white" : "text-slate-400 hover:text-white"
                                )}
                                aria-expanded={moreOpen}
                                aria-haspopup="true"
                            >
                                MORE
                                <span className={cn("material-symbols-outlined text-sm transition-transform", moreOpen && "rotate-180")}>expand_more</span>
                                {isMoreActive && (
                                    <motion.div
                                        layoutId="nav-indicator"
                                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full shadow-[0_0_8px_rgba(225,6,0,0.8)]"
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                            </button>

                            <AnimatePresence>
                                {moreOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute top-full right-0 mt-3 glass rounded-xl border border-white/10 py-2 min-w-[180px] shadow-2xl"
                                    >
                                        {MORE_LINKS.map((item) => {
                                            const isActive = pathname === item.href;
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    className={cn(
                                                        "block px-4 py-2 text-xs font-bold tracking-widest uppercase transition-colors",
                                                        isActive
                                                            ? "text-white bg-primary/15 border-l-2 border-primary"
                                                            : "text-slate-400 hover:text-white hover:bg-white/5"
                                                    )}
                                                >
                                                    {item.name}
                                                </Link>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <Link
                        href="/watch"
                        className="ml-4 flex items-center justify-center rounded-lg h-9 px-5 bg-primary hover:bg-red-700 text-white text-xs font-bold tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(225,6,0,0.4)] hover:shadow-[0_0_25px_rgba(225,6,0,0.7)]"
                    >
                        WATCH LIVE
                    </Link>
                </div>

                {/* Mobile hamburger — visible below xl */}
                <button
                    className="xl:hidden flex items-center p-2 -mr-2 text-slate-200 hover:text-white transition-colors"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle menu"
                    aria-expanded={mobileOpen}
                >
                    <span className="material-symbols-outlined text-2xl">
                        {mobileOpen ? 'close' : 'menu'}
                    </span>
                </button>
            </nav>

            {/* Mobile Menu — includes ALL links + WATCH LIVE */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-2 glass rounded-xl overflow-hidden xl:hidden border border-white/5"
                    >
                        <div className="px-3 py-3 space-y-0.5 max-h-[70vh] overflow-y-auto">
                            {ALL_LINKS.map((item, i) => {
                                const isActive = pathname === item.href;
                                const isWatch = item.href === '/watch';
                                return (
                                    <motion.div
                                        key={item.href}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                    >
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                "block px-3 py-2.5 rounded-lg text-sm font-bold tracking-widest uppercase transition-colors",
                                                isWatch
                                                    ? "bg-primary/20 text-primary border border-primary/30 text-center mt-2"
                                                    : isActive
                                                        ? "bg-primary/15 text-white border-l-2 border-primary"
                                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            {item.name}
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
