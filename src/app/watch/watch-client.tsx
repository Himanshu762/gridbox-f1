"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Hls from "hls.js";
import { PageTransition } from "@/components/ui/page-transition";

interface Channel {
    name: string;
    url: string;
    logo: string;
    group: string;
    type?: "hls" | "iframe";
}

// F1 Stream Channels — VipLeague Links & Dedicated Players
const CHANNELS: Channel[] = [
    // VipLeague Streams (Web Players)
    { name: "Sky Sports F1 HD", url: "https://videocdn-4726.website/shopping2/?channel_id=sky_sport_f1_uk", logo: "https://i.ibb.co/h26bK2Q/sky-f1.png", group: "Web Players", type: "iframe" },
    { name: "Sky Sports F1 HD (Alt)", url: "https://westreamf1.com/westreamf1.php", logo: "https://i.ibb.co/h26bK2Q/sky-f1.png", group: "Web Players", type: "iframe" }
];

export default function WatchClient() {
    const [hasAgreed, setHasAgreed] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [streamError, setStreamError] = useState<string | null>(null);
    const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
    const [customUrl, setCustomUrl] = useState('');

    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Prefer Cloudflare Worker proxy (free unlimited bandwidth) over Vercel /api/stream
    const proxyBase = process.env.NEXT_PUBLIC_STREAM_PROXY_URL || '/api/stream';
    const streamUrl = activeChannel
        ? (activeChannel.type === 'iframe' ? activeChannel.url : `${proxyBase}?url=${encodeURIComponent(activeChannel.url)}`)
        : customUrl
            ? `${proxyBase}?url=${encodeURIComponent(customUrl)}`
            : '';

    // HLS stream engine with auto-reconnect
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !streamUrl) return;

        let cancelled = false;
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
        let reconnectAttempts = 0;
        const MAX_RECONNECTS = 8;

        function destroyPlayer() {
            if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
            if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
        }

        destroyPlayer();
        setStreamError(null);
        setIsPlaying(false);

        function scheduleReconnect() {
            if (cancelled || reconnectAttempts >= MAX_RECONNECTS) {
                if (!cancelled) setStreamError('Stream disconnected after multiple retries. Click RETRY.');
                return;
            }
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts - 1), 8000);
            reconnectTimer = setTimeout(() => { if (!cancelled) startHLS(); }, delay);
        }

        function startHLS() {
            if (cancelled || !Hls.isSupported() || !video || activeChannel?.type === 'iframe') return;

            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: false,
                fragLoadingMaxRetry: 6,
                manifestLoadingMaxRetry: 4,
                levelLoadingMaxRetry: 4,
                fragLoadingRetryDelay: 1000,
                manifestLoadingRetryDelay: 1000,
                maxBufferLength: 60,
                maxMaxBufferLength: 120,
                liveSyncDurationCount: 4,
                liveMaxLatencyDurationCount: 10,
                backBufferLength: 30,
            });

            hls.loadSource(streamUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                reconnectAttempts = 0;
                video.play().then(() => setIsPlaying(true)).catch(() => { });
            });

            hls.on(Hls.Events.ERROR, (_event, data) => {
                if (!data.fatal) return;

                if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                    hls.recoverMediaError();
                    return;
                }

                hls.destroy();
                hlsRef.current = null;
                scheduleReconnect();
            });

            hlsRef.current = hls;
        }

        // Stall detection
        let stallCount = 0;
        function onStalled() {
            stallCount++;
            if (stallCount >= 3) {
                stallCount = 0;
                destroyPlayer();
                scheduleReconnect();
            }
        }
        function onPlaying() { stallCount = 0; setIsPlaying(true); }

        video.addEventListener('stalled', onStalled);
        video.addEventListener('playing', onPlaying);

        startHLS();

        return () => {
            cancelled = true;
            video.removeEventListener('stalled', onStalled);
            video.removeEventListener('playing', onPlaying);
            destroyPlayer();
        };
    }, [streamUrl]);

    function playChannel(ch: Channel) {
        setActiveChannel(ch);
        setCustomUrl('');
        setStreamError(null);
        setIsPlaying(false);
    }

    function playCustomUrl() {
        if (!customUrl.trim()) return;
        setActiveChannel(null);
        setStreamError(null);
        setIsPlaying(false);
    }

    const retryStream = useCallback(() => {
        setStreamError(null);
        setIsPlaying(false);
        const currentChannel = activeChannel;
        setActiveChannel(null);
        setTimeout(() => setActiveChannel(currentChannel), 50);
    }, [activeChannel]);

    if (!isMounted) return null;

    return (
        <PageTransition>
            <div className="font-display pb-12 overflow-hidden relative">

                {/* Disclaimer Modal */}
                <AnimatePresence>
                    {!hasAgreed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        >
                            <div className="max-w-xl w-full glass carbon-card border border-white/10 rounded-2xl p-8 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 shimmer-gold" />

                                <h2 className="text-3xl font-black text-white font-f1 mb-4 uppercase tracking-tighter">
                                    LEGAL <span className="text-primary italic">DISCLAIMER</span>
                                </h2>

                                <p className="text-slate-300 font-mono text-sm leading-relaxed mb-6 whitespace-pre-line">
                                    This platform acts exclusively as a passive aggregator UI. We do not host, store, re-broadcast, or administrate any video streams.
                                    {"\n\n"}
                                    Stream stability and availability depend entirely on the third-party provider. By clicking Agree, you acknowledge that you are consuming third-party streams that we have zero affiliation with.
                                </p>

                                <button
                                    onClick={() => setHasAgreed(true)}
                                    className="w-full py-4 bg-primary hover:bg-red-700 text-white font-f1 font-bold tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(225,6,0,0.4)] rounded-lg"
                                >
                                    I AGREE, CONTINUE
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="max-w-[1800px] mx-auto w-full px-4 md:px-8 relative z-10">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4 glass p-6 rounded-2xl border border-white/10 carbon-card">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary shadow-[0_0_10px_#e10600]" />
                                </div>
                                <h1 className="text-4xl font-black uppercase text-white font-f1 tracking-tighter drop-shadow-md">
                                    WATCH <span className="text-slate-400 italic border-l-2 border-slate-600 pl-3 ml-2">LIVE</span>
                                </h1>
                            </div>
                            <p className="text-slate-400 font-mono tracking-wider ml-6 uppercase text-sm">SKY SPORTS F1 • HLS STREAMING</p>
                        </div>

                        {/* Custom URL */}
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Paste .m3u8 stream URL..."
                                aria-label="Custom stream URL"
                                className="bg-black/60 border border-white/10 rounded-lg px-4 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:border-primary/50 focus:outline-none w-72"
                                value={customUrl}
                                onChange={(e) => setCustomUrl(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') playCustomUrl(); }}
                            />
                            <button
                                onClick={playCustomUrl}
                                className="px-4 py-2.5 bg-primary/20 border border-primary/40 text-primary font-f1 font-bold tracking-widest uppercase text-xs rounded-lg hover:bg-primary/30 transition-colors"
                            >
                                Play
                            </button>
                        </div>
                    </div>

                    {hasAgreed && (
                        <div className="flex flex-col xl:flex-row gap-6">

                            {/* VIDEO PLAYER */}
                            <div className="flex-1 min-w-0">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-full aspect-video rounded-xl overflow-hidden shadow-[0_0_50px_rgba(225,6,0,0.1)] bg-black border border-white/5 relative"
                                >
                                    {!streamUrl ? (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                                            <span className="material-symbols-outlined text-6xl text-slate-700">live_tv</span>
                                            <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">Select a channel to start watching</p>
                                        </div>
                                    ) : streamError ? (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                                            <span className="material-symbols-outlined text-5xl text-slate-500">signal_disconnected</span>
                                            <p className="text-slate-400 font-mono text-sm text-center px-8">Stream offline or geo-blocked.</p>
                                            <p className="text-slate-600 font-mono text-[10px] text-center px-8 max-w-md">{streamError}</p>
                                            <button
                                                onClick={retryStream}
                                                className="px-6 py-2 bg-primary/20 border border-primary/40 text-primary font-f1 font-bold tracking-widest uppercase text-sm rounded-lg hover:bg-primary/30 transition-colors"
                                            >
                                                RETRY
                                            </button>
                                        </div>
                                    ) : null}
                                    {activeChannel?.type === 'iframe' ? (
                                        <iframe
                                            src={activeChannel.url}
                                            className={`w-full h-full border-none ${!streamUrl || streamError ? 'hidden' : ''}`}
                                            allow="autoplay; fullscreen; encrypted-media"
                                            allowFullScreen
                                        />
                                    ) : (
                                        <video
                                            ref={videoRef}
                                            className={`w-full h-full ${!streamUrl || streamError ? 'hidden' : ''}`}
                                            controls
                                            autoPlay
                                            playsInline
                                        />
                                    )}
                                </motion.div>

                                {/* Now Playing Bar */}
                                {activeChannel && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-3 glass rounded-xl border border-white/10 p-4 flex items-center gap-4"
                                    >
                                        {activeChannel.logo && (
                                            <img src={activeChannel.logo} alt="" className="w-10 h-10 rounded-lg object-contain bg-white/10 p-1" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-f1 font-bold text-lg uppercase tracking-tight truncate">{activeChannel.name}</p>
                                            <p className="text-slate-500 text-xs font-mono uppercase">{activeChannel.group}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isPlaying && (
                                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-500 font-f1 uppercase tracking-widest">
                                                    <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse" /> Playing
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* CHANNEL LIST */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="xl:w-[400px] xl:shrink-0 flex flex-col glass rounded-xl border border-white/10 overflow-hidden"
                            >
                                {/* Header */}
                                <div className="flex items-center gap-2 px-4 py-3 bg-primary/5 border-b border-primary/20">
                                    <span className="material-symbols-outlined text-primary text-sm">sports_motorsports</span>
                                    <span className="text-[10px] font-f1 font-bold text-primary uppercase tracking-[0.2em]">F1 Live Channels</span>
                                </div>

                                {/* Channel List */}
                                <div className="flex-1 overflow-y-auto hide-scrollbar">
                                    {CHANNELS.map((ch, i) => {
                                        const isActive = activeChannel?.url === ch.url;
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => playChannel(ch)}
                                                className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-primary/10 text-left transition-all group ${isActive ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-primary/5 border-l-2 border-l-primary/30'}`}
                                            >
                                                {ch.logo ? (
                                                    <img src={ch.logo} alt="" className="w-9 h-9 rounded object-contain bg-white/10 p-0.5 flex-shrink-0" loading="lazy" />
                                                ) : (
                                                    <div className="w-9 h-9 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                        <span className="material-symbols-outlined text-primary text-sm">live_tv</span>
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-bold truncate font-f1 uppercase tracking-tight ${isActive ? 'text-primary' : 'text-white group-hover:text-primary'} transition-colors`}>{ch.name}</p>
                                                    <p className="text-[10px] text-primary/40 truncate font-mono">{ch.group} • HLS</p>
                                                </div>
                                                {isActive ? (
                                                    <div className="flex gap-0.5 items-center flex-shrink-0">
                                                        <div className="w-1 h-3 bg-primary rounded-full animate-pulse" />
                                                        <div className="w-1 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
                                                        <div className="w-1 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                                                    </div>
                                                ) : (
                                                    <span className="text-[9px] font-mono text-slate-600 uppercase flex-shrink-0">FHD</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </div>
            </div>
        </PageTransition>
    );
}
