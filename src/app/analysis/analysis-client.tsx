"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { fetchLiveLaps, fetchLiveDrivers, fetchLiveSession, fetchPitStops } from "@/lib/api/openf1";
import type { OpenF1Lap, OpenF1Driver, OpenF1Session, OpenF1Pit } from "@/lib/api/openf1";
import { formatLapTime } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { PageTransition } from "@/components/ui/page-transition";

const LazyLineChart = dynamic(() => import("recharts").then(m => m.LineChart), { ssr: false });
const LazyLine = dynamic(() => import("recharts").then(m => m.Line), { ssr: false });
const LazyXAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false });
const LazyYAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false });
const LazyTooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false });
const LazyResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });
const LazyReferenceLine = dynamic(() => import("recharts").then(m => m.ReferenceLine), { ssr: false });

export default function AnalysisClient() {
    const [laps, setLaps] = useState<OpenF1Lap[]>([]);
    const [drivers, setDrivers] = useState<OpenF1Driver[]>([]);
    const [pits, setPits] = useState<OpenF1Pit[]>([]);
    const [session, setSession] = useState<OpenF1Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [driverFilter, setDriverFilter] = useState<number | "all">("all");
    const [showChart, setShowChart] = useState(true);
    const [chartDrivers, setChartDrivers] = useState<Set<number>>(new Set());
    const [isVisible, setIsVisible] = useState(true);

    // Page Visibility API — pause polling when tab is hidden
    useEffect(() => {
        function handleVisibility() {
            setIsVisible(document.visibilityState === "visible");
        }
        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, []);

    useEffect(() => {
        let mounted = true;
        let interval: NodeJS.Timeout;

        async function loadAnalysis() {
            try {
                setError(null);
                const [lapsData, driversData, sessionData, pitData] = await Promise.all([
                    fetchLiveLaps(),
                    fetchLiveDrivers(),
                    fetchLiveSession(),
                    fetchPitStops(),
                ]);

                if (mounted) {
                    setLaps(lapsData.sort((a, b) => b.lap_number - a.lap_number));
                    setDrivers(driversData);
                    setSession(sessionData);
                    setPits(pitData);
                    setIsLoading(false);
                }
            } catch (err) {
                setError("Failed to load analysis data.");
                setIsLoading(false);
            }
        }

        loadAnalysis();
        interval = setInterval(() => {
            if (isVisible) loadAnalysis();
        }, 5000);

        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, [isVisible, retryCount]);

    const getDriverStr = (num: number) => {
        const d = drivers.find(drv => drv.driver_number === num);
        return d ? d.name_acronym : `#${num}`;
    };

    const getDriverFullName = (num: number) => {
        const d = drivers.find(drv => drv.driver_number === num);
        return d ? `${d.first_name} ${d.last_name}` : "";
    };

    const getTeamColor = (num: number) => {
        const d = drivers.find(drv => drv.driver_number === num);
        return d?.team_colour ? `#${d.team_colour}` : "#fff";
    };

    // Compute best sector times and fastest lap for color coding
    const { bestS1, bestS2, bestS3, fastestLap, driverBests } = useMemo(() => {
        const s1s = laps.filter(l => l.duration_sector_1 > 0).map(l => l.duration_sector_1);
        const s2s = laps.filter(l => l.duration_sector_2 > 0).map(l => l.duration_sector_2);
        const s3s = laps.filter(l => l.duration_sector_3 > 0).map(l => l.duration_sector_3);
        const lapTimes = laps.filter(l => l.lap_duration > 0).map(l => l.lap_duration);

        const bS1 = s1s.length > 0 ? Math.min(...s1s) : 0;
        const bS2 = s2s.length > 0 ? Math.min(...s2s) : 0;
        const bS3 = s3s.length > 0 ? Math.min(...s3s) : 0;
        const fLap = lapTimes.length > 0 ? Math.min(...lapTimes) : 0;

        // Per-driver bests
        const db: Record<number, { s1: number; s2: number; s3: number }> = {};
        for (const l of laps) {
            if (!db[l.driver_number]) db[l.driver_number] = { s1: Infinity, s2: Infinity, s3: Infinity };
            if (l.duration_sector_1 > 0 && l.duration_sector_1 < db[l.driver_number].s1) db[l.driver_number].s1 = l.duration_sector_1;
            if (l.duration_sector_2 > 0 && l.duration_sector_2 < db[l.driver_number].s2) db[l.driver_number].s2 = l.duration_sector_2;
            if (l.duration_sector_3 > 0 && l.duration_sector_3 < db[l.driver_number].s3) db[l.driver_number].s3 = l.duration_sector_3;
        }

        return { bestS1: bS1, bestS2: bS2, bestS3: bS3, fastestLap: fLap, driverBests: db };
    }, [laps]);

    const getSectorColor = (value: number, best: number, driverNum: number, sector: 's1' | 's2' | 's3') => {
        if (value <= 0) return "text-slate-600";
        if (value === best && best > 0) return "text-purple-400 bg-purple-500/10";
        const pb = driverBests[driverNum]?.[sector];
        if (pb && value === pb) return "text-green-400 bg-green-500/10";
        return "text-yellow-300 bg-yellow-500/5";
    };

    // Pit stop lookup
    const pitLookup = useMemo(() => {
        const map = new Set<string>();
        for (const p of pits) {
            map.add(`${p.driver_number}-${p.lap_number}`);
        }
        return map;
    }, [pits]);

    // Filter laps
    const filteredLaps = driverFilter === "all" ? laps : laps.filter(l => l.driver_number === driverFilter);

    // Unique drivers for filter dropdown
    const uniqueDrivers = useMemo(() => {
        const nums = Array.from(new Set(laps.map(l => l.driver_number)));
        return nums.map(n => ({
            number: n,
            acronym: getDriverStr(n),
            color: getTeamColor(n),
        })).sort((a, b) => a.acronym.localeCompare(b.acronym));
    }, [laps, drivers]);

    // Auto-select top 5 drivers for chart on first load
    useEffect(() => {
        if (chartDrivers.size === 0 && uniqueDrivers.length > 0) {
            setChartDrivers(new Set(uniqueDrivers.slice(0, 5).map(d => d.number)));
        }
    }, [uniqueDrivers]);

    // Build chart data: one data point per lap number, with lap_duration per driver
    const chartData = useMemo(() => {
        if (chartDrivers.size === 0) return [];
        const lapMap = new Map<number, any>();

        for (const lap of laps) {
            if (!chartDrivers.has(lap.driver_number) || !lap.lap_duration || lap.lap_duration <= 0) continue;
            if (!lapMap.has(lap.lap_number)) lapMap.set(lap.lap_number, { lap: lap.lap_number });
            lapMap.get(lap.lap_number)![`d${lap.driver_number}`] = lap.lap_duration;
        }

        return Array.from(lapMap.values()).sort((a, b) => a.lap - b.lap);
    }, [laps, chartDrivers]);

    // Pit stop laps for reference lines
    const pitLaps = useMemo(() => {
        const lapsSet = new Set<number>();
        for (const p of pits) {
            if (chartDrivers.has(p.driver_number)) lapsSet.add(p.lap_number);
        }
        return Array.from(lapsSet);
    }, [pits, chartDrivers]);

    const toggleChartDriver = (num: number) => {
        setChartDrivers(prev => {
            const next = new Set(prev);
            if (next.has(num)) next.delete(num);
            else next.add(num);
            return next;
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center font-display gap-6">
                <div className="relative flex h-8 w-8">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-8 w-8 bg-blue-500" />
                </div>
                <p className="text-white font-mono tracking-widest animate-pulse">ANALYZING TELEMETRY & LAPS...</p>
            </div>
        );
    }

    if (error) return <ErrorState icon="wifi_off" message={error} onRetry={() => { setError(null); setIsLoading(true); setRetryCount(c => c + 1); }} />;

    return (
        <PageTransition>
        <div className="font-display pb-12">
            <div className="max-w-[1600px] mx-auto w-full px-4 md:px-8">

                <PageHeader variant="panel" title="RACE ANALYSIS" />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <p className="text-slate-400 font-mono tracking-wider uppercase text-sm">
                        {session?.session_name || "UNKNOWN SESSION"} • {session?.circuit_short_name || "CIRCUIT"}
                    </p>

                    {/* Driver Filter */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest font-f1">Filter:</span>
                        <select
                            value={driverFilter === "all" ? "all" : driverFilter}
                            onChange={e => setDriverFilter(e.target.value === "all" ? "all" : parseInt(e.target.value))}
                            aria-label="Filter by driver"
                            className="px-4 py-2 bg-black/60 border border-white/10 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500/50 cursor-pointer backdrop-blur-md appearance-none min-w-[180px]"
                        >
                            <option value="all">All Drivers ({laps.length} laps)</option>
                            {uniqueDrivers.map(d => (
                                <option key={d.number} value={d.number}>{d.acronym} — #{d.number}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Lap Time Chart */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-black text-white font-f1 uppercase tracking-tight flex items-center gap-3">
                            <span className="material-symbols-outlined text-[#00D2BE]">show_chart</span>
                            Lap Time Chart
                        </h2>
                        <button onClick={() => setShowChart(!showChart)} className="text-xs font-mono text-slate-500 hover:text-white transition-colors uppercase tracking-widest">
                            {showChart ? "HIDE" : "SHOW"}
                        </button>
                    </div>

                    {showChart && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass rounded-xl border border-white/10 p-6 bg-black/60">
                            {/* Driver Selector */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {uniqueDrivers.map(d => (
                                    <button
                                        key={d.number}
                                        onClick={() => toggleChartDriver(d.number)}
                                        className={`px-3 py-1 rounded-full text-xs font-bold font-f1 uppercase tracking-wider transition-all border ${chartDrivers.has(d.number) ? "text-white border-transparent" : "text-slate-500 border-white/10 hover:border-white/30"}`}
                                        style={chartDrivers.has(d.number) ? { backgroundColor: d.color, borderColor: d.color } : {}}
                                    >
                                        {d.acronym}
                                    </button>
                                ))}
                            </div>

                            {/* Chart */}
                            {chartData.length > 0 ? (
                                <div className="w-full h-[350px]">
                                    <LazyResponsiveContainer width="100%" height="100%">
                                        <LazyLineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                                            <LazyXAxis dataKey="lap" stroke="#333" tick={{ fill: "#555", fontSize: 10 }} label={{ value: "Lap", position: "insideBottomRight", offset: -5, fill: "#555" }} />
                                            <LazyYAxis stroke="#333" tick={{ fill: "#555", fontSize: 10 }} domain={['auto', 'auto']} tickFormatter={(v: number) => v.toFixed(1)} label={{ value: "Time (s)", angle: -90, position: "insideLeft", fill: "#555" }} />
                                            <LazyTooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #333", borderRadius: 8, fontSize: 12 }} labelFormatter={(l: any) => `Lap ${l}`} formatter={(v: any) => [formatLapTime(Number(v)), ""]} />
                                            {pitLaps.map(lap => (
                                                <LazyReferenceLine key={`pit-${lap}`} x={lap} stroke="#e10600" strokeDasharray="3 3" strokeOpacity={0.4} />
                                            ))}
                                            {Array.from(chartDrivers).map(dNum => {
                                                const d = uniqueDrivers.find(u => u.number === dNum);
                                                return (
                                                    <LazyLine
                                                        key={dNum}
                                                        type="monotone"
                                                        dataKey={`d${dNum}`}
                                                        stroke={d?.color || "#fff"}
                                                        dot={false}
                                                        strokeWidth={1.5}
                                                        name={d?.acronym || `#${dNum}`}
                                                        connectNulls
                                                    />
                                                );
                                            })}
                                        </LazyLineChart>
                                    </LazyResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-[200px] flex items-center justify-center text-slate-600 font-mono text-sm uppercase">
                                    Select drivers above to view lap time chart
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>

                {/* Sector Legend */}
                <div className="flex gap-6 mb-4 px-2 text-xs font-mono text-slate-500 uppercase">
                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-purple-500" /> Overall Best</span>
                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-green-500" /> Personal Best</span>
                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-yellow-500" /> Normal</span>
                    <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm text-primary">local_gas_station</span> Pit Stop</span>
                </div>

                <div className="glass rounded-xl border border-white/10 overflow-hidden shadow-2xl bg-black/60">
                    <div className="p-4 bg-black/80 border-b border-primary/40 font-f1 text-[11px] uppercase tracking-widest text-slate-400 flex justify-between">
                        <span>LIVE LAP FEED (NEWEST FIRST)</span>
                        <span>{filteredLaps.length} LAPS {driverFilter !== "all" ? `FOR ${getDriverStr(driverFilter)}` : "RECORDED"}</span>
                    </div>
                    <div className="max-h-[800px] overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-black/90 z-10 font-f1 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="p-4 border-b border-white/10">DRIVER</th>
                                    <th className="p-4 border-b border-white/10 text-center">LAP</th>
                                    <th className="p-4 border-b border-white/10 text-center">S1</th>
                                    <th className="p-4 border-b border-white/10 text-center">S2</th>
                                    <th className="p-4 border-b border-white/10 text-center">S3</th>
                                    <th className="p-4 border-b border-white/10 text-center text-white">LAP TIME</th>
                                    <th className="p-4 border-b border-white/10 text-center text-blue-400">SPEED</th>
                                    <th className="p-4 border-b border-white/10 text-center w-12">PIT</th>
                                </tr>
                            </thead>
                            <tbody className="font-mono text-sm">
                                {filteredLaps.slice(0, 500).map((lap, i) => {
                                    const isFastest = lap.lap_duration === fastestLap && fastestLap > 0;
                                    const isPit = pitLookup.has(`${lap.driver_number}-${lap.lap_number}`);
                                    return (
                                        <tr key={`${lap.driver_number}-${lap.lap_number}-${i}`} className={`border-b border-white/5 hover:bg-white/10 transition-colors ${isFastest ? 'bg-purple-500/5' : ''}`}>
                                            <td className="p-4 flex items-center gap-3">
                                                <div className="w-1 h-6 rounded-full" style={{ backgroundColor: getTeamColor(lap.driver_number) }} />
                                                <span className="font-bold text-white uppercase">{getDriverStr(lap.driver_number)}</span>
                                                <span className="text-xs text-slate-600 hidden lg:inline">{getDriverFullName(lap.driver_number)}</span>
                                            </td>
                                            <td className="p-4 text-center font-bold text-slate-300">L{lap.lap_number}</td>
                                            <td className={`p-4 text-center font-medium tracking-wider ${getSectorColor(lap.duration_sector_1, bestS1, lap.driver_number, 's1')}`}>{formatLapTime(lap.duration_sector_1)}</td>
                                            <td className={`p-4 text-center font-medium tracking-wider ${getSectorColor(lap.duration_sector_2, bestS2, lap.driver_number, 's2')}`}>{formatLapTime(lap.duration_sector_2)}</td>
                                            <td className={`p-4 text-center font-medium tracking-wider ${getSectorColor(lap.duration_sector_3, bestS3, lap.driver_number, 's3')}`}>{formatLapTime(lap.duration_sector_3)}</td>
                                            <td className={`p-4 text-center font-bold bg-white/5 tracking-wider ${isFastest ? 'text-purple-400' : 'text-white'}`}>
                                                {formatLapTime(lap.lap_duration)}
                                                {isFastest && <span className="ml-1 text-[9px] text-purple-500 font-f1">FL</span>}
                                            </td>
                                            <td className="p-4 text-center text-blue-400 font-medium">{lap.st_speed ? `${lap.st_speed}` : "--"}</td>
                                            <td className="p-4 text-center">
                                                {isPit && <span className="material-symbols-outlined text-primary text-sm" title="Pit Stop">local_gas_station</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        </PageTransition>
    );
}
