"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { PageTransition } from "@/components/ui/page-transition";

interface NewsItem {
    title: string;
    link: string;
    description: string;
    pubDate: string;
    source: string;
}

type Tab = "headlines" | "reddit";

export default function NewsClient() {
    const [headlines, setHeadlines] = useState<NewsItem[]>([]);
    const [reddit, setReddit] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [tab, setTab] = useState<Tab>("headlines");
    const [sourceFilter, setSourceFilter] = useState<string>("all");

    useEffect(() => {
        let mounted = true;

        async function loadNews() {
            try {
                setError(null);
                const res = await fetch("/api/news");
                if (!res.ok) throw new Error("Failed");
                const data = await res.json();
                if (mounted) {
                    setHeadlines(data.headlines || []);
                    setReddit(data.reddit || []);
                }
            } catch (err) {
                if (mounted) setError("Failed to load news feed.");
            } finally {
                if (mounted) setIsLoading(false);
            }
        }

        loadNews();
        const interval = setInterval(loadNews, 300000); // 5 min
        return () => { mounted = false; clearInterval(interval); };
    }, [retryCount]);

    const sources = Array.from(new Set(headlines.map(h => h.source)));

    const filteredHeadlines = sourceFilter === "all"
        ? headlines
        : headlines.filter(h => h.source === sourceFilter);

    // Sanitize external links — only allow http(s) to prevent javascript: injection from RSS
    const isSafeUrl = (url: string) => /^https?:\/\//i.test(url);
    const activeItems = (tab === "headlines" ? filteredHeadlines : reddit).filter(item => isSafeUrl(item.link));

    const formatTimeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center font-display gap-6">
                <div className="relative flex h-8 w-8">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D2BE] opacity-75" />
                    <span className="relative inline-flex rounded-full h-8 w-8 bg-[#00D2BE]" />
                </div>
                <p className="text-white font-mono tracking-widest animate-pulse">FETCHING LATEST NEWS...</p>
            </div>
        );
    }

    if (error) return <ErrorState icon="wifi_off" message={error} onRetry={() => { setError(null); setIsLoading(true); setRetryCount(c => c + 1); }} />;

    return (
        <PageTransition>
        <div className="font-display pb-12 relative overflow-hidden">
            <div className="absolute top-0 left-[20%] w-[800px] h-[800px] bg-[#00D2BE]/5 rounded-full blur-[150px] pointer-events-none -translate-y-1/2" />

            <div className="max-w-[1200px] mx-auto w-full px-4 md:px-8 relative z-10">
                {/* Header */}
                <PageHeader title="NEWS" subtitle="FEED" />

                {/* Tabs + Source Filter */}
                <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8">
                    <div className="flex bg-[#111]/80 backdrop-blur-md p-1 rounded-xl border border-white/10" role="tablist">
                        <button
                            onClick={() => setTab("headlines")}
                            role="tab"
                            aria-selected={tab === "headlines"}
                            className={`px-6 py-2.5 rounded-lg font-bold uppercase tracking-widest text-xs transition-all font-f1 ${tab === "headlines" ? "bg-primary text-white shadow-[0_0_15px_rgba(225,6,0,0.5)]" : "text-slate-400 hover:text-white"}`}
                        >
                            <span className="material-symbols-outlined text-sm mr-1 align-middle">newspaper</span>
                            Headlines ({headlines.length})
                        </button>
                        <button
                            onClick={() => setTab("reddit")}
                            role="tab"
                            aria-selected={tab === "reddit"}
                            className={`px-6 py-2.5 rounded-lg font-bold uppercase tracking-widest text-xs transition-all font-f1 ${tab === "reddit" ? "bg-primary text-white shadow-[0_0_15px_rgba(225,6,0,0.5)]" : "text-slate-400 hover:text-white"}`}
                        >
                            <span className="material-symbols-outlined text-sm mr-1 align-middle">forum</span>
                            Reddit ({reddit.length})
                        </button>
                    </div>

                    {tab === "headlines" && sources.length > 1 && (
                        <select
                            value={sourceFilter}
                            onChange={e => setSourceFilter(e.target.value)}
                            aria-label="Filter by news source"
                            className="px-4 py-2 bg-black/60 border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-primary/50 cursor-pointer backdrop-blur-md appearance-none"
                        >
                            <option value="all">All Sources</option>
                            {sources.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    )}
                </div>

                {/* News Items */}
                <div className="space-y-3">
                    {activeItems.length > 0 ? activeItems.map((item, i) => (
                        <motion.a
                            key={`${item.link}-${i}`}
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03, duration: 0.3 }}
                            className="glass rounded-xl border border-white/5 p-5 flex flex-col sm:flex-row gap-4 hover:bg-white/5 hover:border-white/15 transition-all group cursor-pointer block"
                        >
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors leading-snug mb-2">
                                    {item.title}
                                </h3>
                                {item.description && (
                                    <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>
                                )}
                            </div>
                            <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-shrink-0">
                                <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 font-f1 whitespace-nowrap">
                                    {item.source}
                                </span>
                                <span className="text-xs font-mono text-slate-600">
                                    {item.pubDate ? formatTimeAgo(item.pubDate) : ""}
                                </span>
                            </div>
                        </motion.a>
                    )) : (
                        <div className="text-center py-20 text-slate-500 font-mono uppercase tracking-widest">
                            No news available right now. Check back soon.
                        </div>
                    )}
                </div>
            </div>
        </div>
        </PageTransition>
    );
}
