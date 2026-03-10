"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { TEAM_CARS, TRACK_MAPS } from "@/lib/api/assets";
import { getTeamColor, getNationalityFlag } from "@/lib/utils";
import { CountdownTimer } from "@/components/f1/countdown-timer";
import { PageTransition } from "@/components/ui/page-transition";

interface DashboardData {
    nextRace: any;
    topDrivers: any[];
    lastRaceResults: any[];
    lastRaceName: string;
    nextRaceDate: string | null;
    completedRaces: number;
    totalRaces: number;
    constructorLeader: { name: string; constructorId: string; points: number } | null;
}

interface HomeClientProps {
    initialData: DashboardData;
}

export default function HomeClient({ initialData }: HomeClientProps) {
    const [data] = useState<DashboardData>(initialData);
    const nextRaceDate = data.nextRaceDate ? new Date(data.nextRaceDate) : null;
    const [headlines, setHeadlines] = useState<{ title: string; link: string; source: string }[]>([]);

    // Fetch news headlines
    useEffect(() => {
        async function loadNews() {
            try {
                const res = await fetch("/api/news");
                if (!res.ok) return;
                const data = await res.json();
                setHeadlines((data.headlines || []).slice(0, 8));
            } catch { /* ignore */ }
        }
        loadNews();
    }, []);

    const mapUrl = data?.nextRace?.Circuit?.circuitId ? TRACK_MAPS[data.nextRace.Circuit.circuitId] || TRACK_MAPS["generic"] : TRACK_MAPS["generic"];
    const heroCarUrl = TEAM_CARS[data?.topDrivers?.[0]?.teamId || "mclaren"] || TEAM_CARS["generic"];
    const leaderColor = data?.topDrivers?.[0]?.teamId ? getTeamColor(data.topDrivers[0].teamId) : "#3671C6";

    // Count unique winners
    const uniqueWinners = new Set(
        data.lastRaceResults.filter(r => r.position === "1" || r.position === 1).map(r => r.code)
    ).size || "-";

    return (
        <PageTransition>
        <div className="md:px-10 lg:px-20 flex flex-1 justify-center py-5">
            <div className="flex flex-col w-full max-w-[1600px] flex-1">

                {/* ===== HERO SECTION ===== */}
                <div className="mb-10 mt-12">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="flex min-h-[600px] flex-col gap-6 bg-black/40 rounded-2xl items-start justify-end p-8 lg:p-16 relative overflow-hidden border border-white/5 shadow-2xl"
                    >
                        {/* Background layers */}
                        <div className="absolute inset-0 z-0 opacity-40">
                            <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent z-10" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
                        </div>
                        <div className="absolute inset-0 z-0 overflow-hidden opacity-30 pointer-events-none">
                            <div className="w-full h-1 bg-white/20 absolute top-[20%] left-0 animate-speed-lines" style={{ animationDelay: '0s' }} />
                            <div className="w-full h-2 bg-primary/30 absolute top-[40%] left-0 animate-speed-lines" style={{ animationDelay: '0.5s' }} />
                            <div className="w-full h-[1px] bg-white/40 absolute top-[60%] left-0 animate-speed-lines" style={{ animationDelay: '0.2s' }} />
                            <div className="w-full h-3 bg-blue-500/20 absolute top-[80%] left-0 animate-speed-lines" style={{ animationDelay: '0.8s' }} />
                        </div>

                        {/* Track Map SVG */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] z-0 opacity-15 pointer-events-none flex items-center justify-center">
                            <img alt="Circuit Outline" className="w-full h-full object-contain opacity-50" src={mapUrl} />
                        </div>

                        {/* 3D Car */}
                        <div className="absolute bottom-4 right-[-5%] w-[65%] max-w-[900px] z-10 drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
                            <div className="absolute inset-0 blur-3xl z-[-1]" style={{ background: `linear-gradient(to left, ${leaderColor}33, transparent)` }} />
                            <div className="absolute top-[40%] right-[80%] w-[300px] h-4 bg-white/40 blur-md rounded-full transform -rotate-12" />
                            <div className="absolute top-[60%] right-[75%] w-[400px] h-8 blur-lg rounded-full transform -rotate-12" style={{ backgroundColor: `${leaderColor}66` }} />
                            <img alt="Hero F1 Car" className="w-full h-auto object-contain transform scale-x-[-1]" src={heroCarUrl} />
                        </div>

                        {/* Race Box */}
                        <div className="absolute top-8 right-8 glass p-4 rounded-xl flex items-center gap-4 z-20 border-white/10 carbon-card shadow-2xl hidden md:flex">
                            <div className="flex flex-col text-right">
                                <span className="text-xs text-primary font-bold uppercase tracking-widest mb-1 font-f1">Round {data?.nextRace?.round || "..."}</span>
                                <span className="font-bold text-xl uppercase tracking-wider font-f1 text-white">{data?.nextRace?.raceName || "Grand Prix"}</span>
                                <span className="text-xs text-slate-400 font-mono">{data?.nextRace?.Circuit?.circuitName || "Circuit"}</span>
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="flex flex-col gap-2 text-left z-20 max-w-3xl relative">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-black/60 border-l-4 border-primary w-fit backdrop-blur-md mb-4 shadow-[0_0_15px_rgba(225,6,0,0.3)]">
                                <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(225,6,0,1)] animate-pulse-fast" />
                                <span className="text-white text-sm font-bold uppercase tracking-widest font-f1">Upcoming Race</span>
                            </div>
                            <h1 className="text-7xl lg:text-[140px] font-f1 font-extrabold leading-[0.85] tracking-tighter text-white text-glow-primary italic transform -skew-x-6">
                                {data?.nextRace?.Circuit?.Location?.country?.toUpperCase() || "RACE"}<br />WEEKEND
                            </h1>
                            <h2 className="text-slate-300 text-lg lg:text-xl font-normal leading-relaxed max-w-xl mt-6 glass p-4 rounded-lg border-l-2 border-[#00D2BE]">
                                Experience the ultimate F1 data hub. Fast factual telemetry, accurate live leaderboards, and immediate constructor stats.
                            </h2>
                            <div className="flex gap-4 mt-8">
                                <Link href="/calendar" className="flex cursor-pointer items-center justify-center overflow-hidden rounded h-14 px-10 bg-primary text-white text-lg font-bold tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(225,6,0,0.5)] hover:shadow-[0_0_35px_rgba(225,6,0,0.8)] hover:-translate-y-1 font-f1 transform skew-x-[-10deg]">
                                    <span className="transform skew-x-[10deg] flex items-center">
                                        <span className="material-symbols-outlined mr-2 text-2xl">event</span>
                                        VIEW CALENDAR
                                    </span>
                                </Link>
                                <Link href="/live" className="flex cursor-pointer items-center justify-center overflow-hidden rounded h-14 px-10 border border-white/20 text-white text-lg font-bold tracking-widest uppercase transition-all hover:bg-white/10 hover:border-white/40 font-f1 transform skew-x-[-10deg]">
                                    <span className="transform skew-x-[10deg] flex items-center">
                                        <span className="material-symbols-outlined mr-2 text-2xl">speed</span>
                                        PIT WALL
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ===== CHAMPIONSHIP + RACE RESULTS ROW ===== */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
                    {/* Championship Leaders */}
                    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }} className="lg:col-span-4 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-3xl font-f1 font-extrabold leading-tight tracking-tight text-white flex items-center gap-3 uppercase italic drop-shadow-md">
                                <span className="material-symbols-outlined text-primary text-3xl">timer</span>
                                Championship Leaders
                            </h2>
                        </div>
                        <div className="glass carbon-card rounded-2xl p-0 flex flex-col border border-primary/20 hover:border-primary/50 transition-all duration-500 shadow-[0_0_20px_rgba(225,6,0,0.15)] hover:shadow-[0_0_40px_rgba(225,6,0,0.3)] relative overflow-hidden group/card bg-black/40 backdrop-blur-xl">
                            <div className="p-5 border-b border-white/10 bg-gradient-to-r from-black/80 to-black/40 flex justify-between items-center relative z-10">
                                <span className="text-sm font-bold uppercase tracking-widest text-[#00D2BE] font-f1">WDC Standings (Top 3)</span>
                                <span className="font-mono text-xl text-primary font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(225,6,0,1)] animate-pulse-fast"/>LIVE</span>
                            </div>
                            <div className="flex flex-col relative z-10">
                                {data?.topDrivers?.map((drv, idx) => (
                                    <Link href="/standings" key={drv.code} className="block relative">
                                        <motion.div
                                            whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                                            whileTap={{ scale: 0.98 }}
                                            className="flex items-center justify-between p-5 border-b border-white/5 transition-all cursor-pointer relative overflow-hidden group/item"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-transparent group-hover/item:to-white/5 z-0 transition-all opacity-0 group-hover/item:opacity-100" />
                                            <div className="flex items-center gap-5 relative z-10">
                                                <span className={`font-f1 text-3xl font-black transition-colors w-6 text-center ${idx === 0 ? 'text-[#D4AF37]' : idx === 1 ? 'text-[#C0C0C0]' : 'text-[#CD7F32]'}`}>{idx + 1}</span>
                                                <div className="w-1.5 h-12 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]" style={{ backgroundColor: getTeamColor(drv.teamId) }} />
                                                <div>
                                                    <p className="text-2xl font-black text-white mb-0 font-f1 uppercase tracking-wider">{getNationalityFlag(drv.nationality)} {drv.code}</p>
                                                    <p className="text-xs text-slate-400 font-medium tracking-wide">{drv.team}</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end relative z-10">
                                                <p className="font-mono text-2xl text-white font-bold">{drv.points} <span className="text-sm text-slate-500">PTS</span></p>
                                                <div className="flex gap-1 mt-1 opacity-50 group-hover/item:opacity-100 transition-opacity">
                                                    <motion.span initial={{ width: 0 }} animate={{ width: 32 }} transition={{ delay: 0.5 + (idx * 0.1) }} className="h-1.5 bg-green-500 rounded-sm shadow-[0_0_5px_#22c55e]"></motion.span>
                                                    <motion.span initial={{ width: 0 }} animate={{ width: 32 }} transition={{ delay: 0.6 + (idx * 0.1) }} className="h-1.5 bg-purple-500 rounded-sm shadow-[0_0_5px_#a855f7]"></motion.span>
                                                    <motion.span initial={{ width: 0 }} animate={{ width: 32 }} transition={{ delay: 0.7 + (idx * 0.1) }} className="h-1.5 bg-yellow-500 rounded-sm shadow-[0_0_5px_#eab308]"></motion.span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </Link>
                                ))}
                            </div>
                            <Link href="/standings" className="w-full py-4 bg-white/5 hover:bg-primary text-sm font-bold uppercase tracking-widest transition-colors font-f1 text-center text-slate-200 hover:text-white relative z-10">
                                Full Standings
                            </Link>
                        </div>
                    </motion.div>

                    {/* Race Weekend Hub */}
                    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }} className="lg:col-span-8 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-3xl font-f1 font-extrabold leading-tight tracking-tight text-white flex items-center gap-3 uppercase italic drop-shadow-md">
                                <span className="material-symbols-outlined text-[#00D2BE] text-3xl">sports_score</span>
                                {data.lastRaceName || "Latest Results"}
                            </h2>
                            <Link href="/results" className="text-xs text-slate-400 hover:text-primary transition-colors font-f1 uppercase tracking-widest flex items-center gap-1">
                                Full Results <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </Link>
                        </div>

                        {/* Last Race Results Table */}
                        <div className="glass carbon-card rounded-2xl border border-white/10 overflow-hidden bg-black/40 backdrop-blur-xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b-2 border-primary/30 bg-black/80 font-f1 text-[10px] uppercase tracking-widest text-slate-500">
                                            <th className="p-3 pl-4 w-12">POS</th>
                                            <th className="p-3">DRIVER</th>
                                            <th className="p-3 hidden sm:table-cell">TEAM</th>
                                            <th className="p-3 text-right pr-4">TIME / STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-mono text-sm">
                                        {data.lastRaceResults.map((r, idx) => {
                                            const podiumColors = ['text-[#D4AF37]', 'text-[#C0C0C0]', 'text-[#CD7F32]'];
                                            const teamColor = getTeamColor(r.teamId);
                                            return (
                                                <motion.tr
                                                    key={r.code}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.4 + idx * 0.04 }}
                                                    className={`border-b border-white/5 transition-colors hover:bg-white/5 group ${r.fastestLap ? 'bg-purple-500/5' : ''}`}
                                                    style={{ borderLeft: `3px solid ${teamColor}` }}
                                                >
                                                    <td className="p-3 pl-4">
                                                        <span className={`font-f1 text-lg font-black italic ${idx < 3 ? podiumColors[idx] : 'text-slate-400'}`}>{r.position}</span>
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-white font-bold font-f1 uppercase tracking-wider">{getNationalityFlag(r.nationality)} {r.code}</span>
                                                            {r.fastestLap && (
                                                                <span className="text-[9px] font-bold text-purple-400 font-f1 px-1.5 py-0.5 bg-purple-500/20 rounded border border-purple-500/30" style={{ textShadow: '0 0 8px #A855F7' }}>FL</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 hidden sm:table-cell">
                                                        <span className="text-xs text-slate-400 uppercase tracking-wider">{r.team}</span>
                                                    </td>
                                                    <td className="p-3 text-right pr-4">
                                                        <span className="text-slate-300 font-medium">{r.time}</span>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass carbon-card rounded-xl p-4 border border-white/5 text-center group hover:border-primary/30 transition-all">
                                <span className="material-symbols-outlined text-primary text-xl mb-1 group-hover:scale-110 transition-transform inline-block">flag</span>
                                <p className="font-mono text-2xl font-bold text-white">{data.completedRaces}<span className="text-sm text-slate-500">/{data.totalRaces}</span></p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-f1 mt-1">Races Complete</p>
                            </motion.div>
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="glass carbon-card rounded-xl p-4 border border-white/5 text-center group hover:border-[#00D2BE]/30 transition-all">
                                <span className="material-symbols-outlined text-[#00D2BE] text-xl mb-1 group-hover:scale-110 transition-transform inline-block">person</span>
                                <p className="font-mono text-2xl font-bold text-white">{data.topDrivers[0]?.code || "-"}</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-f1 mt-1">WDC Leader</p>
                            </motion.div>
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="glass carbon-card rounded-xl p-4 border border-white/5 text-center group hover:border-yellow-500/30 transition-all">
                                <span className="material-symbols-outlined text-yellow-500 text-xl mb-1 group-hover:scale-110 transition-transform inline-block">engineering</span>
                                <p className="font-mono text-2xl font-bold text-white">{data.constructorLeader?.name?.split(' ')[0] || "-"}</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-f1 mt-1">WCC Leader</p>
                            </motion.div>
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }} className="glass carbon-card rounded-xl p-4 border border-white/5 text-center group hover:border-purple-500/30 transition-all">
                                <span className="material-symbols-outlined text-purple-400 text-xl mb-1 group-hover:scale-110 transition-transform inline-block">emoji_events</span>
                                <p className="font-mono text-2xl font-bold text-white">{uniqueWinners}</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-f1 mt-1">Race Winners</p>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>

                {/* ===== NEWS TICKER ===== */}
                {headlines.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mb-8 glass rounded-xl border border-white/10 overflow-hidden">
                        <div className="flex items-center">
                            <div className="bg-primary px-4 py-3 flex items-center gap-2 flex-shrink-0">
                                <span className="material-symbols-outlined text-white text-lg">newspaper</span>
                                <span className="text-xs font-black text-white uppercase tracking-widest font-f1">News</span>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="flex animate-scroll-x gap-8 px-6 py-3 whitespace-nowrap">
                                    {headlines.map((h, i) => (
                                        <a key={i} href={h.link} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-300 hover:text-primary transition-colors inline-flex items-center gap-2 flex-shrink-0">
                                            <span className="text-[10px] text-slate-600 font-mono">{h.source}</span>
                                            <span className="text-slate-600">|</span>
                                            {h.title}
                                        </a>
                                    ))}
                                </div>
                            </div>
                            <Link href="/news" className="px-4 py-3 text-xs text-slate-500 hover:text-white transition-colors font-f1 uppercase tracking-widest flex-shrink-0">
                                More
                            </Link>
                        </div>
                    </motion.div>
                )}

                {/* ===== COUNTDOWN + STANDINGS CARDS ===== */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                    {/* Next Race Countdown */}
                    {nextRaceDate && (
                        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="glass carbon-card rounded-2xl p-8 border border-white/10 flex flex-col items-center justify-center gap-6">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary text-2xl">schedule</span>
                                <h3 className="text-xl font-f1 font-bold uppercase tracking-widest text-slate-300">Lights Out In</h3>
                            </div>
                            <CountdownTimer targetDate={nextRaceDate} />
                            <p className="text-sm text-slate-500 font-mono uppercase tracking-wider">{data?.nextRace?.raceName || "Grand Prix"}</p>
                        </motion.div>
                    )}

                    {/* Constructor Leader Card */}
                    {data.constructorLeader && (
                        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.1 }} className="glass carbon-card rounded-2xl border border-white/10 overflow-hidden">
                            <div className="p-5 border-b border-white/10 bg-gradient-to-r from-black/80 to-black/40 flex justify-between items-center">
                                <span className="text-sm font-bold uppercase tracking-widest text-[#00D2BE] font-f1">Constructor Championship</span>
                                <Link href="/standings" className="text-xs text-slate-500 hover:text-primary transition-colors font-f1 uppercase tracking-widest">View All</Link>
                            </div>
                            <div className="p-6 flex items-center gap-6">
                                <div className="w-2 h-16 rounded-full" style={{ backgroundColor: getTeamColor(data.constructorLeader.constructorId) }} />
                                <div className="flex-1">
                                    <p className="text-3xl font-black text-white font-f1 uppercase tracking-wider">{data.constructorLeader.name}</p>
                                    <p className="text-sm text-slate-400 mt-1">Championship Leaders</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono text-3xl text-white font-bold">{data.constructorLeader.points}</p>
                                    <p className="text-xs text-slate-500 uppercase">PTS</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

            </div>
        </div>
        </PageTransition>
    );
}
