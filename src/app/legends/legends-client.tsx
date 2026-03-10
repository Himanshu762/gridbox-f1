"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchTeamRadio, fetchRaceControl, fetchLiveDrivers, fetchLiveSession } from "@/lib/api/openf1";
import type { OpenF1TeamRadio, OpenF1RaceControl, OpenF1Driver, OpenF1Session } from "@/lib/api/openf1";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { PageTransition } from "@/components/ui/page-transition";

type FeedItem = {
    type: "radio" | "rc";
    date: string;
    driverNumber?: number;
    message?: string;
    audioUrl?: string;
    category?: string;
    flag?: string;
    lapNumber?: number;
};

export default function LegendsClient() {
    const [feed, setFeed] = useState<FeedItem[]>([]);
    const [drivers, setDrivers] = useState<OpenF1Driver[]>([]);
    const [session, setSession] = useState<OpenF1Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<"all" | "radio" | "rc">("all");
    const [playingUrl, setPlayingUrl] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const loadData = useCallback(async () => {
        setError(null);
        try {
            const [radioData, rcData, driverData, sessionData] = await Promise.all([
                fetchTeamRadio(),
                fetchRaceControl(),
                fetchLiveDrivers(),
                fetchLiveSession(),
            ]);

            setDrivers(driverData);
            setSession(sessionData);

            const radioItems: FeedItem[] = radioData.map(r => ({
                type: "radio" as const,
                date: r.date,
                driverNumber: r.driver_number,
                audioUrl: r.recording_url,
            }));

            const rcItems: FeedItem[] = rcData.map(r => ({
                type: "rc" as const,
                date: r.date,
                message: r.message,
                category: r.category,
                flag: r.flag,
                driverNumber: r.driver_number,
                lapNumber: r.lap_number,
            }));

            const combined = [...radioItems, ...rcItems].sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            setFeed(combined);
            setIsLoading(false);
        } catch (err) {
            setError("Failed to load radio feed.");
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 10000);
        return () => clearInterval(interval);
    }, [loadData]);

    const getDriverInfo = (num?: number) => {
        if (!num) return { acronym: "FIA", color: "#e10600", team: "Race Control" };
        const d = drivers.find(drv => drv.driver_number === num);
        return {
            acronym: d?.name_acronym || `#${num}`,
            color: d?.team_colour ? `#${d.team_colour}` : "#ffffff",
            team: d?.team_name || "Unknown",
        };
    };

    const playAudio = (url: string) => {
        if (playingUrl === url) {
            audioRef.current?.pause();
            setPlayingUrl(null);
            return;
        }
        if (audioRef.current) {
            audioRef.current.pause();
        }
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.play().catch(() => {});
        audio.onended = () => setPlayingUrl(null);
        audio.onerror = () => setPlayingUrl(null);
        setPlayingUrl(url);
    };

    useEffect(() => {
        return () => {
            audioRef.current?.pause();
        };
    }, []);

    const getFlagColor = (flag?: string) => {
        if (!flag) return "text-slate-300";
        if (flag === "RED") return "text-red-500";
        if (flag === "YELLOW" || flag === "DOUBLE YELLOW") return "text-yellow-500";
        if (flag === "GREEN") return "text-green-500";
        if (flag === "BLUE") return "text-blue-500";
        if (flag === "CHEQUERED") return "text-white";
        return "text-slate-300";
    };

    const filteredFeed = filter === "all" ? feed : feed.filter(f => f.type === filter);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center font-display gap-6">
                <div className="relative flex h-8 w-8">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-8 w-8 bg-primary" />
                </div>
                <p className="text-white font-mono tracking-widest animate-pulse">SCANNING RADIO FREQUENCIES...</p>
            </div>
        );
    }

    if (error) return <ErrorState icon="wifi_off" message={error} onRetry={() => { setError(null); loadData(); }} />;

    return (
        <PageTransition>
        <div className="font-display pb-12 relative overflow-hidden">
            <div className="absolute top-0 left-[30%] w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] pointer-events-none -translate-y-1/2" />

            <div className="max-w-[1200px] mx-auto w-full px-4 md:px-8 relative z-10">

                {/* Header */}
                <PageHeader variant="panel" title="TEAM RADIO & RACE CONTROL" />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
                    <p className="text-slate-400 font-mono tracking-wider uppercase text-sm">
                        {session?.session_name || "SESSION"} • {session?.circuit_short_name || "CIRCUIT"} • {session?.country_name || ""}
                    </p>

                    {/* Filter Tabs */}
                    <div className="flex bg-[#111]/80 backdrop-blur-md p-1 rounded-xl border border-white/10" role="tablist">
                        {(["all", "radio", "rc"] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                role="tab"
                                aria-selected={filter === f}
                                className={`px-5 py-2 rounded-lg font-bold uppercase tracking-widest text-xs transition-all duration-300 font-f1 ${filter === f ? 'bg-primary text-white shadow-[0_0_15px_rgba(225,6,0,0.5)]' : 'text-slate-400 hover:text-white'}`}
                            >
                                {f === "all" ? "ALL" : f === "radio" ? "RADIO" : "CONTROL"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="flex gap-4 mb-6">
                    <div className="glass rounded-lg px-4 py-2 border border-white/5 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-[#00D2BE]">headphones</span>
                        <span className="text-xs font-mono text-slate-400">{feed.filter(f => f.type === "radio").length} Radio Clips</span>
                    </div>
                    <div className="glass rounded-lg px-4 py-2 border border-white/5 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-primary">flag</span>
                        <span className="text-xs font-mono text-slate-400">{feed.filter(f => f.type === "rc").length} RC Messages</span>
                    </div>
                </div>

                {/* Feed */}
                <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto hide-scrollbar pr-2">
                    <AnimatePresence>
                        {filteredFeed.length > 0 ? filteredFeed.map((item, i) => {
                            const driver = getDriverInfo(item.driverNumber);
                            const time = new Date(item.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' });

                            return (
                                <motion.div
                                    key={`${item.type}-${item.date}-${i}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: Math.min(i * 0.03, 0.5), duration: 0.3 }}
                                    className={`glass rounded-xl border p-4 flex items-center gap-4 group hover:bg-white/5 transition-all ${item.type === "radio" ? 'border-[#00D2BE]/20 hover:border-[#00D2BE]/40' : 'border-white/5 hover:border-white/20'}`}
                                >
                                    {/* Type Icon */}
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${item.type === "radio" ? 'bg-[#00D2BE]/10' : 'bg-primary/10'}`}>
                                        <span className={`material-symbols-outlined text-lg ${item.type === "radio" ? 'text-[#00D2BE]' : 'text-primary'}`}>
                                            {item.type === "radio" ? "headphones" : "flag"}
                                        </span>
                                    </div>

                                    {/* Driver Badge */}
                                    <div className="flex items-center gap-2 min-w-[80px]">
                                        <div className="w-1 h-8 rounded-full" style={{ backgroundColor: driver.color }} />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-white font-f1 uppercase">{driver.acronym}</span>
                                            <span className="text-[10px] text-slate-500 font-mono">{driver.team}</span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        {item.type === "radio" ? (
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => item.audioUrl && playAudio(item.audioUrl)}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-sm font-bold font-f1 uppercase tracking-wider ${playingUrl === item.audioUrl ? 'bg-[#00D2BE]/20 border-[#00D2BE] text-[#00D2BE] shadow-[0_0_15px_rgba(0,210,190,0.3)]' : 'bg-black/40 border-white/10 text-slate-300 hover:bg-[#00D2BE]/10 hover:border-[#00D2BE]/40'}`}
                                                >
                                                    <span className="material-symbols-outlined text-lg">
                                                        {playingUrl === item.audioUrl ? "stop" : "play_arrow"}
                                                    </span>
                                                    {playingUrl === item.audioUrl ? "PLAYING" : "PLAY RADIO"}
                                                </button>
                                            </div>
                                        ) : (
                                            <p className={`text-sm font-medium truncate ${getFlagColor(item.flag)}`}>
                                                {item.flag && <span className="font-bold mr-2">[{item.flag}]</span>}
                                                {item.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Metadata */}
                                    <div className="flex flex-col items-end flex-shrink-0 gap-1">
                                        <span className="text-xs font-mono text-slate-600">{time} UTC</span>
                                        {item.lapNumber && <span className="text-[10px] font-mono text-slate-700">L{item.lapNumber}</span>}
                                    </div>
                                </motion.div>
                            );
                        }) : (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                                <span className="material-symbols-outlined text-5xl mb-4 text-slate-700">radio</span>
                                <p className="font-mono uppercase tracking-widest text-sm">No {filter === "all" ? "feed" : filter} data available for this session.</p>
                                <p className="text-xs text-slate-700 mt-2 font-mono">Data is available during and shortly after live sessions.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
        </PageTransition>
    );
}
