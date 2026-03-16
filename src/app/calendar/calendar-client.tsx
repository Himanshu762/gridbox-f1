"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ComposableMap, Geographies, Geography, Marker, Line } from "react-simple-maps";
import { CountdownTimer } from "@/components/f1/countdown-timer";
import { PageTransition } from "@/components/ui/page-transition";
import { TRACK_MAPS } from "@/lib/api/assets";

interface Session {
    date: string;
    time: string;
    type: string;
}

interface Race {
    id: string;
    round: string;
    raceName: string;
    country: string;
    location: string;
    date: string;
    time: string;
    dateStart: string;
    status: 'completed' | 'next' | 'upcoming';
    coordinates: [number, number]; // [lon, lat] for d3 geo
    circuitId: string;
    hasSprint: boolean;
    sessions: Session[];
}

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

function processSchedule(apiData: any[]): Race[] {
    if (!Array.isArray(apiData)) return [];
    const now = new Date();
    let nextFound = false;

    return apiData.filter((r: any) => r && r.round && r.date && r.Circuit?.Location).map((r: any) => {
        const raceDate = new Date(r.date + "T" + (r.time || "00:00:00Z"));
        let status: 'completed' | 'next' | 'upcoming' = 'upcoming';

        if (raceDate < now) {
            status = 'completed';
        } else if (!nextFound) {
            status = 'next';
            nextFound = true;
        }

        const sessions: Session[] = [];
        if (r.FirstPractice) sessions.push({ type: 'FP1', date: r.FirstPractice.date, time: r.FirstPractice.time });
        if (r.SecondPractice) sessions.push({ type: 'FP2', date: r.SecondPractice.date, time: r.SecondPractice.time });
        if (r.ThirdPractice) sessions.push({ type: 'FP3', date: r.ThirdPractice.date, time: r.ThirdPractice.time });
        if (r.Sprint) sessions.push({ type: 'Sprint', date: r.Sprint.date, time: r.Sprint.time });
        if (r.Qualifying) sessions.push({ type: 'Qualifying', date: r.Qualifying.date, time: r.Qualifying.time });
        sessions.push({ type: 'Race', date: r.date, time: r.time });

        return {
            id: r.round,
            round: r.round,
            raceName: r.raceName,
            country: r.Circuit.Location.country,
            location: r.Circuit.Location.locality,
            date: raceDate.toISOString(),
            dateStart: sessions[0]?.date || r.date,
            time: r.time,
            status,
            coordinates: [parseFloat(r.Circuit.Location.long), parseFloat(r.Circuit.Location.lat)],
            circuitId: r.Circuit.circuitId || '',
            hasSprint: !!r.Sprint,
            sessions: sessions.sort((a, b) => new Date(`${a.date}T${a.time || '00:00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00:00'}`).getTime())
        };
    });
}

interface CalendarClientProps {
    initialSchedule: any[];
}

