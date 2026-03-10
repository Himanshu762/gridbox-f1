import Link from "next/link";

const FOOTER_LINKS = [
    { name: "Results", href: "/results" },
    { name: "Circuits", href: "/circuits" },
    { name: "Analysis", href: "/analysis" },
    { name: "Strategy", href: "/strategy" },
    { name: "Head to Head", href: "/head-to-head" },
    { name: "Team Radio", href: "/legends" },
];

export function Footer() {
    return (
        <footer className="relative mt-auto overflow-hidden">
            {/* Top gradient line */}
            <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            <div className="glass border-t border-white/5">
                <div className="max-w-[1600px] mx-auto px-6 py-10">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-10">
                        {/* Brand */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2.5">
                                <span className="material-symbols-outlined text-xl text-primary">sports_motorsports</span>
                                <span className="text-lg font-extrabold tracking-tight text-white">GridBox F1</span>
                            </div>
                            <p className="text-[11px] text-slate-500 max-w-[280px] leading-relaxed">
                                The free, all-in-one Formula 1 hub. Live timing, race analysis, telemetry, standings — everything an F1 fan needs.
                            </p>
                            <p className="text-[10px] text-slate-600 leading-relaxed">
                                Unofficial fan project. Not affiliated with Formula 1, FIA, or any F1 team.
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Explore</span>
                            <div className="grid grid-cols-2 gap-x-10 gap-y-1.5">
                                {FOOTER_LINKS.map(link => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="text-xs text-slate-400 hover:text-primary transition-colors duration-200"
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Data Attribution */}
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Powered By</span>
                            <div className="flex flex-col gap-1.5 text-xs text-slate-500">
                                <span className="flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-f1-teal" />
                                    Jolpica (Ergast) API
                                </span>
                                <span className="flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-primary" />
                                    OpenF1 API
                                </span>
                                <span className="flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-f1-yellow" />
                                    RSS News Feeds
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-2">
                        <span className="text-[10px] text-slate-600 font-mono">
                            &copy; {new Date().getFullYear()} GridBox F1
                        </span>
                        <span className="text-[10px] text-slate-600 font-mono flex items-center gap-1.5">
                            Built with
                            <span className="text-slate-400">Next.js</span>
                            +
                            <span className="text-slate-400">React</span>
                            +
                            <span className="text-slate-400">Tailwind</span>
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
