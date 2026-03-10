"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { fetchStints, fetchPitStops, fetchLiveDrivers, fetchLiveSession, fetchLiveLaps } from "@/lib/api/openf1";
import { PageHeader } from "@/components/ui/page-header";
import type { OpenF1Stint, OpenF1Pit, OpenF1Driver, OpenF1Session } from "@/lib/api/openf1";
import { formatLapTime } from "@/lib/utils";
import { ErrorState } from "@/components/ui/error-state";
import { PageTransition } from "@/components/ui/page-transition";

const COMPOUND_COLORS: Record<string, { bg: string; border: string; label: string }> = {
    SOFT: { bg: "bg-red-500", border: "border-red-500", label: "S" },
    MEDIUM: { bg: "bg-yellow-400", border: "border-yellow-400", label: "M" },
    HARD: { bg: "bg-white", border: "border-white", label: "H" },
    INTERMEDIATE: { bg: "bg-green-500", border: "border-green-500", label: "I" },
    WET: { bg: "bg-blue-500", border: "border-blue-500", label: "W" },
    UNKNOWN: { bg: "bg-slate-500", border: "border-slate-500", label: "?" },
};

export default function StrategyClient() {
    const [stints, setStints] = useState<OpenF1Stint[]>([]);
    const [pits, setPits] = useState<OpenF1Pit[]>([]);
    const [drivers, setDrivers] = useState<OpenF1Driver[]>([]);
    const [session, setSession] = useState<OpenF1Session | null>(null);
    const [maxLap, setMaxLap] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        async function load() {
            try {
                setError(null);
                const [stintData, pitData, driverData, sessionData, lapData] = await Promise.all([
                    fetchStints(),
                    fetchPitStops(),
                    fetchLiveDrivers(),
                    fetchLiveSession(),
                    fetchLiveLaps(),
                ]);
                setStints(stintData);
                setPits(pitData);
                setDrivers(driverData);
                setSession(sessionData);

                const maxL = lapData.reduce((max: number, l: any) => Math.max(max, l.lap_number || 0), 0);
                setMaxLap(maxL || 60);
            } catch (err) {
                setError("Failed to load strategy data.");
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, [retryCount]);

    const getDriverInfo = (num: number) => {
        const d = drivers.find(drv => drv.driver_number === num);
        return {
            acronym: d?.name_acronym || `#${num}`,
            color: d?.team_colour ? `#${d.team_colour}` : "#ffffff",
            team: d?.team_name || "",
        };
    };

    // Group stints by driver, sorted by position (approximate from driver order)
    const driverStints = useMemo(() => {
        const map = new Map<number, OpenF1Stint[]>();
        for (const s of stints) {
            if (!map.has(s.driver_number)) map.set(s.driver_number, []);
            map.get(s.driver_number)!.push(s);
        }

        // Sort each driver's stints
        for (const [, arr] of map) {
            arr.sort((a, b) => a.stint_number - b.stint_number);
        }

        return Array.from(map.entries()).sort((a, b) => {
            // Sort by driver number as approximation
            return a[0] - b[0];
        });
    }, [stints]);

    // Group pit stops by driver
    const driverPits = useMemo(() => {
        const map = new Map<number, OpenF1Pit[]>();
        for (const p of pits) {
            if (!map.has(p.driver_number)) map.set(p.driver_number, []);
            map.get(p.driver_number)!.push(p);
        }
        return map;
    }, [pits]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center font-display gap-6">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
                <p className="text-white font-mono tracking-widest animate-pulse">LOADING STRATEGY DATA...</p>
            </div>
        );
    }

    if (error) return <ErrorState icon="wifi_off" message={error} onRetry={() => { setError(null); setIsLoading(true); setRetryCount(c => c + 1); }} />;

    return (
        <PageTransition>
        <div className="font-display pb-12 relative overflow-hidden">
            <div className="absolute top-0 right-[20%] w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] pointer-events-none -translate-y-1/2" />

            <div className="max-w-[1600px] mx-auto w-full px-4 md:px-8 relative z-10">
                {/* Header */}
                <PageHeader title="STRATEGY" subtitle="ANALYSIS" />

                {/* Compound Legend */}
                <div className="flex gap-6 mb-6 px-2 text-xs font-mono text-slate-400 uppercase flex-wrap">
                    {Object.entries(COMPOUND_COLORS).filter(([k]) => k !== "UNKNOWN").map(([compound, style]) => (
                        <span key={compound} className="flex items-center gap-2">
                            <span className={`w-4 h-4 rounded-sm ${style.bg}`} />
                            {compound}
                        </span>
                    ))}
                    <span className="flex items-center gap-2 ml-4">
                        <span className="material-symbols-outlined text-sm text-primary">local_gas_station</span>
                        Pit Stop
                    </span>
                </div>

                {/* Stint Chart */}
                <div className="glass rounded-xl border border-white/10 overflow-hidden bg-black/60 shadow-2xl">
                    {/* Lap scale header */}
                    <div className="flex items-center px-4 py-3 bg-black/80 border-b border-white/10">
                        <div className="w-[120px] flex-shrink-0 text-[10px] font-f1 text-slate-500 uppercase tracking-widest">Driver</div>
                        <div className="flex-1 flex justify-between text-[10px] font-mono text-slate-600">
                            {Array.from({ length: Math.ceil(maxLap / 10) + 1 }, (_, i) => i * 10).map(lap => (
                                <span key={lap}>L{lap}</span>
                            ))}
                        </div>
                    </div>

                    {/* Driver rows */}
                    <div className="divide-y divide-white/5">
                        {driverStints.length > 0 ? driverStints.map(([driverNum, drvStints]) => {
                            const info = getDriverInfo(driverNum);
                            const drvPits = driverPits.get(driverNum) || [];

                            return (
                                <div key={driverNum} className="flex items-center px-4 py-3 hover:bg-white/5 transition-colors group">
                                    {/* Driver label */}
                                    <div className="w-[120px] flex-shrink-0 flex items-center gap-2">
                                        <div className="w-1 h-6 rounded-full" style={{ backgroundColor: info.color }} />
                                        <div>
                                            <span className="text-sm font-bold text-white font-f1 uppercase">{info.acronym}</span>
                                            <span className="text-[10px] text-slate-600 block">{info.team}</span>
                                        </div>
                                    </div>

                                    {/* Stint bars */}
                                    <div className="flex-1 relative h-8">
                                        {drvStints.map((stint, si) => {
                                            const compound = COMPOUND_COLORS[stint.compound?.toUpperCase()] || COMPOUND_COLORS.UNKNOWN;
                                            const startPct = ((stint.lap_start - 1) / maxLap) * 100;
                                            const endLap = stint.lap_end || maxLap;
                                            const widthPct = ((endLap - stint.lap_start + 1) / maxLap) * 100;

                                            return (
                                                <div
                                                    key={si}
                                                    className={`absolute top-1 h-6 ${compound.bg} rounded-sm opacity-80 group-hover:opacity-100 transition-opacity flex items-center justify-center border ${compound.border} border-opacity-40`}
                                                    style={{ left: `${startPct}%`, width: `${Math.max(widthPct, 1)}%` }}
                                                    title={`${stint.compound} — Laps ${stint.lap_start}-${endLap} (Age: ${stint.tyre_age_at_start})`}
                                                >
                                                    <span className="text-[9px] font-black text-black mix-blend-difference">{compound.label}</span>
                                                </div>
                                            );
                                        })}

                                        {/* Pit stop markers */}
                                        {drvPits.map((pit, pi) => {
                                            const pitPct = ((pit.lap_number - 1) / maxLap) * 100;
                                            return (
                                                <div
                                                    key={`pit-${pi}`}
                                                    className="absolute top-0 h-full w-px bg-primary z-10"
                                                    style={{ left: `${pitPct}%` }}
                                                    title={`Pit L${pit.lap_number} — ${pit.pit_duration?.toFixed(1)}s`}
                                                >
                                                    <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-primary rounded-full border border-black" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="p-12 text-center text-slate-500 font-mono uppercase tracking-widest">
                                <span className="material-symbols-outlined text-4xl mb-4 block text-slate-700">analytics</span>
                                No stint data available. Data appears during and after live sessions.
                            </div>
                        )}
                    </div>
                </div>

                {/* Pit Stop Summary Table */}
                {pits.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-10">
                        <h2 className="text-2xl font-black text-white font-f1 uppercase tracking-tight mb-4 flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary">local_gas_station</span>
                            Pit Stop Summary
                        </h2>
                        <div className="glass rounded-xl border border-white/10 overflow-hidden bg-black/60">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-black/80 font-f1 text-[11px] uppercase tracking-widest text-slate-400">
                                    <tr>
                                        <th className="p-4 border-b border-primary/40">Driver</th>
                                        <th className="p-4 border-b border-primary/40 text-center">Lap</th>
                                        <th className="p-4 border-b border-primary/40 text-right">Duration</th>
                                    </tr>
                                </thead>
                                <tbody className="font-mono text-sm">
                                    {[...pits].sort((a, b) => a.pit_duration - b.pit_duration).map((pit, i) => {
                                        const info = getDriverInfo(pit.driver_number);
                                        const isFastest = i === 0;
                                        return (
                                            <tr key={`${pit.driver_number}-${pit.lap_number}`} className={`border-b border-white/5 hover:bg-white/10 transition-colors ${isFastest ? "bg-purple-500/5" : ""}`}>
                                                <td className="p-4 flex items-center gap-3">
                                                    <div className="w-1 h-6 rounded-full" style={{ backgroundColor: info.color }} />
                                                    <span className="font-bold text-white uppercase">{info.acronym}</span>
                                                </td>
                                                <td className="p-4 text-center text-slate-300">L{pit.lap_number}</td>
                                                <td className={`p-4 text-right font-bold ${isFastest ? "text-purple-400" : "text-white"}`}>
                                                    {pit.pit_duration?.toFixed(1)}s
                                                    {isFastest && <span className="ml-2 text-[9px] text-purple-400 font-f1">FASTEST</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
        </PageTransition>
    );
}