export default function CalendarClient({ initialSchedule }: CalendarClientProps) {
    const processedRaces = processSchedule(initialSchedule);
    const initialNextRace = processedRaces.find(r => r.status === 'next') || processedRaces[processedRaces.length - 1] || null;

    const [races] = useState<Race[]>(processedRaces);
    const [selectedRace, setSelectedRace] = useState<Race | null>(initialNextRace);
    const [hoveredRace, setHoveredRace] = useState<Race | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const setCardRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
        cardRefs.current[id] = el;
    }, []);

    // Auto-scroll horizontally to the "next" race on mount
    useEffect(() => {
        if (scrollRef.current && initialNextRace) {
            setTimeout(() => {
                const el = cardRefs.current[initialNextRace.id];
                if (el && scrollRef.current) {
                    scrollRef.current.scrollTo({
                        left: el.offsetLeft - scrollRef.current.clientWidth / 2 + el.clientWidth / 2,
                        behavior: 'smooth'
                    });
                }
            }, 600);
        }
    }, []);

    const completedCount = processedRaces.filter(r => r.status === 'completed').length;
    const nextRace = processedRaces.find(r => r.status === 'next');

    return (
        <PageTransition>
        <div className="bg-transparent font-display pb-0 min-h-screen">

            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] pointer-events-none -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-[#27F4D2]/10 rounded-full blur-[150px] pointer-events-none translate-y-1/2" />

            <div className="max-w-[1800px] mx-auto w-full px-4 md:px-8 lg:px-12 flex flex-col relative z-10 pb-12">

                {/* Header */}
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    className="mb-6"
                >
                    <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-white m-0 leading-none drop-shadow-2xl font-f1 italic text-glow-primary transform -skew-x-6">
                        CALENDAR <span className="text-primary font-light">2026</span>
                    </h1>
                    <div className="flex flex-col gap-3 mt-4 max-w-7xl">
                        <div className="flex justify-between items-center">
                            <span className="text-lg text-slate-400 font-light tracking-wide glass p-3 rounded-lg border-l-2 border-[#00D2BE]">The definitive record of the World Championship tour.</span>
                            <span className="text-sm border border-slate-700 rounded-full px-4 py-1 flex items-center gap-2 bg-black/40 backdrop-blur-md hidden sm:flex"><div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(225,6,0,1)] animate-pulse-fast"/> LIVE TRACKING</span>
                        </div>
                        {/* Season Progress Bar */}
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-f1 flex-none">Season</span>
                            <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(completedCount / races.length) * 100}%` }}
                                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary/50"
                                />
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 flex-none">{completedCount}/{races.length}</span>
                        </div>
                    </div>
                </motion.div>

                {/* ===== MAP ROW: Full-width Map + Session Card ===== */}
                <div className="flex flex-col xl:flex-row gap-6 mb-8">

                    {/* ENLARGED MAP */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="glass carbon-card w-full xl:flex-1 overflow-hidden relative border border-white/5 rounded-3xl min-h-[400px] md:min-h-[520px]"
                    >
                        {/* Map Header */}
                        <div className="absolute top-5 left-6 z-20 pointer-events-none">
                            <h3 className="text-xl font-black uppercase tracking-widest text-[#27F4D2] drop-shadow-lg font-f1">GLOBAL CIRCUIT MAP</h3>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-f1 mt-0.5">{completedCount} of {races.length} completed</p>
                        </div>

                        {/* Legend */}
                        <div className="absolute top-5 right-6 z-20 flex gap-3 pointer-events-none">
                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-primary" /><span className="text-[9px] text-slate-400 font-f1 uppercase">Completed</span></div>
                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" /><span className="text-[9px] text-slate-400 font-f1 uppercase">Next</span></div>
                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#555]" /><span className="text-[9px] text-slate-400 font-f1 uppercase">Upcoming</span></div>
                        </div>

                        <ComposableMap
                            projection="geoMercator"
                            projectionConfig={{ scale: 155, center: [10, 25] }}
                            className="w-full h-full object-cover opacity-90"
                            style={{ minHeight: '400px' }}
                        >
                            <Geographies geography={geoUrl}>
                                {({ geographies }) =>
                                    geographies.map((geo) => (
                                        <Geography
                                            key={geo.rsmKey}
                                            geography={geo}
                                            fill="#1e1e2a"
                                            stroke="#ffffff"
                                            strokeWidth={0.3}
                                            strokeOpacity={0.12}
                                            style={{ default: { outline: "none" }, hover: { outline: "none", fill: "#2a2a3a" }, pressed: { outline: "none" } }}
                                        />
                                    ))
                                }
                            </Geographies>

                            {/* Connection Lines */}
                            {races.map((r, i) => {
                                if (i === races.length - 1) return null;
                                const nextR = races[i+1];
                                const isPastLine = r.status === 'completed' && nextR.status === 'completed';
                                return (
                                    <Line
                                        key={`line-${i}`}
                                        from={r.coordinates}
                                        to={nextR.coordinates}
                                        stroke={isPastLine ? "#E10600" : "#ffffff"}
                                        strokeOpacity={isPastLine ? 0.2 : 0.06}
                                        strokeWidth={isPastLine ? 1.5 : 0.8}
                                        strokeDasharray={isPastLine ? undefined : "4 4"}
                                    />
                                );
                            })}

                            {/* Markers with always-visible labels */}
                            {races.map((r) => {
                                const isSelected = selectedRace?.id === r.id;
                                const isNext = r.status === 'next';
                                const isPast = r.status === 'completed';

                                let fillColor = "#555";
                                let dotRadius = 3.5;
                                if (isPast) fillColor = "#E10600";
                                if (isSelected) { fillColor = "#ffffff"; dotRadius = 5; }
                                if (isNext) { fillColor = "#E10600"; dotRadius = 5.5; }

                                const isHovered = hoveredRace?.id === r.id;
                                const raceTime = r.time ? new Date(`2000-01-01T${r.time}`).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : '--:--';

                                return (
                                    <Marker
                                        key={r.id}
                                        coordinates={r.coordinates}
                                        onClick={() => setSelectedRace(r)}
                                        onMouseEnter={() => setHoveredRace(r)}
                                        onMouseLeave={() => setHoveredRace(null)}
                                        className="cursor-pointer focus:outline-none"
                                    >
                                        {/* Beacon pulse for "next" race */}
                                        {isNext && (
                                            <>
                                                <circle r="14" fill="none" stroke="#E10600" strokeWidth="1" opacity="0.5" className="animate-ping origin-center" />
                                                <circle r="9" fill="rgba(225,6,0,0.12)" />
                                            </>
                                        )}
                                        {/* Selected ring */}
                                        {isSelected && !isNext && (
                                            <circle r="10" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" className="animate-ping origin-center" />
                                        )}
                                        {/* Glow ring */}
                                        <circle r={dotRadius + 2} fill="none" stroke={fillColor} strokeWidth="0.5" opacity={isSelected || isNext ? 0.5 : 0.15} />
                                        {/* Main dot */}
                                        <circle r={dotRadius} fill={fillColor} className="transition-all duration-300" />
                                        {/* Checkmark for completed */}
                                        {isPast && !isSelected && (
                                            <text textAnchor="middle" y="2.5" fill="white" fontSize="5" fontWeight="bold">✓</text>
                                        )}

                                        {/* Always-visible label */}
                                        <text
                                            textAnchor="middle"
                                            y={-10}
                                            fill={isSelected ? '#ffffff' : isNext ? '#E10600' : isPast ? '#999' : '#bbb'}
                                            fontSize={isSelected || isNext ? "7" : "5.5"}
                                            fontWeight={isSelected || isNext ? "900" : "600"}
                                            fontFamily="system-ui, sans-serif"
                                            className="pointer-events-none select-none uppercase"
                                            style={{ letterSpacing: '0.5px', textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)' }}
                                        >
                                            {r.country.length > 12 ? r.country.substring(0, 10) + '…' : r.country}
                                        </text>
                                        {/* Round number below */}
                                        <text
                                            textAnchor="middle"
                                            y={dotRadius + 10}
                                            fill={isSelected ? '#fff' : '#666'}
                                            fontSize="4"
                                            fontWeight="700"
                                            fontFamily="system-ui, sans-serif"
                                            className="pointer-events-none select-none"
                                        >
                                            R{r.round}
                                        </text>

                                        {/* Hover tooltip popup */}
                                        {isHovered && !isSelected && (
                                            <foreignObject x={12} y={-70} width={220} height={110} className="pointer-events-none overflow-visible">
                                                <div className="bg-[#111118]/95 backdrop-blur-xl rounded-xl p-3 border border-white/10 shadow-2xl text-white text-xs" style={{ fontFamily: 'system-ui, sans-serif' }}>
                                                    <div className="flex justify-between items-start gap-2">
                                                        <div className="min-w-0">
                                                            <div className="font-bold text-sm uppercase truncate" style={{ fontFamily: 'var(--font-f1-display)' }}>{r.country}</div>
                                                            <div className="text-slate-400 text-[10px] truncate">{r.raceName}</div>
                                                        </div>
                                                        <div className="text-right flex-shrink-0">
                                                            <div className="text-sm font-bold font-mono">{raceTime}</div>
                                                            <div className="text-[10px] text-slate-500">UTC</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1.5 mt-2 flex-wrap">
                                                        {r.sessions.map((s, si) => (
                                                            <span key={si} className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${s.type === 'Race' ? 'bg-[#E10600]/20 text-[#E10600]' : s.type === 'Sprint' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-white/5 text-slate-400'}`}>
                                                                {s.type}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    {isPast && (
                                                        <div className="flex items-center gap-1 mt-2 text-green-500 text-[10px] font-bold">
                                                            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>sports_score</span>
                                                            Race Complete
                                                        </div>
                                                    )}
                                                </div>
                                            </foreignObject>
                                        )}
                                    </Marker>
                                );
                            })}
                        </ComposableMap>
                    </motion.div>

                    {/* SESSION DETAIL + COUNTDOWN PANEL (right side) */}
                    <AnimatePresence mode="wait">
                        {selectedRace && (
                            <motion.div
                                key={selectedRace.id}
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.4 }}
                                className="xl:w-[420px] xl:shrink-0 glass carbon-card border border-white/5 shadow-2xl rounded-3xl relative overflow-hidden flex flex-col"
                            >
                                {/* Top accent bar */}
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/50 to-transparent z-10" />
                                {/* Status glow */}
                                {selectedRace.status === 'next' && (
                                    <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-primary/10 rounded-full blur-[60px] pointer-events-none" />
                                )}
                                {selectedRace.status === 'completed' && (
                                    <span className="material-symbols-outlined absolute top-16 right-4 text-white/[0.03] text-[120px] pointer-events-none select-none">sports_score</span>
                                )}

                                {/* Race Info Header */}
                                <div className="p-6 pb-4">
                                    <div className="flex items-start justify-between mb-1">
                                        <span className="text-xs font-bold text-primary uppercase tracking-widest font-f1">Round {selectedRace.round}</span>
                                        {selectedRace.status === 'completed' && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 font-f1 uppercase tracking-widest">
                                                <span className="material-symbols-outlined text-xs">check_circle</span> Complete
                                            </span>
                                        )}
                                        {selectedRace.status === 'next' && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-primary font-f1 uppercase tracking-widest animate-pulse">
                                                <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(225,6,0,1)]" /> Up Next
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-3xl xl:text-4xl font-black uppercase tracking-tight leading-none drop-shadow-lg font-f1">{selectedRace.country}</h2>
                                    <span className="text-slate-400 text-sm mt-1 font-light font-f1 tracking-wider block">{selectedRace.location} — {selectedRace.raceName}</span>
                                </div>

                                {/* Track Silhouette */}
                                {TRACK_MAPS[selectedRace.circuitId] && (
                                    <div className="mx-6 mb-4 rounded-2xl bg-black/30 border border-white/5 flex items-center justify-center p-5">
                                        <div className="relative w-full h-[120px] flex items-center justify-center">
                                            <img
                                                src={TRACK_MAPS[selectedRace.circuitId]}
                                                alt={`${selectedRace.country} circuit layout`}
                                                className="max-h-full max-w-full object-contain opacity-70 drop-shadow-[0_0_20px_rgba(225,6,0,0.2)]"
                                                draggable={false}
                                            />
                                            <span className="absolute bottom-0 right-0 text-[8px] text-slate-600 font-f1 uppercase tracking-widest">Circuit Layout</span>
                                        </div>
                                    </div>
                                )}

                                {/* Countdown or Date */}
                                <div className="px-6 pb-5 border-b border-white/5">
                                    {selectedRace.status === 'next' ? (
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-f1 block mb-3">Lights Out In</span>
                                            <div className="scale-[0.75] origin-top-left -mb-4">
                                                <CountdownTimer targetDate={new Date(selectedRace.date)} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-f1 block mb-1">Race Date</span>
                                            <span className="text-xl font-light text-white font-f1 tracking-wider">{new Date(selectedRace.date).toLocaleDateString("en-GB", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Session Schedule */}
                                <div className="flex-1 p-6 pt-4 flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-f1 mb-3">Session Schedule</span>
                                    <div className="flex flex-col gap-2 flex-1 overflow-y-auto hide-scrollbar">
                                        {selectedRace.sessions.map((session, sidx) => {
                                            const sessionTime = session.time ? new Date(`2000-01-01T${session.time}`).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : '--:--';
                                            const isRace = session.type === 'Race';
                                            const isSprint = session.type === 'Sprint';
                                            const sessionDate = new Date(`${session.date}T12:00:00Z`);
                                            const dayStr = sessionDate.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase();
                                            const dateStr = sessionDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

                                            return (
                                                <motion.div
                                                    key={sidx}
                                                    initial={{ opacity: 0, x: 10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: sidx * 0.05 }}
                                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isRace ? 'bg-primary/10 border-primary/30' : isSprint ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-white/[0.02] border-white/5'}`}
                                                >
                                                    {/* Day column */}
                                                    <div className="flex flex-col items-center w-10 flex-shrink-0">
                                                        <span className="text-[9px] font-bold text-slate-500 font-f1">{dayStr}</span>
                                                        <span className="text-lg font-black text-white font-f1 leading-none">{sessionDate.getDate()}</span>
                                                    </div>

                                                    <div className={`w-0.5 h-8 rounded-full flex-shrink-0 ${isRace ? 'bg-primary' : isSprint ? 'bg-yellow-500' : 'bg-white/10'}`} />

                                                    {/* Session name */}
                                                    <div className="flex-1 min-w-0">
                                                        <span className={`text-xs font-bold uppercase tracking-widest font-f1 ${isRace ? 'text-primary' : isSprint ? 'text-yellow-400' : 'text-slate-300'}`}>{session.type}</span>
                                                        <span className="text-[10px] text-slate-500 block">{dateStr}</span>
                                                    </div>

                                                    {/* Time */}
                                                    <div className="text-right flex-shrink-0">
                                                        <span className="font-mono text-sm font-bold text-white">{sessionTime}</span>
                                                        <span className="text-[9px] text-slate-600 block uppercase">UTC</span>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Sprint badge */}
                                {selectedRace.hasSprint && (
                                    <div className="px-6 pb-4">
                                        <span className="bg-[#f4d125]/15 text-[#f4d125] border border-[#f4d125]/30 text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full font-f1">Sprint Weekend</span>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ===== HORIZONTAL SCROLLING RACE CARDS ===== */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-black uppercase tracking-widest text-slate-300 font-f1 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-xl">calendar_month</span>
                            All {races.length} Races
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => scrollRef.current?.scrollBy({ left: -340, behavior: 'smooth' })}
                                className="w-8 h-8 rounded-lg glass border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/30 transition-all"
                                aria-label="Scroll left"
                            >
                                <span className="material-symbols-outlined text-lg">chevron_left</span>
                            </button>
                            <button
                                onClick={() => scrollRef.current?.scrollBy({ left: 340, behavior: 'smooth' })}
                                className="w-8 h-8 rounded-lg glass border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/30 transition-all"
                                aria-label="Scroll right"
                            >
                                <span className="material-symbols-outlined text-lg">chevron_right</span>
                            </button>
                        </div>
                    </div>

                    <div className="relative">
                        {/* Fade edges */}
                        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black/80 to-transparent z-10 pointer-events-none rounded-l-2xl" />
                        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black/80 to-transparent z-10 pointer-events-none rounded-r-2xl" />

                        <div
                            ref={scrollRef}
                            className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 px-2 scroll-smooth"
                        >
                            {races.map((r, i) => {
                                const isSelected = selectedRace?.id === r.id;
                                const isNext = r.status === 'next';
                                const isPast = r.status === 'completed';
                                const raceDate = new Date(r.date);
                                const day = raceDate.toLocaleDateString('en-GB', { day: 'numeric' });
                                const month = raceDate.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();

                                return (
                                    <motion.div
                                        key={r.id}
                                        ref={setCardRef(r.id)}
                                        onClick={() => setSelectedRace(r)}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: Math.min(i * 0.03, 0.5), duration: 0.4 }}
                                        className={`relative flex-shrink-0 w-[200px] cursor-pointer rounded-2xl border transition-all duration-300 overflow-hidden group
                                            ${isSelected
                                                ? 'bg-white/10 border-white/30 shadow-2xl shadow-white/5 scale-[1.03]'
                                                : isNext
                                                    ? 'glass border-primary/40 hover:border-primary/60 shadow-lg shadow-primary/10'
                                                    : isPast
                                                        ? 'glass border-white/5 opacity-70 hover:opacity-100'
                                                        : 'glass border-white/5 hover:border-white/15 hover:bg-white/5'
                                            }`}
                                    >
                                        {/* Top accent */}
                                        <div className={`h-1 w-full ${isNext ? 'bg-gradient-to-r from-primary to-primary/50' : isSelected ? 'bg-white/40' : isPast ? 'bg-primary/30' : 'bg-transparent'}`} />

                                        {/* Checkered flag watermark for completed */}
                                        {isPast && (
                                            <span className="material-symbols-outlined absolute bottom-1 right-1 text-white/[0.03] text-5xl pointer-events-none select-none">sports_score</span>
                                        )}

                                        <div className="p-4 relative z-10">
                                            {/* Round + Date row */}
                                            <div className="flex items-start justify-between mb-3">
                                                <span className="text-[10px] font-bold text-slate-500 font-f1 uppercase tracking-widest">R{String(r.round).padStart(2, '0')}</span>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-lg font-black text-white font-f1 leading-none">{day}</span>
                                                    <span className="text-[10px] font-bold text-slate-500 font-f1">{month}</span>
                                                </div>
                                            </div>

                                            {/* Country */}
                                            <h4 className={`text-base font-black uppercase tracking-tight leading-tight font-f1 mb-1 ${isNext ? 'text-primary' : 'text-white'} group-hover:text-primary transition-colors`}>
                                                {r.country}
                                            </h4>
                                            <span className="text-[10px] text-slate-500 block truncate">{r.location}</span>

                                            {/* Tags */}
                                            <div className="flex gap-1.5 mt-3 flex-wrap">
                                                {r.hasSprint && (
                                                    <span className="bg-[#f4d125]/15 text-[#f4d125] border border-[#f4d125]/30 text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded">Sprint</span>
                                                )}
                                                {isPast && (
                                                    <span className="flex items-center gap-0.5 text-[8px] font-bold text-green-500/70 font-f1 uppercase">
                                                        <span className="material-symbols-outlined text-[10px]">check_circle</span> Done
                                                    </span>
                                                )}
                                                {isNext && (
                                                    <span className="flex items-center gap-0.5 text-[8px] font-bold text-primary font-f1 uppercase animate-pulse">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(225,6,0,1)]" /> Next
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>

            </div>
        </div>
        </PageTransition>
    );
}
