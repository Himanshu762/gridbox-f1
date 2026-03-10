"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { F1Images } from "@/lib/api/f1-client";
import { PageHeader } from "@/components/ui/page-header";
import { DRIVER_PORTRAITS, TEAM_CARS } from "@/lib/api/assets";
import { getTeamColor, getNationalityFlag } from "@/lib/utils";
import { PageTransition } from "@/components/ui/page-transition";

interface Driver {
    position: string;
    points: string;
    wins: string;
    Driver: { driverId: string; code: string; givenName: string; familyName: string; permanentNumber: string; nationality: string };
    Constructors: { constructorId: string; name: string }[];
}

interface Constructor {
    position: string;
    points: string;
    wins: string;
    Constructor: { constructorId: string; name: string };
}

interface StandingsClientProps {
    initialDrivers: Driver[];
    initialConstructors: Constructor[];
}

export default function StandingsClient({ initialDrivers, initialConstructors }: StandingsClientProps) {
    const [view, setView] = useState<'drivers' | 'constructors'>('drivers');
    const [drivers] = useState<Driver[]>(initialDrivers);
    const [constructors] = useState<Constructor[]>(initialConstructors);

    const maxDriverPoints = Math.max(...drivers.map(d => parseFloat(d.points) || 0), 1);
    const maxConstructorPoints = Math.max(...constructors.map(c => parseFloat(c.points) || 0), 1);

    const renderPodium = (d: Driver, rank: number) => {
        const teamColor = getTeamColor(d.Constructors[0].constructorId);
        const code = d.Driver.code || d.Driver.familyName.substring(0, 3).toUpperCase();
        const height = rank === 1 ? 'h-[360px]' : 'h-[320px]';
        const mt = rank === 1 ? 'mt-0' : 'mt-10';
        const rankColor = rank === 1 ? 'gold-glow text-[#ffd700]' : rank === 2 ? 'silver-glow text-[#c0c0c0]' : 'bronze-glow text-[#cd7f32]';
        
        return (
            <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 + (rank * 0.1), duration: 0.6 }}
                className={`glass carbon-card w-full ${height} ${mt} flex flex-col justify-end p-6 relative rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-t-[4px] group overflow-hidden`}
                style={{ borderColor: teamColor, zIndex: 40 - rank }}
            >
                <div className="absolute inset-0 z-0 opacity-20" style={{ background: `radial-gradient(circle at center, ${teamColor} 0%, transparent 70%)` }} />
                
                <span className={`absolute top-4 left-6 text-6xl font-f1 font-black italic ${rankColor} z-20`}>{rank}</span>
                
                <img
                    src={DRIVER_PORTRAITS[code] || F1Images.getDriverHeadshot("generic")}
                    alt={d.Driver.familyName}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full object-cover object-top filter drop-shadow-[0_-5px_15px_rgba(0,0,0,0.5)] transform transition-transform duration-500 group-hover:scale-105 z-10 pointer-events-none"
                />

                <div className="relative z-20 bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 mt-auto transition-all duration-300">
                    <div className="text-sm font-bold text-slate-300 uppercase font-f1">{getNationalityFlag(d.Driver.nationality)} {d.Driver.givenName}</div>
                    <div className={`text-2xl font-black uppercase tracking-tight leading-none mb-1 font-f1 ${rank === 1 ? 'shimmer-gold' : 'text-white'}`}>{d.Driver.familyName}</div>
                    <div className="text-xs font-bold uppercase tracking-widest font-f1" style={{ color: teamColor }}>{d.Constructors[0].name}</div>
                    <div className="text-3xl font-black text-white mt-2 font-f1">{d.points} <span className="text-sm font-normal text-slate-400">PTS</span></div>
                    {parseInt(d.wins) > 0 && <div className="text-sm font-bold text-[#ffd700] mt-1 font-f1">{d.wins} WIN{parseInt(d.wins) > 1 ? 'S' : ''}</div>}
                </div>
            </motion.div>
        );
    };

    return (
        <PageTransition>
        <div className="font-display pb-20 relative overflow-hidden bg-transparent">
            
            {/* Cinematic Background Glows */}
            <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#27F4D2]/5 rounded-full blur-[120px] pointer-events-none translate-x-1/2 -translate-y-1/2" />

            <div className="max-w-[1400px] mx-auto w-full px-6 md:px-12 relative z-10">
                
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6 border-b border-white/10 pb-8">
                    <PageHeader title="CHAMPIONSHIP" subtitle="STANDINGS" />

                    <div className="flex bg-[#111]/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-2xl" role="tablist">
                        <button
                            onClick={() => setView('drivers')}
                            role="tab"
                            aria-selected={view === 'drivers'}
                            className={`px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-sm transition-all duration-300 font-f1 ${view === 'drivers' ? 'bg-primary text-white shadow-[0_0_25px_rgba(225,6,0,0.6),0_0_50px_rgba(225,6,0,0.2)]' : 'text-slate-400 hover:text-white bg-white/5 backdrop-blur-sm hover:bg-white/10'}`}
                        >
                            DRIVERS
                        </button>
                        <button
                            onClick={() => setView('constructors')}
                            role="tab"
                            aria-selected={view === 'constructors'}
                            className={`px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-sm transition-all duration-300 font-f1 ${view === 'constructors' ? 'bg-primary text-white shadow-[0_0_25px_rgba(225,6,0,0.6),0_0_50px_rgba(225,6,0,0.2)]' : 'text-slate-400 hover:text-white bg-white/5 backdrop-blur-sm hover:bg-white/10'}`}
                        >
                            CONSTRUCTORS
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {view === 'drivers' ? (
                        <motion.div key="drivers" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-20">
                            
                            {/* TOP 3 PODIUM */}
                            {drivers.length >= 3 && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end max-w-5xl mx-auto pt-10">
                                    <div className="order-2 md:order-1 flex justify-end">{renderPodium(drivers[1], 2)}</div>
                                    <div className="order-1 md:order-2">{renderPodium(drivers[0], 1)}</div>
                                    <div className="order-3 md:order-3 flex justify-start">{renderPodium(drivers[2], 3)}</div>
                                </div>
                            )}

                            {/* REST OF GRID (LIST) */}
                            <div className="glass carbon-card rounded-2xl p-2 max-w-5xl mx-auto border border-white/5">
                                <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/10 text-xs font-bold text-slate-500 uppercase tracking-widest font-f1">
                                    <div className="col-span-1 text-center">POS</div>
                                    <div className="col-span-4">DRIVER</div>
                                    <div className="col-span-3">CONSTRUCTOR</div>
                                    <div className="col-span-2 text-center">WINS</div>
                                    <div className="col-span-2 text-right">PTS</div>
                                </div>

                                <div className="flex flex-col">
                                    {drivers.slice(3).map((d, i) => {
                                        const teamColor = getTeamColor(d.Constructors[0].constructorId);
                                        return (
                                        <div key={d.Driver.driverId} className="group grid grid-cols-12 gap-4 px-6 py-5 items-center border-b border-white/5 transition-all duration-200 relative overflow-hidden" style={{ background: `linear-gradient(90deg, ${teamColor}10, transparent 30%)` }}>
                                            <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ background: `linear-gradient(90deg, ${teamColor}18, transparent 50%)` }} />
                                            <div className="col-span-1 text-center text-2xl font-black italic text-slate-400 group-hover:text-white transition-colors duration-200 font-f1 relative z-10">{d.position}</div>
                                            <div className="col-span-4 flex items-center gap-4 relative z-10">
                                                <div className="w-1 h-8 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: teamColor, color: teamColor }} />
                                                <div>
                                                    <span className="text-slate-400 font-light font-f1 uppercase tracking-widest text-sm">{getNationalityFlag(d.Driver.nationality)} {d.Driver.givenName}</span>
                                                    <span className="text-white font-bold uppercase tracking-wide text-xl ml-2 font-f1">{d.Driver.familyName}</span>
                                                </div>
                                            </div>
                                            <div className="col-span-3 text-sm font-bold uppercase tracking-widest text-slate-300 font-f1 relative z-10" style={{ color: teamColor }}>
                                                {d.Constructors[0].name}
                                            </div>
                                            <div className="col-span-2 text-center relative z-10">
                                                <span className={`text-lg font-bold font-f1 ${parseInt(d.wins) > 0 ? 'text-[#ffd700]' : 'text-slate-600'}`}>{d.wins}</span>
                                            </div>
                                            <div className="col-span-2 text-right flex flex-col items-end gap-1.5 relative z-10">
                                                <span className={`text-2xl font-black font-f1 ${i === 0 ? 'text-white' : 'text-slate-300'}`}>{d.points}</span>
                                                <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(parseFloat(d.points) / maxDriverPoints) * 100}%`, backgroundColor: teamColor }} />
                                                </div>
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="constructors" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}>
                            <div className="glass carbon-card rounded-2xl p-2 max-w-5xl mx-auto border border-white/5">
                                <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/10 text-xs font-bold text-slate-500 uppercase tracking-widest font-f1">
                                    <div className="col-span-1 text-center">POS</div>
                                    <div className="col-span-1"></div>
                                    <div className="col-span-5">CONSTRUCTOR</div>
                                    <div className="col-span-1 text-center">WINS</div>
                                    <div className="col-span-4 text-right">PTS</div>
                                </div>
                                
                                <div className="flex flex-col">
                                    {constructors.map((c, i) => {
                                        const teamColor = getTeamColor(c.Constructor.constructorId);
                                        return (
                                        <div key={c.Constructor.constructorId} className="group grid grid-cols-12 gap-4 px-6 py-6 items-center border-b border-white/5 hover:bg-black/40 transition-all duration-200 overflow-hidden relative" style={{ background: `linear-gradient(90deg, ${teamColor}10, transparent 30%)` }}>
                                            <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ background: `linear-gradient(90deg, ${teamColor}18, transparent 50%)` }} />
                                            <div className="col-span-1 text-center text-3xl font-black italic text-slate-400 font-f1 group-hover:text-white transition-colors duration-200 relative z-10">{c.position}</div>
                                            <div className="col-span-1 flex justify-center relative z-10">
                                                 <div className="w-2 h-12 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: teamColor, color: teamColor }} />
                                            </div>
                                            <div className="col-span-5 flex flex-col justify-center relative z-10">
                                                <span className="text-3xl font-black uppercase tracking-tight text-white mb-1 font-f1">{c.Constructor.name}</span>
                                                <div className="h-10 w-48 relative overflow-visible mt-2">
                                                    <img src={TEAM_CARS[c.Constructor.constructorId] || TEAM_CARS["generic"]} alt={c.Constructor.name} className="absolute inset-0 w-[150%] max-w-none object-contain origin-left filter drop-shadow-xl group-hover:scale-110 group-hover:translate-x-4 transition-all duration-500" />
                                                </div>
                                            </div>
                                            <div className="col-span-1 text-center relative z-10 flex items-center justify-center">
                                                <span className={`text-lg font-bold font-f1 ${parseInt(c.wins) > 0 ? 'text-[#ffd700]' : 'text-slate-600'}`}>{c.wins}</span>
                                            </div>
                                            <div className="col-span-4 text-right flex flex-col justify-center items-end relative z-10">
                                                <span className="text-5xl font-black text-white font-f1">{c.points}</span>
                                                <div className="w-28 h-1.5 rounded-full bg-white/10 overflow-hidden mt-2">
                                                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(parseFloat(c.points) / maxConstructorPoints) * 100}%`, backgroundColor: teamColor }} />
                                                </div>
                                                <span className="text-sm font-bold text-slate-500 tracking-widest uppercase mt-1 font-f1">Total Points</span>
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
        </PageTransition>
    );
}
