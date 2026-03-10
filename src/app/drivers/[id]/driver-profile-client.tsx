"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { getDriverInfo, getDriverSeasonResults } from "@/lib/api/f1-client";
import { DRIVER_PORTRAITS } from "@/lib/api/assets";
import { getNationalityFlag, getTeamColor } from "@/lib/utils";
import { ErrorState } from "@/components/ui/error-state";

interface DriverProfileClientProps {
    driverId: string;
}

export default function DriverProfileClient({ driverId }: DriverProfileClientProps) {
    const [driver, setDriver] = useState<any>(null);
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        async function load() {
            try {
                setError(null);
                const [driverData, seasonResults] = await Promise.all([
                    getDriverInfo(driverId),
                    getDriverSeasonResults(driverId),
                ]);
                setDriver(driverData);
                setResults(seasonResults);
            } catch (err) {
                setError("Failed to load driver profile.");
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, [driverId, retryCount]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center font-display gap-6">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
                <p className="text-white font-mono tracking-widest animate-pulse">LOADING DRIVER PROFILE...</p>
            </div>
        );
    }

    if (error) return <ErrorState icon="wifi_off" message={error} onRetry={() => { setError(null); setIsLoading(true); setRetryCount(c => c + 1); }} />;

    if (!driver) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center font-display gap-6">
                <span className="material-symbols-outlined text-6xl text-slate-700">person_off</span>
                <p className="text-white font-mono tracking-widest">DRIVER NOT FOUND</p>
                <Link href="/drivers" className="text-primary font-f1 uppercase tracking-widest text-sm hover:underline">Back to Drivers</Link>
            </div>
        );
    }

    const code = driver.code || driver.familyName?.substring(0, 3).toUpperCase();
    const portrait = DRIVER_PORTRAITS[code];

    // Compute stats from results
    const wins = results.filter(r => r.Results?.[0]?.position === "1").length;
    const podiums = results.filter(r => parseInt(r.Results?.[0]?.position) <= 3).length;
    const points = results.reduce((acc: number, r: any) => acc + parseFloat(r.Results?.[0]?.points || "0"), 0);
    const fastestLaps = results.filter(r => r.Results?.[0]?.FastestLap?.rank === "1").length;
    const totalRaces = results.length;

    return (
        <div className="font-display pb-12 relative overflow-hidden">
            <div className="absolute top-0 left-[40%] w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] pointer-events-none -translate-y-1/2" />

            <div className="max-w-[1200px] mx-auto w-full px-4 md:px-8 relative z-10">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <Link href="/drivers" className="text-slate-500 hover:text-white transition-colors font-mono text-sm uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        All Drivers
                    </Link>
                </div>

                {/* Hero */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass carbon-card rounded-2xl border border-white/10 overflow-hidden mb-10">
                    <div className="flex flex-col md:flex-row">
                        {/* Portrait */}
                        <div className="w-full md:w-1/3 h-[300px] md:h-auto bg-[#111] relative overflow-hidden flex items-end justify-center">
                            {portrait ? (
                                <img src={portrait} alt={driver.familyName} className="w-full h-full object-cover object-top" />
                            ) : (
                                <div className="flex items-center justify-center h-full w-full">
                                    <span className="material-symbols-outlined text-8xl text-slate-800">person</span>
                                </div>
                            )}
                            <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 p-8 flex flex-col justify-center">
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-4xl">{getNationalityFlag(driver.nationality)}</span>
                                <span className="text-sm text-slate-500 font-mono uppercase">{driver.nationality}</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-white font-f1 uppercase tracking-tighter leading-none">
                                <span className="text-slate-400 font-light">{driver.givenName}</span><br />
                                {driver.familyName}
                            </h1>
                            <div className="flex items-center gap-4 mt-4">
                                <span className="text-3xl font-black italic font-f1 text-primary">#{driver.permanentNumber}</span>
                                <span className="text-sm text-slate-500 font-mono">Born: {new Date(driver.dateOfBirth).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Season Stats */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
                    {[
                        { label: "Races", value: totalRaces, icon: "flag" },
                        { label: "Wins", value: wins, icon: "emoji_events", color: "text-[#ffd700]" },
                        { label: "Podiums", value: podiums, icon: "podium", color: "text-[#00D2BE]" },
                        { label: "Points", value: points, icon: "star" },
                        { label: "Fastest Laps", value: fastestLaps, icon: "speed", color: "text-purple-400" },
                    ].map(stat => (
                        <div key={stat.label} className="glass carbon-card rounded-xl border border-white/5 p-5 text-center">
                            <span className={`material-symbols-outlined text-2xl mb-2 ${stat.color || "text-slate-400"}`}>{stat.icon}</span>
                            <div className={`text-3xl font-black font-f1 ${stat.color || "text-white"}`}>{stat.value}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-f1 mt-1">{stat.label}</div>
                        </div>
                    ))}
                </motion.div>

                {/* Season Results Table */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <h2 className="text-2xl font-black text-white font-f1 uppercase tracking-tight mb-4 flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">calendar_month</span>
                        Current Season Results
                    </h2>
                    <div className="glass rounded-xl border border-white/10 overflow-hidden bg-black/60">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-black/80 font-f1 text-[11px] uppercase tracking-widest text-slate-400">
                                <tr>
                                    <th className="p-4 border-b border-primary/40">Round</th>
                                    <th className="p-4 border-b border-primary/40">Grand Prix</th>
                                    <th className="p-4 border-b border-primary/40 text-center">Grid</th>
                                    <th className="p-4 border-b border-primary/40 text-center">Finish</th>
                                    <th className="p-4 border-b border-primary/40 text-right">Points</th>
                                    <th className="p-4 border-b border-primary/40 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="font-mono text-sm">
                                {results.map((race: any) => {
                                    const r = race.Results?.[0];
                                    if (!r) return null;
                                    const pos = parseInt(r.position);
                                    const podiumColor = pos === 1 ? "text-[#ffd700]" : pos === 2 ? "text-[#c0c0c0]" : pos === 3 ? "text-[#cd7f32]" : "text-white";
                                    const isDNF = r.status && r.status !== "Finished" && !r.status.startsWith("+");
                                    const isFastestLap = r.FastestLap?.rank === "1";

                                    return (
                                        <tr key={race.round} className={`border-b border-white/5 hover:bg-white/10 transition-colors ${isDNF ? "opacity-70" : ""} ${isFastestLap ? "bg-purple-500/5" : ""}`}>
                                            <td className="p-4 font-bold text-slate-400">R{race.round}</td>
                                            <td className="p-4">
                                                <span className="text-white font-bold">{race.raceName}</span>
                                                <span className="text-slate-600 text-xs ml-2">{race.Circuit?.circuitName}</span>
                                            </td>
                                            <td className="p-4 text-center text-slate-400">{r.grid}</td>
                                            <td className={`p-4 text-center font-black text-lg font-f1 ${podiumColor}`}>
                                                {r.position}
                                                {isFastestLap && <span className="ml-1 text-[9px] text-purple-400 font-f1">FL</span>}
                                            </td>
                                            <td className="p-4 text-right font-bold text-white">{r.points}</td>
                                            <td className={`p-4 text-right text-xs ${isDNF ? "text-red-400" : "text-slate-600"}`}>{r.status}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
