"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { fetchLiveTimingData, fetchRaceControl, fetchWeather, fetchTeamRadio, fetchPitStops, fetchStints, isSessionActive } from "@/lib/api/openf1";
import type { OpenF1Session, OpenF1RaceControl, OpenF1Weather, OpenF1TeamRadio, OpenF1Pit, OpenF1Stint, LiveTimingRow } from "@/lib/api/openf1";
import { PageHeader } from "@/components/ui/page-header";
import { formatLapTime } from "@/lib/utils";
import { ErrorState } from "@/components/ui/error-state";
import { PageTransition } from "@/components/ui/page-transition";

const LazyTrackMap = dynamic(() => import("@/components/f1/live-track-map"), { ssr: false });

const TYRE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    SOFT: { bg: "bg-red-500", text: "text-red-400", label: "S" },
    MEDIUM: { bg: "bg-yellow-500", text: "text-yellow-400", label: "M" },
    HARD: { bg: "bg-white", text: "text-white", label: "H" },
    INTERMEDIATE: { bg: "bg-green-500", text: "text-green-400", label: "I" },
    WET: { bg: "bg-blue-500", text: "text-blue-400", label: "W" },
};

const TYRE_BAR_COLORS: Record<string, string> = {
    SOFT: "#EF4444",
    MEDIUM: "#EAB308",
    HARD: "#E5E7EB",
    INTERMEDIATE: "#22C55E",
    WET: "#3B82F6",
};

const SECTOR_COLORS: Record<string, string> = {
    purple: "text-purple-400 bg-purple-500/10",
    green: "text-green-400 bg-green-500/10",
    yellow: "text-yellow-300 bg-yellow-500/10",
};

const POLL_RATE_LIVE = 4000;  // 4s is still real-time enough; halves bandwidth vs 2s
const POLL_RATE_IDLE = 60000;

function getTrackStatusFromRC(messages: OpenF1RaceControl[]): { label: string; color: string; bg: string; icon: string; pulse: boolean } {
    if (messages.length === 0) return { label: "TRACK CLEAR", color: "text-green-500", bg: "bg-green-500/15 border-green-500/30", icon: "check_circle", pulse: false };
    const last = messages[messages.length - 1];
    if (last.flag === "RED") return { label: "RED FLAG", color: "text-red-500", bg: "bg-red-500/20 border-red-500/40", icon: "warning", pulse: true };
    if (last.flag === "YELLOW" || last.category === "SafetyCar") return { label: "CAUTION", color: "text-yellow-500", bg: "bg-yellow-500/15 border-yellow-500/30", icon: "report", pulse: true };
    if (last.flag === "GREEN") return { label: "TRACK CLEAR", color: "text-green-500", bg: "bg-green-500/15 border-green-500/30", icon: "check_circle", pulse: false };
    if (last.category === "Flag" && last.flag === "CHEQUERED") return { label: "CHEQUERED", color: "text-white", bg: "bg-white/10 border-white/20", icon: "sports_score", pulse: false };
    return { label: "TRACK CLEAR", color: "text-green-500", bg: "bg-green-500/15 border-green-500/30", icon: "check_circle", pulse: false };
}

