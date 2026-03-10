"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/ui/page-header";
import { TRACK_MAPS } from "@/lib/api/assets";
import { getFlag } from "@/lib/utils";
import { PageTransition } from "@/components/ui/page-transition";

interface CircuitData {
    circuitId: string;
    circuitName: string;
    locality: string;
    country: string;
    lat: string;
    long: string;
    url: string;
    round?: string;
    raceDate?: string;
    raceName?: string;
}

function mergeCircuitsWithSchedule(circuitList: any[], schedule: any[]): CircuitData[] {
    return circuitList.map((c: any) => {
        const race = schedule.find((r: any) => r.Circuit?.circuitId === c.circuitId);
        return {
            circuitId: c.circuitId,
            circuitName: c.circuitName,
            locality: c.Location.locality,
            country: c.Location.country,
            lat: c.Location.lat,
            long: c.Location.long,
            url: c.url,
            round: race?.round,
            raceDate: race?.date,
            raceName: race?.raceName,
        };
    });
}

interface CircuitsClientProps {
    initialCircuits: any[];
    initialSchedule: any[];
}

export default function CircuitsClient({ initialCircuits, initialSchedule }: CircuitsClientProps) {
    const [circuits] = useState<CircuitData[]>(mergeCircuitsWithSchedule(initialCircuits, initialSchedule));
    const [selected, setSelected] = useState<CircuitData | null>(null);
    const [search, setSearch] = useState("");

    const filtered = circuits.filter(c =>
        search === "" ||
        c.circuitName.toLowerCase().includes(search.toLowerCase()) ||
        c.country.toLowerCase().includes(search.toLowerCase()) ||
        c.locality.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <PageTransition>
        <div className="font-display pb-12 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] pointer-events-none translate-y-1/2" />

            <div className="max-w-[1600px] mx-auto w-full px-4 md:px-8 relative z-10">
                {/* Header */}
                <PageHeader title="CIRCUIT" subtitle="ENCYCLOPEDIA" />

                {/* Search */}
                <div className="relative max-w-md mb-10">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl">search</span>
                    <input
                        type="text"
                        placeholder="Search circuits..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        aria-label="Search circuits"
                        className="w-full pl-12 pr-4 py-3 bg-black/60 border border-white/10 rounded-xl text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-all backdrop-blur-md"
                    />
                </div>

                {/* Circuit Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
                    {filtered.map((c, idx) => {
                        const trackImg = TRACK_MAPS[c.circuitId] || TRACK_MAPS[c.country.toLowerCase()] || TRACK_MAPS[c.locality.toLowerCase()];

                        return (
                            <motion.div
                                key={c.circuitId}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(idx * 0.03, 0.5), duration: 0.4 }}
                                onClick={() => setSelected(selected?.circuitId === c.circuitId ? null : c)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(selected?.circuitId === c.circuitId ? null : c); } }}
                                role="button"
                                tabIndex={0}
                                className={`glass carbon-card rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 group ${selected?.circuitId === c.circuitId ? "border-primary/50 shadow-[0_0_30px_rgba(225,6,0,0.2)]" : "border-white/5 hover:border-white/20"}`}
                            >
                                {/* Track Map */}
                                <div className="h-40 bg-[#111] relative overflow-hidden flex items-center justify-center">
                                    {trackImg ? (
                                        <img
                                            src={trackImg}
                                            alt={c.circuitName}
                                            className="w-[80%] h-[80%] object-contain opacity-40 group-hover:opacity-70 group-hover:scale-110 transition-all duration-500"
                                        />
                                    ) : (
                                        <span className="material-symbols-outlined text-6xl text-slate-800">map</span>
                                    )}
                                    {c.round && (
                                        <div className="absolute top-3 right-3 bg-primary/80 backdrop-blur-sm text-white text-[10px] font-bold font-f1 px-2 py-1 rounded uppercase tracking-widest">
                                            R{c.round}
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className="text-xl font-black text-white font-f1 uppercase tracking-tight leading-tight">{c.circuitName}</h3>
                                            <p className="text-sm text-slate-400 mt-1">{getFlag(c.country)} {c.locality}, {c.country}</p>
                                        </div>
                                    </div>

                                    {c.raceName && (
                                        <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
                                            <span className="text-xs font-bold text-[#00D2BE] font-f1 uppercase tracking-widest">{c.raceName}</span>
                                            {c.raceDate && (
                                                <span className="text-xs font-mono text-slate-500">
                                                    {new Date(c.raceDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Detail Panel */}
                <AnimatePresence>
                    {selected && (
                        <motion.div
                            key={selected.circuitId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[800px] glass carbon-card rounded-2xl border border-white/10 p-6 shadow-[0_0_60px_rgba(0,0,0,0.8)] z-50"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-3xl font-black text-white font-f1 uppercase">{selected.circuitName}</h2>
                                    <p className="text-slate-400 mt-1">{getFlag(selected.country)} {selected.locality}, {selected.country}</p>
                                    {selected.raceName && <p className="text-sm text-[#00D2BE] font-f1 uppercase tracking-widest mt-2">{selected.raceName}</p>}
                                </div>
                                <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-2xl">close</span>
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/5">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-f1 mb-1">Latitude</span>
                                    <span className="font-mono text-white">{selected.lat}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-f1 mb-1">Longitude</span>
                                    <span className="font-mono text-white">{selected.long}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-f1 mb-1">More Info</span>
                                    <a href={selected.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm font-mono">Wikipedia</a>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {filtered.length === 0 && (
                    <div className="text-center py-20 text-slate-500 font-mono uppercase tracking-widest">
                        No circuits match your search.
                    </div>
                )}
            </div>
        </div>
        </PageTransition>
    );
}
