"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrentSchedule, getSeasonSchedule, getRaceResults, getQualifyingResults, getSprintResults, getSeasons } from "@/lib/api/f1-client";
import { PageHeader } from "@/components/ui/page-header";
import { getTeamColor, getNationalityFlag, formatLapTime } from "@/lib/utils";
import { ErrorState } from "@/components/ui/error-state";
import { PageTransition } from "@/components/ui/page-transition";

type ResultTab = "race" | "qualifying" | "sprint";

export default function ResultsClient() {
    const [schedule, setSchedule] = useState<any[]>([]);
    const [results, setResults] = useState<any>(null);
    const [seasons, setSeasons] = useState<string[]>([]);
    const [selectedSeason, setSelectedSeason] = useState("current");
    const [selectedRound, setSelectedRound] = useState("");
    const [tab, setTab] = useState<ResultTab>("race");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [isLoadingResults, setIsLoadingResults] = useState(false);
    const [hasSprint, setHasSprint] = useState(false);

    // Load schedule + seasons on mount
    useEffect(() => {
        async function init() {
            try {
                setError(null);
                const [sched, szns] = await Promise.all([getCurrentSchedule(), getSeasons()]);
                setSchedule(sched);
                setSeasons(szns);

                // Select the most recent completed round
                const now = new Date();
                const lastCompleted = [...sched].reverse().find((r: any) => new Date(r.date + "T" + (r.time || "00:00:00Z")) < now);
                if (lastCompleted) {
                    setSelectedRound(lastCompleted.round);
                    setHasSprint(!!lastCompleted.Sprint);
                }
            } catch (err) {
                setError("Failed to load results.");
            } finally {
                setIsLoading(false);
            }
        }
        init();
    }, [retryCount]);

    // Reload schedule when season changes
    useEffect(() => {
        if (selectedSeason === "current") return; // Already loaded
        async function loadSeason() {
            try {
                const sched = await getSeasonSchedule(selectedSeason);
                setSchedule(sched);
                // Select last round of selected season
                if (sched.length > 0) {
                    setSelectedRound(sched[sched.length - 1].round);
                }
            } catch (err) {
            }
        }
        loadSeason();
    }, [selectedSeason]);

    // Load results when round/tab changes
    useEffect(() => {
        if (!selectedRound) return;

        async function loadResults() {
            setIsLoadingResults(true);
            try {
                let data;
                const season = selectedSeason === "current" ? "current" : selectedSeason;
                if (tab === "race") {
                    data = await getRaceResults(season, selectedRound);
                } else if (tab === "qualifying") {
                    data = await getQualifyingResults(season, selectedRound);
                } else {
                    data = await getSprintResults(season, selectedRound);
                }
                setResults(data?.[0] || null);
            } catch (err) {
                setResults(null);
            } finally {
                setIsLoadingResults(false);
            }
        }
        loadResults();
    }, [selectedRound, tab, selectedSeason]);

    // When round changes, update hasSprint
    useEffect(() => {
        const race = schedule.find((r: any) => r.round === selectedRound);
        setHasSprint(!!race?.Sprint);
    }, [selectedRound, schedule]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center font-display gap-6">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
                <p className="text-white font-mono tracking-widest animate-pulse">LOADING RESULTS...</p>
            </div>
        );
    }

    if (error) return <ErrorState icon="wifi_off" message={error} onRetry={() => { setError(null); setIsLoading(true); setRetryCount(c => c + 1); }} />;

    const raceInfo = schedule.find((r: any) => r.round === selectedRound);

    return (
        <PageTransition>
        <div className="font-display pb-12 relative overflow-hidden">
            <div className="absolute top-0 right-[10%] w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] pointer-events-none -translate-y-1/2" />

            <div className="max-w-[1400px] mx-auto w-full px-4 md:px-8 relative z-10">
                {/* Header */}
                <PageHeader title="RACE" subtitle="RESULTS" />

                {/* Selectors */}
                <div className="flex flex-wrap gap-4 mb-8">
                    <select
                        value={selectedSeason}
                        onChange={e => { setSelectedSeason(e.target.value); setSelectedRound(""); setResults(null); }}
                        aria-label="Select season"
                        className="px-4 py-3 bg-black/60 border border-white/10 rounded-xl text-white font-f1 text-sm uppercase tracking-widest focus:outline-none focus:border-primary/50 cursor-pointer backdrop-blur-md appearance-none"
                    >
                        <option value="current">Current Season</option>
                        {seasons.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <select
                        value={selectedRound}
                        onChange={e => setSelectedRound(e.target.value)}
                        aria-label="Select round"
                        className="px-4 py-3 bg-black/60 border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-primary/50 cursor-pointer backdrop-blur-md appearance-none min-w-[280px]"
                    >
                        <option value="">Select Round</option>
                        {schedule.map((r: any) => (
                            <option key={r.round} value={r.round}>R{r.round} — {r.raceName}</option>
                        ))}
                    </select>

                    {/* Result Type Tabs */}
                    <div className="flex bg-[#111]/80 backdrop-blur-md p-1 rounded-xl border border-white/10 ml-auto" role="tablist">
                        {(["race", "qualifying", ...(hasSprint ? ["sprint"] : [])] as ResultTab[]).map(t => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                role="tab"
                                aria-selected={tab === t}
                                className={`px-5 py-2 rounded-lg font-bold uppercase tracking-widest text-xs transition-all font-f1 ${tab === t ? "bg-primary text-white shadow-[0_0_15px_rgba(225,6,0,0.5)]" : "text-slate-400 hover:text-white"}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Race Info Banner */}
                {raceInfo && (
                    <div className="glass carbon-card rounded-xl p-5 mb-6 border border-white/10 flex justify-between items-center">
                        <div>
                            <span className="text-xs font-bold text-primary uppercase tracking-widest font-f1">Round {raceInfo.round}</span>
                            <h2 className="text-2xl font-black text-white font-f1 uppercase">{raceInfo.raceName}</h2>
                            <span className="text-sm text-slate-400">{raceInfo.Circuit?.circuitName} — {raceInfo.Circuit?.Location?.country}</span>
                        </div>
                        <span className="text-slate-500 font-mono">{new Date(raceInfo.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                )}

                {/* Podium Mini-Visualization */}
                {results && tab === "race" && results.Results?.length >= 3 && (() => {
                    const podium = results.Results.slice(0, 3);
                    const podiumMeta = [
                        { label: "1ST", gradient: "from-[#ffd700]/15 to-[#ffd700]/5", border: "border-[#ffd700]/30", accent: "text-[#ffd700]", shadow: "shadow-[0_0_30px_rgba(255,215,0,0.08)]" },
                        { label: "2ND", gradient: "from-[#c0c0c0]/15 to-[#c0c0c0]/5", border: "border-[#c0c0c0]/30", accent: "text-[#c0c0c0]", shadow: "shadow-[0_0_30px_rgba(192,192,192,0.08)]" },
                        { label: "3RD", gradient: "from-[#cd7f32]/15 to-[#cd7f32]/5", border: "border-[#cd7f32]/30", accent: "text-[#cd7f32]", shadow: "shadow-[0_0_30px_rgba(205,127,50,0.08)]" },
                    ];
                    return (
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="grid grid-cols-3 gap-4 mb-6"
                        >
                            {podium.map((r: any, idx: number) => {
                                const meta = podiumMeta[idx];
                                const teamColor = getTeamColor(r.Constructor?.constructorId);
                                return (
                                    <div
                                        key={r.Driver?.driverId || idx}
                                        className={`glass rounded-xl border ${meta.border} bg-gradient-to-br ${meta.gradient} p-5 ${meta.shadow} relative overflow-hidden`}
                                    >
                                        {/* Team color accent bar */}
                                        <div className="absolute top-0 left-0 w-full h-1 rounded-t-xl" style={{ background: `linear-gradient(90deg, ${teamColor}, transparent)` }} />
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-xs font-black font-f1 uppercase tracking-widest ${meta.accent}`}>{meta.label}</span>
                                            <span className="material-symbols-outlined text-lg" style={{ color: meta.accent.includes('ffd700') ? '#ffd700' : meta.accent.includes('c0c0c0') ? '#c0c0c0' : '#cd7f32' }}>emoji_events</span>
                                        </div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-1 h-8 rounded-full" style={{ backgroundColor: teamColor }} />
                                            <div>
                                                <p className="text-white font-bold text-lg font-f1 uppercase tracking-wide">{r.Driver?.code || r.Driver?.familyName?.substring(0, 3).toUpperCase()}</p>
                                                <p className="text-slate-400 text-xs">{r.Driver?.givenName} {r.Driver?.familyName}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold uppercase tracking-widest font-f1" style={{ color: teamColor }}>{r.Constructor?.name}</span>
                                            <span className="text-white font-mono text-sm font-bold">{r.Time?.time || r.status}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    );
                })()}

                {/* Results Table */}
                <AnimatePresence mode="wait">
                    {isLoadingResults ? (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
                        </motion.div>
                    ) : results ? (
                        <motion.div key={`${selectedRound}-${tab}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div className="glass rounded-xl border border-white/10 overflow-hidden shadow-2xl bg-black/60">
                                <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-black/80 font-f1 text-[11px] uppercase tracking-widest text-slate-400">
                                        <tr>
                                            <th className="p-4 w-16 text-center border-b border-primary/40">POS</th>
                                            <th className="p-4 border-b border-primary/40">DRIVER</th>
                                            <th className="p-4 border-b border-primary/40">TEAM</th>
                                            {tab === "race" && <th className="p-4 border-b border-primary/40 text-center">GRID</th>}
                                            {tab === "race" && <th className="p-4 border-b border-primary/40 text-right">TIME / STATUS</th>}
                                            {tab === "race" && <th className="p-4 border-b border-primary/40 text-right">PTS</th>}
                                            {tab === "qualifying" && <th className="p-4 border-b border-primary/40 text-right">Q1</th>}
                                            {tab === "qualifying" && <th className="p-4 border-b border-primary/40 text-right">Q2</th>}
                                            {tab === "qualifying" && <th className="p-4 border-b border-primary/40 text-right">Q3</th>}
                                            {tab === "sprint" && <th className="p-4 border-b border-primary/40 text-right">TIME / STATUS</th>}
                                            {tab === "sprint" && <th className="p-4 border-b border-primary/40 text-right">PTS</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="font-mono text-sm">
                                        {(tab === "qualifying" ? results.QualifyingResults : results.Results || results.SprintResults)?.map((r: any, i: number) => {
                                            const pos = parseInt(r.position);
                                            const podiumColor = pos === 1 ? "text-[#ffd700]" : pos === 2 ? "text-[#c0c0c0]" : pos === 3 ? "text-[#cd7f32]" : "text-slate-400";
                                            const isFastestLap = r.FastestLap?.rank === "1";
                                            const isDNF = r.status && r.status !== "Finished" && !r.status.startsWith("+");
                                            const teamId = r.Constructor?.constructorId;
                                            const teamColor = getTeamColor(teamId);
                                            const grid = parseInt(r.grid);
                                            const delta = (!isNaN(grid) && grid > 0) ? grid - pos : 0;

                                            return (
                                                <tr
                                                    key={r.Driver?.driverId || i}
                                                    className={`border-b border-white/5 transition-colors ${isFastestLap ? "bg-purple-500/5" : ""} ${isDNF ? "opacity-50" : ""}`}
                                                    style={{
                                                        background: `linear-gradient(90deg, ${teamColor}10, transparent 25%)`,
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = `linear-gradient(90deg, ${teamColor}25, transparent 30%)`; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(90deg, ${teamColor}10, transparent 25%)`; }}
                                                >
                                                    <td className={`p-4 text-center font-black text-lg font-f1 italic ${podiumColor}`}>{r.position}</td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: teamColor }} />
                                                            <div>
                                                                <span className="text-white font-bold uppercase">{getNationalityFlag(r.Driver?.nationality)} {r.Driver?.code || r.Driver?.familyName?.substring(0, 3).toUpperCase()}</span>
                                                                <span className="text-slate-500 text-xs ml-2 hidden md:inline">{r.Driver?.givenName} {r.Driver?.familyName}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-sm font-bold uppercase tracking-widest font-f1" style={{ color: teamColor }}>{r.Constructor?.name}</td>
                                                    {tab === "race" && (
                                                        <td className="p-4 text-center">
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <span className="text-slate-400">{r.grid}</span>
                                                                {delta !== 0 && (
                                                                    <span className={`flex items-center text-[10px] font-bold font-f1 ${delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{delta > 0 ? 'arrow_upward' : 'arrow_downward'}</span>
                                                                        {Math.abs(delta)}
                                                                    </span>
                                                                )}
                                                                {delta === 0 && !isNaN(grid) && grid > 0 && (
                                                                    <span className="text-slate-600 text-[10px] font-bold">--</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    )}
                                                    {tab === "race" && (
                                                        <td className="p-4 text-right">
                                                            <span className={isDNF ? "text-red-400" : "text-white font-bold"}>{r.Time?.time || r.status}</span>
                                                            {isFastestLap && <span className="ml-2 text-[9px] text-purple-400 font-f1 font-bold" style={{ textShadow: '0 0 8px #A855F7' }}>FASTEST LAP</span>}
                                                        </td>
                                                    )}
                                                    {tab === "race" && <td className="p-4 text-right font-bold text-white">{r.points}</td>}
                                                    {tab === "qualifying" && <td className="p-4 text-right text-slate-300">{r.Q1 || "-"}</td>}
                                                    {tab === "qualifying" && <td className="p-4 text-right text-slate-300">{r.Q2 || "-"}</td>}
                                                    {tab === "qualifying" && <td className="p-4 text-right text-white font-bold">{r.Q3 || "-"}</td>}
                                                    {tab === "sprint" && <td className="p-4 text-right text-white">{r.Time?.time || r.status}</td>}
                                                    {tab === "sprint" && <td className="p-4 text-right font-bold text-white">{r.points}</td>}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                </div>
                            </div>
                        </motion.div>
                    ) : selectedRound ? (
                        <motion.div key="no-results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex justify-center py-16">
                            <div className="glass rounded-2xl border border-white/10 p-10 text-center max-w-md bg-black/40">
                                <motion.span
                                    animate={{ y: [0, -6, 0] }}
                                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                                    className="material-symbols-outlined text-5xl text-slate-600 block mb-4"
                                >search_off</motion.span>
                                <p className="text-slate-400 font-f1 uppercase tracking-widest text-sm mb-1">No {tab} Results</p>
                                <p className="text-slate-600 text-xs font-mono">Results for this session are not yet available or were not recorded.</p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="select-round" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex justify-center py-16">
                            <div className="glass rounded-2xl border border-white/10 p-10 text-center max-w-md bg-black/40">
                                <motion.span
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                                    className="material-symbols-outlined text-5xl text-primary/40 block mb-4"
                                >flag</motion.span>
                                <p className="text-slate-400 font-f1 uppercase tracking-widest text-sm mb-1">Select a Round</p>
                                <p className="text-slate-600 text-xs font-mono">Choose a race weekend from the dropdown above to view detailed results.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
        </PageTransition>
    );
}
