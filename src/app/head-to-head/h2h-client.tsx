"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { getCurrentStandings, getDriverSeasonResults } from "@/lib/api/f1-client";
import { DRIVER_PORTRAITS } from "@/lib/api/assets";
import { getTeamColor, getNationalityFlag } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { PageTransition } from "@/components/ui/page-transition";

interface DriverOption {
    driverId: string;
    code: string;
    givenName: string;
    familyName: string;
    nationality: string;
    teamId: string;
    teamName: string;
    points: number;
    wins: number;
    permanentNumber: string;
}

interface DriverStats {
    races: number;
    wins: number;
    podiums: number;
    points: number;
    fastestLaps: number;
    dnfs: number;
    avgFinish: number;
    bestFinish: number;
    results: any[];
}

function computeStats(results: any[]): DriverStats {
    let wins = 0, podiums = 0, points = 0, fastestLaps = 0, dnfs = 0, totalPos = 0, bestFinish = 99;

    for (const race of results) {
        const r = race.Results?.[0];
        if (!r) continue;
        const pos = parseInt(r.position);
        if (pos === 1) wins++;
        if (pos <= 3) podiums++;
        points += parseFloat(r.points || "0");
        if (r.FastestLap?.rank === "1") fastestLaps++;
        if (r.status && r.status !== "Finished" && !r.status.startsWith("+")) dnfs++;
        totalPos += pos;
        if (pos < bestFinish) bestFinish = pos;
    }

    return {
        races: results.length,
        wins,
        podiums,
        points,
        fastestLaps,
        dnfs,
        avgFinish: results.length > 0 ? Math.round((totalPos / results.length) * 10) / 10 : 0,
        bestFinish: bestFinish === 99 ? 0 : bestFinish,
        results,
    };
}