export default function LiveClient() {
    const [timingData, setTimingData] = useState<LiveTimingRow[]>([]);
    const [sessionData, setSessionData] = useState<OpenF1Session | null>(null);
    const [raceControl, setRaceControl] = useState<OpenF1RaceControl[]>([]);
    const [weather, setWeather] = useState<OpenF1Weather | null>(null);
    const [teamRadio, setTeamRadio] = useState<OpenF1TeamRadio[]>([]);
    const [pitStops, setPitStops] = useState<OpenF1Pit[]>([]);
    const [stints, setStints] = useState<OpenF1Stint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(true);
    const pollCycleRef = useRef(0);
    const radioEndRef = useRef<HTMLDivElement>(null);

    const sessionActive = useMemo(() => isSessionActive(sessionData), [sessionData]);
    const pollRate = sessionActive ? POLL_RATE_LIVE : POLL_RATE_IDLE;

    // Page Visibility API — pause polling when tab is hidden
    useEffect(() => {
        const handleVisibility = () => setIsVisible(!document.hidden);
        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, []);

    const loadLiveTiming = useCallback(async () => {
        setError(null);
        const cycle = pollCycleRef.current++;
        // Fetch secondary data (radio, pits, stints) every 3rd cycle to reduce bandwidth
        const fetchSecondary = cycle % 3 === 0;
        try {
            const [timing, rc, wx] = await Promise.all([
                fetchLiveTimingData(),
                fetchRaceControl(),
                fetchWeather(),
            ]);

            setSessionData(timing.session);
            setTimingData(timing.grid);
            setRaceControl(rc.slice(-10));
            setWeather(wx);

            if (fetchSecondary) {
                const [radio, pits, stintData] = await Promise.all([
                    fetchTeamRadio(),
                    fetchPitStops(),
                    fetchStints(),
                ]);
                setTeamRadio(radio.slice(-20));
                setPitStops(pits);
                setStints(stintData);
            }

            setIsLoading(false);
        } catch (err) {
            setError("Failed to connect to live timing. Retrying...");
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadLiveTiming();

        const interval = setInterval(() => {
            if (isVisible) loadLiveTiming();
        }, pollRate);

        return () => clearInterval(interval);
    }, [isVisible, pollRate, loadLiveTiming]);

    // Auto-scroll team radio
    useEffect(() => {
        radioEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [teamRadio.length]);

    const trackStatus = getTrackStatusFromRC(raceControl);

    // Compute pit stop stats
    const sortedPits = useMemo(() => [...pitStops].sort((a, b) => a.lap_number - b.lap_number), [pitStops]);
    const fastestPit = useMemo(() => {
        if (sortedPits.length === 0) return Infinity;
        let min = Infinity;
        for (const p of sortedPits) if (p.pit_duration > 0 && p.pit_duration < min) min = p.pit_duration;
        return min;
    }, [sortedPits]);
    const slowestPit = useMemo(() => {
        let max = 0;
        for (const p of sortedPits) if (p.pit_duration > max) max = p.pit_duration;
        return max;
    }, [sortedPits]);

    // Build tyre strategy per driver (sorted by position)
    const tyreStrategy = useMemo(() => {
        if (stints.length === 0 || timingData.length === 0) return [];
        const maxLap = Math.max(...stints.map(s => s.lap_end || 0), 1);
        return timingData.map(driver => {
            const driverStints = stints
                .filter(s => s.driver_number === driver.driverNumber)
                .sort((a, b) => a.stint_number - b.stint_number);
            return { driver, stints: driverStints, maxLap };
        });
    }, [stints, timingData]);

    // Find driver info for pit stops
    const getDriverStr = useCallback((driverNumber: number) => {
        const d = timingData.find(t => t.driverNumber === driverNumber);
        return d ? { name: d.driverStr, color: d.color } : { name: `#${driverNumber}`, color: '#666' };
    }, [timingData]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center font-display gap-6">
                <div className="relative flex h-8 w-8">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-8 w-8 bg-primary" />
                </div>
                <p className="text-white font-mono tracking-widest animate-pulse">CONNECTING TO FIA TIMING SERVERS...</p>
            </div>
        );
    }

    if (error) return <ErrorState icon="wifi_off" message={error} onRetry={() => { setError(null); loadLiveTiming(); }} />;

    return (
        <PageTransition>
        <div className="font-display pb-12 relative overflow-hidden">
            {/* Cinematic Background */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] pointer-events-none -translate-y-1/2" />

            <div className="max-w-[1800px] mx-auto w-full px-4 md:px-8 relative z-10 flex flex-col h-full">

                {/* Header Control Panel */}
                <PageHeader variant="panel" title="LIVE TIMING PIT WALL" />

                {/* Session Status Banner */}
                {!sessionActive && timingData.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 flex items-center gap-3 px-4 py-3 glass rounded-xl border border-yellow-500/20 bg-yellow-500/5">
                        <span className="material-symbols-outlined text-yellow-500">info</span>
                        <span className="text-sm text-yellow-400 font-mono uppercase tracking-wider">
                            Session Ended — Showing final classification from {sessionData?.session_name || "last session"}
                        </span>
                        <span className="text-xs text-slate-500 ml-auto font-mono">Checking for new session every 60s</span>
                    </motion.div>
                )}

                {!sessionActive && timingData.length === 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-24 gap-8">
                        <div className="relative">
                            <span className="material-symbols-outlined text-7xl text-slate-700">timer_off</span>
                            <div className="absolute inset-0 animate-ping opacity-20">
                                <span className="material-symbols-outlined text-7xl text-primary">timer_off</span>
                            </div>
                        </div>
                        <div className="text-center">
                            <h2 className="text-3xl font-f1 font-black uppercase tracking-tight text-white mb-2">No Active Session</h2>
                            <p className="text-slate-400 font-mono text-sm uppercase tracking-wider">Waiting for next session to begin...</p>
                            <p className="text-slate-500 text-xs mt-2 font-mono">Auto-checking every 60 seconds</p>
                        </div>
                        <div className="glass rounded-xl border border-white/10 p-6 max-w-md w-full text-center">
                            <span className="text-xs text-slate-500 uppercase tracking-widest font-f1 font-bold">Last Session</span>
                            <p className="text-white font-bold text-lg mt-1 font-f1">{sessionData?.session_name || "Unknown"} — {sessionData?.circuit_short_name || "Circuit"}</p>
                            <p className="text-slate-400 text-sm mt-1">{sessionData?.country_name || ""}</p>
                        </div>
                    </motion.div>
                )}

                {/* Main content: only show when we have timing data */}
                {timingData.length > 0 && (
                    <>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
                            <p className="text-slate-400 font-mono tracking-wider uppercase text-sm">{sessionData?.session_name || "UNKNOWN SESSION"} • {sessionData?.circuit_short_name || "CIRCUIT"} • {sessionData?.country_name || "GLOBAL"}</p>
                            <div className="flex gap-4 flex-wrap">
                                {weather && (
                                    <div className="flex flex-col items-end px-4 py-2 bg-black/50 border border-white/5 rounded">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-f1">Weather</span>
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm text-blue-400">{weather.rainfall > 0 ? 'rainy' : 'sunny'}</span>
                                            <span className="text-white font-bold font-mono text-sm">{weather.air_temperature}°C</span>
                                            <span className="text-slate-500 font-mono text-xs">Track {weather.track_temperature}°C</span>
                                        </div>
                                    </div>
                                )}
                                <div className={`flex flex-col items-end px-4 py-2 rounded border ${trackStatus.bg} backdrop-blur-sm`}>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-f1">Track Status</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`material-symbols-outlined text-lg ${trackStatus.color} ${trackStatus.pulse ? 'animate-pulse' : ''}`} style={trackStatus.pulse ? { filter: 'drop-shadow(0 0 6px currentColor)' } : undefined}>{trackStatus.icon}</span>
                                        <span className={`${trackStatus.color} font-bold font-mono tracking-widest text-lg ${trackStatus.pulse ? 'animate-pulse' : ''}`} style={{ textShadow: trackStatus.pulse ? '0 0 12px currentColor' : undefined }}>{trackStatus.label}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end px-4 py-2 bg-black/50 border border-white/5 rounded">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-f1">Polling</span>
                                    <span className="text-white font-bold font-mono tracking-widest text-sm flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${sessionActive ? 'bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse' : 'bg-yellow-500'}`} />
                                        {sessionActive ? '4s LIVE' : '60s IDLE'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Race Control Messages Banner */}
                        {raceControl.length > 0 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 glass rounded-xl border border-white/10 p-4 overflow-hidden">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="material-symbols-outlined text-primary text-lg">flag</span>
                                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400 font-f1">Race Control</span>
                                </div>
                                <div className="flex flex-col gap-1 max-h-24 overflow-y-auto hide-scrollbar">
                                    {raceControl.slice(-5).reverse().map((msg, i) => (
                                        <div key={i} className="flex items-center gap-3 text-xs font-mono">
                                            <span className="text-slate-600 w-8">L{msg.lap_number || "-"}</span>
                                            <span className={`font-bold ${msg.flag === "RED" ? "text-red-500" : msg.flag === "YELLOW" ? "text-yellow-500" : "text-slate-300"}`}>{msg.message}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Main Content: Timing Tower + Track Map */}
                        <div className="flex gap-6 flex-col xl:flex-row">
                            {/* Timing Tower */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`glass rounded-xl border border-white/10 overflow-x-auto shadow-2xl bg-black/60 relative flex-1 min-w-0 ${!sessionActive ? 'opacity-80' : ''}`}>
                            <table className="w-full text-left border-collapse min-w-[1400px]">
                                <thead>
                                    <tr className="border-b-2 border-primary/40 bg-black/80 font-f1 text-[11px] uppercase tracking-widest text-slate-400">
                                        <th className="p-4 w-12 text-center border-r border-white/5">POS</th>
                                        <th className="p-4 w-16 text-center border-r border-white/5">NO</th>
                                        <th className="p-4 border-r border-white/5">DRIVER</th>
                                        <th className="p-4 w-16 text-center border-r border-white/5">TYRE</th>
                                        <th className="p-4 w-32 text-right border-r border-white/5">GAP</th>
                                        <th className="p-4 w-32 text-right border-r border-white/5">INT</th>
                                        <th className="p-4 w-32 text-center border-r border-white/5">S1</th>
                                        <th className="p-4 w-32 text-center border-r border-white/5">S2</th>
                                        <th className="p-4 w-32 text-center border-r border-white/5">S3</th>
                                        <th className="p-4 w-36 text-center bg-white/5">LAST LAP</th>
                                        <th className="p-4 w-16 text-center">LAPS</th>
                                        <th className="p-4 w-20 text-center">PIT</th>
                                    </tr>
                                </thead>
                                <tbody className="font-mono text-sm">
                                    {timingData.length > 0 ? timingData.map((row) => {
                                        const tyre = row.compound ? TYRE_COLORS[row.compound.toUpperCase()] || null : null;
                                        const isFastest = row.hasFastestLap;
                                        return (
                                            <motion.tr
                                                key={row.driverNumber}
                                                layout
                                                className="border-b border-white/5 transition-colors group"
                                                style={{
                                                    borderLeft: `3px solid ${row.color || '#555'}`,
                                                    background: isFastest
                                                        ? `linear-gradient(90deg, rgba(168,85,247,0.12), transparent 40%)`
                                                        : `linear-gradient(90deg, ${row.color}12, transparent 15%)`,
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.background = isFastest
                                                        ? `linear-gradient(90deg, rgba(168,85,247,0.22), transparent 45%)`
                                                        : `linear-gradient(90deg, ${row.color}28, transparent 20%)`;
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.background = isFastest
                                                        ? `linear-gradient(90deg, rgba(168,85,247,0.12), transparent 40%)`
                                                        : `linear-gradient(90deg, ${row.color}12, transparent 15%)`;
                                                }}
                                            >
                                                <td className="p-4 text-center text-slate-300 font-bold border-r border-white/5 group-hover:text-white transition-colors">{row.position}</td>
                                                <td className="p-4 text-center font-bold text-white border-r border-white/5 font-f1 text-lg">{row.driverNumber}</td>
                                                <td className="p-4 border-r border-white/5 flex items-center gap-3">
                                                    <span className="font-bold text-white uppercase tracking-wider">{row.driverStr}</span>
                                                    <span className="text-xs text-slate-500 uppercase tracking-wide hidden lg:inline">{row.firstName} {row.lastName}</span>
                                                </td>
                                                <td className="p-4 text-center border-r border-white/5">
                                                    {tyre ? (
                                                        <div className="flex items-center justify-center gap-1">
                                                            <span className={`w-5 h-5 rounded-full ${tyre.bg} flex items-center justify-center text-[9px] font-black text-black`}>{tyre.label}</span>
                                                            {row.tyreAge !== null && <span className="text-[10px] text-slate-500">{row.tyreAge}L</span>}
                                                        </div>
                                                    ) : <span className="text-slate-600">-</span>}
                                                </td>
                                                <td className="p-4 text-right text-slate-300 border-r border-white/5 font-bold group-hover:text-primary transition-colors">{row.gapToLeader}</td>
                                                <td className="p-4 text-right text-slate-400 border-r border-white/5">{row.interval}</td>
                                                <td className={`p-4 text-center border-r border-white/5 font-medium tracking-wider ${SECTOR_COLORS[row.s1Color] || 'text-yellow-300'}`} style={row.s1Color === 'purple' ? { textShadow: '0 0 8px #A855F7, 0 0 16px #A855F780', fontSize: '0.9rem' } : undefined}>{typeof row.sector1 === 'number' ? formatLapTime(row.sector1) : row.sector1}</td>
                                                <td className={`p-4 text-center border-r border-white/5 font-medium tracking-wider ${SECTOR_COLORS[row.s2Color] || 'text-yellow-300'}`} style={row.s2Color === 'purple' ? { textShadow: '0 0 8px #A855F7, 0 0 16px #A855F780', fontSize: '0.9rem' } : undefined}>{typeof row.sector2 === 'number' ? formatLapTime(row.sector2) : row.sector2}</td>
                                                <td className={`p-4 text-center border-r border-white/5 font-medium tracking-wider ${SECTOR_COLORS[row.s3Color] || 'text-yellow-300'}`} style={row.s3Color === 'purple' ? { textShadow: '0 0 8px #A855F7, 0 0 16px #A855F780', fontSize: '0.9rem' } : undefined}>{typeof row.sector3 === 'number' ? formatLapTime(row.sector3) : row.sector3}</td>
                                                <td className={`p-4 text-center font-bold bg-white/5 shadow-[inset_2px_0_0_rgba(255,255,255,0.1)] group-hover:bg-primary/20 tracking-wider ${isFastest ? 'text-purple-400' : 'text-white'}`}>
                                                    {typeof row.latestLapTime === 'number' ? formatLapTime(row.latestLapTime) : row.latestLapTime}
                                                    {isFastest && <span className="ml-1 text-[9px] text-purple-400 font-f1 font-bold" style={{ textShadow: '0 0 10px #A855F7, 0 0 20px #A855F7' }}>FL</span>}
                                                </td>
                                                <td className="p-4 text-center text-slate-400">{row.lapsCompleted}</td>
                                                <td className="p-4 text-center text-[10px]">
                                                    {row.isPitOut ? <span className="px-2 py-1 bg-primary text-white font-bold rounded shadow-[0_0_5px_rgba(225,6,0,0.8)] font-f1 animate-pulse">OUT</span> : <span className="text-slate-600">-</span>}
                                                </td>
                                            </motion.tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={12} className="p-12 text-center text-slate-500 uppercase tracking-widest font-f1">
                                                <div className="flex flex-col items-center gap-4">
                                                    <span className="material-symbols-outlined text-4xl text-slate-700 animate-spin">sync</span>
                                                    Waiting for live timing broadcast...
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </motion.div>

                            {/* Live Track Map Sidebar */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="glass rounded-xl border border-white/10 p-4 xl:w-[380px] shrink-0 bg-black/60"
                            >
                                <LazyTrackMap isVisible={isVisible && sessionActive} />
                            </motion.div>
                        </div>

                        {/* ===== BOTTOM PANELS: Team Radio, Pit Stops, Tyre Strategy ===== */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

                            {/* Team Radio Feed */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-xl border border-white/10 bg-black/60 overflow-hidden">
                                <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-black/80">
                                    <span className="material-symbols-outlined text-primary text-lg">radio</span>
                                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400 font-f1">Team Radio</span>
                                    <span className="ml-auto text-[10px] font-mono text-slate-600">{teamRadio.length} messages</span>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto hide-scrollbar p-3 flex flex-col gap-2">
                                    {teamRadio.length > 0 ? teamRadio.slice(-10).map((msg, i) => {
                                        const driver = getDriverStr(msg.driver_number);
                                        const time = new Date(msg.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' });
                                        return (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex items-center gap-3 text-xs font-mono p-2 rounded-lg bg-white/[0.02] hover:bg-white/5 transition-colors group"
                                            >
                                                <span className="font-f1 font-bold text-sm w-10 text-center" style={{ color: driver.color }}>{driver.name}</span>
                                                <span className="text-slate-600 flex-shrink-0">{time}</span>
                                                <a
                                                    href={msg.recording_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="ml-auto flex items-center gap-1 text-primary/60 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <span className="material-symbols-outlined text-base">play_circle</span>
                                                </a>
                                            </motion.div>
                                        );
                                    }) : (
                                        <div className="py-8 text-center text-slate-600 text-xs uppercase tracking-widest">No team radio yet</div>
                                    )}
                                    <div ref={radioEndRef} />
                                </div>
                            </motion.div>

                            {/* Pit Stop Log */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass rounded-xl border border-white/10 bg-black/60 overflow-hidden">
                                <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-black/80">
                                    <span className="material-symbols-outlined text-yellow-500 text-lg">build</span>
                                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400 font-f1">Pit Stops</span>
                                    <span className="ml-auto text-[10px] font-mono text-slate-600">{sortedPits.length} stops</span>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto hide-scrollbar">
                                    {sortedPits.length > 0 ? sortedPits.map((pit, i) => {
                                        const driver = getDriverStr(pit.driver_number);
                                        const isFastest = pit.pit_duration === fastestPit && pit.pit_duration > 0;
                                        const isSlowest = pit.pit_duration === slowestPit && sortedPits.length > 1;
                                        return (
                                            <div
                                                key={i}
                                                className={`flex items-center gap-3 text-xs font-mono px-4 py-2.5 border-b border-white/5 ${isFastest ? 'bg-green-500/5' : isSlowest ? 'bg-red-500/5' : ''}`}
                                            >
                                                <span className="text-slate-600 w-8">L{pit.lap_number}</span>
                                                <span className="font-f1 font-bold text-sm w-10 text-center" style={{ color: driver.color }}>{driver.name}</span>
                                                <span className={`ml-auto font-bold ${isFastest ? 'text-green-400' : isSlowest ? 'text-red-400' : 'text-white'}`}>
                                                    {pit.pit_duration > 0 ? `${pit.pit_duration.toFixed(1)}s` : '-'}
                                                </span>
                                                {isFastest && <span className="text-[9px] text-green-400 font-f1">FAST</span>}
                                                {isSlowest && <span className="text-[9px] text-red-400 font-f1">SLOW</span>}
                                            </div>
                                        );
                                    }) : (
                                        <div className="py-8 text-center text-slate-600 text-xs uppercase tracking-widest">No pit stops yet</div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Tyre Strategy Visualization */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass rounded-xl border border-white/10 bg-black/60 overflow-hidden">
                                <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-black/80">
                                    <span className="material-symbols-outlined text-red-400 text-lg animate-tyre-spin">circle</span>
                                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400 font-f1">Tyre Strategy</span>
                                    <div className="ml-auto flex gap-2">
                                        {Object.entries(TYRE_BAR_COLORS).slice(0, 3).map(([compound, color]) => (
                                            <div key={compound} className="flex items-center gap-1">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                                <span className="text-[9px] text-slate-500 font-f1">{compound[0]}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto hide-scrollbar p-3 flex flex-col gap-1.5">
                                    {tyreStrategy.length > 0 ? tyreStrategy.map(({ driver, stints: dStints, maxLap }) => (
                                        <div key={driver.driverNumber} className="flex items-center gap-2">
                                            <span className="font-f1 font-bold text-[10px] w-8 text-center shrink-0" style={{ color: driver.color }}>{driver.driverStr}</span>
                                            <div className="flex-1 flex h-4 rounded-sm overflow-hidden bg-white/5">
                                                {dStints.map((stint, si) => {
                                                    const width = ((stint.lap_end - stint.lap_start + 1) / maxLap) * 100;
                                                    const color = TYRE_BAR_COLORS[stint.compound?.toUpperCase()] || '#666';
                                                    return (
                                                        <div
                                                            key={si}
                                                            className="h-full flex items-center justify-center text-[7px] font-bold text-black/80 font-f1 border-r border-black/20 last:border-r-0"
                                                            style={{ width: `${Math.max(width, 3)}%`, backgroundColor: color }}
                                                            title={`${stint.compound} - Laps ${stint.lap_start}-${stint.lap_end}`}
                                                        >
                                                            {width > 8 && stint.compound?.[0]}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-8 text-center text-slate-600 text-xs uppercase tracking-widest">No stint data yet</div>
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        <div className="mt-4 flex justify-between items-center text-xs font-mono text-slate-500 px-2 uppercase tracking-widest">
                            <span>{timingData.length} Drivers on track</span>
                            <span className="flex items-center gap-2">
                                {!isVisible && <span className="text-yellow-500">(PAUSED - TAB HIDDEN)</span>}
                                Data sourced directly from FIA Timing Correlators via OpenF1
                            </span>
                        </div>
                    </>
                )}

            </div>
        </div>
        </PageTransition>
    );
}
