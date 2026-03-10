"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

interface PageTransitionProps {
    children: React.ReactNode;
    className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
    const pathname = usePathname();

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                className={className}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