export default function HeadToHeadClient() {
    const [allDrivers, setAllDrivers] = useState<DriverOption[]>([]);
    const [driver1Id, setDriver1Id] = useState("");
    const [driver2Id, setDriver2Id] = useState("");
    const [stats1, setStats1] = useState<DriverStats | null>(null);
    const [stats2, setStats2] = useState<DriverStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [isComparing, setIsComparing] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                setError(null);
                const standings = await getCurrentStandings();
                const opts: DriverOption[] = standings.map((d: any) => ({
                    driverId: d.Driver.driverId,
                    code: d.Driver.code || d.Driver.familyName.substring(0, 3).toUpperCase(),
                    givenName: d.Driver.givenName,
                    familyName: d.Driver.familyName,
                    nationality: d.Driver.nationality,
                    teamId: d.Constructors[0]?.constructorId,
                    teamName: d.Constructors[0]?.name,
                    points: parseFloat(d.points),
                    wins: parseInt(d.wins),
                    permanentNumber: d.Driver.permanentNumber,
                }));
                setAllDrivers(opts);
                // Default: select P1 vs P2
                if (opts.length >= 2) {
                    setDriver1Id(opts[0].driverId);
                    setDriver2Id(opts[1].driverId);
                }
            } catch (err) {
                setError("Failed to load driver data.");
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, [retryCount]);

    // Compare when both are selected
    useEffect(() => {
        if (!driver1Id || !driver2Id) return;

        async function compare() {
            setIsComparing(true);
            try {
                const [r1, r2] = await Promise.all([
                    getDriverSeasonResults(driver1Id),
                    getDriverSeasonResults(driver2Id),
                ]);
                setStats1(computeStats(r1));
                setStats2(computeStats(r2));
            } catch (err) {
            } finally {
                setIsComparing(false);
            }
        }
        compare();
    }, [driver1Id, driver2Id]);

    const d1 = allDrivers.find(d => d.driverId === driver1Id);
    const d2 = allDrivers.find(d => d.driverId === driver2Id);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center font-display gap-6">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
            </div>
        );
    }

    if (error) return <ErrorState icon="wifi_off" message={error} onRetry={() => { setError(null); setIsLoading(true); setRetryCount(c => c + 1); }} />;

    const statRows = stats1 && stats2 ? [
        { label: "Races", v1: stats1.races, v2: stats2.races, icon: "flag" },
        { label: "Wins", v1: stats1.wins, v2: stats2.wins, icon: "emoji_events", highlight: true },
        { label: "Podiums", v1: stats1.podiums, v2: stats2.podiums, icon: "podium" },
        { label: "Points", v1: stats1.points, v2: stats2.points, icon: "star", highlight: true },
        { label: "Fastest Laps", v1: stats1.fastestLaps, v2: stats2.fastestLaps, icon: "speed" },
        { label: "DNFs", v1: stats1.dnfs, v2: stats2.dnfs, icon: "warning", lower: true },
        { label: "Avg Finish", v1: stats1.avgFinish, v2: stats2.avgFinish, icon: "analytics", lower: true },
        { label: "Best Finish", v1: stats1.bestFinish, v2: stats2.bestFinish, icon: "trophy", lower: true },
    ] : [];

    return (
        <PageTransition>
        <div className="font-display pb-12 relative overflow-hidden">
            <div className="absolute top-0 left-[10%] w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none -translate-y-1/2" style={{ backgroundColor: d1 ? `${getTeamColor(d1.teamId)}15` : 'transparent' }} />
            <div className="absolute top-0 right-[10%] w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none -translate-y-1/2" style={{ backgroundColor: d2 ? `${getTeamColor(d2.teamId)}15` : 'transparent' }} />

            <div className="max-w-[1200px] mx-auto w-full px-4 md:px-8 relative z-10">
                <PageHeader title="HEAD TO" subtitle="HEAD" />

                {/* Driver Selectors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    {[{ selected: driver1Id, setter: setDriver1Id, driver: d1, label: "Driver 1" }, { selected: driver2Id, setter: setDriver2Id, driver: d2, label: "Driver 2" }].map(({ selected, setter, driver, label }) => (
                        <div key={label} className="glass carbon-card rounded-2xl border border-white/10 p-6">
                            <select
                                value={selected}
                                onChange={e => setter(e.target.value)}
                                aria-label={label}
                                className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl text-white font-f1 text-sm uppercase tracking-widest focus:outline-none focus:border-primary/50 cursor-pointer backdrop-blur-md appearance-none mb-4"
                            >
                                <option value="">Select {label}</option>
                                {allDrivers.map(d => (
                                    <option key={d.driverId} value={d.driverId}>{d.code} — {d.givenName} {d.familyName}</option>
                                ))}
                            </select>

                            {driver && (
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#111] flex-shrink-0">
                                        {DRIVER_PORTRAITS[driver.code] ? (
                                            <img src={DRIVER_PORTRAITS[driver.code]} alt={driver.familyName} className="w-full h-full object-cover object-top" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-2xl font-black font-f1" style={{ color: getTeamColor(driver.teamId) }}>{driver.permanentNumber}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-white font-f1 uppercase">{getNationalityFlag(driver.nationality)} {driver.code}</p>
                                        <p className="text-xs font-f1 uppercase tracking-widest" style={{ color: getTeamColor(driver.teamId) }}>{driver.teamName}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* VS Badge */}
                <div className="flex justify-center -mt-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white font-black font-f1 text-xl shadow-[0_0_30px_rgba(225,6,0,0.5)] border-4 border-black">
                        VS
                    </div>
                </div>

                {/* Comparison Stats */}
                {isComparing ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
                    </div>
                ) : stats1 && stats2 && d1 && d2 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl border border-white/10 overflow-hidden">
                        {statRows.map((row, i) => {
                            const better1 = row.lower ? row.v1 < row.v2 : row.v1 > row.v2;
                            const better2 = row.lower ? row.v2 < row.v1 : row.v2 > row.v1;
                            const tied = row.v1 === row.v2;

                            return (
                                <div key={row.label} className={`grid grid-cols-3 items-center p-4 ${i < statRows.length - 1 ? "border-b border-white/5" : ""} hover:bg-white/5 transition-colors`}>
                                    <div className="text-right pr-6">
                                        <span className={`text-2xl font-black font-f1 ${better1 && !tied ? "text-white" : "text-slate-500"}`}>{row.v1}</span>
                                        {better1 && !tied && <div className="w-full h-1 rounded-full mt-1" style={{ backgroundColor: getTeamColor(d1.teamId) }} />}
                                    </div>
                                    <div className="text-center">
                                        <span className="material-symbols-outlined text-slate-600 text-lg">{row.icon}</span>
                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-f1 mt-0.5">{row.label}</div>
                                    </div>
                                    <div className="text-left pl-6">
                                        <span className={`text-2xl font-black font-f1 ${better2 && !tied ? "text-white" : "text-slate-500"}`}>{row.v2}</span>
                                        {better2 && !tied && <div className="w-full h-1 rounded-full mt-1" style={{ backgroundColor: getTeamColor(d2.teamId) }} />}
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>
                ) : null}
            </div>
        </div>
        </PageTransition>
    );
}
