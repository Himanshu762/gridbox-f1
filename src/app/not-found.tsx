import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-6">
            <div className="glass carbon-card rounded-2xl p-12 border border-white/10 max-w-lg w-full text-center">
                <div className="text-[120px] font-black font-f1 italic text-white/10 leading-none mb-4">404</div>
                <h2 className="text-4xl font-black uppercase text-white font-f1 tracking-tighter mb-4">
                    OFF <span className="text-primary italic">TRACK</span>
                </h2>
                <p className="text-slate-400 font-mono text-sm mb-8">
                    This page doesn&apos;t exist. You&apos;ve gone beyond the track limits.
                </p>
                <Link
                    href="/"
                    className="inline-block px-8 py-3 bg-primary hover:bg-red-700 text-white font-f1 font-bold tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(225,6,0,0.4)] rounded"
                >
                    BACK TO PIT LANE
                </Link>
            </div>
        </div>
    );
}
