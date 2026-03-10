export default function Loading() {
    return (
        <div className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center gap-6">
            <div className="relative flex h-10 w-10">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-10 w-10 bg-primary shadow-[0_0_20px_rgba(225,6,0,0.6)]" />
            </div>
            <p className="text-white font-mono tracking-widest animate-pulse text-sm uppercase">Loading session data...</p>
        </div>
    );
}
