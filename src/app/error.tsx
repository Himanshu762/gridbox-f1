"use client";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-6">
            <div className="glass carbon-card rounded-2xl p-12 border border-white/10 max-w-lg w-full text-center">
                <span className="material-symbols-outlined text-6xl text-primary mb-6 block">warning</span>
                <h2 className="text-4xl font-black uppercase text-white font-f1 tracking-tighter mb-4">
                    RED <span className="text-primary italic">FLAG</span>
                </h2>
                <p className="text-slate-400 font-mono text-sm mb-8">
                    Something went wrong loading this page. The session has been interrupted.
                </p>
                <button
                    onClick={() => reset()}
                    className="px-8 py-3 bg-primary hover:bg-red-700 text-white font-f1 font-bold tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(225,6,0,0.4)] rounded"
                >
                    RESTART SESSION
                </button>
            </div>
        </div>
    );
}
