"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { F1Images } from "@/lib/api/f1-client";
import { PageHeader } from "@/components/ui/page-header";
import { DRIVER_PORTRAITS } from "@/lib/api/assets";
import { getTeamColor, getNationalityFlag } from "@/lib/utils";
import { PageTransition } from "@/components/ui/page-transition";

interface Driver {
    position: string;
    points: string;
    wins: string;
    Driver: { driverId: string; code: string; givenName: string; familyName: string; permanentNumber: string; nationality: string };
    Constructors: { constructorId: string; name: string }[];
}

interface DriversClientProps {
    initialDrivers: Driver[];
}

export default function DriversClient({ initialDrivers }: DriversClientProps) {
    const [drivers] = useState<Driver[]>(initialDrivers);
    const [search, setSearch] = useState("");
    const [teamFilter, setTeamFilter] = useState<string>("all");

    // Get unique teams for filter
    const teams = Array.from(new Set(drivers.map(d => d.Constructors[0]?.constructorId))).filter(Boolean);

    // Filter drivers
    const filtered = drivers.filter(drv => {
        const matchesSearch = search === "" ||
            drv.Driver.givenName.toLowerCase().includes(search.toLowerCase()) ||
            drv.Driver.familyName.toLowerCase().includes(search.toLowerCase()) ||
            drv.Driver.code?.toLowerCase().includes(search.toLowerCase());
        const matchesTeam = teamFilter === "all" || drv.Constructors[0]?.constructorId === teamFilter;
        return matchesSearch && matchesTeam;
    });

    return (
        <PageTransition>
        <div className="bg-transparent font-display pb-20 relative overflow-hidden">

            {/* Cinematic Background Glows */}
            <div className="absolute top-0 right-[20%] w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-[1600px] mx-auto w-full px-6 md:px-12 relative z-10 flex flex-col justify-center">

                <PageHeader title="DRIVER" subtitle="LINEUP" />

                {/* Search & Filter Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 mb-12 max-w-3xl mx-auto w-full"
                >
                    <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl">search</span>
                        <input
                            type="text"
                            placeholder="Search drivers..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            aria-label="Search drivers"
                            className="w-full pl-12 pr-4 py-3 bg-black/60 border border-white/10 border-l-2 border-l-primary/30 rounded-xl text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:shadow-[0_0_15px_rgba(225,6,0,0.2)] transition-all backdrop-blur-md"
                        />
                    </div>
                    <select
                        value={teamFilter}
                        onChange={e => setTeamFilter(e.target.value)}
                        aria-label="Filter by team"
                        className="px-4 py-3 bg-black/60 border border-white/10 rounded-xl text-white font-f1 text-sm uppercase tracking-widest focus:outline-none focus:border-primary/50 cursor-pointer backdrop-blur-md appearance-none min-w-[200px]"
                    >
                        <option value="all">All Teams</option>
                        {teams.map(t => {
                            const name = drivers.find(d => d.Constructors[0]?.constructorId === t)?.Constructors[0]?.name || t;
                            return <option key={t} value={t}>{name}</option>;
                        })}
                    </select>
                </motion.div>

                {/* ===== Podium Section (P1-P3) ===== */}
                {(() => {
                    const podiumColors: Record<string, { border: string; badge: string; badgeText: string }> = {
                        "1": { border: "border-[#D4AF37]/40", badge: "bg-gradient-to-br from-[#D4AF37] to-[#A08520]", badgeText: "text-black" },
                        "2": { border: "border-[#C0C0C0]/30", badge: "bg-gradient-to-br from-[#C0C0C0] to-[#8A8A8A]", badgeText: "text-black" },
                        "3": { border: "border-[#CD7F32]/30", badge: "bg-gradient-to-br from-[#CD7F32] to-[#8B5A20]", badgeText: "text-black" },
                    };
                    const podiumDrivers = filtered.filter(d => ["1", "2", "3"].includes(d.position));
                    const restDrivers = filtered.filter(d => !["1", "2", "3"].includes(d.position));

                    return (
                        <>
                            {/* Podium Cards */}
                            {podiumDrivers.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                                    {podiumDrivers.map((drv, idx) => {
                                        const teamColor = getTeamColor(drv.Constructors[0].constructorId);
                                        const code = drv.Driver.code || drv.Driver.familyName.substring(0, 3).toUpperCase();
                                        const podium = podiumColors[drv.position];

                                        return (
                                            <Link key={drv.Driver.driverId} href={`/drivers/${drv.Driver.driverId}`}>
                                            <motion.div
                                                initial={{ y: 50, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={{ delay: idx * 0.1, duration: 0.6 }}
                                                className={`glass carbon-card group flex flex-col pt-6 relative ${podium.border} border-2 rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-3 hover:border-white/30 ${drv.position === "1" ? "md:scale-[1.03]" : ""}`}
                                                style={{ boxShadow: `0 8px 32px 0 rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 60px ${teamColor}33` }}
                                            >
                                                {/* Top Team Color Accent */}
                                                <div className="absolute top-0 left-0 right-0 h-1.5 shadow-[0_0_15px_currentColor] transition-shadow duration-500 group-hover:shadow-[0_0_30px_currentColor]" style={{ backgroundColor: teamColor, color: teamColor }} />

                                                {/* Podium Position Badge */}
                                                <div className={`absolute top-4 left-4 w-10 h-10 rounded-full ${podium.badge} flex items-center justify-center text-lg font-black ${podium.badgeText} z-30 shadow-lg font-mono`}>
                                                    {drv.position}
                                                </div>

                                                {/* Abstract Driver Number Background */}
                                                <div className="absolute top-[-20%] right-[-10%] text-[200px] font-black italic z-0 leading-none pointer-events-none transition-all duration-500 text-transparent font-f1 group-hover:scale-110 group-hover:rotate-6 opacity-40 group-hover:opacity-100" style={{ WebkitTextStroke: `1px ${teamColor}88`, color: 'transparent' }}>
                                                    {drv.Driver.permanentNumber}
                                                </div>

                                                {/* Radial Team Glow */}
                                                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none mix-blend-screen" style={{ background: `radial-gradient(circle at 50% 100%, ${teamColor} 0%, transparent 70%)` }} />

                                                <div className="px-6 relative z-10 flex flex-col h-full justify-between pb-6">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex flex-col">
                                                            <span className="text-lg font-bold text-slate-300 uppercase tracking-widest font-f1">{getNationalityFlag(drv.Driver.nationality)} {drv.Driver.givenName}</span>
                                                            <h2 className={`text-3xl font-black uppercase tracking-tight text-white leading-none mt-1 shadow-black drop-shadow-lg font-f1 ${drv.position === "1" ? "shimmer-gold" : ""}`}>
                                                                {drv.Driver.familyName}
                                                            </h2>
                                                        </div>

                                                        <div className="bg-[#111] border border-white/10 w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold italic shadow-xl font-f1" style={{ color: teamColor }}>
                                                            {drv.Driver.permanentNumber}
                                                        </div>
                                                    </div>

                                                    {/* Driver Portrait */}
                                                    <div className="relative mt-8 w-full h-[250px] flex items-end justify-center pointer-events-none">
                                                        <img
                                                            src={DRIVER_PORTRAITS[code] || F1Images.getDriverHeadshot("FALLBACK")}
                                                            alt={`${drv.Driver.givenName} ${drv.Driver.familyName}`}
                                                            className="w-[90%] h-full object-cover object-top origin-bottom filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)] transition-transform duration-700 ease-out group-hover:scale-110 group-hover:-translate-y-4"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Bottom Banner */}
                                                <div className="bg-[#0c0c10]/90 backdrop-blur-md border-t border-white/5 py-3 px-6 z-20 relative flex justify-between items-center group-hover:bg-[#111] transition-colors shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs font-bold uppercase tracking-widest font-f1" style={{ color: teamColor }}>{drv.Constructors[0].name}</span>
                                                        {parseInt(drv.wins) > 0 && <span className="text-[10px] font-bold text-[#ffd700] font-f1">{drv.wins}W</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg font-black text-white font-f1">{drv.points} <span className="text-[10px] text-slate-500 font-light uppercase">PTS</span></span>
                                                    </div>
                                                </div>

                                            </motion.div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}

                            {/* ===== Regular Grid (P4+) ===== */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 gap-y-16 pb-12">
                                {restDrivers.map((drv, idx) => {
                                    const teamColor = getTeamColor(drv.Constructors[0].constructorId);
                                    const code = drv.Driver.code || drv.Driver.familyName.substring(0, 3).toUpperCase();

                                    return (
                                        <Link key={drv.Driver.driverId} href={`/drivers/${drv.Driver.driverId}`}>
                                        <motion.div
                                            initial={{ y: 50, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: Math.min(idx * 0.03, 0.5), duration: 0.5 }}
                                            className="glass carbon-card group max-h-[460px] flex flex-col pt-6 relative border border-white/5 rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:border-white/20"
                                            style={{ boxShadow: `0 8px 32px 0 rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 50px ${teamColor}22` }}
                                        >
                                            {/* Top Team Color Accent */}
                                            <div className="absolute top-0 left-0 right-0 h-1.5 shadow-[0_0_15px_currentColor] transition-shadow duration-500 group-hover:shadow-[0_0_30px_currentColor]" style={{ backgroundColor: teamColor, color: teamColor }} />

                                            {/* Position Badge */}
                                            <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/70 border border-white/10 flex items-center justify-center text-sm font-bold text-white font-mono z-20">
                                                {drv.position}
                                            </div>

                                            {/* Abstract Driver Number Background */}
                                            <div className="absolute top-[-20%] right-[-10%] text-[200px] font-black italic z-0 leading-none pointer-events-none transition-all duration-500 text-transparent font-f1 group-hover:scale-110 group-hover:rotate-6 opacity-40 group-hover:opacity-100" style={{ WebkitTextStroke: `1px ${teamColor}88`, color: 'transparent' }}>
                                                {drv.Driver.permanentNumber}
                                            </div>

                                            {/* Radial Team Glow */}
                                            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none mix-blend-screen" style={{ background: `radial-gradient(circle at 50% 100%, ${teamColor} 0%, transparent 70%)` }} />

                                            <div className="px-6 relative z-10 flex flex-col h-full justify-between pb-6">

                                                <div className="flex justify-between items-start">
                                                    <div className="flex flex-col">
                                                        <span className="text-lg font-bold text-slate-300 uppercase tracking-widest font-f1">{getNationalityFlag(drv.Driver.nationality)} {drv.Driver.givenName}</span>
                                                        <h2 className="text-3xl font-black uppercase tracking-tight text-white leading-none mt-1 shadow-black drop-shadow-lg font-f1">
                                                            {drv.Driver.familyName}
                                                        </h2>
                                                    </div>

                                                    <div className="bg-[#111] border border-white/10 w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold italic shadow-xl font-f1" style={{ color: teamColor }}>
                                                        {drv.Driver.permanentNumber}
                                                    </div>
                                                </div>

                                                {/* Driver Portrait */}
                                                <div className="relative mt-8 w-full h-[250px] flex items-end justify-center pointer-events-none">
                                                    <img
                                                        src={DRIVER_PORTRAITS[code] || F1Images.getDriverHeadshot("FALLBACK")}
                                                        alt={`${drv.Driver.givenName} ${drv.Driver.familyName}`}
                                                        className="w-[90%] h-full object-cover object-top origin-bottom filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)] transition-transform duration-700 ease-out group-hover:scale-110 group-hover:-translate-y-4"
                                                    />
                                                </div>
                                            </div>

                                            {/* Bottom Banner */}
                                            <div className="bg-[#0c0c10]/90 backdrop-blur-md border-t border-white/5 py-3 px-6 z-20 relative flex justify-between items-center group-hover:bg-[#111] transition-colors shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-bold uppercase tracking-widest font-f1" style={{ color: teamColor }}>{drv.Constructors[0].name}</span>
                                                    {parseInt(drv.wins) > 0 && <span className="text-[10px] font-bold text-[#ffd700] font-f1">{drv.wins}W</span>}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-black text-white font-f1">{drv.points} <span className="text-[10px] text-slate-500 font-light uppercase">PTS</span></span>
                                                </div>
                                            </div>

                                        </motion.div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </>
                    );
                })()}

                {filtered.length === 0 && (
                    <div className="text-center py-20 text-slate-500 font-mono uppercase tracking-widest">
                        No drivers match your search.
                    </div>
                )}

            </div>
        </div>
        </PageTransition>
    );
}
